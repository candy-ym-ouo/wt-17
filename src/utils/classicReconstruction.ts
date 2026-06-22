import type { Phrase, PhraseCategory, ClassicPoem, PoeticGoal, PoeticGoalDimension, DimensionDeviation, DeviationReport, RestorationScore } from '@/types'

const DIMENSION_LABELS: Record<PoeticGoalDimension, string> = {
  mood: '意境',
  imagery: '意象',
  rhythm: '韵律',
  structure: '结构',
  theme: '主题'
}

const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

const calcMoodScore = (phrases: Phrase[], goal: PoeticGoal): number => {
  if (phrases.length === 0) return 0

  const phraseTexts = new Set(phrases.map(p => p.text))
  const keywordMatch = goal.targetKeywords.filter(k => phraseTexts.has(k)).length
  const keywordRatio = goal.targetKeywords.length > 0
    ? keywordMatch / goal.targetKeywords.length
    : 0.5

  const emotionPhrases = phrases.filter(p => p.category === 'emotion')
  const scenePhrases = phrases.filter(p => p.category === 'scene')
  const hasBothTypes = emotionPhrases.length > 0 && scenePhrases.length > 0
  const categoryBonus = hasBothTypes ? 0.2 : 0

  const inTargetCat = phrases.filter(p => goal.targetCategories.includes(p.category)).length
  const catRatio = inTargetCat / phrases.length

  return Math.min((keywordRatio * 0.5 + catRatio * 0.3 + categoryBonus) * 100, 100)
}

const calcImageryScore = (phrases: Phrase[], goal: PoeticGoal): number => {
  if (phrases.length === 0) return 0

  const phraseTexts = new Set(phrases.map(p => p.text))
  const keywordMatch = goal.targetKeywords.filter(k => phraseTexts.has(k)).length
  const keywordRatio = goal.targetKeywords.length > 0
    ? keywordMatch / goal.targetKeywords.length
    : 0.3

  const imageryOrScene = phrases.filter(p =>
    p.category === 'imagery' || p.category === 'scene'
  ).length
  const imageryRatio = imageryOrScene / phrases.length

  const diversity = new Set(phrases.map(p => p.category)).size
  const diversityBonus = Math.min(diversity / 4, 1) * 0.15

  return Math.min((keywordRatio * 0.45 + imageryRatio * 0.4 + diversityBonus) * 100, 100)
}

const calcRhythmScore = (phrases: Phrase[], poem: ClassicPoem): number => {
  if (phrases.length === 0) return 0

  const targetAvg = poem.structurePattern.avgCharPerLine
  const lengths = phrases.map(p => p.text.length)
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length

  const diffRatio = Math.abs(avgLen - targetAvg) / Math.max(targetAvg, 1)
  const lenScore = Math.max(0, 1 - diffRatio) * 0.5

  const variance = lengths.reduce((sum, l) => sum + Math.abs(l - avgLen), 0) / lengths.length
  const rhythmScore = (1 - Math.min(variance / 2, 1)) * 0.3

  const patternLengths = poem.content.map(l => l.text.length)
  const matchScore = lengths.filter(l => patternLengths.includes(l)).length / Math.max(lengths.length, 1)
  const patternMatch = matchScore * 0.2

  return Math.min((lenScore + rhythmScore + patternMatch) * 100, 100)
}

const calcStructureScore = (phrases: Phrase[], goal: PoeticGoal, poem: ClassicPoem): number => {
  if (phrases.length === 0) return 0

  const targetSeq = poem.structurePattern.categorySequence
  if (targetSeq.length === 0) return 50

  const actualSeq = phrases.slice(0, targetSeq.length).map(p => p.category)
  let matchCount = 0
  const checkLen = Math.min(actualSeq.length, targetSeq.length)
  for (let i = 0; i < checkLen; i++) {
    if (actualSeq[i] === targetSeq[i]) matchCount++
  }
  const seqMatch = checkLen > 0 ? matchCount / checkLen : 0

  const targetCount = poem.structurePattern.lineCount
  const countDiff = Math.abs(phrases.length - targetCount)
  const countScore = Math.max(0, 1 - countDiff / Math.max(targetCount, 1))

  const inTargetCat = phrases.filter(p => goal.targetCategories.includes(p.category)).length
  const catRatio = inTargetCat / phrases.length

  return Math.min((seqMatch * 0.4 + countScore * 0.3 + catRatio * 0.3) * 100, 100)
}

