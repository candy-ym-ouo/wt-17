<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CipaiTemplate, CipaiScoringMode, Phrase, CipaiScoreBreakdown, CipaiCheckResult, CipaiRecommendation } from '@/types'
import { cipaiTemplates, cipaiScoringRuleSets, getDifficultyLabel, getDifficultyColor } from '@/data/cipaiTemplates'
import { calculateCipaiScore, phrasesToLines, generateCipaiRecommendations, checkCipaiLine, getToneOfChar } from '@/utils/cipaiWorkshop'

interface Props {
  phrases: Phrase[]
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'selectCipai', cipai: CipaiTemplate): void
  (e: 'changeScoringMode', mode: CipaiScoringMode): void
}>()

const selectedCipaiId = ref<string>(cipaiTemplates[0]?.id || '')
const scoringMode = ref<CipaiScoringMode>('standard')
const showExample = ref(false)
const activeTab = ref<'template' | 'guide'>('template')

const selectedCipai = computed((): CipaiTemplate | undefined => {
  return cipaiTemplates.find(c => c.id === selectedCipaiId.value)
})

const currentRuleSet = computed(() => {
  return cipaiScoringRuleSets.find(r => r.mode === scoringMode.value)
})

const lines = computed(() => phrasesToLines(props.phrases))

const cipaiScore = computed((): CipaiScoreBreakdown => {
  if (!selectedCipai.value || !currentRuleSet.value) {
    return { formMatch: 0, tonePattern: 0, rhyme: 0, rhythm: 0, total: 0 }
  }
  return calculateCipaiScore(lines.value, selectedCipai.value, currentRuleSet.value)
})

const checkResults = computed((): CipaiCheckResult[] => {
  if (!selectedCipai.value || !currentRuleSet.value) return []
  
  const results: CipaiCheckResult[] = []
  const rhymeChars: string[] = []
  
  for (let i = 0; i < selectedCipai.value.lines.length; i++) {
    const line = selectedCipai.value.lines[i]
    const text = lines.value[i] || ''
    const result = checkCipaiLine(text, line, currentRuleSet.value, rhymeChars)
    results.push(result)
    if (line.rhyme && text.length > 0) {
      rhymeChars.push(text[text.length - 1])
    }
  }
  
  return results
})

const recommendations = computed((): CipaiRecommendation[] => {
  if (!selectedCipai.value || !currentRuleSet.value) return []
  return generateCipaiRecommendations(lines.value, selectedCipai.value, props.phrases, currentRuleSet.value)
})

const currentLineIndex = computed(() => {
  const idx = lines.value.findIndex(l => l.length === 0)
  return idx === -1 ? lines.value.length : idx
})

const getToneLabel = (tone: string): string => {
  if (tone === 'ping') return '平'
  if (tone === 'ze') return '仄'
  return '·'
}

const getToneClass = (tone: string): string => {
  if (tone === 'ping') return 'tone-ping'
  if (tone === 'ze') return 'tone-ze'
  return 'tone-any'
}

const getLineStatusClass = (result: CipaiCheckResult): string => {
  if (result.errors.length > 0) return 'status-error'
  if (result.warnings.length > 0) return 'status-warning'
  return 'status-ok'
}

const handleSelectCipai = (cipai: CipaiTemplate) => {
  selectedCipaiId.value = cipai.id
  emit('selectCipai', cipai)
}

const handleScoringModeChange = (mode: CipaiScoringMode) => {
  scoringMode.value = mode
  emit('changeScoringMode', mode)
}

const groupedTemplates = computed(() => {
  const groups: Record<string, CipaiTemplate[]> = {
    easy: [],
    medium: [],
    hard: [],
  }
  cipaiTemplates.forEach(t => {
    if (groups[t.difficulty]) {
      groups[t.difficulty].push(t)
    }
  })
  return groups
})

const scoreGrade = computed(() => {
  const total = cipaiScore.value.total
  if (total >= 90) return { label: '工稳', color: '#c9a86c' }
  if (total >= 75) return { label: '合律', color: '#5b7a8c' }
  if (total >= 60) return { label: '尚可', color: '#a8a498' }
  return { label: '待酌', color: '#6b6858' }
})

