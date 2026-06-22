<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CollaborativePoem, Turn } from '@/types'
import {
  lockTurn,
  unlockTurn,
  submitTurn,
  getTurnLockStatus,
  getPoemById,
  getPoemProgress,
  getCurrentUser,
  getCurrentUserFull,
  getAllUsers,
  switchUser,
  startPoem,
  getNextSuggestedParticipant
} from '@/utils/collaborativePoetry'
import { COLLABORATIVE_STATUS_LABELS, COLLABORATIVE_STATUS_COLORS } from '@/types'

const props = defineProps<{
  poemId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
  (e: 'switchToScore'): void
}>()

const initialPoem = getPoemById(props.poemId)
const localPoem = ref<CollaborativePoem>(initialPoem || ({} as CollaborativePoem))
const turnContent = ref('')
const turnComment = ref('')
const isEditing = ref(false)
const hasLock = ref(false)
const refreshKey = ref(0)
const showUserSwitcher = ref(false)

const currentTurn = computed((): Turn | undefined => {
  void refreshKey.value
  return localPoem.value.turns.find(t => t.turnNumber === localPoem.value.currentTurnNumber)
})

const currentTurnLockStatus = computed(() => {
  void refreshKey.value
  return getTurnLockStatus(localPoem.value.id, localPoem.value.currentTurnNumber)
})

const sortedTurns = computed(() => {
  void refreshKey.value
  return [...localPoem.value.turns]
    .filter(t => t.submittedAt > 0 || t.turnNumber <= localPoem.value.currentTurnNumber)
    .sort((a, b) => a.turnNumber - b.turnNumber)
})

const progress = computed(() => {
  void refreshKey.value
  return getPoemProgress(localPoem.value)
})

const isCurrentTurnSubmitted = computed(() => {
  const t = currentTurn.value
  return t && t.submittedAt > 0
})

const currentUserFull = computed(() => {
  void refreshKey.value
  return getCurrentUserFull()
})

const allAvailableUsers = computed(() => {
  void refreshKey.value
  return getAllUsers()
})

const nextSuggested = computed(() => {
  void refreshKey.value
  return getNextSuggestedParticipant(localPoem.value)
})

const isMyTurn = computed(() => {
  if (!nextSuggested.value) return true
  return nextSuggested.value.id === currentUserFull.value?.id
})

const refreshPoem = () => {
  const fresh = getPoemById(localPoem.value.id)
  if (fresh) {
    localPoem.value = { ...fresh }
  }
  refreshKey.value++
}

const handleLockTurn = () => {
  const result = lockTurn(localPoem.value.id, localPoem.value.currentTurnNumber)
  if (result) {
    hasLock.value = true
    isEditing.value = true
    turnContent.value = result.content || ''
    refreshPoem()
  } else {
    alert('该回合已被其他参与者锁定')
  }
}

const handleUnlockTurn = () => {
  if (confirm('确定要解除锁定吗？当前编辑内容将不会保存。')) {
    unlockTurn(localPoem.value.id, localPoem.value.currentTurnNumber)
    hasLock.value = false
    isEditing.value = false
    turnContent.value = ''
    turnComment.value = ''
    refreshPoem()
  }
}

const handleSubmitTurn = () => {
  if (!turnContent.value.trim()) {
    alert('请输入内容')
    return
  }
  if (turnContent.value.trim().length < 2) {
    alert('内容至少需要2个字')
    return
  }

  const forbidden = localPoem.value.forbiddenWords || []
  for (const word of forbidden) {
    if (turnContent.value.includes(word)) {
      alert(`内容包含禁用词：${word}，请修改后再提交`)
      return
    }
  }

  const result = submitTurn(
    localPoem.value.id,
    localPoem.value.currentTurnNumber,
    turnContent.value.trim(),
    turnComment.value.trim() || undefined
  )

  if (result) {
    localPoem.value = result
    hasLock.value = false
    isEditing.value = false
    turnContent.value = ''
    turnComment.value = ''
    refreshKey.value++
    emit('refresh')

    if (result.status === 'scoring') {
      setTimeout(() => {
        emit('switchToScore')
      }, 800)
    }
  }
}

