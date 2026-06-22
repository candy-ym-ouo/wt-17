import type { 
  Phrase, 
  ClassicPoem, 
  ReconstructionAnalysis, 
  ImageryDeviation, 
  ThemeDeviation, 
  EmotionDeviation, 
  StructuralDeviation, 
  RestorationScore,
  ScoreGrade,
  ReconstructionResult,
  PhraseCategory
} from '@/types'

const imageryRelatedPhrases: Record<string, string[]> = {
  '明月': ['明月', '月明', '皓月', '婵娟', '清影', '银辉'],
  '霜': ['霜', '寒霜', '晨霜', '秋霜', '白霜'],
  '故乡': ['故乡', '故园', '故里', '乡关', '旧约', '归途', '遥望'],
  '啼鸟': ['啼鸟', '鸟鸣', '春禽', '禽声', '莺啼'],
  '春花': ['春花', '落花', '繁花', '芳菲', '花影', '落红'],
  '风雨': ['风雨', '疾风', '骤雨', '雨声', '春霖', '夜雨'],
  '春眠': ['春眠', '清梦', '酣眠', '梦醒', '春晓'],
  '白日': ['白日', '斜阳', '残阳', '落日', '余晖', '日照'],
  '黄河': ['黄河', '长河', '奔流', '大河', '浩荡'],
  '远山': ['远山', '青山', '群山', '翠峰', '层峦'],
  '高楼': ['高楼', '层楼', '危楼', '玉楼', '高楼'],
  '红豆': ['红豆', '相思', '缱绻', '眷恋', '深情'],
  '南国': ['南国', '江南', '水乡', '吴越', '岭南'],
  '春枝': ['春枝', '新绿', '嫩条', '枝叶', '萌芽'],
  '飞雪': ['飞雪', '落雪', '瑞雪', '寒雪', '冰花'],
  '孤舟': ['孤舟', '扁舟', '渔舟', '归舟', '兰舟'],
  '寒江': ['寒江', '大江', '江流', '江雪', '烟波'],
  '蓑笠翁': ['蓑笠', '渔翁', '钓翁', '垂钓', '独钓'],
  '荒山': ['荒山', '千山', '荒野', '荒原', '寒烟'],
  '青天': ['青天', '碧落', '苍穹', '高空', '云霄'],
  '琼楼': ['琼楼', '玉宇', '楼台', '宫阙', '朱阁'],
  '婵娟': ['婵娟', '美人', '月辉', '清影', '月魄'],
  '朱阁': ['朱阁', '绮户', '画楼', '雕栏', '玉砌'],
  '清影': ['清影', '孤影', '疏影', '灯影', '梅影'],
  '把酒': ['把酒', '持杯', '举杯', '衔杯', '醉饮'],
  '悲欢': ['悲欢', '离合', '聚散', '哀乐', '沉浮'],
  '离合': ['离合', '聚散', '分合', '合离', '悲欢'],
  '玉宇': ['玉宇', '琼楼', '天宫', '仙阙', '广寒'],
  '乘风': ['乘风', '御风', '凌云', '翱翔', '归去'],
  '黄花': ['黄花', '菊蕊', '金英', '落英', '残花'],
  '梧桐': ['梧桐', '桐叶', '疏桐', '一叶', '秋桐'],
  '细雨': ['细雨', '疏雨', '微雨', '小雨', '丝雨'],
  '黄昏': ['黄昏', '日暮', '夕照', '暮色', '薄暮'],
  '归雁': ['归雁', '征雁', '塞雁', '雁阵', '雁声'],
  '淡酒': ['淡酒', '薄酒', '残酒', '浊酒', '清酒'],
  '香炉': ['香炉', '烟霞', '紫烟', '香烟', '瑞烟'],
  '紫烟': ['紫烟', '云烟', '烟岚', '霞烟', '岚光'],
  '瀑布': ['瀑布', '飞泉', '流泉', '悬泉', '水帘'],
  '银河': ['银河', '星河', '天汉', '银汉', '长河'],
  '飞流': ['飞流', '飞瀑', '直泻', '倾泻', '崩腾'],
  '山川': ['山川', '山河', '江山', '峰峦', '山水'],
  '云烟': ['云烟', '烟云', '云雾', '烟霭', '云岚'],
  '翠峰': ['翠峰', '青峰', '碧峰', '秀峰', '奇峰'],
  '城阙': ['城阙', '宫城', '皇城', '城楼', '帝都'],
  '风烟': ['风烟', '风尘', '尘烟', '烽火', '狼烟'],
  '歧路': ['歧路', '岔道', '分路', '陌路', '驿路'],
  '天涯': ['天涯', '海角', '远方', '异域', '边塞'],
  '津渡': ['津渡', '渡口', '渡头', '江渡', '关津'],
  '知己': ['知己', '故交', '知音', '挚友', '契友'],
  '离别': ['离别', '别离', '分离', '惜别', '送别'],
  '宦游': ['宦游', '仕途', '游宦', '羁旅', '漂泊'],
  '比邻': ['比邻', '近邻', '乡邻', '芳邻', '咫尺'],
  '锦瑟': ['锦瑟', '瑶琴', '素弦', '玉柱', '朱弦'],
  '蝴蝶': ['蝴蝶', '蛱蝶', '粉蝶', '庄周', '梦蝶'],
  '杜鹃': ['杜鹃', '子规', '望帝', '啼鹃', '杜宇'],
  '沧海': ['沧海', '碧海', '沧溟', '瀚海', '万顷'],
  '明珠': ['明珠', '鲛人', '灵珠', '泪珠', '骊珠'],
  '玉烟': ['玉烟', '暖玉', '良玉', '蓝田', '玉辉'],
  '追忆': ['追忆', '追思', '回忆', '怀旧', '感念'],
  '华年': ['华年', '韶华', '年少', '青春', '芳年'],
  '春心': ['春心', '芳心', '愁思', '幽怀', '情思'],
  '惘然': ['惘然', '怅惘', '迷茫', '恍惚', '失意'],
  '寒蝉': ['寒蝉', '秋蝉', '鸣蝉', '残蝉', '蝉声'],
  '长亭': ['长亭', '短亭', '驿亭', '亭皋', '江亭'],
  '兰舟': ['兰舟', '画船', '桂棹', '轻舟', '锦帆'],
  '烟波': ['烟波', '烟水', '江波', '沧波', '浩渺'],
  '暮霭': ['暮霭', '暮色', '夕霭', '晚烟', '暝色'],
  '杨柳': ['杨柳', '垂杨', '绿杨', '烟柳', '章台'],
  '晓风': ['晓风', '晨风', '凉风', '清风', '晚风'],
  '残月': ['残月', '晓月', '斜月', '眉月', '月牙'],
  '清秋': ['清秋', '深秋', '寒秋', '商秋', '素秋'],
  '陋室': ['陋室', '草庐', '茅斋', '寒舍', '闲居'],
  '苔痕': ['苔痕', '青苔', '莓苔', '苍苔', '翠藓'],
  '素琴': ['素琴', '古琴', '鸣琴', '抚琴', '玉琴'],
  '金经': ['金经', '梵经', '道书', '黄卷', '典籍'],
  '鸿儒': ['鸿儒', '雅士', '文人', '墨客', '贤达'],
  '德馨': ['德馨', '清德', '高风', '亮节', '美德'],
  '淡泊': ['淡泊', '恬淡', '清雅', '清高', '素心']
}

