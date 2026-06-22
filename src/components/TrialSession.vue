<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { TrialTheme, Phrase, ScoreBreakdown, PhraseRarity, PhraseCategory } from '@/types'
import { rarityLabels, rarityColors, categoryLabels, categoryColors } from '@/data/phrases'
import { calculateScore } from '@/utils/scoring'

interface Props {
  trial: TrialTheme
  phrases: Phrase[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'selectPhrase', phrase: Phrase): void
  (e: 'removePhrase', phraseId: string): void
  (e: 'submit', boardPhrases: Phrase[], elapsedSeconds: number): void
  (e: 'quit'): void
}>()

const boardPhrases = ref<Phrase[]>([])
const elapsedSeconds = ref(0)
const isRunning = ref(true)
const isTimeUp = ref(false)
const selectedCategory = ref<PhraseCategory | null>(null)
let timer: number | null = null

const timeRemaining = computed(() => {
  return Math.max(0, props.trial.timeLimitSeconds - elapsedSeconds.value)
})

const timeProgress = computed(() => {
  return Math.max(0, 1 - elapsedSeconds.value / props.trial.timeLimitSeconds)
})

const isTimeLow = computed(() => {
  return timeRemaining.value <= 30 && timeRemaining.value > 0
})

const isTimeCritical = computed(() => {
  return timeRemaining.value <= 10 && timeRemaining.value > 0
})

const fakeChapter = computed(() => ({
  id: props.trial.id,
  title: props.trial.name,
  subtitle: props.trial.description,
  description: props.trial.description,
  theme: props.trial.type,
  backgroundGradient: props.trial.backgroundGradient,
  accentColor: props.trial.accentColor,
  phrases: props.phrases,
  unlocked: true,
  targetPhraseCount: props.trial.targetPhraseCount,
  hint: props.trial.description,
  qualifierWords: props.trial.requiredKeywords,
  forbiddenWords: props.trial.forbiddenWords
}))

const score = computed<ScoreBreakdown>(() => {
  if (boardPhrases.value.length === 0) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }
  return calculateScore(boardPhrases.value, fakeChapter.value, {})
})

const requiredKeywordsMet = computed(() => {
  const boardTexts = new Set(boardPhrases.value.map(p => p.text))
  return props.trial.requiredKeywords.map(kw => ({
    keyword: kw,
    met: boardTexts.has(kw)
  }))
})

const forbiddenUsed = computed(() => {
  const boardTexts = new Set(boardPhrases.value.map(p => p.text))
  return props.trial.forbiddenWords.filter(w => boardTexts.has(w))
})

const allPhraseCategories = computed(() => {
  const categories = new Set(props.phrases.map(p => p.category))
  return Array.from(categories)
})

const filteredPoolPhrases = computed(() => {
  if (!selectedCategory.value) return props.phrases
  return props.phrases.filter(p => p.category === selectedCategory.value)
})

const boardPhraseIds = computed(() => new Set(boardPhrases.value.map(p => p.id)))

const phraseCountProgress = computed(() => {
  return Math.min(1, boardPhrases.value.length / props.trial.targetPhraseCount)
})

const canSubmit = computed(() => {
  return boardPhrases.value.length >= 3 && !isTimeUp.value
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (isRunning.value) {
      elapsedSeconds.value++
      if (elapsedSeconds.value >= props.trial.timeLimitSeconds) {
        isTimeUp.value = true
        isRunning.value = false
      }
    }
  }, 1000)
}

const handleSelectPhrase = (phrase: Phrase) => {
  if (boardPhraseIds.value.has(phrase.id)) return
  if (boardPhrases.value.length >= props.trial.targetPhraseCount + 5) return
  boardPhrases.value.push({ ...phrase, isPlaced: true })
  emit('selectPhrase', phrase)
}

const handleRemovePhrase = (phraseId: string) => {
  boardPhrases.value = boardPhrases.value.filter(p => p.id !== phraseId)
  emit('removePhrase', phraseId)
}

const handleSubmit = () => {
  if (!canSubmit.value) return
  isRunning.value = false
  emit('submit', boardPhrases.value, elapsedSeconds.value)
}

