<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TrialTheme, TrialState, TrialRareImagery, TrialTitle, TrialSpectra, TrialDifficulty, TrialThemeType } from '@/types'
import { TRIAL_DIFFICULTY_LABELS, TRIAL_DIFFICULTY_COLORS, TRIAL_THEME_TYPE_LABELS } from '@/types'
import { trialThemes, trialRareImageries, trialTitles, trialSpectra } from '@/data/trials'
import { isTrialUnlocked, getTrialProgress, getCollectedImageryCount, getCollectedSpectraCount } from '@/utils/trials'

interface Props {
  trialState: TrialState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startTrial', trialId: string): void
}>()

const activeTab = ref<'themes' | 'collection' | 'titles'>('themes')
const selectedType = ref<TrialThemeType | null>(null)

const progress = computed(() => getTrialProgress())
const imageryCount = computed(() => getCollectedImageryCount())
const spectraCount = computed(() => getCollectedSpectraCount())
const titleCount = computed(() => props.trialState.earnedTitles.length)

const filteredThemes = computed(() => {
  let themes = trialThemes
  if (selectedType.value) {
    themes = themes.filter((t: TrialTheme) => t.type === selectedType.value)
  }
  return themes
})

const themeTypes = computed(() => {
  const types = new Set(trialThemes.map((t: TrialTheme) => t.type))
  return Array.from(types)
})

const getTrialStatus = (trial: TrialTheme): 'locked' | 'available' | 'completed' => {
  if (props.trialState.clearedThemes.includes(trial.id)) return 'completed'
  if (isTrialUnlocked(trial.id)) return 'available'
  return 'locked'
}

const getBestScore = (trialId: string): number => {
  return props.trialState.bestScores[trialId] || 0
}

const getStars = (score: number): number => {
  if (score >= 90) return 3
  if (score >= 75) return 2
  if (score >= 60) return 1
  return 0
}

const getUnlockHint = (trial: TrialTheme): string => {
  if (!trial.unlockCondition) return ''
  const { type, params } = trial.unlockCondition
  switch (type) {
    case 'score_threshold':
      return `章节「${params.chapterId}」达成 ${params.minScore} 分`
    case 'trial_clear':
      const prevTrial = trialThemes.find((t: TrialTheme) => t.id === params.trialId)
      return `通关「${prevTrial?.name || params.trialId}」`
    case 'chapter_count':
      return `通关 ${params.minCount} 个章节`
    default:
      return '完成前置条件解锁'
  }
}

const handleStartTrial = (trial: TrialTheme) => {
  if (getTrialStatus(trial) === 'locked') return
  emit('startTrial', trial.id)
}

const collectedImageries = computed(() => {
  return trialRareImageries.filter(img => props.trialState.collectedImageries.includes(img.id))
})

const collectedTitles = computed(() => {
  return trialTitles.filter(t => props.trialState.earnedTitles.includes(t.id))
})

const collectedSpectra = computed(() => {
  return trialSpectra.filter(s => props.trialState.collectedSpectra.includes(s.id))
})

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

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getDifficultyLabel = (difficulty: TrialDifficulty): string => {
  return TRIAL_DIFFICULTY_LABELS[difficulty]
}

const getDifficultyColor = (difficulty: TrialDifficulty): string => {
  return TRIAL_DIFFICULTY_COLORS[difficulty]
}

const getThemeTypeLabel = (type: TrialThemeType): string => {
  return TRIAL_THEME_TYPE_LABELS[type]
}
</script>

