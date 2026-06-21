import type { Composition, GameState, QuestState, Phrase, Collection, PhraseCollectionState, CanvasPhrase, Theme, ThemeState, StreakState } from '@/types'
import { DEFAULT_THEME_ID } from '@/data/themes'
import { getAllPhrases, getPhraseRarity } from '@/data/phrases'

const STORAGE_KEYS = {
  COMPOSITIONS: 'poem_slices_compositions',
  GAME_STATE: 'poem_slices_game_state',
  QUEST_STATE: 'poem_slices_quest_state',
  EDITING_COMPOSITION: 'poem_slices_editing_composition',
  COLLECTIONS: 'poem_slices_collections',
  DRAFT: 'poem_slices_draft',
  THEME_STATE: 'poem_slices_theme_state',
}

const DEFAULT_QUEST_STATE: QuestState = {
  unlockedQuests: [],
  completedQuests: [],
  claimedRewards: [],
  earnedTitles: [],
  activeWeightBoosts: {},
  chapterRewardPhrases: {},
  phraseCollection: {
    collectedPhrases: {},
    totalCollected: 0
  },
  streak: {
    currentStreak: 0,
    bestStreak: 0,
    lastCompositionTime: null,
    lastScore: null
  }
}

const DEFAULT_STATE: GameState = {
  currentChapterId: 'ch1',
  compositions: [],
  unlockedChapters: ['ch1'],
  musicEnabled: true,
  musicVolume: 0.5
}

export const saveCompositions = (compositions: Composition[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(compositions))
  } catch (e) {
    console.error('Failed to save compositions:', e)
  }
}

export const loadCompositions = (): Composition[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load compositions:', e)
    return []
  }
}

export const saveGameState = (state: Partial<GameState>): void => {
  try {
    const current = loadGameState()
    const merged = { ...current, ...state }
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(merged))
  } catch (e) {
    console.error('Failed to save game state:', e)
  }
}

export const loadGameState = (): GameState => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE)
    return data ? { ...DEFAULT_STATE, ...JSON.parse(data) } : DEFAULT_STATE
  } catch (e) {
    console.error('Failed to load game state:', e)
    return DEFAULT_STATE
  }
}

export const saveComposition = (composition: Composition): void => {
  const all = loadCompositions()
  const index = all.findIndex(c => c.id === composition.id)
  if (index >= 0) {
    all[index] = { ...composition, updatedAt: Date.now() }
  } else {
    all.unshift(composition)
  }
  saveCompositions(all)
}

export const deleteComposition = (id: string): void => {
  const all = loadCompositions()
  const filtered = all.filter(c => c.id !== id)
  saveCompositions(filtered)
}

export const getCompositionsByChapter = (chapterId: string): Composition[] => {
  return loadCompositions().filter(c => c.chapterId === chapterId)
}

export const getBestScoreByChapter = (chapterId: string): number => {
  const chapterComps = getCompositionsByChapter(chapterId)
  if (chapterComps.length === 0) return 0
  return Math.max(...chapterComps.map(c => c.score.total))
}

export const getAllBestScores = (): Record<string, number> => {
  const allComps = loadCompositions()
  const scores: Record<string, number> = {}
  allComps.forEach(c => {
    if (!scores[c.chapterId] || c.score.total > scores[c.chapterId]) {
      scores[c.chapterId] = c.score.total
    }
  })
  return scores
}

export const unlockChapter = (chapterId: string): void => {
  const state = loadGameState()
  if (!state.unlockedChapters.includes(chapterId)) {
    state.unlockedChapters.push(chapterId)
    saveGameState(state)
  }
}

export const isChapterUnlocked = (chapterId: string): boolean => {
  const state = loadGameState()
  return state.unlockedChapters.includes(chapterId)
}

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.COMPOSITIONS)
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE)
  localStorage.removeItem(STORAGE_KEYS.QUEST_STATE)
  localStorage.removeItem(STORAGE_KEYS.EDITING_COMPOSITION)
  localStorage.removeItem(STORAGE_KEYS.COLLECTIONS)
  localStorage.removeItem(STORAGE_KEYS.DRAFT)
}

export const saveQuestState = (state: QuestState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.QUEST_STATE, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save quest state:', e)
  }
}

export const loadQuestState = (): QuestState => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUEST_STATE)
    return data ? { ...DEFAULT_QUEST_STATE, ...JSON.parse(data) } : DEFAULT_QUEST_STATE
  } catch (e) {
    console.error('Failed to load quest state:', e)
    return DEFAULT_QUEST_STATE
  }
}