const emotionCategoryMap: Record<string, PhraseCategory[]> = {
  '思乡': ['emotion', 'imagery'],
  '惆怅': ['emotion', 'time'],
  '孤寂': ['emotion', 'scene'],
  '惜春': ['emotion', 'time'],
  '悠然': ['emotion', 'scene'],
  '淡淡惆怅': ['emotion', 'imagery'],
  '豪迈': ['emotion', 'imagery'],
  '进取': ['emotion', 'action'],
  '壮阔': ['imagery', 'scene'],
  '相思': ['emotion', 'imagery'],
  '眷恋': ['emotion', 'time'],
  '深情': ['emotion', 'imagery'],
  '孤傲': ['emotion', 'scene'],
  '清冷': ['emotion', 'scene'],
  '超脱': ['emotion', 'imagery'],
  '思念': ['emotion', 'time'],
  '豁达': ['emotion', 'imagery'],
  '哲思': ['emotion', 'imagery'],
  '悲愁': ['emotion', 'imagery'],
  '凄怆': ['emotion', 'time'],
  '豪放': ['emotion', 'action'],
  '惊叹': ['emotion', 'imagery'],
  '飘逸': ['emotion', 'action'],
  '惜别': ['emotion', 'time'],
  '豪情': ['emotion', 'imagery'],
  '怅惘': ['emotion', 'time'],
  '追忆': ['emotion', 'time'],
  '幽怨': ['emotion', 'imagery'],
  '伤别': ['emotion', 'action'],
  '缱绻': ['emotion', 'imagery'],
  '凄切': ['emotion', 'time'],
  '清高': ['emotion', 'imagery'],
}

