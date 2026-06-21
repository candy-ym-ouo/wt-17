<script setup lang="ts">
import { computed } from 'vue'
import type { Composition, Chapter, PhraseCategory, ScoreBreakdown } from '@/types'
import { getScoreGrade, extractCoreImagery } from '@/utils/scoring'
import { getChapterById } from '@/data/chapters'
import { getGradeColor } from '@/utils/portfolioFilter'

interface Props {
  compositions: [Composition, Composition]
  chaptersTitles: Record<string, { title: string; accent: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'load', composition: Composition): void
  (e: 'swap'): void
}>()

const compA = computed(() => props.compositions[0])
const compB = computed(() => props.compositions[1])

const chapterA = computed((): Chapter | undefined => getChapterById(compA.value.chapterId))
const chapterB = computed((): Chapter | undefined => getChapterById(compB.value.chapterId))

const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

const CATEGORY_ICONS: Record<PhraseCategory, string> = {
  scene: '🌿',
  emotion: '💫',
  time: '⏳',
  action: '✨',
  imagery: '🎨'
}

const DIMENSION_LABELS: Record<keyof ScoreBreakdown, string> = {
  coherence: '连贯性',
  imagery: '意象',
  rhythm: '韵律',
  themeMatch: '契合',
  total: '总分'
}

const getCategoryDistribution = (comp: Composition): Record<PhraseCategory, number> => {
  const distribution: Record<PhraseCategory, number> = {
    scene: 0,
    emotion: 0,
    time: 0,
    action: 0,
    imagery: 0
  }
  comp.phrases.forEach(p => {
    distribution[p.category]++
  })
  return distribution
}

const distA = computed(() => getCategoryDistribution(compA.value))
const distB = computed(() => getCategoryDistribution(compB.value))

const getCategoryPercentage = (dist: Record<PhraseCategory, number>, category: PhraseCategory): number => {
  const total = Object.values(dist).reduce((a, b) => a + b, 0)
  return total > 0 ? Math.round((dist[category] / total) * 100) : 0
}

const getCoreImagery = (comp: Composition): string[] => {
  if (comp.coreImagery && comp.coreImagery.length > 0) {
    return comp.coreImagery
  }
  return extractCoreImagery(comp.phrases, 4)
}

const imageryA = computed(() => getCoreImagery(compA.value))
const imageryB = computed(() => getCoreImagery(compB.value))

const getChapterAccent = (chapterId: string) => props.chaptersTitles[chapterId]?.accent || '#c9a86c'
const getChapterTitle = (chapterId: string) => props.chaptersTitles[chapterId]?.title || '自由之境'

const getScoreDiff = (a: number, b: number): { diff: number; label: string; positive: boolean } => {
  const diff = a - b
  return {
    diff: Math.abs(diff),
    label: diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '—',
    positive: diff > 0
  }
}

const getOverallWinner = (): 'A' | 'B' | 'tie' => {
  if (compA.value.score.total > compB.value.score.total) return 'A'
  if (compB.value.score.total > compA.value.score.total) return 'B'
  return 'tie'
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '#c9a86c'
    case 'epic': return '#a87ac9'
    case 'rare': return '#7a9ea8'
    default: return '#a8a498'
  }
}

const getRarityLabel = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '传说'
    case 'epic': return '史诗'
    case 'rare': return '稀有'
    default: return '寻常'
  }
}
</script>

