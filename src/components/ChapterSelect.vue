<script setup lang="ts">
import { computed } from 'vue'
import type { Chapter, ChapterProgress, QuestState, SideQuest, RareChapter, PoetrySocietyState } from '@/types'
import { getScoreGrade } from '@/utils/scoring'
import { isRareChapter } from '@/data/chapters'
import { REPUTATION_RANK_ICONS } from '@/types'

interface Props {
  chapters: Chapter[]
  unlockedIds: string[]
  currentId: string
  chapterProgress: Record<string, ChapterProgress>
  questState: QuestState
  sideQuests: SideQuest[]
  societyState?: PoetrySocietyState | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', chapterId: string): void
  (e: 'close'): void
}>()

const getStarRating = (bestScore: number): number => {
  if (bestScore >= 90) return 3
  if (bestScore >= 75) return 2
  if (bestScore >= 60) return 1
  return 0
}

const getStarLabel = (rating: number): string => {
  if (rating === 3) return '臻于化境'
  if (rating === 2) return '妙笔生花'
  if (rating === 1) return '初窥门径'
  return '待挑战'
}

const trajectoryItems = computed(() => {
  return props.chapters.map((ch, idx) => {
    const progress = props.chapterProgress[ch.id]
    const bestScore = progress?.bestScore || 0
    const starRating = getStarRating(bestScore)
    const isUnlocked = props.unlockedIds.includes(ch.id)
    const isCompleted = bestScore >= 60
    const isCurrent = ch.id === props.currentId
    const rare = isRareChapter(ch) ? ch as RareChapter : null
    const chapterQuests = props.sideQuests.filter(q => q.chapterId === ch.id)
    const unlockedChapterQuests = chapterQuests.filter(q => props.questState.unlockedQuests.includes(q.id))
    const completedQuests = unlockedChapterQuests.filter(q => props.questState.completedQuests.includes(q.id))
    const pendingQuests = unlockedChapterQuests.filter(q => !props.questState.claimedRewards.includes(q.id))
    const hasUnclaimed = unlockedChapterQuests.some(q =>
      props.questState.completedQuests.includes(q.id) && !props.questState.claimedRewards.includes(q.id)
    )
    const rewardPhrases: string[] = []
    const seenPhrases = new Set<string>()
    pendingQuests.forEach(q => {
      q.rewards.forEach(r => {
        if (r.type === 'phrase_unlock' && r.params.phraseTexts) {
          (r.params.phraseTexts as string[]).forEach(text => {
            if (!seenPhrases.has(text)) {
              seenPhrases.add(text)
              rewardPhrases.push(text)
            }
          })
        }
      })
    })
    const lockedQuestCount = chapterQuests.length - unlockedChapterQuests.length
    const lockedRewardCount = chapterQuests
      .filter(q => !props.questState.unlockedQuests.includes(q.id))
      .reduce((sum, q) => {
        return sum + q.rewards.filter(r => r.type === 'phrase_unlock').length
      }, 0)

    return {
      chapter: ch,
      index: idx,
      isUnlocked,
      isCompleted,
      isCurrent,
      bestScore,
      starRating,
      compositionCount: progress?.compositionCount || 0,
      completedQuestCount: completedQuests.length,
      unlockedQuestCount: unlockedChapterQuests.length,
      totalQuestCount: chapterQuests.length,
      hasUnclaimed,
      rewardPhrases: rewardPhrases.slice(0, 4),
      totalRewardCount: rewardPhrases.length,
      lockedQuestCount,
      lockedRewardCount,
      isRare: !!rare,
      rarity: rare?.rarity || null,
      requiredRank: rare?.requiredRank || null,
      requiredReputation: rare?.requiredReputation || null,
      currentReputation: props.societyState?.reputation || 0,
      currentRank: props.societyState?.currentRank || null,
      rankIcon: rare ? REPUTATION_RANK_ICONS[rare.requiredRank] : null
    }
  })
})

