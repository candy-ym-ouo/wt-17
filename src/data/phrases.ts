import type { Phrase, PhraseCategory, PhraseRarity, PhraseSource, Theme } from '@/types'

let phraseIdCounter = 0
const pid = () => `p_${Date.now()}_${++phraseIdCounter}`

export const rarityLabels: Record<PhraseRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

export const rarityColors: Record<PhraseRarity, string> = {
  common: '#8a8a7a',
  rare: '#5b9ea8',
  epic: '#a87ac9',
  legendary: '#c9a86c'
}

export const rarityScoreBonus: Record<PhraseRarity, number> = {
  common: 0,
  rare: 0.05,
  epic: 0.1,
  legendary: 0.15
}

export const rarityDropRates: Record<PhraseRarity, number> = {
  common: 0.6,
  rare: 0.25,
  epic: 0.12,
  legendary: 0.03
}

const createInitialSource = (): PhraseSource => ({
  type: 'initial',
  description: '初始词池'
})

const createRewardSource = (description: string): PhraseSource => ({
  type: 'reward',
  description
})

export const createChapterSource = (chapterId: string, chapterTitle: string): PhraseSource => ({
  type: 'chapter',
  chapterId,
  description: `章节掉落 · ${chapterTitle}`
})

export const createQuestSource = (questId: string, description: string): PhraseSource => ({
  type: 'quest',
  questId,
  description
})

export const createPhrase = (
  text: string,
  category: PhraseCategory,
  weight = 1,
  rarity: PhraseRarity = 'common',
  source?: PhraseSource
): Phrase => ({
  id: pid(),
  text,
  category,
  position: null,
  rotation: 0,
  isPlaced: false,
  weight,
  rarity,
  source: source || createInitialSource()
})

export const scenePhrases: Phrase[] = [
  createPhrase('明月', 'scene', 3, 'legendary'),
  createPhrase('青山', 'scene', 3, 'epic'),
  createPhrase('流水', 'scene', 3, 'epic'),
  createPhrase('落花', 'scene', 3, 'epic'),
  createPhrase('白云', 'scene', 2, 'rare'),
  createPhrase('清风', 'scene', 2, 'rare'),
  createPhrase('残阳', 'scene', 2, 'rare'),
  createPhrase('孤舟', 'scene', 2, 'rare'),
  createPhrase('垂柳', 'scene', 2, 'rare'),
  createPhrase('寒烟', 'scene', 2, 'rare'),
  createPhrase('翠竹', 'scene', 2, 'rare'),
  createPhrase('小径', 'scene', 1, 'common'),
  createPhrase('古寺', 'scene', 1, 'common'),
  createPhrase('长河', 'scene', 1, 'common'),
  createPhrase('荒原', 'scene', 1, 'common'),
  createPhrase('繁星', 'scene', 1, 'common'),
  createPhrase('夜雨', 'scene', 1, 'common'),
  createPhrase('初雪', 'scene', 1, 'common'),
]

export const emotionPhrases: Phrase[] = [
  createPhrase('相思', 'emotion', 3, 'legendary'),
  createPhrase('离愁', 'emotion', 3, 'epic'),
  createPhrase('怅惘', 'emotion', 2, 'rare'),
  createPhrase('悠然', 'emotion', 2, 'rare'),
  createPhrase('寂寥', 'emotion', 2, 'rare'),
  createPhrase('缱绻', 'emotion', 2, 'rare'),
  createPhrase('惆怅', 'emotion', 2, 'rare'),
  createPhrase('清欢', 'emotion', 2, 'rare'),
  createPhrase('孤苦', 'emotion', 1, 'common'),
  createPhrase('狂喜', 'emotion', 1, 'common'),
  createPhrase('悲悯', 'emotion', 1, 'common'),
  createPhrase('淡泊', 'emotion', 1, 'common'),
]

export const timePhrases: Phrase[] = [
  createPhrase('千年', 'time', 2, 'epic'),
  createPhrase('一瞬', 'time', 2, 'epic'),
  createPhrase('昨夜', 'time', 2, 'rare'),
  createPhrase('今朝', 'time', 2, 'rare'),
  createPhrase('黄昏', 'time', 3, 'legendary'),
  createPhrase('黎明', 'time', 2, 'rare'),
  createPhrase('日暮', 'time', 2, 'rare'),
  createPhrase('岁末', 'time', 1, 'common'),
  createPhrase('春深', 'time', 1, 'common'),
  createPhrase('秋凉', 'time', 1, 'common'),
]