const gradeThresholds: Array<{ minScore: number; grade: ScoreGrade; stars: number }> = [
  { minScore: 90, grade: '神品', stars: 3 },
  { minScore: 75, grade: '妙品', stars: 2 },
  { minScore: 60, grade: '佳品', stars: 1 },
  { minScore: 40, grade: '能品', stars: 0 },
  { minScore: 0, grade: '习作', stars: 0 }
]

export const calculateRestorationScore = (phrases: Phrase[], poem: ClassicPoem): RestorationScore => {
  const analysis = analyzeReconstruction(phrases, poem)
  
  const preservedImageries = analysis.imageryDeviations.filter(d => d.present).length
  const totalImageries = analysis.imageryDeviations.length
  const imageryScore = totalImageries > 0 ? (preservedImageries / totalImageries) * 100 : 0
  
  const themeScore = analysis.themeDeviation.matchDegree * 100
  
  const emotionScore = analysis.emotionDeviation.matchDegree * 100
  
  const structureScore = calculateStructureScore(analysis.structuralDeviations)
  
  const styleScore = analysis.lexicalStyle.styleMatch * 100
  
  const targetCount = poem.targetPhraseCount
  const actualCount = phrases.length
  const countRatio = Math.min(actualCount / targetCount, 1.5)
  const countPenalty = countRatio < 0.5 ? (0.5 - countRatio) * 0.4 : 0
  
  const weights = {
    imagery: 0.30,
    theme: 0.25,
    emotion: 0.20,
    structure: 0.15,
    style: 0.10
  }
  
  const rawTotal = 
    imageryScore * weights.imagery +
    themeScore * weights.theme +
    emotionScore * weights.emotion +
    structureScore * weights.structure +
    styleScore * weights.style
  
  const total = Math.max(0, Math.round(rawTotal * (1 - countPenalty)))
  
  const { grade, stars } = getGradeAndStars(total)
  
  return {
    imageryRestoration: Math.round(imageryScore),
    themeRestoration: Math.round(themeScore),
    emotionRestoration: Math.round(emotionScore),
    structureRestoration: Math.round(structureScore),
    styleRestoration: Math.round(styleScore),
    total,
    grade,
    stars
  }
}

const getGradeAndStars = (score: number): { grade: ScoreGrade; stars: number } => {
  for (const threshold of gradeThresholds) {
    if (score >= threshold.minScore) {
      return { grade: threshold.grade, stars: threshold.stars }
    }
  }
  return { grade: '习作', stars: 0 }
}

export const analyzeReconstruction = (phrases: Phrase[], poem: ClassicPoem): ReconstructionAnalysis => {
  const phraseTexts = phrases.map(p => p.text)
  const phraseCategories = phrases.map(p => p.category)
  
  const imageryDeviations = analyzeImageryDeviation(phraseTexts, poem)
  const themeDeviation = analyzeThemeDeviation(phraseTexts, poem)
  const emotionDeviation = analyzeEmotionDeviation(phraseCategories, phrases, poem)
  const structuralDeviations = analyzeStructuralDeviation(phrases, poem)
  const lexicalStyle = analyzeLexicalStyle(phraseTexts, poem)
  
  return {
    imageryDeviations,
    themeDeviation,
    emotionDeviation,
    structuralDeviations,
    lexicalStyle
  }
}

