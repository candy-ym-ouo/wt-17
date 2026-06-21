import type { CanvasState, CanvasPhrase, HistorySnapshot, SnapshotStorage } from '@/types'
import {
  migrateData,
  unwrapVersionedData,
  wrapWithVersion,
  needsMigration,
  type VersionedData,
} from '@/utils/migration'

const SNAPSHOT_KEY = 'poem_slices_snapshots'
const MAX_HISTORY = 50
const MAX_SNAPSHOTS = 20

const deepClonePhrases = (phrases: CanvasPhrase[]): CanvasPhrase[] => {
  return phrases.map(p => ({
    ...p,
    position: p.position ? { ...p.position } : null,
    dragOffset: { ...p.dragOffset }
  }))
}

export const createCanvasState = (chapterId: string, phrases: CanvasPhrase[]): CanvasState => {
  return {
    chapterId,
    phrases: deepClonePhrases(phrases),
    timestamp: Date.now()
  }
}

export const areStatesEqual = (a: CanvasState, b: CanvasState): boolean => {
  if (a.chapterId !== b.chapterId) return false
  if (a.phrases.length !== b.phrases.length) return false
  for (let i = 0; i < a.phrases.length; i++) {
    const pa = a.phrases[i]
    const pb = b.phrases[i]
    if (pa.id !== pb.id) return false
    if (pa.text !== pb.text) return false
    if (pa.category !== pb.category) return false
    if (pa.rotation !== pb.rotation) return false
    if (pa.weight !== pb.weight) return false
    if (pa.isPlaced !== pb.isPlaced) return false
    if (!pa.position && !pb.position) continue
    if (!pa.position || !pb.position) return false
    if (Math.abs(pa.position.x - pb.position.x) > 0.5) return false
    if (Math.abs(pa.position.y - pb.position.y) > 0.5) return false
  }
  return true
}

export interface HistoryManager {
  past: CanvasState[]
  future: CanvasState[]
  maxHistory: number
  push: (state: CanvasState) => void
  undo: () => CanvasState | null
  redo: () => CanvasState | null
  canUndo: () => boolean
  canRedo: () => boolean
  reset: () => void
}

export const createHistoryManager = (maxHistory: number = MAX_HISTORY): HistoryManager => {
  const state: { past: CanvasState[]; future: CanvasState[] } = {
    past: [],
    future: []
  }

  const push = (newState: CanvasState) => {
    if (state.past.length > 0) {
      const last = state.past[state.past.length - 1]
      if (areStatesEqual(last, newState)) return
    }
    state.past.push(newState)
    if (state.past.length > maxHistory) {
      state.past.shift()
    }
    state.future = []
  }

  const undo = (): CanvasState | null => {
    if (state.past.length === 0) return null
    const current = state.past.pop()!
    state.future.push(current)
    return state.past.length > 0 ? state.past[state.past.length - 1] : null
  }

  const redo = (): CanvasState | null => {
    if (state.future.length === 0) return null
    const next = state.future.pop()!
    state.past.push(next)
    return next
  }

  const canUndo = (): boolean => state.past.length > 1
  const canRedo = (): boolean => state.future.length > 0
  const reset = () => {
    state.past = []
    state.future = []
  }

  return {
    get past() { return state.past },
    get future() { return state.future },
    maxHistory,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  }
}

const defaultSnapshotStorage: SnapshotStorage = {
  snapshots: [],
  currentSnapshotId: null
}

export const loadSnapshots = (): SnapshotStorage => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return { ...defaultSnapshotStorage }
    
    let data = JSON.parse(raw)
    
    if (needsMigration(data)) {
      const migrated = migrateData<SnapshotStorage>('snapshots', data)
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(migrated))
      if (migrated._migrationLog && migrated._migrationLog.length > 0) {
        console.info('[Migration] snapshots migrated:', migrated._migrationLog)
      }
      return { ...defaultSnapshotStorage, ...migrated.data }
    }
    
    return { ...defaultSnapshotStorage, ...unwrapVersionedData(data) }
  } catch (e) {
    console.error('Failed to load snapshots:', e)
    return { ...defaultSnapshotStorage }
  }
}

export const saveSnapshots = (storage: SnapshotStorage): void => {
  try {
    const versioned = wrapWithVersion(storage)
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save snapshots:', e)
  }
}

export const createSnapshot = (
  chapterId: string,
  phrases: CanvasPhrase[],
  name?: string
): HistorySnapshot => {
  const now = Date.now()
  return {
    id: `snap_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || `快照 ${new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
    chapterId,
    phrases: deepClonePhrases(phrases),
    createdAt: now
  }
}

export const addSnapshot = (snapshot: HistorySnapshot): SnapshotStorage => {
  const storage = loadSnapshots()
  storage.snapshots.unshift(snapshot)
  if (storage.snapshots.length > MAX_SNAPSHOTS) {
    storage.snapshots = storage.snapshots.slice(0, MAX_SNAPSHOTS)
  }
  storage.currentSnapshotId = snapshot.id
  saveSnapshots(storage)
  return storage
}

export const deleteSnapshot = (snapshotId: string): SnapshotStorage => {
  const storage = loadSnapshots()
  storage.snapshots = storage.snapshots.filter(s => s.id !== snapshotId)
  if (storage.currentSnapshotId === snapshotId) {
    storage.currentSnapshotId = null
  }
  saveSnapshots(storage)
  return storage
}

export const getSnapshot = (snapshotId: string): HistorySnapshot | null => {
  const storage = loadSnapshots()
  return storage.snapshots.find(s => s.id === snapshotId) || null
}

export const setCurrentSnapshot = (snapshotId: string | null): SnapshotStorage => {
  const storage = loadSnapshots()
  storage.currentSnapshotId = snapshotId
  saveSnapshots(storage)
  return storage
}

export const renameSnapshot = (snapshotId: string, newName: string): SnapshotStorage => {
  const storage = loadSnapshots()
  const snap = storage.snapshots.find(s => s.id === snapshotId)
  if (snap) {
    snap.name = newName
    saveSnapshots(storage)
  }
  return storage
}

export const clearSnapshots = (): void => {
  localStorage.removeItem(SNAPSHOT_KEY)
}
