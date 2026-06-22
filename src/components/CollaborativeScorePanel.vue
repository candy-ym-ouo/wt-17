<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CollaborativePoem, Turn, TurnScore } from '@/types'
import {
  getTurnAverageScore,
  getPoemTotalScore,
  getFullPoemText,
  submitTurnScore,
  getCurrentUser,
  getPoemById,
  completePoem,
  archivePoem,
  unarchivePoem
} from '@/utils/collaborativePoetry'
import { COLLABORATIVE_STATUS_LABELS, COLLABORATIVE_STATUS_COLORS } from '@/types'

const props = defineProps<{
  poemId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
  (e: 'switchToEditor'): void
}>()

const initialPoem = getPoemById(props.poemId)
const localPoem = ref<CollaborativePoem>(initialPoem || ({} as CollaborativePoem))
const selectedTurnId = ref<string | null>(null)
const refreshKey = ref(0)
const showCompleteConfirm = ref(false)
const showArchiveConfirm = ref(false)

const coherenceScore = ref(80)
const imageryScore = ref(80)
const rhythmScore = ref(80)
const themeMatchScore = ref(80)
const scoreComment = ref('')

const user = getCurrentUser()

const sortedTurns = computed((): Turn[] => {
  void refreshKey.value
  return [...localPoem.value.turns]
    .filter(t => t.submittedAt > 0)
    .sort((a, b) => a.turnNumber - b.turnNumber)
})

const totalScore = computed((): number => {
  void refreshKey.value
  return getPoemTotalScore(localPoem.value)
})

const fullText = computed((): string => {
  return getFullPoemText(localPoem.value)
})

const selectedTurn = computed((): Turn | null => {
  if (!selectedTurnId.value) return null
  return localPoem.value.turns.find(t => t.id === selectedTurnId.value) || null
})

const selectedTurnScores = computed((): TurnScore[] => {
  if (!selectedTurnId.value) return []
  return localPoem.value.turnScores.filter(s => s.turnId === selectedTurnId.value)
})

const myScoreForSelectedTurn = computed((): TurnScore | undefined => {
  if (!selectedTurnId.value) return undefined
  return localPoem.value.turnScores.find(
    s => s.turnId === selectedTurnId.value && s.scorerId === user.id
  )
})

const averageScoreForSelected = computed((): number => {
  if (!selectedTurnId.value) return 0
  return getTurnAverageScore(localPoem.value, selectedTurnId.value)
})

const allTurnsScored = computed((): boolean => {
  return sortedTurns.value.every(t => {
    const scores = localPoem.value.turnScores.filter(s => s.turnId === t.id)
    return scores.length > 0
  })
})

const iScoredAllTurns = computed((): boolean => {
  return sortedTurns.value.every(t => {
    return localPoem.value.turnScores.some(
      s => s.turnId === t.id && s.scorerId === user.id
    )
  })
})

const refreshPoem = () => {
  const fresh = getPoemById(localPoem.value.id)
  if (fresh) {
    localPoem.value = { ...fresh }
  }
  refreshKey.value++
}

const handleSelectTurn = (turnId: string) => {
  selectedTurnId.value = turnId
  const existing = localPoem.value.turnScores.find(
    s => s.turnId === turnId && s.scorerId === user.id
  )
  if (existing) {
    coherenceScore.value = existing.coherence
    imageryScore.value = existing.imagery
    rhythmScore.value = existing.rhythm
    themeMatchScore.value = existing.themeMatch
    scoreComment.value = existing.comment
  } else {
    coherenceScore.value = 80
    imageryScore.value = 80
    rhythmScore.value = 80
    themeMatchScore.value = 80
    scoreComment.value = ''
  }
}

const handleSubmitScore = () => {
  if (!selectedTurnId.value) return

  submitTurnScore(
    localPoem.value.id,
    selectedTurnId.value,
    {
      coherence: coherenceScore.value,
      imagery: imageryScore.value,
      rhythm: rhythmScore.value,
      themeMatch: themeMatchScore.value
    },
    scoreComment.value.trim()
  )

  refreshPoem()
  emit('refresh')
}

const handleCompletePoem = () => {
  completePoem(localPoem.value.id)
  refreshPoem()
  showCompleteConfirm.value = false
  emit('refresh')
}

const handleArchivePoem = () => {
  archivePoem(localPoem.value.id)
  refreshPoem()
  showArchiveConfirm.value = false
  emit('refresh')
}

