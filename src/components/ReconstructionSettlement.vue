<script setup lang="ts">
import { computed } from 'vue'
import type { ReconstructionResult, ClassicPoem, ImageryDeviation, StructuralDeviation } from '@/types'

interface Props {
  result: ReconstructionResult
  poem: ClassicPoem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
  (e: 'backToList'): void
}>()

const scoreDimensions = computed(() => [
  { key: 'imageryRestoration', label: '意象复原', icon: '🖼️', color: '#7a9ea8' },
  { key: 'themeRestoration', label: '主题契合', icon: '🎯', color: '#c9a86c' },
  { key: 'emotionRestoration', label: '情感共鸣', icon: '💗', color: '#c56b6b' },
  { key: 'structureRestoration', label: '结构呼应', icon: '🏗️', color: '#7ca97c' },
  { key: 'styleRestoration', label: '风格韵味', icon: '✨', color: '#a87ac9' }
])

const preservedImageries = computed(() => 
  props.result.analysis.imageryDeviations.filter(d => d.present)
)

const missingImageries = computed(() => 
  props.result.analysis.imageryDeviations.filter(d => !d.present)
)

const getDeviationColor = (d: ImageryDeviation): string => {
  switch (d.deviationType) {
    case 'preserved': return '#7ca97c'
    case 'transformed': return '#c9a86c'
    case 'missing': return '#c56b6b'
    default: return 'var(--text-muted)'
  }
}

const getDeviationLabel = (d: ImageryDeviation): string => {
  switch (d.deviationType) {
    case 'preserved': return '保留'
    case 'transformed': return '转化'
    case 'missing': return '缺失'
    default: return ''
  }
}

const getStructuralColor = (d: StructuralDeviation): string => {
  if (d.deviationDegree < 0.3) return '#7ca97c'
  if (d.deviationDegree < 0.5) return '#c9a86c'
  return '#c56b6b'
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case '神品': return '#ffd700'
    case '妙品': return '#a87ac9'
    case '佳品': return '#7a9ea8'
    case '能品': return '#7ca97c'
    default: return 'var(--text-muted)'
  }
}
</script>

