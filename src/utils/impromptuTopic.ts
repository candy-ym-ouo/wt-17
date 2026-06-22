import type { ImpromptuTopicState, ImpromptuTopicResult } from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'

const STORAGE_KEY = 'poem_slices_impromptu_topic_state'

const DEFAULT_IMPROMPTU_STATE: ImpromptuTopicState = {
  completedTopics: [],
  topicResults: {},
  claimedRewards: {},
  totalCompleted: 0
}

export const loadImpromptuState = (): ImpromptuTopicState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_IMPROMPTU_STATE }
    let data = JSON.parse(raw)
    if (needsMigration(data)) {
      const migrated = migrateData<ImpromptuTopicState>('impromptuTopicState', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return { ...DEFAULT_IMPROMPTU_STATE, ...migrated.data }
    }
    return { ...DEFAULT_IMPROMPTU_STATE, ...unwrapVersionedData(data) }
  } catch {
    return { ...DEFAULT_IMPROMPTU_STATE }
  }
}

export const saveImpromptuState = (state: ImpromptuTopicState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save impromptu state:', e)
  }
}

export const saveImpromptuResult = (result: ImpromptuTopicResult): void => {
  const state = loadImpromptuState()
  if (!state.topicResults[result.topicId]) {
    state.topicResults[result.topicId] = []
  }
  state.topicResults[result.topicId].push(result)

  if (!state.completedTopics.includes(result.topicId)) {
    state.completedTopics.push(result.topicId)
  }
  state.totalCompleted = state.completedTopics.length
  saveImpromptuState(state)
}

export const getImpromptuResults = (topicId: string): ImpromptuTopicResult[] => {
  const state = loadImpromptuState()
  return state.topicResults[topicId] || []
}

export const getBestImpromptuResult = (topicId: string): ImpromptuTopicResult | null => {
  const results = getImpromptuResults(topicId)
  if (results.length === 0) return null
  return results.reduce((best, cur) => {
    const bestTotal = best.score + best.bonusAdjustment
    const curTotal = cur.score + cur.bonusAdjustment
    return curTotal > bestTotal ? cur : best
  })
}

export const determineImpromptuRewardTier = (
  totalScore: number,
  rewards: { tier: string; minScore: number }[]
): string | null => {
  const tierOrder = ['gold', 'silver', 'bronze']
  for (const tier of tierOrder) {
    const reward = rewards.find(r => r.tier === tier)
    if (reward && totalScore >= reward.minScore) {
      return tier
    }
  }
  return null
}

export const claimImpromptuReward = (topicId: string, tier: string): void => {
  const state = loadImpromptuState()
  if (!state.claimedRewards[topicId]) {
    state.claimedRewards[topicId] = []
  }
  if (!state.claimedRewards[topicId].includes(tier)) {
    state.claimedRewards[topicId].push(tier)
  }
  saveImpromptuState(state)
}

export const isImpromptuRewardClaimed = (topicId: string, tier: string): boolean => {
  const state = loadImpromptuState()
  return (state.claimedRewards[topicId] || []).includes(tier)
}

export const getImpromptuCompletedCount = (): number => {
  const state = loadImpromptuState()
  return state.totalCompleted
}

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