const calcThemeScore = (phrases: Phrase[], goal: PoeticGoal): number => {
  if (phrases.length === 0) return 0

  const phraseTexts = new Set(phrases.map(p => p.text))
  const keywordMatch = goal.targetKeywords.filter(k => phraseTexts.has(k)).length
  const keywordRatio = goal.targetKeywords.length > 0
    ? keywordMatch / goal.targetKeywords.length
    : 0.3

  const inTargetCat = phrases.filter(p => goal.targetCategories.includes(p.category)).length
  const catRatio = inTargetCat / phrases.length

  return Math.min((keywordRatio * 0.6 + catRatio * 0.4) * 100, 100)
}

const getDeviationLevel = (deviation: number): 'perfect' | 'slight' | 'moderate' | 'severe' => {
  if (deviation <= 10) return 'perfect'
  if (deviation <= 30) return 'slight'
  if (deviation <= 55) return 'moderate'
  return 'severe'
}

const generateMoodAnalysis = (phrases: Phrase[], goal: PoeticGoal, score: number): string => {
  if (score >= 85) return '意境高度契合，情感基调与原诗一致'
  if (score >= 60) return '意境大致相符，部分情感尚可深化'

  const phraseTexts = new Set(phrases.map(p => p.text))
  const matched = goal.targetKeywords.filter(k => phraseTexts.has(k))
  const missed = goal.targetKeywords.filter(k => !phraseTexts.has(k))

  if (matched.length === 0) return `尚未捕捉到「${goal.label}」的意境特征，建议引入关键词`
  return `意境有所偏离，可补充：${missed.slice(0, 3).join('、')}`
}

const generateMoodSuggestions = (phrases: Phrase[], goal: PoeticGoal, score: number): string[] => {
  const suggestions: string[] = []
  const phraseTexts = new Set(phrases.map(p => p.text))
  const missed = goal.targetKeywords.filter(k => !phraseTexts.has(k))

  if (missed.length > 0) {
    suggestions.push(`引入关键词：${missed.slice(0, 3).join('、')}`)
  }

  const hasEmotion = phrases.some(p => p.category === 'emotion')
  const hasScene = phrases.some(p => p.category === 'scene')
  if (!hasEmotion) suggestions.push('增加情感类词汇以烘托意境')
  if (!hasScene) suggestions.push('增加景物描写以承载情感')

  if (score >= 60 && suggestions.length === 0) {
    suggestions.push('微调情感与景物比例，进一步贴合原诗意境')
  }

  return suggestions.slice(0, 3)
}

const generateImageryAnalysis = (phrases: Phrase[], goal: PoeticGoal, score: number): string => {
  if (score >= 85) return '意象丰富且契合，画面感与原诗相映'
  if (score >= 60) return '意象大致构建，画面感尚可增强'

  const imageryCount = phrases.filter(p => p.category === 'imagery' || p.category === 'scene').length
  if (imageryCount === 0) return '缺少意象与景物类词汇，画面感薄弱'

  return '意象选取与原诗偏差较大，可调整方向'
}

const generateImagerySuggestions = (phrases: Phrase[], goal: PoeticGoal, score: number): string[] => {
  const suggestions: string[] = []
  const phraseTexts = new Set(phrases.map(p => p.text))
  const missed = goal.targetKeywords.filter(k => !phraseTexts.has(k))

  if (missed.length > 0) {
    suggestions.push(`选用意象词：${missed.slice(0, 3).join('、')}`)
  }

  const imageryCount = phrases.filter(p => p.category === 'imagery').length
  const sceneCount = phrases.filter(p => p.category === 'scene').length
  if (imageryCount === 0) suggestions.push('增加意象类词汇以丰富画面')
  if (sceneCount === 0) suggestions.push('增加景物描写以构建空间')

  return suggestions.slice(0, 3)
}