const analyzeImageryDeviation = (phraseTexts: string[], poem: ClassicPoem): ImageryDeviation[] => {
  return poem.coreImageries.map(imagery => {
    const relatedSet = imageryRelatedPhrases[imagery] || [imagery]
    
    let matchedPhrase: string | undefined
    let foundExact = false
    let foundRelated = false
    
    for (const text of phraseTexts) {
      if (text === imagery || text.includes(imagery) || imagery.includes(text)) {
        matchedPhrase = text
        foundExact = true
        break
      }
      for (const related of relatedSet) {
        if (text === related || text.includes(related) || related.includes(text)) {
          if (!matchedPhrase) {
            matchedPhrase = text
            foundRelated = true
          }
          break
        }
      }
    }
    
    let deviationType: ImageryDeviation['deviationType'] = 'missing'
    let impactScore = 0
    
    if (foundExact) {
      deviationType = 'preserved'
      impactScore = 1.0
    } else if (foundRelated) {
      deviationType = 'transformed'
      impactScore = 0.6
    } else {
      deviationType = 'missing'
      impactScore = 0
    }
    
    return {
      originalImagery: imagery,
      present: foundExact || foundRelated,
      matchedPhrase,
      deviationType,
      impactScore
    }
  })
}

const analyzeThemeDeviation = (phraseTexts: string[], poem: ClassicPoem): ThemeDeviation => {
  const allKeywords = new Set([
    ...poem.keywords,
    ...poem.coreImageries
  ])
  
  let matchedCount = 0
  const matchedKeywords: string[] = []
  const missingElements: string[] = []
  const extraElements: string[] = []
  
  allKeywords.forEach(kw => {
    const relatedSet = imageryRelatedPhrases[kw] || [kw]
    let isMatched = false
    for (const text of phraseTexts) {
      if (text === kw || text.includes(kw) || kw.includes(text)) {
        isMatched = true
        break
      }
      for (const related of relatedSet) {
        if (text === related || text.includes(related) || related.includes(text)) {
          isMatched = true
          break
        }
      }
      if (isMatched) break
    }
    
    if (isMatched) {
      matchedCount++
      matchedKeywords.push(kw)
    } else {
      missingElements.push(kw)
    }
  })
  
  const totalKeywords = allKeywords.size
  const matchDegree = totalKeywords > 0 ? matchedCount / totalKeywords : 0
  
  phraseTexts.forEach(text => {
    let isPoemKeyword = false
    for (const kw of allKeywords) {
      const relatedSet = imageryRelatedPhrases[kw] || [kw]
      if (text === kw || text.includes(kw) || kw.includes(text)) {
        isPoemKeyword = true
        break
      }
      for (const related of relatedSet) {
        if (text === related || text.includes(related) || related.includes(text)) {
          isPoemKeyword = true
          break
        }
      }
      if (isPoemKeyword) break
    }
    if (!isPoemKeyword) {
      extraElements.push(text)
    }
  })
  
  return {
    originalTheme: poem.themes[0] || '',
    matchDegree: Math.min(matchDegree + (extraElements.length === 0 ? 0.1 : 0), 1),
    currentThemes: matchedKeywords,
    missingElements: missingElements.slice(0, 6),
    extraElements: extraElements.slice(0, 5)
  }
}

const analyzeEmotionDeviation = (
  phraseCategories: PhraseCategory[], 
  phrases: Phrase[], 
  poem: ClassicPoem
): EmotionDeviation => {
  const targetEmotions = poem.emotions
  const primaryEmotion = targetEmotions[0] || ''
  
  const emotionCategories = emotionCategoryMap[primaryEmotion] || ['emotion', 'imagery']
  
  const categoryCount = new Map<PhraseCategory, number>()
  phraseCategories.forEach(cat => {
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
  })
  
  const totalPhrases = phrases.length
  let emotionMatchRatio = 0
  
  if (totalPhrases > 0) {
    let matchedCategoryCount = 0
    emotionCategories.forEach(cat => {
      matchedCategoryCount += categoryCount.get(cat) || 0
    })
    emotionMatchRatio = matchedCategoryCount / totalPhrases
  }
  
  const emotionKeywords = new Set<string>()
  targetEmotions.forEach(emotion => {
    const relatedSet = imageryRelatedPhrases[emotion] || [emotion]
    relatedSet.forEach(r => emotionKeywords.add(r))
  })
  
  let emotionKeywordMatches = 0
  phrases.forEach(p => {
    for (const kw of emotionKeywords) {
      if (p.text === kw || p.text.includes(kw) || kw.includes(p.text)) {
        emotionKeywordMatches++
        break
      }
    }
  })
  
  const keywordMatchRatio = totalPhrases > 0 ? emotionKeywordMatches / totalPhrases : 0
  
  const matchDegree = Math.min(
    emotionMatchRatio * 0.5 + keywordMatchRatio * 0.5 + 0.15,
    1
  )
  
  const currentEmotions = detectCurrentEmotions(phrases)
  
  const sentimentScore = calculateSentiment(phrases)
  const originalSentiment = getEmotionSentiment(primaryEmotion)
  const intensityShift = Math.abs(sentimentScore - originalSentiment)
  
  return {
    originalEmotion: primaryEmotion,
    matchDegree,
    currentEmotions: currentEmotions.slice(0, 4),
    intensityShift: Math.round(intensityShift * 100) / 100
  }
}

