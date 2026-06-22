<script setup lang="ts">
import { ref, computed } from 'vue'
import type { 
  ClassicPoem, 
  ReconstructionState, 
  ReconstructionDifficulty, 
  ClassicPoemDynasty,
  ClassicPoemType 
} from '@/types'
import { 
  RECONSTRUCTION_DIFFICULTY_LABELS, 
  RECONSTRUCTION_DIFFICULTY_COLORS,
  DYNASTY_LABELS,
  POEM_TYPE_LABELS 
} from '@/types'
import { getAllPoems, getPoemById } from '@/data/classicPoems'
import { 
  loadReconstructionState, 
  isPoemUnlocked,
  getBestReconstructionResult,
  getReconstructionProgress
} from '@/utils/reconstructionStorage'

interface Props {
  reconstructionState: ReconstructionState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startReconstruction', poemId: string): void
}>()

const activeTab = ref<'poems' | 'collection' | 'titles'>('poems')
const selectedDifficulty = ref<ReconstructionDifficulty | null>(null)
const selectedDynasty = ref<ClassicPoemDynasty | null>(null)
const selectedType = ref<ClassicPoemType | null>(null)
const selectedPoem = ref<ClassicPoem | null>(null)

const progress = computed(() => getReconstructionProgress())
const clearedCount = computed(() => props.reconstructionState.clearedPoemIds.length)
const totalPoems = computed(() => getAllPoems().length)
const titleCount = computed(() => props.reconstructionState.earnedTitles.length)

const filteredPoems = computed(() => {
  let poems = getAllPoems()
  if (selectedDifficulty.value) {
    poems = poems.filter(p => p.difficulty === selectedDifficulty.value)
  }
  if (selectedDynasty.value) {
    poems = poems.filter(p => p.dynasty === selectedDynasty.value)
  }
  if (selectedType.value) {
    poems = poems.filter(p => p.type === selectedType.value)
  }
  return poems
})

const difficulties = computed(() => {
  const set = new Set(getAllPoems().map(p => p.difficulty))
  return Array.from(set)
})

const dynasties = computed(() => {
  const set = new Set(getAllPoems().map(p => p.dynasty))
  return Array.from(set)
})

const poemTypes = computed(() => {
  const set = new Set(getAllPoems().map(p => p.type))
  return Array.from(set)
})

const getPoemStatus = (poem: ClassicPoem): 'locked' | 'available' | 'completed' => {
  if (props.reconstructionState.clearedPoemIds.includes(poem.id)) return 'completed'
  if (isPoemUnlocked(poem.id)) return 'available'
  return 'locked'
}

const getBestScore = (poemId: string): number => {
  return props.reconstructionState.bestScores[poemId] || 0
}

