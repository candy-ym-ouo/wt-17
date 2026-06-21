<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ScoreBreakdown, DiagnosticReport, Phrase, Chapter, PhraseRarity } from '@/types'
import { getScoreGrade, generateDiagnosticReport } from '@/utils/scoring'
import { rarityLabels, rarityColors, rarityScoreBonus } from '@/data/phrases'

interface Props {
  score: ScoreBreakdown
  phrasesCount: number
  targetCount: number
  weightBoosts?: Record<string, number>
  phrases?: Phrase[]
  chapter?: Chapter | null
}

const props = defineProps<Props>()

const isDiagnosticMode = ref(false)
const activeDiagnosticTab = ref<'loss' | 'theme' | 'balance' | 'layout' | 'revision'>('loss')

const grade = computed(() => getScoreGrade(props.score.total))

const bars = computed(() => {
  const boosts = props.weightBoosts || {}
  return [
    { label: '连贯性', value: props.score.coherence, color: '#5b7a8c', boost: boosts.coherence || 0, key: 'coherence' },
    { label: '意象', value: props.score.imagery, color: '#7a5b8c', boost: boosts.imagery || 0, key: 'imagery' },
    { label: '韵律', value: props.score.rhythm, color: '#c9a86c', boost: boosts.rhythm || 0, key: 'rhythm' },
    { label: '契合', value: props.score.themeMatch, color: '#8b4557', boost: boosts.themeMatch || 0, key: 'themeMatch' },
  ]
})

const hasBoosts = computed(() => {
  const boosts = props.weightBoosts || {}
  return Object.keys(boosts).length > 0
})

const rarityStats = computed(() => {
  if (!props.phrases || props.phrases.length === 0) {
    return {
      distribution: {} as Record<PhraseRarity, number>,
      avgBonus: 0,
      hasRare: false
    }
  }
  
  const distribution: Record<PhraseRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  }
  
  let totalBonus = 0
  props.phrases.forEach(p => {
    distribution[p.rarity]++
    totalBonus += rarityScoreBonus[p.rarity] || 0
  })
  
  return {
    distribution,
    avgBonus: totalBonus / props.phrases.length,
    hasRare: distribution.rare > 0 || distribution.epic > 0 || distribution.legendary > 0
  }
})

const diagnosticReport = computed<DiagnosticReport | null>(() => {
  if (!props.chapter || !props.phrases) return null
  return generateDiagnosticReport(
    props.phrases,
    props.chapter,
    props.score,
    props.targetCount,
    props.weightBoosts
  )
})

const totalLossPoints = computed(() => {
  if (!diagnosticReport.value) return 0
  return diagnosticReport.value.scoreLosses.reduce((sum, l) => sum + l.lossPoints, 0)
})

const toggleDiagnosticMode = () => {
  isDiagnosticMode.value = !isDiagnosticMode.value
}

const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high': return '#c96565'
    case 'medium': return '#c9a86c'
    case 'low': return '#6b8e6b'
  }
}

const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
  switch (severity) {
    case 'high': return '严重'
    case 'medium': return '中等'
    case 'low': return '轻微'
  }
}

const getPriorityColor = (priority: 'critical' | 'important' | 'enhancement') => {
  switch (priority) {
    case 'critical': return { bg: 'rgba(201, 101, 101, 0.15)', border: '#c96565', text: '#e89090' }
    case 'important': return { bg: 'rgba(201, 168, 108, 0.15)', border: '#c9a86c', text: '#d8bd86' }
    case 'enhancement': return { bg: 'rgba(107, 142, 107, 0.15)', border: '#6b8e6b', text: '#8bb38b' }
  }
}

const getPriorityLabel = (priority: 'critical' | 'important' | 'enhancement') => {
  switch (priority) {
    case 'critical': return '紧要'
    case 'important': return '重要'
    case 'enhancement': return '锦上添花'
  }
}

const getBalanceStatusColor = (status: 'balanced' | 'excess' | 'deficit') => {
  switch (status) {
    case 'balanced': return '#6b8e6b'
    case 'excess': return '#c96565'
    case 'deficit': return '#c9a86c'
  }
}

const getBalanceStatusLabel = (status: 'balanced' | 'excess' | 'deficit') => {
  switch (status) {
    case 'balanced': return '均衡'
    case 'excess': return '偏多'
    case 'deficit': return '不足'
  }
}

const dimensionColors: Record<string, string> = {
  coherence: '#5b7a8c',
  imagery: '#7a5b8c',
  rhythm: '#c9a86c',
  themeMatch: '#8b4557',
}
</script>

