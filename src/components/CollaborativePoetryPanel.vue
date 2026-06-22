<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CollaborativePoem, CollaborativeState, CollaborativeUser } from '@/types'
import {
  loadCollaborativeState,
  createCollaborativePoem,
  getActivePoems,
  getArchivedPoems,
  getPoemProgress,
  getPoemTotalScore,
  deletePoem,
  startPoem,
  joinPoem,
  getAllUsers,
  getCurrentUserFull,
  switchUser,
  addUser,
  removeUser,
  renameUser,
  getNextSuggestedParticipant
} from '@/utils/collaborativePoetry'
import { COLLABORATIVE_STATUS_LABELS, COLLABORATIVE_STATUS_COLORS } from '@/types'
import CollaborativeTurnEditor from './CollaborativeTurnEditor.vue'
import CollaborativeScorePanel from './CollaborativeScorePanel.vue'
import CollaborativeArchive from './CollaborativeArchive.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const state = ref<CollaborativeState>(loadCollaborativeState())
const activeTab = ref<'active' | 'create' | 'editor' | 'score' | 'archive'>('active')
const selectedPoemId = ref<string | null>(null)
const showConfirmDelete = ref(false)
const poemToDelete = ref<string | null>(null)

const newPoemTitle = ref('')
const newPoemTheme = ref('')
const newPoemDescription = ref('')
const newPoemTurns = ref(4)
const newPoemKeywords = ref('')
const newPoemForbidden = ref('')

const showUserPanel = ref(false)
const newUserName = ref('')
const editingUserId = ref<string | null>(null)
const editingUserName = ref('')

const activePoems = computed(() => getActivePoems())
const archivedPoems = computed(() => getArchivedPoems())
const allUsers = computed(() => getAllUsers())
const currentUser = computed(() => getCurrentUserFull())

const selectedPoem = computed((): CollaborativePoem | null => {
  if (!selectedPoemId.value) return null
  return state.value.poems.find(p => p.id === selectedPoemId.value) || null
})

const refreshState = () => {
  state.value = loadCollaborativeState()
}

const formatDate = (ts: number): string => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const handleSwitchUser = (userId: string) => {
  switchUser(userId)
  refreshState()
}

const handleAddUser = () => {
  if (!newUserName.value.trim()) {
    alert('请输入用户名')
    return
  }
  addUser(newUserName.value.trim())
  newUserName.value = ''
  refreshState()
}

const handleStartEditUser = (user: CollaborativeUser) => {
  editingUserId.value = user.id
  editingUserName.value = user.name
}

const handleSaveEditUser = () => {
  if (editingUserId.value && editingUserName.value.trim()) {
    renameUser(editingUserId.value, editingUserName.value.trim())
    refreshState()
  }
  editingUserId.value = null
  editingUserName.value = ''
}

const handleCancelEditUser = () => {
  editingUserId.value = null
  editingUserName.value = ''
}

const handleRemoveUser = (userId: string) => {
  if (allUsers.value.length <= 1) {
    alert('至少需要保留一个用户')
    return
  }
  if (confirm('确定要删除该用户吗？该用户历史创作记录仍会保留。')) {
    removeUser(userId)
    refreshState()
  }
}