const getBestTime = (poemId: string): string => {
  const time = props.reconstructionState.bestTimes[poemId]
  if (!time) return '--'
  const mins = Math.floor(time / 60)
  const secs = time % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getStars = (score: number): number => {
  if (score >= 90) return 3
  if (score >= 75) return 2
  if (score >= 60) return 1
  return 0
}

const getUnlockHint = (poem: ClassicPoem): string => {
  if (poem.unlockCondition) {
    const { type, params } = poem.unlockCondition
    switch (type) {
      case 'score_threshold':
        return `章节达成 ${params.minScore} 分`
      case 'chapter_count':
        return `通关 ${params.minCount} 个章节`
      case 'reputation_rank':
        return `诗社声望达到「${params.rank}」`
      default:
        return '完成前置条件解锁'
    }
  }
  const cleared = props.reconstructionState.clearedPoemIds.length
  if (cleared < 1) return '先从入门诗篇开始，完成1首后解锁更多'
  if (cleared < 3) return `再完成${3 - cleared}首解锁进阶名篇`
  if (cleared < 5) return `再完成${5 - cleared}首解锁大师名篇`
  return '已解锁全部'
}

const handleSelectPoem = (poem: ClassicPoem) => {
  selectedPoem.value = poem
}

const handleStartReconstruction = (poem: ClassicPoem) => {
  if (getPoemStatus(poem) === 'locked') return
  emit('startReconstruction', poem.id)
}

const handleCloseDetail = () => {
  selectedPoem.value = null
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="reconstruction-overlay" @click.self="emit('close')">
    <div class="reconstruction-panel">
      <div class="panel-header">
        <div class="header-left">
          <span class="panel-icon">📚</span>
          <span class="panel-title">名篇重构</span>
          <span class="panel-subtitle">依经典诗意，重构千古绝唱</span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-label">重构进度</span>
          <span class="stat-value">{{ clearedCount }}/{{ totalPoems }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">✨</span>
          <span class="stat-label">总重构次数</span>
          <span class="stat-value">{{ progress.totalReconstructions }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🏆</span>
          <span class="stat-label">获得称号</span>
          <span class="stat-value">{{ titleCount }}</span>
        </div>
      </div>

      <div class="tab-bar">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'poems' }"
          @click="activeTab = 'poems'"
        >
          <span>🎯</span>
          <span>经典篇目</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'collection' }"
          @click="activeTab = 'collection'"
        >
          <span>📜</span>
          <span>重构成就</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'titles' }"
          @click="activeTab = 'titles'"
        >
          <span>👑</span>
          <span>称号收藏</span>
        </button>
      </div>

      <div v-if="activeTab === 'poems'" class="tab-content">
        <div class="filter-bar">
          <div class="filter-group">
            <span class="filter-label">难度：</span>
            <select v-model="selectedDifficulty" class="filter-select">
              <option :value="null">全部</option>
              <option v-for="diff in difficulties" :key="diff" :value="diff">
                {{ RECONSTRUCTION_DIFFICULTY_LABELS[diff] }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <span class="filter-label">朝代：</span>
            <select v-model="selectedDynasty" class="filter-select">
              <option :value="null">全部</option>
              <option v-for="dyn in dynasties" :key="dyn" :value="dyn">
                {{ DYNASTY_LABELS[dyn] }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <span class="filter-label">体裁：</span>
            <select v-model="selectedType" class="filter-select">
              <option :value="null">全部</option>
              <option v-for="pt in poemTypes" :key="pt" :value="pt">
                {{ POEM_TYPE_LABELS[pt] }}
              </option>
            </select>
          </div>
        </div>

        <div class="poem-grid">
          <div 
            v-for="poem in filteredPoems" 
            :key="poem.id"
            class="poem-card"
            :class="{
              locked: getPoemStatus(poem) === 'locked',
              completed: getPoemStatus(poem) === 'completed'
            }"
            :style="{ borderColor: getPoemStatus(poem) === 'locked' ? 'transparent' : poem.accentColor + '40' }"
            @click="handleSelectPoem(poem)"
          >
            <div class="poem-card-header" :style="{ background: poem.accentColor + '20' }">
              <span class="poem-icon">{{ poem.icon }}</span>
              <div class="poem-meta">
                <span class="poem-title">{{ poem.title }}</span>
                <span class="poem-author">{{ poem.dynasty }} · {{ poem.author }}</span>
              </div>
              <span 
                class="difficulty-tag"
                :style="{ 
                  background: RECONSTRUCTION_DIFFICULTY_COLORS[poem.difficulty] + '30',
                  color: RECONSTRUCTION_DIFFICULTY_COLORS[poem.difficulty]
                }"
              >
                {{ RECONSTRUCTION_DIFFICULTY_LABELS[poem.difficulty] }}
              </span>
            </div>
            <div class="poem-card-body">
              <div class="poem-type-tag">{{ POEM_TYPE_LABELS[poem.type] }}</div>
              <div class="poem-snippet">
                {{ poem.content[0] }}
              </div>
              <div class="poem-stat-row">
                <div class="mini-stat">
                  <span class="mini-label">目标词数</span>
                  <span class="mini-value">{{ poem.targetPhraseCount }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">最佳分数</span>
                  <span class="mini-value">{{ getBestScore(poem.id) }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">最快用时</span>
                  <span class="mini-value">{{ getBestTime(poem.id) }}</span>
                </div>
              </div>
              <div class="star-row">
                <span v-for="i in 3" :key="i" class="star" :class="{ filled: i <= getStars(getBestScore(poem.id)) }">★</span>
              </div>
            </div>
            <div v-if="getPoemStatus(poem) === 'locked'" class="lock-overlay">
              <span class="lock-icon">🔒</span>
              <span class="lock-hint">{{ getUnlockHint(poem) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'collection'" class="tab-content">
        <div class="achievements-grid">
          <div 
            v-for="poemId in props.reconstructionState.clearedPoemIds" 
            :key="poemId"
            class="achievement-card"
          >
            <div v-if="getPoemById(poemId)" class="achievement-inner" :style="{ borderColor: getPoemById(poemId)?.accentColor + '60' }">
              <div class="achievement-icon" :style="{ background: getPoemById(poemId)?.accentColor + '20' }">
                {{ getPoemById(poemId)?.icon }}
              </div>
              <div class="achievement-info">
                <span class="achievement-title">{{ getPoemById(poemId)?.title }}</span>
                <span class="achievement-sub">
                  {{ getPoemById(poemId)?.dynasty }} · {{ getPoemById(poemId)?.author }}
                </span>
                <div class="achievement-stats">
                  <span class="ach-score">最高分：{{ getBestScore(poemId) }}</span>
                  <span class="ach-time">最快：{{ getBestTime(poemId) }}</span>
                </div>
              </div>
              <div class="achievement-stars">
                <span v-for="i in 3" :key="i" class="star big" :class="{ filled: i <= getStars(getBestScore(poemId)) }">★</span>
              </div>
            </div>
          </div>
          <div v-if="props.reconstructionState.clearedPoemIds.length === 0" class="empty-hint">
            <span class="empty-icon">📝</span>
            <span class="empty-text">尚未完成任何重构，快去挑战经典吧！</span>
          </div>
        </div>
      </div>

      <div v-else class="tab-content">
        <div class="titles-grid">
          <div 
            v-for="title in props.reconstructionState.earnedTitles" 
            :key="title"
            class="title-card"
          >
            <span class="title-badge">🏅</span>
            <span class="title-name">{{ title }}</span>
          </div>
          <div v-if="props.reconstructionState.earnedTitles.length === 0" class="empty-hint">
            <span class="empty-icon">🏆</span>
            <span class="empty-text">获得称号可解锁特殊成就，挑战更高分吧！</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedPoem" class="detail-overlay" @click.self="handleCloseDetail">
      <div class="detail-panel" :style="{ borderColor: selectedPoem.accentColor + '60' }">
        <div class="detail-header" :style="{ background: `linear-gradient(135deg, ${selectedPoem.accentColor}20, transparent)` }">
          <div class="detail-title-row">
            <span class="detail-icon">{{ selectedPoem.icon }}</span>
            <div>
              <h3 class="detail-title">{{ selectedPoem.title }}</h3>
              <p class="detail-author">{{ DYNASTY_LABELS[selectedPoem.dynasty] }} · {{ selectedPoem.author }}</p>
            </div>
          </div>
          <button class="close-btn" @click="handleCloseDetail">✕</button>
        </div>

        <div class="detail-body">
          <div class="poem-original">
            <h4 class="section-title">📜 原作</h4>
            <div class="poem-content">
              <p v-for="(line, idx) in selectedPoem.content" :key="idx" class="poem-line">{{ line }}</p>
            </div>
          </div>

          <div v-if="selectedPoem.translation" class="poem-translation">
            <h4 class="section-title">📖 译文</h4>
            <p class="translation-text">{{ selectedPoem.translation }}</p>
          </div>

          <div class="poem-background">
            <h4 class="section-title">🏛️ 创作背景</h4>
            <p class="background-text">{{ selectedPoem.background }}</p>
          </div>

          <div class="poem-analysis-tags">
            <div class="tag-group">
              <h5 class="tag-title">核心意象</h5>
              <div class="tags">
                <span v-for="img in selectedPoem.coreImageries" :key="img" class="tag imagery-tag">
                  {{ img }}
                </span>
              </div>
            </div>
            <div class="tag-group">
              <h5 class="tag-title">情感基调</h5>
              <div class="tags">
                <span v-for="emo in selectedPoem.emotions" :key="emo" class="tag emotion-tag">
                  {{ emo }}
                </span>
              </div>
            </div>
            <div class="tag-group">
              <h5 class="tag-title">主题意蕴</h5>
              <div class="tags">
                <span v-for="theme in selectedPoem.themes" :key="theme" class="tag theme-tag">
                  {{ theme }}
                </span>
              </div>
            </div>
          </div>

          <div class="reconstruction-tips">
            <h4 class="section-title">💡 重构提示</h4>
            <ul class="tips-list">
              <li>目标词数：约 {{ selectedPoem.targetPhraseCount }} 个词句</li>
              <li>难度等级：<span :style="{ color: RECONSTRUCTION_DIFFICULTY_COLORS[selectedPoem.difficulty] }">
                {{ RECONSTRUCTION_DIFFICULTY_LABELS[selectedPoem.difficulty] }}
              </span></li>
              <li>重构将根据意象、主题、情感、结构、风格五个维度进行评分</li>
              <li>尝试还原原作的神髓，而非机械地照搬词句</li>
            </ul>
          </div>
        </div>

        <div class="detail-footer">
          <button class="secondary-btn" @click="handleCloseDetail">返回</button>
          <button 
            class="primary-btn"
            :class="{ disabled: getPoemStatus(selectedPoem) === 'locked' }"
            :disabled="getPoemStatus(selectedPoem) === 'locked'"
            :style="{ 
              background: getPoemStatus(selectedPoem) === 'locked' 
                ? 'var(--bg-input)' 
                : `linear-gradient(135deg, ${selectedPoem.accentColor}, ${selectedPoem.accentColor}dd)`,
              opacity: getPoemStatus(selectedPoem) === 'locked' ? 0.5 : 1
            }"
            @click="handleStartReconstruction(selectedPoem)"
          >
            {{ getPoemStatus(selectedPoem) === 'locked' ? '🔒 未解锁' : '开始重构' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reconstruction-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reconstruction-panel {
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.panel-icon {
  font-size: 28px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid var(--border);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.1);
  color: var(--accent-red);
  border-color: rgba(255, 100, 100, 0.3);
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(201, 168, 108, 0.03);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.stat-icon {
  font-size: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-value {
  margin-left: auto;
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--accent-gold);
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
}

.tab-btn.active {
  background: rgba(201, 168, 108, 0.12);
  border-color: rgba(201, 168, 108, 0.3);
  color: var(--accent-gold);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.filter-bar {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-muted);
}

.filter-select {
  padding: 6px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: var(--accent-gold);
}

.poem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.poem-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.poem-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.poem-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.poem-card.locked:hover {
  transform: none;
}

.poem-card.completed {
  box-shadow: 0 0 20px rgba(124, 169, 124, 0.15);
}

.poem-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.poem-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.poem-meta {
  flex: 1;
  min-width: 0;
}

.poem-title {
  display: block;
  font-family: var(--font-brush);
  font-size: 17px;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poem-author {
  font-size: 11px;
  color: var(--text-muted);
}

.difficulty-tag {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  white-space: nowrap;
}

.poem-card-body {
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.poem-type-tag {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.poem-snippet {
  font-family: var(--font-serif);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 14px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poem-stat-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.mini-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.mini-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.mini-value {
  font-family: var(--font-brush);
  font-size: 14px;
  color: var(--accent-gold);
}

.star-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.star {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.15);
}

.star.filled {
  color: var(--accent-gold);
  text-shadow: 0 0 8px rgba(201, 168, 108, 0.5);
}

.star.big {
  font-size: 20px;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  text-align: center;
}

.lock-icon {
  font-size: 28px;
}

.lock-hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.achievement-card {
  width: 100%;
}

.achievement-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.achievement-inner:hover {
  background: rgba(255, 255, 255, 0.04);
}

.achievement-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border-radius: 12px;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-title {
  display: block;
  font-family: var(--font-brush);
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.achievement-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.achievement-stats {
  display: flex;
  gap: 12px;
}

.ach-score, .ach-time {
  font-size: 11px;
  color: var(--accent-gold);
}

.achievement-stars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.titles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.title-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.1), rgba(201, 168, 108, 0.02));
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.title-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(201, 168, 108, 0.15);
}

.title-badge {
  font-size: 22px;
}

.title-name {
  font-family: var(--font-brush);
  font-size: 15px;
  color: var(--accent-gold);
  letter-spacing: 1px;
}

.empty-hint {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

.detail-panel {
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  background: #1a1a2e;
  border: 1px solid;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.detail-title {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin: 0 0 4px 0;
}

.detail-author {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.section-title {
  font-family: var(--font-brush);
  font-size: 16px;
  color: var(--accent-gold);
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}

.poem-original,
.poem-translation,
.poem-background,
.reconstruction-tips {
  margin-bottom: 22px;
}

.poem-content {
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.poem-line {
  font-family: var(--font-serif);
  font-size: 18px;
  color: var(--text-primary);
  line-height: 2.2;
  margin: 0;
  text-align: center;
  letter-spacing: 2px;
}

.translation-text,
.background-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.9;
  margin: 0;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.poem-analysis-tags {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}

.tag-group {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.tag-title {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.imagery-tag {
  background: rgba(122, 158, 168, 0.15);
  color: #8ab8c2;
}

.emotion-tag {
  background: rgba(197, 107, 107, 0.15);
  color: #e09090;
}

.theme-tag {
  background: rgba(201, 168, 108, 0.15);
  color: #e0c89a;
}

.tips-list {
  list-style: none;
  padding: 14px 18px;
  margin: 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.tips-list li {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 2;
  padding-left: 18px;
  position: relative;
}

.tips-list li::before {
  content: '·';
  position: absolute;
  left: 4px;
  color: var(--accent-gold);
  font-weight: bold;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.secondary-btn,
.primary-btn {
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.primary-btn {
  margin-left: auto;
  color: #1a1a2e;
  font-weight: 500;
}

.primary-btn:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.primary-btn.disabled {
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .poem-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    padding: 16px;
  }
  
  .detail-title {
    font-size: 20px;
  }
  
  .detail-icon {
    font-size: 32px;
    width: 48px;
    height: 48px;
  }
}
</style>