const generateRhythmAnalysis = (phrases: Phrase[], poem: ClassicPoem, score: number): string => {
  if (score >= 85) return '节奏与原诗相近，韵律感良好'
  if (score >= 60) return '节奏大致可辨，尚可进一步调整'

  const avgLen = phrases.length > 0
    ? phrases.reduce((s, p) => s + p.text.length, 0) / phrases.length
    : 0
  const target = poem.structurePattern.avgCharPerLine

  if (avgLen < target - 1) return '词句偏短，节奏较原诗更为短促'
  if (avgLen > target + 1) return '词句偏长，节奏较原诗更为舒缓'
  return '词句长短参差，节奏感有待统一'
}

const generateRhythmSuggestions = (phrases: Phrase[], poem: ClassicPoem, score: number): string[] => {
  const suggestions: string[] = []
  const target = poem.structurePattern.avgCharPerLine

  suggestions.push(`原诗句均${target}字，可选用相近字数的词句`)

  if (phrases.length > 1) {
    const lengths = phrases.map(p => p.text.length)
    const variance = lengths.reduce((s, l) => s + Math.abs(l - lengths[0]), 0) / lengths.length
    if (variance > 1.5) suggestions.push('词句长短悬殊，建议统一字数以增强节奏感')
  }

  return suggestions.slice(0, 2)
}

const generateStructureAnalysis = (phrases: Phrase[], poem: ClassicPoem, score: number): string => {
  if (score >= 85) return '结构高度还原，词类排列与原诗吻合'
  if (score >= 60) return '结构大致合理，词类序列可进一步调整'
  return '结构与原诗差异较大，建议参照原诗的词类排列'
}

const generateStructureSuggestions = (phrases: Phrase[], poem: ClassicPoem, score: number): string[] => {
  const suggestions: string[] = []
  const targetSeq = poem.structurePattern.categorySequence
  const targetCount = poem.structurePattern.lineCount

  if (phrases.length < targetCount) {
    suggestions.push(`原诗${targetCount}句，当前${phrases.length}词，可增加词句`)
  } else if (phrases.length > targetCount + 2) {
    suggestions.push('词句过多，建议精选以贴合原诗结构')
  }

  if (targetSeq.length > 0) {
    const seqDesc = targetSeq.slice(0, 4).map(c => CATEGORY_LABELS[c]).join('→')
    suggestions.push(`原诗词类序列：${seqDesc}…`)
  }

  return suggestions.slice(0, 2)
}

const generateThemeAnalysis = (phrases: Phrase[], goal: PoeticGoal, score: number): string => {
  if (score >= 85) return '主题高度契合，核心要素完备'
  if (score >= 60) return '主题基本扣住，尚可深化'
  return '主题偏离较大，需引入更多核心关键词'
}

const generateThemeSuggestions = (phrases: Phrase[], goal: PoeticGoal, score: number): string[] => {
  const suggestions: string[] = []
  const phraseTexts = new Set(phrases.map(p => p.text))
  const missed = goal.targetKeywords.filter(k => !phraseTexts.has(k))

  if (missed.length > 0) {
    suggestions.push(`补充主题词：${missed.slice(0, 3).join('、')}`)
  }

  const inTargetCat = phrases.filter(p => goal.targetCategories.includes(p.category)).length
  if (phrases.length > 0 && inTargetCat / phrases.length < 0.5) {
    const cats = goal.targetCategories.map(c => CATEGORY_LABELS[c]).join('、')
    suggestions.push(`增加${cats}类词汇以紧扣主题`)
  }

  return suggestions.slice(0, 2)
}

