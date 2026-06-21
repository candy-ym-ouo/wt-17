import type {
  Annotation,
  AnnotationReply,
  AnnotationType,
  CompositionVersion,
  MentorReviewSession,
  Phrase,
  ReviewState,
  ReviewStatus,
  ScoreBreakdown,
  VersionComparison
} from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'

const STORAGE_KEY = 'poem_slices_mentor_reviews'

const DEFAULT_STATE: ReviewState = {
  annotations: [],
  versions: [],
  sessions: []
}

export const saveReviewState = (state: ReviewState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save review state:', e)
  }
}

export const loadReviewState = (): ReviewState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }

    let data = JSON.parse(raw)

    if (needsMigration(data)) {
      const migrated = migrateData<ReviewState>('reviewState', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      if (migrated._migrationLog && migrated._migrationLog.length > 0) {
        console.info('[Migration] reviewState migrated:', migrated._migrationLog)
      }
      return { ...DEFAULT_STATE, ...migrated.data }
    }

    return { ...DEFAULT_STATE, ...unwrapVersionedData(data) }
  } catch (e) {
    console.error('Failed to load review state:', e)
    return { ...DEFAULT_STATE }
  }
}

export const saveAnnotation = (annotation: Annotation): ReviewState => {
  const state = loadReviewState()
  const index = state.annotations.findIndex(a => a.id === annotation.id)
  if (index >= 0) {
    state.annotations[index] = { ...annotation, updatedAt: Date.now() }
  } else {
    state.annotations.push(annotation)
  }
  saveReviewState(state)
  return state
}

export const deleteAnnotation = (annotationId: string): ReviewState => {
  const state = loadReviewState()
  state.annotations = state.annotations.filter(a => a.id !== annotationId)
  saveReviewState(state)
  return state
}