const handleStartPoem = () => {
  const result = startPoem(localPoem.value.id)
  if (result) {
    localPoem.value = result
    refreshKey.value++
  }
}

const formatDate = (ts: number): string => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const handleSwitchUser = (userId: string) => {
  switchUser(userId)
  refreshPoem()
  showUserSwitcher.value = false
}

watch(() => props.poemId, () => {
  refreshPoem()
})

onMounted(() => {
  refreshPoem()
})
</script>

<template>
  <div class="turn-editor">
    <div class="editor-header-info">
      <div class="poem-meta-row">
        <span
          class="status-badge"
          :style="{ backgroundColor: COLLABORATIVE_STATUS_COLORS[localPoem.status] + '30', color: COLLABORATIVE_STATUS_COLORS[localPoem.status] }"
        >
          {{ COLLABORATIVE_STATUS_LABELS[localPoem.status] }}
        </span>
        <span class="theme-tag">
          主题：{{ localPoem.theme }}
        </span>
        <span class="creator-tag">
          发起者：{{ localPoem.creatorName }}
        </span>
        <div class="current-user-wrap" @click.stop="showUserSwitcher = !showUserSwitcher">
          <span class="current-user-avatar">{{ currentUserFull?.avatar || '👤' }}</span>
          <span class="current-user-label">{{ currentUserFull?.name || '我' }}</span>
          <span class="switch-arrow">{{ showUserSwitcher ? '▲' : '▼' }}</span>
          <div v-if="showUserSwitcher" class="user-switcher-popup" @click.stop>
            <div class="switcher-title">切换身份</div>
            <div class="switcher-user-list">
              <div
                v-for="u in allAvailableUsers"
                :key="u.id"
                class="switcher-user-item"
                :class="{ active: u.id === currentUserFull?.id }"
                @click="handleSwitchUser(u.id)"
              >
                <span class="switcher-avatar">{{ u.avatar }}</span>
                <span class="switcher-name">{{ u.name }}</span>
                <span v-if="u.id === currentUserFull?.id" class="switcher-current">当前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="localPoem.description" class="poem-description">{{ localPoem.description }}</p>

      <div
        v-if="localPoem.status === 'in_progress' && nextSuggested"
        class="turn-reminder-banner"
        :class="{ myturn: isMyTurn }"
      >
        <span class="reminder-icon">{{ isMyTurn ? '🎯' : '⏳' }}</span>
        <span class="reminder-text">
          <template v-if="isMyTurn">
            当前回合由 <strong>{{ currentUserFull?.name }}</strong> 创作，加油！
          </template>
          <template v-else>
            建议由 <strong>{{ nextSuggested.name }}</strong> 接续，
            <button class="inline-switch-btn" @click="handleSwitchUser(nextSuggested.id)">
              切换到 {{ nextSuggested.name }}
            </button>
          </template>
        </span>
      </div>

      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">创作进度</span>
          <span class="progress-count">{{ progress.current }}/{{ progress.total }} 回合</span>
        </div>
        <div class="progress-bar-wrap">
          <div
            class="progress-bar-fill"
            :style="{ width: progress.percentage + '%', backgroundColor: localPoem.accentColor }"
          ></div>
        </div>
      </div>

      <div class="rules-section" v-if="localPoem.requiredKeywords && localPoem.requiredKeywords.length > 0">
        <span class="rules-label">📌 关键词：</span>
        <span
          v-for="kw in localPoem.requiredKeywords"
          :key="kw"
          class="rule-keyword"
        >
          {{ kw }}
        </span>
      </div>

      <div class="rules-section" v-if="localPoem.forbiddenWords && localPoem.forbiddenWords.length > 0">
        <span class="rules-label">🚫 禁用词：</span>
        <span
          v-for="word in localPoem.forbiddenWords"
          :key="word"
          class="rule-forbidden"
        >
          {{ word }}
        </span>
      </div>

      <div class="participants-section">
        <span class="rules-label">👥 参与者（{{ localPoem.participants.length }}）：</span>
        <span
          v-for="p in localPoem.participants"
          :key="p.id"
          class="participant-tag"
          :class="{ self: p.id === currentUserFull?.id }"
        >
          {{ p.name }}
        </span>
      </div>
    </div>

    <div class="turns-display">
      <h4 class="section-title">📜 已完成回合</h4>
      <div v-if="sortedTurns.filter(t => t.submittedAt > 0).length === 0" class="empty-turns">
        暂无已完成的回合
      </div>
      <div
        v-for="turn in sortedTurns.filter(t => t.submittedAt > 0)"
        :key="turn.id"
        class="turn-item submitted"
      >
        <div class="turn-header">
          <span class="turn-number" :style="{ backgroundColor: localPoem.accentColor + '30', color: localPoem.accentColor }">
            第{{ turn.turnNumber }}联
          </span>
          <span class="turn-author">{{ turn.participantName }}</span>
          <span class="turn-time">{{ formatDate(turn.submittedAt) }}</span>
        </div>
        <div class="turn-content">
          {{ turn.content }}
        </div>
        <p v-if="turn.comment" class="turn-comment">
          <span class="comment-label">备注：</span>{{ turn.comment }}
        </p>
      </div>
    </div>

    <div v-if="localPoem.status === 'draft'" class="draft-section">
      <div class="draft-notice">
        <span class="draft-icon">📝</span>
        <span>该联诗还在草稿状态，点击下方按钮开始创作</span>
      </div>
      <button class="collab-primary-btn start-btn" @click="handleStartPoem">
        ▶ 开始创作
      </button>
    </div>

    <div v-else-if="localPoem.status === 'in_progress'" class="current-turn-section">
      <h4 class="section-title">
        ✏️ 当前回合 - 第{{ localPoem.currentTurnNumber }}联
        <span class="turn-total">/ 共{{ localPoem.totalTurns }}联</span>
      </h4>

      <div v-if="!isEditing && !isCurrentTurnSubmitted" class="turn-lock-section">
        <div v-if="currentTurnLockStatus.isLocked && !currentTurnLockStatus.canEdit" class="locked-notice">
          <span class="lock-icon">🔒</span>
          <span>该回合已被其他参与者锁定，正在创作中...</span>
        </div>
        <div v-else class="unlock-section">
          <p class="unlock-hint">点击下方按钮锁定该回合，开始你的创作</p>
          <button class="collab-primary-btn lock-btn" @click="handleLockTurn">
            🔒 锁定并开始创作
          </button>
        </div>
      </div>

      <div v-else-if="isEditing && !isCurrentTurnSubmitted" class="edit-section">
        <div class="edit-header">
          <span class="editing-tag">✍️ 创作中...</span>
          <button class="unlock-btn" @click="handleUnlockTurn">
            解除锁定
          </button>
        </div>

        <div class="input-section">
          <label class="input-label">你的诗句</label>
          <textarea
            v-model="turnContent"
            class="turn-textarea"
            placeholder="在此输入你这一回合的诗句..."
            rows="3"
            maxlength="100"
          ></textarea>
          <div class="char-count">{{ turnContent.length }}/100</div>
        </div>

        <div class="input-section">
          <label class="input-label">创作备注（可选）</label>
          <input
            v-model="turnComment"
            type="text"
            class="comment-input"
            placeholder="记录创作思路、用典说明等..."
            maxlength="50"
          />
        </div>

        <div class="submit-actions">
          <button class="collab-secondary-btn" @click="handleUnlockTurn">
            取消
          </button>
          <button
            class="collab-primary-btn submit-btn"
            @click="handleSubmitTurn"
            :disabled="!turnContent.trim() || turnContent.trim().length < 2"
            :style="{ backgroundColor: localPoem.accentColor }"
          >
            ✓ 提交此联
          </button>
        </div>
      </div>

      <div v-else-if="isCurrentTurnSubmitted" class="submitted-notice">
        <span class="check-icon">✓</span>
        <span>本回合已提交，等待下一回合...</span>
      </div>
    </div>

    <div v-else-if="localPoem.status === 'scoring'" class="scoring-section">
      <div class="scoring-notice">
        <span class="scoring-icon">🎯</span>
        <span>所有回合已完成，进入评分阶段</span>
      </div>
      <button class="collab-primary-btn" @click="emit('switchToScore')">
        进入评分 →
      </button>
    </div>
  </div>