<template>
  <div class="settlement-overlay" @click.self="emit('close')">
    <div class="settlement-panel" :style="{ '--accent-color': poem.accentColor }">
      <div class="settlement-header">
        <div class="header-decoration"></div>
        <div class="result-badge" v-if="result.isFirstClear">
          <span>🎉</span>
          <span>首次重构成功！</span>
        </div>
        <div class="result-badge new-record" v-else-if="result.isNewRecord">
          <span>🏆</span>
          <span>新纪录！</span>
        </div>

        <div class="poem-identity">
          <span class="poem-icon">{{ poem.icon }}</span>
          <div>
            <h2 class="poem-title">{{ poem.title }}</h2>
            <p class="poem-author">{{ poem.dynasty }} · {{ poem.author }}</p>
          </div>
        </div>

        <div class="grade-display" :style="{ color: getGradeColor(result.score.grade) }">
          <span class="grade-label">评级</span>
          <span class="grade-value">{{ result.score.grade }}</span>
          <div class="stars-row">
            <span v-for="i in 3" :key="i" class="star" :class="{ filled: i <= result.score.stars }">★</span>
          </div>
        </div>

        <div class="total-score-display">
          <span class="total-score-label">复原评分</span>
          <div class="total-score-value" :style="{ color: poem.accentColor }">
            {{ result.score.total }}
            <span class="score-unit">分</span>
          </div>
          <div class="time-info">
            用时 {{ formatTime(result.timeUsedSeconds) }}
          </div>
        </div>
      </div>

      <div class="settlement-body">
        <div class="dimensions-section">
          <h3 class="section-heading">📊 五维评分</h3>
          <div class="dimensions-grid">
            <div 
              v-for="dim in scoreDimensions" 
              :key="dim.key"
              class="dimension-card"
              :style="{ '--dim-color': dim.color }"
            >
              <div class="dim-header">
                <span class="dim-icon">{{ dim.icon }}</span>
                <span class="dim-label">{{ dim.label }}</span>
                <span class="dim-score" :style="{ color: dim.color }">
                  {{ (result.score as any)[dim.key] }}
                </span>
              </div>
              <div class="dim-bar">
                <div 
                  class="dim-bar-fill"
                  :style="{ 
                    width: (result.score as any)[dim.key] + '%',
                    background: `linear-gradient(90deg, ${dim.color}, ${dim.color}dd)`
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="analysis-sections">
          <div class="analysis-section imagery-analysis">
            <div class="analysis-header">
              <h3 class="section-heading">🖼️ 意象偏差分析</h3>
              <div class="analysis-summary">
                <span class="summary-item preserved">{{ preservedImageries.length }} 保留</span>
                <span class="summary-divider">/</span>
                <span class="summary-item missing">{{ missingImageries.length }} 缺失</span>
              </div>
            </div>
            <div class="imagery-list">
              <div 
                v-for="d in result.analysis.imageryDeviations" 
                :key="d.originalImagery"
                class="imagery-item"
                :class="d.deviationType"
              >
                <div class="imagery-main">
                  <span class="imagery-name" :style="{ color: getDeviationColor(d) }">
                    {{ d.originalImagery }}
                  </span>
                  <span class="imagery-status" :style="{ background: getDeviationColor(d) + '25', color: getDeviationColor(d) }">
                    {{ getDeviationLabel(d) }}
                  </span>
                </div>
                <div v-if="d.matchedPhrase" class="imagery-match">
                  匹配：<span class="match-phrase">{{ d.matchedPhrase }}</span>
                </div>
                <div v-else-if="d.deviationType === 'missing'" class="imagery-missing-hint">
                  💡 可尝试加入相关意象，如"{{ d.originalImagery }}"或其变体
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-col-row">
            <div class="analysis-section">
              <h3 class="section-heading">🎯 主题契合</h3>
              <div class="theme-analysis-card">
                <div class="theme-match-score" :style="{ color: result.analysis.themeDeviation.matchDegree >= 0.7 ? '#7ca97c' : result.analysis.themeDeviation.matchDegree >= 0.4 ? '#c9a86c' : '#c56b6b' }">
                  契合度 {{ Math.round(result.analysis.themeDeviation.matchDegree * 100) }}%
                </div>
                <div class="theme-original">原作主旨：{{ result.analysis.themeDeviation.originalTheme }}</div>
                <div v-if="result.analysis.themeDeviation.currentThemes.length > 0" class="theme-current">
                  <span class="theme-label">呈现主题：</span>
                  <span 
                    v-for="t in result.analysis.themeDeviation.currentThemes.slice(0, 5)" 
                    :key="t"
                    class="theme-chip"
                  >
                    {{ t }}
                  </span>
                </div>
                <div v-if="result.analysis.themeDeviation.missingElements.length > 0" class="theme-missing">
                  <span class="missing-label">缺失关键词：</span>
                  <span 
                    v-for="m in result.analysis.themeDeviation.missingElements" 
                    :key="m"
                    class="missing-chip"
                  >
                    {{ m }}
                  </span>
                </div>
                <div v-if="result.analysis.themeDeviation.extraElements.length > 0" class="theme-extra">
                  <span class="extra-label">额外融入：</span>
                  <span 
                    v-for="e in result.analysis.themeDeviation.extraElements.slice(0, 4)" 
                    :key="e"
                    class="extra-chip"
                  >
                    {{ e }}
                  </span>
                </div>
              </div>
            </div>

            <div class="analysis-section">
              <h3 class="section-heading">💗 情感还原</h3>
              <div class="emotion-analysis-card">
                <div class="emotion-match-score" :style="{ color: result.analysis.emotionDeviation.matchDegree >= 0.7 ? '#7ca97c' : result.analysis.emotionDeviation.matchDegree >= 0.4 ? '#c9a86c' : '#c56b6b' }">
                  还原度 {{ Math.round(result.analysis.emotionDeviation.matchDegree * 100) }}%
                </div>
                <div class="emotion-original">
                  <span class="emo-label">原作基调：</span>
                  <span class="emo-chip original">{{ result.analysis.emotionDeviation.originalEmotion }}</span>
                </div>
                <div v-if="result.analysis.emotionDeviation.currentEmotions.length > 0" class="emotion-current">
                  <span class="emo-label">作品情感：</span>
                  <span 
                    v-for="e in result.analysis.emotionDeviation.currentEmotions" 
                    :key="e"
                    class="emo-chip"
                  >
                    {{ e }}
                  </span>
                </div>
                <div class="emotion-shift">
                  强度偏差：
                  <span :class="{ positive: result.analysis.emotionDeviation.intensityShift < 0.2, warning: result.analysis.emotionDeviation.intensityShift >= 0.2 }">
                    {{ result.analysis.emotionDeviation.intensityShift <= 0.1 ? '恰到好处' : 
                       result.analysis.emotionDeviation.intensityShift < 0.3 ? '略有偏差' : 
                       result.analysis.emotionDeviation.intensityShift < 0.5 ? '偏差较大' : '偏离明显' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="analysis-section structure-analysis">
            <h3 class="section-heading">🏗️ 结构与风格</h3>
            <div class="structure-grid">
              <div 
                v-for="s in result.analysis.structuralDeviations" 
                :key="s.structuralAspect"
                class="structure-item"
              >
                <div class="struct-header">
                  <span class="struct-name">{{ s.structuralAspect }}</span>
                  <span class="struct-degree" :style="{ color: getStructuralColor(s) }">
                    {{ s.deviationDegree < 0.3 ? '良好' : s.deviationDegree < 0.5 ? '中等' : '待改进' }}
                  </span>
                </div>
                <div class="struct-patterns">
                  <div><span class="pat-label">原作：</span>{{ s.originalPattern }}</div>
                  <div><span class="pat-label">当前：</span>{{ s.currentPattern }}</div>
                </div>
                <div class="struct-suggestion">💡 {{ s.suggestion }}</div>
              </div>
            </div>
          </div>

          <div class="analysis-section style-analysis">
            <h3 class="section-heading">✨ 语言风格</h3>
            <div class="style-card">
              <div class="style-score">
                风格匹配度：
                <span :style="{ color: result.analysis.lexicalStyle.styleMatch >= 0.7 ? '#7ca97c' : result.analysis.lexicalStyle.styleMatch >= 0.4 ? '#c9a86c' : '#c56b6b' }">
                  {{ Math.round(result.analysis.lexicalStyle.styleMatch * 100) }}%
                </span>
              </div>
              <div v-if="result.analysis.lexicalStyle.anachronismWords.length > 0" class="style-warnings">
                <span class="warning-icon">⚠️</span>
                出现现代词汇：
                <span 
                  v-for="w in result.analysis.lexicalStyle.anachronismWords" 
                  :key="w"
                  class="anachronism-word"
                >
                  {{ w }}
                </span>
              </div>
              <div class="style-vocab">
                <div class="vocab-col">
                  <span class="vocab-label">原作词汇参考：</span>
                  <div class="vocab-chips">
                    <span 
                      v-for="v in result.analysis.lexicalStyle.originalVocabulary.slice(0, 6)" 
                      :key="v"
                      class="vocab-chip original"
                    >
                      {{ v }}
                    </span>
                  </div>
                </div>
                <div class="vocab-col">
                  <span class="vocab-label">你的用词：</span>
                  <div class="vocab-chips">
                    <span 
                      v-for="v in result.analysis.lexicalStyle.currentVocabulary.slice(0, 6)" 
                      :key="v"
                      class="vocab-chip"
                    >
                      {{ v }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="result.bonusTitles.length > 0" class="titles-section">
          <h3 class="section-heading">🏅 获得称号</h3>
          <div class="titles-row">
            <div 
              v-for="title in result.bonusTitles" 
              :key="title"
              class="earned-title-card"
            >
              <span class="title-badge-icon">🎖️</span>
              <span class="title-name">{{ title }}</span>
            </div>
          </div>
        </div>

        <div class="composition-section">
          <h3 class="section-heading">📝 你的重构作品</h3>
          <div class="composition-display">
            <div class="composition-phrases">
              <span 
                v-for="p in result.phrases" 
                :key="p.id"
                class="comp-phrase"
              >
                {{ p.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="settlement-footer">
        <button class="footer-btn secondary" @click="emit('backToList')">
          <span>📚</span>
          <span>返回名篇列表</span>
        </button>
        <button class="footer-btn primary" :style="{ background: `linear-gradient(135deg, ${poem.accentColor}, ${poem.accentColor}cc)` }" @click="emit('retry')">
          <span>🔄</span>
          <span>再次挑战</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settlement-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 14, 0.92);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 230;
  padding: 24px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settlement-panel {
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.settlement-header {
  padding: 28px 36px 24px;
  background: 
    radial-gradient(ellipse at top right, color-mix(in srgb, var(--accent-color) 12%, transparent), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
  border-bottom: 1px solid var(--border);
  position: relative;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(124, 169, 124, 0.15);
  border: 1px solid rgba(124, 169, 124, 0.35);
  border-radius: 20px;
  font-size: 13px;
  color: #9ac49a;
  margin-bottom: 18px;
  animation: pulse 2s ease-in-out infinite;
}

.result-badge.new-record {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: #e0c89a;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 169, 124, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(124, 169, 124, 0); }
}

.poem-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.poem-icon {
  font-size: 48px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  border: 1px solid var(--border);
}

.poem-title {
  font-family: var(--font-brush);
  font-size: 32px;
  color: var(--text-primary);
  letter-spacing: 4px;
  margin: 0 0 4px 0;
}

.poem-author {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.grade-display {
  position: absolute;
  top: 28px;
  right: 200px;
  text-align: center;
}

.grade-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  letter-spacing: 2px;
}

.grade-value {
  font-family: var(--font-brush);
  font-size: 42px;
  line-height: 1;
  letter-spacing: 6px;
  margin-bottom: 6px;
  display: block;
}

.stars-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.star {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.1);
}

.star.filled {
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
  animation: starPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
}

.star.filled:nth-child(1) { animation-delay: 0.2s; }
.star.filled:nth-child(2) { animation-delay: 0.3s; }
.star.filled:nth-child(3) { animation-delay: 0.4s; }

@keyframes starPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.total-score-display {
  position: absolute;
  top: 28px;
  right: 36px;
  text-align: right;
}

.total-score-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  letter-spacing: 2px;
}

.total-score-value {
  font-family: var(--font-brush);
  font-size: 56px;
  line-height: 1;
  letter-spacing: 2px;
  font-weight: bold;
}

.score-unit {
  font-size: 18px;
  opacity: 0.7;
  margin-left: 4px;
}

.time-info {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.settlement-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 36px;
}

.section-heading {
  font-family: var(--font-brush);
  font-size: 17px;
  color: var(--text-primary);
  letter-spacing: 1.5px;
  margin: 0 0 14px 0;
}

.dimensions-section {
  margin-bottom: 26px;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.dimension-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.dimension-card:hover {
  border-color: color-mix(in srgb, var(--dim-color) 30%, transparent);
  transform: translateY(-2px);
}

.dim-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.dim-icon {
  font-size: 16px;
}

.dim-label {
  font-size: 12px;
  color: var(--text-muted);
  flex: 1;
}

.dim-score {
  font-family: var(--font-brush);
  font-size: 16px;
  font-weight: bold;
}

.dim-bar {
  height: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.dim-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.analysis-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.analysis-header .section-heading {
  margin: 0;
}

.analysis-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.summary-item.preserved {
  color: #7ca97c;
}

.summary-item.missing {
  color: #c56b6b;
}

.summary-divider {
  color: var(--text-muted);
}

.imagery-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.imagery-item {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.imagery-item.preserved {
  border-left: 3px solid #7ca97c;
}

.imagery-item.transformed {
  border-left: 3px solid #c9a86c;
}

.imagery-item.missing {
  border-left: 3px solid #c56b6b;
  opacity: 0.85;
}

.imagery-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.imagery-name {
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 1px;
}

.imagery-status {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
}

.imagery-match {
  font-size: 12px;
  color: var(--text-muted);
}

.match-phrase {
  color: var(--accent-gold);
  font-family: var(--font-serif);
}

.imagery-missing-hint {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
}

.analysis-col-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.theme-analysis-card,
.emotion-analysis-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
}

.theme-match-score,
.emotion-match-score {
  font-family: var(--font-brush);
  font-size: 22px;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.theme-original,
.emotion-original {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.theme-current,
.emotion-current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.theme-label,
.emo-label,
.missing-label,
.extra-label {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.theme-chip,
.emo-chip,
.missing-chip,
.extra-chip {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
}

.theme-chip {
  background: rgba(201, 168, 108, 0.15);
  color: #e0c89a;
}

.emo-chip {
  background: rgba(197, 107, 107, 0.15);
  color: #e09090;
}

.emo-chip.original {
  background: rgba(197, 107, 107, 0.25);
  font-weight: 500;
}

.missing-chip {
  background: rgba(197, 107, 107, 0.12);
  color: #e09090;
  opacity: 0.7;
  text-decoration: line-through;
}

.extra-chip {
  background: rgba(122, 158, 168, 0.15);
  color: #8ab8c2;
}

.theme-missing,
.theme-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.emotion-shift {
  font-size: 12px;
  color: var(--text-muted);
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.emotion-shift .positive {
  color: #7ca97c;
}

.emotion-shift .warning {
  color: #c9a86c;
}

.structure-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.structure-item {
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.struct-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.struct-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.struct-degree {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 5px;
  background: currentColor;
  opacity: 0.15;
}

.struct-patterns {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 8px;
}

.pat-label {
  opacity: 0.6;
}

.struct-suggestion {
  font-size: 11px;
  color: var(--accent-gold);
  line-height: 1.5;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.05);
}

.style-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
}

.style-score {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-secondary);
}

.style-warnings {
  padding: 10px 12px;
  background: rgba(197, 107, 107, 0.1);
  border: 1px solid rgba(197, 107, 107, 0.25);
  border-radius: 10px;
  font-size: 12px;
  color: #e09090;
  margin-bottom: 12px;
}

.warning-icon {
  margin-right: 6px;
}

.anachronism-word {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 4px;
  background: rgba(197, 107, 107, 0.2);
  border-radius: 5px;
  text-decoration: underline wavy;
  text-decoration-color: #c56b6b;
}

.style-vocab {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.vocab-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.vocab-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vocab-chip {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.vocab-chip.original {
  background: rgba(168, 122, 201, 0.12);
  color: #c9a8e0;
}

.titles-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.titles-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.earned-title-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.18), rgba(201, 168, 108, 0.05));
  border: 1px solid rgba(201, 168, 108, 0.35);
  border-radius: 14px;
  animation: titleReveal 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
}

@keyframes titleReveal {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.title-badge-icon {
  font-size: 24px;
}

.title-name {
  font-family: var(--font-brush);
  font-size: 17px;
  color: var(--accent-gold);
  letter-spacing: 2px;
}

.composition-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

.composition-display {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  text-align: center;
}

.composition-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.comp-phrase {
  padding: 8px 16px;
  background: rgba(201, 168, 108, 0.1);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 10px;
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.settlement-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 36px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-family: var(--font-serif);
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.footer-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.footer-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.footer-btn.primary {
  color: #1a1a2e;
  font-weight: 500;
}

.footer-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

@media (max-width: 900px) {
  .dimensions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analysis-col-row {
    grid-template-columns: 1fr;
  }
  
  .structure-grid {
    grid-template-columns: 1fr;
  }
  
  .grade-display {
    position: static;
    margin-bottom: 16px;
  }
  
  .total-score-display {
    position: static;
    text-align: left;
    margin-bottom: 10px;
  }
  
  .imagery-list {
    grid-template-columns: 1fr;
  }
  
  .style-vocab {
    grid-template-columns: 1fr;
  }
  
  .settlement-header {
    padding: 20px;
  }
  
  .settlement-body {
    padding: 18px 20px;
  }
  
  .settlement-footer {
    padding: 14px 20px;
  }
}
</style>
