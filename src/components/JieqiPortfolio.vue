<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Composition, JieqiSeason, JieqiType } from '@/types'
import { jieqiList, jieqiCollections } from '@/data/jieqi'
import { JIEQI_SEASON_LABELS, JIEQI_SEASON_COLORS } from '@/types'
import { getJieqiPortfolioCompositions } from '@/utils/jieqi'

const props = defineProps<{
  compositions: Composition[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'viewComposition', composition: Composition): void
}>()

const selectedSeason = ref<JieqiSeason>('春')
const seasons: JieqiSeason[] = ['春', '夏', '秋', '冬']

const seasonJieqi = computed(() => {
  return jieqiList.filter(j => j.season === selectedSeason.value)
})

const getJieqiCompositions = (jieqiId: JieqiType): Composition[] => {
  const compIds = getJieqiPortfolioCompositions(jieqiId)
  return props.compositions.filter(c => compIds.includes(c.id))
}

const totalCollected = computed(() => {
  let count = 0
  jieqiList.forEach(jieqi => {
    count += getJieqiPortfolioCompositions(jieqi.id).length
  })
  return count
})

const seasonCollection = computed(() => {
  const collectionMap: Record<string, string> = {
    '春': 'jq_collect_chun',
    '夏': 'jq_collect_xia',
    '秋': 'jq_collect_qiu',
    '冬': 'jq_collect_dong'
  }
  return jieqiCollections.find(c => c.id === collectionMap[selectedSeason.value])
})

const handleViewComposition = (comp: Composition) => {
  emit('viewComposition', comp)
}
</script>

<template>
  <div class="portfolio-modal-overlay" @click.self="emit('close')">
    <div class="portfolio-modal">
      <div class="portfolio-modal-header">
        <div class="portfolio-title-section">
          <span class="portfolio-modal-icon">📖</span>
          <div>
            <h2 class="portfolio-modal-title">纪念作品册</h2>
            <p class="portfolio-modal-subtitle">珍藏二十四节气的诗意时光</p>
          </div>
        </div>
        <button class="portfolio-close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="portfolio-modal-body">
        <div class="portfolio-stats">
          <div class="stat-card">
            <span class="stat-number">{{ totalCollected }}</span>
            <span class="stat-label">收录作品</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ jieqiList.length }}</span>
            <span class="stat-label">二十四节气</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">{{ jieqiCollections.length }}</span>
            <span class="stat-label">四季雅集</span>
          </div>
        </div>

        <div class="season-tabs">
          <button
            v-for="season in seasons"
            :key="season"
            class="season-tab"
            :class="{ active: selectedSeason === season }"
            :style="{ '--season-color': JIEQI_SEASON_COLORS[season] }"
            @click="selectedSeason = season"
          >
            {{ JIEQI_SEASON_LABELS[season] }}雅集
          </button>
        </div>

        <div v-if="seasonCollection" class="collection-header">
          <div class="collection-info">
            <h3 class="collection-title">{{ seasonCollection.title }}</h3>
            <p class="collection-subtitle">{{ seasonCollection.subtitle }}</p>
          </div>
          <div class="collection-progress">
            <span class="collection-count">
              {{ seasonJieqi.reduce((sum, j) => sum + getJieqiCompositions(j.id).length, 0) }}
              / {{ seasonCollection.maxSlots }}
            </span>
          </div>
        </div>

        <div class="jieqi-portfolio-list">
          <div
            v-for="jieqi in seasonJieqi"
            :key="jieqi.id"
            class="jieqi-portfolio-item"
            :style="{ '--jieqi-color': jieqi.accentColor }"
          >
            <div class="jieqi-item-header">
              <span class="jieqi-item-icon">{{ jieqi.icon }}</span>
              <div class="jieqi-item-info">
                <h4 class="jieqi-item-name">{{ jieqi.name }}</h4>
                <span class="jieqi-item-date">{{ jieqi.month }}月{{ jieqi.day }}日</span>
              </div>
              <span class="jieqi-item-count">
                {{ getJieqiCompositions(jieqi.id).length }} 首
              </span>
            </div>

            <div v-if="getJieqiCompositions(jieqi.id).length > 0" class="composition-preview-grid">
              <div
                v-for="comp in getJieqiCompositions(jieqi.id).slice(0, 3)"
                :key="comp.id"
                class="composition-preview-card"
                @click="handleViewComposition(comp)"
              >
                <div class="preview-title">{{ comp.title }}</div>
                <div class="preview-score">{{ comp.score.total }}分</div>
              </div>
            </div>

            <div v-else class="empty-jieqi">
              <span class="empty-icon">✍️</span>
              <span class="empty-text">暂无作品</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portfolio-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.portfolio-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  animation: societyReveal 0.4s ease-out;
}

.portfolio-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(155, 89, 182, 0.05);
}

.portfolio-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.portfolio-modal-icon {
  font-size: 32px;
}

.portfolio-modal-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--accent-gold);
  margin: 0;
}

.portfolio-modal-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

.portfolio-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.portfolio-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.portfolio-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.portfolio-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: var(--accent-gold);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.season-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.season-tab {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-serif);
  transition: all 0.2s;
  border: 1px solid transparent;
}

.season-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.season-tab.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--season-color);
  border-color: var(--season-color);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.collection-info {
  flex: 1;
}

.collection-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.collection-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.collection-progress {
  text-align: right;
}

.collection-count {
  font-size: 14px;
  color: var(--accent-gold);
  font-weight: 500;
}

.jieqi-portfolio-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.jieqi-portfolio-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.3s;
  border-left: 3px solid var(--jieqi-color);
}

.jieqi-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.jieqi-item-icon {
  font-size: 28px;
}

.jieqi-item-info {
  flex: 1;
}

.jieqi-item-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.jieqi-item-date {
  font-size: 12px;
  color: var(--text-muted);
}

.jieqi-item-count {
  font-size: 13px;
  color: var(--jieqi-color);
  font-weight: 500;
}

.composition-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.composition-preview-card {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.composition-preview-card:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.preview-title {
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-score {
  font-size: 11px;
  color: var(--accent-gold);
  font-weight: 500;
}

.empty-jieqi {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.empty-icon {
  font-size: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
  color: var(--text-muted);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes societyReveal {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

@media (max-width: 600px) {
  .portfolio-stats {
    flex-wrap: wrap;
  }
  
  .stat-card {
    flex: 1 1 30%;
  }
  
  .composition-preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
