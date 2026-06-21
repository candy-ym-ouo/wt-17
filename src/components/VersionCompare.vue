<script setup lang="ts">
import { computed } from 'vue'
import type { CompositionVersion, Phrase, ScoreBreakdown } from '@/types'
import { compareVersions } from '@/utils/mentorReviews'

interface Props {
  versions: [CompositionVersion, CompositionVersion]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'loadVersion', version: CompositionVersion): void
  (e: 'swap'): void
}>()

const versionA = computed(() => props.versions[0])
const versionB = computed(() => props.versions[1])

const comparison = computed(() => compareVersions(versionA.value, versionB.value))

type ScoreKey = keyof ScoreBreakdown

const DIMENSION_LIST: { key: ScoreKey; label: string }[] = [
  { key: 'coherence', label: '连贯性' },
  { key: 'imagery', label: '意象丰富度' },
  { key: 'rhythm', label: '韵律节奏' },
  { key: 'themeMatch', label: '主题契合度' },
  { key: 'total', label: '总分' }
]

const dimensionRows = computed(() => {
  return DIMENSION_LIST.map(dim => ({
    ...dim,
    valueA: versionA.value.score[dim.key],
    valueB: versionB.value.score[dim.key],
    diff: comparison.value.scoreDifference[dim.key]
  }))
})

const CATEGORY_LABELS: Record<string, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

const getScoreDiffStyle = (diff: number) => {
  if (diff > 0) return { color: '#7ca97c', label: `+${diff}` }
  if (diff < 0) return { color: '#c56b6b', label: `${diff}` }
  return { color: '#a8a498', label: '—' }
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '#c9a86c'
    case 'epic': return '#a87ac9'
    case 'rare': return '#7a9ea8'
    default: return '#a8a498'
  }
}

const getRarityLabel = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '传说'
    case 'epic': return '史诗'
    case 'rare': return '稀有'
    default: return '寻常'
  }
}
</script>