<template>
  <div class="score-panel">
    <div class="score-header">
      <div class="score-header-left">
      <div class="score-total">
        <span class="score-number" :style="{ color: grade.color }">{{ score.total }}</span>
        <span class="score-label">分</span>
      </div>
      </div>
      <div class="score-header-right">
        <div class="score-grade" :style="{ color: grade.color, borderColor: grade.color }">
          {{ grade.grade }}
        </div>
        <button
          v-if="phrases && chapter"
          class="diagnostic-toggle"
          :class="{ active: isDiagnosticMode }"
          @click="toggleDiagnosticMode"
        >
          <span class="toggle-icon">{{ isDiagnosticMode ? '◀' : '诊断' }}</span>
        </button>
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
            width: Math.min(phrasesCount / targetCount * 100, 100) + '%',
            background: grade.color
          }"
        ></div>
      </div>
    </div>

    <transition name="fade">
      <template v-if="!isDiagnosticMode">
        <div class="score-bars">
          <div v-for="bar in bars" :key="bar.label" class="score-bar-item">
            <div class="bar-label">
              <span class="bar-name">
                {{ bar.label }}
                <span v-if="bar.boost > 0" class="bar-boost" :style="{ color: bar.color }">
                  +{{ Math.round(bar.boost * 100) }}%
                </span>
              </span>
              <span class="bar-value" :style="{ color: bar.color }">{{ bar.value }}</span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: bar.value + '%', background: bar.color }"
              ></div>
            </div>
          </div>
        </div>
        
        <div v-if="hasBoosts" class="boost-notice">
          <span class="boost-icon">✧</span>
          <span class="boost-text">评分加成生效中</span>
        </div>
        
        <div v-if="rarityStats.hasRare && phrases && phrases.length > 0" class="rarity-notice">
          <span class="rarity-icon">◆</span>
          <span class="rarity-text">
            稀有度加成 +{{ Math.round(rarityStats.avgBonus * 100) }}%
          </span>
          <div class="rarity-mini-stats">
            <span 
              v-for="rar in (['legendary', 'epic', 'rare'] as PhraseRarity[])" 
              :key="rar"
              v-show="rarityStats.distribution[rar] > 0"
              class="rarity-mini-item"
              :style="{ color: rarityColors[rar] }"
            >
              {{ rarityLabels[rar] }}×{{ rarityStats.distribution[rar] }}
            </span>
          </div>
        </div>
        
        <div v-if="score.total > 0" class="score-comment">
          <span class="comment-icon">「</span>
          <span class="comment-text">{{ grade.comment }}</span>
          <span class="comment-icon">」</span>
        </div>
      </template>
    </transition>

    <transition name="fade">
      <template v-if="isDiagnosticMode && diagnosticReport">
        <div class="diagnostic-content">
          <div class="diagnostic-summary">
            <div class="summary-item">
              <span class="summary-value" :style="{ color: grade.color }">{{ score.total }}</span>
              <span class="summary-label">总分</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span class="summary-value" style="color: #c96565">{{ totalLossPoints }}</span>
              <span class="summary-label">可提升</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span class="summary-value" style="color: #6b8e6b">{{ diagnosticReport.scoreLosses.filter(l => l.severity === 'high').length }}</span>
              <span class="summary-label">待改进</span>
            </div>
          </div>

          <div class="overall-suggestion">
            <span class="suggestion-icon">❖</span>
            <span class="suggestion-text">{{ diagnosticReport.overallSuggestion }}</span>
          </div>

          <div class="diagnostic-tabs">
            <button
              v-for="tab in [
                { key: 'loss', label: '失分', icon: '◇' },
                { key: 'theme', label: '主题', icon: '◈' },
                { key: 'balance', label: '词类', icon: '◆' },
                { key: 'layout', label: '布局', icon: '⊞' },
                { key: 'revision', label: '改稿', icon: '❖' }
              ]"
              :key="tab.key"
              class="diagnostic-tab"
              :class="{ active: activeDiagnosticTab === tab.key }"
              @click="activeDiagnosticTab = tab.key as any"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <div class="diagnostic-tab-content">
            <transition name="slide-fade" mode="out-in">
              <div v-if="activeDiagnosticTab === 'loss'" key="loss" class="tab-panel">
                <div class="loss-analysis">
                  <div
                    v-for="loss in diagnosticReport.scoreLosses" :key="loss.dimension"
                    class="loss-item"
                  >
                    <div class="loss-header">
                      <div class="loss-dimension" :style="{ color: dimensionColors[loss.dimension] }">
                      <span class="loss-dot" :style="{ background: dimensionColors[loss.dimension] }"></span>
                      <span class="loss-name">{{ loss.dimensionLabel }}</span>
                      <span class="loss-score">{{ 100 - loss.lossPoints }}</span>
                    </div>
                    <span
                      class="loss-severity"
                      :style="{
                        color: getSeverityColor(loss.severity),
                        borderColor: getSeverityColor(loss.severity)
                      }"
                    >
                      -{{ loss.lossPoints }}
                    </span>
                    </div>
                    <div class="loss-reasons">
                      <div v-for="(reason, idx) in loss.reasons" :key="idx" class="loss-reason">
                        <span class="reason-bullet" :style="{ background: getSeverityColor(loss.severity) }"></span>
                        <span class="reason-text">{{ reason }}</span>
                      </div>
                    </div>
                    <div class="loss-bar-track">
                      <div
                        class="loss-bar-fill"
                        :style="{
                          width: (100 - loss.lossPoints) + '%',
                          background: dimensionColors[loss.dimension]
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="activeDiagnosticTab === 'theme'" key="theme" class="tab-panel">
                <div class="theme-analysis">
                  <div class="theme-status">
                    <div class="theme-status-header">
                      <span class="theme-label">主题契合度</span>
                      <span
                        class="theme-status-badge"
                        :class="{ deviated: diagnosticReport.themeDeviation.isDeviated }"
                      >
                        {{ diagnosticReport.themeDeviation.isDeviated ? '偏离' : '契合' }}
                      </span>
                    </div>
                    <div class="theme-degree-track">
                      <div
                        class="theme-degree-fill"
                        :class="{ deviated: diagnosticReport.themeDeviation.isDeviated }"
                        :style="{ width: (100 - diagnosticReport.themeDeviation.deviationDegree) + '%' }"
                      ></div>
                    </div>
                    <div class="theme-degree-labels">
                      <span>0%</span>
                      <span>偏离度 {{ diagnosticReport.themeDeviation.deviationDegree }}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div class="theme-keywords">
                    <div class="keywords-section">
                      <div class="keywords-title">
                      <span class="keywords-icon">✓</span>
                      <span>已用主题词</span>
                    </div>
                    <div class="keywords-tags">
                      <span
                        v-if="diagnosticReport.themeDeviation.currentKeywords.length === 0"
                        class="keyword-empty"
                      >暂无</span>
                      <span
                        v-for="kw in diagnosticReport.themeDeviation.currentKeywords"
                        :key="kw"
                        class="keyword-tag matched"
                      >{{ kw }}</span>
                    </div>
                  </div>

                    <div class="keywords-section">
                      <div class="keywords-title missing">
                        <span class="keywords-icon">+</span>
                        <span>推荐补充</span>
                      </div>
                      <div class="keywords-tags">
                        <span
                          v-if="diagnosticReport.themeDeviation.missingKeywords.length === 0"
                          class="keyword-empty"
                        >无需补充</span>
                        <span
                          v-for="kw in diagnosticReport.themeDeviation.missingKeywords"
                          :key="kw"
                          class="keyword-tag missing"
                        >{{ kw }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="theme-suggestion">
                    <span class="suggestion-quote">「</span>
                    <span class="suggestion-content">{{ diagnosticReport.themeDeviation.suggestion }}</span>
                    <span class="suggestion-quote">」</span>
                  </div>
                </div>
              </div>

              <div v-else-if="activeDiagnosticTab === 'balance'" key="balance" class="tab-panel">
                <div class="balance-analysis">
                  <div class="balance-overview">
                    <div class="balance-status-indicator"
                      :class="{ imbalanced: diagnosticReport.wordClassImbalance.isImbalanced }">
                      <span class="balance-indicator-icon">
                        {{ diagnosticReport.wordClassImbalance.isImbalanced ? '⚠' : '✓' }}
                      </span>
                      <span class="balance-text">{{ diagnosticReport.wordClassImbalance.suggestion }}</span>
                    </div>
                  </div>

                  <div class="balance-list">
                    <div
                      v-for="bal in diagnosticReport.wordClassImbalance.balances"
                      :key="bal.category"
                      class="balance-item"
                      :class="{
                        excess: bal.status === 'excess',
                        deficit: bal.status === 'deficit',
                        balanced: bal.status === 'balanced'
                      }"
                    >
                      <div class="balance-info">
                        <span class="balance-label">{{ bal.label }}</span>
                        <span class="balance-count">{{ bal.count }}</span>
                        <span
                          class="balance-status-tag"
                          :style="'color: ' + getBalanceStatusColor(bal.status)"
                        >{{ getBalanceStatusLabel(bal.status) }}</span>
                      </div>
                      <div class="balance-bars">
                        <div class="balance-bar-actual">
                          <div
                            class="balance-bar-fill"
                            :style="{
                              width: Math.min(bal.percentage * 100, 100) + '%',
                              background: getBalanceStatusColor(bal.status)
                            }"
                          ></div>
                        </div>
                        <div class="balance-bar-ideal">
                          <div
                            class="balance-bar-fill ideal"
                            :style="{ width: (bal.idealPercentage * 100) + '%' }"
                          ></div>
                        </div>
                      </div>
                      <div class="balance-percents">
                        <span>{{ Math.round(bal.percentage * 100) }}%</span>
                        <span class="ideal-percent">理想 {{ Math.round(bal.idealPercentage * 100) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="activeDiagnosticTab === 'layout'" key="layout" class="tab-panel">
                <div class="layout-analysis">
                  <div v-if="!diagnosticReport.layoutAnalysis.hasPositions" class="layout-empty">
                    <span class="layout-empty-icon">⊞</span>
                    <span class="layout-empty-text">词句尚未放置于画布，布局分析待激活</span>
                  </div>
                  <template v-else>
                    <div class="layout-scores">
                      <div class="layout-score-item">
                        <span class="layout-score-label">空间韵律</span>
                        <div class="layout-score-bar">
                          <div class="layout-score-fill" :style="{ width: diagnosticReport.layoutAnalysis.spatialRhythm + '%', background: '#c9a86c' }"></div>
                        </div>
                        <span class="layout-score-value" style="color: #c9a86c">{{ diagnosticReport.layoutAnalysis.spatialRhythm }}</span>
                      </div>
                      <div class="layout-score-item">
                        <span class="layout-score-label">意象布局</span>
                        <div class="layout-score-bar">
                          <div class="layout-score-fill" :style="{ width: diagnosticReport.layoutAnalysis.spatialCompleteness + '%', background: '#7a5b8c' }"></div>
                        </div>
                        <span class="layout-score-value" style="color: #7a5b8c">{{ diagnosticReport.layoutAnalysis.spatialCompleteness }}</span>
                      </div>
                      <div class="layout-score-item">
                        <span class="layout-score-label">词序连贯</span>
                        <div class="layout-score-bar">
                          <div class="layout-score-fill" :style="{ width: diagnosticReport.layoutAnalysis.wordOrderCoherence + '%', background: '#5b7a8c' }"></div>
                        </div>
                        <span class="layout-score-value" style="color: #5b7a8c">{{ diagnosticReport.layoutAnalysis.wordOrderCoherence }}</span>
                      </div>
                    </div>

                    <div class="layout-reading-order">
                      <div class="layout-section-title">
                        <span class="section-icon">→</span>
                        <span>阅读序</span>
                      </div>
                      <div class="reading-order-flow">
                        <template v-for="(text, idx) in diagnosticReport.layoutAnalysis.readingOrder" :key="idx">
                          <span class="reading-order-word">{{ text }}</span>
                          <span v-if="idx < diagnosticReport.layoutAnalysis.readingOrder.length - 1" class="reading-order-arrow">→</span>
                        </template>
                      </div>
                    </div>

                    <div v-if="diagnosticReport.layoutAnalysis.layoutIssues.length > 0" class="layout-issues">
                      <div class="layout-section-title">
                        <span class="section-icon">⚠</span>
                        <span>布局提示</span>
                      </div>
                      <div v-for="issue in diagnosticReport.layoutAnalysis.layoutIssues" :key="issue" class="layout-issue-item">
                        <span class="issue-dot"></span>
                        <span class="issue-text">{{ issue }}</span>
                      </div>
                    </div>

                    <div v-else class="layout-good">
                      <span class="layout-good-icon">✓</span>
                      <span class="layout-good-text">画布布局合理，词序与空间节奏良好</span>
                    </div>
                  </template>
                </div>
              </div>

              <div v-else-if="activeDiagnosticTab === 'revision'" key="revision" class="tab-panel">
                <div class="revision-analysis">
                  <div class="revision-path-header">
                    <div class="revision-path-title">改稿路径</div>
                  </div>
                  <div class="revision-steps">
                    <div
                      v-for="step in diagnosticReport.revisionPath"
                      :key="step.order"
                      class="revision-step"
                    >
                      <div
                      class="step-order"
                        :style="{
                          background: getPriorityColor(step.priority).bg,
                          borderColor: getPriorityColor(step.priority).border,
                          color: getPriorityColor(step.priority).text
                        }"
                      >
                        {{ step.order }}
                      </div>
                      <div class="step-content">
                        <div class="step-header">
                          <span class="step-title">{{ step.title }}</span>
                          <span
                            class="step-priority"
                            :style="{
                              background: getPriorityColor(step.priority).bg,
                              color: getPriorityColor(step.priority).text,
                              borderColor: getPriorityColor(step.priority).border
                            }"
                          >
                            {{ getPriorityLabel(step.priority) }}
                          </span>
                        </div>
                        <div class="step-description">{{ step.description }}</div>
                        <div class="step-action">
                          <span class="action-arrow">→</span>
                          <span class="action-text">{{ step.action }}</span>
                        </div>
                      </div>
                      <div
                        v-if="step.dimension"
                        class="step-dimension"
                        :style="{ background: dimensionColors[step.dimension] }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </template>
    </transition>
  </div>
