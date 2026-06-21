<script setup lang="ts">
import type { Chapter, Theme } from '@/types'

interface Props {
  chapter: Chapter | null
  musicEnabled: boolean
  musicVolume: number
  questCount: number
  canUndo: boolean
  canRedo: boolean
  snapshotCount: number
  isEditingComposition: boolean
  editingTitle: string
  isFreeRealm: boolean
  currentTheme: Theme
  soundscapeLabel: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'toggleMusic'): void
  (e: 'changeVolume', vol: number): void
  (e: 'openChapters'): void
  (e: 'openPortfolio'): void
  (e: 'openQuests'): void
  (e: 'openSnapshots'): void
  (e: 'openThemes'): void
  (e: 'openGathering'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'save'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">✦</span>
        <span class="logo-text">诗切片</span>
      </div>
      <button class="chapter-btn" @click="emit('openChapters')">
        <span class="chapter-name">{{ chapter?.title || '选择章节' }}</span>
        <span class="chapter-arrow">▾</span>
      </button>
      <button 
        v-if="isFreeRealm" 
        class="theme-btn" 
        @click="emit('openThemes')"
        :style="{ borderColor: currentTheme.accentColor }"
      >
        <span class="theme-icon">{{ currentTheme.icon }}</span>
        <span class="theme-name">{{ currentTheme.name }}</span>
        <span class="theme-arrow">▾</span>
      </button>
      <div v-if="isEditingComposition" class="editing-indicator">
        <span class="editing-pulse"></span>
        <span class="editing-label">编辑中：</span>
        <span class="editing-title">{{ editingTitle }}</span>
      </div>
    </div>
    
    <div class="header-right">
      <div class="volume-control" v-if="musicEnabled">
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          :value="musicVolume"
          @input="emit('changeVolume', Number(($event.target as HTMLInputElement).value))"
          class="volume-slider"
        />
      </div>
      <button 
        class="icon-btn" 
        :class="{ active: musicEnabled }"
        @click="emit('toggleMusic')"
        :title="musicEnabled ? '关闭音乐' : '开启音乐'"
      >
        <span v-if="musicEnabled">♪</span>
        <span v-else>♩</span>
      </button>
      <span v-if="musicEnabled" class="soundscape-label">{{ soundscapeLabel }}</span>
      <div class="history-group">
        <button 
          class="icon-btn history-btn" 
          :class="{ disabled: !canUndo }"
          @click="emit('undo')"
          title="撤销 (Ctrl+Z)"
          :disabled="!canUndo"
        >
          ↶
        </button>
        <button 
          class="icon-btn history-btn" 
          :class="{ disabled: !canRedo }"
          @click="emit('redo')"
          title="重做 (Ctrl+Shift+Z)"
          :disabled="!canRedo"
        >
          ↷
        </button>
      </div>
      <button 
        class="icon-btn snapshot-btn" 
        @click="emit('openSnapshots')" 
        title="布局快照"
      >
        📷
        <span v-if="snapshotCount > 0" class="snapshot-badge">{{ snapshotCount }}</span>
      </button>
      <button class="icon-btn" @click="emit('openPortfolio')" title="作品集">
        📜
      </button>
      <button class="icon-btn quest-btn" :class="{ 'has-quest': questCount > 0 }" @click="emit('openQuests')" title="支线任务">
        🏮
        <span v-if="questCount > 0" class="quest-badge">{{ questCount }}</span>
      </button>
      <button class="icon-btn gathering-btn" @click="emit('openGathering')" title="主题诗会">
        🎑
      </button>
      <button class="icon-btn" @click="emit('reset')" title="清空画布">
        ↺
      </button>
      <button class="save-btn" :class="{ 'editing-btn': isEditingComposition }" @click="emit('save')">
        <span class="save-icon">✎</span>
        <span class="save-text">{{ isEditingComposition ? '更新原作' : '保存诗笺' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(15, 15, 26, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  position: relative;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 18px;
  color: var(--accent-gold);
}

.logo-text {
  font-family: var(--font-brush);
  font-size: 20px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.chapter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 20px;
  transition: all 0.2s ease;
}

.chapter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(201, 168, 108, 0.4);
}

.chapter-name {
  font-family: var(--font-brush);
  font-size: 15px;
  color: var(--accent-gold);
  letter-spacing: 1px;
}

.chapter-arrow {
  font-size: 10px;
  color: var(--text-muted);
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  border-radius: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.theme-icon {
  font-size: 16px;
}

.theme-name {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.theme-arrow {
  font-size: 10px;
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-control {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.soundscape-label {
  font-size: 11px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
  padding: 3px 10px;
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 108, 0.2);
  font-family: var(--font-serif);
  letter-spacing: 1px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.volume-slider {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent-gold);
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--accent-gold);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: var(--border);
}

.icon-btn.active {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
}

.icon-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn.disabled:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  border-color: transparent;
}

.history-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.history-btn {
  font-size: 18px;
}

.snapshot-btn {
  position: relative;
}

.snapshot-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--accent-gold);
  color: #1a1a2e;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quest-btn {
  position: relative;
}

.quest-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--accent-red);
  color: #e8e4d9;
  font-size: 10px;
  font-weight: 500;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.quest-btn.has-quest {
  color: var(--accent-gold);
}

.gathering-btn {
  position: relative;
}

.gathering-btn:hover {
  color: #d4a574;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #c9a86c 0%, #a8884c 100%);
  border-radius: 20px;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.save-btn.editing-btn {
  background: linear-gradient(135deg, #8b4557 0%, #6b3547 100%);
}

.save-btn.editing-btn:hover {
  box-shadow: 0 4px 16px rgba(139, 69, 87, 0.3);
}

.save-icon {
  font-size: 14px;
}

.save-text {
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.editing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  margin-left: 8px;
  background: rgba(139, 69, 87, 0.12);
  border: 1px solid rgba(139, 69, 87, 0.35);
  border-radius: 20px;
  animation: fadeIn 0.3s ease;
}

.editing-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-red);
  box-shadow: 0 0 8px var(--accent-red);
  animation: editingPulse 1.6s ease-in-out infinite;
}

@keyframes editingPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.editing-label {
  font-size: 11px;
  color: var(--accent-red);
  letter-spacing: 1px;
}

.editing-title {
  font-family: var(--font-brush);
  font-size: 13px;
  color: #d4a8b5;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .chapter-name {
    display: none;
  }
  .theme-name {
    display: none;
  }
  .theme-btn {
    padding: 6px 10px;
  }
  .save-text {
    display: none;
  }
  .save-btn {
    padding: 8px 12px;
  }
  .volume-control {
    display: none;
  }
  
  .soundscape-label {
    display: none;
  }
}
</style>