const handleQuit = () => {
  if (confirm('确定要退出试炼吗？当前进度将不会保存。')) {
    emit('quit')
  }
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
  if (val && boardPhrases.value.length >= 3) {
    emit('submit', boardPhrases.value, elapsedSeconds.value)
  }
})
</script>

<template>
  <div class="trial-session">
    <div class="session-header" :style="{ borderColor: trial.accentColor + '30' }">
      <div class="session-top-bar">
        <button class="quit-btn" @click="handleQuit">✕ 退出</button>
        <div class="session-title">{{ trial.icon }} {{ trial.name }}</div>
        <div class="timer-block" :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }">
          <span class="timer-icon">⏱</span>
          <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
        </div>
      </div>

      <div class="timer-track">
        <div
          class="timer-fill"
          :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }"
          :style="{ width: (timeProgress * 100) + '%', background: trial.accentColor }"
        ></div>
      </div>

      <div class="session-meta">
        <div class="keyword-check">
          <span
            v-for="kw in requiredKeywordsMet"
            :key="kw.keyword"
            class="kw-chip"
            :class="{ met: kw.met }"
            :style="{ borderColor: kw.met ? trial.accentColor + '60' : undefined }"
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
      <div class="board-section">
        <div class="board-header">
          <span class="board-title">📜 词句组合</span>
          <div class="board-info">
            <span class="phrase-count">
              {{ boardPhrases.length }} / {{ trial.targetPhraseCount }}
            </span>
            <div class="count-progress">
              <div 
                class="count-progress-fill"
                :style="{ width: (phraseCountProgress * 100) + '%', background: trial.accentColor }"
              ></div>
            </div>
          </div>
        </div>

        <div class="board-area" :style="{ background: trial.backgroundGradient }">
          <div v-if="boardPhrases.length === 0" class="board-empty">
            <span class="empty-icon">✨</span>
            <span class="empty-text">从下方词池中选择词句</span>
          </div>
          <div v-else class="board-phrases">
            <div
              v-for="(phrase, index) in boardPhrases"
              :key="phrase.id"
              class="board-phrase"
              :class="`rarity-${phrase.rarity}`"
              :style="{ '--rarity-color': rarityColors[phrase.rarity] }"
              @click="handleRemovePhrase(phrase.id)"
            >
              <span class="phrase-text">{{ phrase.text }}</span>
              <span class="phrase-remove">✕</span>
            </div>
          </div>
        </div>

        <div class="score-preview">
          <div class="score-item">
            <span class="score-label">连贯性</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: score.coherence + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(score.coherence) }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">意象</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: score.imagery + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(score.imagery) }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">韵律</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: score.rhythm + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(score.rhythm) }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">主题契合</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: score.themeMatch + '%' }"></div>
            </div>
            <span class="score-value">{{ Math.round(score.themeMatch) }}</span>
          </div>
          <div class="score-item total">
            <span class="score-label">总分</span>
            <span class="score-total" :style="{ color: trial.accentColor }">
              {{ Math.round(score.total) }}
            </span>
          </div>
        </div>
      </div>

      <div class="pool-section">
        <div class="pool-header">
          <span class="pool-title">📚 词池</span>
          <div class="category-filters">
            <button
              class="cat-filter"
              :class="{ active: !selectedCategory }"
              @click="selectedCategory = null"
            >
              全部
            </button>
            <button
              v-for="cat in allPhraseCategories"
              :key="cat"
              class="cat-filter"
              :class="{ active: selectedCategory === cat }"
              :style="{ '--cat-color': categoryColors[cat] }"
              @click="selectedCategory = cat"
            >
              {{ categoryLabels[cat] }}
            </button>
          </div>
        </div>

        <div class="phrase-grid">
          <button
            v-for="phrase in filteredPoolPhrases"
            :key="phrase.id"
            class="pool-phrase"
            :class="`rarity-${phrase.rarity}`"
            :style="{ '--rarity-color': rarityColors[phrase.rarity] }"
            :disabled="boardPhraseIds.has(phrase.id)"
            @click="handleSelectPhrase(phrase)"
          >
            <span class="phrase-text">{{ phrase.text }}</span>
            <span class="phrase-cat" :style="{ color: categoryColors[phrase.category] }">
              {{ categoryLabels[phrase.category] }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="session-footer">
      <div class="footer-info">
        <span class="hint">💡 点击词句添加到画布，点击画布中的词句可移除</span>
      </div>
      <button 
        class="submit-btn"
        :class="{ disabled: !canSubmit }"
        :style="{ background: trial.accentColor }"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        {{ isTimeUp ? '时间到' : '提交答卷' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.trial-session {
  position: fixed;
  inset: 0;
  background: #0f0f1a;
  z-index: 900;
  display: flex;
  flex-direction: column;
}

.session-header {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid;
}

.session-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quit-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.quit-btn:hover {
  background: rgba(255, 100, 100, 0.1);
  border-color: rgba(255, 100, 100, 0.3);
  color: #f66;
}

.session-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.timer-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: monospace;
}

.timer-block.time-low {
  background: rgba(255, 200, 50, 0.1);
  color: #ffc832;
}

.timer-block.time-critical {
  background: rgba(255, 80, 80, 0.1);
  color: #ff5050;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.timer-icon {
  font-size: 16px;
}

.timer-value {
  font-size: 18px;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.timer-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.timer-fill {
  height: 100%;
  transition: width 1s linear;
  border-radius: 2px;
}

.timer-fill.time-low {
  background: #ffc832 !important;
}

.timer-fill.time-critical {
  background: #ff5050 !important;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.keyword-check {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kw-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: #888;
  transition: all 0.2s;
}

.kw-chip.met {
  color: #c9a86c;
  border-color: rgba(201, 168, 108, 0.4);
  background: rgba(201, 168, 108, 0.1);
}

.kw-icon {
  font-size: 10px;
}

.forbidden-warn {
  padding: 6px 12px;
  background: rgba(255, 80, 80, 0.1);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: #ff6b6b;
}

.session-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.board-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.board-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.board-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.phrase-count {
  font-size: 14px;
  color: #888;
}

.count-progress {
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.count-progress-fill {
  height: 100%;
  transition: width 0.3s;
  border-radius: 2px;
}

.board-area {
  flex: 1;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 200px;
  position: relative;
  overflow: auto;
}

.board-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #555;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.board-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
}

.board-phrase {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--rarity-color, rgba(255, 255, 255, 0.2));
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.board-phrase:hover {
  background: rgba(255, 100, 100, 0.1);
  border-color: #ff6b6b;
}

.board-phrase .phrase-text {
  font-size: 15px;
  color: #fff;
}

.phrase-remove {
  font-size: 12px;
  color: #666;
  opacity: 0;
  transition: opacity 0.2s;
}

.board-phrase:hover .phrase-remove {
  opacity: 1;
  color: #ff6b6b;
}

.score-preview {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.score-item:last-child {
  margin-bottom: 0;
}

.score-item.total {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: space-between;
}

.score-label {
  font-size: 12px;
  color: #888;
  width: 60px;
  flex-shrink: 0;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #5b9ea8, #7ca97c);
  border-radius: 3px;
  transition: width 0.3s;
}

.score-value {
  font-size: 12px;
  color: #aaa;
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

.score-total {
  font-size: 20px;
  font-weight: 700;
}

.pool-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pool-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.category-filters {
  display: flex;
  gap: 6px;
}

.cat-filter {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.cat-filter:hover {
  background: rgba(255, 255, 255, 0.1);
}

.cat-filter.active {
  background: var(--cat-color, rgba(201, 168, 108, 0.2));
  border-color: var(--cat-color, #c9a86c);
  color: var(--cat-color, #c9a86c);
}

.phrase-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  align-content: start;
}

.pool-phrase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--rarity-color, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pool-phrase:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.pool-phrase:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pool-phrase .phrase-text {
  font-size: 14px;
  color: #ddd;
}

.phrase-cat {
  font-size: 11px;
}

.session-footer {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  font-size: 13px;
  color: #666;
}

.hint {
  font-size: 12px;
}

.submit-btn {
  padding: 12px 36px;
  border: none;
  color: #1a1a2e;
  border-radius: 24px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.submit-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.submit-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .session-body {
    flex-direction: column;
  }
  
  .board-section {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .board-area {
    min-height: 150px;
  }
  
  .phrase-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
