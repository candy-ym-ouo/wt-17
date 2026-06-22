import type { 
  TrialState, TrialTheme, Phrase, ScoreBreakdown, Chapter,
  TrialSettlementResult, TrialBonusResult, TrialRareImagery, TrialTitle, TrialSpectra
} from '@/types'
import { trialThemes, getTrialById, getTrialRareImageryById, getTrialTitleById, getTrialSpectraById } from '@/data/trials'
import { calculateScore } from '@/utils/scoring'
import { wrapWithVersion, unwrapVersionedData, needsMigration, migrateData } from '@/utils/migration'
import { addEarnedTitle, addChapterRewardPhrase, collectPhrase } from '@/utils/storage'
import { createRewardPhrase, getAllPhrases } from '@/data/phrases'
import type { ScoreGrade } from '@/types'
import { chapters } from '@/data/chapters'

const STORAGE_KEY = 'poem_slices_trial_state'

export const DEFAULT_TRIAL_STATE: TrialState = {
  unlockedThemes: [],
  clearedThemes: [],
  bestScores: {},
  bestTimes: {},
  earnedTitles: [],
  collectedImageries: [],
  collectedSpectra: [],
  totalTrials: 0,
  totalCleared: 0,
  currentStreak: 0,
  bestStreak: 0
}

export const loadTrialState = (): TrialState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_TRIAL_STATE }
    
    let data = JSON.parse(raw)
    
    if (needsMigration(data)) {
      const migrated = migrateData<TrialState>('trialState', data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated.data
    }
    
    return unwrapVersionedData(data)
  } catch (e) {
    console.error('Failed to load trial state:', e)
    return { ...DEFAULT_TRIAL_STATE }
  }
}

export const saveTrialState = (state: Partial<TrialState>): void => {
  try {
    const current = loadTrialState()
    const merged = { ...current, ...state }
    const versioned = wrapWithVersion(merged)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned))
  } catch (e) {
    console.error('Failed to save trial state:', e)
  }
}

export const isTrialUnlocked = (trialId: string): boolean => {
  const state = loadTrialState()
  const trial = getTrialById(trialId)
  
  if (!trial) return false
  if (state.unlockedThemes.includes(trialId)) return true
  if (!trial.unlockCondition) return false
  
  const { type, params } = trial.unlockCondition
  
  switch (type) {
    case 'score_threshold': {
      const chapterId = params.chapterId as string
      const minScore = params.minScore as number
      const bestScores = getAllBestScores()
      return (bestScores[chapterId] || 0) >= minScore
    }
    case 'chapter_count': {
      const minCount = params.minCount as number
      return state.clearedThemes.length >= minCount
    }
    case 'trial_clear': {
      const requiredTrialId = params.trialId as string
      return state.clearedThemes.includes(requiredTrialId)
    }
    case 'reputation_rank': {
      return false
    }
    default:
      return false
  }
}

const getAllBestScores = (): Record<string, number> => {
  const bestScores: Record<string, number> = {}
  try {
    const compsRaw = localStorage.getItem('poem_slices_compositions')
    if (compsRaw) {
      let data = JSON.parse(compsRaw)
      if (needsMigration(data)) {
        data = migrateData('compositions', data).data
      } else {
        data = unwrapVersionedData(data)
      }
      const compositions = data as any[]
      compositions.forEach(comp => {
        const chId = comp.chapterId
        const score = comp.score?.total || 0
        if (!bestScores[chId] || score > bestScores[chId]) {
          bestScores[chId] = score
        }
      })
    }
  } catch (e) {
    console.error('Failed to get best scores:', e)
  }
  return bestScores
}

export const unlockTrial = (trialId: string): void => {
  const state = loadTrialState()
  if (!state.unlockedThemes.includes(trialId)) {
    state.unlockedThemes.push(trialId)
    saveTrialState({ unlockedThemes: state.unlockedThemes })
  }
}