const handleUnarchivePoem = () => {
  unarchivePoem(localPoem.value.id)
  refreshPoem()
  emit('refresh')
}

const formatDate = (ts: number): string => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return '#ffd700'
  if (score >= 75) return '#7ca97c'
  if (score >= 60) return '#c9a86c'
  if (score >= 40) return '#7a9ea8'
  return '#c56b6b'
}

const getScoreLabel = (score: number): string => {
  if (score >= 90) return '神品'
  if (score >= 75) return '妙品'
  if (score >= 60) return '佳品'
  if (score >= 40) return '能品'
  return '习作'
}

watch(() => props.poemId, () => {
  refreshPoem()
})

onMounted(() => {
  refreshPoem()
  if (sortedTurns.value.length > 0) {
    handleSelectTurn(sortedTurns.value[0].id)
  }
})
</script>

<template>
  <div class="score-panel">
    <div class="score-header">
      <div class="poem-overview">
        <div class="poem-title-row">
          <span class="poem-icon">{{ localPoem.icon }}</span>
          <h3 class="poem-title">{{ localPoem.title }}</h3>
          <span
            class="status-badge"
            :style="{ backgroundColor: COLLABORATIVE_STATUS_COLORS[localPoem.status] + '30', color: COLLABORATIVE_STATUS_COLORS[localPoem.status] }"
          >
            {{ COLLABORATIVE_STATUS_LABELS[localPoem.status] }}
          </span>
        </div>
        <p class="poem-theme">主题：{{ localPoem.theme }}</p>
      </div>

      <div class="total-score-section" :style="{ borderColor: localPoem.accentColor + '50' }">
        <div class="total-score-label">总评分</div>
        <div class="total-score-value" :style="{ color: getScoreColor(totalScore) }">
          {{ totalScore || '--' }}
        </div>
        <div class="total-score-grade" :style="{ color: getScoreColor(totalScore) }">
          {{ totalScore ? getScoreLabel(totalScore) : '-' }}
        </div>
      </div>
    </div>

    <div class="full-poem-section">
      <h4 class="section-title">📖 完整诗作</h4>
      <div class="full-poem-text">
        <template v-if="fullText">
          <p v-for="(line, idx) in fullText.split('\n')" :key="idx" class="poem-line">
            {{ line }}
          </p>
        </template>
        <p v-else class="empty-poem">暂无内容</p>
      </div>
    </div>

    <div class="score-content">
      <div class="turns-list-section">
        <h4 class="section-title">🎯 各回合评分</h4>
        <div class="turns-score-list">
          <div
            v-for="turn in sortedTurns"
            :key="turn.id"
            class="turn-score-item"
            :class="{ active: selectedTurnId === turn.id, scored: selectedTurnScores.length > 0 }"
            @click="handleSelectTurn(turn.id)"
          >
            <div class="turn-score-header">
              <span class="turn-number" :style="{ backgroundColor: localPoem.accentColor + '30', color: localPoem.accentColor }">
                第{{ turn.turnNumber }}联
              </span>
              <span class="turn-author">{{ turn.participantName }}</span>
            </div>
            <p class="turn-score-preview">{{ turn.content }}</p>
            <div class="turn-score-meta">
              <span class="meta-score" :style="{ color: getScoreColor(getTurnAverageScore(localPoem, turn.id)) }">
                {{ getTurnAverageScore(localPoem, turn.id) || '--' }}分
              </span>
              <span class="meta-count">
                {{ localPoem.turnScores.filter(s => s.turnId === turn.id).length }}人评
              </span>
              <span
                v-if="localPoem.turnScores.some(s => s.turnId === turn.id && s.scorerId === user.id)"
                class="meta-rated"
              >
                ✓ 已评
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="scoring-section" v-if="selectedTurn">
        <h4 class="section-title">
          {{ myScoreForSelectedTurn ? '修改评分' : '为该回合评分' }}
          <span class="turn-info">第{{ selectedTurn.turnNumber }}联 · {{ selectedTurn.participantName }}</span>
        </h4>

        <div class="selected-turn-content">
          <p class="content-label">诗句内容</p>
          <div class="content-text">{{ selectedTurn.content }}</div>
          <p v-if="selectedTurn.comment" class="content-comment">
            <span class="comment-label">作者备注：</span>{{ selectedTurn.comment }}
          </p>
        </div>

        <div class="score-dimensions" v-if="localPoem.status !== 'archived'">
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-label">连贯性</span>
              <span class="dimension-value" :style="{ color: getScoreColor(coherenceScore) }">
                {{ coherenceScore }}
              </span>
            </div>
            <input
              v-model.number="coherenceScore"
              type="range"
              min="0"
              max="100"
              class="score-slider"
              :style="{ '--slider-color': getScoreColor(coherenceScore) }"
            />
          </div>

          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-label">意象丰富度</span>
              <span class="dimension-value" :style="{ color: getScoreColor(imageryScore) }">
                {{ imageryScore }}
              </span>
            </div>
            <input
              v-model.number="imageryScore"
              type="range"
              min="0"
              max="100"
              class="score-slider"
              :style="{ '--slider-color': getScoreColor(imageryScore) }"
            />
          </div>

          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-label">节奏韵律</span>
              <span class="dimension-value" :style="{ color: getScoreColor(rhythmScore) }">
                {{ rhythmScore }}
              </span>
            </div>
            <input
              v-model.number="rhythmScore"
              type="range"
              min="0"
              max="100"
              class="score-slider"
              :style="{ '--slider-color': getScoreColor(rhythmScore) }"
            />
          </div>

          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-label">主题契合</span>
              <span class="dimension-value" :style="{ color: getScoreColor(themeMatchScore) }">
                {{ themeMatchScore }}
              </span>
            </div>
            <input
              v-model.number="themeMatchScore"
              type="range"
              min="0"
              max="100"
              class="score-slider"
              :style="{ '--slider-color': getScoreColor(themeMatchScore) }"
            />
          </div>

          <div class="dimension-item comment-item">
            <span class="dimension-label">评语</span>
            <textarea
              v-model="scoreComment"
              class="comment-textarea"
              placeholder="写下你的评价和建议..."
              rows="2"
              maxlength="100"
            ></textarea>
          </div>

          <button
            class="collab-primary-btn submit-score-btn"
            @click="handleSubmitScore"
            :style="{ backgroundColor: localPoem.accentColor }"
          >
            {{ myScoreForSelectedTurn ? '✓ 更新评分' : '✓ 提交评分' }}
          </button>
        </div>

        <div class="archived-notice" v-else>
          <span class="archive-icon">📚</span>
          <span>作品已归档，不可修改评分</span>
        </div>

        <div class="other-scores-section" v-if="selectedTurnScores.length > 0">
          <h5 class="subsection-title">所有评分（{{ selectedTurnScores.length }}人）</h5>
          <div class="scores-list">
            <div v-for="s in selectedTurnScores" :key="s.scorerId + s.scoredAt" class="other-score-item">
              <div class="scorer-header">
                <span class="scorer-name">{{ s.scorerName }}</span>
                <span class="scorer-score" :style="{ color: getScoreColor(Math.round((s.coherence + s.imagery + s.rhythm + s.themeMatch) / 4)) }">
                  {{ Math.round((s.coherence + s.imagery + s.rhythm + s.themeMatch) / 4) }}分
                </span>
                <span class="scorer-time">{{ formatDate(s.scoredAt) }}</span>
              </div>
              <div class="scorer-dimensions">
                <span class="dim-tag">连贯{{ s.coherence }}</span>
                <span class="dim-tag">意象{{ s.imagery }}</span>
                <span class="dim-tag">韵律{{ s.rhythm }}</span>
                <span class="dim-tag">主题{{ s.themeMatch }}</span>
              </div>
              <p v-if="s.comment" class="scorer-comment">"{{ s.comment }}"</p>
            </div>
          </div>
        </div>

        <div class="score-average-section" v-if="averageScoreForSelected > 0">
          <div class="average-row">
            <span class="average-label">该回合均分</span>
            <span class="average-value" :style="{ color: getScoreColor(averageScoreForSelected) }">
              {{ averageScoreForSelected }}分 · {{ getScoreLabel(averageScoreForSelected) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="action-footer">
      <template v-if="localPoem.status === 'in_progress'">
        <button class="collab-secondary-btn" @click="emit('switchToEditor')">
          ← 返回创作
        </button>
      </template>

      <template v-else-if="localPoem.status === 'scoring'">
        <button class="collab-secondary-btn" @click="emit('switchToEditor')">
          ← 返回创作
        </button>
        <button
          v-if="iScoredAllTurns"
          class="collab-primary-btn"
          :style="{ backgroundColor: localPoem.accentColor }"
          @click="showCompleteConfirm = true"
        >
          ✓ 完成联诗
        </button>
      </template>

      <template v-else-if="localPoem.status === 'completed'">
        <button
          class="collab-primary-btn"
          :style="{ backgroundColor: localPoem.accentColor }"
          @click="showArchiveConfirm = true"
        >
          📚 归档作品
        </button>
      </template>

      <template v-else-if="localPoem.status === 'archived'">
        <button class="collab-secondary-btn" @click="handleUnarchivePoem">
          ↩ 取消归档
        </button>
      </template>
    </div>

    <div v-if="showCompleteConfirm" class="collab-confirm-overlay" @click.self="showCompleteConfirm = false">
      <div class="collab-confirm-dialog">
        <h3 class="confirm-title">确认完成</h3>
        <p class="confirm-text">完成后诗作将进入已完成状态，确定要完成这首联诗吗？</p>
        <div class="confirm-actions">
          <button class="collab-secondary-btn" @click="showCompleteConfirm = false">取消</button>
          <button class="collab-primary-btn" @click="handleCompletePoem" :style="{ backgroundColor: localPoem.accentColor }">
            确认完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showArchiveConfirm" class="collab-confirm-overlay" @click.self="showArchiveConfirm = false">
      <div class="collab-confirm-dialog">
        <h3 class="confirm-title">确认归档</h3>
        <p class="confirm-text">归档后作品将移入归档区，确定要归档吗？</p>
        <div class="confirm-actions">
          <button class="collab-secondary-btn" @click="showArchiveConfirm = false">取消</button>
          <button class="collab-primary-btn" @click="handleArchivePoem" :style="{ backgroundColor: localPoem.accentColor }">
            确认归档
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.poem-overview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.poem-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.poem-icon {
  font-size: 26px;
}

.poem-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  margin: 0;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.poem-theme {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.total-score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 24px;
  border: 2px solid;
  border-radius: 12px;
  min-width: 100px;
}

.total-score-label {
  font-size: 12px;
  color: var(--text-muted);
}

.total-score-value {
  font-family: var(--font-brush);
  font-size: 42px;
  font-weight: bold;
  line-height: 1;
}

.total-score-grade {
  font-size: 14px;
}

.section-title {
  font-size: 15px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-brush);
}

.subsection-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}

