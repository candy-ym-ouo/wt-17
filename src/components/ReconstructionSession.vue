<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ClassicPoem, Phrase, PhraseCategory, RestorationScore, ReconstructionAnalysis } from '@/types'
import { categoryLabels, categoryColors, rarityLabels, rarityColors, dropPhrases, getAllPhrases } from '@/data/phrases'
import { calculateRestorationScore, analyzeReconstruction, generateReconstructionSuggestions } from '@/utils/reconstruction'
import { generatePoemPhrases } from '@/data/classicPoems'

interface Props {
  poem: ClassicPoem
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
const selectedCategory = ref<PhraseCategory | null>(null)
const showAnalysis = ref(false)
let timer: number | null = null

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const poolPhrases = computed(() => {
  const poemKeywords = generatePoemPhrases(props.poem)
  const allPhrases = getAllPhrases()
  
  return dropPhrases(allPhrases, {
    totalCount: 40,
    themeKeywords: [...poemKeywords, ...props.poem.keywords],
    themeMatchBoost: 2.8,
    forbiddenWords: []
  })
})

const allPhraseCategories = computed(() => {
  const categories = new Set(poolPhrases.value.map(p => p.category))
  return Array.from(categories)
})

const filteredPoolPhrases = computed(() => {
  if (!selectedCategory.value) return poolPhrases.value
  return poolPhrases.value.filter(p => p.category === selectedCategory.value)
})

const boardPhraseIds = computed(() => new Set(boardPhrases.value.map(p => p.id)))

const phraseCountProgress = computed(() => {
  return Math.min(1, boardPhrases.value.length / props.poem.targetPhraseCount)
})

const liveScore = computed<RestorationScore>(() => {
  if (boardPhrases.value.length === 0) {
    return {
      imageryRestoration: 0,
      themeRestoration: 0,
      emotionRestoration: 0,
      structureRestoration: 0,
      styleRestoration: 0,
      total: 0,
      grade: '习作',
      stars: 0
    }
  }
  return calculateRestorationScore(boardPhrases.value, props.poem)
})

const liveAnalysis = computed<ReconstructionAnalysis | null>(() => {
  if (!showAnalysis.value || boardPhrases.value.length === 0) return null
  return analyzeReconstruction(boardPhrases.value, props.poem)
})

const liveSuggestions = computed<string[]>(() => {
  if (!liveAnalysis.value) return []
  return generateReconstructionSuggestions(liveAnalysis.value)
})

const canSubmit = computed(() => {
  return boardPhrases.value.length >= 3
})

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (isRunning.value) {
      elapsedSeconds.value++
    }
  }, 1000)
}

const handleSelectPhrase = (phrase: Phrase) => {
  if (boardPhraseIds.value.has(phrase.id)) return
  if (boardPhrases.value.length >= props.poem.targetPhraseCount + 6) return
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
  if (confirm('确定要退出重构吗？当前进度将不会保存。')) {
    emit('quit')
  }
}

const handleToggleAnalysis = () => {
  showAnalysis.value = !showAnalysis.value
}