export const unlockQuest = (questId: string): void => {
  const state = loadQuestState()
  if (!state.unlockedQuests.includes(questId)) {
    state.unlockedQuests.push(questId)
    saveQuestState(state)
  }
}

export const completeQuest = (questId: string): void => {
  const state = loadQuestState()
  if (!state.completedQuests.includes(questId)) {
    state.completedQuests.push(questId)
    saveQuestState(state)
  }
}

export const claimReward = (questId: string): void => {
  const state = loadQuestState()
  if (!state.claimedRewards.includes(questId)) {
    state.claimedRewards.push(questId)
    saveQuestState(state)
  }
}

export const isQuestUnlocked = (questId: string): boolean => {
  return loadQuestState().unlockedQuests.includes(questId)
}

export const isQuestCompleted = (questId: string): boolean => {
  return loadQuestState().completedQuests.includes(questId)
}

export const isRewardClaimed = (questId: string): boolean => {
  return loadQuestState().claimedRewards.includes(questId)
}

export const addWeightBoost = (dimension: string, boost: number): void => {
  const state = loadQuestState()
  state.activeWeightBoosts[dimension] = (state.activeWeightBoosts[dimension] || 0) + boost
  saveQuestState(state)
}

export const addChapterRewardPhrase = (chapterId: string, phrase: Phrase): void => {
  const state = loadQuestState()
  if (!state.chapterRewardPhrases[chapterId]) {
    state.chapterRewardPhrases[chapterId] = []
  }
  state.chapterRewardPhrases[chapterId].push(phrase)
  saveQuestState(state)
}

export const addEarnedTitle = (title: string): void => {
  const state = loadQuestState()
  if (!state.earnedTitles.includes(title)) {
    state.earnedTitles.push(title)
    saveQuestState(state)
  }
}

export const collectPhrase = (phraseText: string, sourceChapterId?: string, sourceQuestId?: string): boolean => {
  const state = loadQuestState()
  const collection = state.phraseCollection
  
  if (collection.collectedPhrases[phraseText]) {
    collection.collectedPhrases[phraseText].acquiredCount++
    saveQuestState(state)
    return false
  }
  
  collection.collectedPhrases[phraseText] = {
    phraseText,
    firstAcquiredAt: Date.now(),
    acquiredCount: 1,
    sourceChapterId,
    sourceQuestId
  }
  collection.totalCollected = Object.keys(collection.collectedPhrases).length
  saveQuestState(state)
  return true
}

export const collectPhrases = (phraseTexts: string[], sourceChapterId?: string): { newlyCollected: string[] } => {
  const newlyCollected: string[] = []
  phraseTexts.forEach(text => {
    const isNew = collectPhrase(text, sourceChapterId)
    if (isNew) {
      newlyCollected.push(text)
    }
  })
  return { newlyCollected }
}

export const isPhraseCollected = (phraseText: string): boolean => {
  const state = loadQuestState()
  return !!state.phraseCollection.collectedPhrases[phraseText]
}

export const getPhraseCollection = (): PhraseCollectionState => {
  const state = loadQuestState()
  return state.phraseCollection
}

export const getCollectedPhraseCount = (): number => {
  return getPhraseCollection().totalCollected
}

export const getCollectedPhrasesByRarity = (): Record<string, number> => {
  const state = loadQuestState()
  const counts: Record<string, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  }
  Object.values(state.phraseCollection.collectedPhrases).forEach(record => {
    const phraseText = record.phraseText
    const rarity = getPhraseRarity(phraseText)
    if (rarity in counts) {
      counts[rarity]++
    }
  })
  return counts
}

const determinePhraseRarity = (text: string): string => {
  return getPhraseRarity(text)
}

export const getStreakState = (): StreakState => {
  const state = loadQuestState()
  return state.streak
}

export const updateStreak = (score: number, minStreakScore: number = 60): StreakState => {
  const state = loadQuestState()
  const streak = state.streak
  const now = Date.now()

  if (score >= minStreakScore) {
    streak.currentStreak++
    if (streak.currentStreak > streak.bestStreak) {
      streak.bestStreak = streak.currentStreak
    }
  } else {
    streak.currentStreak = 0
  }

  streak.lastCompositionTime = now
  streak.lastScore = score

  saveQuestState(state)
  return { ...streak }
}

export const resetStreak = (): void => {
  const state = loadQuestState()
  state.streak.currentStreak = 0
  saveQuestState(state)
}