export const evaluateTrialBonusRules = (
  phrases: Phrase[],
  bonusRules: any[],
  timeUsedSeconds: number,
  requiredKeywords: string[]
): { triggeredBonuses: TrialBonusResult[]; totalBonus: number; totalMultiplier: number } => {
  const triggeredBonuses: TrialBonusResult[] = []
  let totalBonus = 0
  let totalMultiplier = 1.0
  
  const phraseTexts = new Set(phrases.map(p => p.text))
  const categories = new Set(phrases.map(p => p.category))
  const rarePhrases = phrases.filter(p => p.rarity !== 'common')
  
  bonusRules.forEach(rule => {
    let triggered = false
    
    switch (rule.type) {
      case 'keyword_combo': {
        const requiredCount = rule.params.requiredCount || 3
        const matched = requiredKeywords.filter(kw => phraseTexts.has(kw)).length
        triggered = matched >= requiredCount
        break
      }
      case 'category_balance': {
        triggered = categories.size >= 5
        break
      }
      case 'speed_bonus': {
        const threshold = rule.params.timeThreshold || 120
        triggered = timeUsedSeconds <= threshold
        break
      }
      case 'rare_phrase': {
        const minRarity = rule.params.minRarity || 'rare'
        const requiredCount = rule.params.requiredCount || 2
        const rarityOrder = ['common', 'rare', 'epic', 'legendary']
        const minIndex = rarityOrder.indexOf(minRarity)
        const count = phrases.filter(p => rarityOrder.indexOf(p.rarity) >= minIndex).length
        triggered = count >= requiredCount
        break
      }
      case 'theme_match': {
        const hasScene = phrases.some(p => p.category === 'scene')
        const hasEmotion = phrases.some(p => p.category === 'emotion')
        triggered = hasScene && hasEmotion
        break
      }
      case 'perfect_combo': {
        triggered = requiredKeywords.every(kw => phraseTexts.has(kw))
        break
      }
    }
    
    if (triggered) {
      const multiplier = rule.multiplier
      triggeredBonuses.push({
        type: rule.type,
        label: rule.label,
        bonus: rule.bonus,
        multiplier: multiplier,
        description: rule.description
      })
      totalBonus += rule.bonus
      if (multiplier && multiplier > 1) {
        totalMultiplier *= multiplier
      }
    }
  })
  
  return { triggeredBonuses, totalBonus, totalMultiplier }
}

const rollRareImageries = (pool: TrialRareImagery[], count: number): TrialRareImagery[] => {
  const results: TrialRareImagery[] = []
  const available = [...pool]
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, img) => sum + img.dropRate, 0)
    let random = Math.random() * totalWeight
    
    let selectedIndex = 0
    for (let j = 0; j < available.length; j++) {
      random -= available[j].dropRate
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }
    
    results.push(available[selectedIndex])
    available.splice(selectedIndex, 1)
  }
  
  return results
}

const rollSpectra = (pool: TrialSpectra[], count: number): TrialSpectra[] => {
  const results: TrialSpectra[] = []
  const available = [...pool]
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, spec) => sum + spec.dropRate, 0)
    let random = Math.random() * totalWeight
    
    let selectedIndex = 0
    for (let j = 0; j < available.length; j++) {
      random -= available[j].dropRate
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }
    
    results.push(available[selectedIndex])
    available.splice(selectedIndex, 1)
  }
  
  return results
}

const evaluateTitles = (
  titlePool: TrialTitle[],
  finalScore: number,
  timeUsedSeconds: number,
  requiredKeywords: string[],
  forbiddenWords: string[],
  phraseTexts: Set<string>
): TrialTitle[] => {
  const earned: TrialTitle[] = []
  
  titlePool.forEach(title => {
    let earnedFlag = false
    const { type, params } = title.condition
    
    switch (type) {
      case 'score_threshold': {
        const minScore = params.minScore as number
        earnedFlag = finalScore >= minScore
        break
      }
      case 'speed_clear': {
        const maxSeconds = params.maxSeconds as number
        earnedFlag = timeUsedSeconds <= maxSeconds
        break
      }
      case 'perfect_clear': {
        const minScore = params.minScore as number
        earnedFlag = finalScore >= minScore
        break
      }
      case 'all_keywords': {
        earnedFlag = requiredKeywords.every(kw => phraseTexts.has(kw))
        break
      }
      case 'no_forbidden': {
        const minScore = params.minScore as number
        const hasForbidden = forbiddenWords.some(fw => phraseTexts.has(fw))
        earnedFlag = !hasForbidden && finalScore >= minScore
        break
      }
    }
    
    if (earnedFlag) {
      earned.push(title)
    }
  })
  
  return earned
}

