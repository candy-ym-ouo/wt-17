<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HistorySnapshot } from '@/types'

interface Props {
  snapshots: HistorySnapshot[]
  currentSnapshotId: string | null
  chaptersTitles: Record<string, { title: string; accent: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'restore', snapshot: HistorySnapshot): void
  (e: 'delete', snapshotId: string): void
  (e: 'rename', snapshotId: string, name: string): void
  (e: 'close'): void
  (e: 'create'): void
}>()

const editingId = ref<string | null>(null)
const editingName = ref('')

const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const startRename = (snap: HistorySnapshot) => {
  editingId.value = snap.id
  editingName.value = snap.name
}

const confirmRename = () => {
  if (editingId.value && editingName.value.trim()) {
    emit('rename', editingId.value, editingName.value.trim())
  }
  editingId.value = null
  editingName.value = ''
}

const cancelRename = () => {
  editingId.value = null
  editingName.value = ''
}

const sortedSnapshots = computed(() => {
  return [...props.snapshots].sort((a, b) => b.createdAt - a.createdAt)
})
</script>

<template>
  <div class="snapshot-overlay" @click.self="emit('close')">
    <div class="snapshot-panel" @click.stop>
      <div class="panel-header">
        <h2 class="panel-title">布局快照</h2>
        <div class="header-actions">
          <button class="create-btn" @click="emit('create')">
            <span>＋</span>
            <span>新建快照</span>
          </button>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>
      </div>
      <div v-if="snapshots.length === 0" class="empty-snapshots">
        <div class="empty-icon">📷</div>
        <div class="empty-text">暂无快照，点击上方按钮创建</div>
        <div class="empty-sub">快照可保存当前画布布局，随时恢复</div>
      </div>
      <div v-else class="snapshots-list">
        <div
          v-for="snap in sortedSnapshots"
          :key="snap.id"
          class="snapshot-card"
          :class="{ active: snap.id === currentSnapshotId }"
        >
          <div class="snap-main" @click="emit('restore', snap)">
            <div class="snap-header">
              <div v-if="editingId === snap.id" class="rename-input-wrap">
                <input
                  v-model="editingName"
                  class="rename-input"
                  @keydown.enter="confirmRename"
                  @keydown.esc="cancelRename"
                  @blur="confirmRename"
                  autofocus
                />
              </div>
              <div v-else class="snap-title-row" @dblclick="startRename(snap)">
                <h3 class="snap-title">{{ snap.name }}</h3>
                <span class="rename-hint" @click.stop="startRename(snap)">✎</span>
              </div>
              <span 
                v-if="snap.id === currentSnapshotId"
                class="snap-current"
              >
                当前
              </span>
            </div>
            <div class="snap-preview">
              <span 
                v-for="phrase in snap.phrases.slice(0, 6)" 
                :key="phrase.id" 
                class="snap-phrase"
              >
                {{ phrase.text }}
              </span>
              <span v-if="snap.phrases.length > 6" class="snap-more">
                +{{ snap.phrases.length - 6 }}
              </span>
            </div>
            <div class="snap-footer">
              <span 
                class="snap-chapter" 
                :style="{ color: chaptersTitles[snap.chapterId]?.accent || '#c9a86c' }"
              >
                {{ chaptersTitles[snap.chapterId]?.title || '自由之境' }}
              </span>
              <span class="snap-count">{{ snap.phrases.length }} 个词句</span>
              <span class="snap-time">{{ formatTime(snap.createdAt) }}</span>
            </div>
          </div>
          <div class="snap-actions">
            <button class="action-btn restore-btn" @click="emit('restore', snap)" title="恢复">
              ↩
            </button>
            <button class="action-btn delete-btn" @click="emit('delete', snap.id)" title="删除">
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snapshot-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.snapshot-panel {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.2) 0%, rgba(168, 136, 76, 0.2) 100%);
  border: 1px solid rgba(201, 168, 108, 0.4);
  border-radius: 20px;
  color: var(--accent-gold);
  font-size: 13px;
  transition: all 0.2s ease;
}

.create-btn:hover {
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.3) 0%, rgba(168, 136, 76, 0.3) 100%);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.empty-snapshots {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 6px;
}

.empty-sub {
  color: var(--text-muted);
  font-size: 12px;
}

.snapshots-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.snapshot-card {
  display: flex;
  gap: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.snapshot-card:hover {
  border-color: rgba(201, 168, 108, 0.4);
}

.snapshot-card.active {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.05);
}

.snap-main {
  flex: 1;
  padding: 14px 20px;
  cursor: pointer;
}

.snap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.snap-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.snap-title {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.rename-hint {
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.snap-title-row:hover .rename-hint {
  opacity: 1;
}

.rename-input-wrap {
  flex: 1;
}

.rename-input {
  width: 100%;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--accent-gold);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--font-brush);
  font-size: 18px;
  outline: none;
}

.snap-current {
  padding: 2px 10px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  font-size: 11px;
  border-radius: 10px;
}

.snap-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.snap-phrase {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.snap-more {
  padding: 3px 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.snap-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.snap-chapter {
  font-size: 12px;
}

.snap-count {
  font-size: 11px;
  color: var(--text-muted);
}

.snap-time {
  font-size: 11px;
  color: var(--text-muted);
}

.snap-actions {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
}

.action-btn {
  flex: 1;
  min-width: 48px;
  padding: 0 12px;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.restore-btn {
  background: rgba(201, 168, 108, 0.08);
  color: var(--accent-gold);
  border-bottom: 1px solid var(--border);
}

.restore-btn:hover {
  background: rgba(201, 168, 108, 0.18);
}

.delete-btn {
  background: rgba(139, 69, 87, 0.08);
  color: var(--accent-red);
}

.delete-btn:hover {
  background: rgba(139, 69, 87, 0.2);
}
</style>
