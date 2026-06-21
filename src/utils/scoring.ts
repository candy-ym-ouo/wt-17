import type { Phrase, ScoreBreakdown, Chapter, ScoreWeights, DiagnosticReport, ScoreLoss, ThemeDeviation, WordClassImbalance, RevisionStep, CategoryBalance, PhraseCategory, PhraseRarity, Theme, TitleOption, TitleStrategyType, PhasedGuidance, CountPhase, ScorePhase, CategoryPhase, CategoryInsight } from '@/types'
import { rarityScoreBonus } from '@/data/phrases'

const DEFAULT_WEIGHTS: ScoreWeights = {
  coherence: 0.25,
  imagery: 0.2,
  rhythm: 0.15,
  themeMatch: 0.25
}

export const resolveWeights = (boosts: Record<string, number>, themeWeights?: Partial<ScoreWeights>): ScoreWeights => {
  const w = { ...DEFAULT_WEIGHTS }
  
  if (themeWeights) {
    Object.entries(themeWeights).forEach(([dim, val]) => {
      if (dim in w && typeof val === 'number') {
        (w as any)[dim] = val
      }
    })
  }
  
  for (const [dim, boost] of Object.entries(boosts)) {
    if (dim in w) {
      (w as any)[dim] += boost
    }
  }
  const total = w.coherence + w.imagery + w.rhythm + w.themeMatch
  if (total > 0) {
    w.coherence /= total
    w.imagery /= total
    w.rhythm /= total
    w.themeMatch /= total
  }
  return w
}

const categoryRelations: Record<string, number> = {
  'scene-scene': 0.7,
  'scene-imagery': 0.9,
  'scene-time': 0.6,
  'scene-emotion': 0.5,
  'scene-action': 0.5,
  'emotion-emotion': 0.6,
  'emotion-imagery': 0.8,
  'emotion-time': 0.5,
  'emotion-action': 0.7,
  'time-time': 0.5,
  'time-imagery': 0.6,
  'time-action': 0.5,
  'action-action': 0.5,
  'action-imagery': 0.7,
  'imagery-imagery': 0.9,
}

const getCategoryRelation = (c1: string, c2: string): number => {
  if (c1 === c2) return categoryRelations[`${c1}-${c2}`] || 0.5
  return categoryRelations[`${c1}-${c2}`] || categoryRelations[`${c2}-${c1}`] || 0.3
}

const characterCounts = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export const calculateScore = (phrases: Phrase[], chapter: Chapter, weightBoosts?: Record<string, number>, theme?: Theme): ScoreBreakdown => {
  if (phrases.length === 0) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }

  const coherence = calcCoherence(phrases)
  const imagery = calcImagery(phrases)
  const rhythm = calcRhythm(phrases)
  const themeMatch = theme && theme.wordPool.keywords.length > 0 
    ? calcThemeMatchWithTheme(phrases, theme) 
    : calcThemeMatch(phrases, chapter)
  
  const rarityBonus = calcRarityBonus(phrases)
  const themeBonus = theme?.scoring.themeMatchBonus || 0
  
  const weights = resolveWeights(weightBoosts || {}, theme?.scoring.scoreWeights)
  const countBonus = Math.min(phrases.length / chapter.targetPhraseCount, 1)
  const baseScore = (coherence * weights.coherence + imagery * weights.imagery + rhythm * weights.rhythm + themeMatch * weights.themeMatch) * 100
  const total = Math.round(baseScore * countBonus * (1 + rarityBonus + themeBonus))

  return {
    coherence: Math.round(coherence * 100),
    imagery: Math.round(imagery * 100),
    rhythm: Math.round(rhythm * 100),
    themeMatch: Math.round(themeMatch * 100),
    total
  }
}

const calcRarityBonus = (phrases: Phrase[]): number => {
  if (phrases.length === 0) return 0
  
  let totalBonus = 0
  phrases.forEach(p => {
    totalBonus += rarityScoreBonus[p.rarity] || 0
  })
  
  return Math.min(totalBonus / phrases.length, 0.2)
}

const calcCoherence = (phrases: Phrase[]): number => {
  if (phrases.length < 2) return 0.3
  let totalRel = 0
  let pairs = 0
  for (let i = 0; i < phrases.length; i++) {
    for (let j = i + 1; j < phrases.length; j++) {
      totalRel += getCategoryRelation(phrases[i].category, phrases[j].category)
      pairs++
    }
  }
  return pairs > 0 ? totalRel / pairs : 0
}

const calcImagery = (phrases: Phrase[]): number => {
  const imageryCount = phrases.filter(p => p.category === 'imagery' || p.category === 'scene').length
  const diversity = new Set(phrases.map(p => p.category)).size
  const baseScore = imageryCount / phrases.length
  const diversityBonus = Math.min(diversity / 5, 1) * 0.4
  return Math.min(baseScore * 0.6 + diversityBonus, 1)
}

const calcRhythm = (phrases: Phrase[]): number => {
  if (phrases.length === 0) return 0
  const lengths = phrases.map(p => p.text.length)
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length
  
  let variance = 0
  lengths.forEach(l => {
    variance += Math.abs(l - avgLen)
  })
  variance = variance / lengths.length
  
  const rhythmScore = 1 - Math.min(variance / 2, 1)
  
  const charPatternBonus = phrases.length >= 3 ? 
    (lengths.filter(l => l === 2 || l === 3).length / phrases.length) * 0.3 : 0
  
  return Math.min(rhythmScore * 0.7 + charPatternBonus, 1)
}

const themeKeywords: Record<string, string[]> = {
  '春夜': ['明月', '落花', '清风', '垂柳', '黄昏', '春深', '相思', '缱绻', '清欢'],
  '秋思': ['残阳', '荒原', '寒烟', '古道', '西风', '归雁', '离愁', '寂寥', '惆怅', '日暮', '秋凉'],
  '归乡': ['初雪', '夜雨', '繁星', '古寺', '故人', '青灯', '素笺', '旧约', '相思', '遥望', '凭栏'],
  '江湖': ['夜雨', '翠竹', '长河', '古寺', '锦瑟', '玉笛', '青灯', '残梦', '淡泊', '抚琴', '落笔', '独酌'],
  '自由': []
}

const rarityWeight: Record<PhraseRarity, number> = {
  common: 1,
  rare: 1.3,
  epic: 1.6,
  legendary: 2
}

