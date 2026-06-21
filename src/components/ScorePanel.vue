<script setup lang="ts">
import { computed } from 'vue'
import type { ScoreBreakdown } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

interface Props {
  score: ScoreBreakdown
  phrasesCount: number
  targetCount: number
}

const props = defineProps<Props>()

const grade = computed(() => getScoreGrade(props.score.total))

const bars = computed(() => [
  { label: '连贯性', value: props.score.coherence, color: '#5b7a8c' },
  { label: '意象', value: props.score.imagery, color: '#7a5b8c' },
  { label: '韵律', value: props.score.rhythm, color: '#c9a86c' },
  { label: '契合', value: props.score.themeMatch, color: '#8b4557' },
])
</script>

<template>
  <div class="score-panel">
    <div class="score-header">
      <div class="score-total">
        <span class="score-number" :style="{ color: grade.color }">{{ score.total }}</span>
        <span class="score-label">分</span>
      </div>
      <div class="score-grade" :style="{ color: grade.color, borderColor: grade.color }">
        {{ grade.grade }}
      </div>
    </div>
    
    <div class="progress-track">
      <div class="progress-info">
        <span>已选 {{ phrasesCount }} / {{ targetCount }}</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ 
            width: `${Math.min(phrasesCount / targetCount * 100, 100)}%`,
            background: grade.color
          }"
        ></div>
      </div>
    </div>
    
    <div class="score-bars">
      <div v-for="bar in bars" :key="bar.label" class="score-bar-item">
        <div class="bar-label">
          <span class="bar-name">{{ bar.label }}</span>
          <span class="bar-value" :style="{ color: bar.color }">{{ bar.value }}</span>
        </div>
        <div class="bar-track">
          <div 
            class="bar-fill" 
            :style="{ width: `${bar.value}%`, background: bar.color }"
          ></div>
        </div>
      </div>
    </div>
    
    <div v-if="score.total > 0" class="score-comment">
      <span class="comment-icon">「</span>
      <span class="comment-text">{{ grade.comment }}</span>
      <span class="comment-icon">」</span>
    </div>
  </div>
</template>

<style scoped>
.score-panel {
  padding: 20px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.score-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-number {
  font-size: 42px;
  font-weight: 600;
  font-family: var(--font-serif);
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: var(--text-muted);
}

.score-grade {
  padding: 6px 16px;
  border: 1px solid;
  border-radius: 20px;
  font-size: 14px;
  font-family: var(--font-brush);
  letter-spacing: 2px;
}

.progress-track {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.score-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.bar-name {
  color: var(--text-secondary);
}

.bar-value {
  font-weight: 500;
}

.bar-track {
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.score-comment {
  text-align: center;
  padding: 12px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 8px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  animation: fadeIn 0.5s ease;
}

.comment-icon {
  color: var(--accent-gold);
  font-family: var(--font-brush);
  font-size: 16px;
  margin: 0 4px;
}
</style>