.turn-info {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-serif);
  font-weight: normal;
  margin-left: 8px;
}

.full-poem-section {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.full-poem-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.poem-line {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  line-height: 2;
  margin: 0;
  text-align: center;
}

.empty-poem {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px;
  margin: 0;
}

.score-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.turns-list-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.turns-score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.turn-score-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.turn-score-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.turn-score-item.active {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
}

.turn-score-item.scored {
  border-color: rgba(124, 169, 124, 0.3);
}

.turn-score-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.turn-number {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.turn-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.turn-score-preview {
  font-size: 13px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.turn-score-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.meta-score {
  font-weight: 600;
}

.meta-count {
  color: var(--text-muted);
}

.meta-rated {
  color: #7ca97c;
}

.scoring-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-y: auto;
  min-height: 0;
}

.selected-turn-content {
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.content-label {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.content-text {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  line-height: 1.8;
}

.content-comment {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.comment-label {
  color: var(--text-secondary);
}

.score-dimensions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.dimension-value {
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-brush);
}

.score-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--slider-color, var(--accent-gold));
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.score-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--slider-color, var(--accent-gold));
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.comment-item {
  gap: 6px;
}

.comment-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-serif);
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-textarea:focus {
  border-color: var(--accent-gold);
}

.submit-score-btn {
  padding: 10px 20px;
  font-size: 14px;
  align-self: flex-end;
  flex: none;
}

.archived-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(107, 104, 88, 0.1);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.archive-icon {
  font-size: 18px;
}

.other-scores-section {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.scores-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.other-score-item {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scorer-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scorer-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.scorer-score {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-brush);
}

.scorer-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}

.scorer-dimensions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dim-tag {
  padding: 1px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.scorer-comment {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
  padding-left: 4px;
}

.score-average-section {
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.average-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.average-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.average-value {
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-brush);
}

.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.collab-primary-btn {
  padding: 8px 16px;
  background: var(--accent-gold);
  color: #1a1a2e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.collab-primary-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.collab-primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.collab-secondary-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.collab-secondary-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.collab-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;
}

.collab-confirm-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  max-width: 360px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confirm-title {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.confirm-text {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