</template>

<style scoped>
.score-panel {
  padding: 20px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.score-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.score-header-left {
  display: flex;
  align-items: center;
}

.score-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

.diagnostic-toggle {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.diagnostic-toggle:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.diagnostic-toggle.active {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.toggle-icon {
  font-size: 11px;
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

.bar-boost {
  font-size: 10px;
  margin-left: 4px;
  font-weight: 500;
}

.boost-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.08), rgba(201, 168, 108, 0.04));
  border-radius: 8px;
  margin-bottom: 12px;
}

.boost-icon {
  color: var(--accent-gold);
  font-size: 12px;
}

.boost-text {
  font-size: 11px;
  color: var(--accent-gold);
  letter-spacing: 1px;
}

.rarity-notice {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: linear-gradient(90deg, rgba(168, 122, 201, 0.08), rgba(201, 168, 108, 0.06));
  border: 1px solid rgba(168, 122, 201, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
}

.rarity-icon {
  color: #a87ac9;
  font-size: 12px;
  margin-right: 6px;
}

.rarity-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.rarity-mini-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-left: 18px;
}

.rarity-mini-item {
  font-size: 10px;
  font-weight: 500;
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

.diagnostic-content {
  animation: fadeIn 0.4s ease;
}

.diagnostic-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 0;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.08), transparent);
  border-radius: 12px;
  border: 1px solid rgba(201, 168, 108, 0.15);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-value {
  font-size: 28px;
  font-weight: 600;
  font-family: var(--font-serif);
  line-height: 1;
}