const getScoreGrade = (score: number): ScoreGrade => {
  if (score >= 90) return '神品'
  if (score >= 75) return '妙品'
  if (score >= 60) return '佳品'
  if (score >= 40) return '能品'
  return '习作'
}

const getStars = (score: number): number => {
  if (score >= 90) return 3
  if (score >= 75) return 2
  if (score >= 60) return 1
  return 0
}

export const settleTrial = (
  themeId: string,
  phrases: Phrase[],
  timeUsedSeconds: number
): TrialSettlementResult => {
  const theme = getTrialById(themeId)
  if (!theme) {
    throw new Error(`Trial theme not found: ${themeId}`)
  }
  
  const fakeChapter: Chapter = {
    id: `trial_${themeId}`,
    title: theme.name,
    subtitle: theme.description,
    description: theme.description,
    theme: theme.type,
    backgroundGradient: theme.backgroundGradient,
    accentColor: theme.accentColor,
    phrases: [],
    unlocked: true,
    targetPhraseCount: theme.targetPhraseCount,
    hint: theme.description,
    qualifierWords: theme.requiredKeywords,
    forbiddenWords: theme.forbiddenWords
  }
  
  const baseScore = calculateScore(phrases, fakeChapter, {})
  
  const { triggeredBonuses, totalBonus, totalMultiplier: bonusMultiplier } = evaluateTrialBonusRules(
    phrases,
    theme.bonusRules,
    timeUsedSeconds,
    theme.requiredKeywords
  )
  
  const scoreBeforeMultiplier = baseScore.total + totalBonus
  
  let settlementMultiplier = 1.0
  const multiplierRules: TrialBonusResult[] = []
  
  const tempScore = Math.min(100, scoreBeforeMultiplier)
  if (tempScore >= theme.requiredScore) {
    const eligibleSettlement = theme.settlementRules.filter(rule => tempScore >= rule.minScore)
    
    eligibleSettlement.forEach(rule => {
      if (rule.type === 'score_multiplier') {
        const mult = rule.params.multiplier || 1.0
        if (mult > 1) {
          settlementMultiplier *= mult
          multiplierRules.push({
            type: 'score_multiplier',
            label: rule.description,
            bonus: 0,
            multiplier: mult,
            description: `积分倍率 ×${mult}`
          })
        }
      }
    })
  }
  
  const finalMultiplier = bonusMultiplier * settlementMultiplier
  const scoreAfterMultiplier = scoreBeforeMultiplier * finalMultiplier
  const finalScore = Math.min(100, Math.round(scoreAfterMultiplier * 10) / 10)
  const scoreGrade = getScoreGrade(finalScore)
  const stars = getStars(finalScore)
  
  const phraseTexts = new Set(phrases.map(p => p.text))
  
  const state = loadTrialState()
  const isFirstClear = !state.clearedThemes.includes(themeId)
  const isNewRecord = !state.bestScores[themeId] || finalScore > state.bestScores[themeId]
  
  const allTriggeredBonuses = [...triggeredBonuses, ...multiplierRules]
  
  let earnedImageries: TrialRareImagery[] = []
  let earnedTitles: TrialTitle[] = []
  let earnedSpectra: TrialSpectra[] = []
  let unlockedPhrases: string[] = []
  
  if (finalScore >= theme.requiredScore) {
    const eligibleSettlement = theme.settlementRules.filter(rule => finalScore >= rule.minScore)
    
    eligibleSettlement.forEach(rule => {
      switch (rule.type) {
        case 'imagery_drop': {
          const count = rule.params.count || 1
          const rarity = rule.params.rarity || 'rare'
          const pool = theme.rewards.rareImageries.filter(img => {
            const rarityOrder = ['common', 'rare', 'epic', 'legendary']
            return rarityOrder.indexOf(img.rarity) >= rarityOrder.indexOf(rarity as any)
          })
          const rolled = rollRareImageries(pool.length > 0 ? pool : theme.rewards.rareImageries, count)
          earnedImageries.push(...rolled)
          break
        }
        case 'title_award': {
          const titles = evaluateTitles(
            theme.rewards.titles,
            finalScore,
            timeUsedSeconds,
            theme.requiredKeywords,
            theme.forbiddenWords,
            phraseTexts
          )
          earnedTitles.push(...titles)
          break
        }
        case 'phrase_unlock': {
          const count = rule.params.count || 1
          const pool = theme.rewards.phraseUnlocks
          const shuffled = [...pool].sort(() => Math.random() - 0.5)
          unlockedPhrases = shuffled.slice(0, Math.min(count, pool.length))
          break
        }
        case 'spectra_unlock': {
          const rarity = rule.params.rarity || 'epic'
          const pool = theme.rewards.spectra.filter(spec => {
            const rarityOrder = ['common', 'rare', 'epic', 'legendary']
            return rarityOrder.indexOf(spec.rarity) >= rarityOrder.indexOf(rarity as any)
          })
          const rolled = rollSpectra(pool.length > 0 ? pool : theme.rewards.spectra, 1)
          earnedSpectra.push(...rolled)
          break
        }
      }
    })
  }
  
  earnedImageries = [...new Map(earnedImageries.map(item => [item.id, item])).values()]
  earnedTitles = [...new Map(earnedTitles.map(item => [item.id, item])).values()]
  earnedSpectra = [...new Map(earnedSpectra.map(item => [item.id, item])).values()]
  
  return {
    themeId,
    themeName: theme.name,
    score: baseScore.total,
    scoreGrade,
    timeUsedSeconds,
    triggeredBonuses: allTriggeredBonuses,
    totalBonus,
    scoreMultiplier: finalMultiplier,
    scoreBeforeMultiplier,
    finalScore,
    earnedImageries,
    earnedTitles,
    earnedSpectra,
    unlockedPhrases,
    isNewRecord,
    isFirstClear,
    stars
  }
}