const calcThemeMatchWithTheme = (phrases: Phrase[], theme: Theme): number => {
  const keywords = theme.wordPool.keywords || []
  if (keywords.length === 0) return 0.85
  
  let matchWeight = 0
  let totalWeight = 0
  
  phrases.forEach(p => {
    const rWeight = rarityWeight[p.rarity] || 1
    totalWeight += rWeight
    if (keywords.includes(p.text)) {
      matchWeight += rWeight
    }
  })
  
  const directMatch = totalWeight > 0 ? matchWeight / totalWeight : 0
  
  const preferredCategories = theme.scoring.preferredCategories || []
  const categoryMatch = preferredCategories.length > 0
    ? phrases.filter(p => preferredCategories.includes(p.category)).length / phrases.length
    : phrases.filter(p => 
        p.category === 'scene' || p.category === 'imagery' || p.category === 'emotion'
      ).length / phrases.length
  
  return Math.min(directMatch * 0.65 + categoryMatch * 0.35, 1)
}

const calcThemeMatch = (phrases: Phrase[], chapter: Chapter): number => {
  if (chapter.theme === '自由') return 0.85
  const keywords = themeKeywords[chapter.theme] || []
  if (keywords.length === 0) return 0.6
  
  let matchWeight = 0
  let totalWeight = 0
  
  phrases.forEach(p => {
    const rWeight = rarityWeight[p.rarity] || 1
    totalWeight += rWeight
    if (keywords.includes(p.text)) {
      matchWeight += rWeight
    }
  })
  
  const directMatch = totalWeight > 0 ? matchWeight / totalWeight : 0
  
  const categoryMatch = phrases.filter(p => 
    p.category === 'scene' || p.category === 'imagery' || p.category === 'emotion'
  ).length / phrases.length
  
  return Math.min(directMatch * 0.65 + categoryMatch * 0.35, 1)
}

export const getScoreGrade = (total: number): { grade: string; color: string; comment: string } => {
  if (total >= 90) return { grade: '神品', color: '#c9a86c', comment: '此曲只应天上有，人间能得几回闻。' }
  if (total >= 75) return { grade: '妙品', color: '#7a9ea8', comment: '笔落惊风雨，诗成泣鬼神。' }
  if (total >= 60) return { grade: '佳品', color: '#6b8e6b', comment: '清水出芙蓉，天然去雕饰。' }
  if (total >= 40) return { grade: '能品', color: '#a8a498', comment: '初窥门径，尚可雕琢。' }
  return { grade: '习作', color: '#6b6858', comment: '诗无达诂，意蕴由心。' }
}

export const generatePoemTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): string => {
  const options = generatePoemTitleOptions(phrases, theme, chapter)
  return options.length > 0 ? options[0].title : '无题'
}

const STRATEGY_LABELS: Record<TitleStrategyType, string> = {
  theme_match: '主题命中',
  core_imagery: '核心意象',
  composition_structure: '作品结构',
  emotional_core: '情感核心',
  classical_style: '古典雅致'
}

const STRATEGY_DESCRIPTIONS: Record<TitleStrategyType, string> = {
  theme_match: '紧扣章节主题，选用高契合度关键词',
  core_imagery: '提取最具画面感的核心意象词汇',
  composition_structure: '依据词类分布，构建对仗结构',
  emotional_core: '以情感为魂，配景物烘托',
  classical_style: '遵循古典题名范式，雅致凝练'
}

const getThemeKeywords = (theme?: Theme, chapter?: Chapter): string[] => {
  if (theme && theme.wordPool.keywords.length > 0) {
    return theme.wordPool.keywords
  }
  if (chapter) {
    return themeKeywords[chapter.theme] || []
  }
  return []
}

const sortByRarity = (phrases: Phrase[]): Phrase[] => {
  const rarityOrder: Record<PhraseRarity, number> = {
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1
  }
  return [...phrases].sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0))
}

const pickFromCategories = (phrases: Phrase[], categories: PhraseCategory[], max: number): Phrase[] => {
  return phrases.filter(p => categories.includes(p.category)).slice(0, max)
}

const applyTemplate = (words: string[], template?: string, connector: string = '·'): string => {
  if (template && words.length >= 2) {
    let result = template
    words.forEach((word, index) => {
      result = result.replace(new RegExp(`\\{word${index + 1}\\}`, 'g'), word)
    })
    return result
  }
  return words.join(connector)
}

const dedupeTitles = (options: TitleOption[]): TitleOption[] => {
  const seen = new Set<string>()
  return options.filter(opt => {
    if (seen.has(opt.title)) return false
    seen.add(opt.title)
    return true
  })
}

const CHAPTER_TITLE_PATTERNS: Record<string, { connector: string; preferCategories: PhraseCategory[]; maxWords: number; template?: string }> = {
  '春夜': { connector: '·', preferCategories: ['scene', 'imagery', 'emotion'], maxWords: 2, template: '春夜·{word1}·{word2}' },
  '秋思': { connector: '·', preferCategories: ['scene', 'emotion', 'imagery'], maxWords: 2, template: '秋思·{word1}·{word2}' },
  '归乡': { connector: '·', preferCategories: ['emotion', 'scene', 'imagery'], maxWords: 2, template: '归·{word1}·{word2}' },
  '江湖': { connector: '·', preferCategories: ['imagery', 'action', 'scene'], maxWords: 2, template: '江湖·{word1}·{word2}' },
  '自由': { connector: '·', preferCategories: ['scene', 'imagery', 'emotion'], maxWords: 2 }
}

const generateThemeMatchTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption | null => {
  if (phrases.length === 0) return null

  const keywords = getThemeKeywords(theme, chapter)
  let connector = theme?.titlePattern.connector || '·'
  let template = theme?.titlePattern.template
  let preferCategories = theme?.titlePattern.preferCategories || ['scene', 'imagery', 'emotion']
  let maxWords = theme?.titlePattern.maxWords || 2

  if (!theme && chapter) {
    const chapterPattern = CHAPTER_TITLE_PATTERNS[chapter.theme]
    if (chapterPattern) {
      connector = chapterPattern.connector
      template = chapterPattern.template
      preferCategories = chapterPattern.preferCategories
      maxWords = chapterPattern.maxWords
    }
  }

  let matchedPhrases: Phrase[] = []
  if (keywords.length > 0) {
    matchedPhrases = sortByRarity(phrases.filter(p => keywords.includes(p.text)))
  }
  if (matchedPhrases.length < maxWords) {
    const remaining = pickFromCategories(
      phrases.filter(p => !matchedPhrases.find(m => m.id === p.id)),
      preferCategories,
      maxWords - matchedPhrases.length
    )
    matchedPhrases = [...matchedPhrases, ...remaining]
  }

  if (matchedPhrases.length === 0) {
    matchedPhrases = [phrases[0]]
  }

  const words = matchedPhrases.slice(0, maxWords).map(p => p.text)
  const title = applyTemplate(words, template, connector)

  const matchScore = keywords.length > 0
    ? Math.round((matchedPhrases.filter(p => keywords.includes(p.text)).length / Math.min(maxWords, phrases.length)) * 100)
    : 70

  return {
    title,
    strategy: 'theme_match',
    strategyLabel: STRATEGY_LABELS.theme_match,
    description: chapter && !theme
      ? `紧扣「${chapter.theme}」主题，选用高契合度关键词`
      : STRATEGY_DESCRIPTIONS.theme_match,
    keywords: words,
    score: Math.min(matchScore + (matchedPhrases.length >= maxWords ? 10 : 0), 100)
  }
}

const generateCoreImageryTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption | null => {
  if (phrases.length === 0) return null

  const connector = theme?.titlePattern.connector || '·'
  const imageryPhrases = sortByRarity(phrases.filter(p => p.category === 'imagery' || p.category === 'scene'))

  if (imageryPhrases.length === 0) return null

  const maxWords = 2
  const selected = imageryPhrases.slice(0, maxWords)
  const words = selected.map(p => p.text)
  const title = words.join(connector)

  const imageryScore = Math.round((selected.length / maxWords) * 80) + (selected.some(p => p.rarity === 'epic' || p.rarity === 'legendary') ? 20 : 10)

  return {
    title,
    strategy: 'core_imagery',
    strategyLabel: STRATEGY_LABELS.core_imagery,
    description: STRATEGY_DESCRIPTIONS.core_imagery,
    keywords: words,
    score: Math.min(imageryScore, 100)
  }
}

const generateCompositionStructureTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption | null => {
  if (phrases.length === 0) return null

  const connector = theme?.titlePattern.connector || '·'
  const scenePhrases = phrases.filter(p => p.category === 'scene')
  const emotionPhrases = phrases.filter(p => p.category === 'emotion')
  const actionPhrases = phrases.filter(p => p.category === 'action')
  const timePhrases = phrases.filter(p => p.category === 'time')

  let words: string[] = []

  if (scenePhrases.length > 0 && emotionPhrases.length > 0) {
    words = [scenePhrases[0].text, emotionPhrases[0].text]
  } else if (timePhrases.length > 0 && scenePhrases.length > 0) {
    words = [timePhrases[0].text, scenePhrases[0].text]
  } else if (scenePhrases.length >= 2) {
    words = sortByRarity(scenePhrases).slice(0, 2).map(p => p.text)
  } else if (actionPhrases.length > 0 && scenePhrases.length > 0) {
    words = [scenePhrases[0].text, actionPhrases[0].text]
  } else if (emotionPhrases.length >= 2) {
    words = sortByRarity(emotionPhrases).slice(0, 2).map(p => p.text)
  } else {
    return null
  }

  const title = words.join(connector)
  const categoriesUsed = new Set(words.map((_, i) => i === 0 ? 'scene' : 'emotion')).size
  const structureScore = 70 + categoriesUsed * 10 + (words.length >= 2 ? 10 : 0)

  return {
    title,
    strategy: 'composition_structure',
    strategyLabel: STRATEGY_LABELS.composition_structure,
    description: STRATEGY_DESCRIPTIONS.composition_structure,
    keywords: words,
    score: Math.min(structureScore, 100)
  }
}

const generateEmotionalCoreTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption | null => {
  if (phrases.length === 0) return null

  const connector = theme?.titlePattern.connector || '·'
  const emotionPhrases = sortByRarity(phrases.filter(p => p.category === 'emotion'))
  const scenePhrases = phrases.filter(p => p.category === 'scene')
  const imageryPhrases = phrases.filter(p => p.category === 'imagery')

  if (emotionPhrases.length === 0) return null

  const words: string[] = []
  const supporting = [...scenePhrases, ...imageryPhrases]

  words.push(emotionPhrases[0].text)
  if (supporting.length > 0) {
    words.push(sortByRarity(supporting)[0].text)
  }

  if (words.length < 2) return null

  const title = words.join(connector)
  const emotionScore = emotionPhrases.length > 0 ? 60 : 40
  const hasSupport = supporting.length > 0 ? 25 : 0
  const rareBonus = (emotionPhrases[0].rarity === 'epic' || emotionPhrases[0].rarity === 'legendary') ? 15 : 5

  return {
    title,
    strategy: 'emotional_core',
    strategyLabel: STRATEGY_LABELS.emotional_core,
    description: STRATEGY_DESCRIPTIONS.emotional_core,
    keywords: words,
    score: Math.min(emotionScore + hasSupport + rareBonus, 100)
  }
}

const CLASSICAL_PATTERNS = [
  { prefix: '忆', suffix: '', requireWords: 1 },
  { prefix: '咏', suffix: '', requireWords: 1 },
  { prefix: '怀', suffix: '', requireWords: 1 },
  { prefix: '', suffix: '吟', requireWords: 1 },
  { prefix: '', suffix: '赋', requireWords: 1 },
  { prefix: '题', suffix: '', requireWords: 1 },
  { prefix: '', suffix: '引', requireWords: 1 }
]

const generateClassicalStyleTitle = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption | null => {
  if (phrases.length === 0) return null

  const preferCategories = theme?.titlePattern.preferCategories || ['scene', 'imagery', 'emotion']
  const coreWords = pickFromCategories(sortByRarity(phrases), preferCategories, 2)

  if (coreWords.length === 0) return null

  const candidates: string[] = []
  const mainWord = coreWords[0].text

  for (const pattern of CLASSICAL_PATTERNS) {
    if (mainWord.length <= 3) {
      const candidate = `${pattern.prefix}${mainWord}${pattern.suffix}`
      candidates.push(candidate)
    }
  }

  if (coreWords.length >= 2) {
    candidates.push(`${mainWord}·${coreWords[1].text}`)
    candidates.push(`${coreWords[1].text}${mainWord}`)
  }

  candidates.push(mainWord)

  const uniqueCandidates = [...new Set(candidates)]
  const title = uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)]

  const classicalScore = (mainWord.length <= 3 ? 50 : 30) +
    (coreWords.some(p => p.rarity === 'rare' || p.rarity === 'epic' || p.rarity === 'legendary') ? 30 : 15) +
    (coreWords.length >= 2 ? 20 : 10)

  return {
    title,
    strategy: 'classical_style',
    strategyLabel: STRATEGY_LABELS.classical_style,
    description: STRATEGY_DESCRIPTIONS.classical_style,
    keywords: coreWords.map(p => p.text),
    score: Math.min(classicalScore, 100)
  }
}

