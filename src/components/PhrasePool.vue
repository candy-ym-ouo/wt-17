<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Phrase, PhraseCategory } from '@/types'
import { categoryLabels, categoryColors } from '@/data/phrases'

interface Props {
  phrases: Phrase[]
  placedPhraseIds: Set<string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', phrase: Phrase): void
}>()

const activeCategory = ref<PhraseCategory | 'all'>('all')

const categories: (PhraseCategory | 'all')[] = ['all', 'scene', 'emotion', 'time', 'action', 'imagery']

const filteredPhrases = computed(() => {
  let list = props.phrases
  if (activeCategory.value !== 'all') {
    list = list.filter(p => p.category === activeCategory.value)
  }
  return list
})

const getCategoryLabel = (cat: PhraseCategory | 'all') => {
  return cat === 'all' ? '全部' : categoryLabels[cat]
}

const getCategoryColor = (cat: PhraseCategory | 'all') => {
  return cat === 'all' ? '#c9a86c' : categoryColors[cat]
}

const handleClick = (phrase: Phrase) => {
  if (!props.placedPhraseIds.has(phrase.id)) {
    emit('select', phrase)
  }
}
</script>

<template>
  <div class="phrase-pool">
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-tab"
        :class="{ active: activeCategory === cat }"
        :style="{ '--cat-color': getCategoryColor(cat) }"
        @click="activeCategory = cat"
      >
        {{ getCategoryLabel(cat) }}
      </button>
    </div>
    <div class="phrases-container">
      <div class="phrases-grid">
        <button
          v-for="phrase in filteredPhrases"
          :key="phrase.id"
          class="phrase-chip"
          :class="{ placed: placedPhraseIds.has(phrase.id) }"
          :style="{ '--phrase-color': categoryColors[phrase.category] }"
          :disabled="placedPhraseIds.has(phrase.id)"
          @click="handleClick(phrase)"
        >
          <span class="phrase-text">{{ phrase.text }}</span>
          <span class="phrase-dot"></span>
        </button>
      </div>
      <div v-if="filteredPhrases.length === 0" class="empty-hint">
        此分类暂无词句
      </div>
    </div>
  </div>
</template>

<style scoped>
.phrase-pool {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  flex-shrink: 0;
}

.category-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-muted);
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
}

.category-tab.active {
  color: var(--cat-color);
  background: color-mix(in srgb, var(--cat-color) 12%, transparent);
}

.category-tab:hover:not(.active) {
  color: var(--text-secondary);
}

.phrases-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.phrases-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.phrase-chip {
  padding: 8px 14px;
  background: color-mix(in srgb, var(--phrase-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--phrase-color) 30%, transparent);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 400;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: fadeIn 0.4s ease both;
}

.phrase-chip:hover:not(.placed):not(:disabled) {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--phrase-color) 20%, transparent);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--phrase-color) 20%, transparent);
}

.phrase-chip.placed {
  opacity: 0.3;
  cursor: not-allowed;
  text-decoration: line-through;
}

.phrase-text {
  font-family: var(--font-serif);
}

.phrase-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--phrase-color);
}

.empty-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 32px 0;
}
</style>