<template>
  <div class="compare-overlay" @click.self="emit('close')">
    <div class="compare-panel" @click.stop>
      <div class="compare-header">
        <div class="compare-title-row">
          <h2 class="compare-title">作品对比</h2>
          <div class="compare-actions">
            <button class="swap-btn" @click="emit('swap')" title="交换位置">
              🔄 交换
            </button>
            <button class="close-btn" @click="emit('close')">✕</button>
          </div>
        </div>
        <div class="compare-subtitle">
          并排分析两首作品的词句结构、得分与章节背景
        </div>
      </div>

      <div class="compare-content">
        <div class="compare-columns">
          <div class="compare-column column-a" :style="{ '--accent': getChapterAccent(compA.chapterId) }">
            <div class="column-header">
              <div class="column-badge">A</div>
              <div class="column-info">
                <h3 class="composition-title">{{ compA.title || '无题' }}</h3>
                <div class="composition-meta">
                  <span class="meta-chapter">{{ getChapterTitle(compA.chapterId) }}</span>
                  <span class="meta-date">{{ formatDate(compA.createdAt) }}</span>
                </div>
              </div>
              <div 
                class="load-btn" 
                @click="emit('load', compA)"
                title="加载此作品"
              >
                📝 编辑
              </div>
            </div>
          </div>

          <div class="compare-divider">
            <div class="divider-vs">VS</div>
          </div>

          <div class="compare-column column-b" :style="{ '--accent': getChapterAccent(compB.chapterId) }">
            <div class="column-header">
              <div class="column-badge">B</div>
              <div class="column-info">
                <h3 class="composition-title">{{ compB.title || '无题' }}</h3>
                <div class="composition-meta">
                  <span class="meta-chapter">{{ getChapterTitle(compB.chapterId) }}</span>
                  <span class="meta-date">{{ formatDate(compB.createdAt) }}</span>
                </div>
              </div>
              <div 
                class="load-btn" 
                @click="emit('load', compB)"
                title="加载此作品"
              >
                📝 编辑
              </div>
            </div>
          </div>
        </div>

        <div class="compare-section">
          <div class="section-header">
            <span class="section-icon">🏆</span>
            <span class="section-title">总分对比</span>
          </div>
          <div class="score-overview">
            <div class="score-display" :style="{ '--accent': getChapterAccent(compA.chapterId) }">
              <div 
                class="score-value"
                :class="{ 'winner': getOverallWinner() === 'A' }"
                :style="{ color: getScoreGrade(compA.score.total).color }"
              >
                {{ compA.score.total }}
                <span v-if="getOverallWinner() === 'A'" class="winner-badge">👑</span>
              </div>
              <div 
                class="score-grade"
                :style="{ color: getScoreGrade(compA.score.total).color }"
              >
                {{ getScoreGrade(compA.score.total).grade }}
              </div>
              <div class="score-comment">{{ getScoreGrade(compA.score.total).comment }}</div>
            </div>

            <div class="score-diff-display">
              <div class="diff-label">分差</div>
              <div 
                class="diff-value"
                :class="{ 
                  'positive': getScoreDiff(compA.score.total, compB.score.total).positive && getOverallWinner() === 'A',
                  'negative': !getScoreDiff(compA.score.total, compB.score.total).positive && getOverallWinner() !== 'tie'
                }"
              >
                {{ getScoreDiff(compA.score.total, compB.score.total).label }}
              </div>
            </div>

            <div class="score-display" :style="{ '--accent': getChapterAccent(compB.chapterId) }">
              <div 
                class="score-value"
                :class="{ 'winner': getOverallWinner() === 'B' }"
                :style="{ color: getScoreGrade(compB.score.total).color }"
              >
                {{ compB.score.total }}
                <span v-if="getOverallWinner() === 'B'" class="winner-badge">👑</span>
              </div>
              <div 
                class="score-grade"
                :style="{ color: getScoreGrade(compB.score.total).color }"
              >
                {{ getScoreGrade(compB.score.total).grade }}
              </div>
              <div class="score-comment">{{ getScoreGrade(compB.score.total).comment }}</div>
            </div>
          </div>
        </div>

        <div class="compare-section">
          <div class="section-header">
            <span class="section-icon">📊</span>
            <span class="section-title">维度得分</span>
          </div>
          <div class="dimension-comparison">
            <div 
              v-for="dim in (['coherence', 'imagery', 'rhythm', 'themeMatch'] as const)" 
              :key="dim"
              class="dimension-row"
            >
              <div class="dimension-label">{{ DIMENSION_LABELS[dim] }}</div>
              
              <div class="dimension-bar-container">
                <div class="dimension-bar side-a">
                  <div 
                    class="bar-fill" 
                    :style="{ 
                      width: compA.score[dim] + '%',
                      background: getChapterAccent(compA.chapterId)
                    }"
                  ></div>
                </div>
                <div class="dimension-values">
                  <span class="value-a" :style="{ color: getChapterAccent(compA.chapterId) }">
                    {{ compA.score[dim] }}
                  </span>
                  <span 
                    class="value-diff"
                    :class="{ 
                      'positive': compA.score[dim] > compB.score[dim],
                      'negative': compA.score[dim] < compB.score[dim]
                    }"
                  >
                    {{ getScoreDiff(compA.score[dim], compB.score[dim]).label }}
                  </span>
                  <span class="value-b" :style="{ color: getChapterAccent(compB.chapterId) }">
                    {{ compB.score[dim] }}
                  </span>
                </div>
                <div class="dimension-bar side-b">
                  <div 
                    class="bar-fill reverse" 
                    :style="{ 
                      width: compB.score[dim] + '%',
                      background: getChapterAccent(compB.chapterId)
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-section">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <span class="section-title">词句结构</span>
          </div>
          
          <div class="structure-comparison">
            <div class="structure-header">
              <span class="structure-label">词类分布</span>
              <span class="structure-count">{{ compA.phrases.length }} 词</span>
              <span class="structure-divider"></span>
              <span class="structure-count">{{ compB.phrases.length }} 词</span>
            </div>
            
            <div class="category-bars">
              <div 
                v-for="cat in (['scene', 'emotion', 'time', 'action', 'imagery'] as PhraseCategory[])" 
                :key="cat"
                class="category-row"
              >
                <div class="category-label">
                  <span class="category-icon">{{ CATEGORY_ICONS[cat] }}</span>
                  <span>{{ CATEGORY_LABELS[cat] }}</span>
                </div>
                
                <div class="category-bar-container">
                  <div class="category-bar side-a">
                    <div 
                      class="bar-fill" 
                      :style="{ 
                        width: getCategoryPercentage(distA, cat) + '%',
                        background: getChapterAccent(compA.chapterId)
                      }"
                    ></div>
                    <span class="bar-count">{{ distA[cat] }}</span>
                  </div>
                  
                  <div class="category-percentage">
                    <span class="pct-a" :style="{ color: getChapterAccent(compA.chapterId) }">
                      {{ getCategoryPercentage(distA, cat) }}%
                    </span>
                    <span class="pct-divider">/</span>
                    <span class="pct-b" :style="{ color: getChapterAccent(compB.chapterId) }">
                      {{ getCategoryPercentage(distB, cat) }}%
                    </span>
                  </div>
                  
                  <div class="category-bar side-b">
                    <span class="bar-count">{{ distB[cat] }}</span>
                    <div 
                      class="bar-fill reverse" 
                      :style="{ 
                        width: getCategoryPercentage(distB, cat) + '%',
                        background: getChapterAccent(compB.chapterId)
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="phrases-comparison">
            <div class="phrases-column">
              <div class="phrases-label">作品 A 词句</div>
              <div class="phrases-list">
                <span 
                  v-for="phrase in compA.phrases" 
                  :key="phrase.id"
                  class="phrase-tag"
                  :style="{ 
                    borderColor: getRarityColor(phrase.rarity),
                    color: getRarityColor(phrase.rarity)
                  }"
                  :title="`${getRarityLabel(phrase.rarity)} · ${CATEGORY_LABELS[phrase.category]}`"
                >
                  {{ phrase.text }}
                </span>
              </div>
            </div>
            <div class="phrases-column">
              <div class="phrases-label">作品 B 词句</div>
              <div class="phrases-list">
                <span 
                  v-for="phrase in compB.phrases" 
                  :key="phrase.id"
                  class="phrase-tag"
                  :style="{ 
                    borderColor: getRarityColor(phrase.rarity),
                    color: getRarityColor(phrase.rarity)
                  }"
                  :title="`${getRarityLabel(phrase.rarity)} · ${CATEGORY_LABELS[phrase.category]}`"
                >
                  {{ phrase.text }}
                </span>
              </div>
            </div>
          </div>

          <div class="imagery-comparison">
            <div class="imagery-column">
              <div class="imagery-label">核心意象 · A</div>
              <div class="imagery-tags">
                <span 
                  v-for="(img, idx) in imageryA" 
                  :key="idx"
                  class="imagery-tag"
                  :style="{ color: getChapterAccent(compA.chapterId) }"
                >
                  {{ img }}
                </span>
              </div>
            </div>
            <div class="imagery-column">
              <div class="imagery-label">核心意象 · B</div>
              <div class="imagery-tags">
                <span 
                  v-for="(img, idx) in imageryB" 
                  :key="idx"
                  class="imagery-tag"
                  :style="{ color: getChapterAccent(compB.chapterId) }"
                >
                  {{ img }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-section">
          <div class="section-header">
            <span class="section-icon">📖</span>
            <span class="section-title">章节背景</span>
          </div>
          
          <div class="chapter-comparison">
            <div class="chapter-info-card" :style="{ '--accent': getChapterAccent(compA.chapterId) }">
              <div class="chapter-title" :style="{ color: getChapterAccent(compA.chapterId) }">
                {{ chapterA?.title || '自由之境' }}
              </div>
              <div class="chapter-subtitle">{{ chapterA?.subtitle || '' }}</div>
              <div class="chapter-theme">
                <span class="theme-label">主题</span>
                <span class="theme-value">{{ chapterA?.theme || '自由' }}</span>
              </div>
              <div class="chapter-target">
                <span class="target-label">目标词数</span>
                <span class="target-value">{{ chapterA?.targetPhraseCount || 10 }} 词</span>
              </div>
              <div v-if="chapterA?.qualifierWords && chapterA.qualifierWords.length > 0" class="chapter-keywords">
                <span class="keywords-label">限定词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterA.qualifierWords" 
                    :key="word"
                    class="keyword-tag qualifier"
                    :class="{ used: compA.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compA.phrases.some(p => p.text === word)" class="used-check">✓</span>
                  </span>
                </div>
              </div>
              <div v-if="chapterA?.hiddenKeywords && chapterA.hiddenKeywords.length > 0" class="chapter-keywords">
                <span class="keywords-label">隐藏词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterA.hiddenKeywords" 
                    :key="word"
                    class="keyword-tag hidden"
                    :class="{ used: compA.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compA.phrases.some(p => p.text === word)" class="used-check">✓</span>
                  </span>
                </div>
              </div>
              <div v-if="chapterA?.forbiddenWords && chapterA.forbiddenWords.length > 0" class="chapter-keywords">
                <span class="keywords-label">禁用词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterA.forbiddenWords" 
                    :key="word"
                    class="keyword-tag forbidden"
                    :class="{ used: compA.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compA.phrases.some(p => p.text === word)" class="used-check">✗</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="chapter-info-card" :style="{ '--accent': getChapterAccent(compB.chapterId) }">
              <div class="chapter-title" :style="{ color: getChapterAccent(compB.chapterId) }">
                {{ chapterB?.title || '自由之境' }}
              </div>
              <div class="chapter-subtitle">{{ chapterB?.subtitle || '' }}</div>
              <div class="chapter-theme">
                <span class="theme-label">主题</span>
                <span class="theme-value">{{ chapterB?.theme || '自由' }}</span>
              </div>
              <div class="chapter-target">
                <span class="target-label">目标词数</span>
                <span class="target-value">{{ chapterB?.targetPhraseCount || 10 }} 词</span>
              </div>
              <div v-if="chapterB?.qualifierWords && chapterB.qualifierWords.length > 0" class="chapter-keywords">
                <span class="keywords-label">限定词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterB.qualifierWords" 
                    :key="word"
                    class="keyword-tag qualifier"
                    :class="{ used: compB.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compB.phrases.some(p => p.text === word)" class="used-check">✓</span>
                  </span>
                </div>
              </div>
              <div v-if="chapterB?.hiddenKeywords && chapterB.hiddenKeywords.length > 0" class="chapter-keywords">
                <span class="keywords-label">隐藏词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterB.hiddenKeywords" 
                    :key="word"
                    class="keyword-tag hidden"
                    :class="{ used: compB.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compB.phrases.some(p => p.text === word)" class="used-check">✓</span>
                  </span>
                </div>
              </div>
              <div v-if="chapterB?.forbiddenWords && chapterB.forbiddenWords.length > 0" class="chapter-keywords">
                <span class="keywords-label">禁用词</span>
                <div class="keywords-list">
                  <span 
                    v-for="word in chapterB.forbiddenWords" 
                    :key="word"
                    class="keyword-tag forbidden"
                    :class="{ used: compB.phrases.some(p => p.text === word) }"
                  >
                    {{ word }}
                    <span v-if="compB.phrases.some(p => p.text === word)" class="used-check">✗</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-footer">
          <button class="footer-btn load-a" @click="emit('load', compA)">
            📝 编辑作品 A
          </button>
          <button class="footer-btn swap" @click="emit('swap')">
            🔄 交换位置
          </button>
          <button class="footer-btn load-b" @click="emit('load', compB)">
            📝 编辑作品 B
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.compare-panel {
  width: 100%;
  max-width: 1100px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.compare-header {
  padding: 20px 28px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.1), transparent);
}