export const generatePoemTitleOptions = (phrases: Phrase[], theme?: Theme, chapter?: Chapter): TitleOption[] => {
  if (phrases.length === 0) {
    return [{
      title: '无题',
      strategy: 'classical_style',
      strategyLabel: STRATEGY_LABELS.classical_style,
      description: '画布为空，题名无题',
      keywords: [],
      score: 50
    }]
  }

  const generators = [
    generateThemeMatchTitle,
    generateCoreImageryTitle,
    generateCompositionStructureTitle,
    generateEmotionalCoreTitle,
    generateClassicalStyleTitle
  ]

  const results: TitleOption[] = []
  for (const gen of generators) {
    const result = gen(phrases, theme, chapter)
    if (result && result.title.trim().length > 0) {
      results.push(result)
    }
  }

  const deduped = dedupeTitles(results)
  const sorted = deduped.sort((a, b) => b.score - a.score)

  return sorted.length > 0 ? sorted : [{
    title: phrases[0].text,
    strategy: 'core_imagery',
    strategyLabel: STRATEGY_LABELS.core_imagery,
    description: '取首词为题',
    keywords: [phrases[0].text],
    score: 50
  }]
}

const DIMENSION_LABELS: Record<string, string> = {
  coherence: '连贯性',
  imagery: '意象',
  rhythm: '韵律',
  themeMatch: '契合'
}

const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

const IDEAL_CATEGORY_PERCENTAGES: Record<PhraseCategory, number> = {
  scene: 0.25,
  imagery: 0.25,
  emotion: 0.2,
  time: 0.15,
  action: 0.15
}

const getSeverity = (lossPoints: number): 'high' | 'medium' | 'low' => {
  if (lossPoints >= 30) return 'high'
  if (lossPoints >= 15) return 'medium'
  return 'low'
}

const analyzeCoherenceLoss = (phrases: Phrase[], rawScore: number): ScoreLoss => {
  const lossPoints = 100 - rawScore
  const reasons: string[] = []

  if (phrases.length < 2) {
    reasons.push('词句过少，尚未形成语义链')
  } else {
    const categories = new Set(phrases.map(p => p.category))
    if (categories.size <= 1) {
      reasons.push('词类单一，缺少跨维度呼应')
    }

    const sceneCount = phrases.filter(p => p.category === 'scene').length
    const emotionCount = phrases.filter(p => p.category === 'emotion').length
    if (sceneCount > 0 && emotionCount === 0) {
      reasons.push('有景无情，情景未能交融')
    }
    if (emotionCount > 0 && sceneCount === 0) {
      reasons.push('有情无景，情感缺乏载体')
    }

    const lowRelationPairs = []
    for (let i = 0; i < phrases.length; i++) {
      for (let j = i + 1; j < phrases.length; j++) {
        const rel = getCategoryRelation(phrases[i].category, phrases[j].category)
        if (rel < 0.5) {
          lowRelationPairs.push(`${phrases[i].text}/${phrases[j].text}`)
        }
      }
    }
    if (lowRelationPairs.length > 0 && lossPoints >= 20) {
      reasons.push(`部分组合语义疏离：${lowRelationPairs.slice(0, 2).join('、')}`)
    }
  }

  if (reasons.length === 0) {
    reasons.push('细微之处尚可打磨')
  }

  return {
    dimension: 'coherence',
    dimensionLabel: DIMENSION_LABELS.coherence,
    lossPoints,
    reasons,
    severity: getSeverity(lossPoints)
  }
}

const analyzeImageryLoss = (phrases: Phrase[], rawScore: number): ScoreLoss => {
  const lossPoints = 100 - rawScore
  const reasons: string[] = []

  const imageryCount = phrases.filter(p => p.category === 'imagery' || p.category === 'scene').length
  if (phrases.length > 0 && imageryCount / phrases.length < 0.3) {
    reasons.push('意象类词汇占比不足，画面感薄弱')
  }

  const diversity = new Set(phrases.map(p => p.category)).size
  if (diversity < 3) {
    reasons.push('词类多样性不足，层次单调')
  }

  const emotionCount = phrases.filter(p => p.category === 'emotion').length
  if (emotionCount === 0 && phrases.length >= 3) {
    reasons.push('缺乏情感词汇，意境难以动人')
  }

  if (reasons.length === 0) {
    reasons.push('意象构建尚可，可进一步求新')
  }

  return {
    dimension: 'imagery',
    dimensionLabel: DIMENSION_LABELS.imagery,
    lossPoints,
    reasons,
    severity: getSeverity(lossPoints)
  }
}

const analyzeRhythmLoss = (phrases: Phrase[], rawScore: number): ScoreLoss => {
  const lossPoints = 100 - rawScore
  const reasons: string[] = []

  if (phrases.length === 0) {
    reasons.push('待选词句以观韵律')
  } else {
    const lengths = phrases.map(p => p.text.length)
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const variance = lengths.reduce((sum, l) => sum + Math.abs(l - avgLen), 0) / lengths.length

    if (variance > 1.5) {
      reasons.push('词句长短悬殊，节奏失谐')
    }

    const twoCharCount = lengths.filter(l => l === 2).length
    const threeCharCount = lengths.filter(l => l === 3).length
    if (twoCharCount + threeCharCount < phrases.length * 0.5 && phrases.length >= 3) {
      reasons.push('二字三字格偏少，读来不够凝练')
    }

    const hasPattern = lengths.every((l, i) => i === 0 || l === lengths[0])
    if (hasPattern && phrases.length >= 3 && lengths[0] !== 2 && lengths[0] !== 3) {
      reasons.push('全同字数虽整，但少了错落之美')
    }
  }

  if (reasons.length === 0) {
    reasons.push('韵律和谐，可追求更高境界')
  }

  return {
    dimension: 'rhythm',
    dimensionLabel: DIMENSION_LABELS.rhythm,
    lossPoints,
    reasons,
    severity: getSeverity(lossPoints)
  }
}

