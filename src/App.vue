<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Chapter, CanvasPhrase, Phrase, PhraseCategory, ScoreBreakdown, Composition, GameState, QuestState, SideQuest, QuestCondition, HistorySnapshot, CanvasState, ChapterProgress, Theme, TitleOption } from '@/types'
import { chapters, getChapterById, chapterDropConfigs, chapterSoundscapes } from '@/data/chapters'
import { sideQuests, getQuestsByChapter, getQuestById } from '@/data/sideQuests'
import { rewardPhrases, refreshPoolByCategory, createPhrase, createRewardPhrase, getAllPhrases, rarityLabels, rarityColors, generateChapterPhrasesWithSource, getThemeEnhancedPhrases } from '@/data/phrases'
import { calculateScore, generatePoemTitle, generatePoemTitleOptions } from '@/utils/scoring'
import { getThemeById, getDefaultTheme } from '@/data/themes'
import { loadThemeState, getCurrentThemeId, setCurrentTheme, getCustomThemes } from '@/utils/storage'
import {
  loadGameState, saveGameState, loadCompositions, saveComposition, deleteComposition,
  unlockChapter, isChapterUnlocked, getAllBestScores, getCompositionsByChapter,
  saveEditingComposition, loadEditingComposition, clearEditingComposition,
  loadCollections, createCollection, deleteCollection, updateCollection,
  addCompositionToCollection, removeCompositionFromCollection,
  pinComposition, unpinComposition,
  saveDraft, loadDraft, clearDraft, hasDraft, createDraftFromState
} from '@/utils/storage'
import type { EditingCompositionState, DraftState, DraftSource } from '@/utils/storage'
import type { Collection } from '@/types'
import {
  loadQuestState, saveQuestState, unlockQuest, completeQuest, claimReward,
  isQuestUnlocked, isQuestCompleted, isRewardClaimed, addWeightBoost,
  addChapterRewardPhrase, addEarnedTitle, collectPhrase, collectPhrases, getPhraseCollection,
  getStreakState, updateStreak, getCollectedPhrasesByRarity, getCollectionCompositionStats
} from '@/utils/storage'
import {
  createHistoryManager, createCanvasState, createSnapshot,
  addSnapshot, deleteSnapshot, loadSnapshots, setCurrentSnapshot, renameSnapshot
} from '@/utils/history'
import { musicPlayer } from '@/utils/music'

import TopHeader from '@/components/TopHeader.vue'
import PhrasePool from '@/components/PhrasePool.vue'
import CanvasBoard from '@/components/CanvasBoard.vue'
import ScorePanel from '@/components/ScorePanel.vue'
import ChapterSelect from '@/components/ChapterSelect.vue'
import Portfolio from '@/components/Portfolio.vue'
import SaveDialog from '@/components/SaveDialog.vue'
import SideQuestPanel from '@/components/SideQuestPanel.vue'
import SnapshotPanel from '@/components/SnapshotPanel.vue'
import PhraseCollection from '@/components/PhraseCollection.vue'
import ThemePanel from '@/components/ThemePanel.vue'

const gameState = ref<GameState>(loadGameState())
const currentChapterId = ref(gameState.value.currentChapterId)
const themeState = ref(loadThemeState())
const showThemePanel = ref(false)
const currentThemeId = ref(getCurrentThemeId())
const customThemesRevision = ref(0)

const isFreeRealm = computed(() => currentChapterId.value === 'ch5')

const currentTheme = computed((): Theme => {
  void customThemesRevision.value
  if (!isFreeRealm.value) {
    return getDefaultTheme()
  }
  return getThemeById(currentThemeId.value, getCustomThemes()) || getDefaultTheme()
})

const effectiveBackground = computed(() => {
  if (isFreeRealm.value) {
    return currentTheme.value.background.gradient
  }
  return currentChapter.value?.backgroundGradient || '#0f0f1a'
})

const effectiveAccentColor = computed(() => {
  if (isFreeRealm.value) {
    return currentTheme.value.accentColor
  }
  return currentChapter.value?.accentColor || '#c9a86c'
})
const boardPhrases = ref<CanvasPhrase[]>([])
const compositions = ref<Composition[]>(loadCompositions())
const collections = ref<Collection[]>(loadCollections())

const showChapters = ref(false)
const showPortfolio = ref(false)
const showCollection = ref(false)
const showSaveDialog = ref(false)
const showQuestPanel = ref(false)
const showSnapshotPanel = ref(false)
const justUnlockedChapter = ref<string | null>(null)
const questState = ref<QuestState>(loadQuestState())

const snapshotStorage = ref(loadSnapshots())
const editingComposition = ref<EditingCompositionState>(loadEditingComposition())

const chapterDropCache = ref<Record<string, Phrase[]>>({})

const showDraftRestoreDialog = ref(false)
const pendingDraft = ref<DraftState | null>(null)
const lastAutoSaveTime = ref<number>(0)
const autoSaveInterval = 30000

let autoSaveTimer: number | null = null

const saveCurrentDraft = (source: DraftSource) => {
  if (boardPhrases.value.length === 0) {
    clearDraft()
    return
  }
  const draft = createDraftFromState(
    currentChapterId.value,
    boardPhrases.value,
    editingComposition.value.compositionId,
    editingComposition.value.originalTitle,
    source
  )
  saveDraft(draft)
  lastAutoSaveTime.value = Date.now()
}