.compare-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.compare-title {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--text-primary);
  letter-spacing: 4px;
  margin: 0;
}

.compare-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.swap-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.swap-btn:hover {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.compare-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.compare-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.compare-columns {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
}

.compare-column {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.compare-column:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #1a1a2e;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.column-info {
  flex: 1;
  min-width: 0;
}

.composition-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.composition-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.meta-chapter {
  color: var(--accent);
}

.load-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.load-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1a2e;
}

.compare-divider {
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-vs {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border);
  color: var(--accent-gold);
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compare-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: 1px;
}

.score-overview {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
}

.score-display {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent);
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.score-value {
  font-family: var(--font-brush);
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.score-value.winner {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.winner-badge {
  font-size: 28px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.score-grade {
  font-size: 18px;
  font-weight: 600;
  margin-top: 4px;
  letter-spacing: 2px;
}

.score-comment {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  font-family: var(--font-serif);
}

.score-diff-display {
  text-align: center;
  padding: 16px;
}

.diff-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.diff-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--text-secondary);
  font-family: var(--font-brush);
}

.diff-value.positive {
  color: var(--accent-gold);
}

.diff-value.negative {
  color: var(--accent-red);
}

.dimension-comparison {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dimension-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.dimension-bar-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.dimension-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.dimension-bar.side-a .bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.dimension-bar.side-b .bar-fill.reverse {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  margin-left: auto;
}

.dimension-values {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  min-width: 100px;
}

.value-diff {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.value-diff.positive {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.15);
}

.value-diff.negative {
  color: var(--accent-red);
  background: rgba(139, 69, 87, 0.15);
}

.structure-comparison {
  margin-bottom: 20px;
}

.structure-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.structure-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.structure-count {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.structure-divider {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-label {
  width: 80px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.category-icon {
  font-size: 14px;
}

.category-bar-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
}

.category-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.category-bar.side-a .bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.category-bar.side-b .bar-fill.reverse {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  margin-left: auto;
}

.bar-count {
  position: absolute;
  font-size: 11px;
  color: var(--text-primary);
  font-weight: 500;
  z-index: 1;
}

.category-bar.side-a .bar-count {
  right: 8px;
}

.category-bar.side-b .bar-count {
  left: 8px;
}

.category-percentage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  min-width: 70px;
}

.pct-divider {
  color: var(--text-muted);
}

.phrases-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.phrases-column {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.phrases-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.phrases-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.phrase-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.phrase-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.imagery-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.imagery-column {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
}

.imagery-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.imagery-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.imagery-tag {
  font-size: 13px;
  font-weight: 500;
}

.imagery-tag::before {
  content: '·';
  margin-right: 4px;
  opacity: 0.6;
}

.chapter-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chapter-info-card {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 10px;
  padding: 16px;
}

.chapter-title {
  font-family: var(--font-brush);
  font-size: 20px;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.chapter-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.chapter-theme,
.chapter-target {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
}

.theme-label,
.target-label,
.keywords-label {
  color: var(--text-muted);
  font-size: 12px;
}

.theme-value,
.target-value {
  color: var(--text-primary);
  font-weight: 500;
}

.chapter-keywords {
  margin-top: 12px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.keyword-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.keyword-tag.qualifier {
  background: rgba(201, 168, 108, 0.1);
  border: 1px solid rgba(201, 168, 108, 0.3);
  color: var(--text-secondary);
}

.keyword-tag.qualifier.used {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.keyword-tag.hidden {
  background: rgba(168, 122, 201, 0.1);
  border: 1px solid rgba(168, 122, 201, 0.3);
  color: var(--text-secondary);
}

.keyword-tag.hidden.used {
  background: rgba(168, 122, 201, 0.2);
  color: #c98bc4;
}

.keyword-tag.forbidden {
  background: rgba(139, 69, 87, 0.1);
  border: 1px solid rgba(139, 69, 87, 0.3);
  color: var(--text-secondary);
}

.keyword-tag.forbidden.used {
  background: rgba(139, 69, 87, 0.3);
  color: var(--accent-red);
}

.used-check {
  font-size: 10px;
}

.compare-footer {
  display: flex;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.footer-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  border: 1px solid transparent;
  font-weight: 500;
}

.footer-btn.load-a {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.footer-btn.load-a:hover {
  background: var(--accent-gold);
  color: #1a1a2e;
}

.footer-btn.load-b {
  background: rgba(122, 158, 168, 0.15);
  border-color: rgba(122, 158, 168, 0.4);
  color: #7a9ea8;
}

.footer-btn.load-b:hover {
  background: #7a9ea8;
  color: #1a1a2e;
}

.footer-btn.swap {
  flex: 0.6;
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border);
  color: var(--text-secondary);
}

.footer-btn.swap:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 900px) {
  .compare-panel {
    max-height: 95vh;
  }
  
  .compare-columns {
    grid-template-columns: 1fr;
  }
  
  .compare-divider {
    padding: 8px 0;
  }
  
  .score-overview {
    grid-template-columns: 1fr;
  }
  
  .score-diff-display {
    order: -1;
  }
  
  .phrases-comparison,
  .imagery-comparison,
  .chapter-comparison {
    grid-template-columns: 1fr;
  }
  
  .dimension-bar-container {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .dimension-values {
    order: -1;
  }
  
  .compare-footer {
    flex-direction: column;
  }
  
  .footer-btn.swap {
    flex: 1;
    order: -1;
  }
}
</style>