export const actionPhrases: Phrase[] = [
  createPhrase('独坐', 'action', 2, 'rare'),
  createPhrase('遥望', 'action', 2, 'rare'),
  createPhrase('轻吟', 'action', 2, 'rare'),
  createPhrase('独酌', 'action', 2, 'rare'),
  createPhrase('漫步', 'action', 1, 'common'),
  createPhrase('凝思', 'action', 2, 'rare'),
  createPhrase('落笔', 'action', 1, 'common'),
  createPhrase('抚琴', 'action', 1, 'common'),
  createPhrase('凭栏', 'action', 2, 'rare'),
  createPhrase('低眉', 'action', 1, 'common'),
  createPhrase('长叹', 'action', 1, 'common'),
  createPhrase('回眸', 'action', 2, 'rare'),
]

export const imageryPhrases: Phrase[] = [
  createPhrase('故人', 'imagery', 3, 'legendary'),
  createPhrase('归雁', 'imagery', 2, 'epic'),
  createPhrase('寒梅', 'imagery', 2, 'epic'),
  createPhrase('浊酒', 'imagery', 2, 'rare'),
  createPhrase('残梦', 'imagery', 2, 'rare'),
  createPhrase('旧约', 'imagery', 2, 'rare'),
  createPhrase('素笺', 'imagery', 1, 'common'),
  createPhrase('锦瑟', 'imagery', 1, 'common'),
  createPhrase('玉笛', 'imagery', 1, 'common'),
  createPhrase('青灯', 'imagery', 2, 'rare'),
  createPhrase('古道', 'imagery', 2, 'rare'),
  createPhrase('西风', 'imagery', 2, 'rare'),
]

export const rewardPhrases: Record<string, { text: string; category: PhraseCategory; weight: number; rarity: PhraseRarity; description: string }> = {
  '花间一壶酒': { text: '花间一壶酒', category: 'scene', weight: 3, rarity: 'legendary', description: '李白《月下独酌》名句' },
  '对影三人': { text: '对影三人', category: 'imagery', weight: 3, rarity: 'legendary', description: '李白《月下独酌》意象' },
  '断肠人在天涯': { text: '断肠人在天涯', category: 'emotion', weight: 3, rarity: 'legendary', description: '马致远《天净沙·秋思》' },
  '瘦马': { text: '瘦马', category: 'imagery', weight: 2, rarity: 'epic', description: '古道西风瘦马' },
  '霜降': { text: '霜降', category: 'time', weight: 2, rarity: 'rare', description: '二十四节气' },
  '暮秋': { text: '暮秋', category: 'time', weight: 2, rarity: 'rare', description: '深秋时节' },
  '柴门': { text: '柴门', category: 'scene', weight: 2, rarity: 'rare', description: '柴门闻犬吠' },
  '犬吠': { text: '犬吠', category: 'action', weight: 2, rarity: 'rare', description: '风雪夜归人' },
  '蓦然回首': { text: '蓦然回首', category: 'action', weight: 3, rarity: 'epic', description: '辛弃疾《青玉案·元夕》' },
  '那人却在': { text: '那人却在', category: 'imagery', weight: 3, rarity: 'epic', description: '灯火阑珊处' },
  '五十弦': { text: '五十弦', category: 'imagery', weight: 2, rarity: 'rare', description: '锦瑟无端五十弦' },
  '一弦一柱': { text: '一弦一柱', category: 'imagery', weight: 2, rarity: 'rare', description: '一弦一柱思华年' },
  '大道至简': { text: '大道至简', category: 'imagery', weight: 3, rarity: 'legendary', description: '道家经典理念' },
  '大象无形': { text: '大象无形', category: 'scene', weight: 3, rarity: 'legendary', description: '《道德经》名句' },
}

export const createRewardPhrase = (text: string): Phrase | null => {
  const rp = rewardPhrases[text]
  if (!rp) return null
  return createPhrase(rp.text, rp.category, rp.weight, rp.rarity, createRewardSource(rp.description))
}