const detectCurrentEmotions = (phrases: Phrase[]): string[] => {
  const emotionHints: Array<{ keywords: string[]; emotion: string }> = [
    { keywords: ['明月', '故乡', '归雁', '相思', '遥望', '归途'], emotion: '思乡' },
    { keywords: ['落花', '风雨', '黄昏', '梧桐', '细雨', '秋凉'], emotion: '悲愁' },
    { keywords: ['青山', '绿水', '白云', '悠然', '淡泊', '清风'], emotion: '隐逸' },
    { keywords: ['黄河', '云海', '长河', '壮阔', '奔流', '高楼'], emotion: '豪迈' },
    { keywords: ['红豆', '缱绻', '眷恋', '深情', '相思', '春心'], emotion: '相思' },
    { keywords: ['飞雪', '孤舟', '寒江', '独钓', '蓑笠', '寂寥'], emotion: '孤傲' },
    { keywords: ['把酒', '乘风', '琼楼', '婵娟', '清影', '玉宇'], emotion: '飘逸' },
    { keywords: ['春花', '啼鸟', '春眠', '春晓', '清欢', '芳菲'], emotion: '悠然' },
    { keywords: ['长亭', '歧路', '离别', '杨柳', '烟波', '残月'], emotion: '惜别' },
    { keywords: ['锦瑟', '追忆', '华年', '惘然', '蝴蝶', '沧海'], emotion: '怅惘' },
    { keywords: ['陋室', '苔痕', '素琴', '鸿儒', '金经', '德馨'], emotion: '清高' },
    { keywords: ['素笺', '青灯', '古寺', '夜雨', '繁星', '故人'], emotion: '孤寂' }
  ]
  
  const phraseTexts = phrases.map(p => p.text)
  const emotionScores = new Map<string, number>()
  
  emotionHints.forEach(hint => {
    let score = 0
    hint.keywords.forEach(kw => {
      const relatedSet = imageryRelatedPhrases[kw] || [kw]
      phraseTexts.forEach(text => {
        if (text === kw || text.includes(kw) || kw.includes(text)) {
          score += 1
        } else {
          for (const related of relatedSet) {
            if (text === related || text.includes(related) || related.includes(text)) {
              score += 0.5
              break
            }
          }
        }
      })
    })
    if (score > 0) {
      emotionScores.set(hint.emotion, score)
    }
  })
  
  return Array.from(emotionScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0])
    .slice(0, 4)
}

const calculateSentiment = (phrases: Phrase[]): number => {
  const positiveWords = new Set(['明月', '清辉', '春花', '芳菲', '青山', '绿水', '悠然', '清风', 
    '婵娟', '琼楼', '豪迈', '壮阔', '红豆', '深情', '缱绻', '玉宇', '把酒', '欢乐', 
    '金经', '鸿儒', '德馨', '淡泊', '飘逸', '紫烟', '银河', '飞流'])
  const negativeWords = new Set(['霜', '黄昏', '愁绪', '细雨', '梧桐', '黄花', '淡酒', '归雁',
    '寒蝉', '长亭', '暮霭', '残月', '凄清', '孤寂', '飞雪', '孤舟', '寒江', '荒山',
    '离别', '歧路', '惘然', '追忆', '幽怨', '零落', '凄怆', '寒秋'])
  
  let sentiment = 0
  phrases.forEach(p => {
    const text = p.text
    for (const word of positiveWords) {
      if (text.includes(word) || word.includes(text)) {
        sentiment += 0.15
        break
      }
    }
    for (const word of negativeWords) {
      if (text.includes(word) || word.includes(text)) {
        sentiment -= 0.15
        break
      }
    }
  })
  
  return Math.max(-1, Math.min(1, sentiment))
}

