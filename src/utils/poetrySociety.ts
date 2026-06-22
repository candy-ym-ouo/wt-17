import type { PoetrySocietyState, SocietySubmission, SubmissionStatus, ReviewVerdict, ExhibitionEntry, ReputationRank, Composition, ExhibitionTheme } from '@/types'
import { REPUTATION_RANK_ORDER, REPUTATION_RANK_MIN } from '@/types'
import { exhibitionThemes, rareChapters, reviewCriteria, reviewerNames, reviewComments, SUBMISSION_REPUTATION_REWARD, getExhibitionThemeById } from '@/data/poetrySociety'
import { wrapWithVersion, unwrapVersionedData, needsMigration } from '@/utils/migration'

const STORAGE_KEY = 'poem_slices_poetry_society'

export const DEFAULT_SOCIETY_STATE: PoetrySocietyState = {
  reputation: 0,
  currentRank: '童生',
  submissions: [],
  exhibitions: [],
  unlockedRareChapterIds: [],
  totalSubmissions: 0,
  totalAccepted: 0,
  totalShowcased: 0,
  totalExhibitions: 0,
  claimedMilestoneRewards: [],
  featuredCompositionId: null
}

export const loadSocietyState = (): PoetrySocietyState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SOCIETY_STATE }
    const data = JSON.parse(raw)
    if (needsMigration(data)) {
      return { ...DEFAULT_SOCIETY_STATE }
    }
    const unwrapped = unwrapVersionedData(data)
    return { ...DEFAULT_SOCIETY_STATE, ...unwrapped }
  } catch {
    return { ...DEFAULT_SOCIETY_STATE }
  }
}

export const saveSocietyState = (state: PoetrySocietyState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save society state:', e)
  }
}

export const determineRank = (reputation: number): ReputationRank => {
  let rank: ReputationRank = '童生'
  for (const r of REPUTATION_RANK_ORDER) {
    if (reputation >= REPUTATION_RANK_MIN[r]) {
      rank = r
    }
  }
  return rank
}

export const submitToSociety = (compositionId: string): SocietySubmission => {
  const state = loadSocietyState()
  const submission: SocietySubmission = {
    id: `sub_${Date.now()}`,
    compositionId,
    submittedAt: Date.now(),
    status: 'pending',
    reputationGained: 0
  }
  state.submissions.unshift(submission)
  state.totalSubmissions++
  saveSocietyState(state)
  return submission
}

const verdictToStatus = (verdict: ReviewVerdict): SubmissionStatus => {
  if (verdict === 'showcase') return 'showcased'
  if (verdict === 'accept') return 'accepted'
  return 'rejected'
}

export const reviewSubmission = (
  submissionId: string,
  composition: Composition
): SocietySubmission | null => {
  const state = loadSocietyState()
  const idx = state.submissions.findIndex((s: SocietySubmission) => s.id === submissionId)
  if (idx < 0) return null
  const submission = state.submissions[idx]
  if (submission.status !== 'pending') return null

  const totalScore = composition.score.total
  let verdict: ReviewVerdict
  if (totalScore >= 90) {
    verdict = 'showcase'
  } else if (totalScore >= 60) {
    verdict = 'accept'
  } else {
    verdict = 'reject'
  }

  const reviewerName = reviewerNames[Math.floor(Math.random() * reviewerNames.length)]
  const comments = reviewComments[verdict]
  const comment = comments[Math.floor(Math.random() * comments.length)]

  const statusKey: SubmissionStatus = verdictToStatus(verdict)
  const reputationGained = SUBMISSION_REPUTATION_REWARD[statusKey] || 0

  submission.reviewVerdict = verdict
  submission.status = statusKey
  submission.reviewedAt = Date.now()
  submission.reviewerName = reviewerName
  submission.reviewComment = comment
  submission.reputationGained = reputationGained

  state.reputation += reputationGained
  state.currentRank = determineRank(state.reputation)

  if (verdict === 'accept') state.totalAccepted++
  if (verdict === 'showcase') {
    state.totalShowcased++
    const bestTheme = findBestExhibitionTheme(composition)
    if (bestTheme) {
      submission.exhibitionThemeId = bestTheme.id
    }
  }

  saveSocietyState(state)
  return submission
}