export const refreshPoolByCategory = (category: PhraseCategory, count: number): Phrase[] => {
  const allOfCategory = getAllPhrases().filter(p => p.category === category)
  const shuffled = [...allOfCategory].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const getAllPhrases = (): Phrase[] => [
  ...scenePhrases,
  ...emotionPhrases,
  ...timePhrases,
  ...actionPhrases,
  ...imageryPhrases,
]

export const getPhrasesByRarity = (rarity: PhraseRarity): Phrase[] => {
  return getAllPhrases().filter(p => p.rarity === rarity)
}

export const getPhraseRarity = (text: string): PhraseRarity => {
  const basePhrase = getAllPhrases().find(p => p.text === text)
  if (basePhrase) return basePhrase.rarity
  const rewardPhrase = rewardPhrases[text]
  if (rewardPhrase) return rewardPhrase.rarity
  return 'common'
}

const pickRandom = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export interface DropConfig {
  totalCount: number
  rarityBoost?: Partial<Record<PhraseRarity, number>>
  themeKeywords?: string[]
  themeMatchBoost?: number
  categoryWeights?: Partial<Record<PhraseCategory, number>>
}

export const dropPhrases = (pool: Phrase[], config: DropConfig): Phrase[] => {
  const { totalCount, rarityBoost = {}, themeKeywords = [], themeMatchBoost = 2, categoryWeights = {} } = config
  
  if (pool.length === 0 || totalCount <= 0) return []
  
  const weightedPool = pool.map(phrase => {
    let weight = 1
    
    const baseRate = rarityDropRates[phrase.rarity] || 0.1
    const boost = rarityBoost[phrase.rarity] || 0
    weight *= baseRate * (1 + boost) * 10
    
    if (themeKeywords.length > 0 && themeKeywords.includes(phrase.text)) {
      weight *= themeMatchBoost
    }
    
    const catWeight = categoryWeights[phrase.category]
    if (catWeight !== undefined) {
      weight *= catWeight
    }
    
    weight *= phrase.weight
    
    return { phrase, weight }
  })
  
  const result: Phrase[] = []
  const available = [...weightedPool]
  
  while (result.length < totalCount && available.length > 0) {
    const totalWeight = available.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    
    let selectedIndex = 0
    for (let i = 0; i < available.length; i++) {
      random -= available[i].weight
      if (random <= 0) {
        selectedIndex = i
        break
      }
    }
    
    result.push(available[selectedIndex].phrase)
    available.splice(selectedIndex, 1)
  }
  
  return result
}

export const generateChapterPhrases = (
  themeKeywords: string[],
  totalCount: number,
  categoryDistribution: Partial<Record<PhraseCategory, number>> = {}
): Phrase[] => {
  const allPhrases = getAllPhrases()
  
  const categories: PhraseCategory[] = ['scene', 'emotion', 'time', 'action', 'imagery']
  const defaultCatWeight = 1 / categories.length
  
  const catWeights: Record<PhraseCategory, number> = {} as Record<PhraseCategory, number>
  categories.forEach(cat => {
    catWeights[cat] = categoryDistribution[cat] ?? defaultCatWeight
  })
  
  return dropPhrases(allPhrases, {
    totalCount,
    themeKeywords,
    themeMatchBoost: 2.5,
    categoryWeights: catWeights
  })
}

export const generateChapterPhrasesWithSource = (
  chapterId: string,
  chapterTitle: string,
  themeKeywords: string[],
  totalCount: number,
  categoryDistribution: Partial<Record<PhraseCategory, number>> = {}
): Phrase[] => {
  const dropped = generateChapterPhrases(themeKeywords, totalCount, categoryDistribution)
  const source = createChapterSource(chapterId, chapterTitle)
  return dropped.map(phrase => ({
    ...phrase,
    id: pid(),
    source
  }))
}

export const categoryLabels: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

export const categoryColors: Record<PhraseCategory, string> = {
  scene: '#5b7a8c',
  emotion: '#8b4557',
  time: '#c9a86c',
  action: '#6b8e6b',
  imagery: '#7a5b8c'
}

export const generateThemePhrases = (
  theme: Theme,
  totalCount: number,
  chapterId: string,
  chapterTitle: string
): Phrase[] => {
  const allPhrases = getAllPhrases()
  
  let filteredPhrases = [...allPhrases]
  
  if (theme.wordPool.excludedPhrases && theme.wordPool.excludedPhrases.length > 0) {
    const excludedSet = new Set(theme.wordPool.excludedPhrases)
    filteredPhrases = filteredPhrases.filter(p => !excludedSet.has(p.text))
  }
  
  const config: DropConfig = {
    totalCount,
    themeKeywords: theme.wordPool.keywords,
    themeMatchBoost: 2.5,
    categoryWeights: theme.wordPool.categoryWeights,
    rarityBoost: theme.wordPool.rarityBoost
  }
  
  const dropped = dropPhrases(filteredPhrases, config)
  const source = createChapterSource(chapterId, chapterTitle)
  
  return dropped.map(phrase => ({
    ...phrase,
    id: pid(),
    source
  }))
}

export const getThemeEnhancedPhrases = (
  basePhrases: Phrase[],
  theme: Theme
): Phrase[] => {
  const { keywords = [], categoryWeights = {}, rarityBoost = {} } = theme.wordPool
  
  if (keywords.length === 0 && Object.keys(categoryWeights).length === 0 && Object.keys(rarityBoost).length === 0) {
    return basePhrases
  }
  
  const weightedPhrases = basePhrases.map(phrase => {
    let score = 0
    
    if (keywords.includes(phrase.text)) {
      score += 3
    }
    
    const catWeight = categoryWeights[phrase.category]
    if (catWeight !== undefined) {
      score += catWeight
    }
    
    const rareBoost = rarityBoost[phrase.rarity]
    if (rareBoost !== undefined) {
      score += rareBoost
    }
    
    return { phrase, score }
  })
  
  const sorted = weightedPhrases.sort((a, b) => b.score - a.score)
  
  return sorted.map(item => item.phrase)
}