const restoreDraft = (draft: DraftState) => {
  if (draft.chapterId !== currentChapterId.value) {
    currentChapterId.value = draft.chapterId
    gameState.value.currentChapterId = draft.chapterId
    saveGameState({ currentChapterId: draft.chapterId })
  }
  
  boardPhrases.value = draft.phrases.map(p => ({
    ...p,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: p.width || 0,
    height: p.height || 0
  }))
  
  if (draft.editingCompositionId) {
    setEditingComposition(draft.editingCompositionId, draft.editingOriginalTitle)
  }
  
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  
  clearDraft()
  showDraftRestoreDialog.value = false
  pendingDraft.value = null
}

const discardDraft = () => {
  clearDraft()
  showDraftRestoreDialog.value = false
  pendingDraft.value = null
}

const startAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  autoSaveTimer = window.setInterval(() => {
    if (boardPhrases.value.length > 0) {
      saveCurrentDraft('auto')
    }
  }, autoSaveInterval)
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('page_unload')
  }
}

const getOrGenerateChapterDrops = (chapterId: string): Phrase[] => {
  if (chapterDropCache.value[chapterId]) {
    return chapterDropCache.value[chapterId]
  }
  const ch = getChapterById(chapterId)
  if (!ch) return []
  const config = chapterDropConfigs[chapterId]
  if (!config || config.totalCount === 0) {
    chapterDropCache.value[chapterId] = ch.phrases
    return ch.phrases
  }
  const drops = generateChapterPhrasesWithSource(
    chapterId,
    ch.title,
    config.themeKeywords,
    config.totalCount,
    config.categoryDistribution
  )
  chapterDropCache.value[chapterId] = drops
  return drops
}

const regenerateChapterDrops = (chapterId: string): Phrase[] => {
  const ch = getChapterById(chapterId)
  if (!ch) return []
  const config = chapterDropConfigs[chapterId]
  if (!config || config.totalCount === 0) {
    chapterDropCache.value[chapterId] = ch.phrases
    return ch.phrases
  }
  const drops = generateChapterPhrasesWithSource(
    chapterId,
    ch.title,
    config.themeKeywords,
    config.totalCount,
    config.categoryDistribution
  )
  chapterDropCache.value[chapterId] = drops
  return drops
}

const isEditingComposition = computed(() => editingComposition.value.compositionId !== null)
const editingOriginalTitle = computed(() => editingComposition.value.originalTitle || '')

const historyManager = createHistoryManager(50)
const canUndo = ref(false)
const canRedo = ref(false)
const isApplyingHistory = ref(false)

const updateHistoryAvailability = () => {
  canUndo.value = historyManager.canUndo()
  canRedo.value = historyManager.canRedo()
}

const pushToHistory = () => {
  if (isApplyingHistory.value) return
  const state = createCanvasState(currentChapterId.value, boardPhrases.value)
  historyManager.push(state)
  updateHistoryAvailability()
}

const applyState = (state: CanvasState | null) => {
  if (!state) {
    boardPhrases.value = []
  } else {
    if (state.chapterId !== currentChapterId.value) {
      currentChapterId.value = state.chapterId
      gameState.value.currentChapterId = state.chapterId
      saveGameState({ currentChapterId: state.chapterId })
    }
    boardPhrases.value = state.phrases.map(p => ({
      ...p,
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    }))
  }
  updateHistoryAvailability()
}

const handleUndo = () => {
  if (!historyManager.canUndo()) return
  isApplyingHistory.value = true
  const prevState = historyManager.undo()
  applyState(prevState)
  musicPlayer.playPluckSound()
  nextTick(() => {
    isApplyingHistory.value = false
  })
}

const handleRedo = () => {
  if (!historyManager.canRedo()) return
  isApplyingHistory.value = true
  const nextState = historyManager.redo()
  applyState(nextState)
  musicPlayer.playPluckSound()
  nextTick(() => {
    isApplyingHistory.value = false
  })
}

const handleCreateSnapshot = () => {
  if (boardPhrases.value.length === 0) {
    alert('画布为空，无法创建快照')
    return
  }
  const snap = createSnapshot(currentChapterId.value, boardPhrases.value)
  snapshotStorage.value = addSnapshot(snap)
  musicPlayer.playSuccessSound()
}

const handleRestoreSnapshot = (snap: HistorySnapshot) => {
  if (boardPhrases.value.length > 0) {
    const hint = '恢复快照将替换当前画布内容，是否保存当前内容为草稿？'
    if (confirm(hint)) {
      saveCurrentDraft('dialog_close')
    } else {
      clearDraft()
    }
  }
  
  if (snap.chapterId !== currentChapterId.value) {
    currentChapterId.value = snap.chapterId
    gameState.value.currentChapterId = snap.chapterId
    saveGameState({ currentChapterId: snap.chapterId })
  }
  boardPhrases.value = snap.phrases.map(p => ({
    ...p,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: 0,
    height: 0
  }))
  snapshotStorage.value = setCurrentSnapshot(snap.id)
  historyManager.reset()
  pushToHistory()
  showSnapshotPanel.value = false
  musicPlayer.playPluckSound()
}