const analyzeThemeMatchLoss = (phrases: Phrase[], chapter: Chapter, rawScore: number): ScoreLoss => {
  const lossPoints = 100 - rawScore
  const reasons: string[] = []

  if (chapter.theme === '自由') {
    reasons.push('自由主题无拘束，随心而作即可')
  } else {
    const keywords = themeKeywords[chapter.theme] || []
    const matchedKeywords = phrases.filter(p => keywords.includes(p.text)).map(p => p.text)

    if (matchedKeywords.length === 0 && phrases.length >= 2) {
      reasons.push(`尚未融入「${chapter.theme}」主题关键词`)
    } else if (matchedKeywords.length > 0 && matchedKeywords.length < Math.ceil(phrases.length * 0.4)) {
      reasons.push(`主题词占比偏低，已用：${matchedKeywords.join('、')}`)
    }

    const sceneImageryEmotion = phrases.filter(p =>
      p.category === 'scene' || p.category === 'imagery' || p.category === 'emotion'
    ).length
    if (phrases.length > 0 && sceneImageryEmotion / phrases.length < 0.5) {
      reasons.push('写景抒情类词汇不足，主题意境难彰')
    }
  }

  if (reasons.length === 0) {
    reasons.push('扣题尚可，可深化意境')
  }

  return {
    dimension: 'themeMatch',
    dimensionLabel: DIMENSION_LABELS.themeMatch,
    lossPoints,
    reasons,
    severity: getSeverity(lossPoints)
  }
}

const analyzeThemeDeviation = (phrases: Phrase[], chapter: Chapter): ThemeDeviation => {
  if (phrases.length === 0) {
    return {
      isDeviated: false,
      deviationDegree: 0,
      currentKeywords: [],
      missingKeywords: [],
      suggestion: '开始选择词句以检测主题契合度'
    }
  }

  if (chapter.theme === '自由') {
    return {
      isDeviated: false,
      deviationDegree: 0,
      currentKeywords: phrases.map(p => p.text),
      missingKeywords: [],
      suggestion: '自由创作，无需拘泥于特定主题'
    }
  }

  const keywords = themeKeywords[chapter.theme] || []
  const currentKeywords = phrases.filter(p => keywords.includes(p.text)).map(p => p.text)
  const usedWords = new Set(phrases.map(p => p.text))
  const missingKeywords = keywords.filter(k => !usedWords.has(k))

  const matchRatio = keywords.length > 0 ? currentKeywords.length / Math.min(phrases.length, keywords.length) : 0
  const deviationDegree = Math.round((1 - Math.min(matchRatio, 1)) * 100)

  const isDeviated = deviationDegree >= 50 && phrases.length >= 3

  let suggestion = ''
  if (currentKeywords.length === 0) {
    suggestion = `建议引入「${chapter.theme}」主题词汇，如：${keywords.slice(0, 4).join('、')}`
  } else if (isDeviated) {
    suggestion = `主题偏离较大，可替换部分非关键词为：${missingKeywords.slice(0, 3).join('、')}`
  } else if (deviationDegree >= 30) {
    suggestion = `略有偏离，可补充：${missingKeywords.slice(0, 2).join('、')}`
  } else {
    suggestion = '主题契合良好，可进一步深化'
  }

  return {
    isDeviated,
    deviationDegree,
    currentKeywords,
    missingKeywords: missingKeywords.slice(0, 5),
    suggestion
  }
}

const analyzeWordClassImbalance = (phrases: Phrase[]): WordClassImbalance => {
  const allCategories: PhraseCategory[] = ['scene', 'emotion', 'time', 'action', 'imagery']
  const balances: CategoryBalance[] = []
  const total = phrases.length || 1

  allCategories.forEach(cat => {
    const count = phrases.filter(p => p.category === cat).length
    const percentage = count / total
    const ideal = IDEAL_CATEGORY_PERCENTAGES[cat]
    let status: 'balanced' | 'excess' | 'deficit' = 'balanced'

    if (percentage > ideal * 1.6 && count >= 2) {
      status = 'excess'
    } else if (percentage < ideal * 0.4 && phrases.length >= 4) {
      status = 'deficit'
    }

    balances.push({
      category: cat,
      label: CATEGORY_LABELS[cat],
      count,
      percentage,
      idealPercentage: ideal,
      status
    })
  })

  const dominantCategories = balances.filter(b => b.status === 'excess').map(b => b.category)
  const missingCategories = balances.filter(b => b.status === 'deficit').map(b => b.category)
  const isImbalanced = dominantCategories.length > 0 || missingCategories.length > 0

  let suggestion = ''
  if (phrases.length < 3) {
    suggestion = '词句较少，词类分布仅供参考'
  } else if (!isImbalanced) {
    suggestion = '词类分布均衡，结构合理'
  } else {
    const parts: string[] = []
    if (dominantCategories.length > 0) {
      parts.push(`${dominantCategories.map(c => CATEGORY_LABELS[c]).join('、')}偏多`)
    }
    if (missingCategories.length > 0) {
      parts.push(`${missingCategories.map(c => CATEGORY_LABELS[c]).join('、')}不足`)
    }
    suggestion = parts.join('，') + '，可适当调整'
  }

  return {
    isImbalanced,
    balances,
    dominantCategories,
    missingCategories,
    suggestion
  }
}

