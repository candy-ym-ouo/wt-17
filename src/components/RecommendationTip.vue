<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RecommendationAction, Phrase } from '@/types'
import { getRecommendedPhrases } from '@/utils/onboarding'

interface Props {
  visible: boolean
  chapterId: string
  recommendations: RecommendationAction[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'selectPhrase', phrase: Phrase): void
  (e: 'selectChapter', chapterId: string): void
  (e: 'dismiss'): void
}>()

const isCollapsed = ref(false)

const topPhrases = computed(() => {
  return props.recommendations
    .filter(r => r.type === 'phrase' && r.phrase)
    .slice(0, 3)
})

const topChapters = computed(() => {
  return props.recommendations
    .filter(r => r.type === 'chapter')
    .slice(0, 2)
})

const suggestedPhrases = computed(() => {
  if (topPhrases.value.length > 0) {
    return topPhrases.value.map(r => r.phrase!).filter(Boolean)
  }
  return getRecommendedPhrases(props.chapterId, 3)
})

const handleSelectPhrase = (phrase: Phrase) => {
  emit('selectPhrase', phrase)
}

const handleSelectChapter = (chapterId: string) => {
  emit('selectChapter', chapterId)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <Transition name="slide">
    <div v-if="visible" class="recommendation-panel" :class="{ collapsed: isCollapsed }">
      <div class="panel-header" @click="toggleCollapse">
        <div class="header-left">
          <span class="panel-icon">✨</span>
          <span class="panel-title">创作推荐</span>
        </div>
        <div class="header-right">
          <span class="collapse-icon">{{ isCollapsed ? '展开' : '收起' }}</span>
          <button class="dismiss-btn" @click.stop="emit('dismiss')">✕</button>
        </div>
      </div>
      
      <div v-show="!isCollapsed" class="panel-content">
        <div v-if="topChapters.length > 0" class="section">
          <div class="section-label">推荐章节</div>
          <div class="chapter-suggestions">
            <div
              v-for="rec in topChapters"
              :key="rec.id"
              class="chapter-chip"
              @click="handleSelectChapter(rec.targetId!)"
            >
              <span class="chip-icon">{{ rec.icon }}</span>
              <span class="chip-text">{{ rec.title }}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-label">试试这些词句</div>
          <div class="phrase-suggestions">
            <div
              v-for="phrase in suggestedPhrases"
              :key="phrase.id"
              class="phrase-chip"
              @click="handleSelectPhrase(phrase)"
            >
              <span class="phrase-text">{{ phrase.text }}</span>
              <span class="phrase-category">{{ getCategoryLabel(phrase.category) }}</span>
            </div>
          </div>
        </div>
        
        <div class="hint-text">
          💡 点击词句可直接添加到画布
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    scene: '景',
    emotion: '情',
    time: '时',
    action: '动',
    imagery: '意'
  }
  return labels[category] || category
}
</script>

<style scoped>
.recommendation-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 100;
  max-width: 500px;
  width: calc(100% - 40px);
  overflow: hidden;
  transition: all 0.3s ease;
}

.recommendation-panel.collapsed {
  max-width: 200px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.1), transparent);
  cursor: pointer;
  transition: background 0.2s ease;
}

.panel-header:hover {
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.15), transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 16px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-icon {
  font-size: 11px;
  color: var(--text-muted);
}

.dismiss-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.panel-content {
  padding: 12px 16px 16px;
}

.section {
  margin-bottom: 14px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.chapter-suggestions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chapter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-chip:hover {
  background: rgba(201, 168, 108, 0.1);
  border-color: var(--accent-gold);
  transform: translateY(-1px);
}

.chip-icon {
  font-size: 14px;
}

.chip-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.phrase-suggestions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.phrase-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.phrase-chip:hover {
  background: rgba(201, 168, 108, 0.15);
  border-color: var(--accent-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(201, 168, 108, 0.2);
}

.phrase-text {
  font-family: var(--font-brush);
  font-size: 16px;
  color: var(--accent-gold);
  letter-spacing: 1px;
}

.phrase-category {
  font-size: 10px;
  color: var(--text-muted);
}

.hint-text {
  margin-top: 12px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 640px) {
  .recommendation-panel {
    bottom: 12px;
    width: calc(100% - 24px);
    border-radius: 12px;
  }
  
  .panel-header {
    padding: 10px 14px;
  }
  
  .panel-content {
    padding: 10px 14px 14px;
  }
  
  .phrase-chip {
    padding: 6px 12px;
  }
  
  .phrase-text {
    font-size: 14px;
  }
}
</style>
