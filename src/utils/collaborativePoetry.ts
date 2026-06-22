import type { CollaborativePoem, CollaborativeState, Participant, Turn, TurnScore, CollaborativeStatus, CollaborativeUser } from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'

const STORAGE_KEY = 'poem_slices_collaborative'

const DEFAULT_USER_ID = 'local_user_001'
const DEFAULT_USER_NAME = '我'

const ACCENT_COLORS = ['#c9a86c', '#7ca97c', '#7a9ea8', '#9b59b6', '#c56b6b', '#5b7a8c']
const ICONS = ['📜', '🖋️', '🎋', '🏮', '🌙', '🌸', '⛰️', '🍃']
const DEFAULT_AVATARS = ['👤', '🧑', '👩', '🧔', '👨‍🎨', '👩‍🎨', '🧙', '👸', '🤴', '🧝']

const DEFAULT_USERS: CollaborativeUser[] = [
  { id: 'local_user_001', name: '我', avatar: '👤', createdAt: Date.now() },
  { id: 'local_user_002', name: '李白', avatar: '🍶', createdAt: Date.now() },
  { id: 'local_user_003', name: '杜甫', avatar: '📖', createdAt: Date.now() },
  { id: 'local_user_004', name: '苏轼', avatar: '🖌️', createdAt: Date.now() },
  { id: 'local_user_005', name: '李清照', avatar: '🌸', createdAt: Date.now() }
]

export const DEFAULT_COLLABORATIVE_STATE: CollaborativeState = {
  activePoemId: null,
  poems: [],
  archivedPoemIds: [],
  currentUserId: DEFAULT_USER_ID,
  currentUserName: DEFAULT_USER_NAME,
  users: DEFAULT_USERS
}

export const getCurrentUser = (): { id: string; name: string } => {
  const state = loadCollaborativeState()
  return {
    id: state.currentUserId,
    name: state.currentUserName
  }
}

export const setCurrentUserName = (name: string): void => {
  const state = loadCollaborativeState()
  state.currentUserName = name
  saveCollaborativeState(state)
}

export const saveCollaborativeState = (state: CollaborativeState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save collaborative state:', e)
  }
}

export const loadCollaborativeState = (): CollaborativeState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COLLABORATIVE_STATE, users: [...DEFAULT_USERS] }

    let data = JSON.parse(raw)

    if (needsMigration(data)) {
      const migrated = migrateData<CollaborativeState>('collaborative', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      const result = migrated.data
      if (!result.users || result.users.length === 0) {
        result.users = [...DEFAULT_USERS]
      }
      return result
    }

    const loaded = unwrapVersionedData(data)
    const result = { ...DEFAULT_COLLABORATIVE_STATE, ...loaded }
    if (!result.users || result.users.length === 0) {
      result.users = [...DEFAULT_USERS]
    }
    return result
  } catch (e) {
    console.error('Failed to load collaborative state:', e)
    return { ...DEFAULT_COLLABORATIVE_STATE, users: [...DEFAULT_USERS] }
  }
}

export const getAllUsers = (): CollaborativeUser[] => {
  const state = loadCollaborativeState()
  return state.users
}

export const getCurrentUserFull = (): CollaborativeUser | null => {
  const state = loadCollaborativeState()
  return state.users.find(u => u.id === state.currentUserId) || state.users[0] || null
}

export const switchUser = (userId: string): boolean => {
  const state = loadCollaborativeState()
  const user = state.users.find(u => u.id === userId)
  if (!user) return false

  state.currentUserId = user.id
  state.currentUserName = user.name
  saveCollaborativeState(state)
  return true
}

