<script setup lang="ts">
import { computed } from 'vue'
import type { PoetryGathering, GatheringRankEntry, GatheringChapterResult } from '@/types'
import { buildGatheringRanking, getRankLabel, getRankColor, getRankIcon, formatTime, determineRewardTier } from '@/utils/poetryGathering'

interface Props {
  gathering: PoetryGathering
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const ranking = computed<GatheringRankEntry>(() => {
  return buildGatheringRanking(props.gathering)
})

const currentTier = computed(() => {
  return determineRewardTier(ranking.value.totalScore, ranking.value.chaptersCleared, props.gathering.rewards)
})

const chapterDetails = computed(() => {
  return props.gathering.chapters.map(ch => {
    const result = ranking.value.bestChapterResults[ch.id]
    return {
      chapter: ch,
      result,
      completed: !!result,
      totalScore: result ? result.score + result.bonusAdjustment : 0
    }
  })
})

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
</script>

<template>
  <div class="ranking-overlay" @click.self="emit('close')">
    <div class="ranking-panel" @click.stop>
      <div class="panel-header" :style="{ borderColor: gathering.accentColor + '30' }">
        <div class="header-left">
          <span class="gathering-icon">{{ gathering.icon }}</span>
          <div class="header-info">
            <h2 class="panel-title">{{ gathering.title }}</h2>
            <span class="panel-subtitle">结算排行</span>
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="ranking-body">
        <div class="rank-hero" :style="{ borderColor: getRankColor(ranking.rank) + '40' }">
          <div class="rank-icon-wrap" :style="{ background: getRankColor(ranking.rank) + '15' }">
            <span class="rank-icon" :style="{ color: getRankColor(ranking.rank) }">{{ getRankIcon(ranking.rank) }}</span>
          </div>
          <div class="rank-info">
            <div class="rank-label" :style="{ color: getRankColor(ranking.rank) }">{{ getRankLabel(ranking.rank) }}</div>
            <div class="rank-score">
              <span class="score-number" :style="{ color: gathering.accentColor }">{{ ranking.totalScore }}</span>
              <span class="score-unit">分</span>
            </div>
            <div class="rank-progress">
              {{ ranking.chaptersCleared }} / {{ gathering.chapters.length }} 章完成
            </div>
          </div>
        </div>

        <div v-if="currentTier" class="tier-achieved" :style="{ borderColor: getRankColor(ranking.rank) + '20', background: getRankColor(ranking.rank) + '08' }">
          <span class="tier-icon">{{ tierIcons[currentTier] }}</span>
          <span class="tier-text">已达成{{ tierLabels[currentTier] }}等级</span>
        </div>

        <div class="chapter-results">
          <div class="results-label">章节详情</div>
          <div class="results-list">
            <div
              v-for="detail in chapterDetails"
              :key="detail.chapter.id"
              class="result-item"
              :class="{ completed: detail.completed, pending: !detail.completed }"
            >
              <div class="result-status">
                <span class="status-dot" :class="{ done: detail.completed }">
                  {{ detail.completed ? '✓' : '○' }}
                </span>
              </div>
              <div class="result-content">
                <div class="result-title-row">
                  <span class="result-title">{{ detail.chapter.title }}</span>
                  <span v-if="detail.completed" class="result-score" :style="{ color: gathering.accentColor }">
                    {{ detail.totalScore }}分
                  </span>
                  <span v-else class="result-pending-label">未完成</span>
                </div>
                <div v-if="detail.result" class="result-detail">
                  <span class="detail-tag">基础 {{ detail.result.score }}</span>
                  <span v-if="detail.result.bonusAdjustment > 0" class="detail-tag bonus">加成 +{{ detail.result.bonusAdjustment }}</span>
                  <span class="detail-tag">用时 {{ formatTime(detail.result.timeUsedSeconds) }}</span>
                  <span v-if="detail.result.triggeredBonuses.length > 0" class="detail-tag bonus-labels">
                    ✦ {{ detail.result.triggeredBonuses.join('、') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rewards-overview">
          <div class="rewards-label">奖励等级</div>
          <div class="reward-tier-list">
            <div
              v-for="reward in gathering.rewards"
              :key="reward.tier"
              class="reward-tier-item"
              :class="{ achieved: currentTier && ['bronze','silver','gold','platinum'].indexOf(reward.tier) <= ['bronze','silver','gold','platinum'].indexOf(currentTier) }"
            >
              <span class="rt-icon">{{ tierIcons[reward.tier] }}</span>
              <span class="rt-name">{{ tierLabels[reward.tier] }}</span>
              <span class="rt-req">{{ reward.minScore }}分 / {{ reward.minChaptersCleared }}章</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.ranking-panel {
  width: 100%;
  max-width: 520px;
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
  border-bottom: 1px solid;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gathering-icon {
  font-size: 28px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin: 0;
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
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

.ranking-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rank-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid;
}

.rank-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-icon {
  font-size: 32px;
}

.rank-info {
  flex: 1;
}

.rank-label {
  font-family: var(--font-brush);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 3px;
  margin-bottom: 4px;
}

.rank-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.score-number {
  font-size: 36px;
  font-weight: 700;
  font-family: var(--font-serif);
  line-height: 1;
}

.score-unit {
  font-size: 14px;
  color: var(--text-muted);
}

.rank-progress {
  font-size: 12px;
  color: var(--text-muted);
}

.tier-achieved {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid;
}

.tier-icon {
  font-size: 18px;
}

.tier-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.chapter-results,
.rewards-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.results-label,
.rewards-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
  font-weight: 500;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.result-item.pending {
  opacity: 0.5;
}

.result-status {
  flex-shrink: 0;
  padding-top: 2px;
}

.status-dot {
  font-size: 14px;
  color: var(--text-muted);
}

.status-dot.done {
  color: #6b8e6b;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.result-score {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.result-pending-label {
  font-size: 12px;
  color: var(--text-muted);
}

.result-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.detail-tag.bonus {
  background: rgba(201, 168, 108, 0.1);
  color: var(--accent-gold);
}

.detail-tag.bonus-labels {
  background: rgba(107, 142, 107, 0.08);
  color: #8ab88a;
}

.reward-tier-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-tier-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.reward-tier-item.achieved {
  background: rgba(201, 168, 108, 0.06);
  color: var(--text-secondary);
}

.rt-icon {
  font-size: 16px;
}

.rt-name {
  font-weight: 500;
  letter-spacing: 1px;
  min-width: 48px;
}

.rt-req {
  font-size: 11px;
  margin-left: auto;
  opacity: 0.7;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
