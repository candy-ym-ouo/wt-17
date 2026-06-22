<script setup lang="ts">
import { computed } from 'vue'
import type { TrialSettlementResult, TrialRareImagery, TrialTitle, TrialSpectra } from '@/types'

interface Props {
  result: TrialSettlementResult
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
  (e: 'back'): void
}>()

const rarityLabels: Record<string, string> = {
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

const rarityColors: Record<string, string> = {
  rare: '#5b9ea8',
  epic: '#a87ac9',
  legendary: '#c9a86c'
}

const gradeColors: Record<string, string> = {
  '神品': '#ffd700',
  '妙品': '#a87ac9',
  '佳品': '#5b9ea8',
  '能品': '#7ca97c',
  '习作': '#888'
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

const hasRewards = computed(() => {
  return props.result.earnedImageries.length > 0 || 
         props.result.earnedTitles.length > 0 || 
         props.result.earnedSpectra.length > 0 ||
         props.result.unlockedPhrases.length > 0
})
</script>

<template>
  <div class="trial-settlement-overlay" @click.self="emit('close')">
    <div class="trial-settlement-panel">
      <div class="settlement-header">
        <div class="header-decoration left">◆</div>
        <h2 class="settlement-title">试炼结算</h2>
        <div class="header-decoration right">◆</div>
      </div>

      <div class="theme-name">{{ result.themeName }}</div>

      <div class="score-display">
        <div class="score-ring">
          <svg class="score-circle" viewBox="0 0 120 120">
            <circle
              class="score-bg"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="8"
            />
            <circle
              class="score-fill"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              :stroke="gradeColors[result.scoreGrade]"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="`${result.finalScore * 3.265} 326.5`"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="score-content">
            <span class="score-number">{{ Math.round(result.finalScore) }}</span>
            <span class="score-grade" :style="{ color: gradeColors[result.scoreGrade] }">{{ result.scoreGrade }}</span>
          </div>
        </div>

        <div class="stars-display">
          <span 
            v-for="i in 3" 
            :key="i" 
            class="star"
            :class="{ filled: i <= result.stars }"
          >
            ★
          </span>
        </div>

        <div v-if="result.isFirstClear" class="first-clear-badge">
          <span>🎉 首次通关</span>
        </div>
        <div v-else-if="result.isNewRecord" class="new-record-badge">
          <span>🏆 新纪录</span>
        </div>
      </div>

      <div class="score-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-label">基础得分</span>
          <span class="breakdown-value">{{ Math.round(result.score) }}</span>
        </div>
        <template v-for="bonus in result.triggeredBonuses" :key="bonus.type">
          <div v-if="bonus.bonus > 0" class="breakdown-item bonus">
            <span class="breakdown-label">{{ bonus.label }}</span>
            <span class="breakdown-value">+{{ bonus.bonus }}</span>
          </div>
          <div v-if="bonus.multiplier && bonus.multiplier > 1" class="breakdown-item multiplier">
            <span class="breakdown-label">{{ bonus.label }}</span>
            <span class="breakdown-value">×{{ bonus.multiplier.toFixed(2) }}</span>
          </div>
        </template>
        <div v-if="result.scoreMultiplier > 1" class="breakdown-item before-multiplier">
          <span class="breakdown-label">倍率前得分</span>
          <span class="breakdown-value">{{ Math.round(result.scoreBeforeMultiplier) }}</span>
        </div>
        <div v-if="result.scoreMultiplier > 1" class="breakdown-item total-multiplier">
          <span class="breakdown-label">总积分倍率</span>
          <span class="breakdown-value">×{{ result.scoreMultiplier.toFixed(2) }}</span>
        </div>
        <div class="breakdown-item total">
          <span class="breakdown-label">最终得分</span>
          <span class="breakdown-value">{{ Math.round(result.finalScore) }}</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-label">用时</span>
          <span class="breakdown-value">{{ formatTime(result.timeUsedSeconds) }}</span>
        </div>
      </div>

      <div v-if="hasRewards" class="rewards-section">
        <h3 class="rewards-title">🎁 获得奖励</h3>

        <div v-if="result.earnedImageries.length > 0" class="reward-category">
          <span class="category-label">稀有意象</span>
          <div class="reward-items">
            <div 
              v-for="img in result.earnedImageries" 
              :key="img.id"
              class="reward-item imagery"
              :style="{ '--rarity-color': rarityColors[img.rarity] }"
            >
              <span class="reward-icon">{{ img.icon }}</span>
              <span class="reward-name">{{ img.name }}</span>
              <span class="reward-rarity" :style="{ color: rarityColors[img.rarity] }">{{ rarityLabels[img.rarity] }}</span>
            </div>
          </div>
        </div>

        <div v-if="result.earnedTitles.length > 0" class="reward-category">
          <span class="category-label">试炼称号</span>
          <div class="reward-items">
            <div 
              v-for="title in result.earnedTitles" 
              :key="title.id"
              class="reward-item title"
              :style="{ '--rarity-color': rarityColors[title.rarity] }"
            >
              <span class="reward-icon">{{ title.icon }}</span>
              <span class="reward-name">{{ title.name }}</span>
              <span class="reward-rarity" :style="{ color: rarityColors[title.rarity] }">{{ rarityLabels[title.rarity] }}</span>
            </div>
          </div>
        </div>

        <div v-if="result.earnedSpectra.length > 0" class="reward-category">
          <span class="category-label">墨韵谱面</span>
          <div class="reward-items">
            <div 
              v-for="spec in result.earnedSpectra" 
              :key="spec.id"
              class="reward-item spectra"
              :style="{ '--rarity-color': rarityColors[spec.rarity] }"
            >
              <span class="reward-icon">{{ spec.icon }}</span>
              <span class="reward-name">{{ spec.name }}</span>
              <span class="reward-rarity" :style="{ color: rarityColors[spec.rarity] }">{{ rarityLabels[spec.rarity] }}</span>
            </div>
          </div>
        </div>

        <div v-if="result.unlockedPhrases.length > 0" class="reward-category">
          <span class="category-label">解锁词句</span>
          <div class="reward-items">
            <div 
              v-for="phrase in result.unlockedPhrases" 
              :key="phrase"
              class="reward-item phrase"
            >
              <span class="reward-icon">📝</span>
              <span class="reward-name">{{ phrase }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settlement-actions">
        <button class="action-btn secondary" @click="emit('back')">
          返回列表
        </button>
        <button class="action-btn primary" @click="emit('retry')">
          再次挑战
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trial-settlement-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(8px);
}

.trial-settlement-panel {
  width: 90%;
  max-width: 480px;
  background: linear-gradient(135deg, #1a1520 0%, #2d2530 50%, #1f1a2a 100%);
  border-radius: 20px;
  border: 1px solid rgba(201, 168, 108, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(201, 168, 108, 0.1);
  padding: 30px;
  animation: settlementAppear 0.5s ease-out;
}

@keyframes settlementAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.settlement-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.header-decoration {
  color: #c9a86c;
  font-size: 14px;
  opacity: 0.6;
}

.settlement-title {
  font-size: 24px;
  font-weight: 600;
  color: #c9a86c;
  letter-spacing: 4px;
  margin: 0;
}

.theme-name {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-bottom: 24px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.score-ring {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 16px;
}

.score-circle {
  width: 100%;
  height: 100%;
}

.score-fill {
  transition: stroke-dasharray 1s ease-out;
}

.score-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.score-grade {
  font-size: 14px;
  margin-top: 4px;
  font-weight: 500;
}

.stars-display {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.star {
  font-size: 28px;
  color: #333;
  transition: color 0.3s;
}

.star.filled {
  color: #ffd700;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
}

.first-clear-badge,
.new-record-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.first-clear-badge {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.new-record-badge {
  background: linear-gradient(135deg, rgba(168, 122, 201, 0.2), rgba(201, 168, 108, 0.2));
  color: #c9a86c;
  border: 1px solid rgba(201, 168, 108, 0.4);
}

.score-breakdown {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
}

.breakdown-label {
  color: #888;
}

.breakdown-value {
  color: #ccc;
  font-weight: 500;
}

.breakdown-item.bonus .breakdown-value {
  color: #7ca97c;
}

.breakdown-item.multiplier .breakdown-value {
  color: #f5a623;
  font-weight: 700;
}

.breakdown-item.before-multiplier {
  opacity: 0.7;
}

.breakdown-item.total-multiplier {
  background: rgba(245, 166, 35, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 4px 0;
}

.breakdown-item.total-multiplier .breakdown-label {
  color: #f5a623;
  font-weight: 600;
}

.breakdown-item.total-multiplier .breakdown-value {
  color: #f5a623;
  font-size: 18px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(245, 166, 35, 0.4);
}

.breakdown-item.total {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
  padding-top: 12px;
}

.breakdown-item.total .breakdown-label {
  color: #fff;
  font-weight: 600;
}

.breakdown-item.total .breakdown-value {
  color: #c9a86c;
  font-size: 18px;
  font-weight: 700;
}

.rewards-section {
  margin-bottom: 24px;
}

.rewards-title {
  font-size: 16px;
  color: #c9a86c;
  margin: 0 0 16px 0;
  text-align: center;
}

.reward-category {
  margin-bottom: 16px;
}

.category-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.reward-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--rarity-color, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  animation: rewardPop 0.5s ease-out;
}

@keyframes rewardPop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.reward-icon {
  font-size: 20px;
}

.reward-name {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.reward-rarity {
  font-size: 11px;
}

.reward-item.phrase {
  --rarity-color: #7ca97c;
}

.settlement-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.action-btn.primary {
  background: linear-gradient(135deg, #c9a86c, #b8956a);
  color: #1a1a2e;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

@media (max-width: 480px) {
  .trial-settlement-panel {
    padding: 20px;
  }
  
  .settlement-title {
    font-size: 20px;
  }
  
  .score-ring {
    width: 120px;
    height: 120px;
  }
  
  .score-number {
    font-size: 36px;
  }
}
</style>