watch(() => props.visible, (val) => {
  if (val && !selectedCipaiId.value && cipaiTemplates.length > 0) {
    selectedCipaiId.value = cipaiTemplates[0].id
  }
})
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="cipai-workshop-overlay" @click.self="emit('close')">
      <div class="cipai-workshop-panel">
        <div class="panel-header">
          <div class="header-title">
            <span class="title-icon">✦</span>
            <span class="title-text">词牌工坊</span>
          </div>
          <button class="close-btn" @click="emit('close')">
            <span>✕</span>
          </button>
        </div>
        
        <div class="panel-body">
          <div class="workshop-sidebar">
            <div class="sidebar-section">
              <div class="section-title">词牌选择</div>
              
              <div class="difficulty-group">
                <div 
                  v-for="(diffTemplates, diff) in groupedTemplates" 
                  :key="diff"
                  class="difficulty-block"
                >
                  <div class="difficulty-label" :style="{ color: getDifficultyColor(diff) }">
                    {{ getDifficultyLabel(diff) }}
                  </div>
                  <div class="cipai-list">
                    <button
                      v-for="cipai in diffTemplates"
                      :key="cipai.id"
                      class="cipai-item-btn"
                      :class="{ active: selectedCipaiId === cipai.id }"
                      @click="handleSelectCipai(cipai)"
                    >
                      <span class="cipai-name">{{ cipai.name }}</span>
                      <span class="cipai-meta">{{ cipai.totalLines }}句·{{ cipai.totalChars }}字</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="sidebar-section">
              <div class="section-title">评分模式</div>
              <div class="scoring-mode-list">
                <button
                  v-for="rule in cipaiScoringRuleSets"
                  :key="rule.mode"
                  class="mode-btn"
                  :class="{ active: scoringMode === rule.mode }"
                  @click="handleScoringModeChange(rule.mode as CipaiScoringMode)"
                >
                  <span class="mode-label">{{ rule.label }}</span>
                  <span class="mode-desc">{{ rule.description }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="workshop-main">
            <div v-if="selectedCipai" class="cipai-detail">
              <div class="detail-header">
                <div class="cipai-title-row">
                  <h2 class="cipai-title">{{ selectedCipai.name }}</h2>
                  <span 
                    class="difficulty-badge"
                    :style="{ background: getDifficultyColor(selectedCipai.difficulty) }"
                  >
                    {{ getDifficultyLabel(selectedCipai.difficulty) }}
                  </span>
                </div>
                <p v-if="selectedCipai.alias" class="cipai-alias">又名：{{ selectedCipai.alias }}</p>
                <p class="cipai-desc">{{ selectedCipai.description }}</p>
                <p v-if="selectedCipai.origin" class="cipai-origin">出处：{{ selectedCipai.origin }}</p>
              </div>
              
              <div class="detail-tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: activeTab === 'template' }"
                  @click="activeTab = 'template'"
                >
                  格律模板
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: activeTab === 'guide' }"
                  @click="activeTab = 'guide'"
                >
                  创作指南
                </button>
              </div>
              
              <div class="detail-content">
                <div v-if="activeTab === 'template'" class="template-view">
                  <div class="template-info">
                    <div class="info-item">
                      <span class="info-label">句式</span>
                      <span class="info-value">{{ selectedCipai.totalLines }}句</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">字数</span>
                      <span class="info-value">{{ selectedCipai.totalChars }}字</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">韵脚</span>
                      <span class="info-value">{{ selectedCipai.lines.filter(l => l.rhyme).length }}处</span>
                    </div>
                  </div>
                  
                  <div class="pattern-display">
                    <div class="pattern-header">
                      <span class="pattern-label">平仄谱</span>
                      <div class="tone-legend">
                        <span class="legend-item"><span class="tone-dot tone-ping"></span>平</span>
                        <span class="legend-item"><span class="tone-dot tone-ze"></span>仄</span>
                        <span class="legend-item"><span class="tone-dot tone-any"></span>中</span>
                      </div>
                    </div>
                    
                    <div class="pattern-lines">
                      <div 
                        v-for="(line, idx) in selectedCipai.lines" 
                        :key="idx"
                        class="pattern-line"
                        :class="{ 
                          'line-rhyme': line.rhyme,
                          'line-current': idx === currentLineIndex 
                        }"
                      >
                        <div class="line-number">{{ idx + 1 }}</div>
                        <div class="line-content">
                          <div class="tone-pattern">
                            <span 
                              v-for="(tone, ti) in line.tonePattern" 
                              :key="ti"
                              class="tone-char"
                              :class="getToneClass(tone)"
                            >
                              {{ getToneLabel(tone) }}
                            </span>
                          </div>
                          <div v-if="lines[idx]" class="actual-text">
                            <span 
                              v-for="(char, ci) in lines[idx]" 
                              :key="ci"
                              class="text-char"
                              :class="{ 
                                'tone-match': checkResults[idx]?.toneMatches[ci],
                                'tone-mismatch': checkResults[idx] && !checkResults[idx].toneMatches[ci]
                              }"
                            >
                              {{ char }}
                              <span class="char-tone">{{ getToneLabel(getToneOfChar(char)) }}</span>
                            </span>
                          </div>
                          <div v-else class="placeholder-text">
                            <span v-for="n in line.charCount" :key="n" class="placeholder-char">□</span>
                          </div>
                        </div>
                        <div class="line-meta">
                          <span class="char-count">{{ line.charCount }}字</span>
                          <span v-if="line.rhyme" class="rhyme-mark">韵</span>
                          <span v-if="line.description" class="line-desc">{{ line.description }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="selectedCipai.example" class="example-section">
                    <button class="example-toggle" @click="showExample = !showExample">
                      <span class="toggle-icon">{{ showExample ? '▾' : '▸' }}</span>
                      <span>范例：{{ selectedCipai.example.title }}</span>
                    </button>
                    <Transition name="expand">
                      <div v-if="showExample" class="example-content">
                        <p class="example-author">—— {{ selectedCipai.example.author }}</p>
                        <div class="example-lines">
                          <p v-for="(line, idx) in selectedCipai.example.content" :key="idx" class="example-line">
                            {{ line }}
                          </p>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
                
                <div v-else class="guide-view">
                  <div class="score-overview">
                    <div class="score-ring">
                      <svg class="ring-svg" viewBox="0 0 120 120">
                        <circle class="ring-bg" cx="60" cy="60" r="50" fill="none" stroke-width="8" />
                        <circle 
                          class="ring-fill" 
                          cx="60" cy="60" r="50" 
                          fill="none" stroke-width="8"
                          stroke-dasharray="314"
                          :stroke-dashoffset="314 - (cipaiScore.total / 100) * 314"
                          :stroke="scoreGrade.color"
                        />
                      </svg>
                      <div class="score-inner">
                        <div class="score-value">{{ cipaiScore.total }}</div>
                        <div class="score-grade" :style="{ color: scoreGrade.color }">{{ scoreGrade.label }}</div>
                      </div>
                    </div>
                    
                    <div class="score-dimensions">
                      <div class="dim-item">
                        <div class="dim-label">句式合规</div>
                        <div class="dim-bar">
                          <div class="dim-fill" :style="{ width: cipaiScore.formMatch + '%' }"></div>
                        </div>
                        <div class="dim-value">{{ cipaiScore.formMatch }}</div>
                      </div>
                      <div class="dim-item">
                        <div class="dim-label">平仄协调</div>
                        <div class="dim-bar">
                          <div class="dim-fill" :style="{ width: cipaiScore.tonePattern + '%' }"></div>
                        </div>
                        <div class="dim-value">{{ cipaiScore.tonePattern }}</div>
                      </div>
                      <div class="dim-item">
                        <div class="dim-label">韵脚和谐</div>
                        <div class="dim-bar">
                          <div class="dim-fill" :style="{ width: cipaiScore.rhyme + '%' }"></div>
                        </div>
                        <div class="dim-value">{{ cipaiScore.rhyme }}</div>
                      </div>
                      <div class="dim-item">
                        <div class="dim-label">节奏韵律</div>
                        <div class="dim-bar">
                          <div class="dim-fill" :style="{ width: cipaiScore.rhythm + '%' }"></div>
                        </div>
                        <div class="dim-value">{{ cipaiScore.rhythm }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="check-results">
                    <div class="results-title">逐句校验</div>
                    <div class="results-list">
                      <div 
                        v-for="(result, idx) in checkResults" 
                        :key="idx"
                        class="result-item"
                        :class="getLineStatusClass(result)"
                      >
                        <div class="result-line-num">第{{ idx + 1 }}句</div>
                        <div class="result-line-text">{{ lines[idx] || '（待填）' }}</div>
                        <div class="result-line-meta">
                          <span>应{{ result.expectedCharCount }}字，实{{ result.actualCharCount }}字</span>
                          <span v-if="selectedCipai?.lines[idx]?.rhyme" class="rhyme-tag">韵</span>
                        </div>
                        <div v-if="result.errors.length > 0" class="result-errors">
                          <span v-for="(err, ei) in result.errors" :key="ei" class="error-tag">✗ {{ err }}</span>
                        </div>
                        <div v-if="result.warnings.length > 0" class="result-warnings">
                          <span v-for="(warn, wi) in result.warnings" :key="wi" class="warning-tag">△ {{ warn }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="recommendations.length > 0" class="recommendations">
                    <div class="rec-title">选词推荐</div>
                    <div class="rec-list">
                      <div 
                        v-for="(rec, idx) in recommendations" 
                        :key="idx"
                        class="rec-item"
                        :class="`priority-${rec.priority}`"
                      >
                        <div class="rec-header">
                          <span class="rec-type">{{ rec.type === 'char_count' ? '句式' : rec.type === 'rhyme' ? '韵脚' : rec.type === 'tone' ? '平仄' : '意象' }}</span>
                          <span class="rec-desc">{{ rec.description }}</span>
                        </div>
                        <div class="rec-suggestions">
                          <span 
                            v-for="(sug, si) in rec.suggestions" 
                            :key="si"
                            class="suggestion-chip"
                          >
                            {{ sug }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cipai-workshop-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.cipai-workshop-panel {
  width: 900px;
  max-width: 95vw;
  height: 80vh;
  max-height: 700px;
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
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  color: var(--accent-gold);
  font-size: 18px;
}

.title-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-brush);
  font-size: 22px;
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

.panel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.workshop-sidebar {
  width: 260px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.difficulty-block {
  margin-bottom: 16px;
}

.difficulty-block:last-child {
  margin-bottom: 0;
}

.difficulty-label {
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
}

.cipai-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cipai-item-btn {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 6px;
  text-align: left;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.cipai-item-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.cipai-item-btn.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
}

.cipai-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.cipai-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.scoring-mode-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 6px;
  text-align: left;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: var(--accent-gold);
}

.mode-btn.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
}

.mode-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.mode-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.4;
}

.workshop-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cipai-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.cipai-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cipai-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-brush);
  font-size: 30px;
}

