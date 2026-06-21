<script setup lang="ts">
import type { Chapter } from '@/types'

interface Props {
  chapters: Chapter[]
  unlockedIds: string[]
  currentId: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', chapterId: string): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="chapters-overlay" @click.self="emit('close')">
    <div class="chapters-panel" @click.stop>
      <div class="panel-header">
        <h2 class="panel-title">章节</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      <div class="chapters-grid">
        <div
          v-for="chapter in chapters"
          :key="chapter.id"
          class="chapter-card"
          :class="{ active: chapter.id === currentId, locked: !unlockedIds.includes(chapter.id) }"
          :style="{ background: chapter.backgroundGradient }"
          @click="unlockedIds.includes(chapter.id) && emit('select', chapter.id)"
        >
          <div class="chapter-lock" v-if="!unlockedIds.includes(chapter.id)">
            <span>🔒</span>
          </div>
          <div class="chapter-content">
            <div class="chapter-subtitle" :style="{ color: chapter.accentColor }">{{ chapter.subtitle }}</div>
            <h3 class="chapter-title">{{ chapter.title }}</h3>
            <p class="chapter-desc">{{ chapter.description }}</p>
            <div class="chapter-footer">
              <span class="chapter-theme" :style="{ color: chapter.accentColor }">#{{ chapter.theme }}</span>
              <span class="chapter-target">{{ chapter.targetPhraseCount }} 词</span>
            </div>
          </div>
          <div class="chapter-border" :style="{ borderColor: chapter.accentColor }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapters-overlay {
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

.chapters-panel {
  width: 100%;
  max-width: 720px;
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

.chapters-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.chapter-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
}

.chapter-card:hover:not(.locked) {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.chapter-card.active {
  box-shadow: 0 0 0 2px var(--accent-gold);
}

.chapter-card.locked {
  cursor: not-allowed;
  filter: grayscale(0.6) brightness(0.6);
}

.chapter-lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  font-size: 36px;
}

.chapter-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chapter-subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.chapter-title {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.chapter-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  flex: 1;
  margin-bottom: 16px;
}

.chapter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapter-theme {
  font-size: 12px;
  letter-spacing: 1px;
}

.chapter-target {
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.chapter-border {
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  border-radius: 14px;
  pointer-events: none;
  transition: border-color 0.3s ease;
}

.chapter-card:hover:not(.locked) .chapter-border {
  border-color: inherit;
  opacity: 0.4;
}
</style>
