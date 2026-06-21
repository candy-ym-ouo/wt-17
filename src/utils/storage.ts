import type { Composition, GameState, QuestState, Phrase } from '@/types'

const STORAGE_KEYS = {
  COMPOSITIONS: 'poem_slices_compositions',
  GAME_STATE: 'poem_slices_game_state',
  QUEST_STATE: 'poem_slices_quest_state',
}

const DEFAULT_QUEST_STATE: QuestState = {
  unlockedQuests: [],
  completedQuests: [],
  claimedRewards: [],
  earnedTitles: [],
  activeWeightBoosts: {},
  chapterRewardPhrases: {}
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
