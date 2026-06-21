<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { GatheringChapter, Phrase, ScoreBreakdown, PhraseRarity } from '@/types'
import { evaluateBonusRules, formatTime } from '@/utils/poetryGathering'
import { rarityLabels, rarityColors } from '@/data/phrases'

interface Props {
  chapter: GatheringChapter
  gatheringAccentColor: string
  phrases: Phrase[]
  score: ScoreBreakdown
  boardPhrases: Phrase[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'selectPhrase', phrase: Phrase): void
  (e: 'removePhrase', phraseId: string): void
  (e: 'submit', elapsedSeconds: number): void
  (e: 'quit'): void
}>()

const elapsedSeconds = ref(0)
const isRunning = ref(true)
const isTimeUp = ref(false)
let timer: number | null = null

const timeRemaining = computed(() => {
  return Math.max(0, props.chapter.timeLimitSeconds - elapsedSeconds.value)
})

const timeProgress = computed(() => {
  return Math.max(0, 1 - elapsedSeconds.value / props.chapter.timeLimitSeconds)
})

const isTimeLow = computed(() => {
  return timeRemaining.value <= 30 && timeRemaining.value > 0
})

const isTimeCritical = computed(() => {
  return timeRemaining.value <= 10 && timeRemaining.value > 0
})

const bonusResult = computed(() => {
  return evaluateBonusRules(props.boardPhrases, props.chapter.bonusRules, elapsedSeconds.value)
})

const requiredKeywordsMet = computed(() => {
  const boardTexts = new Set(props.boardPhrases.map(p => p.text))
  return props.chapter.requiredKeywords.map(kw => ({
    keyword: kw,
    met: boardTexts.has(kw)
  }))
})

const forbiddenUsed = computed(() => {
  const boardTexts = new Set(props.boardPhrases.map(p => p.text))
  return props.chapter.forbiddenWords.filter(w => boardTexts.has(w))
})

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (isRunning.value) {
      elapsedSeconds.value++
      if (elapsedSeconds.value >= props.chapter.timeLimitSeconds) {
        isTimeUp.value = true
        isRunning.value = false
      }
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
}