const buildRevisionPath = (
  scoreLosses: ScoreLoss[],
  themeDeviation: ThemeDeviation,
  wordClassImbalance: WordClassImbalance,
  phrasesCount: number,
  targetCount: number
): RevisionStep[] => {
  const steps: RevisionStep[] = []
  let order = 1

  const highLoss = scoreLosses.filter(s => s.severity === 'high').sort((a, b) => b.lossPoints - a.lossPoints)
  const mediumLoss = scoreLosses.filter(s => s.severity === 'medium').sort((a, b) => b.lossPoints - a.lossPoints)

  if (phrasesCount < targetCount * 0.6) {
    steps.push({
      order: order++,
      title: '补足词句数量',
      description: `当前 ${phrasesCount} / 目标 ${targetCount}，建议先选足基础词句`,
      action: `从词池中再选取 ${targetCount - phrasesCount} 个词句`,
      priority: 'critical'
    })
  }

  if (themeDeviation.isDeviated) {
    steps.push({
      order: order++,
      title: '修正主题偏差',
      description: themeDeviation.suggestion,
      action: `引入关键词：${themeDeviation.missingKeywords.slice(0, 3).join('、')}`,
      priority: 'critical',
      dimension: 'themeMatch'
    })
  }

  highLoss.forEach(loss => {
    if (steps.length >= 5) return
    const criticalLoss = loss.reasons[0] || '关键维度需优化'
    steps.push({
      order: order++,
      title: `提升${loss.dimensionLabel}`,
      description: `当前 ${100 - loss.lossPoints} 分，失分 ${loss.lossPoints} 分`,
      action: criticalLoss,
      priority: 'critical',
      dimension: loss.dimension
    })
  })

  if (wordClassImbalance.isImbalanced) {
    if (steps.length < 5) {
      steps.push({
        order: order++,
        title: '调整词类结构',
        description: wordClassImbalance.suggestion,
        action: wordClassImbalance.missingCategories.length > 0
          ? `增加${wordClassImbalance.missingCategories.map(c => CATEGORY_LABELS[c]).join('、')}类词汇`
          : `减少${wordClassImbalance.dominantCategories.map(c => CATEGORY_LABELS[c]).join('、')}类词汇`,
        priority: 'important'
      })
    }
  }

  mediumLoss.forEach(loss => {
    if (steps.length >= 5) return
    steps.push({
      order: order++,
      title: `优化${loss.dimensionLabel}`,
      description: `尚有 ${loss.lossPoints} 分提升空间`,
      action: loss.reasons[0] || '精细打磨以臻完善',
      priority: 'important',
      dimension: loss.dimension
    })
  })

  if (themeDeviation.deviationDegree > 0 && !themeDeviation.isDeviated) {
    if (steps.length < 5) {
      steps.push({
        order: order++,
        title: '深化主题契合',
        description: themeDeviation.suggestion,
        action: themeDeviation.missingKeywords.length > 0
          ? `可选补：${themeDeviation.missingKeywords.slice(0, 2).join('、')}`
          : '从意象层面深化主题表达',
        priority: 'enhancement',
        dimension: 'themeMatch'
      })
    }
  }

  if (steps.length === 0) {
    steps.push({
      order: 1,
      title: '精雕细琢',
      description: '整体已达上乘，可在细微处追求极致',
      action: '品读全篇，寻找画龙点睛之笔',
      priority: 'enhancement'
    })
  }

  return steps.slice(0, 6).map((s, i) => ({ ...s, order: i + 1 }))
}

const generateOverallSuggestion = (
  score: ScoreBreakdown,
  themeDeviation: ThemeDeviation,
  wordClassImbalance: WordClassImbalance
): string => {
  if (score.total === 0) {
    return '铺设词笺，以待诗意流淌。'
  }
  if (score.total >= 85) {
    return '佳作已成，只待最后点睛。'
  }
  if (score.total >= 65) {
    if (themeDeviation.isDeviated) {
      return '辞藻尚佳，唯待紧扣主题。'
    }
    if (wordClassImbalance.isImbalanced) {
      return '骨架初具，微调词类可更和谐。'
    }
    return '初成气象，细润可为佳作。'
  }
  if (score.total >= 40) {
    return '尚在中途，循诊断之路徐行可至。'
  }
  return '初辟鸿蒙，按建议路径步步为营。'
}

export const generateDiagnosticReport = (
  phrases: Phrase[],
  chapter: Chapter,
  score: ScoreBreakdown,
  targetCount: number,
  weightBoosts?: Record<string, number>
): DiagnosticReport => {
  const weights = resolveWeights(weightBoosts || {})

  const rawCoherence = calcCoherence(phrases) * 100
  const rawImagery = calcImagery(phrases) * 100
  const rawRhythm = calcRhythm(phrases) * 100
  const rawThemeMatch = calcThemeMatch(phrases, chapter) * 100

  const scoreLosses: ScoreLoss[] = [
    analyzeCoherenceLoss(phrases, Math.round(rawCoherence)),
    analyzeImageryLoss(phrases, Math.round(rawImagery)),
    analyzeRhythmLoss(phrases, Math.round(rawRhythm)),
    analyzeThemeMatchLoss(phrases, chapter, Math.round(rawThemeMatch))
  ].sort((a, b) => b.lossPoints - a.lossPoints)

  const themeDeviation = analyzeThemeDeviation(phrases, chapter)
  const wordClassImbalance = analyzeWordClassImbalance(phrases)
  const revisionPath = buildRevisionPath(scoreLosses, themeDeviation, wordClassImbalance, phrases.length, targetCount)
  const overallSuggestion = generateOverallSuggestion(score, themeDeviation, wordClassImbalance)

  return {
    scoreLosses,
    themeDeviation,
    wordClassImbalance,
    revisionPath,
    overallSuggestion
  }
}

const CATEGORY_LABELS_GUIDANCE: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

const CHAPTER_THEME_VOCAB: Record<string, {
  openers: string[]
  scene_words: string[]
  emotion_words: string[]
  milestones: string[]
}> = {
  '春夜': {
    openers: ['铺开春夜的词笺', '点亮春江的明月', '唤醒花月的幽思'],
    scene_words: ['明月', '落花', '垂柳'],
    emotion_words: ['相思', '缱绻', '清欢'],
    milestones: ['初遇春月', '花影渐浓', '月夜未央', '诗意盎然', '春宵圆满']
  },
  '秋思': {
    openers: ['踏上秋日的古道', '扬起西风的征帆', '晕开残阳的暮色'],
    scene_words: ['青山', '残阳', '古道'],
    emotion_words: ['离愁', '寂寥', '惆怅'],
    milestones: ['初入秋山', '暮色渐沉', '羁愁暗生', '秋思绵长', '古道斜阳']
  },
  '归乡': {
    openers: ['点亮归乡的灯火', '推开故园的柴门', '掸落旅途的风雪'],
    scene_words: ['初雪', '繁星', '青灯'],
    emotion_words: ['相思', '缱绻'],
    milestones: ['雪夜初程', '灯火在望', '故园渐近', '归心似箭', '温酒重逢']
  },
  '江湖': {
    openers: ['撑开夜雨的油纸伞', '拂去江湖的尘霜', '弹响锦瑟的旧弦'],
    scene_words: ['夜雨', '长河', '古寺'],
    emotion_words: ['淡泊', '怅惘'],
    milestones: ['初入江湖', '夜雨初霁', '琴剑相伴', '十年灯火', '笑傲江湖']
  },
  '自由': {
    openers: ['铺开无垠的宣纸', '放飞无拘的思绪', '开启自由的诗篇'],
    scene_words: ['星辰', '云海'],
    emotion_words: ['清欢', '无我'],
    milestones: ['鸿蒙初辟', '气象初成', '纵横捭阖', '妙造自然', '天人合一']
  }
}