export const saveTrialResult = (result: TrialSettlementResult): void => {
  const state = loadTrialState()
  const theme = getTrialById(result.themeId)
  if (!theme) return
  
  const newState = { ...state }
  
  newState.totalTrials++
  
  if (result.finalScore >= theme.requiredScore) {
    newState.totalCleared++
    
    if (!newState.clearedThemes.includes(result.themeId)) {
      newState.clearedThemes.push(result.themeId)
    }
    
    newState.currentStreak++
    if (newState.currentStreak > newState.bestStreak) {
      newState.bestStreak = newState.currentStreak
    }
  } else {
    newState.currentStreak = 0
  }
  
  if (result.isNewRecord) {
    newState.bestScores[result.themeId] = result.finalScore
    newState.bestTimes[result.themeId] = result.timeUsedSeconds
  }
  
  result.earnedImageries.forEach(img => {
    if (!newState.collectedImageries.includes(img.id)) {
      newState.collectedImageries.push(img.id)
    }
  })
  
  result.earnedTitles.forEach(title => {
    if (!newState.earnedTitles.includes(title.id)) {
      newState.earnedTitles.push(title.id)
      addEarnedTitle(title.name)
    }
  })
  
  result.earnedSpectra.forEach(spec => {
    if (!newState.collectedSpectra.includes(spec.id)) {
      newState.collectedSpectra.push(spec.id)
    }
  })
  
  result.unlockedPhrases.forEach(text => {
    const phrase = createRewardPhrase(text)
    if (phrase) {
      addChapterRewardPhrase(result.themeId, phrase)
      collectPhrase(text, result.themeId, `trial_${result.themeId}`)
    }
  })
  
  const nextTrials = trialThemes.filter(t => {
    if (!t.unlockCondition) return false
    if (t.unlockCondition.type !== 'trial_clear') return false
    return t.unlockCondition.params.trialId === result.themeId
  })
  
  nextTrials.forEach(t => {
    if (!newState.unlockedThemes.includes(t.id) && result.finalScore >= theme.requiredScore) {
      newState.unlockedThemes.push(t.id)
    }
  })
  
  saveTrialState(newState)
}

export const getTrialProgress = (): { total: number; cleared: number; progress: number } => {
  const state = loadTrialState()
  const total = trialThemes.length
  const cleared = state.clearedThemes.length
  const progress = total > 0 ? (cleared / total) * 100 : 0
  
  return { total, cleared, progress }
}

export const getCollectedImageryCount = (): number => {
  const state = loadTrialState()
  return state.collectedImageries.length
}

export const getCollectedSpectraCount = (): number => {
  const state = loadTrialState()
  return state.collectedSpectra.length
}
