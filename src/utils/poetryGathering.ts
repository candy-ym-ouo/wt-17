import type { GatheringState, GatheringChapterResult, GatheringBonusRule, Phrase, PhraseRarity } from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'
import { rarityLabels } from '@/data/phrases'
import { createCollection } from '@/utils/storage'

const STORAGE_KEY = 'poem_slices_gathering_state'

const DEFAULT_GATHERING_STATE: GatheringState = {
  activeGatheringId: null,
  chapterResults: {},
  claimedRewards: {},
  archivedGatheringIds: []
}

export const loadGatheringState = (): GatheringState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_GATHERING_STATE }
    let data = JSON.parse(raw)
    if (needsMigration(data)) {
      const migrated = migrateData<GatheringState>('gatheringState', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return { ...DEFAULT_GATHERING_STATE, ...migrated.data }
    }
    return { ...DEFAULT_GATHERING_STATE, ...unwrapVersionedData(data) }
  } catch {
    return { ...DEFAULT_GATHERING_STATE }
  }
}

export const saveGatheringState = (state: GatheringState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save gathering state:', e)
  }
}

export const setGatheringActive = (gatheringId: string): void => {
  const state = loadGatheringState()
  state.activeGatheringId = gatheringId
  saveGatheringState(state)
}

export const clearActiveGathering = (): void => {
  const state = loadGatheringState()
  state.activeGatheringId = null
  saveGatheringState(state)
}

export const saveChapterResult = (result: GatheringChapterResult): void => {
  const state = loadGatheringState()
  if (!state.chapterResults[result.gatheringId]) {
    state.chapterResults[result.gatheringId] = []
  }
  const existing = state.chapterResults[result.gatheringId]
  const idx = existing.findIndex(r => r.chapterId === result.chapterId)
  if (idx >= 0) {
    if (result.score > existing[idx].score) {
      existing[idx] = result
    }
  } else {
    existing.push(result)
  }
  saveGatheringState(state)
}

export const getGatheringResults = (gatheringId: string): GatheringChapterResult[] => {
  const state = loadGatheringState()
  return state.chapterResults[gatheringId] || []
}

export const getBestChapterResult = (gatheringId: string, chapterId: string): GatheringChapterResult | null => {
  const results = getGatheringResults(gatheringId)
  const chapterResults = results.filter(r => r.chapterId === chapterId)
  if (chapterResults.length === 0) return null
  return chapterResults.reduce((best, cur) => cur.score > best.score ? cur : best)
}

export const calculateGatheringTotalScore = (gatheringId: string, chapterIds: string[]): number => {
  const results = getGatheringResults(gatheringId)
  let total = 0
  chapterIds.forEach(chId => {
    const chapterResults = results.filter(r => r.chapterId === chId)
    if (chapterResults.length > 0) {
      const best = chapterResults.reduce((a, b) => a.score > b.score ? a : b)
      total += best.score + best.bonusAdjustment
    }
  })
  return total
}

export const getChaptersCleared = (gatheringId: string): number => {
  const results = getGatheringResults(gatheringId)
  const uniqueChapters = new Set(results.map(r => r.chapterId))
  return uniqueChapters.size
}

export const evaluateBonusRules = (phrases: Phrase[], rules: GatheringBonusRule[], elapsedSeconds: number): { totalBonus: number; triggeredLabels: string[] } => {
  let totalBonus = 0
  const triggeredLabels: string[] = []
  const phraseTexts = new Set(phrases.map(p => p.text))

  rules.forEach(rule => {
    let triggered = false
    switch (rule.type) {
      case 'keyword_combo': {
        const keywords = rule.params.keywords as string[]
        triggered = keywords.every(k => phraseTexts.has(k))
        break
      }
      case 'category_balance': {
        const categories = rule.params.categories as string[]
        const minCount = rule.params.minCount as number
        const catCounts: Record<string, number> = {}
        phrases.forEach(p => {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1
        })
        triggered = categories.every(cat => (catCounts[cat] || 0) >= minCount)
        break
      }
      case 'speed_bonus': {
        const maxSeconds = rule.params.maxSeconds as number
        triggered = elapsedSeconds <= maxSeconds
        break
      }
      case 'rare_phrase': {
        const minRarity = rule.params.minRarity as PhraseRarity
        const minCount = rule.params.minCount as number
        const rarityOrder: Record<PhraseRarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }
        const count = phrases.filter(p => rarityOrder[p.rarity] >= rarityOrder[minRarity]).length
        triggered = count >= minCount
        break
      }
    }

    if (triggered) {
      totalBonus += rule.bonus
      triggeredLabels.push(rule.label)
    }
  })

  return { totalBonus, triggeredLabels }
}

export const determineRewardTier = (totalScore: number, chaptersCleared: number, rewards: { tier: string; minScore: number; minChaptersCleared: number }[]): string | null => {
  const tierOrder = ['platinum', 'gold', 'silver', 'bronze']
  for (const tier of tierOrder) {
    const reward = rewards.find(r => r.tier === tier)
    if (reward && totalScore >= reward.minScore && chaptersCleared >= reward.minChaptersCleared) {
      return tier
    }
  }
  return null
}

export const claimGatheringReward = (gatheringId: string, tier: string): void => {
  const state = loadGatheringState()
  if (!state.claimedRewards[gatheringId]) {
    state.claimedRewards[gatheringId] = []
  }
  if (!state.claimedRewards[gatheringId].includes(tier)) {
    state.claimedRewards[gatheringId].push(tier)
  }
  saveGatheringState(state)
}

export const isRewardClaimed = (gatheringId: string, tier: string): boolean => {
  const state = loadGatheringState()
  return (state.claimedRewards[gatheringId] || []).includes(tier)
}

export const archiveGathering = (gatheringId: string, gatheringTitle: string): string => {
  const state = loadGatheringState()
  if (!state.archivedGatheringIds.includes(gatheringId)) {
    state.archivedGatheringIds.push(gatheringId)
  }
  saveGatheringState(state)

  const collection = createCollection(
    `📜 ${gatheringTitle}`,
    `主题诗会「${gatheringTitle}」归档作品集`,
    '#c9a86c'
  )
  return collection.id
}

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