const getThemeVocab = (theme: string) => {
  return CHAPTER_THEME_VOCAB[theme] || CHAPTER_THEME_VOCAB['春夜']
}

const determineCountPhase = (current: number, target: number): CountPhase => {
  if (current === 0) return 'empty'
  const ratio = current / target
  if (ratio < 0.4) return 'early'
  if (ratio < 0.8) return 'building'
  if (ratio <= 1.2) return 'sufficient'
  return 'exceed'
}

const determineScorePhase = (total: number): ScorePhase => {
  if (total === 0) return 'unstarted'
  if (total < 25) return 'nascent'
  if (total < 50) return 'forming'
  if (total < 70) return 'refining'
  if (total < 90) return 'polishing'
  return 'masterpiece'
}

const determineCategoryPhase = (
  phrases: Phrase[],
  insights: CategoryInsight[]
): CategoryPhase => {
  if (phrases.length < 2) return 'mono'
  const usedCategories = new Set(phrases.map(p => p.category))
  const activeCount = usedCategories.size
  if (activeCount <= 1) return 'mono'
  if (activeCount === 2) return 'dual'
  
  const hasExcess = insights.some(i => i.status === 'excess')
  const hasDeficit = insights.some(i => i.status === 'deficit')
  if (activeCount >= 4 && !hasExcess && !hasDeficit) return 'balanced'
  if (activeCount >= 3) return 'varied'
  return 'dual'
}

const buildCategoryInsights = (phrases: Phrase[]): CategoryInsight[] => {
  const allCategories: PhraseCategory[] = ['scene', 'emotion', 'time', 'action', 'imagery']
  const total = phrases.length || 1
  
  return allCategories.map(cat => {
    const count = phrases.filter(p => p.category === cat).length
    const percentage = count / total
    const ideal = IDEAL_CATEGORY_PERCENTAGES[cat]
    let status: CategoryInsight['status'] = 'none'
    
    if (count > 0) {
      if (percentage > ideal * 1.6 && count >= 2) {
        status = 'excess'
      } else if (percentage < ideal * 0.4 && phrases.length >= 4) {
        status = 'deficit'
      } else {
        status = 'balanced'
      }
    }
    
    return {
      category: cat,
      label: CATEGORY_LABELS_GUIDANCE[cat],
      count,
      percentage,
      idealPercentage: ideal,
      status
    }
  })
}

const generateCountSuggestion = (
  phase: CountPhase,
  current: number,
  target: number,
  themeVocab: ReturnType<typeof getThemeVocab>
): string => {
  const diff = target - current
  switch (phase) {
    case 'empty':
      return `先从「${themeVocab.scene_words[0]}」「${themeVocab.emotion_words[0]}」入手，选起首词句`
    case 'early':
      return `再添 ${diff} 个词，不妨引入${themeVocab.scene_words.slice(1, 3).join('、')}等景致`
    case 'building':
      return `接近目标 ${target}，差 ${diff} 词，可补时间或动作类词汇`
    case 'sufficient':
      return current < target
        ? `差 ${diff} 词即可达标，斟酌是否精益求精`
        : current > target
          ? `已超目标 ${current - target} 词，可筛选精简，去芜存菁`
          : `已达目标 ${target} 词，数量合宜`
    case 'exceed':
      return `超出 ${current - target} 词，建议删选，留取最富意境者`
  }
}

const generateCategorySuggestion = (
  phase: CategoryPhase,
  insights: CategoryInsight[],
  themeVocab: ReturnType<typeof getThemeVocab>
): string | undefined => {
  const missing = insights.filter(i => i.status === 'deficit' || (i.count === 0 && i.category !== 'action'))
  const excess = insights.filter(i => i.status === 'excess')
  
  if (phase === 'mono') {
    const used = insights.find(i => i.count > 0)
    if (!used) return undefined
    if (used.category === 'scene') return '仅有景致，缺少情感注入，可加情感或时间类词汇'
    if (used.category === 'emotion') return '唯有情思，缺乏景物依托，试添景物以承载情感'
    return '词类尚单一，可跨类搭配，如景与情、时与动'
  }
  
  if (phase === 'dual') {
    return '词类仅两类，层次单薄，可引入时间或意象类丰富层次'
  }
  
  if (excess.length > 0) {
    const excessLabels = excess.map(e => e.label).join('、')
    return `${excessLabels}偏多，可适度削减`
  }
  
  if (missing.length > 0) {
    const missingLabels = missing.slice(0, 2).map(m => m.label).join('、')
    return `${missingLabels}不足，建议补充`
  }
  
  if (phase === 'balanced') {
    return '词类分布均衡，五大类皆备，结构天成'
  }
  
  return '词类多样，结构初具，可微调以求完美'
}

const generateScoreSuggestion = (
  phase: ScorePhase,
  score: ScoreBreakdown,
  theme: string
): string | undefined => {
  switch (phase) {
    case 'unstarted':
      return undefined
    case 'nascent':
      return '诗意初生，先求数量齐备，再谋质量精进'
    case 'forming':
      return '骨架初成，可留意关键词的融入与长短词的节奏'
    case 'refining': {
      const dimensions: Array<{ key: keyof ScoreBreakdown; label: string }> = [
        { key: 'coherence', label: '连贯性' },
        { key: 'imagery', label: '意象' },
        { key: 'rhythm', label: '韵律' },
        { key: 'themeMatch', label: '契合' }
      ]
      const weakest = dimensions
        .filter(d => d.key !== 'total')
        .sort((a, b) => (score[a.key] as number) - (score[b.key] as number))[0]
      return `${weakest.label}最待提升，可据此方向精修`
    }
    case 'polishing':
      return '已入佳境，细品词句间的呼应，推敲以求更上层楼'
    case 'masterpiece':
      return theme === '自由' ? '神来之笔，自由之境已达化境' : '神品可期，或可斟酌画龙点睛之笔'
  }
}