export const analyzeDeviation = (phrases: Phrase[], poem: ClassicPoem): DeviationReport => {
  if (phrases.length === 0) {
    return {
      totalDeviation: 100,
      dimensions: poem.goals.map(g => ({
        dimension: g.dimension,
        label: DIMENSION_LABELS[g.dimension],
        originalScore: 100,
        currentScore: 0,
        deviation: 100,
        deviationLevel: 'severe' as const,
        analysis: '尚未开始创作',
        suggestions: ['选择词句开始重构']
      })),
      capturedKeywords: [],
      missedKeywords: [...poem.keyImagery, ...poem.keyEmotions],
      extraKeywords: [],
      overallAnalysis: '尚未开始创作',
      restorationAdvice: '选择名篇后，从词池中选取词句，以经典诗意为目标进行重构'
    }
  }

  const phraseTexts = new Set(phrases.map(p => p.text))
  const allTargetKeywords = poem.goals.flatMap(g => g.targetKeywords)
  const uniqueTargets = [...new Set(allTargetKeywords)]

  const capturedKeywords = uniqueTargets.filter(k => phraseTexts.has(k))
  const missedKeywords = uniqueTargets.filter(k => !phraseTexts.has(k))

  const poemKeywords = new Set([...poem.keyImagery, ...poem.keyEmotions])
  const extraKeywords = phrases.filter(p => !poemKeywords.has(p.text)).map(p => p.text)

  const dimensions: DimensionDeviation[] = poem.goals.map(goal => {
    let currentScore: number
    switch (goal.dimension) {
      case 'mood':
        currentScore = calcMoodScore(phrases, goal)
        break
      case 'imagery':
        currentScore = calcImageryScore(phrases, goal)
        break
      case 'rhythm':
        currentScore = calcRhythmScore(phrases, poem)
        break
      case 'structure':
        currentScore = calcStructureScore(phrases, goal, poem)
        break
      case 'theme':
        currentScore = calcThemeScore(phrases, goal)
        break
      default:
        currentScore = 0
    }

    const deviation = 100 - currentScore
    const deviationLevel = getDeviationLevel(deviation)

    let analysis = ''
    let suggestions: string[] = []

    switch (goal.dimension) {
      case 'mood':
        analysis = generateMoodAnalysis(phrases, goal, currentScore)
        suggestions = generateMoodSuggestions(phrases, goal, currentScore)
        break
      case 'imagery':
        analysis = generateImageryAnalysis(phrases, goal, currentScore)
        suggestions = generateImagerySuggestions(phrases, goal, currentScore)
        break
      case 'rhythm':
        analysis = generateRhythmAnalysis(phrases, poem, currentScore)
        suggestions = generateRhythmSuggestions(phrases, poem, currentScore)
        break
      case 'structure':
        analysis = generateStructureAnalysis(phrases, poem, currentScore)
        suggestions = generateStructureSuggestions(phrases, poem, currentScore)
        break
      case 'theme':
        analysis = generateThemeAnalysis(phrases, goal, currentScore)
        suggestions = generateThemeSuggestions(phrases, goal, currentScore)
        break
    }

    return {
      dimension: goal.dimension,
      label: DIMENSION_LABELS[goal.dimension],
      originalScore: 100,
      currentScore: Math.round(currentScore),
      deviation: Math.round(deviation),
      deviationLevel,
      analysis,
      suggestions
    }
  })

  const totalDeviation = dimensions.reduce((sum, d) => {
    const goal = poem.goals.find(g => g.dimension === d.dimension)
    const weight = goal?.weight || 0.2
    return sum + d.deviation * weight
  }, 0)

  let overallAnalysis = ''
  if (totalDeviation <= 15) overallAnalysis = '高度还原名篇意境，几近传神'
  else if (totalDeviation <= 30) overallAnalysis = '较好地把握了原诗精髓，细节可再打磨'
  else if (totalDeviation <= 55) overallAnalysis = '抓住了部分特征，但与原诗尚有距离'
  else overallAnalysis = '与原诗差异较大，需从意境和意象两个层面重新调整'

  let restorationAdvice = ''
  const worstDim = [...dimensions].sort((a, b) => b.deviation - a.deviation)[0]
  if (worstDim && worstDim.deviation > 30) {
    restorationAdvice = `重点提升「${worstDim.label}」维度：${worstDim.suggestions[0] || '参照原诗调整'}`
  } else {
    restorationAdvice = '各维度均接近目标，可在细微处追求极致'
  }

  return {
    totalDeviation: Math.round(totalDeviation),
    dimensions,
    capturedKeywords,
    missedKeywords,
    extraKeywords,
    overallAnalysis,
    restorationAdvice
  }
}