const getEmotionSentiment = (emotion: string): number => {
  const sentimentMap: Record<string, number> = {
    '思乡': -0.5,
    '惆怅': -0.6,
    '孤寂': -0.7,
    '惜春': -0.3,
    '悠然': 0.6,
    '淡淡惆怅': -0.4,
    '豪迈': 0.8,
    '进取': 0.7,
    '壮阔': 0.7,
    '相思': -0.4,
    '眷恋': -0.3,
    '深情': 0.4,
    '孤傲': -0.2,
    '清冷': -0.4,
    '超脱': 0.5,
    '思念': -0.5,
    '豁达': 0.6,
    '哲思': 0.3,
    '悲愁': -0.8,
    '凄怆': -0.9,
    '豪放': 0.7,
    '惊叹': 0.5,
    '飘逸': 0.6,
    '惜别': -0.6,
    '豪情': 0.7,
    '怅惘': -0.5,
    '追忆': -0.4,
    '幽怨': -0.7,
    '伤别': -0.7,
    '缱绻': 0.3,
    '凄切': -0.8,
    '清高': 0.3
  }
  return sentimentMap[emotion] || 0
}

const analyzeStructuralDeviation = (phrases: Phrase[], poem: ClassicPoem): StructuralDeviation[] => {
  const deviations: StructuralDeviation[] = []
  
  const actualCount = phrases.length
  const targetCount = poem.targetPhraseCount
  const countRatio = actualCount / targetCount
  const countDeviation = Math.abs(1 - countRatio)
  
  deviations.push({
    structuralAspect: '词数量',
    originalPattern: `${targetCount}句`,
    currentPattern: `${actualCount}句`,
    deviationDegree: Math.min(countDeviation, 1),
    suggestion: countRatio < 0.7 
      ? `建议再补充${Math.ceil(targetCount * 0.7 - actualCount)}个词句以接近原作规模` 
      : countRatio > 1.4 
      ? '词句略显繁密，可适当精简以保持凝练' 
      : '词数量恰当，与原作结构呼应'
  })
  
  const categoryDist = new Map<PhraseCategory, number>()
  phrases.forEach(p => {
    categoryDist.set(p.category, (categoryDist.get(p.category) || 0) + 1)
  })
  
  const totalPhrases = phrases.length || 1
  const sceneRatio = (categoryDist.get('scene') || 0) / totalPhrases
  const emotionRatio = (categoryDist.get('emotion') || 0) / totalPhrases
  const imageryRatio = (categoryDist.get('imagery') || 0) / totalPhrases
  const hasDiversity = sceneRatio > 0.15 && emotionRatio > 0.1 && imageryRatio > 0.15
  
  deviations.push({
    structuralAspect: '类别分布',
    originalPattern: '景物·情感·意象交融',
    currentPattern: hasDiversity ? '多类别融合' : (sceneRatio > 0.6 ? '偏重写景' : emotionRatio > 0.5 ? '偏重抒情' : '结构单一'),
    deviationDegree: hasDiversity ? 0.1 : 0.5,
    suggestion: hasDiversity 
      ? '情景交融，结构匀称' 
      : '建议平衡写景、抒情与意象，营造更丰富的层次'
  })
  
  const allRarities = new Set(phrases.map(p => p.rarity))
  const hasRarity = allRarities.size > 1
  
  deviations.push({
    structuralAspect: '词句质感',
    originalPattern: '辞约义丰，深浅相济',
    currentPattern: hasRarity ? '雅俗共赏' : '辞采平平',
    deviationDegree: hasRarity ? 0.2 : 0.6,
    suggestion: hasRarity ? '辞采相宜，雅俗兼备' : '可融入更多精妙词句，提升整体质感'
  })
  
  return deviations
}

const calculateStructureScore = (deviations: StructuralDeviation[]): number => {
  if (deviations.length === 0) return 80
  const avgDeviation = deviations.reduce((sum, d) => sum + d.deviationDegree, 0) / deviations.length
  return Math.round((1 - avgDeviation) * 100)
}