const handleCreatePoem = () => {
  if (!newPoemTitle.value.trim()) {
    alert('请输入诗作标题')
    return
  }
  if (!newPoemTheme.value.trim()) {
    alert('请输入诗作主题')
    return
  }

  const keywords = newPoemKeywords.value
    .split(/[，,、\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const forbidden = newPoemForbidden.value
    .split(/[，,、\s]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  createCollaborativePoem(
    newPoemTitle.value.trim(),
    newPoemTheme.value.trim(),
    newPoemDescription.value.trim(),
    newPoemTurns.value,
    {
      requiredKeywords: keywords.length > 0 ? keywords : undefined,
      forbiddenWords: forbidden.length > 0 ? forbidden : undefined
    }
  )

  newPoemTitle.value = ''
  newPoemTheme.value = ''
  newPoemDescription.value = ''
  newPoemTurns.value = 4
  newPoemKeywords.value = ''
  newPoemForbidden.value = ''

  refreshState()
  activeTab.value = 'active'
}

const handleOpenPoem = (poemId: string) => {
  selectedPoemId.value = poemId
  joinPoem(poemId)
  refreshState()
  const poem = state.value.poems.find(p => p.id === poemId)
  if (poem) {
    if (poem.status === 'draft' || poem.status === 'in_progress') {
      activeTab.value = 'editor'
    } else {
      activeTab.value = 'score'
    }
  }
}

const handleStartPoem = (poemId: string) => {
  startPoem(poemId)
  refreshState()
}

const handleRequestDelete = (poemId: string) => {
  poemToDelete.value = poemId
  showConfirmDelete.value = true
}

const handleConfirmDelete = () => {
  if (poemToDelete.value) {
    deletePoem(poemToDelete.value)
    if (selectedPoemId.value === poemToDelete.value) {
      selectedPoemId.value = null
      activeTab.value = 'active'
    }
    refreshState()
  }
  showConfirmDelete.value = false
  poemToDelete.value = null
}

const handleCancelDelete = () => {
  showConfirmDelete.value = false
  poemToDelete.value = null
}

const handleBackToList = () => {
  selectedPoemId.value = null
  activeTab.value = 'active'
  refreshState()
}

const handleEditorClose = () => {
  refreshState()
}

const handleScoreClose = () => {
  refreshState()
}

onMounted(() => {
  refreshState()
})
</script>

<template>
  <div class="collab-panel-overlay" @click.self="emit('close')">
    <div class="collab-panel animate-classic-reveal">
      <div class="collab-header">
        <div class="collab-header-left">
          <span class="collab-icon">📜</span>
          <div>
            <h2 class="collab-title">合卷联诗</h2>
            <p class="collab-subtitle">多人接续创作，共谱佳篇</p>
          </div>
        </div>
        <div class="collab-header-center">
          <div class="current-user-display" @click="showUserPanel = !showUserPanel">
            <span class="user-avatar">{{ currentUser?.avatar || '👤' }}</span>
            <span class="user-name">{{ currentUser?.name || '我' }}</span>
            <span class="user-arrow">{{ showUserPanel ? '▲' : '▼' }}</span>
          </div>
        </div>
        <button class="collab-close-btn" @click="emit('close')">✕</button>
      </div>

      <div v-if="showUserPanel" class="user-panel-popup">
        <div class="user-panel-header">
          <h4 class="user-panel-title">👥 参与者身份管理</h4>
          <p class="user-panel-desc">切换身份模拟多人协作，或添加新的参与者</p>
        </div>
        <div class="user-list">
          <div
            v-for="user in allUsers"
            :key="user.id"
            class="user-item"
            :class="{ active: user.id === currentUser?.id, editing: editingUserId === user.id }"
          >
            <template v-if="editingUserId === user.id">
              <span class="user-avatar">{{ user.avatar }}</span>
              <input
                v-model="editingUserName"
                type="text"
                class="user-edit-input"
                maxlength="12"
                @keyup.enter="handleSaveEditUser"
              />
              <button class="user-action-btn save" @click="handleSaveEditUser">✓</button>
              <button class="user-action-btn cancel" @click="handleCancelEditUser">✕</button>
            </template>
            <template v-else>
              <span class="user-avatar">{{ user.avatar }}</span>
              <span class="user-item-name">{{ user.name }}</span>
              <span v-if="user.id === currentUser?.id" class="current-tag">当前</span>
              <div class="user-actions">
                <button
                  v-if="user.id !== currentUser?.id"
                  class="user-action-btn switch"
                  @click="handleSwitchUser(user.id)"
                  title="切换到此身份"
                >
                  切换
                </button>
                <button class="user-action-btn edit" @click="handleStartEditUser(user)" title="重命名">
                  ✎
                </button>
                <button class="user-action-btn delete" @click="handleRemoveUser(user.id)" title="删除">
                  🗑
                </button>
              </div>
            </template>
          </div>
        </div>
        <div class="add-user-section">
          <input
            v-model="newUserName"
            type="text"
            class="add-user-input"
            placeholder="输入新参与者名称..."
            maxlength="12"
            @keyup.enter="handleAddUser"
          />
          <button class="add-user-btn" @click="handleAddUser" :disabled="!newUserName.trim()">
            + 添加
          </button>
        </div>
      </div>

      <div class="collab-tabs">
        <button
          class="collab-tab"
          :class="{ active: activeTab === 'active' && !selectedPoemId }"
          @click="selectedPoemId = null; activeTab = 'active'"
          :disabled="!!selectedPoemId"
        >
          📖 进行中
        </button>
        <button
          class="collab-tab"
          :class="{ active: activeTab === 'archive' && !selectedPoemId }"
          @click="selectedPoemId = null; activeTab = 'archive'"
          :disabled="!!selectedPoemId"
        >
          📚 归档作品
        </button>
        <button
          class="collab-tab"
          :class="{ active: activeTab === 'create' && !selectedPoemId }"
          @click="selectedPoemId = null; activeTab = 'create'"
          :disabled="!!selectedPoemId"
        >
          ✨ 发起联诗
        </button>
        <template v-if="selectedPoem">
          <span class="collab-tab-separator"></span>
          <button class="collab-tab back-btn" @click="handleBackToList">
            ← 返回
          </button>
          <span class="collab-current-poem" :style="{ color: selectedPoem.accentColor }">
            {{ selectedPoem.icon }} {{ selectedPoem.title }}
          </span>
        </template>
      </div>

      <div class="collab-content">
        <template v-if="activeTab === 'active' && !selectedPoemId">
          <div v-if="activePoems.length === 0" class="collab-empty">
            <div class="empty-icon">📝</div>
            <p class="empty-title">暂无进行中的联诗</p>
            <p class="empty-desc">发起一场联诗，邀请好友共同创作吧</p>
            <button class="collab-primary-btn" @click="activeTab = 'create'">
              ✨ 发起联诗
            </button>
          </div>
          <div v-else class="collab-poem-list">
            <div
              v-for="poem in activePoems"
              :key="poem.id"
              class="collab-poem-card"
              :style="{ borderColor: poem.accentColor + '40' }"
            >
              <div class="poem-card-header">
                <div class="poem-card-title-row">
                  <span class="poem-card-icon">{{ poem.icon }}</span>
                  <h3 class="poem-card-title">{{ poem.title }}</h3>
                  <span
                    class="poem-status-badge"
                    :style="{ backgroundColor: COLLABORATIVE_STATUS_COLORS[poem.status] + '30', color: COLLABORATIVE_STATUS_COLORS[poem.status] }"
                  >
                    {{ COLLABORATIVE_STATUS_LABELS[poem.status] }}
                  </span>
                </div>
                <p class="poem-card-theme">主题：{{ poem.theme }}</p>
              </div>

              <p v-if="poem.description" class="poem-card-desc">{{ poem.description }}</p>

              <div class="poem-card-meta">
                <div class="meta-item">
                  <span class="meta-label">回合</span>
                  <span class="meta-value">{{ getPoemProgress(poem).current }}/{{ poem.totalTurns }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">参与者</span>
                  <span class="meta-value">{{ poem.participants.length }}人</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">均分</span>
                  <span class="meta-value">{{ getPoemTotalScore(poem) || '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">创建</span>
                  <span class="meta-value">{{ formatDate(poem.createdAt) }}</span>
                </div>
              </div>

              <div class="poem-card-progress">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: getPoemProgress(poem).percentage + '%', backgroundColor: poem.accentColor }"
                  ></div>
                </div>
                <span class="progress-text">{{ getPoemProgress(poem).percentage }}%</span>
              </div>

              <div class="poem-card-keywords" v-if="poem.requiredKeywords && poem.requiredKeywords.length > 0">
                <span class="keyword-label">关键词：</span>
                <span
                  v-for="kw in poem.requiredKeywords"
                  :key="kw"
                  class="keyword-tag"
                >
                  {{ kw }}
                </span>
              </div>

              <div
                v-if="poem.status === 'in_progress' && getNextSuggestedParticipant(poem)"
                class="suggest-next-banner"
                :class="{ 'is-current': getNextSuggestedParticipant(poem)?.id === currentUser?.id }"
              >
                <span class="suggest-icon">{{ getNextSuggestedParticipant(poem)?.id === currentUser?.id ? '🎯' : '⏳' }}</span>
                <span class="suggest-text">
                  <template v-if="getNextSuggestedParticipant(poem)?.id === currentUser?.id">
                    轮到 <strong>{{ currentUser?.name }}</strong> 了，快去创作吧！
                  </template>
                  <template v-else>
                    下一棒建议：<strong>{{ getNextSuggestedParticipant(poem)?.name }}</strong>
                  </template>
                </span>
                <button
                  v-if="getNextSuggestedParticipant(poem)?.id !== currentUser?.id"
                  class="suggest-switch-btn"
                  @click.stop="handleSwitchUser(getNextSuggestedParticipant(poem)!.id)"
                >
                  切换身份
                </button>
              </div>

              <div class="poem-card-actions">
                <button
                  v-if="poem.status === 'draft'"
                  class="collab-secondary-btn"
                  @click="handleStartPoem(poem.id)"
                >
                  ▶ 开始创作
                </button>
                <button
                  class="collab-primary-btn"
                  @click="handleOpenPoem(poem.id)"
                  :style="{ backgroundColor: poem.accentColor }"
                >
                  {{ poem.status === 'draft' ? '查看详情' : (poem.status === 'completed' || poem.status === 'archived' || poem.status === 'scoring') ? '查看评分' : '继续创作' }}
                </button>
                <button
                  class="collab-danger-btn"
                  @click="handleRequestDelete(poem.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'archive' && !selectedPoemId">
          <CollaborativeArchive
            :archived-poems="archivedPoems"
            @refresh="refreshState"
            @open="handleOpenPoem"
          />
        </template>

        <template v-else-if="activeTab === 'create' && !selectedPoemId">
          <div class="collab-create-form">
            <div class="form-section">
              <label class="form-label">诗作标题 <span class="required">*</span></label>
              <input
                v-model="newPoemTitle"
                type="text"
                class="form-input"
                placeholder="例如：春江花月夜"
                maxlength="30"
              />
            </div>

            <div class="form-section">
              <label class="form-label">创作主题 <span class="required">*</span></label>
              <input
                v-model="newPoemTheme"
                type="text"
                class="form-input"
                placeholder="例如：山水田园、思乡怀人、边塞征战..."
                maxlength="20"
              />
            </div>

            <div class="form-section">
              <label class="form-label">创作说明</label>
              <textarea
                v-model="newPoemDescription"
                class="form-textarea"
                placeholder="描述创作背景、要求或意境..."
                rows="3"
                maxlength="200"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-section form-half">
                <label class="form-label">总回合数 <span class="required">*</span></label>
                <div class="turn-selector">
                  <button
                    class="turn-btn"
                    @click="newPoemTurns = Math.max(2, newPoemTurns - 1)"
                    :disabled="newPoemTurns <= 2"
                  >−</button>
                  <span class="turn-value">{{ newPoemTurns }}</span>
                  <button
                    class="turn-btn"
                    @click="newPoemTurns = Math.min(20, newPoemTurns + 1)"
                    :disabled="newPoemTurns >= 20"
                  >+</button>
                </div>
                <p class="form-hint">2-20回合，每人依次创作</p>
              </div>
            </div>

            <div class="form-section">
              <label class="form-label">关键词（可选）</label>
              <input
                v-model="newPoemKeywords"
                type="text"
                class="form-input"
                placeholder="用逗号分隔，如：明月,清风,山水"
              />
              <p class="form-hint">创作时尽量融入这些关键词</p>
            </div>

            <div class="form-section">
              <label class="form-label">禁用词（可选）</label>
              <input
                v-model="newPoemForbidden"
                type="text"
                class="form-input"
                placeholder="用逗号分隔，如：现代词,英文"
              />
              <p class="form-hint">创作时避免使用这些词汇</p>
            </div>

            <div class="form-actions">
              <button class="collab-secondary-btn" @click="activeTab = 'active'">取消</button>
              <button class="collab-primary-btn" @click="handleCreatePoem">
                ✨ 发起联诗
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="selectedPoem && activeTab === 'editor'">
          <CollaborativeTurnEditor
            :poemId="selectedPoem.id"
            @close="handleEditorClose"
            @refresh="refreshState"
            @switchToScore="activeTab = 'score'"
          />
        </template>

        <template v-else-if="selectedPoem && (activeTab === 'score' || selectedPoem.status === 'scoring' || selectedPoem.status === 'completed' || selectedPoem.status === 'archived')">
          <CollaborativeScorePanel
            :poemId="selectedPoem.id"
            @close="handleScoreClose"
            @refresh="refreshState"
            @switchToEditor="activeTab = 'editor'"
          />
        </template>
      </div>

      <div v-if="showConfirmDelete" class="collab-confirm-overlay" @click.self="handleCancelDelete">
        <div class="collab-confirm-dialog">
          <h3 class="confirm-title">确认删除</h3>
          <p class="confirm-text">删除后无法恢复，确定要删除这首联诗吗？</p>
          <div class="confirm-actions">
            <button class="collab-secondary-btn" @click="handleCancelDelete">取消</button>
            <button class="collab-danger-btn" @click="handleConfirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collab-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.collab-panel {
  width: min(950px, 95vw);
  height: min(780px, 92vh);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.collab-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collab-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.collab-icon {
  font-size: 36px;
}

.collab-title {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--accent-gold);
  margin: 0;
}

.collab-subtitle {
  color: var(--text-muted);
  font-size: 13px;
  margin: 2px 0 0 0;
}

.collab-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  transition: all 0.2s;
}

.collab-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.collab-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.collab-tab {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.collab-tab:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.collab-tab.active {
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
}

.collab-tab.back-btn {
  color: var(--accent-gold);
}

.collab-tab-separator {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 8px;
}

.collab-current-poem {
  margin-left: auto;
  font-family: var(--font-brush);
  font-size: 16px;
  padding: 4px 12px;
  background: rgba(201, 168, 108, 0.1);
  border-radius: 6px;
}

.collab-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.collab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 12px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  color: var(--text-muted);
  margin: 0;
}

.collab-poem-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.collab-poem-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;
}

.collab-poem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.poem-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.poem-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.poem-card-icon {
  font-size: 22px;
}

.poem-card-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.poem-status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.poem-card-theme {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.poem-card-desc {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poem-card-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
}

.meta-value {
  font-size: 14px;
  color: var(--text-primary);
}

.poem-card-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.poem-card-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.keyword-label {
  font-size: 12px;
  color: var(--text-muted);
}

.keyword-tag {
  padding: 2px 10px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  border-radius: 10px;
  font-size: 12px;
}

.poem-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

.collab-primary-btn {
  padding: 8px 16px;
  background: var(--accent-gold);
  color: #1a1a2e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  flex: 1;
}

.collab-primary-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
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

.collab-danger-btn {
  padding: 8px 12px;
  background: rgba(197, 107, 107, 0.15);
  color: #c56b6b;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.2s;
}

.collab-danger-btn:hover {
  background: rgba(197, 107, 107, 0.25);
}

.collab-create-form {
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-half {
  flex: 1;
}

.form-label {
  font-size: 14px;
  color: var(--text-primary);
}

.required {
  color: #c56b6b;
}

.form-input,
.form-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-serif);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--accent-gold);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.turn-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  width: fit-content;
}

.turn-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.turn-btn:hover:not(:disabled) {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.turn-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.turn-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--accent-gold);
  min-width: 40px;
  text-align: center;
  font-family: var(--font-brush);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.collab-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
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

.collab-header-center {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
}

.current-user-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(201, 168, 108, 0.12);
  border: 1px solid rgba(201, 168, 108, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.current-user-display:hover {
  background: rgba(201, 168, 108, 0.2);
  border-color: rgba(201, 168, 108, 0.5);
}

.current-user-display .user-avatar {
  font-size: 18px;
}

.current-user-display .user-name {
  font-weight: 500;
  color: var(--accent-gold);
  font-size: 14px;
}

.current-user-display .user-arrow {
  font-size: 10px;
  color: var(--text-muted);
}

.user-panel-popup {
  position: relative;
  margin: 0 24px -12px 24px;
  padding: 16px;
  background: rgba(15, 15, 26, 0.95);
  border: 1px solid var(--border);
  border-radius: 12px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  z-index: 5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: slideDown 0.25s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-panel-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.user-panel-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.user-panel-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.user-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-item.active {
  border-color: rgba(201, 168, 108, 0.4);
  background: rgba(201, 168, 108, 0.08);
}

.user-item.editing {
  border-color: rgba(124, 169, 124, 0.5);
  background: rgba(124, 169, 124, 0.08);
}

.user-item .user-avatar {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.user-item-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.current-tag {
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border-radius: 10px;
  font-size: 11px;
}

.user-actions {
  display: flex;
  gap: 4px;
}

.user-action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
  color: var(--text-secondary);
  background: transparent;
}

.user-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-action-btn.switch {
  width: auto;
  padding: 0 10px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
}

.user-action-btn.switch:hover {
  background: rgba(201, 168, 108, 0.2);
}

.user-action-btn.save {
  color: #7ca97c;
  background: rgba(124, 169, 124, 0.15);
}

.user-action-btn.save:hover {
  background: rgba(124, 169, 124, 0.25);
}

.user-action-btn.cancel:hover {
  background: rgba(197, 107, 107, 0.15);
  color: #c56b6b;
}

.user-action-btn.delete:hover {
  background: rgba(197, 107, 107, 0.15);
  color: #c56b6b;
}

.user-edit-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(124, 169, 124, 0.4);
  border-radius: 6px;
  padding: 4px 10px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.add-user-section {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.add-user-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.add-user-input:focus {
  border-color: var(--accent-gold);
}

.add-user-btn {
  padding: 8px 16px;
  background: var(--accent-gold);
  color: #1a1a2e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.add-user-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.add-user-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.suggest-next-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(122, 158, 168, 0.12);
  border: 1px solid rgba(122, 158, 168, 0.25);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.suggest-next-banner.is-current {
  background: rgba(124, 169, 124, 0.12);
  border-color: rgba(124, 169, 124, 0.35);
  color: var(--text-primary);
}

.suggest-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.suggest-text {
  flex: 1;
  min-width: 0;
}

.suggest-text strong {
  color: var(--accent-gold);
  font-weight: 600;
}

.is-current .suggest-text strong {
  color: #7ca97c;
}

.suggest-switch-btn {
  padding: 4px 10px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  border-radius: 12px;
  font-size: 11px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.suggest-switch-btn:hover {
  background: rgba(201, 168, 108, 0.25);
}
</style>