<template>
  <div class="vcompare-overlay" @click.self="emit('close')">
    <div class="vcompare-panel" @click.stop>
      <div class="vcompare-header">
        <div class="vcompare-title-row">
          <h2 class="vcompare-title">版本对比 · 改稿留痕</h2>
          <div class="vcompare-actions">
            <button class="swap-btn" @click="emit('swap')" title="交换版本">
              🔄 交换
            </button>
            <button class="close-btn" @click="emit('close')">✕</button>
          </div>
        </div>
        <div class="vcompare-subtitle">
          对比两个版本的词句差异与评分变化，追踪改稿轨迹
        </div>
      </div>

      <div class="vcompare-headers">
        <div class="vcol vcol-a">
          <div class="vcol-head-left">
            <span class="vcol-badge">A</span>
            <div class="vcol-info">
              <div class="vcol-label">{{ versionA.label }}</div>
              <div class="vcol-meta">v{{ versionA.versionNumber }} · {{ formatDate(versionA.createdAt) }}</div>
            </div>
          </div>
          <div class="vcol-score">
            <span class="score-value">{{ versionA.score.total }}</span>
            <span class="score-unit">分</span>
          </div>
          <button class="vcol-load-btn" @click="emit('loadVersion', versionA)">
            📝 加载此版
          </button>
        </div>
        <div class="vcompare-arrow">→</div>
        <div class="vcol vcol-b">
          <div class="vcol-head-left">
            <span class="vcol-badge">B</span>
            <div class="vcol-info">
              <div class="vcol-label">{{ versionB.label }}</div>
              <div class="vcol-meta">v{{ versionB.versionNumber }} · {{ formatDate(versionB.createdAt) }}</div>
            </div>
          </div>
          <div class="vcol-score">
            <span class="score-value">{{ versionB.score.total }}</span>
            <span class="score-unit">分</span>
          </div>
          <button class="vcol-load-btn" @click="emit('loadVersion', versionB)">
            📝 加载此版
          </button>
        </div>
      </div>

      <div class="vcompare-content">
        <div class="diff-section">
          <div class="section-title-row">
            <span class="section-icon">🏆</span>
            <span class="section-title">评分维度对比</span>
          </div>
          <div class="score-dimensions">
            <div
              v-for="row in dimensionRows"
              :key="row.key"
              class="dimension-row"
            >
              <span class="dim-label">{{ row.label }}</span>
              <div class="dim-bars">
                <div class="dim-bar-wrap">
                  <div
                    class="dim-bar dim-bar-a"
                    :style="{ width: `${(row.valueA / 100) * 100}%` }"
                  ></div>
                  <span class="dim-bar-val">{{ row.valueA }}</span>
                </div>
                <div
                  class="dim-diff"
                  :style="{ color: getScoreDiffStyle(row.diff).color }"
                >
                  {{ getScoreDiffStyle(row.diff).label }}
                </div>
                <div class="dim-bar-wrap">
                  <div
                    class="dim-bar dim-bar-b"
                    :style="{ width: `${(row.valueB / 100) * 100}%` }"
                  ></div>
                  <span class="dim-bar-val">{{ row.valueB }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="diff-section">
          <div class="section-title-row">
            <span class="section-icon">📝</span>
            <span class="section-title">词句改动详情</span>
            <span class="section-summary">
              新增 {{ comparison.added.length }} · 移除 {{ comparison.removed.length }} · 修改 {{ comparison.modified.length }} · 保留 {{ comparison.unchanged.length }}
            </span>
          </div>

          <div v-if="comparison.added.length > 0" class="diff-group">
            <div class="diff-group-header added">
              <span class="diff-icon">➕</span>
              <span class="diff-label">新增词句</span>
              <span class="diff-count">{{ comparison.added.length }}</span>
            </div>
            <div class="diff-items">
              <div v-for="phrase in comparison.added" :key="phrase.id" class="diff-item added">
                <span class="diff-sign">+</span>
                <span class="diff-text">{{ phrase.text }}</span>
                <span class="diff-tags">
                  <span class="diff-tag" :style="{ color: getRarityColor(phrase.rarity) }">
                    {{ getRarityLabel(phrase.rarity) }}
                  </span>
                  <span class="diff-tag category">
                    {{ CATEGORY_LABELS[phrase.category] }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div v-if="comparison.removed.length > 0" class="diff-group">
            <div class="diff-group-header removed">
              <span class="diff-icon">➖</span>
              <span class="diff-label">移除词句</span>
              <span class="diff-count">{{ comparison.removed.length }}</span>
            </div>
            <div class="diff-items">
              <div v-for="phrase in comparison.removed" :key="phrase.id" class="diff-item removed">
                <span class="diff-sign">−</span>
                <span class="diff-text">{{ phrase.text }}</span>
                <span class="diff-tags">
                  <span class="diff-tag" :style="{ color: getRarityColor(phrase.rarity) }">
                    {{ getRarityLabel(phrase.rarity) }}
                  </span>
                  <span class="diff-tag category">
                    {{ CATEGORY_LABELS[phrase.category] }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div v-if="comparison.modified.length > 0" class="diff-group">
            <div class="diff-group-header modified">
              <span class="diff-icon">✏️</span>
              <span class="diff-label">位置调整</span>
              <span class="diff-count">{{ comparison.modified.length }}</span>
            </div>
            <div class="diff-items">
              <div v-for="mod in comparison.modified" :key="mod.before.id" class="diff-item modified">
                <div class="mod-pair">
                  <div class="mod-side before">
                    <span class="mod-label">原位置</span>
                    <span class="diff-text">{{ mod.before.text }}</span>
                    <span class="mod-pos">
                      ({{ Math.round(mod.before.position?.x || 0) }}, {{ Math.round(mod.before.position?.y || 0) }})
                      旋转{{ Math.round(mod.before.rotation || 0) }}°
                    </span>
                  </div>
                  <div class="mod-arrow">→</div>
                  <div class="mod-side after">
                    <span class="mod-label">新位置</span>
                    <span class="diff-text">{{ mod.after.text }}</span>
                    <span class="mod-pos">
                      ({{ Math.round(mod.after.position?.x || 0) }}, {{ Math.round(mod.after.position?.y || 0) }})
                      旋转{{ Math.round(mod.after.rotation || 0) }}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="comparison.unchanged.length > 0" class="diff-group">
            <div class="diff-group-header unchanged">
              <span class="diff-icon">✓</span>
              <span class="diff-label">保留词句</span>
              <span class="diff-count">{{ comparison.unchanged.length }}</span>
            </div>
            <div class="diff-items unchanged-items">
              <span v-for="phrase in comparison.unchanged" :key="phrase.id" class="unchanged-pill">
                {{ phrase.text }}
              </span>
            </div>
          </div>

          <div
            v-if="comparison.added.length === 0 && comparison.removed.length === 0 && comparison.modified.length === 0"
            class="diff-empty"
          >
            <div class="diff-empty-icon">📋</div>
            <div class="diff-empty-text">两个版本完全一致</div>
          </div>
        </div>

        <div v-if="versionA.description || versionB.description || versionA.changeSummary || versionB.changeSummary" class="diff-section">
          <div class="section-title-row">
            <span class="section-icon">📝</span>
            <span class="section-title">版本说明</span>
          </div>
          <div class="version-notes">
            <div class="version-note">
              <div class="note-label">{{ versionA.label }} 说明</div>
              <div v-if="versionA.description" class="note-text">{{ versionA.description }}</div>
              <div v-if="versionA.changeSummary" class="note-changes">
                <span class="note-changes-label">改动摘要：</span>
                {{ versionA.changeSummary }}
              </div>
              <div v-if="!versionA.description && !versionA.changeSummary" class="note-empty">
                无说明
              </div>
            </div>
            <div class="version-note">
              <div class="note-label">{{ versionB.label }} 说明</div>
              <div v-if="versionB.description" class="note-text">{{ versionB.description }}</div>
              <div v-if="versionB.changeSummary" class="note-changes">
                <span class="note-changes-label">改动摘要：</span>
                {{ versionB.changeSummary }}
              </div>
              <div v-if="!versionB.description && !versionB.changeSummary" class="note-empty">
                无说明
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vcompare-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.vcompare-panel {
  width: 92vw;
  max-width: 1000px;
  height: 88vh;
  max-height: 850px;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vcompare-header {
  padding: 20px 28px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.vcompare-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.vcompare-title {
  font-family: var(--font-brush);
  font-size: 26px;
  color: var(--accent-gold);
  margin: 0;
}

.vcompare-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.swap-btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.swap-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.vcompare-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.vcompare-headers {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 0;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
  flex-shrink: 0;
}

.vcol {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vcol-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.vcol-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.vcol-a .vcol-badge {
  background: rgba(122, 158, 168, 0.2);
  color: #7a9ea8;
  border: 1px solid #7a9ea8;
}

.vcol-b .vcol-badge {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
}

.vcol-label {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.vcol-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.vcol-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.vcol-a .vcol-score .score-value {
  color: #7a9ea8;
}

.vcol-b .vcol-score .score-value {
  color: var(--accent-gold);
}

.score-value {
  font-family: var(--font-brush);
  font-size: 32px;
  font-weight: 700;
}

.score-unit {
  font-size: 13px;
  color: var(--text-muted);
}

.vcol-load-btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.vcol-load-btn:hover {
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
}

.vcompare-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-muted);
}

.vcompare-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.diff-section {
  margin-bottom: 28px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-summary {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 4px 12px;
  border-radius: 20px;
}

.score-dimensions {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 16px;
}

.dim-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.dim-bars {
  display: grid;
  grid-template-columns: 1fr 50px 1fr;
  align-items: center;
  gap: 12px;
}

.dim-bar-wrap {
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  overflow: hidden;
}

.dim-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease;
}

.dim-bar-a {
  background: linear-gradient(90deg, rgba(122, 158, 168, 0.3), rgba(122, 158, 168, 0.8));
}

.dim-bar-b {
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.3), rgba(201, 168, 108, 0.8));
}

.dim-bar-val {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dim-diff {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.diff-group {
  margin-bottom: 18px;
}

.diff-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}

.diff-group-header.added {
  background: rgba(124, 169, 124, 0.1);
  color: #7ca97c;
}

.diff-group-header.removed {
  background: rgba(197, 107, 107, 0.1);
  color: #c56b6b;
}

.diff-group-header.modified {
  background: rgba(201, 168, 108, 0.1);
  color: var(--accent-gold);
}

.diff-group-header.unchanged {
  background: rgba(168, 164, 152, 0.08);
  color: #a8a498;
}

.diff-icon {
  font-size: 14px;
}

.diff-label {
  flex: 1;
}

.diff-count {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 10px;
  border-radius: 10px;
}

.diff-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 8px;
}

.diff-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.diff-item.added {
  background: rgba(124, 169, 124, 0.06);
  border-left: 3px solid #7ca97c;
}

.diff-item.removed {
  background: rgba(197, 107, 107, 0.06);
  border-left: 3px solid #c56b6b;
}

.diff-item.modified {
  background: rgba(201, 168, 108, 0.06);
  border-left: 3px solid var(--accent-gold);
  padding: 12px 14px;
}

.diff-sign {
  font-weight: 700;
  font-size: 16px;
  width: 16px;
  text-align: center;
}

.diff-item.added .diff-sign {
  color: #7ca97c;
}

.diff-item.removed .diff-sign {
  color: #c56b6b;
}

.diff-text {
  flex: 1;
  color: var(--text-primary);
}

.diff-tags {
  display: flex;
  gap: 6px;
}

.diff-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}

.diff-tag.category {
  color: var(--text-muted);
}

.mod-pair {
  display: grid;
  grid-template-columns: 1fr 30px 1fr;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.mod-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
}

.mod-side.before {
  background: rgba(122, 158, 168, 0.08);
}

.mod-side.after {
  background: rgba(201, 168, 108, 0.08);
}

.mod-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mod-pos {
  font-size: 11px;
  color: var(--text-muted);
}

.mod-arrow {
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
}

.unchanged-items {
  flex-wrap: wrap;
  flex-direction: row;
  gap: 8px;
}

.unchanged-pill {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.diff-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
}

.diff-empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.diff-empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

.version-notes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.version-note {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 16px;
}

.note-label {
  font-size: 12px;
  color: var(--accent-gold);
  margin-bottom: 8px;
  font-weight: 500;
}

.note-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.note-changes {
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(201, 168, 108, 0.08);
  padding: 8px 10px;
  border-radius: 6px;
  line-height: 1.5;
}

.note-changes-label {
  color: var(--accent-gold);
  font-weight: 500;
}

.note-empty {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