const handleClearBoard = () => {
  if (boardPhrases.value.length === 0) return
  if (!confirm('确定要清空画布吗？')) return
  boardPhrases.value = []
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
</script>

<template>
  <div class="reconstruction-session-overlay">
    <div class="reconstruction-session" :style="{ '--accent-color': poem.accentColor }">
      <div class="session-header" :style="{ background: `linear-gradient(90deg, ${poem.accentColor}15, transparent)` }">
        <div class="session-header-left">
          <span class="poem-big-icon">{{ poem.icon }}</span>
          <div class="poem-info">
            <div class="poem-name-row">
              <h2 class="poem-name">{{ poem.title }}</h2>
              <span class="poem-era">{{ poem.dynasty }} · {{ poem.author }}</span>
            </div>
            <div class="poem-type-tags">
              <span class="mini-tag" :style="{ background: poem.accentColor + '25', color: poem.accentColor }">
                体裁：{{ poem.type }}
              </span>
              <span class="mini-tag type-tag">
                目标词数：{{ poem.targetPhraseCount }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="session-stats">
          <div class="stat-block time-block" :class="{ warning: elapsedSeconds > 300 }">
            <span class="stat-icon-timer">⏱</span>
            <div>
              <span class="stat-value-time">{{ formatTime(elapsedSeconds) }}</span>
              <span class="stat-label-small">用时</span>
            </div>
          </div>
          <div class="stat-block score-block" :class="{ 'high-score': liveScore.total >= 75 }">
            <span class="stat-icon-timer">🎯</span>
            <div>
              <span class="stat-value-time">{{ liveScore.total }}</span>
              <span class="stat-label-small">复原分</span>
            </div>
          </div>
          <button class="quit-btn" @click="handleQuit">退出</button>
        </div>
      </div>

      <div class="session-body">
        <div class="board-section">
          <div class="board-header">
            <div class="board-title-row">
              <span class="board-title">✍ 重构画布</span>
              <div class="phrase-count-bar">
                <div class="count-label">
                  <span>{{ boardPhrases.length }}</span>
                  <span class="count-sep">/</span>
                  <span>{{ poem.targetPhraseCount }}</span>
                </div>
                <div class="count-progress">
                  <div 
                    class="count-progress-fill" 
                    :style="{ 
                      width: (phraseCountProgress * 100) + '%',
                      background: phraseCountProgress >= 1 ? '#7ca97c' : poem.accentColor
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="board-actions">
              <button 
                class="action-btn analyze-btn"
                :class="{ active: showAnalysis }"
                @click="handleToggleAnalysis"
              >
                <span>🔍</span>
                <span>{{ showAnalysis ? '隐藏分析' : '实时分析' }}</span>
              </button>
              <button 
                class="action-btn clear-btn"
                @click="handleClearBoard"
              >
                <span>🗑</span>
                <span>清空</span>
              </button>
            </div>
          </div>

          <div v-if="liveAnalysis" class="live-analysis-panel">
            <div class="analysis-score-row">
              <div class="analysis-score-item" v-for="item in [
                { label: '意象', val: liveScore.imageryRestoration },
                { label: '主题', val: liveScore.themeRestoration },
                { label: '情感', val: liveScore.emotionRestoration },
                { label: '结构', val: liveScore.structureRestoration },
                { label: '风格', val: liveScore.styleRestoration }
              ]" :key="item.label">
                <div class="analysis-label">{{ item.label }}</div>
                <div class="analysis-bar">
                  <div 
                    class="analysis-bar-fill" 
                    :style="{ 
                      width: item.val + '%',
                      background: item.val >= 80 ? '#7ca97c' : item.val >= 60 ? '#c9a86c' : '#c56b6b'
                    }"
                  ></div>
                </div>
                <div class="analysis-val">{{ item.val }}</div>
              </div>
            </div>
            <div v-if="liveSuggestions.length > 0" class="analysis-suggestions">
              <div class="suggestion-title">💡 重构建议</div>
              <ul class="suggestion-list">
                <li v-for="(s, idx) in liveSuggestions" :key="idx">{{ s }}</li>
              </ul>
            </div>
          </div>

          <div class="board-canvas" :class="{ empty: boardPhrases.length === 0 }">
            <div v-if="boardPhrases.length === 0" class="empty-board-hint">
              <span class="empty-icon">📝</span>
              <p class="empty-text">从下方词库中选择词句，重构{{ poem.author }}的《{{ poem.title }}》</p>
              <p class="empty-sub">尝试还原原作的意象、情感与意境</p>
            </div>
            <div v-else class="board-phrases">
              <div 
                v-for="phrase in boardPhrases" 
                :key="phrase.id"
                class="board-phrase-card"
                :style="{ 
                  borderColor: categoryColors[phrase.category] + '60',
                  background: categoryColors[phrase.category] + '08'
                }"
              >
                <span class="phrase-text">{{ phrase.text }}</span>
                <span 
                  class="phrase-cat-tag"
                  :style="{ background: categoryColors[phrase.category] + '25', color: categoryColors[phrase.category] }"
                >
                  {{ categoryLabels[phrase.category] }}
                </span>
                <span 
                  class="phrase-rarity"
                  :style="{ color: rarityColors[phrase.rarity] }"
                >
                  {{ rarityLabels[phrase.rarity] }}
                </span>
                <button class="phrase-remove" @click="handleRemovePhrase(phrase.id)">✕</button>
              </div>
            </div>
          </div>

          <div class="core-imageries-strip">
            <span class="strip-label">核心意象：</span>
            <span 
              v-for="img in poem.coreImageries" 
              :key="img"
              class="imagery-chip"
              :class="{ 
                hit: boardPhrases.some(p => 
                  p.text.includes(img) || img.includes(p.text) || 
                  (liveAnalysis?.imageryDeviations.find(d => d.originalImagery === img)?.present)
                )
              }"
              :style="{ 
                '--chip-color': poem.accentColor
              }"
            >
              {{ img }}
            </span>
          </div>
        </div>

        <div class="pool-section">
          <div class="pool-header">
            <span class="pool-title">📚 重构词库</span>
            <div class="pool-filters">
              <button 
                class="pool-filter-btn"
                :class="{ active: selectedCategory === null }"
                @click="selectedCategory = null"
              >
                全部
              </button>
              <button 
                v-for="cat in allPhraseCategories" 
                :key="cat"
                class="pool-filter-btn"
                :class="{ active: selectedCategory === cat }"
                :style="selectedCategory === cat ? {
                  background: categoryColors[cat] + '30',
                  borderColor: categoryColors[cat] + '60',
                  color: categoryColors[cat]
                } : {}"
                @click="selectedCategory = cat"
              >
                {{ categoryLabels[cat] }}
              </button>
            </div>
          </div>
          
          <div class="pool-phrases-grid">
            <button 
              v-for="phrase in filteredPoolPhrases" 
              :key="phrase.id"
              class="pool-phrase-btn"
              :class="{ 
                selected: boardPhraseIds.has(phrase.id),
                rarity: phrase.rarity
              }"
              :style="boardPhraseIds.has(phrase.id) ? {
                borderColor: categoryColors[phrase.category] + '40',
                background: categoryColors[phrase.category] + '08',
                opacity: 0.5
              } : {
                borderColor: categoryColors[phrase.category] + '25'
              }"
              :disabled="boardPhraseIds.has(phrase.id)"
              @click="handleSelectPhrase(phrase)"
            >
              <span class="pool-phrase-text">{{ phrase.text }}</span>
              <span 
                class="pool-phrase-cat"
                :style="{ color: categoryColors[phrase.category] }"
              >
                {{ categoryLabels[phrase.category] }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="session-footer">
        <div class="footer-original-preview">
          <span class="preview-label">📜 原作：</span>
          <span class="preview-text">{{ poem.content[0] }}{{ poem.content[1] || '' }}</span>
        </div>
        <button 
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          :disabled="!canSubmit"
          :style="{ 
            background: canSubmit ? `linear-gradient(135deg, ${poem.accentColor}, ${poem.accentColor}dd)` : 'var(--bg-input)',
            opacity: canSubmit ? 1 : 0.5
          }"
          @click="handleSubmit"
        >
          <span>🎋</span>
          <span>{{ canSubmit ? '提交重构' : '至少选择3个词句' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reconstruction-session-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 14, 0.95);
  z-index: 210;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reconstruction-session {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-bottom: 1px solid var(--border);
  gap: 20px;
}

.session-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.poem-big-icon {
  font-size: 40px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.poem-name-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.poem-name {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--text-primary);
  letter-spacing: 3px;
  margin: 0;
}

.poem-era {
  font-size: 12px;
  color: var(--text-muted);
}

.poem-type-tags {
  display: flex;
  gap: 8px;
}

.mini-tag {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
}

.type-tag {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.session-stats {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.stat-block.warning {
  animation: pulse 1.5s ease-in-out infinite;
  border-color: rgba(197, 107, 107, 0.4);
}

.stat-block.high-score {
  border-color: rgba(124, 169, 124, 0.4);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.stat-icon-timer {
  font-size: 18px;
}

.stat-value-time {
  display: block;
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 2px;
}

.stat-label-small {
  font-size: 10px;
  color: var(--text-muted);
}

.quit-btn {
  padding: 10px 18px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 10px;
  color: #e09090;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quit-btn:hover {
  background: rgba(255, 100, 100, 0.18);
}

.session-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  overflow: hidden;
}

.board-section {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  overflow: hidden;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
}

.board-title-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.board-title {
  font-family: var(--font-brush);
  font-size: 17px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.phrase-count-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-label {
  font-size: 13px;
  color: var(--text-muted);
}

.count-label span:first-child {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--accent-gold);
}

.count-sep {
  color: var(--text-muted);
  margin: 0 2px;
}

.count-progress {
  width: 120px;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.count-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.board-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.action-btn.active {
  background: rgba(122, 158, 168, 0.15);
  border-color: rgba(122, 158, 168, 0.4);
  color: #8ab8c2;
}

.live-analysis-panel {
  padding: 12px 24px;
  background: rgba(122, 158, 168, 0.06);
  border-bottom: 1px solid rgba(122, 158, 168, 0.2);
}

.analysis-score-row {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.analysis-score-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analysis-label {
  font-size: 11px;
  color: var(--text-muted);
}

.analysis-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.analysis-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.analysis-val {
  font-size: 12px;
  font-family: var(--font-brush);
  color: var(--text-primary);
}

.analysis-suggestions {
  padding: 10px 14px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.15);
  border-radius: 8px;
}

.suggestion-title {
  font-size: 12px;
  color: var(--accent-gold);
  margin-bottom: 6px;
}

.suggestion-list {
  margin: 0;
  padding-left: 18px;
}

.suggestion-list li {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.board-canvas {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.board-canvas.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-board-hint {
  text-align: center;
  opacity: 0.5;
}

.empty-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 16px;
}

.empty-text {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.board-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 100%;
}

.board-phrase-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 10px 16px;
  border: 1px solid;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  animation: dropIn 0.3s ease;
}

@keyframes dropIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.board-phrase-card:hover {
  transform: translateY(-2px);
}

.phrase-text {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.phrase-cat-tag {
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 10px;
}

.phrase-rarity {
  font-size: 10px;
  opacity: 0.7;
}

.phrase-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-red);
  border: none;
  color: white;
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-phrase-card:hover .phrase-remove {
  opacity: 1;
}

.core-imageries-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
  flex-wrap: wrap;
}

.strip-label {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.imagery-chip {
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.imagery-chip.hit {
  background: color-mix(in srgb, var(--chip-color) 20%, transparent);
  border-color: color-mix(in srgb, var(--chip-color) 50%, transparent);
  color: var(--chip-color);
  box-shadow: 0 0 12px color-mix(in srgb, var(--chip-color) 25%, transparent);
}

.pool-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pool-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
}

.pool-title {
  font-family: var(--font-brush);
  font-size: 15px;
  color: var(--text-primary);
  display: block;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.pool-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pool-filter-btn {
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pool-filter-btn:hover {
  background: rgba(255, 255, 255, 0.04);
}

.pool-filter-btn.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.pool-phrases-grid {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-content: start;
}

.pool-phrase-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.pool-phrase-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pool-phrase-btn:disabled {
  cursor: not-allowed;
}

.pool-phrase-text {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.pool-phrase-cat {
  font-size: 10px;
  opacity: 0.7;
}

.session-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.footer-original-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 60%;
  overflow: hidden;
}

.preview-label {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.preview-text {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.7;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 36px;
  border: none;
  border-radius: 14px;
  color: #1a1a2e;
  font-size: 15px;
  font-weight: 500;
  font-family: var(--font-serif);
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.submit-btn.disabled {
  cursor: not-allowed;
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .session-body {
    grid-template-columns: 1fr;
  }
  
  .board-section {
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 50vh;
  }
  
  .pool-section {
    max-height: 50vh;
  }
}
</style>
