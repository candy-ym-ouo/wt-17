<script setup lang="ts">
import type { Chapter } from '@/types'

interface Props {
  chapter: Chapter | null
  musicEnabled: boolean
  musicVolume: number
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'toggleMusic'): void
  (e: 'changeVolume', vol: number): void
  (e: 'openChapters'): void
  (e: 'openPortfolio'): void
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
      <button class="icon-btn" @click="emit('openPortfolio')" title="作品集">
        📜
      </button>
      <button class="icon-btn" @click="emit('reset')" title="清空画布">
        ↺
      </button>
      <button class="save-btn" @click="emit('save')">
        <span class="save-icon">✎</span>
        <span class="save-text">保存诗笺</span>
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

.save-icon {
  font-size: 14px;
}

.save-text {
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

@media (max-width: 640px) {
  .chapter-name {
    display: none;
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
}
</style>