.difficulty-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  opacity: 0.9;
}

.cipai-alias {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.cipai-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
  line-height: 1.6;
}

.cipai-origin {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
  font-style: italic;
}

.detail-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.template-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.template-info {
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.info-value {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.pattern-display {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.pattern-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pattern-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.tone-legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.tone-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.tone-dot.tone-ping {
  background: #5b7a8c;
}

.tone-dot.tone-ze {
  background: #8b4557;
}

.tone-dot.tone-any {
  background: var(--text-muted);
}

.pattern-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pattern-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.pattern-line.line-current {
  background: rgba(201, 168, 108, 0.1);
  border: 1px solid var(--accent-gold);
}

.pattern-line.line-rhyme {
  border-left: 3px solid var(--accent-gold);
}

.line-number {
  width: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

.line-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tone-pattern {
  display: flex;
  gap: 4px;
}

.tone-char {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  border-radius: 3px;
  color: #fff;
}

.tone-char.tone-ping {
  background: #5b7a8c;
}

.tone-char.tone-ze {
  background: #8b4557;
}

.tone-char.tone-any {
  background: var(--text-muted);
  opacity: 0.6;
}

.actual-text {
  display: flex;
  gap: 4px;
}

.text-char {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  position: relative;
}

.text-char.tone-match {
  color: var(--accent-gold);
}

.text-char.tone-mismatch {
  color: var(--accent-red);
}

.char-tone {
  position: absolute;
  bottom: -12px;
  font-size: 9px;
  color: var(--text-muted);
}

.placeholder-text {
  display: flex;
  gap: 4px;
}

.placeholder-char {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-muted);
  opacity: 0.4;
}

.line-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.char-count {
  color: var(--text-muted);
}

.rhyme-mark {
  padding: 1px 6px;
  background: var(--accent-gold);
  color: #fff;
  border-radius: 3px;
  font-size: 10px;
}

.line-desc {
  color: var(--text-muted);
}

.example-section {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.example-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.example-toggle:hover {
  color: var(--accent-gold);
}

.toggle-icon {
  font-size: 10px;
}

.example-content {
  margin-top: 12px;
  padding: 16px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 6px;
  border-left: 3px solid var(--accent-gold);
}

.example-author {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-align: right;
}

.example-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.example-line {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.8;
}

.guide-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.score-overview {
  display: flex;
  gap: 24px;
  align-items: center;
}

.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.ring-fill {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.score-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
}

.score-grade {
  font-size: 12px;
  margin-top: 2px;
}

.score-dimensions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dim-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dim-label {
  width: 70px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dim-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.dim-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), #e8c996);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.dim-value {
  width: 36px;
  text-align: right;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.check-results {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.results-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 12px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.result-item.status-error {
  border-color: rgba(139, 69, 87, 0.5);
  background: rgba(139, 69, 87, 0.1);
}

.result-item.status-warning {
  border-color: rgba(201, 168, 108, 0.3);
  background: rgba(201, 168, 108, 0.08);
}

.result-item.status-ok {
  border-color: rgba(91, 122, 140, 0.3);
  background: rgba(91, 122, 140, 0.08);
}

.result-line-num {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.result-line-text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.result-line-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.rhyme-tag {
  padding: 1px 6px;
  background: var(--accent-gold);
  color: #fff;
  border-radius: 3px;
  font-size: 10px;
}

.result-errors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.error-tag {
  padding: 2px 8px;
  background: rgba(139, 69, 87, 0.2);
  color: #c9788a;
  border-radius: 4px;
  font-size: 11px;
}

.result-warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.warning-tag {
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border-radius: 4px;
  font-size: 11px;
}

.recommendations {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.rec-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 12px;
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rec-item {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.rec-item.priority-high {
  border-color: rgba(201, 168, 108, 0.4);
  background: rgba(201, 168, 108, 0.05);
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.rec-type {
  padding: 2px 8px;
  background: var(--accent-gold);
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
}

.rec-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.rec-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-chip {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
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