const analyzeLexicalStyle = (phraseTexts: string[], poem: ClassicPoem) => {
  const originalVocabulary = Array.from(new Set([
    ...poem.keywords,
    ...poem.coreImageries,
    ...poem.emotions
  ]))
  
  let matchedVocab = 0
  originalVocabulary.forEach(vocab => {
    const relatedSet = imageryRelatedPhrases[vocab] || [vocab]
    for (const text of phraseTexts) {
      if (text === vocab || text.includes(vocab) || vocab.includes(text)) {
        matchedVocab++
        return
      }
      for (const related of relatedSet) {
        if (text === related || text.includes(related) || related.includes(text)) {
          matchedVocab++
          return
        }
      }
    }
  })
  
  const styleMatch = originalVocabulary.length > 0 
    ? Math.min((matchedVocab / originalVocabulary.length) * 0.9 + 0.1, 1) 
    : 0.5
  
  const anachronismWords: string[] = []
  const modernHints = ['手机', '电脑', '微信', '高铁', '电视', '网络', '编程', '算法']
  phraseTexts.forEach(text => {
    for (const hint of modernHints) {
      if (text.includes(hint)) {
        anachronismWords.push(text)
        break
      }
    }
  })
  
  return {
    originalVocabulary: originalVocabulary.slice(0, 10),
    currentVocabulary: phraseTexts.slice(0, 10),
    styleMatch,
    anachronismWords
  }
}

export const generateRestorationResult = (
  poem: ClassicPoem,
  phrases: Phrase[],
  elapsedSeconds: number,
  existingState?: { bestScores: Record<string, number>; clearedPoemIds: string[] }
): ReconstructionResult => {
  const now = Date.now()
  const score = calculateRestorationScore(phrases, poem)
  const analysis = analyzeReconstruction(phrases, poem)
  
  const bestScore = existingState?.bestScores?.[poem.id] || 0
  const isNewRecord = score.total > bestScore
  const isFirstClear = !existingState?.clearedPoemIds?.includes(poem.id) && score.total >= 60
  
  const bonusTitles: string[] = []
  if (score.total >= 95) bonusTitles.push('神合古人')
  if (score.total >= 85) bonusTitles.push('雅韵天成')
  if (score.stars === 3) bonusTitles.push('三星重构')
  if (isFirstClear) bonusTitles.push('首重构达人')
  if (analysis.imageryDeviations.every(d => d.present)) bonusTitles.push('意象全合')
  if (analysis.themeDeviation.matchDegree >= 0.9) bonusTitles.push('神契原旨')
  
  return {
    poemId: poem.id,
    poemTitle: poem.title,
    compositionId: `recon_${now}`,
    phrases: [...phrases],
    score,
    analysis,
    timeUsedSeconds: elapsedSeconds,
    completedAt: now,
    isNewRecord,
    isFirstClear,
    bonusTitles
  }
}

export const generateReconstructionSuggestions = (analysis: ReconstructionAnalysis): string[] => {
  const suggestions: string[] = []
  
  const missingImageries = analysis.imageryDeviations.filter(d => !d.present)
  if (missingImageries.length > 0) {
    const missingNames = missingImageries.map(d => d.originalImagery).join('、')
    suggestions.push(`核心意象「${missingNames}」尚未呈现，可尝试融入相关词句`)
  }
  
  if (analysis.themeDeviation.missingElements.length >= 3) {
    suggestions.push(`主题契合度有待提升，可从关键词${analysis.themeDeviation.missingElements.slice(0, 3).join('、')}入手`)
  }
  
  if (analysis.emotionDeviation.matchDegree < 0.5) {
    suggestions.push(`情感基调与原作「${analysis.emotionDeviation.originalEmotion}」有所偏离，可调整抒情方式`)
  }
  
  analysis.structuralDeviations.forEach(dev => {
    if (dev.deviationDegree > 0.4) {
      suggestions.push(dev.suggestion)
    }
  })
  
  if (analysis.lexicalStyle.anachronismWords.length > 0) {
    suggestions.push(`建议避免使用现代词汇，保持古典韵致`)
  }
  
  if (analysis.imageryDeviations.every(d => d.present) && analysis.themeDeviation.matchDegree >= 0.8) {
    suggestions.push('意象完备，主题贴切，可进一步打磨细节提升神韵')
  }
  
  return suggestions.slice(0, 5)
}