.summary-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.summary-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
}

.overall-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(107, 142, 107, 0.08);
  border: 1px solid rgba(107, 142, 107, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.suggestion-icon {
  color: #6b8e6b;
  font-size: 14px;
}

.suggestion-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
  line-height: 1.6;
}

.diagnostic-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.diagnostic-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-muted);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.diagnostic-tab:hover {
  color: var(--text-secondary);
}

.diagnostic-tab.active {
  background: rgba(201, 168, 108, 0.12);
  border-color: rgba(201, 168, 108, 0.3);
  color: var(--accent-gold);
}

.tab-icon {
  font-size: 14px;
}

.tab-label {
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.diagnostic-tab-content {
  min-height: 280px;
}

.tab-panel {
  animation: slideIn 0.3s ease;
}

.loss-analysis {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.loss-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.loss-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.loss-dimension {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loss-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.loss-name {
  font-size: 13px;
  font-weight: 500;
}

.loss-score {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-serif);
}

.loss-severity {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid;
  font-weight: 500;
}

.loss-reasons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.loss-reason {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.reason-bullet {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin-top: 7px;
  flex-shrink: 0;
}

.reason-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.loss-bar-track {
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.loss-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.theme-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-status {
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.theme-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.theme-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.theme-status-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  background: rgba(107, 142, 107, 0.15);
  color: #6b8e6b;
  border: 1px solid rgba(107, 142, 107, 0.3);
  font-weight: 500;
}

.theme-status-badge.deviated {
  background: rgba(201, 101, 101, 0.15);
  color: #c96565;
  border-color: rgba(201, 101, 101, 0.3);
}

.theme-degree-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
}

.theme-degree-fill {
  height: 100%;
  background: linear-gradient(90deg, #6b8e6b, #8ab88a);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.theme-degree-fill.deviated {
  background: linear-gradient(90deg, #c9a86c, #c96565);
}

.theme-degree-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
}

.theme-keywords {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keywords-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.keywords-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.keywords-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(107, 142, 107, 0.2);
  color: #6b8e6b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.keywords-title.missing .keywords-icon {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.keyword-empty {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}

.keyword-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-family: var(--font-serif);
}

.keyword-tag.matched {
  background: rgba(107, 142, 107, 0.12);
  color: #8ab88a;
  border: 1px solid rgba(107, 142, 107, 0.25);
}

.keyword-tag.missing {
  background: rgba(201, 168, 108, 0.1);
  color: var(--accent-gold);
  border: 1px solid rgba(201, 168, 108, 0.25);
}

.theme-suggestion {
  padding: 12px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 8px;
  text-align: center;
}

.suggestion-quote {
  color: var(--accent-gold);
  font-family: var(--font-brush);
  font-size: 16px;
  margin: 0 2px;
}

.suggestion-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
  font-family: var(--font-serif);
}

.balance-analysis {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.balance-overview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.balance-status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.balance-status-indicator.imbalanced .balance-indicator-icon {
  color: #c9a86c;
  background: rgba(201, 168, 108, 0.15);
}

.balance-indicator-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(107, 142, 107, 0.15);
  color: #6b8e6b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.balance-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.balance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.balance-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.balance-item.balanced {
  border-left: 3px solid #6b8e6b;
}

.balance-item.excess {
  border-left: 3px solid #c96565;
}

.balance-item.deficit {
  border-left: 3px solid #c9a86c;
}

.balance-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.balance-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.balance-count {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 8px;
}

.balance-status-tag {
  font-size: 10px;
  font-weight: 500;
}

.balance-bars {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.balance-bar-actual,
.balance-bar-ideal {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.balance-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
  opacity: 0.9;
}

.balance-bar-fill.ideal {
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.2) 4px,
    rgba(255, 255, 255, 0.2) 8px
  );
  opacity: 0.5;
}

.balance-percents {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
}

.ideal-percent {
  opacity: 0.7;
}

.revision-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.revision-path-header {
  padding-bottom: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.revision-path-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.revision-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.revision-step {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.step-order {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-serif);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.step-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.step-priority {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}

.step-description {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.5;
}

.step-action {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(201, 168, 108, 0.06);
  border-radius: 6px;
}

.action-arrow {
  color: var(--accent-gold);
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 1px;
}

.action-text {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.step-dimension {
  position: absolute;
  right: 0;
  top: 0;
  width: 3px;
  height: 100%;
  border-radius: 0 10px 10px 0;
  opacity: 0.6;
}

.layout-analysis {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.layout-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px;
  opacity: 0.5;
}

.layout-empty-icon {
  font-size: 28px;
  color: var(--text-muted);
}

.layout-empty-text {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-serif);
  text-align: center;
  line-height: 1.6;
}

.layout-scores {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.layout-score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout-score-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
  min-width: 52px;
}

.layout-score-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.layout-score-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.layout-score-value {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-serif);
  min-width: 24px;
  text-align: right;
}

.layout-reading-order {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.layout-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.section-icon {
  font-size: 12px;
  color: var(--accent-gold);
}

.reading-order-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.reading-order-word {
  padding: 3px 8px;
  background: rgba(201, 168, 108, 0.1);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 6px;
  font-size: 11px;
  color: var(--accent-gold);
  font-family: var(--font-serif);
}

.reading-order-arrow {
  font-size: 10px;
  color: var(--text-muted);
}

.layout-issues {
  padding: 12px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 108, 0.15);
}

.layout-issue-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.layout-issue-item:last-child {
  margin-bottom: 0;
}

.issue-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c9a86c;
  margin-top: 6px;
  flex-shrink: 0;
}

.issue-text {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.layout-good {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(107, 142, 107, 0.08);
  border: 1px solid rgba(107, 142, 107, 0.2);
  border-radius: 8px;
}

.layout-good-icon {
  color: #6b8e6b;
  font-size: 14px;
  font-weight: 600;
}

.layout-good-text {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .score-panel {
    max-height: none;
  }
  
  .summary-value {
    font-size: 22px;
  }
  
  .diagnostic-tab {
    padding: 8px 4px;
  }
}
</style>