const handleDeleteSnapshot = (snapshotId: string) => {
  if (!confirm('确定要删除这个快照吗？')) return
  snapshotStorage.value = deleteSnapshot(snapshotId)
}

const handleRenameSnapshot = (snapshotId: string, newName: string) => {
  snapshotStorage.value = renameSnapshot(snapshotId, newName)
}

const setEditingComposition = (compId: string | null, title: string | null = null) => {
  const state: EditingCompositionState = {
    compositionId: compId,
    originalTitle: title,
    loadedAt: compId ? Date.now() : null
  }
  editingComposition.value = state
  saveEditingComposition(state)
}

const clearEditingState = () => {
  setEditingComposition(null, null)
}

const handleKeydown = (e: KeyboardEvent) => {
  const isMeta = e.metaKey || e.ctrlKey
  if (isMeta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  } else if (isMeta && (e.key === 'z' || e.key === 'Z') && e.shiftKey) {
    e.preventDefault()
    handleRedo()
  } else if (isMeta && e.key === 'y') {
    e.preventDefault()
    handleRedo()
  } else if (isMeta && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

const canvasBoardRef = ref<InstanceType<typeof CanvasBoard> | null>(null)

const currentChapter = computed((): Chapter | null => {
  const ch = getChapterById(currentChapterId.value)
  return ch || null
})

const placedPhraseIds = computed(() => new Set(boardPhrases.value.map(p => p.id)))

const score = computed<ScoreBreakdown>((): ScoreBreakdown => {
  if (!currentChapter.value) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }
  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight,
    rarity: p.rarity,
    source: p.source
  }))
  const theme = isFreeRealm.value ? currentTheme.value : undefined
  return calculateScore(phrases, currentChapter.value, questState.value.activeWeightBoosts, theme)
})

const poemTitle = computed(() => {
  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight,
    rarity: p.rarity,
    source: p.source
  }))
  const theme = isFreeRealm.value ? currentTheme.value : undefined
  return generatePoemTitle(phrases, theme, currentChapter.value || undefined)
})

const poemTitleOptions = computed((): TitleOption[] => {
  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight,
    rarity: p.rarity,
    source: p.source
  }))
  const theme = isFreeRealm.value ? currentTheme.value : undefined
  return generatePoemTitleOptions(phrases, theme, currentChapter.value || undefined)
})

const unlockedChapterIds = computed(() => {
  const ids: string[] = []
  chapters.forEach(ch => {
    if (isChapterUnlocked(ch.id) || ch.unlocked) {
      ids.push(ch.id)
    }
  })
  return ids
})

const chapterProgress = computed((): Record<string, ChapterProgress> => {
  const bestScores = getAllBestScores()
  const progress: Record<string, ChapterProgress> = {}
  chapters.forEach(ch => {
    const bestScore = bestScores[ch.id] || 0
    const chapterQuests = sideQuests.filter(q => q.chapterId === ch.id)
    const completedQuests = chapterQuests
      .filter(q => questState.value.completedQuests.includes(q.id))
      .map(q => q.id)
    const totalQuests = chapterQuests.map(q => q.id)
    const compositionCount = getCompositionsByChapter(ch.id).length
    let starRating = 0
    if (bestScore >= 90) starRating = 3
    else if (bestScore >= 75) starRating = 2
    else if (bestScore >= 60) starRating = 1
    progress[ch.id] = {
      bestScore,
      starRating,
      completedQuests,
      totalQuests,
      compositionCount
    }
  })
  return progress
})

const chaptersTitles = computed(() => {
  const map: Record<string, { title: string; accent: string }> = {}
  chapters.forEach(ch => {
    map[ch.id] = { title: ch.title, accent: ch.accentColor }
  })
  return map
})

const currentChapterQuests = computed(() => {
  return getQuestsByChapter(currentChapterId.value)
})

const availableQuestCount = computed(() => {
  const unlocked = sideQuests.filter(q => questState.value.unlockedQuests.includes(q.id))
  const unclaimed = unlocked.filter(q => !questState.value.claimedRewards.includes(q.id))
  return unclaimed.length
})

const enhancedChapterPhrases = computed((): Phrase[] => {
  const ch = currentChapter.value
  if (!ch) return []
  const droppedPhrases = getOrGenerateChapterDrops(currentChapterId.value)
  const rewardPhrasesForChapter = questState.value.chapterRewardPhrases[currentChapterId.value] || []
  const allPhrases = [...droppedPhrases, ...rewardPhrasesForChapter]
  
  if (isFreeRealm.value) {
    return getThemeEnhancedPhrases(allPhrases, currentTheme.value)
  }
  
  return allPhrases
})

const handleSelectTheme = (themeId: string) => {
  currentThemeId.value = themeId
  setCurrentTheme(themeId)
  themeState.value = loadThemeState()
  customThemesRevision.value++
  chapterDropCache.value = {}
}

const handleThemesChanged = () => {
  customThemesRevision.value++
  themeState.value = loadThemeState()
  currentThemeId.value = getCurrentThemeId()
}

const collectedPhraseTexts = computed((): Set<string> => {
  const collected = questState.value.phraseCollection.collectedPhrases
  return new Set(Object.keys(collected))
})

const soundscapeLabel = computed(() => {
  const sc = chapterSoundscapes[currentChapterId.value]
  return sc ? sc.label : '默认'
})