const resumeTimer = () => {
  isRunning.value = true
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

watch(isTimeUp, (val) => {
  if (val) {
    emit('submit', elapsedSeconds.value)
  }
})

const getRarityClass = (rarity: PhraseRarity) => {
  return `rarity-${rarity}`
}
</script>

<template>
  <div class="session-container">
    <div class="session-header" :style="{ borderColor: gatheringAccentColor + '30' }">
      <div class="session-top-bar">
        <button class="quit-btn" @click="emit('quit')">✕ 退出</button>
        <div class="session-title">{{ chapter.title }}</div>
        <div class="timer-block" :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }">
          <span class="timer-icon">⏱</span>
          <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
        </div>
      </div>

      <div class="timer-track">
        <div
          class="timer-fill"
          :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }"
          :style="{ width: (timeProgress * 100) + '%' }"
        ></div>
      </div>

      <div class="session-meta">
        <div class="keyword-check">
          <span
            v-for="kw in requiredKeywordsMet"
            :key="kw.keyword"
            class="kw-chip"
            :class="{ met: kw.met }"
            :style="{ borderColor: kw.met ? gatheringAccentColor + '60' : undefined }"
          >
            <span class="kw-icon">{{ kw.met ? '✓' : '○' }}</span>
            {{ kw.keyword }}
          </span>
        </div>
        <div v-if="forbiddenUsed.length > 0" class="forbidden-warn">
          ⚠ 禁用词：{{ forbiddenUsed.join('、') }}
        </div>
      </div>
    </div>

    <div class="session-body">
      <div class="phrase-pool-section">
        <div class="pool-header">
          <span class="pool-title">选词</span>
          <span class="pool-count">{{ boardPhrases.length }} / {{ chapter.targetPhraseCount }}</span>
        </div>
        <div class="phrase-grid">
          <button
            v-for="phrase in phrases"
            :key="phrase.id"
            class="phrase-chip"
            :class="[getRarityClass(phrase.rarity)]"
            :style="{ borderColor: rarityColors[phrase.rarity] + '30' }"
            @click="emit('selectPhrase', phrase)"
          >
            <span class="phrase-text">{{ phrase.text }}</span>
            <span class="phrase-rarity" :style="{ color: rarityColors[phrase.rarity] }">{{ rarityLabels[phrase.rarity] }}</span>
          </button>
        </div>
      </div>

      <div class="board-section">
        <div class="board-header">
          <span class="board-title">画布</span>
          <span class="board-score" :style="{ color: gatheringAccentColor }">
            {{ score.total }}分
            <span v-if="bonusResult.totalBonus > 0" class="bonus-badge" :style="{ background: gatheringAccentColor + '20', color: gatheringAccentColor }">
              +{{ bonusResult.totalBonus }}
            </span>
          </span>
        </div>
        <div class="board-phrases">
          <div
            v-for="bp in boardPhrases"
            :key="bp.id"
            class="board-phrase"
            :class="[getRarityClass(bp.rarity)]"
          >
            <span class="bp-text">{{ bp.text }}</span>
            <button class="bp-remove" @click="emit('removePhrase', bp.id)">✕</button>
          </div>
          <div v-if="boardPhrases.length === 0" class="board-empty">
            从词池中选择词句...
          </div>
        </div>

        <div v-if="bonusResult.triggeredLabels.length > 0" class="bonus-triggered">
          <span v-for="label in bonusResult.triggeredLabels" :key="label" class="bonus-label" :style="{ borderColor: gatheringAccentColor + '40', color: gatheringAccentColor }">
            ✦ {{ label }}
          </span>
        </div>
      </div>
    </div>

    <div class="session-footer">
      <div class="score-summary">
        <div class="score-dims">
          <span class="dim" v-for="dim in ['coherence', 'imagery', 'rhythm', 'themeMatch']" :key="dim">
            <span class="dim-label">{{ { coherence: '连贯', imagery: '意象', rhythm: '韵律', themeMatch: '契合' }[dim] }}</span>
            <span class="dim-value">{{ (score as any)[dim] }}</span>
          </span>
        </div>
      </div>
      <button
        class="submit-btn"
        :disabled="boardPhrases.length === 0"
        :style="{ background: boardPhrases.length > 0 ? `linear-gradient(135deg, ${gatheringAccentColor}, ${gatheringAccentColor}cc)` : undefined, color: boardPhrases.length > 0 ? '#1a1a2e' : undefined }"
        @click="emit('submit', elapsedSeconds)"
      >
        {{ isTimeUp ? '时间到，提交作品' : '提交作品' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.session-container {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

.session-header {
  padding: 14px 18px;
  border-bottom: 1px solid;
}

.session-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.quit-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

.quit-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.session-title {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.timer-block {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 10px;
  background: rgba(201, 168, 108, 0.1);
  transition: all 0.3s ease;
}

.timer-block.time-low {
  background: rgba(212, 165, 112, 0.15);
  animation: pulse-soft 1.5s ease-in-out infinite;
}

.timer-block.time-critical {
  background: rgba(139, 69, 87, 0.2);
  animation: pulse-soft 0.8s ease-in-out infinite;
}

.timer-icon {
  font-size: 14px;
}

.timer-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-serif);
}

.time-low .timer-value {
  color: #d4a574;
}

.time-critical .timer-value {
  color: #e07070;
}

.timer-track {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-fill {
  height: 100%;
  background: var(--accent-gold);
  border-radius: 2px;
  transition: width 1s linear;
}

.timer-fill.time-low {
  background: #d4a574;
}

.timer-fill.time-critical {
  background: #e07070;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.keyword-check {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.kw-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.kw-chip.met {
  color: var(--text-primary);
  background: rgba(201, 168, 108, 0.08);
}

.kw-icon {
  font-size: 10px;
}

.kw-chip.met .kw-icon {
  color: var(--accent-gold);
}

.forbidden-warn {
  font-size: 11px;
  color: #e07070;
  padding: 3px 8px;
  background: rgba(224, 112, 112, 0.08);
  border-radius: 4px;
}

.session-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.phrase-pool-section {
  width: 45%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-header,
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-title,
.board-title {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
}

.pool-count {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.phrase-grid {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
}

.phrase-chip {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.phrase-chip:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.phrase-text {
  font-size: 13px;
  color: var(--text-primary);
}

.phrase-rarity {
  font-size: 9px;
  opacity: 0.7;
}

.board-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-score {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bonus-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.board-phrases {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.board-phrase {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.bp-text {
  font-size: 13px;
  color: var(--text-primary);
}

.bp-remove {
  font-size: 10px;
  color: var(--text-muted);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.bp-remove:hover {
  background: rgba(224, 112, 112, 0.2);
  color: #e07070;
}

.board-empty {
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px;
}

.bonus-triggered {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bonus-label {
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 11px;
  animation: fadeIn 0.5s ease;
}

.session-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-dims {
  display: flex;
  gap: 10px;
}

.dim {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dim-label {
  font-size: 10px;
  color: var(--text-muted);
}

.dim-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.submit-btn {
  padding: 9px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.submit-btn:disabled {
  opacity: 0.3;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.rarity-common { }
.rarity-rare .phrase-text, .rarity-rare .bp-text { color: #5b9ea8; }
.rarity-epic .phrase-text, .rarity-epic .bp-text { color: #a87ac9; }
.rarity-legendary .phrase-text, .rarity-legendary .bp-text { color: #c9a86c; }

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
