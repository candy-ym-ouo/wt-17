<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Phrase, PhraseCategory, PhraseRarity } from '@/types'
import { categoryLabels, categoryColors, rarityLabels, rarityColors } from '@/data/phrases'

interface Props {
  phrases: Phrase[]
  placedPhraseIds: Set<string>
  collectedPhrases?: Set<string>
}

const props = withDefaults(defineProps<Props>(), {
  collectedPhrases: () => new Set<string>()
})

const emit = defineEmits<{
  (e: 'select', phrase: Phrase): void
}>()

const activeCategory = ref<PhraseCategory | 'all'>('all')
const activeRarity = ref<PhraseRarity | 'all'>('all')

const categories: (PhraseCategory | 'all')[] = ['all', 'scene', 'emotion', 'time', 'action', 'imagery']
const rarities: (PhraseRarity | 'all')[] = ['all', 'legendary', 'epic', 'rare', 'common']

const filteredPhrases = computed(() => {
  let list = props.phrases
  if (activeCategory.value !== 'all') {
    list = list.filter(p => p.category === activeCategory.value)
  }
  if (activeRarity.value !== 'all') {
    list = list.filter(p => p.rarity === activeRarity.value)
  }
  return list
})

const getCategoryLabel = (cat: PhraseCategory | 'all') => {
  return cat === 'all' ? '全部' : categoryLabels[cat]
}

const getCategoryColor = (cat: PhraseCategory | 'all') => {
  return cat === 'all' ? '#c9a86c' : categoryColors[cat]
}

const getRarityLabel = (rarity: PhraseRarity | 'all') => {
  return rarity === 'all' ? '全部稀有度' : rarityLabels[rarity]
}

const handleClick = (phrase: Phrase) => {
  if (!props.placedPhraseIds.has(phrase.id)) {
    emit('select', phrase)
  }
}

const rarityStats = computed(() => {
  const stats: Record<PhraseRarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  }
  props.phrases.forEach(p => {
    stats[p.rarity]++
  })
  return stats
})
</script>

<template>
  <div class="phrase-pool">
    <div class="filter-tabs">
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
      <div class="rarity-tabs">
        <button
          v-for="rar in rarities"
          :key="rar"
          class="rarity-tab"
          :class="{ active: activeRarity === rar }"
          :style="{ '--rar-color': rar === 'all' ? '#c9a86c' : rarityColors[rar as PhraseRarity] }"
          @click="activeRarity = rar"
        >
          {{ getRarityLabel(rar) }}
        </button>
      </div>
    </div>
    
    <div class="pool-stats">
      <span 
        v-for="rar in (['legendary', 'epic', 'rare', 'common'] as PhraseRarity[])" 
        :key="rar" 
        class="stat-item"
        :style="{ color: rarityColors[rar] }"
      >
        {{ rarityLabels[rar] }}: {{ rarityStats[rar] }}
      </span>
    </div>
    
    <div class="phrases-container">
      <div class="phrases-grid">
        <button
          v-for="phrase in filteredPhrases"
          :key="phrase.id"
          class="phrase-chip"
          :class="{ 
            placed: placedPhraseIds.has(phrase.id),
            collected: collectedPhrases.has(phrase.text)
          }"
          :style="{ 
            '--phrase-color': categoryColors[phrase.category],
            '--rarity-color': rarityColors[phrase.rarity]
          }"
          :disabled="placedPhraseIds.has(phrase.id)"
          @click="handleClick(phrase)"
        >
          <span class="phrase-rarity-dot" :style="{ background: rarityColors[phrase.rarity] }"></span>
          <span class="phrase-text">{{ phrase.text }}</span>
          <span v-if="collectedPhrases.has(phrase.text)" class="collected-badge">✦</span>
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

.filter-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.category-tabs,
.rarity-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
}

.category-tab,
.rarity-tab {
  flex-shrink: 0;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-muted);
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
}

.category-tab.active {
  color: var(--cat-color);
  background: color-mix(in srgb, var(--cat-color) 12%, transparent);
}

.rarity-tab.active {
  color: var(--rar-color);
  background: color-mix(in srgb, var(--rar-color) 12%, transparent);
}

.category-tab:hover:not(.active),
.rarity-tab:hover:not(.active) {
  color: var(--text-secondary);
}

.pool-stats {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  flex-shrink: 0;
}

.stat-item {
  font-weight: 500;
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
  padding: 7px 12px;
  background: color-mix(in srgb, var(--phrase-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--phrase-color) 25%, transparent);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 400;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: fadeIn 0.4s ease both;
  position: relative;
}

.phrase-chip.collected {
  border-color: color-mix(in srgb, var(--rarity-color) 40%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--rarity-color) 20%, transparent);
}

.phrase-chip:hover:not(.placed):not(:disabled) {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--phrase-color) 18%, transparent);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--rarity-color) 25%, transparent);
  border-color: color-mix(in srgb, var(--rarity-color) 50%, transparent);
}

.phrase-chip.placed {
  opacity: 0.3;
  cursor: not-allowed;
  text-decoration: line-through;
}

.phrase-rarity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 4px currentColor;
}

.phrase-text {
  font-family: var(--font-serif);
}

.collected-badge {
  font-size: 10px;
  color: var(--rarity-color);
  opacity: 0.8;
}

.empty-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 32px 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
