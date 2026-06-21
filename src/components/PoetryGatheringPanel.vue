<script setup lang="ts">
import { computed } from 'vue'
import type { PoetryGathering, GatheringState, GatheringChapterResult } from '@/types'
import { calculateGatheringTotalScore, getChaptersCleared, determineRewardTier, isRewardClaimed, getBestChapterResult } from '@/utils/poetryGathering'

interface Props {
  gatherings: PoetryGathering[]
  gatheringState: GatheringState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startChapter', gatheringId: string, chapterId: string): void
  (e: 'claimReward', gatheringId: string, tier: string): void
  (e: 'archive', gatheringId: string): void
  (e: 'viewRanking', gatheringId: string): void
}>()

const tierLabels: Record<string, string> = {
  bronze: '铜奖',
  silver: '银奖',
  gold: '金奖',
  platinum: '铂金奖'
}

const tierIcons: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎'
}

const tierColors: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2'
}

const statusLabels: Record<string, string> = {
  upcoming: '即将开始',
  active: '进行中',
  settling: '结算中',
  archived: '已归档'
}

const getGatheringScore = (gathering: PoetryGathering): number => {
  const chapterIds = gathering.chapters.map(ch => ch.id)
  return calculateGatheringTotalScore(gathering.id, chapterIds)
}

const getGatheringCleared = (gathering: PoetryGathering): number => {
  return getChaptersCleared(gathering.id)
}

const getChapterStatus = (gathering: PoetryGathering, chapterId: string): 'locked' | 'available' | 'completed' => {
  const results = props.gatheringState.chapterResults[gathering.id] || []
  const hasResult = results.some(r => r.chapterId === chapterId)
  if (hasResult) return 'completed'

  const chapterIndex = gathering.chapters.findIndex(ch => ch.id === chapterId)
  if (chapterIndex === 0) return 'available'

  const prevChapterId = gathering.chapters[chapterIndex - 1].id
  const prevCompleted = results.some(r => r.chapterId === prevChapterId)
  return prevCompleted ? 'available' : 'locked'
}

const getChapterBestScore = (gatheringId: string, chapterId: string): number => {
  const result = getBestChapterResult(gatheringId, chapterId)
  return result ? result.score + result.bonusAdjustment : 0
}

const getCurrentTier = (gathering: PoetryGathering): string | null => {
  const totalScore = getGatheringScore(gathering)
  const cleared = getGatheringCleared(gathering)
  return determineRewardTier(totalScore, cleared, gathering.rewards)
}

const getUnclaimedTiers = (gathering: PoetryGathering): string[] => {
  const totalScore = getGatheringScore(gathering)
  const cleared = getGatheringCleared(gathering)
  const currentTier = determineRewardTier(totalScore, cleared, gathering.rewards)
  if (!currentTier) return []

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tierOrder.indexOf(currentTier)
  return tierOrder.slice(0, currentIndex + 1).filter(t => !isRewardClaimed(gathering.id, t))
}

const getRewardLabel = (reward: { type: string; params: Record<string, any> }): string => {
  switch (reward.type) {
    case 'phrase_unlock': return `解锁「${(reward.params.phraseTexts as string[]).join('」「')}」`
    case 'title_reward': return `称号「${reward.params.title}」`
    case 'score_weight_boost': return `${reward.params.dimension}+${Math.round((reward.params.boost as number) * 100)}%`
    case 'phrase_pool_refresh': return `${reward.params.count}个${reward.params.addCategory}词`
    default: return ''
  }
}