const totalPhraseCount = computed((): number => {
  const basePhrases = getAllPhrases().length
  const rewardPhraseCount = Object.keys(rewardPhrases).length
  return basePhrases + rewardPhraseCount
})

const collectionProgress = computed((): number => {
  return questState.value.phraseCollection.totalCollected
})

const lastMilestoneLevel = ref<'none' | 'bronze' | 'silver' | 'gold'>('none')

const checkScoreMilestone = (totalScore: number) => {
  let level: 'none' | 'bronze' | 'silver' | 'gold' = 'none'
  if (totalScore >= 90) level = 'gold'
  else if (totalScore >= 75) level = 'silver'
  else if (totalScore >= 60) level = 'bronze'

  const levelOrder = { none: 0, bronze: 1, silver: 2, gold: 3 }
  if (level !== 'none' && levelOrder[level] > levelOrder[lastMilestoneLevel.value]) {
    lastMilestoneLevel.value = level
    musicPlayer.playMilestoneChime(level)
  }
}

const handlePhraseSelect = (phrase: Phrase) => {
  canvasBoardRef.value?.addPhrase(phrase)
}

const handleBoardPhrasesUpdate = (phrases: CanvasPhrase[]) => {
  boardPhrases.value = phrases
}

const handleRemovePhrase = (phraseId: string) => {
  boardPhrases.value = boardPhrases.value.filter(p => p.id !== phraseId)
}

const handleToggleMusic = () => {
  gameState.value.musicEnabled = !gameState.value.musicEnabled
  saveGameState({ musicEnabled: gameState.value.musicEnabled })
  if (gameState.value.musicEnabled) {
    musicPlayer.init()
    musicPlayer.setVolume(gameState.value.musicVolume)
    musicPlayer.switchChapter(currentChapterId.value)
    musicPlayer.play()
  } else {
    musicPlayer.stop()
  }
}

const handleChangeVolume = (vol: number) => {
  gameState.value.musicVolume = vol
  saveGameState({ musicVolume: vol })
  musicPlayer.setVolume(vol)
}

const handleSelectChapter = (chapterId: string) => {
  if (boardPhrases.value.length > 0) {
    const hint = isEditingComposition.value
      ? `切换章节将清空当前编辑中的「${editingOriginalTitle.value}」，是否保存为草稿？`
      : '切换章节将清空当前画布，是否保存为草稿？'
    if (confirm(hint)) {
      saveCurrentDraft('chapter_switch')
    } else {
      clearDraft()
    }
  }
  currentChapterId.value = chapterId
  gameState.value.currentChapterId = chapterId
  saveGameState({ currentChapterId: chapterId })
  boardPhrases.value = []
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  showChapters.value = false
  justUnlockedChapter.value = null
  lastMilestoneLevel.value = 'none'
  musicPlayer.switchChapter(chapterId)
}

const handleReset = () => {
  if (boardPhrases.value.length === 0) return
  const hint = isEditingComposition.value
    ? `确定要清空当前编辑中的「${editingOriginalTitle.value}」吗？`
    : '确定要清空画布吗？'
  if (!confirm(hint)) return
  
  const saveHint = '是否保存当前内容为草稿？'
  if (confirm(saveHint)) {
    saveCurrentDraft('dialog_close')
  } else {
    clearDraft()
  }
  
  boardPhrases.value = []
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  pushToHistory()
}

const handleSave = () => {
  if (boardPhrases.value.length === 0) {
    alert('请先选择一些词句')
    return
  }
  showSaveDialog.value = true
}

const doSaveComposition = (title: string, asNewCopy: boolean, continueEditing: boolean) => {
  if (!currentChapter.value) return

  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight,
    rarity: p.rarity,
    source: p.source
  }))

  const now = Date.now()
  const isEditing = isEditingComposition.value && !asNewCopy
  const existingCompId = editingComposition.value.compositionId

  let composition: Composition
  if (isEditing && existingCompId) {
    const existing = compositions.value.find(c => c.id === existingCompId)
    composition = {
      id: existingCompId,
      chapterId: currentChapterId.value,
      phrases,
      score: score.value,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      title,
      isPinned: existing?.isPinned,
      pinnedAt: existing?.pinnedAt,
      collectionIds: existing?.collectionIds
    }
  } else {
    composition = {
      id: `comp_${now}`,
      chapterId: currentChapterId.value,
      phrases,
      score: score.value,
      createdAt: now,
      updatedAt: now,
      title
    }
  }

  saveComposition(composition)
  compositions.value = loadCompositions()
  musicPlayer.playSaveChime()

  const phraseTexts = phrases.map(p => p.text)
  const { newlyCollected } = collectPhrases(phraseTexts, currentChapterId.value)
  
  updateStreak(score.value.total, 60)
  
  questState.value = loadQuestState()

  if (currentChapter.value && score.value.total >= 60) {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId.value)
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1]
      if (!isChapterUnlocked(nextChapter.id)) {
        unlockChapter(nextChapter.id)
        justUnlockedChapter.value = nextChapter.title
      }
    }
  }

  checkQuestUnlocks()
  checkQuestCompletion()

  showSaveDialog.value = false

  if (continueEditing) {
    if (asNewCopy || !isEditing) {
      setEditingComposition(composition.id, title)
    }
    justUnlockedChapter.value = null
    clearDraft()
  } else {
    boardPhrases.value = []
    historyManager.reset()
    pushToHistory()
    snapshotStorage.value = setCurrentSnapshot(null)
    clearEditingState()
    clearDraft()
    justUnlockedChapter.value = null
  }
}