</template>

<style scoped>
.turn-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.editor-header-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poem-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.theme-tag,
.creator-tag {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.poem-description {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-count {
  font-size: 13px;
  color: var(--accent-gold);
  font-weight: 500;
}

.progress-bar-wrap {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.rules-section,
.participants-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rules-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.rule-keyword {
  padding: 2px 10px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  border-radius: 10px;
  font-size: 12px;
}

.rule-forbidden {
  padding: 2px 10px;
  background: rgba(197, 107, 107, 0.15);
  color: #c56b6b;
  border-radius: 10px;
  font-size: 12px;
}

.participant-tag {
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border-radius: 10px;
  font-size: 12px;
}

.participant-tag.self {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.section-title {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-brush);
}

.turn-total {
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-serif);
  font-weight: normal;
}

.turns-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-turns {
  text-align: center;
  color: var(--text-muted);
  padding: 24px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.turn-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.turn-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.turn-number {
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.turn-author {
  font-size: 13px;
  color: var(--text-secondary);
}

.turn-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: auto;
}

.turn-content {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  line-height: 1.8;
  padding: 4px 0;
}

.turn-comment {
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

.draft-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.draft-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.draft-icon {
  font-size: 20px;
}

.start-btn {
  padding: 10px 28px;
  font-size: 14px;
}

.current-turn-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.turn-lock-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.locked-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c56b6b;
  font-size: 14px;
  padding: 12px 20px;
  background: rgba(197, 107, 107, 0.1);
  border-radius: 8px;
}

.lock-icon {
  font-size: 18px;
}

.unlock-hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.lock-btn {
  padding: 10px 24px;
  font-size: 14px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editing-tag {
  padding: 4px 12px;
  background: rgba(124, 169, 124, 0.2);
  color: #7ca97c;
  border-radius: 8px;
  font-size: 13px;
}

.unlock-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.unlock-btn:hover {
  background: rgba(197, 107, 107, 0.15);
  color: #c56b6b;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.turn-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--text-primary);
  font-size: 16px;
  font-family: var(--font-brush);
  line-height: 1.8;
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
}

.turn-textarea:focus {
  border-color: var(--accent-gold);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-muted);
}

.comment-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: var(--font-serif);
  outline: none;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: var(--accent-gold);
}

.submit-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.submit-btn {
  padding: 10px 24px;
  font-size: 14px;
}

.submitted-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: rgba(124, 169, 124, 0.1);
  border-radius: 8px;
  color: #7ca97c;
  font-size: 14px;
}

.check-icon {
  font-size: 18px;
  font-weight: bold;
}

.scoring-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.3);
  border-radius: 12px;
}