export const getAnnotationsByComposition = (compositionId: string): Annotation[] => {
  const state = loadReviewState()
  return state.annotations
    .filter(a => a.compositionId === compositionId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export const getAnnotationsByPhrase = (compositionId: string, phraseId: string): Annotation[] => {
  const state = loadReviewState()
  return state.annotations
    .filter(a => a.compositionId === compositionId && a.phraseId === phraseId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export const resolveAnnotation = (annotationId: string): ReviewState => {
  const state = loadReviewState()
  const annotation = state.annotations.find(a => a.id === annotationId)
  if (annotation) {
    annotation.isResolved = true
    annotation.resolvedAt = Date.now()
    annotation.updatedAt = Date.now()
    saveReviewState(state)
  }
  return state
}

export const addAnnotationReply = (
  annotationId: string,
  content: string,
  authorName: string = '我',
  authorRole: 'mentor' | 'friend' | 'self' = 'self'
): ReviewState => {
  const state = loadReviewState()
  const annotation = state.annotations.find(a => a.id === annotationId)
  if (annotation) {
    const reply: AnnotationReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content,
      authorId: 'self',
      authorName,
      authorRole,
      createdAt: Date.now()
    }
    annotation.replies.push(reply)
    annotation.updatedAt = Date.now()
    saveReviewState(state)
  }
  return state
}

export const createAnnotation = (
  compositionId: string,
  phraseId: string | null,
  type: AnnotationType,
  content: string,
  authorName: string = '我',
  authorRole: 'mentor' | 'friend' | 'self' = 'self'
): Annotation => {
  return {
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    compositionId,
    phraseId,
    type,
    content,
    authorId: authorRole === 'self' ? 'self' : `user_${Math.random().toString(36).slice(2, 7)}`,
    authorName,
    authorRole,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isResolved: false,
    replies: []
  }
}

export const saveVersion = (version: CompositionVersion): ReviewState => {
  const state = loadReviewState()
  const index = state.versions.findIndex(v => v.id === version.id)
  if (index >= 0) {
    state.versions[index] = version
  } else {
    state.versions.push(version)
  }
  saveReviewState(state)
  return state
}

export const deleteVersion = (versionId: string): ReviewState => {
  const state = loadReviewState()
  state.versions = state.versions.filter(v => v.id !== versionId)
  saveReviewState(state)
  return state
}

export const getVersionsByComposition = (compositionId: string): CompositionVersion[] => {
  const state = loadReviewState()
  return state.versions
    .filter(v => v.compositionId === compositionId)
    .sort((a, b) => b.versionNumber - a.versionNumber)
}

export const getNextVersionNumber = (compositionId: string): number => {
  const versions = getVersionsByComposition(compositionId)
  return versions.length === 0 ? 1 : versions[0].versionNumber + 1
}

export const createVersion = (
  compositionId: string,
  phrases: Phrase[],
  score: ScoreBreakdown,
  label?: string,
  description: string = '',
  basedOnVersionId: string | null = null,
  changeSummary?: string,
  createdBy: string = 'self'
): CompositionVersion => {
  const versionNumber = getNextVersionNumber(compositionId)
  return {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    compositionId,
    versionNumber,
    label: label || `v${versionNumber}`,
    description,
    phrases: JSON.parse(JSON.stringify(phrases)),
    score: { ...score },
    createdAt: Date.now(),
    createdBy,
    basedOnVersionId,
    changeSummary
  }
}

export const compareVersions = (
  versionA: CompositionVersion,
  versionB: CompositionVersion
): VersionComparison => {
  const phrasesA = new Map(versionA.phrases.map(p => [p.id, p]))
  const phrasesB = new Map(versionB.phrases.map(p => [p.id, p]))

  const added: Phrase[] = []
  const removed: Phrase[] = []
  const modified: { before: Phrase; after: Phrase }[] = []
  const unchanged: Phrase[] = []

  for (const [id, phrase] of phrasesB) {
    if (!phrasesA.has(id)) {
      added.push(phrase)
    }
  }

  for (const [id, phrase] of phrasesA) {
    if (!phrasesB.has(id)) {
      removed.push(phrase)
    }
  }

  for (const [id, phraseA] of phrasesA) {
    const phraseB = phrasesB.get(id)
    if (phraseB) {
      const isModified = phraseA.text !== phraseB.text ||
        phraseA.position?.x !== phraseB.position?.x ||
        phraseA.position?.y !== phraseB.position?.y ||
        phraseA.rotation !== phraseB.rotation
      if (isModified) {
        modified.push({ before: phraseA, after: phraseB })
      } else {
        unchanged.push(phraseA)
      }
    }
  }

  const scoreDifference = {
    coherence: versionB.score.coherence - versionA.score.coherence,
    imagery: versionB.score.imagery - versionA.score.imagery,
    rhythm: versionB.score.rhythm - versionA.score.rhythm,
    themeMatch: versionB.score.themeMatch - versionA.score.themeMatch,
    total: versionB.score.total - versionA.score.total
  }

  return {
    versionAId: versionA.id,
    versionBId: versionB.id,
    versionALabel: versionA.label,
    versionBLabel: versionB.label,
    added,
    removed,
    modified,
    unchanged,
    scoreDifference
  }
}

export const saveSession = (session: MentorReviewSession): ReviewState => {
  const state = loadReviewState()
  const index = state.sessions.findIndex(s => s.id === session.id)
  if (index >= 0) {
    state.sessions[index] = { ...session, updatedAt: Date.now() }
  } else {
    state.sessions.push(session)
  }
  saveReviewState(state)
  return state
}

export const deleteSession = (sessionId: string): ReviewState => {
  const state = loadReviewState()
  state.sessions = state.sessions.filter(s => s.id !== sessionId)
  saveReviewState(state)
  return state
}

export const getSessionsByComposition = (compositionId: string): MentorReviewSession[] => {
  const state = loadReviewState()
  return state.sessions
    .filter(s => s.compositionId === compositionId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export const createSession = (compositionId: string): MentorReviewSession => {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    compositionId,
    status: 'draft',
    mentorId: null,
    mentorName: null,
    invitedFriendIds: [],
    overallComment: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

export const updateSessionStatus = (sessionId: string, status: ReviewStatus): ReviewState => {
  const state = loadReviewState()
  const session = state.sessions.find(s => s.id === sessionId)
  if (session) {
    session.status = status
    session.updatedAt = Date.now()
    if (status === 'reviewed') {
      session.completedAt = Date.now()
    }
    saveReviewState(state)
  }
  return state
}

export const getAnnotationCountByComposition = (compositionId: string): { total: number; resolved: number } => {
  const annotations = getAnnotationsByComposition(compositionId)
  return {
    total: annotations.length,
    resolved: annotations.filter(a => a.isResolved).length
  }
}
