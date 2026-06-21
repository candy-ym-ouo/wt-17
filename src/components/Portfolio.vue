<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Composition, Collection, FilterState, GroupBy, SortBy, ScoreGrade, GroupedCompositions, Chapter } from '@/types'
import { getScoreGrade, extractCoreImagery } from '@/utils/scoring'
import { filterCompositions, sortCompositions, groupCompositions, getGrade, getDateGroups, getGradeColor, formatDuration, getTimeAgo, getChapterProgress, getEditStatus } from '@/utils/portfolioFilter'

interface Props {
  compositions: Composition[]
  collections: Collection[]
  chaptersTitles: Record<string, { title: string; accent: string }>
  chapters?: Chapter[]
  editingCompositionId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'load', composition: Composition): void
  (e: 'delete', id: string): void
  (e: 'close'): void
  (e: 'pin', id: string): void
  (e: 'unpin', id: string): void
  (e: 'addToCollection', compositionId: string, collectionId: string): void
  (e: 'removeFromCollection', compositionId: string, collectionId: string): void
  (e: 'createCollection', name: string, description: string, accentColor: string): void
  (e: 'deleteCollection', collectionId: string): void
  (e: 'updateCollection', collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): void
  (e: 'refresh'): void
}>()

const filter = ref<FilterState>({
  chapterId: null,
  grade: null,
  dateRange: null,
  collectionId: null,
  searchText: ''
})

const groupBy = ref<GroupBy>('none')
const sortBy = ref<SortBy>('date')
const sortAscending = ref(false)
const showFilterPanel = ref(false)
const showCollectionPanel = ref(false)
const showCollectionManager = ref(false)
const showCollectionPicker = ref<string | null>(null)
const editingCollectionId = ref<string | null>(null)
const newCollectionName = ref('')
const newCollectionDesc = ref('')
const newCollectionColor = ref('#c9a86c')

const gradeOptions: { value: ScoreGrade; label: string; color: string }[] = [
  { value: '神品', label: '神品 (≥90)', color: getGradeColor('神品') },
  { value: '妙品', label: '妙品 (75-89)', color: getGradeColor('妙品') },
  { value: '佳品', label: '佳品 (60-74)', color: getGradeColor('佳品') },
  { value: '能品', label: '能品 (40-59)', color: getGradeColor('能品') },
  { value: '习作', label: '习作 (<40)', color: getGradeColor('习作') }
]

const groupOptions: { value: GroupBy; label: string }[] = [
  { value: 'none', label: '不分组' },
  { value: 'chapter', label: '按章节' },
  { value: 'grade', label: '按评分' },
  { value: 'date', label: '按日期' },
  { value: 'collection', label: '按合集' }
]

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'date', label: '日期' },
  { value: 'score', label: '评分' },
  { value: 'title', label: '标题' }
]

const accentColors = [
  '#c9a86c', '#d4a574', '#a8c0d4', '#7a9ea8', '#c98bc4',
  '#6b8e6b', '#a8a498', '#7a6b8e', '#8e7a6b', '#6b8e8e'
]

const dateGroups = computed(() => getDateGroups(props.compositions))

const filteredCompositions = computed(() => {
  let result = filterCompositions(props.compositions, filter.value)
  result = sortCompositions(result, sortBy.value, sortAscending.value)
  return result
})

const groupedCompositions = computed<GroupedCompositions[]>(() => {
  return groupCompositions(
    filteredCompositions.value,
    groupBy.value,
    sortBy.value,
    sortAscending.value,
    props.chaptersTitles,
    props.collections
  )
})

const hasActiveFilters = computed(() => {
  return filter.value.chapterId || filter.value.grade || filter.value.dateRange || 
         filter.value.collectionId || filter.value.searchText
})

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const clearFilters = () => {
  filter.value = {
    chapterId: null,
    grade: null,
    dateRange: null,
    collectionId: null,
    searchText: ''
  }
}