const PHASE_LABELS: Record<CountPhase, string[]> = {
  empty: ['落笔之始', '鸿蒙初开', '词笺新铺'],
  early: ['遣词之初', '诗意萌生', '初绘丹青'],
  building: ['铺陈之中', '意象渐丰', '脉络渐显'],
  sufficient: ['章法初成', '初具气象', '辞藻已备'],
  exceed: ['洋洋大观', '词满为患', '宜收宜放']
}

const PHASE_ICONS: Record<CountPhase, string> = {
  empty: '○',
  early: '◐',
  building: '◔',
  sufficient: '●',
  exceed: '✦'
}

const TONE_BY_PHASE: Record<ScorePhase, PhasedGuidance['accentTone']> = {
  unstarted: 'cold',
  nascent: 'cold',
  forming: 'warm',
  refining: 'jade',
  polishing: 'violet',
  masterpiece: 'gold'
}

export const generatePhasedGuidance = (
  phrases: Phrase[],
  chapter: Chapter,
  score: ScoreBreakdown,
  targetCount: number
): PhasedGuidance => {
  const current = phrases.length
  const themeVocab = getThemeVocab(chapter.theme)
  
  const countPhase = determineCountPhase(current, targetCount)
  const scorePhase = determineScorePhase(score.total)
  const categoryInsights = buildCategoryInsights(phrases)
  const categoryPhase = determineCategoryPhase(phrases, categoryInsights)
  
  const progressPct = Math.min(current / targetCount * 100, 120)
  
  const countSuggestion = generateCountSuggestion(countPhase, current, targetCount, themeVocab)
  const categorySuggestion = generateCategorySuggestion(categoryPhase, categoryInsights, themeVocab)
  const scoreSuggestion = generateScoreSuggestion(scorePhase, score, chapter.theme)
  
  const opener = themeVocab.openers[Math.floor(Math.random() * themeVocab.openers.length)]
  const milestoneIndex = Math.min(
    Math.floor((current / Math.max(targetCount, 1)) * themeVocab.milestones.length),
    themeVocab.milestones.length - 1
  )
  
  let headline: string
  let primarySuggestion: string
  let encouragement: string
  
  if (countPhase === 'empty') {
    headline = chapter.theme === '自由' ? '自由之境，随心落笔' : `${opener}，且待诗意流淌`
    primarySuggestion = countSuggestion
    encouragement = chapter.hint
  } else if (scorePhase === 'masterpiece') {
    headline = '神品将成，诗意盎然'
    primarySuggestion = scoreSuggestion || '品读全篇，或可直接定稿'
    encouragement = '此曲只应天上有，人间能得几回闻。'
  } else if (countPhase === 'exceed') {
    headline = '词已过盈，宜思取舍'
    primarySuggestion = countSuggestion
    encouragement = '损有余而补不足，精简亦为诗道。'
  } else if (categoryPhase === 'mono' && current >= 2) {
    headline = `${themeVocab.milestones[milestoneIndex]}，层次待丰`
    primarySuggestion = categorySuggestion || countSuggestion
    encouragement = '声色香味触法，缺一不可成诗。'
  } else if (scorePhase === 'polishing') {
    headline = '佳作在望，精雕细琢'
    primarySuggestion = scoreSuggestion || categorySuggestion || countSuggestion
    encouragement = '吟安一个字，捻断数茎须。'
  } else if (countPhase === 'sufficient' && current >= targetCount) {
    headline = `${themeVocab.milestones[Math.min(milestoneIndex, themeVocab.milestones.length - 2)]}，章法已备`
    primarySuggestion = scoreSuggestion || categorySuggestion || '数量已足，可细品词与词的呼应'
    encouragement = '好诗不厌百回改，推敲之间境界生。'
  } else {
    headline = `${themeVocab.milestones[milestoneIndex]}，循序而进`
    const suggestions = [categorySuggestion, scoreSuggestion, countSuggestion].filter(Boolean) as string[]
    primarySuggestion = suggestions[0] || countSuggestion
    encouragement = current < 2
      ? '千里之行，始于足下。'
      : current < targetCount / 2
        ? '不积跬步，无以至千里。'
        : '靡不有初，鲜克有终。'
  }
  
  const secondarySuggestion = (
    countPhase !== 'empty' &&
    scorePhase !== 'unstarted' &&
    (categorySuggestion && categorySuggestion !== primarySuggestion) || undefined
  ) ? categorySuggestion : undefined
  
  const stageLabels = PHASE_LABELS[countPhase]
  const stageLabel = stageLabels[milestoneIndex % stageLabels.length]
  
  return {
    countPhase,
    scorePhase,
    categoryPhase,
    progress: {
      current,
      target: targetCount,
      percentage: progressPct
    },
    categoryInsights,
    headline,
    primarySuggestion,
    secondarySuggestion,
    categorySuggestion,
    scoreSuggestion,
    countSuggestion,
    encouragement,
    stageLabel,
    stageIcon: PHASE_ICONS[countPhase],
    accentTone: TONE_BY_PHASE[scorePhase]
  }
}

export const extractCoreImagery = (phrases: Phrase[], maxCount: number = 4): string[] => {
  if (phrases.length === 0) return []
  
  const imageryPhrases = phrases.filter(p => p.category === 'imagery')
  const scenePhrases = phrases.filter(p => p.category === 'scene')
  const emotionPhrases = phrases.filter(p => p.category === 'emotion')
  
  const sortedImagery = [...imageryPhrases].sort((a, b) => {
    const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }
    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
  })
  
  const sortedScene = [...scenePhrases].sort((a, b) => {
    const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }
    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
  })
  
  const sortedEmotion = [...emotionPhrases].sort((a, b) => {
    const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }
    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
  })
  
  const result: string[] = []
  const seen = new Set<string>()
  
  const addUnique = (text: string) => {
    if (!seen.has(text) && result.length < maxCount) {
      seen.add(text)
      result.push(text)
    }
  }
  
  sortedImagery.forEach(p => addUnique(p.text))
  if (result.length < maxCount) {
    sortedScene.forEach(p => addUnique(p.text))
  }
  if (result.length < maxCount) {
    sortedEmotion.forEach(p => addUnique(p.text))
  }
  
  return result.slice(0, maxCount)
}