const formatCountdown = (endDate: number): string => {
  const diff = endDate - Date.now()
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days}天${hours}小时`
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  return `${hours}小时${minutes}分钟`
}
</script>

<template>
  <div class="gathering-overlay" @click.self="emit('close')">
    <div class="gathering-panel" @click.stop>
      <div class="panel-header">
        <div class="header-title-row">
          <span class="header-icon">🏮</span>
          <h2 class="panel-title">主题诗会</h2>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="gathering-list">
        <div
          v-for="gathering in gatherings"
          :key="gathering.id"
          class="gathering-card"
          :class="[gathering.status]"
        >
          <div class="gathering-header" :style="{ borderColor: gathering.accentColor + '40' }">
            <div class="gathering-icon-wrap" :style="{ background: gathering.accentColor + '15', borderColor: gathering.accentColor + '30' }">
              <span class="gathering-icon">{{ gathering.icon }}</span>
            </div>
            <div class="gathering-info">
              <div class="gathering-top-row">
                <h3 class="gathering-title">{{ gathering.title }}</h3>
                <span class="gathering-status" :class="[gathering.status]" :style="{ color: gathering.status === 'active' ? gathering.accentColor : undefined }">
                  {{ statusLabels[gathering.status] }}
                </span>
              </div>
              <p class="gathering-subtitle">{{ gathering.subtitle }}</p>
              <p class="gathering-desc">{{ gathering.description }}</p>
              <div v-if="gathering.status === 'active'" class="gathering-countdown">
                <span class="countdown-label">剩余</span>
                <span class="countdown-value">{{ formatCountdown(gathering.endDate) }}</span>
              </div>
            </div>
          </div>

          <div v-if="gathering.status === 'active' || gathering.status === 'settling'" class="gathering-chapters">
            <div class="chapters-label">章节进度</div>
            <div class="chapter-list">
              <div
                v-for="(chapter, cIdx) in gathering.chapters"
                :key="chapter.id"
                class="chapter-item"
                :class="[getChapterStatus(gathering, chapter.id)]"
              >
                <div class="chapter-sequence">
                  <div class="sequence-dot" :class="{ active: getChapterStatus(gathering, chapter.id) !== 'locked' }">{{ cIdx + 1 }}</div>
                  <div v-if="cIdx < gathering.chapters.length - 1" class="sequence-line" :class="{ filled: getChapterStatus(gathering, chapter.id) === 'completed' }"></div>
                </div>
                <div class="chapter-content">
                  <div class="chapter-title-row">
                    <span class="chapter-title">{{ chapter.title }}</span>
                    <span v-if="getChapterStatus(gathering, chapter.id) === 'completed'" class="chapter-score" :style="{ color: gathering.accentColor }">
                      {{ getChapterBestScore(gathering.id, chapter.id) }}分
                    </span>
                  </div>
                  <p class="chapter-desc">{{ chapter.description }}</p>
                  <div class="chapter-meta">
                    <span class="meta-tag">⏱ {{ chapter.timeLimitSeconds / 60 }}分钟</span>
                    <span class="meta-tag">✎ {{ chapter.targetPhraseCount }}词</span>
                    <span class="meta-tag">🎯 {{ chapter.requiredKeywords.join('、') }}</span>
                  </div>
                  <div v-if="chapter.bonusRules.length > 0" class="bonus-rules">
                    <span v-for="rule in chapter.bonusRules" :key="rule.label" class="bonus-tag" :style="{ borderColor: gathering.accentColor + '30', color: gathering.accentColor }">
                      {{ rule.label }} +{{ rule.bonus }}
                    </span>
                  </div>
                  <button
                    v-if="getChapterStatus(gathering, chapter.id) === 'available'"
                    class="start-chapter-btn"
                    :style="{ background: `linear-gradient(135deg, ${gathering.accentColor}, ${gathering.accentColor}cc)`, color: '#1a1a2e' }"
                    @click="emit('startChapter', gathering.id, chapter.id)"
                  >
                    开始创作
                  </button>
                  <button
                    v-if="getChapterStatus(gathering, chapter.id) === 'completed'"
                    class="retry-chapter-btn"
                    :style="{ borderColor: gathering.accentColor + '40', color: gathering.accentColor }"
                    @click="emit('startChapter', gathering.id, chapter.id)"
                  >
                    重新挑战
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="gathering.status === 'active' || gathering.status === 'settling'" class="gathering-rewards">
            <div class="rewards-label">奖励解锁</div>
            <div class="reward-tiers">
              <div
                v-for="reward in gathering.rewards"
                :key="reward.tier"
                class="reward-tier"
                :class="{ achieved: getCurrentTier(gathering) && ['bronze','silver','gold','platinum'].indexOf(reward.tier) <= ['bronze','silver','gold','platinum'].indexOf(getCurrentTier(gathering)!) }"
              >
                <div class="tier-header" :style="{ borderColor: tierColors[reward.tier] + '40' }">
                  <span class="tier-icon">{{ tierIcons[reward.tier] }}</span>
                  <span class="tier-name" :style="{ color: tierColors[reward.tier] }">{{ tierLabels[reward.tier] }}</span>
                  <span class="tier-requirement">{{ reward.minScore }}分 / {{ reward.minChaptersCleared }}章</span>
                </div>
                <div class="tier-rewards">
                  <span v-for="(item, iIdx) in reward.rewards" :key="iIdx" class="tier-reward-item">{{ getRewardLabel(item) }}</span>
                </div>
              </div>
            </div>

            <div v-if="getUnclaimedTiers(gathering).length > 0" class="claim-section">
              <div v-for="tier in getUnclaimedTiers(gathering)" :key="tier" class="claim-row">
                <span class="claim-tier" :style="{ color: tierColors[tier] }">{{ tierIcons[tier] }} {{ tierLabels[tier] }}可领取</span>
                <button
                  class="claim-btn"
                  :style="{ background: `linear-gradient(135deg, ${tierColors[tier]}, ${tierColors[tier]}cc)`, color: '#1a1a2e' }"
                  @click="emit('claimReward', gathering.id, tier)"
                >
                  领取奖励
                </button>
              </div>
            </div>
          </div>

          <div v-if="gathering.status === 'active'" class="gathering-footer">
            <div class="total-score">
              <span class="score-label">总分</span>
              <span class="score-value" :style="{ color: gathering.accentColor }">{{ getGatheringScore(gathering) }}</span>
              <span class="score-detail">({{ getGatheringCleared(gathering) }}/{{ gathering.chapters.length }}章)</span>
            </div>
            <button class="archive-btn" @click="emit('archive', gathering.id)">
              📜 归档作品
            </button>
          </div>
        </div>

        <div v-if="gatherings.length === 0" class="empty-gathering">
          <div class="empty-icon">🏮</div>
          <div class="empty-text">暂无主题诗会，敬请期待</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gathering-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.gathering-panel {
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.gathering-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gathering-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.gathering-card.archived {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.gathering-header {
  padding: 18px;
  display: flex;
  gap: 14px;
  border-bottom: 1px solid var(--border);
}

.gathering-icon-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gathering-icon {
  font-size: 24px;
}

.gathering-info {
  flex: 1;
  min-width: 0;
}

.gathering-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.gathering-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.gathering-status {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.gathering-status.active {
  background: rgba(201, 168, 108, 0.15);
  animation: pulse-soft 2s ease-in-out infinite;
}

.gathering-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-style: italic;
}

.gathering-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.gathering-countdown {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.countdown-label {
  font-size: 11px;
  color: var(--text-muted);
}

.countdown-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.gathering-chapters {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.chapters-label,
.rewards-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-bottom: 12px;
  font-weight: 500;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.chapter-item {
  display: flex;
  gap: 12px;
}

.chapter-item.locked {
  opacity: 0.4;
}

.chapter-sequence {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 24px;
}

.sequence-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.sequence-dot.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.sequence-line {
  width: 2px;
  height: 20px;
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.3s ease;
}

.sequence-line.filled {
  background: rgba(201, 168, 108, 0.3);
}

.chapter-content {
  flex: 1;
  padding-bottom: 16px;
}

.chapter-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chapter-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.chapter-score {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.chapter-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.chapter-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-tag {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.bonus-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.bonus-tag {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 11px;
}

.start-chapter-btn,
.retry-chapter-btn {
  padding: 7px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-family: var(--font-serif);
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-chapter-btn {
  background: transparent;
  border: 1px solid;
}

.start-chapter-btn:hover,
.retry-chapter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gathering-rewards {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.reward-tiers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reward-tier {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.reward-tier.achieved {
  background: rgba(201, 168, 108, 0.05);
  border-color: rgba(201, 168, 108, 0.15);
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid;
}

.tier-icon {
  font-size: 16px;
}

.tier-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}

.tier-requirement {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}

.tier-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tier-reward-item {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.claim-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.claim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 10px;
}

.claim-tier {
  font-size: 13px;
  font-weight: 500;
}

.claim-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-serif);
  font-weight: 600;
  transition: all 0.2s ease;
}

.claim-btn:hover {
  transform: translateY(-1px);
}

.gathering-footer {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-score {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.score-label {
  font-size: 12px;
  color: var(--text-muted);
}

.score-value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-serif);
}

.score-detail {
  font-size: 12px;
  color: var(--text-muted);
}

.archive-btn {
  padding: 7px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-family: var(--font-serif);
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.archive-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.empty-gathering {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-muted);
  font-size: 14px;
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
