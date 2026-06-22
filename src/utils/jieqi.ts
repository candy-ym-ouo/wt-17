import type { JieqiState, JieqiType, Composition, Phrase, JieqiQuest, QuestCondition } from '@/types'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'
import { jieqiList, getJieqiById, getJieqiChapter, isJieqiUnlocked, jieqiQuests, getJieqiQuests, jieqiPhrases } from '@/data/jieqi'
import { loadCompositions } from '@/utils/storage'

const STORAGE_KEY = 'poem_slices_jieqi_state'

export const DEFAULT_JIEQI_STATE: JieqiState = {
  unlockedJieqi: [],
  completedChapters: {},
  claimedRewards: {},
  collectedPhrases: [],
  earnedTitles: [],
  portfolioCompositions: {},
  activeJieqiId: null,
  currentYear: new Date().getFullYear()
}

export const loadJieqiState = (): JieqiState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = initializeJieqiState()
      saveJieqiState(initial)
      return initial
    }
    
    let data = JSON.parse(raw)
    
    if (needsMigration(data)) {
      const migrated = migrateData<JieqiState>('jieqi', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated.data
    }
    
    return unwrapVersionedData(data)
  } catch (e) {
    console.error('Failed to load jieqi state:', e)
    return initializeJieqiState()
  }
}

