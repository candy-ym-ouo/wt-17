import type { Phrase, ScoreBreakdown, Chapter, ScoreWeights, DiagnosticReport, ScoreLoss, ThemeDeviation, WordClassImbalance, RevisionStep, CategoryBalance, PhraseCategory, PhraseRarity, Theme } from '@/types'
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

export const generatePoemTitle = (phrases: Phrase[], theme?: Theme): string => {
  if (phrases.length === 0) return '无题'
  
  const preferCategories = theme?.titlePattern.preferCategories || ['scene', 'imagery', 'emotion']
  const connector = theme?.titlePattern.connector || '·'
  const maxWords = theme?.titlePattern.maxWords || 2
  const template = theme?.titlePattern.template
  
  const keyPhrases = phrases
    .filter(p => preferCategories.includes(p.category))
    .slice(0, maxWords)
  
  if (keyPhrases.length === 0) {
    return phrases[0].text
  }
  
  const words = keyPhrases.map(p => p.text)
  
  if (template && words.length >= 2) {
    let result = template
    words.forEach((word, index) => {
      result = result.replace(new RegExp(`\\{word${index + 1}\\}`, 'g'), word)
    })
    return result
  }
  
  return words.join(connector)
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