export const calculateRestorationScore = (phrases: Phrase[], poem: ClassicPoem): RestorationScore => {
  if (phrases.length === 0) {
    return {
      total: 0,
      fidelity: 0,
      creativity: 0,
      balance: 0,
      grade: '远韵',
      breakdown: {
        moodFidelity: 0,
        imageryFidelity: 0,
        rhythmFidelity: 0,
        structureFidelity: 0,
        themeFidelity: 0,
        creativeBonus: 0
      }
    }
  }

  const moodGoal = poem.goals.find(g => g.dimension === 'mood')
  const imageryGoal = poem.goals.find(g => g.dimension === 'imagery')
  const themeGoal = poem.goals.find(g => g.dimension === 'theme')

  const moodFidelity = moodGoal ? calcMoodScore(phrases, moodGoal) : 50
  const imageryFidelity = imageryGoal ? calcImageryScore(phrases, imageryGoal) : 50
  const rhythmFidelity = calcRhythmScore(phrases, poem)
  const structureFidelity = poem.goals.find(g => g.dimension === 'structure')
    ? calcStructureScore(phrases, poem.goals.find(g => g.dimension === 'structure')!, poem)
    : 50
  const themeFidelity = themeGoal ? calcThemeScore(phrases, themeGoal) : 50

  const phraseTexts = new Set(phrases.map(p => p.text))
  const poemKeywords = new Set([...poem.keyImagery, ...poem.keyEmotions])
  const nonOriginalPhrases = phrases.filter(p => !poemKeywords.has(p.text))

  const creativeBonus = phrases.length > 0
    ? Math.min((nonOriginalPhrases.length / phrases.length) * 30, 20)
    : 0

  const fidelity = (moodFidelity * 0.3 + imageryFidelity * 0.25 + rhythmFidelity * 0.15 +
    structureFidelity * 0.15 + themeFidelity * 0.15)

  const creativity = Math.min(
    (nonOriginalPhrases.length > 0 ? 40 : 0) +
    (new Set(phrases.map(p => p.category)).size >= 3 ? 20 : 0) +
    creativeBonus,
    60
  )

  const balance = Math.min(
    (1 - Math.abs(fidelity - creativity * 1.5) / 100) * 100,
    100
  )

  const total = Math.round(
    fidelity * 0.5 + creativity * 0.25 + balance * 0.25
  )

  let grade: RestorationScore['grade']
  if (total >= 90) grade = '传神'
  else if (total >= 75) grade = '神似'
  else if (total >= 60) grade = '形似'
  else if (total >= 40) grade = '近似'
  else grade = '远韵'

  return {
    total,
    fidelity: Math.round(fidelity),
    creativity: Math.round(creativity),
    balance: Math.round(balance),
    grade,
    breakdown: {
      moodFidelity: Math.round(moodFidelity),
      imageryFidelity: Math.round(imageryFidelity),
      rhythmFidelity: Math.round(rhythmFidelity),
      structureFidelity: Math.round(structureFidelity),
      themeFidelity: Math.round(themeFidelity),
      creativeBonus: Math.round(creativeBonus)
    }
  }
}

export const getRestorationGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    '传神': '#ffd700',
    '神似': '#c9a86c',
    '形似': '#7a9ea8',
    '近似': '#a8a498',
    '远韵': '#6b6858'
  }
  return colors[grade] || '#6b6858'
}

export const getDeviationLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    'perfect': '#7ca97c',
    'slight': '#c9a86c',
    'moderate': '#a87ac9',
    'severe': '#c95b5b'
  }
  return colors[level] || '#6b6858'
}

export const getDeviationLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    'perfect': '完美',
    'slight': '微偏',
    'moderate': '中偏',
    'severe': '大偏'
  }
  return labels[level] || '未知'
}