const handleConfirmSave = (title: string, continueEditing: boolean) => {
  doSaveComposition(title, false, continueEditing)
}

const handleSaveAsNew = (title: string, continueEditing: boolean) => {
  doSaveComposition(title, true, continueEditing)
}

const handleLoadComposition = (comp: Composition) => {
  if (boardPhrases.value.length > 0) {
    const hint = '加载作品将替换当前画布内容，是否保存当前内容为草稿？'
    if (confirm(hint)) {
      saveCurrentDraft('dialog_close')
    } else {
      clearDraft()
    }
  }
  
  if (comp.chapterId !== currentChapterId.value) {
    currentChapterId.value = comp.chapterId
    gameState.value.currentChapterId = comp.chapterId
    saveGameState({ currentChapterId: comp.chapterId })
  }
  
  boardPhrases.value = comp.phrases.map(p => ({
    ...p,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: 0,
    height: 0
  }))
  
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  setEditingComposition(comp.id, comp.title)
  showPortfolio.value = false
  clearDraft()
}

const handleDeleteComposition = (id: string) => {
  if (!confirm('确定要删除这首诗吗？')) return
  deleteComposition(id)
  compositions.value = loadCompositions()
  if (editingComposition.value.compositionId === id) {
    clearEditingState()
  }
}

const handlePinComposition = (id: string) => {
  pinComposition(id)
  compositions.value = loadCompositions()
  musicPlayer.playPluckSound()
}

const handleUnpinComposition = (id: string) => {
  unpinComposition(id)
  compositions.value = loadCompositions()
  musicPlayer.playPluckSound()
}

const handleAddToCollection = (compositionId: string, collectionId: string) => {
  addCompositionToCollection(compositionId, collectionId)
  compositions.value = loadCompositions()
  collections.value = loadCollections()
  musicPlayer.playPluckSound()
}

const handleRemoveFromCollection = (compositionId: string, collectionId: string) => {
  removeCompositionFromCollection(compositionId, collectionId)
  compositions.value = loadCompositions()
  collections.value = loadCollections()
  musicPlayer.playPluckSound()
}

const handleCreateCollection = (name: string, description: string, accentColor: string) => {
  createCollection(name, description, accentColor)
  collections.value = loadCollections()
  musicPlayer.playSuccessSound()
}

const handleDeleteCollection = (collectionId: string) => {
  deleteCollection(collectionId)
  collections.value = loadCollections()
  compositions.value = loadCompositions()
  musicPlayer.playPluckSound()
}

const handleUpdateCollection = (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>) => {
  updateCollection(collectionId, updates)
  collections.value = loadCollections()
  musicPlayer.playPluckSound()
}

const handleRefreshPortfolio = () => {
  compositions.value = loadCompositions()
  collections.value = loadCollections()
}

const handleNextChapter = () => {
  showSaveDialog.value = false
  if (justUnlockedChapter.value) {
    const nextCh = chapters.find(ch => ch.title === justUnlockedChapter.value)
    if (nextCh) {
      currentChapterId.value = nextCh.id
      gameState.value.currentChapterId = nextCh.id
      saveGameState({ currentChapterId: nextCh.id })
    }
  }
  boardPhrases.value = []
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  clearDraft()
  justUnlockedChapter.value = null
}