export const addUser = (name: string, avatar?: string): CollaborativeUser | null => {
  if (!name.trim()) return null
  const state = loadCollaborativeState()
  const now = Date.now()
  const newUser: CollaborativeUser = {
    id: `user_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    avatar: avatar || DEFAULT_AVATARS[state.users.length % DEFAULT_AVATARS.length],
    createdAt: now
  }
  state.users.push(newUser)
  saveCollaborativeState(state)
  return newUser
}

export const removeUser = (userId: string): boolean => {
  const state = loadCollaborativeState()
  if (state.users.length <= 1) return false
  const index = state.users.findIndex(u => u.id === userId)
  if (index === -1) return false

  state.users.splice(index, 1)

  if (state.currentUserId === userId) {
    const remaining = state.users[0]
    if (remaining) {
      state.currentUserId = remaining.id
      state.currentUserName = remaining.name
    }
  }

  saveCollaborativeState(state)
  return true
}

export const renameUser = (userId: string, newName: string): boolean => {
  if (!newName.trim()) return false
  const state = loadCollaborativeState()
  const user = state.users.find(u => u.id === userId)
  if (!user) return false
  user.name = newName.trim()
  if (state.currentUserId === userId) {
    state.currentUserName = user.name
  }
  saveCollaborativeState(state)
  return true
}

export const createCollaborativePoem = (
  title: string,
  theme: string,
  description: string,
  totalTurns: number,
  options?: {
    requiredKeywords?: string[]
    forbiddenWords?: string[]
    turnTimeLimitSeconds?: number
  }
): CollaborativePoem => {
  const user = getCurrentUser()
  const now = Date.now()
  const colorIndex = Math.floor(Math.random() * ACCENT_COLORS.length)
  const iconIndex = Math.floor(Math.random() * ICONS.length)

  const creator: Participant = {
    id: user.id,
    name: user.name,
    joinedAt: now
  }

  const poem: CollaborativePoem = {
    id: `collab_${now}`,
    title,
    theme,
    description,
    totalTurns: Math.max(2, Math.min(20, totalTurns)),
    currentTurnNumber: 0,
    status: 'draft',
    creatorId: user.id,
    creatorName: user.name,
    createdAt: now,
    updatedAt: now,
    participants: [creator],
    turns: [],
    turnScores: [],
    requiredKeywords: options?.requiredKeywords || [],
    forbiddenWords: options?.forbiddenWords || [],
    turnTimeLimitSeconds: options?.turnTimeLimitSeconds,
    accentColor: ACCENT_COLORS[colorIndex],
    icon: ICONS[iconIndex]
  }

  const state = loadCollaborativeState()
  state.poems.push(poem)
  state.activePoemId = poem.id
  saveCollaborativeState(state)

  return poem
}

export const getPoemById = (poemId: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  return state.poems.find(p => p.id === poemId) || null
}

export const getAllPoems = (): CollaborativePoem[] => {
  const state = loadCollaborativeState()
  return state.poems
}

export const getActivePoems = (): CollaborativePoem[] => {
  return getAllPoems().filter(p => p.status !== 'archived')
}

export const getArchivedPoems = (): CollaborativePoem[] => {
  const state = loadCollaborativeState()
  return getAllPoems().filter(p => state.archivedPoemIds.includes(p.id))
}

export const startPoem = (poemId: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  if (poem.status === 'draft') {
    poem.status = 'in_progress'
    poem.currentTurnNumber = 1
    poem.updatedAt = Date.now()
    saveCollaborativeState(state)
  }

  return poem
}

export const joinPoem = (poemId: string, participantName?: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  const user = getCurrentUser()
  const existing = poem.participants.find(p => p.id === user.id)
  if (!existing) {
    const newParticipant: Participant = {
      id: user.id,
      name: participantName || user.name,
      joinedAt: Date.now()
    }
    poem.participants.push(newParticipant)
    poem.updatedAt = Date.now()
    saveCollaborativeState(state)
  }

  return poem
}

export const lockTurn = (poemId: string, turnNumber: number): Turn | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  const user = getCurrentUser()
  const now = Date.now()

  let turn = poem.turns.find(t => t.turnNumber === turnNumber)
  if (!turn) {
    if (turnNumber !== poem.currentTurnNumber) return null

    turn = {
      id: `turn_${poemId}_${turnNumber}_${now}`,
      poemId,
      turnNumber,
      participantId: user.id,
      participantName: user.name,
      content: '',
      submittedAt: 0,
      isLocked: true,
      lockedBy: user.id,
      lockedAt: now
    }
    poem.turns.push(turn)
  } else {
    if (turn.isLocked && turn.lockedBy !== user.id) {
      return null
    }
    turn.isLocked = true
    turn.lockedBy = user.id
    turn.lockedAt = now
  }

  poem.updatedAt = now
  saveCollaborativeState(state)
  return turn
}

export const unlockTurn = (poemId: string, turnNumber: number): boolean => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return false

  const user = getCurrentUser()
  const turn = poem.turns.find(t => t.turnNumber === turnNumber)
  if (!turn) return false

  if (turn.lockedBy !== user.id && turn.participantId !== user.id) {
    return false
  }

  turn.isLocked = false
  turn.lockedBy = undefined
  turn.lockedAt = undefined
  poem.updatedAt = Date.now()
  saveCollaborativeState(state)
  return true
}

export const submitTurn = (poemId: string, turnNumber: number, content: string, comment?: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  if (poem.status !== 'in_progress') return null
  if (turnNumber !== poem.currentTurnNumber) return null

  const user = getCurrentUser()
  const now = Date.now()

  let turn = poem.turns.find(t => t.turnNumber === turnNumber)
  if (!turn) {
    turn = {
      id: `turn_${poemId}_${turnNumber}_${now}`,
      poemId,
      turnNumber,
      participantId: user.id,
      participantName: user.name,
      content,
      submittedAt: now,
      isLocked: false,
      comment
    }
    poem.turns.push(turn)
  } else {
    turn.content = content
    turn.submittedAt = now
    turn.isLocked = false
    turn.lockedBy = undefined
    turn.lockedAt = undefined
    turn.comment = comment
  }

  if (poem.currentTurnNumber >= poem.totalTurns) {
    poem.status = 'scoring'
  } else {
    poem.currentTurnNumber += 1
  }

  poem.updatedAt = now
  saveCollaborativeState(state)
  return poem
}

export const getTurnLockStatus = (poemId: string, turnNumber: number): { isLocked: boolean; lockedBy?: string; canEdit: boolean } => {
  const poem = getPoemById(poemId)
  if (!poem) return { isLocked: false, canEdit: false }

  const user = getCurrentUser()
  const turn = poem.turns.find(t => t.turnNumber === turnNumber)

  if (!turn) {
    return { isLocked: false, canEdit: poem.status === 'in_progress' && turnNumber === poem.currentTurnNumber }
  }

  const canEdit = !turn.isLocked || turn.lockedBy === user.id || turn.participantId === user.id
  return {
    isLocked: turn.isLocked,
    lockedBy: turn.lockedBy,
    canEdit
  }
}

export const submitTurnScore = (
  poemId: string,
  turnId: string,
  scores: { coherence: number; imagery: number; rhythm: number; themeMatch: number },
  comment: string
): TurnScore | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  const user = getCurrentUser()
  const turn = poem.turns.find(t => t.id === turnId)
  if (!turn) return null

  const existing = poem.turnScores.find(s => s.turnId === turnId && s.scorerId === user.id)

  const scoreData: TurnScore = {
    turnId,
    scorerId: user.id,
    scorerName: user.name,
    coherence: Math.max(0, Math.min(100, scores.coherence)),
    imagery: Math.max(0, Math.min(100, scores.imagery)),
    rhythm: Math.max(0, Math.min(100, scores.rhythm)),
    themeMatch: Math.max(0, Math.min(100, scores.themeMatch)),
    comment,
    scoredAt: Date.now()
  }

  if (existing) {
    Object.assign(existing, scoreData)
  } else {
    poem.turnScores.push(scoreData)
  }

  poem.updatedAt = Date.now()
  saveCollaborativeState(state)
  return scoreData
}

export const getTurnAverageScore = (poem: CollaborativePoem, turnId: string): number => {
  const scores = poem.turnScores.filter(s => s.turnId === turnId)
  if (scores.length === 0) return 0

  const total = scores.reduce((sum, s) => {
    return sum + (s.coherence + s.imagery + s.rhythm + s.themeMatch) / 4
  }, 0)

  return Math.round(total / scores.length)
}

export const getPoemTotalScore = (poem: CollaborativePoem): number => {
  if (poem.turns.length === 0) return 0

  const scores = poem.turns.map(t => getTurnAverageScore(poem, t.id)).filter(s => s > 0)
  if (scores.length === 0) return 0

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export const completePoem = (poemId: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  poem.status = 'completed'
  poem.completedAt = Date.now()
  poem.updatedAt = poem.completedAt
  saveCollaborativeState(state)
  return poem
}

export const archivePoem = (poemId: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  poem.status = 'archived'
  poem.archivedAt = Date.now()
  poem.updatedAt = poem.archivedAt

  if (!state.archivedPoemIds.includes(poemId)) {
    state.archivedPoemIds.push(poemId)
  }

  saveCollaborativeState(state)
  return poem
}

export const unarchivePoem = (poemId: string): CollaborativePoem | null => {
  const state = loadCollaborativeState()
  const poem = state.poems.find(p => p.id === poemId)
  if (!poem) return null

  poem.status = 'completed'
  poem.archivedAt = undefined
  poem.updatedAt = Date.now()

  state.archivedPoemIds = state.archivedPoemIds.filter(id => id !== poemId)
  saveCollaborativeState(state)
  return poem
}

export const deletePoem = (poemId: string): boolean => {
  const state = loadCollaborativeState()
  const poemIndex = state.poems.findIndex(p => p.id === poemId)
  if (poemIndex === -1) return false

  state.poems.splice(poemIndex, 1)
  state.archivedPoemIds = state.archivedPoemIds.filter(id => id !== poemId)
  if (state.activePoemId === poemId) {
    state.activePoemId = null
  }
  saveCollaborativeState(state)
  return true
}

export const setActivePoem = (poemId: string | null): void => {
  const state = loadCollaborativeState()
  state.activePoemId = poemId
  saveCollaborativeState(state)
}

export const getFullPoemText = (poem: CollaborativePoem): string => {
  return poem.turns
    .filter(t => t.content && t.content.trim())
    .sort((a, b) => a.turnNumber - b.turnNumber)
    .map(t => t.content.trim())
    .join('\n')
}

export const getPoemProgress = (poem: CollaborativePoem): { current: number; total: number; percentage: number } => {
  const submitted = poem.turns.filter(t => t.submittedAt > 0).length
  return {
    current: submitted,
    total: poem.totalTurns,
    percentage: Math.round((submitted / poem.totalTurns) * 100)
  }
}

export const getNextSuggestedParticipant = (poem: CollaborativePoem): Participant | null => {
  if (poem.status !== 'in_progress') return null
  if (poem.participants.length === 0) return null

  const submittedTurns = poem.turns.filter(t => t.submittedAt > 0)
  if (submittedTurns.length === 0) {
    return poem.participants[0]
  }

  const turnCountMap: Record<string, number> = {}
  poem.participants.forEach(p => { turnCountMap[p.id] = 0 })
  submittedTurns.forEach(t => {
    if (turnCountMap[t.participantId] !== undefined) {
      turnCountMap[t.participantId]++
    }
  })

  let minCount = Infinity
  let candidate: Participant | null = null
  for (const p of poem.participants) {
    if (turnCountMap[p.id] < minCount) {
      minCount = turnCountMap[p.id]
      candidate = p
    }
  }
  return candidate
}
