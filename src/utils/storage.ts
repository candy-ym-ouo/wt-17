import type { Composition, GameState } from '@/types'

const STORAGE_KEYS = {
  COMPOSITIONS: 'poem_slices_compositions',
  GAME_STATE: 'poem_slices_game_state',
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
}