export const saveJieqiState = (state: JieqiState): void => {
  try {
    const versioned = wrapWithVersion(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save jieqi state:', e)
  }
}

const initializeJieqiState = (): JieqiState => {
  const unlocked: JieqiType[] = []
  jieqiList.forEach(jieqi => {
    if (isJieqiUnlocked(jieqi.id)) {
      unlocked.push(jieqi.id)
    }
  })
  
  return {
    ...DEFAULT_JIEQI_STATE,
    unlockedJieqi: unlocked,
    currentYear: new Date().getFullYear()
  }
}

export const refreshJieqiUnlocks = (): JieqiState => {
  const state = loadJieqiState()
  const newlyUnlocked: JieqiType[] = []
  
  jieqiList.forEach(jieqi => {
    if (!state.unlockedJieqi.includes(jieqi.id) && isJieqiUnlocked(jieqi.id)) {
      state.unlockedJieqi.push(jieqi.id)
      newlyUnlocked.push(jieqi.id)
    }
  })
  
  if (newlyUnlocked.length > 0) {
    saveJieqiState(state)
  }
  
  return state
}

export const completeJieqiChapter = (chapterId: string): void => {
  const state = loadJieqiState()
  state.completedChapters[chapterId] = true
  saveJieqiState(state)
}

export const isJieqiChapterCompleted = (chapterId: string): boolean => {
  const state = loadJieqiState()
  return state.completedChapters[chapterId] || false
}

export const claimJieqiReward = (rewardId: string): void => {
  const state = loadJieqiState()
  state.claimedRewards[rewardId] = true
  saveJieqiState(state)
}

export const isJieqiRewardClaimed = (rewardId: string): boolean => {
  const state = loadJieqiState()
  return state.claimedRewards[rewardId] || false
}

export const collectJieqiPhrase = (phraseText: string): void => {
  const state = loadJieqiState()
  if (!state.collectedPhrases.includes(phraseText)) {
    state.collectedPhrases.push(phraseText)
    saveJieqiState(state)
  }
}

export const addCompositionToJieqiPortfolio = (jieqiId: JieqiType, compositionId: string): void => {
  const state = loadJieqiState()
  if (!state.portfolioCompositions[jieqiId]) {
    state.portfolioCompositions[jieqiId] = []
  }
  if (!state.portfolioCompositions[jieqiId].includes(compositionId)) {
    state.portfolioCompositions[jieqiId].push(compositionId)
    saveJieqiState(state)
  }
}

export const removeCompositionFromJieqiPortfolio = (jieqiId: JieqiType, compositionId: string): void => {
  const state = loadJieqiState()
  if (state.portfolioCompositions[jieqiId]) {
    state.portfolioCompositions[jieqiId] = state.portfolioCompositions[jieqiId].filter(id => id !== compositionId)
    saveJieqiState(state)
  }
}

export const getJieqiPortfolioCompositions = (jieqiId: JieqiType): string[] => {
  const state = loadJieqiState()
  return state.portfolioCompositions[jieqiId] || []
}

export const setActiveJieqi = (jieqiId: JieqiType | null): void => {
  const state = loadJieqiState()
  state.activeJieqiId = jieqiId
  saveJieqiState(state)
}

export const getActiveJieqi = (): JieqiType | null => {
  const state = loadJieqiState()
  return state.activeJieqiId
}

export const getJieqiBestScore = (chapterId: string, compositions: Composition[]): number => {
  const jieqiComps = compositions.filter(c => c.chapterId === chapterId)
  if (jieqiComps.length === 0) return 0
  return Math.max(...jieqiComps.map(c => c.score.total))
}

export const getJieqiChapterPhrases = (jieqiId: JieqiType, basePhrases: Phrase[]): Phrase[] => {
  const chapter = getJieqiChapter(`jq_${jieqiId}`)
  if (!chapter) return basePhrases
  
  const jieqi = getJieqiById(jieqiId)
  if (!jieqi) return basePhrases
  
  return basePhrases
}

export const getJieqiProgress = (jieqiId: JieqiType): { completed: number; total: number; percentage: number } => {
  const state = loadJieqiState()
  const jieqi = getJieqiById(jieqiId)
  if (!jieqi) return { completed: 0, total: 0, percentage: 0 }
  
  const chapterId = `jq_${jieqiId}`
  const chapterCompleted = state.completedChapters[chapterId] ? 1 : 0
  
  return {
    completed: chapterCompleted,
    total: 1,
    percentage: chapterCompleted * 100
  }
}

export const getSeasonJieqi = (season: string): JieqiType[] => {
  return jieqiList
    .filter(j => j.season === season)
    .map(j => j.id)
}

export const getCurrentSeasonJieqi = (): JieqiType[] => {
  const now = new Date()
  const month = now.getMonth() + 1
  
  let season: string
  if (month >= 3 && month <= 5) season = '春'
  else if (month >= 6 && month <= 8) season = '夏'
  else if (month >= 9 && month <= 11) season = '秋'
  else season = '冬'
  
  return getSeasonJieqi(season)
}

export const earnJieqiTitle = (title: string): void => {
  const state = loadJieqiState()
  if (!state.earnedTitles.includes(title)) {
    state.earnedTitles.push(title)
    saveJieqiState(state)
  }
}

export const hasJieqiTitle = (title: string): boolean => {
  const state = loadJieqiState()
  return state.earnedTitles.includes(title)
}

export const getTotalJieqiProgress = (): { completed: number; total: number; percentage: number } => {
  const state = loadJieqiState()
  const total = jieqiList.length
  const completed = Object.keys(state.completedChapters).filter(
    id => state.completedChapters[id]
  ).length
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

const checkQuestCondition = (
  condition: QuestCondition,
  compositions: Composition[],
  state: JieqiState
): boolean => {
  const { type, params } = condition
  
  switch (type) {
    case 'score_threshold': {
      const chapterId = params.chapterId
      const minScore = params.minScore || 0
      const chapterComps = compositions.filter(c => c.chapterId === chapterId)
      if (chapterComps.length === 0) return false
      const maxScore = Math.max(...chapterComps.map(c => c.score.total))
      return maxScore >= minScore
    }
    case 'chapter_count': {
      const minCount = params.minCount || 0
      const completedCount = Object.keys(state.completedChapters).filter(
        id => state.completedChapters[id]
      ).length
      return completedCount >= minCount
    }
    case 'composition_count': {
      const minCount = params.minCount || 0
      const jieqiId = params.jieqiId
      let comps = compositions
      if (jieqiId) {
        const chapterId = `jq_${jieqiId}`
        comps = compositions.filter(c => c.chapterId === chapterId)
      }
      return comps.length >= minCount
    }
    case 'phrase_collection_count': {
      const minCount = params.minCount || 0
      return state.collectedPhrases.length >= minCount
    }
    default:
      return false
  }
}

const checkAllConditions = (
  conditions: QuestCondition[],
  compositions: Composition[],
  state: JieqiState
): boolean => {
  if (conditions.length === 0) return true
  return conditions.every(cond => checkQuestCondition(cond, compositions, state))
}

export const isJieqiQuestUnlocked = (questId: string): boolean => {
  const state = loadJieqiState()
  const compositions = loadCompositions()
  const quest = jieqiQuests.find(q => q.id === questId)
  if (!quest) return false
  return checkAllConditions(quest.unlockConditions, compositions, state)
}

export const isJieqiQuestCompleted = (questId: string): boolean => {
  const state = loadJieqiState()
  const compositions = loadCompositions()
  const quest = jieqiQuests.find(q => q.id === questId)
  if (!quest) return false
  
  if (!checkAllConditions(quest.unlockConditions, compositions, state)) return false
  
  return checkAllConditions(quest.completeConditions, compositions, state)
}

export const isJieqiQuestRewardClaimed = (questId: string): boolean => {
  const state = loadJieqiState()
  return state.claimedRewards[questId] || false
}

export const getJieqiQuestStatus = (questId: string): 'locked' | 'unlocked' | 'completed' | 'claimed' => {
  const state = loadJieqiState()
  
  if (state.claimedRewards[questId]) return 'claimed'
  if (isJieqiQuestCompleted(questId)) return 'completed'
  if (isJieqiQuestUnlocked(questId)) return 'unlocked'
  return 'locked'
}

export const claimJieqiQuestReward = (questId: string): { success: boolean; rewards: string[] } => {
  const state = loadJieqiState()
  const quest = jieqiQuests.find(q => q.id === questId)
  
  if (!quest) return { success: false, rewards: [] }
  if (state.claimedRewards[questId]) return { success: false, rewards: [] }
  if (!isJieqiQuestCompleted(questId)) return { success: false, rewards: [] }
  
  const claimedRewards: string[] = []
  
  quest.rewards.forEach(reward => {
    switch (reward.type) {
      case 'phrase_unlock': {
        const phraseTexts = reward.params.phraseTexts || []
        phraseTexts.forEach((text: string) => {
          if (!state.collectedPhrases.includes(text)) {
            state.collectedPhrases.push(text)
            claimedRewards.push(`解锁限定词：${text}`)
          }
        })
        break
      }
      case 'title_reward': {
        const title = reward.params.title
        if (title && !state.earnedTitles.includes(title)) {
          state.earnedTitles.push(title)
          claimedRewards.push(`获得称号：${title}`)
        }
        break
      }
    }
  })
  
  state.claimedRewards[questId] = true
  saveJieqiState(state)
  
  return { success: true, rewards: claimedRewards }
}

export const isJieqiPhraseUnlocked = (phraseText: string, jieqiId?: JieqiType): boolean => {
  const state = loadJieqiState()
  
  const phrase = jieqiPhrases.find(p => p.text === phraseText)
  if (!phrase) return false
  
  if (!phrase.isExclusive) return true
  
  if (jieqiId && phrase.jieqiId !== jieqiId) return false
  
  return state.collectedPhrases.includes(phraseText)
}

export const getUnlockedJieqiPhrases = (jieqiId: JieqiType): string[] => {
  const state = loadJieqiState()
  const jieqiPhraseList = jieqiPhrases.filter(p => p.jieqiId === jieqiId)
  
  return jieqiPhraseList
    .filter(phrase => {
      if (!phrase.isExclusive) return true
      return state.collectedPhrases.includes(phrase.text)
    })
    .map(p => p.text)
}

export const checkAndCompleteJieqiQuests = (jieqiId?: JieqiType): string[] => {
  const state = loadJieqiState()
  const compositions = loadCompositions()
  const newlyCompleted: string[] = []
  
  let questsToCheck = jieqiQuests
  if (jieqiId) {
    questsToCheck = jieqiQuests.filter(q => q.jieqiId === jieqiId)
  }
  
  questsToCheck.forEach(quest => {
    if (state.claimedRewards[quest.id]) return
    
    const wasUnlocked = checkAllConditions(quest.unlockConditions, compositions, state)
    if (!wasUnlocked) return
    
    const isCompleted = checkAllConditions(quest.completeConditions, compositions, state)
    if (isCompleted) {
      newlyCompleted.push(quest.id)
    }
  })
  
  return newlyCompleted
}

export const getJieqiQuestProgress = (jieqiId: JieqiType): { completed: number; total: number; percentage: number; claimed: number } => {
  const state = loadJieqiState()
  const compositions = loadCompositions()
  const quests = getJieqiQuests(jieqiId)
  
  let completed = 0
  let claimed = 0
  const total = quests.length
  
  quests.forEach(quest => {
    const status = getJieqiQuestStatus(quest.id)
    if (status === 'completed' || status === 'claimed') completed++
    if (status === 'claimed') claimed++
  })
  
  return {
    completed,
    claimed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}
