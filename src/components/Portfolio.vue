<script setup lang="ts">
import type { Composition } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

interface Props {
  compositions: Composition[]
  chaptersTitles: Record<string, { title: string; accent: string }>
  editingCompositionId: string | null
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'load', composition: Composition): void
  (e: 'delete', id: string): void
  (e: 'close'): void
}>()

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="portfolio-overlay" @click.self="emit('close')">
    <div class="portfolio-panel" @click.stop>
      <div class="panel-header">
        <h2 class="panel-title">诗笺</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      <div v-if="compositions.length === 0" class="empty-portfolio">
        <div class="empty-icon">📜</div>
        <div class="empty-text">尚无诗作，去创作一首吧</div>
      </div>
      <div v-else class="compositions-list">
        <div
          v-for="comp in compositions"
          :key="comp.id"
          class="composition-card"
          :class="{ 'editing-card': comp.id === editingCompositionId }"
        >
          <div class="comp-main" @click="emit('load', comp)">
            <div class="comp-header">
              <div class="comp-title-row">
                <h3 class="comp-title">{{ comp.title || '无题' }}</h3>
                <span v-if="comp.id === editingCompositionId" class="comp-editing-tag">
                  编辑中
                </span>
              </div>
              <span 
                class="comp-grade"
                :style="{ color: getScoreGrade(comp.score.total).color }"
              >
                {{ getScoreGrade(comp.score.total).grade }} · {{ comp.score.total }}
              </span>
            </div>
            <div class="comp-phrases">
              <span 
                v-for="phrase in comp.phrases" 
                :key="phrase.id" 
                class="comp-phrase"
              >
                {{ phrase.text }}
              </span>
            </div>
            <div class="comp-footer">
              <span class="comp-chapter" :style="{ color: chaptersTitles[comp.chapterId]?.accent || '#c9a86c' }">
                {{ chaptersTitles[comp.chapterId]?.title || '自由之境' }}
              </span>
              <span class="comp-date">{{ formatDate(comp.createdAt) }}</span>
            </div>
          </div>
          <button class="delete-btn" @click="emit('delete', comp.id)">
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portfolio-overlay {
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

.portfolio-panel {
  width: 100%;
  max-width: 560px;
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

.empty-portfolio {
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
  color: var(--text-muted);
  font-size: 14px;
}

.compositions-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.composition-card {
  display: flex;
  gap: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.composition-card:hover {
  border-color: rgba(201, 168, 108, 0.4);
}

.comp-main {
  flex: 1;
  padding: 16px 20px;
  cursor: pointer;
}

.comp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comp-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comp-title {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.comp-editing-tag {
  padding: 2px 8px;
  background: rgba(139, 69, 87, 0.2);
  border: 1px solid rgba(139, 69, 87, 0.4);
  color: var(--accent-red);
  font-size: 10px;
  border-radius: 10px;
  letter-spacing: 1px;
}

.composition-card.editing-card {
  border-color: rgba(139, 69, 87, 0.6);
  background: linear-gradient(135deg, rgba(139, 69, 87, 0.08), rgba(26, 26, 46, 0.85));
}

.comp-grade {
  font-size: 13px;
  font-weight: 500;
}

.comp-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.comp-phrase {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.comp-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comp-chapter {
  font-size: 12px;
}

.comp-date {
  font-size: 11px;
  color: var(--text-muted);
}

.delete-btn {
  padding: 0 16px;
  background: rgba(139, 69, 87, 0.15);
  color: var(--accent-red);
  font-size: 12px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(139, 69, 87, 0.3);
}
</style>