.scoring-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-size: 15px;
}

.scoring-icon {
  font-size: 24px;
}

.current-user-wrap {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(201, 168, 108, 0.12);
  border: 1px solid rgba(201, 168, 108, 0.3);
  border-radius: 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.current-user-wrap:hover {
  background: rgba(201, 168, 108, 0.2);
}

.current-user-avatar {
  font-size: 16px;
}

.current-user-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-gold);
}

.switch-arrow {
  font-size: 9px;
  color: var(--text-muted);
}

.user-switcher-popup {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 180px;
  background: rgba(15, 15, 26, 0.98);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.switcher-title {
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 8px 8px 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.switcher-user-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
}

.switcher-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.switcher-user-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.switcher-user-item.active {
  background: rgba(201, 168, 108, 0.15);
}

.switcher-avatar {
  font-size: 16px;
}

.switcher-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.switcher-current {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border-radius: 8px;
}

.turn-reminder-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(122, 158, 168, 0.1);
  border: 1px solid rgba(122, 158, 168, 0.25);
  border-radius: 10px;
  flex-wrap: wrap;
}

.turn-reminder-banner.myturn {
  background: rgba(124, 169, 124, 0.12);
  border-color: rgba(124, 169, 124, 0.35);
}

.reminder-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.reminder-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
}

.reminder-text strong {
  color: var(--accent-gold);
  font-weight: 600;
}

.myturn .reminder-text strong {
  color: #7ca97c;
}

.inline-switch-btn {
  padding: 3px 10px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border-radius: 12px;
  font-size: 12px;
  margin-left: 4px;
  transition: all 0.15s;
}

.inline-switch-btn:hover {
  background: rgba(201, 168, 108, 0.3);
}
</style>