const handleCloseChapters = () => {
  showChapters.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const handleClosePortfolio = () => {
  showPortfolio.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const handleCloseSaveDialog = () => {
  showSaveDialog.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const handleCloseQuestPanel = () => {
  showQuestPanel.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const handleCloseSnapshotPanel = () => {
  showSnapshotPanel.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const handleCloseCollection = () => {
  showCollection.value = false
  if (boardPhrases.value.length > 0) {
    saveCurrentDraft('dialog_close')
  }
}

const checkCondition = (condition: QuestCondition, ctx: { compositions: Composition[]; boardPhrases: Phrase[]; chapterId: string; score: ScoreBreakdown; unlockedChapterCount: number }): boolean => {
  const { type, params } = condition
  switch (type) {
    case 'score_threshold': {
      const targetChapter = params.chapterId as string
      if (targetChapter === ctx.chapterId) {
        return ctx.score.total >= (params.minScore as number)
      }
      const chapterComps = ctx.compositions.filter(c => c.chapterId === targetChapter)
      return chapterComps.some(c => c.score.total >= (params.minScore as number))
    }
    case 'phrase_combo': {
      const texts = params.texts as string[]
      const boardTexts = new Set(ctx.boardPhrases.map(p => p.text))
      return texts.every(t => boardTexts.has(t))
    }
    case 'composition_count': {
      const targetChapter = params.chapterId as string
      if (targetChapter === '__all__') {
        return ctx.compositions.length >= (params.minCount as number)
      }
      const chapterComps = ctx.compositions.filter(c => c.chapterId === targetChapter)
      return chapterComps.length >= (params.minCount as number)
    }
    case 'chapter_count': {
      return ctx.unlockedChapterCount >= (params.minCount as number)
    }
    case 'category_diversity': {
      const categories = new Set(ctx.boardPhrases.map(p => p.category))
      return categories.size >= (params.minCategories as number)
    }
    case 'win_streak': {
      const streak = getStreakState()
      const minStreak = params.minStreak as number
      const streakType = params.streakType as 'current' | 'best' | undefined
      if (streakType === 'best') {
        return streak.bestStreak >= minStreak
      }
      return streak.currentStreak >= minStreak
    }
    case 'phrase_collection_count': {
      const minCount = params.minCount as number
      const collection = getPhraseCollection()
      return collection.totalCollected >= minCount
    }
    case 'phrase_collection_rarity': {
      const rarity = params.rarity as string
      const minCount = params.minCount as number
      const counts = getCollectedPhrasesByRarity()
      return (counts[rarity] || 0) >= minCount
    }
    case 'rarity_combo': {
      const rarities = params.rarities as string[]
      const boardRarities = new Set(ctx.boardPhrases.map(p => p.rarity))
      return rarities.every(r => boardRarities.has(r as any))
    }
    case 'all_chapters_score': {
      const minScore = params.minScore as number
      const bestScores = getAllBestScores()
      const unlockedChapterIds = chapters
        .filter(ch => isChapterUnlocked(ch.id) || ch.unlocked)
        .map(ch => ch.id)
      
      if (unlockedChapterIds.length === 0) return false
      
      return unlockedChapterIds.every(id => {
        const chapterBest = bestScores[id] || 0
        return chapterBest >= minScore
      })
    }
    case 'collection_composition_count': {
      const minCount = params.minCount as number
      const stats = getCollectionCompositionStats()
      return stats.totalInCollections >= minCount
    }
    case 'perfect_clear': {
      const targetChapter = params.chapterId as string
      const chapterComps = ctx.compositions.filter(c => c.chapterId === targetChapter)
      return chapterComps.some(c => c.score.total >= 95)
    }
    default:
      return false
  }
}

const checkQuestUnlocks = () => {
  const ctx = {
    compositions: compositions.value,
    boardPhrases: boardPhrases.value.map(p => ({
      id: p.id, text: p.text, category: p.category,
      position: p.position, rotation: p.rotation,
      isPlaced: p.isPlaced, weight: p.weight,
      rarity: p.rarity, source: p.source
    })),
    chapterId: currentChapterId.value,
    score: score.value,
    unlockedChapterCount: unlockedChapterIds.value.length
  }

  sideQuests.forEach(quest => {
    if (questState.value.unlockedQuests.includes(quest.id)) return
    const allMet = quest.unlockConditions.every(c => checkCondition(c, ctx))
    if (allMet) {
      unlockQuest(quest.id)
      questState.value = loadQuestState()
    }
  })
}

const checkQuestCompletion = () => {
  const ctx = {
    compositions: compositions.value,
    boardPhrases: boardPhrases.value.map(p => ({
      id: p.id, text: p.text, category: p.category,
      position: p.position, rotation: p.rotation,
      isPlaced: p.isPlaced, weight: p.weight,
      rarity: p.rarity, source: p.source
    })),
    chapterId: currentChapterId.value,
    score: score.value,
    unlockedChapterCount: unlockedChapterIds.value.length
  }

  sideQuests.forEach(quest => {
    if (!questState.value.unlockedQuests.includes(quest.id)) return
    if (questState.value.completedQuests.includes(quest.id)) return
    const allMet = quest.completeConditions.every(c => checkCondition(c, ctx))
    if (allMet) {
      completeQuest(quest.id)
      questState.value = loadQuestState()
    }
  })
}

const handleClaimReward = (questId: string) => {
  const quest = getQuestById(questId)
  if (!quest || questState.value.claimedRewards.includes(questId)) return

  quest.rewards.forEach(reward => {
    switch (reward.type) {
      case 'phrase_unlock': {
        const texts = reward.params.phraseTexts as string[]
        const targetChapter = quest.chapterId
        texts.forEach(text => {
          const phrase = createRewardPhrase(text)
          if (phrase) {
            addChapterRewardPhrase(targetChapter, phrase)
            collectPhrase(text, targetChapter, questId)
          }
        })
        break
      }
      case 'phrase_pool_refresh': {
        const targetChapterId = reward.params.chapterId as string
        const category = reward.params.addCategory as PhraseCategory
        const count = reward.params.count as number
        const refreshed = refreshPoolByCategory(category, count)
        if (targetChapterId === '__all__') {
          chapters.forEach(ch => {
            refreshed.forEach(p => {
              addChapterRewardPhrase(ch.id, { ...p, id: `${p.id}_${ch.id}` })
            })
          })
        } else {
          refreshed.forEach(p => {
            addChapterRewardPhrase(targetChapterId, p)
          })
        }
        break
      }
      case 'score_weight_boost': {
        addWeightBoost(reward.params.dimension as string, reward.params.boost as number)
        break
      }
      case 'title_reward': {
        addEarnedTitle(reward.params.title as string)
        break
      }
    }
  })

  claimReward(questId)
  questState.value = loadQuestState()
}

const handleFirstInteraction = () => {
  if (gameState.value.musicEnabled) {
    musicPlayer.init()
    musicPlayer.setVolume(gameState.value.musicVolume)
    musicPlayer.switchChapter(currentChapterId.value)
    musicPlayer.play()
  }
}

onMounted(() => {
  document.addEventListener('click', handleFirstInteraction, { once: true })
  document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true })
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  const draft = loadDraft()
  if (draft && draft.phrases.length > 0) {
    pendingDraft.value = draft
    showDraftRestoreDialog.value = true
  }
  
  pushToHistory()
  checkQuestUnlocks()
  startAutoSave()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  stopAutoSave()
})

watch(boardPhrases, () => {
  checkQuestUnlocks()
  checkQuestCompletion()
  if (!isApplyingHistory.value) {
    pushToHistory()
  }
}, { deep: true })

watch(() => score.value.total, (newTotal) => {
  if (newTotal > 0 && boardPhrases.value.length > 0) {
    checkScoreMilestone(newTotal)
  }
})

watch(currentChapterId, (newId) => {
  lastMilestoneLevel.value = 'none'
  if (gameState.value.musicEnabled) {
    musicPlayer.switchChapter(newId)
  }
})
</script>

<template>
  <div class="app-container" :style="{ background: effectiveBackground }">
    <TopHeader
      :chapter="currentChapter"
      :musicEnabled="gameState.musicEnabled"
      :musicVolume="gameState.musicVolume"
      :questCount="availableQuestCount"
      :canUndo="canUndo"
      :canRedo="canRedo"
      :snapshotCount="snapshotStorage.snapshots.length"
      :isEditingComposition="isEditingComposition"
      :editingTitle="editingOriginalTitle"
      :isFreeRealm="isFreeRealm"
      :currentTheme="currentTheme"
      :soundscapeLabel="soundscapeLabel"
      @toggleMusic="handleToggleMusic"
      @changeVolume="handleChangeVolume"
      @openChapters="showChapters = true"
      @openPortfolio="showPortfolio = true"
      @openQuests="showQuestPanel = true"
      @openSnapshots="showSnapshotPanel = true"
      @openThemes="showThemePanel = true"
      @undo="handleUndo"
      @redo="handleRedo"
      @save="handleSave"
      @reset="handleReset"
    />
    
    <main class="main-content">
      <div class="left-panel">
        <div v-if="currentChapter" class="chapter-info">
          <div class="chapter-hint">
            <span class="hint-icon">✦</span>
            <span class="hint-text">{{ currentChapter.hint }}</span>
          </div>
        </div>
        
        <div class="board-wrapper">
          <CanvasBoard
            ref="canvasBoardRef"
            :phrases="enhancedChapterPhrases"
            :boardPhrases="boardPhrases"
            :accentColor="effectiveAccentColor"
            :theme="isFreeRealm ? currentTheme : undefined"
            @update:boardPhrases="handleBoardPhrasesUpdate"
            @remove="handleRemovePhrase"
          />
        </div>
      </div>
      
      <aside class="right-panel">
        <div class="panel-section">
          <ScorePanel
            :score="score"
            :phrasesCount="boardPhrases.length"
            :targetCount="currentChapter?.targetPhraseCount || 5"
            :weightBoosts="questState.activeWeightBoosts"
            :phrases="boardPhrases.map(p => ({
              id: p.id,
              text: p.text,
              category: p.category,
              position: p.position,
              rotation: p.rotation,
              isPlaced: p.isPlaced,
              weight: p.weight,
              rarity: p.rarity,
              source: p.source
            }))"
            :chapter="currentChapter"
          />
        </div>
        
        <div class="panel-section pool-section">
          <div class="section-header">
            <div class="section-title-row">
              <span class="section-title">词句池</span>
              <button class="collection-badge interactive" title="查看词句图鉴" @click="showCollection = true">
                ✦ {{ collectionProgress }} / {{ totalPhraseCount }}
              </button>
            </div>
            <span class="section-count">
              {{ (enhancedChapterPhrases.length) - boardPhrases.length }}
              /
              {{ enhancedChapterPhrases.length }}
            </span>
          </div>
          <div class="pool-wrapper">
            <PhrasePool
              :phrases="enhancedChapterPhrases"
              :placedPhraseIds="placedPhraseIds"
              :collectedPhrases="collectedPhraseTexts"
              @select="handlePhraseSelect"
            />
          </div>
        </div>
      </aside>
    </main>
    
    <ChapterSelect
      v-if="showChapters"
      :chapters="chapters"
      :unlockedIds="unlockedChapterIds"
      :currentId="currentChapterId"
      :chapterProgress="chapterProgress"
      :questState="questState"
      :sideQuests="sideQuests"
      @select="handleSelectChapter"
      @close="handleCloseChapters"
    />
    
    <Portfolio
      v-if="showPortfolio"
      :compositions="compositions"
      :collections="collections"
      :chaptersTitles="chaptersTitles"
      :editingCompositionId="editingComposition.compositionId"
      @load="handleLoadComposition"
      @delete="handleDeleteComposition"
      @close="handleClosePortfolio"
      @pin="handlePinComposition"
      @unpin="handleUnpinComposition"
      @addToCollection="handleAddToCollection"
      @removeFromCollection="handleRemoveFromCollection"
      @createCollection="handleCreateCollection"
      @deleteCollection="handleDeleteCollection"
      @updateCollection="handleUpdateCollection"
      @refresh="handleRefreshPortfolio"
    />
    
    <SaveDialog
      :visible="showSaveDialog"
      :title="poemTitle"
      :titleOptions="poemTitleOptions"
      :score="score"
      :unlockedNext="!!justUnlockedChapter"
      :nextChapterTitle="justUnlockedChapter"
      :isEditing="isEditingComposition"
      :originalTitle="editingOriginalTitle"
      @confirm="handleConfirmSave"
      @saveAsNew="handleSaveAsNew"
      @cancel="handleCloseSaveDialog"
      @nextChapter="handleNextChapter"
    />
    
    <SideQuestPanel
      v-if="showQuestPanel"
      :quests="sideQuests"
      :questState="questState"
      :currentChapterId="currentChapterId"
      @close="handleCloseQuestPanel"
      @claim="handleClaimReward"
    />
    
    <SnapshotPanel
      v-if="showSnapshotPanel"
      :snapshots="snapshotStorage.snapshots"
      :currentSnapshotId="snapshotStorage.currentSnapshotId"
      :chaptersTitles="chaptersTitles"
      @restore="handleRestoreSnapshot"
      @delete="handleDeleteSnapshot"
      @rename="handleRenameSnapshot"
      @close="handleCloseSnapshotPanel"
      @create="handleCreateSnapshot"
    />
    
    <PhraseCollection
      v-if="showCollection"
      :collection="questState.phraseCollection"
      @close="handleCloseCollection"
    />
    
    <ThemePanel
      v-if="showThemePanel"
      :visible="showThemePanel"
      :currentThemeId="currentThemeId"
      @close="showThemePanel = false"
      @select="handleSelectTheme"
      @themesChanged="handleThemesChanged"
    />
    
    <div v-if="showDraftRestoreDialog && pendingDraft" class="draft-restore-overlay" @click.self="discardDraft">
      <div class="draft-restore-dialog">
        <div class="draft-restore-header">
          <span class="draft-restore-icon">✦</span>
          <span class="draft-restore-title">发现未保存的草稿</span>
        </div>
        <div class="draft-restore-content">
          <p class="draft-restore-text">
            检测到上次编辑中的草稿，包含 {{ pendingDraft.phrases.length }} 个词句
          </p>
          <p class="draft-restore-subtext">
            保存时间：{{ new Date(pendingDraft.savedAt).toLocaleString('zh-CN') }}
          </p>
        </div>
        <div class="draft-restore-actions">
          <button class="draft-btn draft-btn-cancel" @click="discardDraft">
            放弃草稿
          </button>
          <button class="draft-btn draft-btn-confirm" @click="restoreDraft(pendingDraft)">
            恢复草稿
          </button>
        </div>
      </div>
    </div>
    
    <div class="bg-decoration">
      <div class="deco-line" style="top: 10%; left: 5%;"></div>
      <div class="deco-line" style="top: 30%; right: 8%; animation-delay: -2s;"></div>
      <div class="deco-line" style="bottom: 20%; left: 10%; animation-delay: -4s;"></div>
      <div class="deco-dot" style="top: 15%; right: 15%;"></div>
      <div class="deco-dot" style="bottom: 25%; left: 20%; animation-delay: -3s;"></div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background 1s ease;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-line {
  position: absolute;
  width: 1px;
  height: 120px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(201, 168, 108, 0.15),
    transparent
  );
  animation: float 8s ease-in-out infinite;
}