<template>
  <div class="ink-trial-overlay" @click.self="emit('close')">
    <div class="ink-trial-panel">
      <div class="panel-header">
        <div class="header-left">
          <span class="panel-icon">🏮</span>
          <span class="panel-title">墨韵试炼</span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">📜</span>
          <span class="stat-label">试炼进度</span>
          <span class="stat-value">{{ progress.cleared }}/{{ progress.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎨</span>
          <span class="stat-label">稀有意象</span>
          <span class="stat-value">{{ imageryCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎵</span>
          <span class="stat-label">墨韵谱面</span>
          <span class="stat-value">{{ spectraCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👑</span>
          <span class="stat-label">获得称号</span>
          <span class="stat-value">{{ titleCount }}</span>
        </div>
      </div>

      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'themes' }"
          @click="activeTab = 'themes'"
        >
          试炼主题
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'collection' }"
          @click="activeTab = 'collection'"
        >
          意象收藏
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'titles' }"
          @click="activeTab = 'titles'"
        >
          称号谱面
        </button>
      </div>

      <div class="panel-content">
        <template v-if="activeTab === 'themes'">
          <div class="type-filters">
            <button 
              class="filter-btn"
              :class="{ active: !selectedType }"
              @click="selectedType = null"
            >
              全部
            </button>
            <button 
              v-for="type in themeTypes" 
              :key="type"
              class="filter-btn"
              :class="{ active: selectedType === type }"
              @click="selectedType = type"
            >
              {{ getThemeTypeLabel(type) }}
            </button>
          </div>

          <div class="trial-list">
            <div 
              v-for="trial in filteredThemes" 
              :key="trial.id"
              class="trial-card"
              :class="{ 
                locked: getTrialStatus(trial) === 'locked',
                completed: getTrialStatus(trial) === 'completed',
                available: getTrialStatus(trial) === 'available'
              }"
              :style="{ '--accent-color': trial.accentColor }"
              @click="handleStartTrial(trial)"
            >
              <div class="card-bg" :style="{ background: trial.backgroundGradient }"></div>
              
              <div class="card-content">
                <div class="card-header">
                  <span class="trial-icon">{{ trial.icon }}</span>
                  <div class="trial-info">
                    <span class="trial-name">{{ trial.name }}</span>
                    <span 
                      class="difficulty-badge"
                      :style="{ color: getDifficultyColor(trial.difficulty) }"
                    >
                      {{ getDifficultyLabel(trial.difficulty) }}
                    </span>
                  </div>
                </div>

                <p class="trial-desc">{{ trial.description }}</p>

                <div class="trial-meta">
                  <span class="meta-item">
                    <span class="meta-label">目标词数</span>
                    <span class="meta-value">{{ trial.targetPhraseCount }}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-label">时间限制</span>
                    <span class="meta-value">{{ formatTime(trial.timeLimitSeconds) }}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-label">通关分数</span>
                    <span class="meta-value">{{ trial.requiredScore }}</span>
                  </span>
                </div>

                <div class="card-footer">
                  <div v-if="getTrialStatus(trial) === 'locked'" class="lock-info">
                    <span class="lock-icon">🔒</span>
                    <span class="lock-text">{{ getUnlockHint(trial) }}</span>
                  </div>
                  
                  <div v-else class="score-info">
                    <div class="stars">
                      <span 
                        v-for="i in 3" 
                        :key="i" 
                        class="star"
                        :class="{ filled: i <= getStars(getBestScore(trial.id)) }"
                      >
                        ★
                      </span>
                    </div>
                    <span v-if="getBestScore(trial.id) > 0" class="best-score">
                      最高 {{ getBestScore(trial.id) }} 分
                    </span>
                    <span v-else class="best-score">尚未挑战</span>
                  </div>

                  <button 
                    v-if="getTrialStatus(trial) !== 'locked'" 
                    class="start-btn"
                    :style="{ background: trial.accentColor }"
                    @click.stop="handleStartTrial(trial)"
                  >
                    {{ getTrialStatus(trial) === 'completed' ? '再次挑战' : '开始挑战' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'collection'">
          <div class="collection-grid">
            <div 
              v-for="img in collectedImageries" 
              :key="img.id"
              class="imagery-card"
              :class="{ exclusive: img.isExclusive }"
              :style="{ '--rarity-color': rarityColors[img.rarity] }"
            >
              <div class="imagery-icon">{{ img.icon }}</div>
              <div class="imagery-name">{{ img.name }}</div>
              <div class="imagery-rarity" :style="{ color: rarityColors[img.rarity] }">
                {{ rarityLabels[img.rarity] }}
              </div>
              <div class="imagery-desc">{{ img.description }}</div>
              <div class="imagery-phrases">
                <span v-for="p in img.phraseTexts" :key="p" class="phrase-tag">
                  {{ p }}
                </span>
              </div>
              <div v-if="img.isExclusive" class="exclusive-badge">专属</div>
            </div>

            <div v-if="collectedImageries.length === 0" class="empty-state">
              <span class="empty-icon">🎨</span>
              <span class="empty-text">暂无稀有意象</span>
              <span class="empty-hint">通过墨韵试炼获取</span>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'titles'">
          <div class="titles-section">
            <h3 class="section-title">🏆 试炼称号</h3>
            <div class="title-grid">
              <div 
                v-for="title in collectedTitles" 
                :key="title.id"
                class="title-card"
                :style="{ '--rarity-color': rarityColors[title.rarity] }"
              >
                <div class="title-icon">{{ title.icon }}</div>
                <div class="title-name">{{ title.name }}</div>
                <div class="title-rarity" :style="{ color: rarityColors[title.rarity] }">
                  {{ rarityLabels[title.rarity] }}
                </div>
                <div class="title-desc">{{ title.description }}</div>
              </div>
              <div v-if="collectedTitles.length === 0" class="empty-state">
                <span class="empty-icon">👑</span>
                <span class="empty-text">暂无称号</span>
                <span class="empty-hint">在试炼中达成特殊条件获取</span>
              </div>
            </div>
          </div>

          <div class="spectra-section">
            <h3 class="section-title">🎵 墨韵谱面</h3>
            <div class="spectra-grid">
              <div 
                v-for="spec in collectedSpectra" 
                :key="spec.id"
                class="spectra-card"
                :style="{ '--rarity-color': rarityColors[spec.rarity] }"
              >
                <div class="spectra-icon">{{ spec.icon }}</div>
                <div class="spectra-name">{{ spec.name }}</div>
                <div class="spectra-rarity" :style="{ color: rarityColors[spec.rarity] }">
                  {{ rarityLabels[spec.rarity] }}
                </div>
                <div class="spectra-pattern">
                  <span v-for="(p, i) in spec.pattern" :key="i" class="pattern-char">{{ p }}</span>
                </div>
                <div class="spectra-desc">{{ spec.description }}</div>
                <div v-if="spec.effect" class="spectra-effect">{{ spec.effect }}</div>
              </div>
              <div v-if="collectedSpectra.length === 0" class="empty-state">
                <span class="empty-icon">🎵</span>
                <span class="empty-text">暂无谱面</span>
                <span class="empty-hint">在试炼中获得高分解锁</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ink-trial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.ink-trial-panel {
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  background: linear-gradient(135deg, #1a1520 0%, #2d2530 50%, #1f1a2a 100%);
  border-radius: 16px;
  border: 1px solid rgba(201, 168, 108, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.1) 0%, transparent 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon {
  font-size: 28px;
}

.panel-title {
  font-size: 22px;
  font-weight: 600;
  color: #c9a86c;
  letter-spacing: 2px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.stats-bar {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-icon {
  font-size: 20px;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #c9a86c;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ccc;
}

.tab-btn.active {
  color: #c9a86c;
  border-bottom-color: #c9a86c;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaa;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: rgba(201, 168, 108, 0.2);
  border-color: #c9a86c;
  color: #c9a86c;
}

.trial-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.trial-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.trial-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.trial-card.locked:hover {
  transform: none;
}

.card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.card-content {
  position: relative;
  padding: 16px;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.trial-icon {
  font-size: 36px;
}

.trial-info {
  flex: 1;
}

.trial-name {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.difficulty-badge {
  font-size: 12px;
  font-weight: 500;
}

.trial-desc {
  font-size: 13px;
  color: #aaa;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trial-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: #666;
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-color, #c9a86c);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lock-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  color: #444;
}

.star.filled {
  color: #ffd700;
}

.best-score {
  font-size: 12px;
  color: #888;
}

.start-btn {
  padding: 8px 16px;
  border: none;
  color: #1a1a2e;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.start-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.imagery-card {
  position: relative;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--rarity-color, #666);
  border-radius: 12px;
  text-align: center;
}

.imagery-card.exclusive {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
}

.imagery-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.imagery-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.imagery-rarity {
  font-size: 12px;
  margin-bottom: 8px;
}

.imagery-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
  margin-bottom: 10px;
}

.imagery-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.phrase-tag {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  font-size: 11px;
  color: #aaa;
}

.exclusive-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #888;
}

.empty-hint {
  font-size: 13px;
  color: #555;
}

.titles-section,
.spectra-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  color: #c9a86c;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(201, 168, 108, 0.2);
}

.title-grid,
.spectra-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.title-card,
.spectra-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--rarity-color, #666);
  border-radius: 10px;
  text-align: center;
}

.title-icon,
.spectra-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.title-name,
.spectra-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.title-rarity,
.spectra-rarity {
  font-size: 11px;
  margin-bottom: 8px;
}

.title-desc,
.spectra-desc {
  font-size: 11px;
  color: #888;
  line-height: 1.4;
}

.spectra-pattern {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: 8px 0;
  font-size: 16px;
  color: var(--rarity-color, #888);
}

.pattern-char {
  font-family: monospace;
}

.spectra-effect {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  font-size: 11px;
  color: #c9a86c;
  font-style: italic;
}

@media (max-width: 600px) {
  .ink-trial-panel {
    width: 95%;
    max-height: 90vh;
  }
  
  .stats-bar {
    flex-wrap: wrap;
  }
  
  .stat-item {
    flex: 1 1 40%;
  }
  
  .trial-list {
    grid-template-columns: 1fr;
  }
}
</style>
