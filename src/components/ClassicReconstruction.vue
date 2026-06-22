<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Phrase, ClassicPoem, PoeticGoal, DeviationReport, RestorationScore, DimensionDeviation } from '@/types'
import { classicPoems, getPoemById, getAllPoemDifficulties, GOAL_DIMENSION_LABELS, GOAL_DIMENSION_ICONS } from '@/data/classicPoems'
import { POEM_DIFFICULTY_LABELS, POEM_DIFFICULTY_COLORS } from '@/types'
import { analyzeDeviation, calculateRestorationScore, getRestorationGradeColor, getDeviationLevelColor, getDeviationLevelLabel } from '@/utils/classicReconstruction'

interface Props {
  visible: boolean
  boardPhrases: Phrase[]
  poolPhrases: Phrase[]
  activePoemId: string | null
  bestScores: Record<string, number>
  completedPoemIds: string[]
}

const props = withDefaults(defineProps<Props>(), {
  activePoemId: null,
  bestScores: () => ({}),
  completedPoemIds: () => [],
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selectPoem', poem: ClassicPoem): void
  (e: 'startReconstruction', poemId: string): void
  (e: 'selectPhrase', phrase: Phrase): void
}>()

const activeTab = ref<'poems' | 'analysis' | 'score'>('poems')
const selectedDifficulty = ref<string | null>(null)
const expandedPoemId = ref<string | null>(null)

const activePoem = computed((): ClassicPoem | null => {
  if (!props.activePoemId) return null
  return getPoemById(props.activePoemId) || null
})

const filteredPoems = computed(() => {
  if (!selectedDifficulty.value) return classicPoems
  return classicPoems.filter(p => p.difficulty === selectedDifficulty.value)
})

const groupedPoems = computed(() => {
  const groups: Record<string, ClassicPoem[]> = {}
  const difficulties = getAllPoemDifficulties()
  difficulties.forEach(d => {
    const poems = filteredPoems.value.filter(p => p.difficulty === d)
    if (poems.length > 0) groups[d] = poems
  })
  return groups
})

const deviationReport = computed((): DeviationReport | null => {
  if (!activePoem.value) return null
  return analyzeDeviation(props.boardPhrases, activePoem.value)
})

const restorationScore = computed((): RestorationScore | null => {
  if (!activePoem.value) return null
  return calculateRestorationScore(props.boardPhrases, activePoem.value)
})

const relevantPoolPhrases = computed((): Phrase[] => {
  if (!activePoem.value) return props.poolPhrases

  const goals = activePoem.value.goals
  const targetKeywords = new Set(goals.flatMap(g => g.targetKeywords))
  const targetCategories = new Set(goals.flatMap(g => g.targetCategories))

  return [...props.poolPhrases].sort((a, b) => {
    const aKeyMatch = targetKeywords.has(a.text) ? 2 : 0
    const bKeyMatch = targetKeywords.has(b.text) ? 2 : 0
    const aCatMatch = targetCategories.has(a.category) ? 1 : 0
    const bCatMatch = targetCategories.has(b.category) ? 1 : 0
    return (bKeyMatch + bCatMatch) - (aKeyMatch + aCatMatch)
  })
})

const handleSelectPoem = (poem: ClassicPoem) => {
  emit('selectPoem', poem)
  if (props.activePoemId !== poem.id) {
    activeTab.value = 'analysis'
  }
}

const handleStartReconstruction = (poemId: string) => {
  emit('startReconstruction', poemId)
  activeTab.value = 'analysis'
}

const handlePhraseClick = (phrase: Phrase) => {
  emit('selectPhrase', phrase)
}

const getDevBarWidth = (deviation: number): string => {
  return Math.min(deviation, 100) + '%'
}

const getDevBarColor = (level: string): string => {
  return getDeviationLevelColor(level)
}

const toggleExpand = (poemId: string) => {
  expandedPoemId.value = expandedPoemId.value === poemId ? null : poemId
}
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="cr-overlay" @click.self="emit('close')">
      <div class="cr-panel">
        <div class="panel-header">
          <div class="header-title">
            <span class="title-icon">📜</span>
            <span class="title-text">名篇重构</span>
          </div>
          <div class="header-subtitle">以经典诗意为目标，重构千古名篇</div>
          <button class="close-btn" @click="emit('close')">
            <span>✕</span>
          </button>
        </div>

        <div class="panel-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'poems' }"
            @click="activeTab = 'poems'"
          >
            <span class="tab-icon">📖</span>
            <span>名篇选录</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'analysis' }"
            @click="activeTab = 'analysis'"
            :disabled="!activePoem"
          >
            <span class="tab-icon">🔍</span>
            <span>偏差分析</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'score' }"
            @click="activeTab = 'score'"
            :disabled="!activePoem"
          >
            <span class="tab-icon">⭐</span>
            <span>复原评分</span>
          </button>
        </div>

        <div class="panel-body">
          <div v-if="activeTab === 'poems'" class="poems-view">
            <div class="difficulty-filter">
              <button
                class="filter-btn"
                :class="{ active: !selectedDifficulty }"
                @click="selectedDifficulty = null"
              >
                全部
              </button>
              <button
                v-for="diff in getAllPoemDifficulties()"
                :key="diff"
                class="filter-btn"
                :class="{ active: selectedDifficulty === diff }"
                @click="selectedDifficulty = diff"
                :style="{ borderColor: selectedDifficulty === diff ? POEM_DIFFICULTY_COLORS[diff] : undefined }"
              >
                {{ diff }}
              </button>
            </div>

            <div class="poems-list">
              <div
                v-for="(poems, diff) in groupedPoems"
                :key="diff"
                class="difficulty-group"
              >
                <div class="group-label" :style="{ color: POEM_DIFFICULTY_COLORS[diff as string] }">
                  {{ POEM_DIFFICULTY_LABELS[diff as string] }}
                </div>
                <div class="poem-cards">
                  <div
                    v-for="poem in poems"
                    :key="poem.id"
                    class="poem-card"
                    :class="{ active: activePoemId === poem.id, expanded: expandedPoemId === poem.id }"
                    @click="handleSelectPoem(poem)"
                  >
                    <div class="poem-card-header">
                      <span class="poem-icon">{{ poem.icon }}</span>
                      <div class="poem-info">
                        <div class="poem-title-row">
                          <span class="poem-title">{{ poem.title }}</span>
                          <span class="poem-dynasty">{{ poem.dynasty }}·{{ poem.author }}</span>
                        </div>
                        <div class="poem-desc">{{ poem.description }}</div>
                      </div>
                      <div v-if="bestScores[poem.id]" class="poem-best-score">
                        <span class="best-label">最佳</span>
                        <span class="best-value">{{ bestScores[poem.id] }}</span>
                      </div>
                      <span v-if="completedPoemIds.includes(poem.id)" class="poem-completed">✓</span>
                    </div>

                    <div class="poem-goals-preview">
                      <span
                        v-for="goal in poem.goals.slice(0, 3)"
                        :key="goal.dimension"
                        class="goal-chip"
                      >
                        {{ GOAL_DIMENSION_ICONS[goal.dimension] }} {{ goal.label }}
                      </span>
                    </div>

                    <Transition name="expand">
                      <div v-if="expandedPoemId === poem.id" class="poem-expand-content">
                        <div class="poem-original">
                          <div class="original-label">原诗</div>
                          <div class="original-lines">
                            <div
                              v-for="(line, idx) in poem.content"
                              :key="idx"
                              class="original-line"
                            >
                              <span class="line-text">{{ line.text }}</span>
                              <span v-if="line.annotation" class="line-annotation">{{ line.annotation }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="poem-keywords">
                          <span class="kw-label">核心意象：</span>
                          <span v-for="kw in poem.keyImagery" :key="kw" class="kw-tag imagery">{{ kw }}</span>
                        </div>
                        <div class="poem-keywords">
                          <span class="kw-label">核心情感：</span>
                          <span v-for="kw in poem.keyEmotions" :key="kw" class="kw-tag emotion">{{ kw }}</span>
                        </div>
                        <button
                          class="start-btn"
                          @click.stop="handleStartReconstruction(poem.id)"
                        >
                          开始重构
                        </button>
                      </div>
                    </Transition>

                    <button
                      class="expand-toggle"
                      @click.stop="toggleExpand(poem.id)"
                    >
                      {{ expandedPoemId === poem.id ? '收起' : '展开' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'analysis' && activePoem && deviationReport" class="analysis-view">
            <div class="analysis-header">
              <div class="poem-ref">
                <span class="ref-icon">{{ activePoem.icon }}</span>
                <div class="ref-info">
                  <span class="ref-title">{{ activePoem.title }}</span>
                  <span class="ref-author">{{ activePoem.dynasty }}·{{ activePoem.author }}</span>
                </div>
              </div>
              <div class="deviation-summary">
                <div class="summary-ring">
                  <svg class="ring-svg" viewBox="0 0 100 100">
                    <circle class="ring-bg" cx="50" cy="50" r="40" fill="none" stroke-width="6" />
                    <circle
                      class="ring-fill"
                      cx="50" cy="50" r="40"
                      fill="none" stroke-width="6"
                      stroke-dasharray="251"
                      :stroke-dashoffset="251 - ((100 - deviationReport.totalDeviation) / 100) * 251"
                      :stroke="100 - deviationReport.totalDeviation >= 70 ? '#7ca97c' : 100 - deviationReport.totalDeviation >= 40 ? '#c9a86c' : '#c95b5b'"
                    />
                  </svg>
                  <div class="ring-inner">
                    <span class="ring-value">{{ 100 - deviationReport.totalDeviation }}</span>
                    <span class="ring-label">契合度</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="overall-analysis">
              <div class="analysis-text">{{ deviationReport.overallAnalysis }}</div>
              <div class="advice-text">{{ deviationReport.restorationAdvice }}</div>
            </div>

            <div class="dimension-analysis">
              <div class="dim-title">各维度偏差</div>
              <div
                v-for="dim in deviationReport.dimensions"
                :key="dim.dimension"
                class="dim-item"
              >
                <div class="dim-header">
                  <span class="dim-icon">{{ GOAL_DIMENSION_ICONS[dim.dimension] }}</span>
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-score">{{ dim.currentScore }}分</span>
                  <span
                    class="dim-level"
                    :style="{ color: getDevBarColor(dim.deviationLevel) }"
                  >
                    {{ getDeviationLevelLabel(dim.deviationLevel) }}
                  </span>
                </div>
                <div class="dim-bar-track">
                  <div
                    class="dim-bar-fill"
                    :style="{
                      width: getDevBarWidth(dim.deviation),
                      background: getDevBarColor(dim.deviationLevel)
                    }"
                  ></div>
                  <div class="dim-bar-marker" :style="{ left: dim.currentScore + '%' }"></div>
                </div>
                <div class="dim-analysis">{{ dim.analysis }}</div>
                <div v-if="dim.suggestions.length > 0" class="dim-suggestions">
                  <span v-for="(sug, si) in dim.suggestions" :key="si" class="suggestion-tag">
                    ❯ {{ sug }}
                  </span>
                </div>
              </div>
            </div>

            <div class="keyword-analysis">
              <div class="kw-section">
                <div class="kw-section-title captured">已捕捉关键词</div>
                <div class="kw-tags">
                  <span v-for="kw in deviationReport.capturedKeywords" :key="kw" class="kw-tag captured">{{ kw }}</span>
                  <span v-if="deviationReport.capturedKeywords.length === 0" class="kw-empty">暂无</span>
                </div>
              </div>
              <div class="kw-section">
                <div class="kw-section-title missed">缺失关键词</div>
                <div class="kw-tags">
                  <span v-for="kw in deviationReport.missedKeywords" :key="kw" class="kw-tag missed">{{ kw }}</span>
                  <span v-if="deviationReport.missedKeywords.length === 0" class="kw-empty">无</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'score' && activePoem && restorationScore" class="score-view">
            <div class="score-hero">
              <div class="score-main-ring">
                <svg class="ring-svg" viewBox="0 0 140 140">
                  <circle class="ring-bg" cx="70" cy="70" r="58" fill="none" stroke-width="8" />
                  <circle
                    class="ring-fill"
                    cx="70" cy="70" r="58"
                    fill="none" stroke-width="8"
                    stroke-dasharray="364"
                    :stroke-dashoffset="364 - (restorationScore.total / 100) * 364"
                    :stroke="getRestorationGradeColor(restorationScore.grade)"
                  />
                </svg>
                <div class="score-main-inner">
                  <div class="score-total">{{ restorationScore.total }}</div>
                  <div
                    class="score-grade"
                    :style="{ color: getRestorationGradeColor(restorationScore.grade) }"
                  >
                    {{ restorationScore.grade }}
                  </div>
                </div>
              </div>
            </div>

            <div class="score-trio">
              <div class="trio-item">
                <div class="trio-label">还原度</div>
                <div class="trio-value">{{ restorationScore.fidelity }}</div>
                <div class="trio-bar">
                  <div class="trio-fill fidelity" :style="{ width: restorationScore.fidelity + '%' }"></div>
                </div>
              </div>
              <div class="trio-item">
                <div class="trio-label">创造力</div>
                <div class="trio-value">{{ restorationScore.creativity }}</div>
                <div class="trio-bar">
                  <div class="trio-fill creativity" :style="{ width: restorationScore.creativity + '%' }"></div>
                </div>
              </div>
              <div class="trio-item">
                <div class="trio-label">平衡性</div>
                <div class="trio-value">{{ restorationScore.balance }}</div>
                <div class="trio-bar">
                  <div class="trio-fill balance" :style="{ width: restorationScore.balance + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="score-breakdown">
              <div class="breakdown-title">五维还原</div>
              <div class="breakdown-item">
                <span class="bd-label">意境还原</span>
                <div class="bd-bar">
                  <div class="bd-fill" :style="{ width: restorationScore.breakdown.moodFidelity + '%' }"></div>
                </div>
                <span class="bd-value">{{ restorationScore.breakdown.moodFidelity }}</span>
              </div>
              <div class="breakdown-item">
                <span class="bd-label">意象还原</span>
                <div class="bd-bar">
                  <div class="bd-fill" :style="{ width: restorationScore.breakdown.imageryFidelity + '%' }"></div>
                </div>
                <span class="bd-value">{{ restorationScore.breakdown.imageryFidelity }}</span>
              </div>
              <div class="breakdown-item">
                <span class="bd-label">韵律还原</span>
                <div class="bd-bar">
                  <div class="bd-fill" :style="{ width: restorationScore.breakdown.rhythmFidelity + '%' }"></div>
                </div>
                <span class="bd-value">{{ restorationScore.breakdown.rhythmFidelity }}</span>
              </div>
              <div class="breakdown-item">
                <span class="bd-label">结构还原</span>
                <div class="bd-bar">
                  <div class="bd-fill" :style="{ width: restorationScore.breakdown.structureFidelity + '%' }"></div>
                </div>
                <span class="bd-value">{{ restorationScore.breakdown.structureFidelity }}</span>
              </div>
              <div class="breakdown-item">
                <span class="bd-label">主题还原</span>
                <div class="bd-bar">
                  <div class="bd-fill" :style="{ width: restorationScore.breakdown.themeFidelity + '%' }"></div>
                </div>
                <span class="bd-value">{{ restorationScore.breakdown.themeFidelity }}</span>
              </div>
              <div class="breakdown-item creative">
                <span class="bd-label">创意加分</span>
                <div class="bd-bar">
                  <div class="bd-fill creative" :style="{ width: restorationScore.breakdown.creativeBonus * 5 + '%' }"></div>
                </div>
                <span class="bd-value">+{{ restorationScore.breakdown.creativeBonus }}</span>
              </div>
            </div>

            <div v-if="relevantPoolPhrases.length > 0 && boardPhrases.length > 0" class="score-recommendations">
              <div class="rec-title">推荐词句</div>
              <div class="rec-grid">
                <button
                  v-for="phrase in relevantPoolPhrases.slice(0, 8)"
                  :key="phrase.id"
                  class="rec-card"
                  :class="`rarity-${phrase.rarity}`"
                  @click="handlePhraseClick(phrase)"
                >
                  <span class="rec-text">{{ phrase.text }}</span>
                  <span class="rec-meta">{{ phrase.text.length }}字·{{ phrase.category }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.cr-panel {
  width: 940px;
  max-width: 95vw;
  height: 85vh;
  max-height: 750px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  position: relative;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 20px;
}

.title-text {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.header-subtitle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.panel-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover:not(:disabled) {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tab-icon {
  font-size: 14px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.poems-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.difficulty-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--accent-gold);
  color: var(--text-primary);
}

.filter-btn.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.poems-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.difficulty-group {
}

.group-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.poem-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.poem-card {
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.poem-card:hover {
  border-color: rgba(201, 168, 108, 0.4);
  background: rgba(26, 26, 46, 0.6);
}

.poem-card.active {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
}

.poem-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.poem-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.poem-info {
  flex: 1;
  min-width: 0;
}

.poem-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.poem-title {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.poem-dynasty {
  font-size: 12px;
  color: var(--text-muted);
}

.poem-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}

.poem-best-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
  background: rgba(201, 168, 108, 0.1);
  border-radius: 8px;
}

.best-label {
  font-size: 10px;
  color: var(--text-muted);
}

.best-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-gold);
}

.poem-completed {
  color: #7ca97c;
  font-size: 18px;
}

.poem-goals-preview {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.goal-chip {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-secondary);
}

.poem-expand-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.poem-original {
  margin-bottom: 12px;
}

.original-label {
  font-size: 12px;
  color: var(--accent-gold);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.original-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 6px;
  border-left: 3px solid var(--accent-gold);
}

.original-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.line-text {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.line-annotation {
  font-size: 11px;
  color: var(--text-muted);
}

.poem-keywords {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.kw-label {
  font-size: 12px;
  color: var(--text-muted);
}

.kw-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.kw-tag.imagery {
  background: rgba(91, 122, 140, 0.2);
  color: #7a9ea8;
}

.kw-tag.emotion {
  background: rgba(139, 69, 87, 0.2);
  color: #d4a8b5;
}

.start-btn {
  margin-top: 12px;
  padding: 8px 24px;
  background: linear-gradient(135deg, #c9a86c, #a8884c);
  border-radius: 6px;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 108, 0.3);
}

.expand-toggle {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.expand-toggle:hover {
  color: var(--accent-gold);
}

.analysis-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.poem-ref {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ref-icon {
  font-size: 32px;
}

.ref-info {
  display: flex;
  flex-direction: column;
}

.ref-title {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.ref-author {
  font-size: 13px;
  color: var(--text-muted);
}

.deviation-summary {
}

.summary-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: rgba(255, 255, 255, 0.08);
}

.ring-fill {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.ring-label {
  font-size: 9px;
  color: var(--text-muted);
}

.overall-analysis {
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.analysis-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.advice-text {
  font-size: 13px;
  color: var(--accent-gold);
  line-height: 1.5;
  padding-left: 12px;
  border-left: 3px solid var(--accent-gold);
}

.dimension-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dim-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.dim-item {
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.dim-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dim-icon {
  font-size: 14px;
}

.dim-label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.dim-score {
  font-size: 13px;
  color: var(--accent-gold);
  font-weight: 500;
}

.dim-level {
  font-size: 11px;
  margin-left: auto;
}

.dim-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  position: relative;
  margin-bottom: 8px;
}

.dim-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  position: absolute;
  right: 0;
}

.dim-bar-marker {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 10px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: left 0.5s ease;
}

.dim-analysis {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 6px;
}

.dim-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestion-tag {
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  border-radius: 4px;
  font-size: 11px;
}

.keyword-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.kw-section {
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.kw-section-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.kw-section-title.captured {
  color: #7ca97c;
}

.kw-section-title.missed {
  color: #c95b5b;
}

.kw-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kw-tag.captured {
  padding: 2px 8px;
  background: rgba(124, 169, 124, 0.15);
  color: #7ca97c;
  border-radius: 4px;
  font-size: 11px;
}

.kw-tag.missed {
  padding: 2px 8px;
  background: rgba(201, 91, 91, 0.15);
  color: #c9788a;
  border-radius: 4px;
  font-size: 11px;
}

.kw-empty {
  font-size: 11px;
  color: var(--text-muted);
}

.score-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

.score-hero {
  display: flex;
  justify-content: center;
}

.score-main-ring {
  position: relative;
  width: 140px;
  height: 140px;
}

.score-main-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-total {
  font-size: 36px;
  font-weight: 600;
  color: var(--text-primary);
}

.score-grade {
  font-size: 16px;
  margin-top: 2px;
  font-family: var(--font-brush);
  letter-spacing: 2px;
}

.score-trio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.trio-item {
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}

.trio-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.trio-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.trio-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.trio-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.trio-fill.fidelity {
  background: linear-gradient(90deg, #7ca97c, #5b8a5b);
}

.trio-fill.creativity {
  background: linear-gradient(90deg, #a87ac9, #8b5ba8);
}

.trio-fill.balance {
  background: linear-gradient(90deg, #7a9ea8, #5b7a8c);
}

.score-breakdown {
  width: 100%;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.breakdown-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 16px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.breakdown-item.creative {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.bd-label {
  width: 70px;
  font-size: 12px;
  color: var(--text-secondary);
}

.bd-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.bd-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), #e8c996);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bd-fill.creative {
  background: linear-gradient(90deg, #a87ac9, #c9a8e8);
}

.bd-value {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.score-recommendations {
  width: 100%;
}

.rec-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 12px;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.rec-card {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 6px;
  text-align: left;
  transition: all 0.2s;
}

.rec-card:hover {
  background: rgba(201, 168, 108, 0.1);
  border-color: var(--accent-gold);
  transform: translateY(-2px);
}

.rec-card.rarity-legendary {
  border-color: rgba(201, 168, 108, 0.5);
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.1), rgba(255, 215, 150, 0.05));
}

.rec-card.rarity-epic {
  border-color: rgba(139, 69, 87, 0.4);
}

.rec-card.rarity-rare {
  border-color: rgba(91, 122, 140, 0.4);
}

.rec-text {
  display: block;
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 4px;
}

.rec-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