const findBestExhibitionTheme = (composition: Composition): ExhibitionTheme | null => {
  const state = loadSocietyState()
  const availableThemes = exhibitionThemes.filter((t: ExhibitionTheme) => {
    if (composition.score.total < t.minScore) return false
    const currentEntries = state.exhibitions.filter((e: ExhibitionEntry) => e.themeId === t.id)
    if (currentEntries.length >= t.maxSlots) return false
    return true
  })

  if (availableThemes.length === 0) return null

  let bestTheme = availableThemes[0]
  let bestScore = 0

  for (const theme of availableThemes) {
    let score = 0
    for (const p of composition.phrases) {
      if (theme.requiredKeywords.some((kw: string) => p.text.includes(kw))) score += 3
      if (theme.preferredCategories.includes(p.category)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestTheme = theme
    }
  }

  return bestTheme
}

export const exhibitComposition = (compositionId: string, themeId: string): ExhibitionEntry | null => {
  const state = loadSocietyState()
  const theme = getExhibitionThemeById(themeId)
  if (!theme) return null

  const existingInTheme = state.exhibitions.filter((e: ExhibitionEntry) => e.themeId === themeId)
  if (existingInTheme.length >= theme.maxSlots) return null

  const existingForComp = state.exhibitions.find((e: ExhibitionEntry) => e.compositionId === compositionId && e.themeId === themeId)
  if (existingForComp) return null

  const entry: ExhibitionEntry = {
    id: `exh_${Date.now()}`,
    compositionId,
    themeId,
    exhibitedAt: Date.now(),
    visitorCount: Math.floor(Math.random() * 50) + 10,
    reputationEarned: theme.bonusReputation,
    isFeatured: false
  }

  state.exhibitions.unshift(entry)
  state.totalExhibitions++
  state.reputation += theme.bonusReputation
  state.currentRank = determineRank(state.reputation)
  saveSocietyState(state)
  return entry
}

export const featureExhibition = (entryId: string): void => {
  const state = loadSocietyState()
  const entry = state.exhibitions.find((e: ExhibitionEntry) => e.id === entryId)
  if (!entry) return
  state.exhibitions.forEach((e: ExhibitionEntry) => {
    if (e.themeId === entry.themeId) e.isFeatured = false
  })
  entry.isFeatured = true
  const bonusRep = 20
  entry.reputationEarned += bonusRep
  state.reputation += bonusRep
  state.currentRank = determineRank(state.reputation)
  state.featuredCompositionId = entry.compositionId
  saveSocietyState(state)
}

export const checkRareChapterUnlocks = (): string[] => {
  const state = loadSocietyState()
  const newlyUnlocked: string[] = []

  for (const chapter of rareChapters) {
    if (state.unlockedRareChapterIds.includes(chapter.id)) continue
    const rankIndex = REPUTATION_RANK_ORDER.indexOf(state.currentRank)
    const requiredIndex = REPUTATION_RANK_ORDER.indexOf(chapter.requiredRank)
    if (rankIndex >= requiredIndex && state.reputation >= chapter.requiredReputation) {
      state.unlockedRareChapterIds.push(chapter.id)
      newlyUnlocked.push(chapter.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    saveSocietyState(state)
  }
  return newlyUnlocked
}

export const claimMilestoneReward = (rank: ReputationRank): boolean => {
  const state = loadSocietyState()
  const key = `milestone_${rank}`
  if (state.claimedMilestoneRewards.includes(key)) return false
  state.claimedMilestoneRewards.push(key)
  saveSocietyState(state)
  return true
}

export const isMilestoneRewardClaimed = (rank: ReputationRank): boolean => {
  const state = loadSocietyState()
  return state.claimedMilestoneRewards.includes(`milestone_${rank}`)
}

export const getReputationProgress = (reputation: number): { current: number; next: number; percentage: number; nextRank: ReputationRank | null } => {
  const currentRank = determineRank(reputation)
  const currentIndex = REPUTATION_RANK_ORDER.indexOf(currentRank)
  const nextRank: ReputationRank | null = currentIndex < REPUTATION_RANK_ORDER.length - 1 ? REPUTATION_RANK_ORDER[currentIndex + 1] : null

  if (!nextRank) {
    return { current: reputation, next: reputation, percentage: 100, nextRank: null }
  }

  const currentMin = REPUTATION_RANK_MIN[currentRank]
  const nextMin = REPUTATION_RANK_MIN[nextRank]
  const range = nextMin - currentMin
  const progress = reputation - currentMin
  const percentage = Math.min(Math.round((progress / range) * 100), 100)

  return { current: reputation, next: nextMin, percentage, nextRank }
}

export const getSubmissionsByStatus = (status: SubmissionStatus): SocietySubmission[] => {
  const state = loadSocietyState()
  return state.submissions.filter((s: SocietySubmission) => s.status === status)
}

export const getExhibitionsByTheme = (themeId: string): ExhibitionEntry[] => {
  const state = loadSocietyState()
  return state.exhibitions.filter((e: ExhibitionEntry) => e.themeId === themeId)
}

export const getReviewScore = (composition: Composition): Record<string, number> => {
  const scores: Record<string, number> = {}
  for (const criterion of reviewCriteria) {
    let base = 0
    switch (criterion.id) {
      case 'rc_imagery':
        base = composition.score.imagery
        break
      case 'rc_coherence':
        base = composition.score.coherence
        break
      case 'rc_emotion':
        base = (composition.score.imagery + composition.score.themeMatch) / 2
        break
      case 'rc_rhythm':
        base = composition.score.rhythm
        break
      case 'rc_theme':
        base = composition.score.themeMatch
        break
    }
    const variance = (Math.random() - 0.5) * 10
    scores[criterion.id] = Math.max(0, Math.min(100, Math.round(base + variance)))
  }
  return scores
}

export const canSubmit = (composition: Composition): { canSubmit: boolean; reason?: string } => {
  const state = loadSocietyState()
  const existing = state.submissions.find((s: SocietySubmission) => s.compositionId === composition.id)
  if (existing) {
    return { canSubmit: false, reason: '此作品已投稿' }
  }
  return { canSubmit: true }
}

export const canExhibit = (composition: Composition, themeId: string): { canExhibit: boolean; reason?: string } => {
  const state = loadSocietyState()
  const theme = getExhibitionThemeById(themeId)
  if (!theme) return { canExhibit: false, reason: '展陈主题不存在' }
  if (composition.score.total < theme.minScore) {
    return { canExhibit: false, reason: `评分需达到${theme.minScore}分` }
  }
  const existing = state.exhibitions.find((e: ExhibitionEntry) => e.compositionId === composition.id && e.themeId === themeId)
  if (existing) return { canExhibit: false, reason: '已在此展陈中' }
  const entries = state.exhibitions.filter((e: ExhibitionEntry) => e.themeId === themeId)
  if (entries.length >= theme.maxSlots) return { canExhibit: false, reason: '展陈已满' }
  return { canExhibit: true }
}