const togglePin = (comp: Composition) => {
  if (comp.isPinned) {
    emit('unpin', comp.id)
  } else {
    emit('pin', comp.id)
  }
}

const toggleSortOrder = () => {
  sortAscending.value = !sortAscending.value
}

const toggleCollectionPicker = (compId: string) => {
  showCollectionPicker.value = showCollectionPicker.value === compId ? null : compId
}

const isInCollection = (compId: string, collId: string) => {
  const comp = props.compositions.find(c => c.id === compId)
  return comp?.collectionIds?.includes(collId) || false
}

const toggleCollectionMembership = (compId: string, collId: string) => {
  if (isInCollection(compId, collId)) {
    emit('removeFromCollection', compId, collId)
  } else {
    emit('addToCollection', compId, collId)
  }
}

const handleCreateCollection = () => {
  if (!newCollectionName.value.trim()) return
  emit('createCollection', newCollectionName.value.trim(), newCollectionDesc.value.trim(), newCollectionColor.value)
  newCollectionName.value = ''
  newCollectionDesc.value = ''
  newCollectionColor.value = '#c9a86c'
  showCollectionManager.value = false
  emit('refresh')
}

const handleDeleteCollection = (collId: string) => {
  if (!confirm('确定要删除这个合集吗？')) return
  emit('deleteCollection', collId)
}

const startEditCollection = (coll: Collection) => {
  editingCollectionId.value = coll.id
  newCollectionName.value = coll.name
  newCollectionDesc.value = coll.description
  newCollectionColor.value = coll.accentColor
}

const saveEditCollection = () => {
  if (!editingCollectionId.value || !newCollectionName.value.trim()) return
  emit('updateCollection', editingCollectionId.value, {
    name: newCollectionName.value.trim(),
    description: newCollectionDesc.value.trim(),
    accentColor: newCollectionColor.value
  })
  editingCollectionId.value = null
  newCollectionName.value = ''
  newCollectionDesc.value = ''
  newCollectionColor.value = '#c9a86c'
  emit('refresh')
}

const cancelEditCollection = () => {
  editingCollectionId.value = null
  newCollectionName.value = ''
  newCollectionDesc.value = ''
  newCollectionColor.value = '#c9a86c'
}

const getCollectionById = (id: string) => props.collections.find(c => c.id === id)

const getChapterById = (chapterId: string): Chapter | undefined => {
  return props.chapters?.find(ch => ch.id === chapterId)
}

const getChapterAccent = (chapterId: string) => props.chaptersTitles[chapterId]?.accent || '#c9a86c'

const getChapterTitle = (chapterId: string) => props.chaptersTitles[chapterId]?.title || '自由之境'

const getCompCoreImagery = (comp: Composition): string[] => {
  if (comp.coreImagery && comp.coreImagery.length > 0) {
    return comp.coreImagery
  }
  return extractCoreImagery(comp.phrases, 3)
}

const getCompCreationDuration = (comp: Composition): string => {
  if (comp.creationDuration && comp.creationDuration > 0) {
    return formatDuration(comp.creationDuration)
  }
  return '未知'
}

const getCompProgress = (comp: Composition) => {
  const chapter = getChapterById(comp.chapterId)
  return getChapterProgress(comp, chapter)
}

const getCompEditStatus = (comp: Composition) => {
  return getEditStatus(comp)
}

const getGroupAccent = (group: GroupedCompositions) => {
  if (groupBy.value === 'chapter') {
    return getChapterAccent(group.groupKey)
  } else if (groupBy.value === 'grade') {
    return getGradeColor(group.groupKey as ScoreGrade)
  } else if (groupBy.value === 'collection') {
    return getCollectionById(group.groupKey)?.accentColor || '#c9a86c'
  }
  return '#c9a86c'
}
</script>