const overallStats = computed(() => {
  let completedCount = 0
  let totalStars = 0
  let totalCompositions = 0
  props.chapters.forEach(ch => {
    const progress = props.chapterProgress[ch.id]
    const bestScore = progress?.bestScore || 0
    if (bestScore >= 60) completedCount++
    totalStars += getStarRating(bestScore)
    totalCompositions += progress?.compositionCount || 0
  })
  return { completedCount, totalStars, maxStars: props.chapters.length * 3, totalCompositions }
})
</script>

<template>
  <div class="chapters-overlay" @click.self="emit('close')">
    <div class="chapters-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-header-left">
          <h2 class="panel-title">章节</h2>
          <div class="overall-badge">
            <span class="badge-stars">✦ {{ overallStats.totalStars }}/{{ overallStats.maxStars }}</span>
            <span class="badge-done">{{ overallStats.completedCount }}/{{ chapters.length }} 通关</span>
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="trajectory-track">
        <div
          v-for="(item, idx) in trajectoryItems"
          :key="'t-' + item.chapter.id"
          class="trajectory-node"
          :class="{
            completed: item.isCompleted,
            current: item.isCurrent,
            locked: !item.isUnlocked,
            unlocked: item.isUnlocked && !item.isCompleted,
            rare: item.isRare,
            epic: item.rarity === 'epic',
            legendary: item.rarity === 'legendary'
          }"
        >
          <div class="node-dot" :style="item.isUnlocked ? { borderColor: item.chapter.accentColor } : {}">
            <span v-if="item.isCompleted" class="node-check">✓</span>
            <span v-else-if="item.isRare && item.isUnlocked" class="node-rare-icon">{{ item.rarity === 'legendary' ? '✦' : '◆' }}</span>
            <span v-else-if="item.isUnlocked" class="node-num">{{ idx + 1 }}</span>
            <span v-else class="node-lock-icon">{{ item.isRare ? '🔮' : '🔒' }}</span>
          </div>
          <div v-if="idx < trajectoryItems.length - 1" class="trajectory-line" :class="{ filled: item.isCompleted, rare: item.isRare }"></div>
        </div>
      </div>

      <div class="chapters-list">
        <div
          v-for="(item, idx) in trajectoryItems"
          :key="item.chapter.id"
          class="chapter-card"
          :class="{
            active: item.isCurrent,
            locked: !item.isUnlocked,
            completed: item.isCompleted,
            rare: item.isRare,
            epic: item.rarity === 'epic',
            legendary: item.rarity === 'legendary'
          }"
          @click="item.isUnlocked && emit('select', item.chapter.id)"
        >
          <div class="card-bg" :style="{ background: item.chapter.backgroundGradient }"></div>
          <div class="card-lock" v-if="!item.isUnlocked">
            <span class="lock-icon">{{ item.isRare ? '🔮' : '🔒' }}</span>
            <span class="lock-text">{{ item.isRare ? '诗社秘卷' : '未解锁' }}</span>
            <div v-if="item.isRare && item.requiredRank" class="lock-requirement">
              <span class="req-icon">{{ item.rankIcon }}</span>
              <span class="req-text">{{ item.requiredRank }}</span>
              <span class="req-rep">{{ item.currentReputation }}/{{ item.requiredReputation }} 声望</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-top">
              <div class="card-subtitle" :style="{ color: item.chapter.accentColor }">
                {{ item.chapter.subtitle }}
                <span v-if="item.isRare" class="rare-badge" :class="item.rarity">
                  {{ item.rarity === 'legendary' ? '传说' : '史诗' }}
                </span>
              </div>
              <div class="card-stars">
                <span
                  v-for="s in 3"
                  :key="s"
                  class="star"
                  :class="{ filled: s <= item.starRating, dim: s > item.starRating }"
                >★</span>
              </div>
            </div>
            <h3 class="card-title">{{ item.chapter.title }}</h3>
            <p class="card-desc">{{ item.chapter.description }}</p>

            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">目标</span>
                <span class="stat-value">{{ item.chapter.targetPhraseCount }} 词</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最佳</span>
                <span class="stat-value best" :class="{ scored: item.bestScore > 0 }">
                  {{ item.bestScore > 0 ? item.bestScore + ' 分' : '--' }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">作品</span>
                <span class="stat-value">{{ item.compositionCount }} 首</span>
              </div>
            </div>

            <div v-if="item.bestScore >= 60" class="card-grade">
              <span class="grade-badge" :style="{ color: getScoreGrade(item.bestScore).color, borderColor: getScoreGrade(item.bestScore).color }">
                {{ getScoreGrade(item.bestScore).grade }}
              </span>
              <span class="star-label" :style="{ color: item.chapter.accentColor }">{{ getStarLabel(item.starRating) }}</span>
            </div>

            <div class="card-bottom">
              <span class="card-theme" :style="{ color: item.chapter.accentColor }">#{{ item.chapter.theme }}</span>
              <div class="card-quests" v-if="item.totalQuestCount > 0">
                <span class="quest-progress" :class="{ unclaimed: item.hasUnclaimed }">
                  {{ item.completedQuestCount }}/{{ item.unlockedQuestCount }} 支线
                  <span v-if="item.lockedQuestCount > 0" class="quest-locked">+{{ item.lockedQuestCount }} 未解锁</span>
                </span>
              </div>
            </div>

            <div v-if="(item.rewardPhrases.length > 0 || item.lockedRewardCount > 0) && item.isUnlocked" class="card-rewards">
              <span class="rewards-label">可得</span>
              <div class="rewards-tags">
                <span v-for="rp in item.rewardPhrases" :key="rp" class="reward-tag">{{ rp }}</span>
                <span v-if="item.totalRewardCount > 4" class="reward-more">+{{ item.totalRewardCount - 4 }}</span>
                <span v-if="item.lockedRewardCount > 0 && item.rewardPhrases.length === 0" class="reward-tag locked">支线解锁后可见</span>
                <span v-else-if="item.lockedRewardCount > 0" class="reward-more locked">+{{ item.lockedRewardCount }} 待解锁</span>
                <span v-if="item.rewardPhrases.length === 0 && item.lockedRewardCount === 0" class="reward-tag claimed">全部奖励已领取</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapters-overlay {
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

.chapters-panel {
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
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

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.overall-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-stars {
  font-size: 12px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.badge-done {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 10px;
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

.trajectory-track {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  overflow-x: auto;
  gap: 0;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

.trajectory-node {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.node-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.trajectory-node.completed .node-dot {
  background: rgba(107, 142, 107, 0.2);
  border-color: #6b8e6b;
}

.trajectory-node.current .node-dot {
  box-shadow: 0 0 12px rgba(201, 168, 108, 0.4);
  border-width: 2px;
}

.trajectory-node.locked .node-dot {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.03);
}

.node-check {
  color: #6b8e6b;
  font-weight: 600;
  font-size: 16px;
}

.node-num {
  color: var(--text-secondary);
  font-family: var(--font-serif);
  font-weight: 500;
}

.node-lock-icon {
  font-size: 12px;
  opacity: 0.6;
}

.trajectory-line {
  width: 48px;
  height: 2px;
  background: var(--border);
  transition: background 0.3s ease;
  margin: 0 2px;
}

.trajectory-line.filled {
  background: #6b8e6b;
}

.chapters-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chapter-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chapter-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.chapter-card.active {
  box-shadow: 0 0 0 2px var(--accent-gold);
}

.chapter-card.locked {
  cursor: not-allowed;
}

.card-bg {
  position: absolute;
  inset: 0;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.chapter-card.locked .card-bg {
  opacity: 0.3;
  filter: grayscale(0.6) brightness(0.6);
}

.card-lock {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  gap: 8px;
}

.lock-icon {
  font-size: 32px;
}

.lock-text {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 20px 24px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-subtitle {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
}

.card-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 16px;
  transition: all 0.3s ease;
}

.star.filled {
  color: var(--accent-gold);
  text-shadow: 0 0 6px rgba(201, 168, 108, 0.4);
}

.star.dim {
  color: rgba(255, 255, 255, 0.12);
}

.card-title {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.stat-value.best {
  color: var(--text-muted);
}

.stat-value.best.scored {
  color: var(--accent-gold);
  font-weight: 500;
}

.card-grade {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.grade-badge {
  font-size: 12px;
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 12px;
  font-family: var(--font-brush);
  letter-spacing: 2px;
}

.star-label {
  font-size: 11px;
  letter-spacing: 1px;
  opacity: 0.8;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-theme {
  font-size: 12px;
  letter-spacing: 1px;
}

.card-quests {
  display: flex;
  align-items: center;
}

.quest-progress {
  font-size: 11px;
  color: var(--text-muted);
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.quest-progress.unclaimed {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.quest-locked {
  font-size: 9px;
  color: var(--text-muted);
  margin-left: 4px;
  opacity: 0.8;
}

.card-rewards {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.rewards-label {
  font-size: 10px;
  color: var(--text-muted);
  flex-shrink: 0;
  padding-top: 3px;
  letter-spacing: 1px;
}

.rewards-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.reward-tag {
  font-size: 10px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid rgba(201, 168, 108, 0.15);
  font-family: var(--font-serif);
}

.reward-tag.locked {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.reward-tag.claimed {
  color: #6b8e6b;
  background: rgba(107, 142, 107, 0.08);
  border-color: rgba(107, 142, 107, 0.2);
}

.reward-more {
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 6px;
}

.reward-more.locked {
  color: var(--text-muted);
  opacity: 0.7;
}

.trajectory-node.epic .node-dot {
  box-shadow: 0 0 10px rgba(124, 169, 124, 0.4);
}

.trajectory-node.legendary .node-dot {
  box-shadow: 0 0 15px rgba(155, 89, 182, 0.6);
  animation: legendaryPulse 2s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 15px rgba(155, 89, 182, 0.6); }
  50% { box-shadow: 0 0 25px rgba(155, 89, 182, 0.9); }
}

.trajectory-line.rare {
  background: linear-gradient(90deg, rgba(124, 169, 124, 0.3), rgba(155, 89, 182, 0.3));
}

.trajectory-line.rare.filled {
  background: linear-gradient(90deg, #7ca97c, #9b59b6);
}

.node-rare-icon {
  font-size: 14px;
  font-weight: 700;
}

.trajectory-node.epic .node-rare-icon {
  color: #7ca97c;
}

.trajectory-node.legendary .node-rare-icon {
  color: #9b59b6;
}

.chapter-card.epic {
  border: 1px solid rgba(124, 169, 124, 0.3);
}

.chapter-card.legendary {
  border: 1px solid rgba(155, 89, 182, 0.4);
  animation: legendaryGlow 3s ease-in-out infinite;
}

@keyframes legendaryGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(155, 89, 182, 0.2); }
  50% { box-shadow: 0 0 40px rgba(155, 89, 182, 0.4); }
}

.chapter-card.epic:hover:not(.locked) {
  box-shadow: 0 8px 32px rgba(124, 169, 124, 0.3);
}

.chapter-card.legendary:hover:not(.locked) {
  box-shadow: 0 8px 40px rgba(155, 89, 182, 0.5);
}

.rare-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 10px;
  border-radius: 8px;
  font-family: var(--font-serif);
  letter-spacing: 1px;
  vertical-align: middle;
}

.rare-badge.epic {
  background: rgba(124, 169, 124, 0.15);
  color: #7ca97c;
  border: 1px solid rgba(124, 169, 124, 0.3);
}

.rare-badge.legendary {
  background: rgba(155, 89, 182, 0.15);
  color: #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.4);
  animation: badgeShimmer 2s ease-in-out infinite;
}

@keyframes badgeShimmer {
  0%, 100% { background: rgba(155, 89, 182, 0.15); }
  50% { background: rgba(155, 89, 182, 0.25); }
}

.lock-requirement {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.req-icon {
  font-size: 16px;
}

.req-text {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-brush);
  letter-spacing: 2px;
}

.req-rep {
  font-size: 10px;
  color: var(--accent-gold);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .chapters-panel {
    max-height: 92vh;
  }

  .card-content {
    padding: 16px 18px;
  }

  .card-title {
    font-size: 22px;
  }

  .trajectory-line {
    width: 28px;
  }

  .node-dot {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
}
</style>
