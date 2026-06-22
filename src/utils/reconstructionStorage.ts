import type { ReconstructionState, ReconstructionResult } from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'

const STORAGE_KEYS = {
  RECONSTRUCTION_STATE: 'poem_slices_reconstruction_state',
  RECONSTRUCTION_RESULTS: 'poem_slices_reconstruction_results'
}

export const DEFAULT_RECONSTRUCTION_STATE: ReconstructionState = {
  clearedPoemIds: [],
  bestScores: {},
  bestTimes: {},
  totalReconstructions: 0,
  totalCleared: 0,
  earnedTitles: [],
  unlockedPoemIds: ['cp001', 'cp002', 'cp003', 'cp008']
}

export const saveReconstructionState = (state: ReconstructionState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEYS.RECONSTRUCTION_STATE, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save reconstruction state:', e)
  }
}

export const loadReconstructionState = (): ReconstructionState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECONSTRUCTION_STATE)
    if (!raw) return { ...DEFAULT_RECONSTRUCTION_STATE }
    
    let data = JSON.parse(raw)
    
    if (needsMigration(data)) {
      const migrated = migrateData<ReconstructionState>('reconstructionState', data)
      localStorage.setItem(STORAGE_KEYS.RECONSTRUCTION_STATE, JSON.stringify(migrated))
      return { ...DEFAULT_RECONSTRUCTION_STATE, ...migrated.data }
    }
    
    const loaded = unwrapVersionedData(data)
    return { ...DEFAULT_RECONSTRUCTION_STATE, ...loaded }
  } catch (e) {
    console.error('Failed to load reconstruction state:', e)
    return { ...DEFAULT_RECONSTRUCTION_STATE }
  }
}

export const saveReconstructionResult = (result: ReconstructionResult): ReconstructionState => {
  const state = loadReconstructionState()
  
  const currentBest = state.bestScores[result.poemId] || 0
  if (result.score.total > currentBest) {
    state.bestScores[result.poemId] = result.score.total
  }
  
  const currentBestTime = state.bestTimes[result.poemId] || Infinity
  if (result.timeUsedSeconds < currentBestTime) {
    state.bestTimes[result.poemId] = result.timeUsedSeconds
  }
  
  state.totalReconstructions++
  
  if (result.score.total >= 60 && !state.clearedPoemIds.includes(result.poemId)) {
    state.clearedPoemIds.push(result.poemId)
    state.totalCleared++
  }
  
  result.bonusTitles.forEach(title => {
    if (!state.earnedTitles.includes(title)) {
      state.earnedTitles.push(title)
    }
  })
  
  state.unlockedPoemIds = unlockNextPoems(state)
  
  saveReconstructionState(state)
  saveReconstructionResultRecord(result)
  
  return state
}

const unlockNextPoems = (state: ReconstructionState): string[] => {
  const unlocked = new Set(state.unlockedPoemIds)
  
  if (state.totalCleared >= 1) {
    unlocked.add('cp004')
    unlocked.add('cp005')
    unlocked.add('cp009')
    unlocked.add('cp012')
  }
  
  if (state.totalCleared >= 3) {
    unlocked.add('cp006')
    unlocked.add('cp010')
  }
  
  if (state.totalCleared >= 5) {
    unlocked.add('cp007')
    unlocked.add('cp011')
  }
  
  return Array.from(unlocked)
}

export const isPoemUnlocked = (poemId: string): boolean => {
  const state = loadReconstructionState()
  return state.unlockedPoemIds.includes(poemId)
}

export const saveReconstructionResultRecord = (result: ReconstructionResult): void => {
  try {
    const all = loadAllReconstructionResults()
    all.push(result)
    const versioned = wrapWithVersion(all)
    localStorage.setItem(STORAGE_KEYS.RECONSTRUCTION_RESULTS, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save reconstruction result:', e)
  }
}

export const loadAllReconstructionResults = (): ReconstructionResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECONSTRUCTION_RESULTS)
    if (!raw) return []
    
    let data = JSON.parse(raw)
    
    if (needsMigration(data)) {
      const migrated = migrateData<ReconstructionResult[]>('reconstructionResults', data)
      localStorage.setItem(STORAGE_KEYS.RECONSTRUCTION_RESULTS, JSON.stringify(migrated))
      return migrated.data || []
    }
    
    return unwrapVersionedData(data) || []
  } catch (e) {
    console.error('Failed to load reconstruction results:', e)
    return []
  }
}

export const getReconstructionResultsByPoem = (poemId: string): ReconstructionResult[] => {
  return loadAllReconstructionResults().filter(r => r.poemId === poemId)
}

export const getBestReconstructionResult = (poemId: string): ReconstructionResult | null => {
  const results = getReconstructionResultsByPoem(poemId)
  if (results.length === 0) return null
  return results.reduce((best, current) => 
    current.score.total > best.score.total ? current : best
  )
}

export const getReconstructionProgress = () => {
  const state = loadReconstructionState()
  return {
    totalReconstructions: state.totalReconstructions,
    totalCleared: state.totalCleared,
    earnedTitles: state.earnedTitles,
    bestScores: state.bestScores
  }
}
