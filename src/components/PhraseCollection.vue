<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PhraseCollectionState, PhraseCollectionRecord, PhraseRarity } from '@/types'
import { rarityLabels, rarityColors, getAllPhrases } from '@/data/phrases'
import { chapters } from '@/data/chapters'

interface Props {
  collection: PhraseCollectionState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeRarityFilter = ref<PhraseRarity | 'all'>('all')

const rarityOptions: (PhraseRarity | 'all')[] = ['all', 'legendary', 'epic', 'rare', 'common']

const chapterMap = computed(() => {
  const map: Record<string, { title: string; accent: string }> = {}
  chapters.forEach(ch => {
    map[ch.id] = { title: ch.title, accent: ch.accentColor }
  })
  return map
})

const allPhraseMeta = computed(() => {
  const meta: Record<string, { rarity: PhraseRarity; category: string }> = {}
  getAllPhrases().forEach(p => {
    meta[p.text] = { rarity: p.rarity, category: p.category }
  })
  return meta
})

const collectedRecords = computed(() => {
  return Object.values(props.collection.collectedPhrases)
    .map(record => ({
      ...record,
      rarity: (allPhraseMeta.value[record.phraseText]?.rarity || 'common') as PhraseRarity,
      category: allPhraseMeta.value[record.phraseText]?.category || 'scene'
    }))
    .sort((a, b) => {
      const rarityOrder: Record<PhraseRarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
      const rarDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity]
      if (rarDiff !== 0) return rarDiff
      return b.firstAcquiredAt - a.firstAcquiredAt
    })
})

const filteredRecords = computed(() => {
  if (activeRarityFilter.value === 'all') return collectedRecords.value
  return collectedRecords.value.filter(r => r.rarity === activeRarityFilter.value)
})

const rarityStats = computed(() => {
  const stats: Record<PhraseRarity, { collected: number; total: number }> = {
    legendary: { collected: 0, total: 0 },
    epic: { collected: 0, total: 0 },
    rare: { collected: 0, total: 0 },
    common: { collected: 0, total: 0 }
  }
  const allPhrases = getAllPhrases()
  allPhrases.forEach(p => {
    stats[p.rarity].total++
  })
  collectedRecords.value.forEach(r => {
    stats[r.rarity].collected++
  })
  return stats
})

const formatDate = (ts: number): string => {
  const date = new Date(ts)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

const getSourceLabel = (record: PhraseCollectionRecord): string => {
  if (record.sourceChapterId && chapterMap.value[record.sourceChapterId]) {
    return `章节 · ${chapterMap.value[record.sourceChapterId].title}`
  }
  if (record.sourceQuestId) {
    return '任务奖励'
  }
  return '初始获得'
}

const getRarityFilterLabel = (rar: PhraseRarity | 'all') => {
  if (rar === 'all') {
    const total = collectedRecords.value.length
    const allTotal = getAllPhrases().length
    return `全部 (${total}/${allTotal})`
  }
  const st = rarityStats.value[rar]
  return `${rarityLabels[rar]} (${st.collected}/${st.total})`
}

const totalProgress = computed(() => {
  const total = getAllPhrases().length
  const collected = props.collection.totalCollected
  return Math.round((collected / total) * 100)
})
</script>

<template>
  <div class="collection-overlay" @click.self="emit('close')">
    <div class="collection-panel">
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">✦</span>
          <span class="panel-title">词句图鉴</span>
          <span class="collection-progress">
            收集进度 {{ collection.totalCollected }} / {{ getAllPhrases().length }}
            <span class="progress-percent">({{ totalProgress }}%)</span>
          </span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: `${totalProgress}%` }"></div>
      </div>

      <div class="rarity-overview">
        <div 
          v-for="rar in (['legendary', 'epic', 'rare', 'common'] as PhraseRarity[])"
          :key="rar"
          class="rarity-overview-item"
        >
          <span class="rarity-dot" :style="{ background: rarityColors[rar] }"></span>
          <span class="rarity-name" :style="{ color: rarityColors[rar] }">{{ rarityLabels[rar] }}</span>
          <span class="rarity-count">{{ rarityStats[rar].collected }}/{{ rarityStats[rar].total }}</span>
        </div>
      </div>

      <div class="filter-bar">
        <button
          v-for="rar in rarityOptions"
          :key="rar"
          class="filter-btn"
          :class="{ active: activeRarityFilter === rar }"
          :style="{ '--f-color': rar === 'all' ? '#c9a86c' : rarityColors[rar as PhraseRarity] }"
          @click="activeRarityFilter = rar"
        >
          {{ getRarityFilterLabel(rar) }}
        </button>
      </div>

      <div class="records-container">
        <div v-if="filteredRecords.length === 0" class="empty-hint">
          暂无符合条件的收藏词句
        </div>
        <div class="records-grid">
          <div 
            v-for="record in filteredRecords" 
            :key="record.phraseText"
            class="record-card"
            :style="{ '--card-rarity-color': rarityColors[record.rarity] }"
          >
            <div class="record-header">
              <span class="record-rarity-dot" :style="{ background: rarityColors[record.rarity] }"></span>
              <span class="record-phrase-text">{{ record.phraseText }}</span>
              <span class="record-rarity-label" :style="{ color: rarityColors[record.rarity] }">
                {{ rarityLabels[record.rarity] }}
              </span>
            </div>
            <div class="record-details">
              <div class="record-detail-row">
                <span class="detail-label">来源：</span>
                <span class="detail-value source-value">
                  {{ getSourceLabel(record) }}
                </span>
              </div>
              <div class="record-detail-row">
                <span class="detail-label">首次获得：</span>
                <span class="detail-value">{{ formatDate(record.firstAcquiredAt) }}</span>
              </div>
              <div v-if="record.acquiredCount > 1" class="record-detail-row">
                <span class="detail-label">累计获得：</span>
                <span class="detail-value">×{{ record.acquiredCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.collection-panel {
  width: min(90vw, 800px);
  height: min(85vh, 700px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.35s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon {
  color: var(--accent-gold);
  font-size: 20px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.collection-progress {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.progress-percent {
  color: var(--accent-gold);
  font-weight: 500;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
  border-color: var(--border);
}

.progress-bar-container {
  height: 4px;
  background: rgba(255,255,255,0.06);
  margin: 0 24px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a86c, #a87ac9);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.rarity-overview {
  display: flex;
  gap: 20px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.rarity-overview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.rarity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}

.rarity-name {
  font-weight: 500;
  min-width: 32px;
}

.rarity-count {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.filter-bar {
  display: flex;
  gap: 6px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
}

.filter-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255,255,255,0.03);
  border: 1px solid transparent;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.filter-btn.active {
  color: var(--f-color);
  background: color-mix(in srgb, var(--f-color) 12%, transparent);
  border-color: color-mix(in srgb, var(--f-color) 30%, transparent);
}

.filter-btn:hover:not(.active) {
  color: var(--text-secondary);
}

.records-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.record-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid color-mix(in srgb, var(--card-rarity-color) 25%, transparent);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.record-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--card-rarity-color);
  opacity: 0.6;
}

.record-card:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--card-rarity-color) 15%, transparent);
}

.record-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.record-rarity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
  flex-shrink: 0;
}

.record-phrase-text {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

.record-rarity-label {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-rarity-color) 12%, transparent);
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.record-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.detail-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-secondary);
}

.source-value {
  color: var(--accent-gold);
  font-weight: 500;
}

.empty-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  padding: 48px 0;
}
</style>