export const getCollectionCompositionStats = (): { totalCollections: number; totalInCollections: number } => {
  const collections = loadCollections()
  const compositions = loadCompositions()
  const inCollections = new Set<string>()
  collections.forEach(c => {
    c.compositionIds.forEach(id => inCollections.add(id))
  })
  return {
    totalCollections: collections.length,
    totalInCollections: inCollections.size
  }
}

export interface EditingCompositionState {
  compositionId: string | null
  originalTitle: string | null
  loadedAt: number | null
}

const DEFAULT_EDITING_STATE: EditingCompositionState = {
  compositionId: null,
  originalTitle: null,
  loadedAt: null
}

export const saveEditingComposition = (state: EditingCompositionState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EDITING_COMPOSITION, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save editing composition state:', e)
  }
}

export const loadEditingComposition = (): EditingCompositionState => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EDITING_COMPOSITION)
    return data ? { ...DEFAULT_EDITING_STATE, ...JSON.parse(data) } : { ...DEFAULT_EDITING_STATE }
  } catch (e) {
    console.error('Failed to load editing composition state:', e)
    return { ...DEFAULT_EDITING_STATE }
  }
}

export const clearEditingComposition = (): void => {
  localStorage.removeItem(STORAGE_KEYS.EDITING_COMPOSITION)
}

export const loadCollections = (): Collection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COLLECTIONS)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load collections:', e)
    return []
  }
}

export const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections))
  } catch (e) {
    console.error('Failed to save collections:', e)
  }
}

export const createCollection = (name: string, description: string, accentColor: string): Collection => {
  const now = Date.now()
  const collection: Collection = {
    id: `coll_${now}`,
    name,
    description,
    accentColor,
    compositionIds: [],
    createdAt: now,
    updatedAt: now
  }
  const collections = loadCollections()
  collections.push(collection)
  saveCollections(collections)
  return collection
}

export const updateCollection = (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): void => {
  const collections = loadCollections()
  const index = collections.findIndex(c => c.id === collectionId)
  if (index >= 0) {
    collections[index] = {
      ...collections[index],
      ...updates,
      updatedAt: Date.now()
    }
    saveCollections(collections)
  }
}

export const deleteCollection = (collectionId: string): void => {
  const collections = loadCollections()
  const filtered = collections.filter(c => c.id !== collectionId)
  saveCollections(filtered)
  const compositions = loadCompositions()
  const updatedComps = compositions.map(comp => {
    if (comp.collectionIds?.includes(collectionId)) {
      return {
        ...comp,
        collectionIds: comp.collectionIds.filter(id => id !== collectionId)
      }
    }
    return comp
  })
  saveCompositions(updatedComps)
}

export const addCompositionToCollection = (compositionId: string, collectionId: string): void => {
  const compositions = loadCompositions()
  const compIndex = compositions.findIndex(c => c.id === compositionId)
  if (compIndex >= 0) {
    const comp = compositions[compIndex]
    const collectionIds = comp.collectionIds || []
    if (!collectionIds.includes(collectionId)) {
      compositions[compIndex] = {
        ...comp,
        collectionIds: [...collectionIds, collectionId],
        updatedAt: Date.now()
      }
      saveCompositions(compositions)
    }
  }
  const collections = loadCollections()
  const collIndex = collections.findIndex(c => c.id === collectionId)
  if (collIndex >= 0) {
    const coll = collections[collIndex]
    if (!coll.compositionIds.includes(compositionId)) {
      collections[collIndex] = {
        ...coll,
        compositionIds: [...coll.compositionIds, compositionId],
        updatedAt: Date.now()
      }
      saveCollections(collections)
    }
  }
}

export const removeCompositionFromCollection = (compositionId: string, collectionId: string): void => {
  const compositions = loadCompositions()
  const compIndex = compositions.findIndex(c => c.id === compositionId)
  if (compIndex >= 0) {
    const comp = compositions[compIndex]
    if (comp.collectionIds) {
      compositions[compIndex] = {
        ...comp,
        collectionIds: comp.collectionIds.filter(id => id !== collectionId),
        updatedAt: Date.now()
      }
      saveCompositions(compositions)
    }
  }
  const collections = loadCollections()
  const collIndex = collections.findIndex(c => c.id === collectionId)
  if (collIndex >= 0) {
    const coll = collections[collIndex]
    collections[collIndex] = {
      ...coll,
      compositionIds: coll.compositionIds.filter(id => id !== compositionId),
      updatedAt: Date.now()
    }
    saveCollections(collections)
  }
}

