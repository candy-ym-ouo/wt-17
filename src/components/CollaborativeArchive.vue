<script setup lang="ts">
import { computed } from 'vue'
import type { CollaborativePoem } from '@/types'
import {
  getPoemTotalScore,
  getFullPoemText,
  unarchivePoem,
  deletePoem
} from '@/utils/collaborativePoetry'
import { COLLABORATIVE_STATUS_LABELS, COLLABORATIVE_STATUS_COLORS } from '@/types'

const props = defineProps<{
  archivedPoems: CollaborativePoem[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'open', poemId: string): void
}>()

const sortedPoems = computed(() => {
  return [...props.archivedPoems].sort((a, b) => {
    return (b.archivedAt || b.updatedAt) - (a.archivedAt || a.updatedAt)
  })
})

const formatDate = (ts: number): string => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const handleUnarchive = (poemId: string) => {
  if (!confirm('确定要取消归档吗？作品将移回进行中列表。')) return
  unarchivePoem(poemId)
  emit('refresh')
}

const handleDelete = (poemId: string) => {
  if (!confirm('删除后无法恢复，确定要删除这首归档作品吗？')) return
  deletePoem(poemId)
  emit('refresh')
}

const handleOpen = (poemId: string) => {
  emit('open', poemId)
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
</script>

<template>
  <div class="archive-panel">
    <div v-if="sortedPoems.length === 0" class="archive-empty">
      <div class="empty-icon">📚</div>
      <p class="empty-title">暂无归档作品</p>
      <p class="empty-desc">完成的联诗可以归档到这里保存</p>
    </div>

    <div v-else class="archive-list">
      <div
        v-for="poem in sortedPoems"
        :key="poem.id"
        class="archive-item"
        :style="{ borderColor: poem.accentColor + '30' }"
      >
        <div class="archive-item-header">
          <div class="archive-title-row">
            <span class="archive-icon">{{ poem.icon }}</span>
            <h3 class="archive-title">{{ poem.title }}</h3>
            <span
              class="status-badge"
              :style="{ backgroundColor: COLLABORATIVE_STATUS_COLORS[poem.status] + '30', color: COLLABORATIVE_STATUS_COLORS[poem.status] }"
            >
              {{ COLLABORATIVE_STATUS_LABELS[poem.status] }}
            </span>
          </div>
          <p class="archive-theme">主题：{{ poem.theme }}</p>
        </div>

        <div class="archive-preview">
          <template v-if="getFullPoemText(poem)">
            <p
              v-for="(line, idx) in getFullPoemText(poem).split('\n').slice(0, 2)"
              :key="idx"
              class="preview-line"
            >
              {{ line }}
            </p>
            <p v-if="getFullPoemText(poem).split('\n').length > 2" class="preview-more">
              ...共{{ poem.totalTurns }}联
            </p>
          </template>
          <p v-else class="preview-empty">（无内容）</p>
        </div>

        <div class="archive-meta">
          <div class="meta-item">
            <span class="meta-label">参与者</span>
            <span class="meta-value">{{ poem.participants.length }}人</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">总评分</span>
            <span class="meta-value score" :style="{ color: getScoreColor(getPoemTotalScore(poem)) }">
              {{ getPoemTotalScore(poem) || '--' }}分
              <span v-if="getPoemTotalScore(poem)" class="grade">
                {{ getScoreLabel(getPoemTotalScore(poem)) }}
              </span>
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">归档时间</span>
            <span class="meta-value">{{ formatDate(poem.archivedAt || 0) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">创建</span>
            <span class="meta-value">{{ formatDate(poem.createdAt) }}</span>
          </div>
        </div>

        <div class="archive-actions">
          <button class="collab-secondary-btn" @click="handleOpen(poem.id)">
            📖 查看详情
          </button>
          <button class="collab-secondary-btn" @click="handleUnarchive(poem.id)">
            ↩ 取消归档
          </button>
          <button class="collab-danger-btn" @click="handleDelete(poem.id)">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.archive-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 10px;
}

.empty-icon {
  font-size: 56px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
}

.archive-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.archive-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s;
}

.archive-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.archive-item-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.archive-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.archive-icon {
  font-size: 22px;
}

.archive-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.archive-theme {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.archive-preview {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 3px solid var(--accent-gold);
  min-height: 60px;
}

.preview-line {
  font-family: var(--font-brush);
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.8;
}

.preview-more {
  color: var(--text-muted);
  font-size: 12px;
  margin: 4px 0 0 0;
}

.preview-empty {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
  font-style: italic;
}

.archive-meta {
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
  font-size: 13px;
  color: var(--text-primary);
}

.meta-value.score {
  font-weight: 600;
}

.meta-value .grade {
  font-size: 11px;
  opacity: 0.8;
  margin-left: 4px;
}

.archive-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
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
}

.collab-secondary-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 12px;
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
</style>