<template>
  <div class="portfolio-overlay" @click.self="emit('close')">
    <div class="portfolio-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-title-row">
          <h2 class="panel-title">诗笺</h2>
          <span class="comp-count">{{ filteredCompositions.length }} / {{ compositions.length }}</span>
        </div>
        <div class="panel-actions">
          <button class="icon-btn" @click="showCollectionManager = true" title="管理合集">
            <span>📚</span>
          </button>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="filter.searchText"
            type="text"
            placeholder="搜索标题或词句..."
            class="search-input"
          />
          <button v-if="filter.searchText" class="clear-search" @click="filter.searchText = ''">✕</button>
        </div>
        <button 
          class="filter-toggle" 
          :class="{ active: showFilterPanel }"
          @click="showFilterPanel = !showFilterPanel"
        >
          <span>筛选</span>
          <span v-if="hasActiveFilters" class="filter-badge">●</span>
        </button>
        <div class="group-sort">
          <select v-model="groupBy" class="group-select" title="分组方式">
            <option v-for="opt in groupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <div class="sort-controls">
            <select v-model="sortBy" class="sort-select" title="排序方式">
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button class="sort-order-btn" @click="toggleSortOrder" :title="sortAscending ? '升序' : '降序'">
              {{ sortAscending ? '↑' : '↓' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showFilterPanel" class="filter-panel">
        <div class="filter-section">
          <div class="filter-label">章节</div>
          <div class="filter-chips">
            <button 
              class="filter-chip" 
              :class="{ active: !filter.chapterId }"
              @click="filter.chapterId = null"
            >全部</button>
            <button 
              v-for="(info, id) in chaptersTitles" 
              :key="id"
              class="filter-chip"
              :class="{ active: filter.chapterId === id }"
              :style="{ '--accent': info.accent }"
              @click="filter.chapterId = filter.chapterId === id ? null : id"
            >{{ info.title }}</button>
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-label">评分</div>
          <div class="filter-chips">
            <button 
              class="filter-chip" 
              :class="{ active: !filter.grade }"
              @click="filter.grade = null"
            >全部</button>
            <button 
              v-for="opt in gradeOptions" 
              :key="opt.value"
              class="filter-chip"
              :class="{ active: filter.grade === opt.value }"
              :style="{ '--accent': opt.color }"
              @click="filter.grade = filter.grade === opt.value ? null : opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-label">日期</div>
          <div class="filter-chips">
            <button 
              class="filter-chip" 
              :class="{ active: !filter.dateRange }"
              @click="filter.dateRange = null"
            >全部</button>
            <button 
              v-for="dg in dateGroups" 
              :key="dg.key"
              class="filter-chip"
              :class="{ active: filter.dateRange?.start === dg.start && filter.dateRange?.end === dg.end }"
              @click="filter.dateRange = filter.dateRange?.start === dg.start ? null : { start: dg.start, end: dg.end }"
            >{{ dg.label }}</button>
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-label">合集</div>
          <div class="filter-chips">
            <button 
              class="filter-chip" 
              :class="{ active: !filter.collectionId }"
              @click="filter.collectionId = null"
            >全部</button>
            <button 
              v-for="coll in collections" 
              :key="coll.id"
              class="filter-chip"
              :class="{ active: filter.collectionId === coll.id }"
              :style="{ '--accent': coll.accentColor }"
              @click="filter.collectionId = filter.collectionId === coll.id ? null : coll.id"
            >{{ coll.name }}</button>
          </div>
        </div>
        <div v-if="hasActiveFilters" class="clear-filters-row">
          <button class="clear-filters-btn" @click="clearFilters">清除所有筛选</button>
        </div>
      </div>

      <div v-if="filteredCompositions.length === 0" class="empty-portfolio">
        <div class="empty-icon">📜</div>
        <div class="empty-text">
          {{ compositions.length === 0 ? '尚无诗作，去创作一首吧' : '没有符合条件的作品' }}
        </div>
      </div>

      <div v-else class="compositions-container">
        <div v-for="group in groupedCompositions" :key="group.groupKey" class="composition-group">
          <div v-if="groupBy !== 'none'" class="group-header" :style="{ borderColor: getGroupAccent(group) }">
            <span class="group-title" :style="{ color: getGroupAccent(group) }">{{ group.groupLabel }}</span>
            <span class="group-count">{{ group.compositions.length }}</span>
          </div>
          <div class="compositions-list">
            <div
              v-for="comp in group.compositions"
              :key="comp.id"
              class="composition-card"
              :class="{ 'editing-card': comp.id === editingCompositionId, 'pinned-card': comp.isPinned }"
            >
              <div v-if="comp.isPinned" class="pin-indicator" title="已置顶">📌</div>
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
                <div v-if="getCompCoreImagery(comp).length > 0" class="comp-imagery">
                  <span class="imagery-label">核心意象</span>
                  <div class="imagery-tags">
                    <span 
                      v-for="(img, idx) in getCompCoreImagery(comp)" 
                      :key="idx"
                      class="imagery-tag"
                      :style="{ color: getChapterAccent(comp.chapterId) }"
                    >
                      {{ img }}
                    </span>
                  </div>
                </div>
                <div class="comp-progress">
                  <div class="progress-info">
                    <span class="progress-label">{{ getCompProgress(comp).label }}</span>
                    <span class="progress-count">{{ getCompProgress(comp).current }}/{{ getCompProgress(comp).target }}</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill"
                      :style="{ 
                        width: getCompProgress(comp).percentage + '%',
                        background: getChapterAccent(comp.chapterId)
                      }"
                    ></div>
                  </div>
                </div>
                <div class="comp-footer">
                  <div class="comp-tags">
                    <span class="comp-chapter" :style="{ color: getChapterAccent(comp.chapterId) }">
                      {{ getChapterTitle(comp.chapterId) }}
                    </span>
                    <span 
                      v-for="collId in comp.collectionIds?.slice(0, 2)" 
                      :key="collId"
                      class="comp-collection-tag"
                      :style="{ background: getCollectionById(collId)?.accentColor + '33', borderColor: getCollectionById(collId)?.accentColor, color: getCollectionById(collId)?.accentColor }"
                    >
                      {{ getCollectionById(collId)?.name }}
                    </span>
                  </div>
                  <div class="comp-meta">
                    <div class="meta-row">
                      <span class="meta-item" title="创作耗时">
                        <span class="meta-icon">⏱</span>
                        <span class="meta-text">{{ getCompCreationDuration(comp) }}</span>
                      </span>
                      <span class="meta-item" :title="getCompEditStatus(comp).label">
                        <span class="meta-icon">{{ getCompEditStatus(comp).icon }}</span>
                        <span class="meta-text">{{ getTimeAgo(comp.updatedAt) }}</span>
                      </span>
                    </div>
                    <span class="comp-date">{{ formatDate(comp.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="comp-actions">
                <button 
                  class="action-btn pin-btn" 
                  :class="{ active: comp.isPinned }"
                  @click.stop="togglePin(comp)"
                  :title="comp.isPinned ? '取消置顶' : '置顶'"
                >
                  {{ comp.isPinned ? '📌' : '📍' }}
                </button>
                <button 
                  class="action-btn collection-btn"
                  @click.stop="toggleCollectionPicker(comp.id)"
                  title="添加到合集"
                >
                  📚
                </button>
                <button class="action-btn delete-btn" @click.stop="emit('delete', comp.id)" title="删除">
                  🗑️
                </button>
              </div>
              <div v-if="showCollectionPicker === comp.id" class="collection-picker" @click.stop>
                <div class="picker-header">添加到合集</div>
                <div v-if="collections.length === 0" class="picker-empty">
                  暂无合集，点击上方「📚」创建
                </div>
                <div v-else class="picker-list">
                  <button 
                    v-for="coll in collections" 
                    :key="coll.id"
                    class="picker-item"
                    :class="{ active: isInCollection(comp.id, coll.id) }"
                    :style="{ '--accent': coll.accentColor }"
                    @click="toggleCollectionMembership(comp.id, coll.id)"
                  >
                    <span class="picker-check">{{ isInCollection(comp.id, coll.id) ? '✓' : '' }}</span>
                    <span class="picker-name">{{ coll.name }}</span>
                    <span class="picker-count">{{ coll.compositionIds.length }}</span>
                  </button>
                </div>
                <button class="picker-close" @click="showCollectionPicker = null">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCollectionManager" class="collection-manager-overlay" @click.self="showCollectionManager = false">
      <div class="collection-manager">
        <div class="manager-header">
          <h3 class="manager-title">合集管理</h3>
          <button class="close-btn" @click="showCollectionManager = false">✕</button>
        </div>
        <div class="manager-content">
          <div class="create-form">
            <h4 v-if="!editingCollectionId">创建新合集</h4>
            <h4 v-else>编辑合集</h4>
            <input 
              v-model="newCollectionName" 
              type="text" 
              placeholder="合集名称"
              class="form-input"
            />
            <textarea 
              v-model="newCollectionDesc" 
              placeholder="合集描述（可选）"
              class="form-textarea"
            ></textarea>
            <div class="color-picker">
              <span class="color-label">主题色</span>
              <div class="color-options">
                <button 
                  v-for="color in accentColors" 
                  :key="color"
                  class="color-option"
                  :class="{ active: newCollectionColor === color }"
                  :style="{ background: color }"
                  @click="newCollectionColor = color"
                ></button>
              </div>
            </div>
            <div class="form-actions">
              <button v-if="editingCollectionId" class="btn-secondary" @click="cancelEditCollection">取消</button>
              <button class="btn-primary" @click="editingCollectionId ? saveEditCollection() : handleCreateCollection()">
                {{ editingCollectionId ? '保存' : '创建' }}
              </button>
            </div>
          </div>
          <div class="collections-list">
            <h4>现有合集</h4>
            <div v-if="collections.length === 0" class="empty-collections">
              暂无合集
            </div>
            <div v-for="coll in collections" :key="coll.id" class="collection-item">
              <div class="collection-info">
                <div class="collection-color-dot" :style="{ background: coll.accentColor }"></div>
                <div class="collection-meta">
                  <div class="collection-name">{{ coll.name }}</div>
                  <div class="collection-desc">{{ coll.description || '暂无描述' }}</div>
                  <div class="collection-stats">{{ coll.compositionIds.length }} 首诗</div>
                </div>
              </div>
              <div class="collection-actions">
                <button class="icon-btn-sm" @click="startEditCollection(coll)" title="编辑">✏️</button>
                <button class="icon-btn-sm" @click="handleDeleteCollection(coll.id)" title="删除">🗑️</button>
              </div>
            </div>
          </div>
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
  max-width: 680px;
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

.panel-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
  margin: 0;
}

.comp-count {
  font-size: 12px;
  color: var(--text-muted);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
}

.search-icon {
  font-size: 14px;
  opacity: 0.5;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 0;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-search {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.2s ease;
}

.filter-toggle:hover {
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--text-primary);
}

.filter-toggle.active {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.filter-badge {
  color: var(--accent-gold);
  font-size: 8px;
}

.group-sort {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-select,
.sort-select {
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-select:hover,
.sort-select:hover {
  border-color: rgba(201, 168, 108, 0.4);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-order-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-btn:hover {
  border-color: rgba(201, 168, 108, 0.4);
}

.filter-panel {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideDown 0.2s ease;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  padding: 4px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.filter-chip.active {
  background: color-mix(in srgb, var(--accent, #c9a86c) 15%, transparent);
  border-color: var(--accent, #c9a86c);
  color: var(--accent, #c9a86c);
}

.clear-filters-row {
  display: flex;
  justify-content: flex-end;
}

.clear-filters-btn {
  padding: 6px 14px;
  background: rgba(139, 69, 87, 0.2);
  border: 1px solid rgba(139, 69, 87, 0.4);
  border-radius: 8px;
  color: var(--accent-red);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: rgba(139, 69, 87, 0.3);
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

.compositions-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.composition-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-left: 3px solid;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.group-title {
  font-family: var(--font-brush);
  font-size: 16px;
  letter-spacing: 2px;
}

.group-count {
  font-size: 12px;
  color: var(--text-muted);
}

.compositions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 8px;
}

.composition-card {
  position: relative;
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

.composition-card.pinned-card {
  border-color: rgba(201, 168, 108, 0.6);
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.08), var(--bg-card));
}

.composition-card.editing-card {
  border-color: rgba(139, 69, 87, 0.6);
  background: linear-gradient(135deg, rgba(139, 69, 87, 0.08), var(--bg-card));
}

.pin-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 14px;
  z-index: 1;
}

.comp-main {
  flex: 1;
  padding: 16px 20px 16px 36px;
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
  margin: 0;
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

.comp-imagery {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.imagery-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  padding-top: 2px;
  letter-spacing: 1px;
}

.imagery-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.imagery-tag {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
}

.imagery-tag::before {
  content: '·';
  margin-right: 4px;
  opacity: 0.6;
}

.comp-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.progress-count {
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
  opacity: 0.8;
}

.comp-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.comp-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.comp-chapter {
  font-size: 12px;
}

.comp-collection-tag {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 10px;
}

.comp-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.meta-row {
  display: flex;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.meta-icon {
  font-size: 11px;
  opacity: 0.8;
}

.meta-text {
  font-size: 11px;
}

.comp-date {
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.7;
}

.comp-actions {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
}

.action-btn {
  flex: 1;
  padding: 0 14px;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border);
}

.action-btn:last-child {
  border-bottom: none;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.pin-btn.active {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
}

.delete-btn:hover {
  background: rgba(139, 69, 87, 0.15);
  color: var(--accent-red);
}

.collection-picker {
  position: absolute;
  right: 100%;
  top: 0;
  margin-right: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 10;
  animation: fadeIn 0.2s ease;
}

.picker-header {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-weight: 500;
}

.picker-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 12px 0;
  text-align: center;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-item:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.picker-item.active {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.picker-check {
  width: 16px;
  text-align: center;
}

.picker-name {
  flex: 1;
}

.picker-count {
  font-size: 11px;
  color: var(--text-muted);
}

.picker-close {
  margin-top: 8px;
  padding: 6px 12px;
  width: 100%;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-close:hover {
  background: rgba(255, 255, 255, 0.05);
}

.collection-manager-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.collection-manager {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.manager-title {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin: 0;
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.create-form,
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-form h4,
.collections-list h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
  letter-spacing: 1px;
}

.form-input,
.form-textarea {
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--accent-gold);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-label {
  font-size: 12px;
  color: var(--text-muted);
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option.active {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-gold);
  border: 1px solid var(--accent-gold);
  color: #1a1a2e;
  font-weight: 500;
}

.btn-primary:hover {
  background: #d4b87c;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.empty-collections {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.collection-item:hover {
  border-color: rgba(201, 168, 108, 0.4);
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collection-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.collection-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.collection-name {
  font-size: 14px;
  color: var(--text-primary);
}

.collection-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.collection-stats {
  font-size: 11px;
  color: var(--text-muted);
}

.collection-actions {
  display: flex;
  gap: 4px;
}

.icon-btn-sm {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn-sm:hover {
  background: rgba(255, 255, 255, 0.05);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .toolbar {
    flex-wrap: wrap;
  }
  
  .search-box {
    order: 1;
    width: 100%;
  }
  
  .filter-toggle {
    order: 2;
  }
  
  .group-sort {
    order: 3;
    flex: 1;
  }
  
  .portfolio-panel {
    max-height: 90vh;
  }
}
</style>