export const pinComposition = (compositionId: string): void => {
  const compositions = loadCompositions()
  const index = compositions.findIndex(c => c.id === compositionId)
  if (index >= 0) {
    compositions[index] = {
      ...compositions[index],
      isPinned: true,
      pinnedAt: Date.now(),
      updatedAt: Date.now()
    }
    saveCompositions(compositions)
  }
}

export const unpinComposition = (compositionId: string): void => {
  const compositions = loadCompositions()
  const index = compositions.findIndex(c => c.id === compositionId)
  if (index >= 0) {
    const { isPinned, pinnedAt, ...rest } = compositions[index]
    compositions[index] = {
      ...rest,
      updatedAt: Date.now()
    }
    saveCompositions(compositions)
  }
}

export const togglePinComposition = (compositionId: string): boolean => {
  const compositions = loadCompositions()
  const index = compositions.findIndex(c => c.id === compositionId)
  if (index >= 0) {
    const comp = compositions[index]
    const newPinned = !comp.isPinned
    if (newPinned) {
      compositions[index] = {
        ...comp,
        isPinned: true,
        pinnedAt: Date.now(),
        updatedAt: Date.now()
      }
    } else {
      const { isPinned, pinnedAt, ...rest } = comp
      compositions[index] = {
        ...rest,
        updatedAt: Date.now()
      }
    }
    saveCompositions(compositions)
    return newPinned
  }
  return false
}

export type DraftSource = 'auto' | 'chapter_switch' | 'dialog_close' | 'page_unload'

export interface DraftState {
  chapterId: string
  phrases: CanvasPhrase[]
  editingCompositionId: string | null
  editingOriginalTitle: string | null
  savedAt: number
  source: DraftSource
}

const DEFAULT_DRAFT: DraftState = {
  chapterId: '',
  phrases: [],
  editingCompositionId: null,
  editingOriginalTitle: null,
  savedAt: 0,
  source: 'auto'
}

export const saveDraft = (draft: DraftState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft))
  } catch (e) {
    console.error('Failed to save draft:', e)
  }
}

export const loadDraft = (): DraftState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT)
    if (!data) return null
    const parsed = JSON.parse(data)
    return { ...DEFAULT_DRAFT, ...parsed }
  } catch (e) {
    console.error('Failed to load draft:', e)
    return null
  }
}

export const clearDraft = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DRAFT)
}

export const hasDraft = (): boolean => {
  const draft = loadDraft()
  return draft !== null && draft.phrases.length > 0
}

export const createDraftFromState = (
  chapterId: string,
  phrases: CanvasPhrase[],
  editingCompositionId: string | null,
  editingOriginalTitle: string | null,
  source: DraftSource
): DraftState => {
  return {
    chapterId,
    phrases: phrases.map(p => ({
      ...p,
      position: p.position ? { ...p.position } : null,
      dragOffset: { ...p.dragOffset }
    })),
    editingCompositionId,
    editingOriginalTitle,
    savedAt: Date.now(),
    source
  }
}

const DEFAULT_THEME_STATE: ThemeState = {
  currentThemeId: DEFAULT_THEME_ID,
  customThemes: []
}

export const saveThemeState = (state: ThemeState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_STATE, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save theme state:', e)
  }
}

export const loadThemeState = (): ThemeState => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THEME_STATE)
    return data ? { ...DEFAULT_THEME_STATE, ...JSON.parse(data) } : { ...DEFAULT_THEME_STATE }
  } catch (e) {
    console.error('Failed to load theme state:', e)
    return { ...DEFAULT_THEME_STATE }
  }
}

export const setCurrentTheme = (themeId: string): void => {
  const state = loadThemeState()
  state.currentThemeId = themeId
  saveThemeState(state)
}

export const getCurrentThemeId = (): string => {
  return loadThemeState().currentThemeId
}

export const saveCustomTheme = (theme: Theme): void => {
  const state = loadThemeState()
  const existingIndex = state.customThemes.findIndex(t => t.id === theme.id)
  if (existingIndex >= 0) {
    state.customThemes[existingIndex] = theme
  } else {
    state.customThemes.push(theme)
  }
  saveThemeState(state)
}

export const deleteCustomTheme = (themeId: string): void => {
  const state = loadThemeState()
  state.customThemes = state.customThemes.filter(t => t.id !== themeId)
  if (state.currentThemeId === themeId) {
    state.currentThemeId = DEFAULT_THEME_ID
  }
  saveThemeState(state)
}

export const getCustomThemes = (): Theme[] => {
  return loadThemeState().customThemes
}