.deco-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(201, 168, 108, 0.2);
  animation: float 6s ease-in-out infinite;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  min-height: 0;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.chapter-info {
  flex-shrink: 0;
}

.chapter-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.hint-icon {
  color: var(--accent-gold);
  font-size: 14px;
}

.hint-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.board-wrapper {
  flex: 1;
  min-height: 0;
}

.right-panel {
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.panel-section {
  flex-shrink: 0;
}

.pool-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 10px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collection-badge {
  font-size: 11px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 108, 0.2);
  font-weight: 500;
  transition: all 0.2s ease;
}

.collection-badge.interactive {
  cursor: pointer;
}

.collection-badge.interactive:hover {
  background: rgba(201, 168, 108, 0.2);
  border-color: rgba(201, 168, 108, 0.4);
  transform: translateY(-1px);
}

.section-title {
  font-family: var(--font-brush);
  font-size: 15px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.section-count {
  font-size: 12px;
  color: var(--text-muted);
}

.pool-wrapper {
  flex: 1;
  min-height: 0;
}

.draft-restore-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.draft-restore-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.draft-restore-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.draft-restore-icon {
  font-size: 24px;
  color: var(--accent-gold);
}

.draft-restore-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.draft-restore-content {
  margin-bottom: 24px;
}

.draft-restore-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.draft-restore-subtext {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.draft-restore-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.draft-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: var(--font-serif);
}

.draft-btn-cancel {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.draft-btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.draft-btn-confirm {
  background: var(--accent-gold);
  color: #1a1a2e;
}

.draft-btn-confirm:hover {
  background: #d4b87a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 108, 0.3);
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .right-panel {
    width: 100%;
    max-height: 40%;
  }
  
  .pool-section {
    min-height: 180px;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 12px;
    gap: 10px;
  }
  
  .right-panel {
    width: 100%;
  }
}
</style>
