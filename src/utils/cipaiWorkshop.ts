import type {
  CipaiTemplate,
  CipaiLine,
  CipaiCheckResult,
  CipaiScoreBreakdown,
  CipaiRecommendation,
  CipaiScoringRuleSet,
  Phrase,
  TonePattern,
} from '@/types'
import { getCipaiScoringRuleByMode, getCipaiById } from '@/data/cipaiTemplates'

const pingShengChars = new Set([
  '春', '风', '花', '月', '江', '山', '云', '天', '人', '心',
  '清', '明', '空', '中', '东', '西', '南', '北', '高', '低',
  '长', '深', '青', '白', '红', '香', '寒', '温', '新', '陈',
  '轻', '重', '生', '死', '来', '归', '思', '愁', '情', '意',
  '梦', '醒', '醉', '眠', '听', '看', '行', '坐', '立', '卧',
  '诗', '词', '歌', '赋', '书', '画', '琴', '棋', '茶', '酒',
  '梅', '兰', '竹', '菊', '松', '柳', '荷', '桃', '杏', '梨',
  '星', '虹', '霞', '雾', '烟', '霜', '雪', '雨', '露', '冰',
  '楼', '台', '亭', '阁', '窗', '门', '墙', '院', '园', '林',
  '舟', '船', '桥', '路', '溪', '泉', '石', '沙', '岸', '滩',
  '古', '今', '年', '时', '朝', '暮', '夜', '日', '晨', '昏',
  '相', '思', '相', '忆', '相', '逢', '相', '别', '相', '知',
  '一', '三', '七', '千', '万', '无', '多', '少', '双', '孤',
  '何', '谁', '几', '那', '这', '此', '彼', '如', '似', '若',
])

const zeShengChars = new Set([
  '落', '下', '上', '去', '入', '出', '进', '退', '起', '伏',
  '破', '碎', '断', '绝', '尽', '灭', '散', '聚', '合', '分',
  '夜', '晚', '暗', '黑', '冷', '热', '暖', '凉', '苦', '甜',
  '泪', '笑', '哭', '叹', '恨', '爱', '怨', '喜', '怒', '哀',
  '逝', '往', '过', '忆', '念', '忘', '记', '怀', '感', '悟',
  '寂', '寞', '寥', '落', '萧', '瑟', '凄', '凉', '悲', '伤',
  '古', '旧', '老', '少', '小', '大', '远', '近', '深', '浅',
  '静', '动', '缓', '急', '慢', '快', '柔', '刚', '软', '硬',
  '照', '映', '射', '洒', '照', '耀', '闪', '烁', '点', '燃',
  '饮', '斟', '酌', '品', '尝', '味', '香', '浓', '淡', '薄',
  '唱', '和', '弹', '奏', '吹', '弄', '舞', '蹈', '步', '游',
  '二', '四', '五', '六', '八', '九', '十', '百', '半', '全',
  '是', '非', '有', '没', '不', '未', '已', '曾', '将', '欲',
  '且', '莫', '休', '便', '又', '还', '更', '也', '却', '但',
])

export const getToneOfChar = (char: string): TonePattern => {
  if (pingShengChars.has(char)) return 'ping'
  if (zeShengChars.has(char)) return 'ze'
  return 'any'
}

export const checkCharCount = (
  text: string,
  expected: number,
  tolerance: number = 0
): { match: boolean; diff: number } => {
  const actual = text.length
  const diff = Math.abs(actual - expected)
  return {
    match: diff <= tolerance,
    diff,
  }
}

export const checkTonePattern = (
  text: string,
  pattern: TonePattern[]
): { matches: boolean[]; matchRate: number } => {
  const matches: boolean[] = []
  const chars = text.split('')
  
  for (let i = 0; i < pattern.length; i++) {
    if (i >= chars.length) {
      matches.push(false)
      continue
    }
    const expectedTone = pattern[i]
    if (expectedTone === 'any') {
      matches.push(true)
    } else {
      const actualTone = getToneOfChar(chars[i])
      matches.push(actualTone === expectedTone || actualTone === 'any')
    }
  }
  
  const matchRate = matches.filter(m => m).length / pattern.length
  return { matches, matchRate }
}

export const checkRhyme = (
  text: string,
  shouldRhyme: boolean,
  rhymeChars: string[] = []
): { match: boolean; rhymeChar: string | null } => {
  if (!shouldRhyme || text.length === 0) {
    return { match: true, rhymeChar: null }
  }
  
  const lastChar = text[text.length - 1]
  
  if (rhymeChars.length === 0) {
    return { match: true, rhymeChar: lastChar }
  }
  
  const lastCharTone = getToneOfChar(lastChar)
  const rhymeTones = rhymeChars.map(c => getToneOfChar(c))
  const hasSameToneRhyme = rhymeTones.some(t => t === lastCharTone)
  
  return {
    match: hasSameToneRhyme || rhymeChars.some(c => c === lastChar),
    rhymeChar: lastChar,
  }
}

export const checkCipaiLine = (
  text: string,
  line: CipaiLine,
  ruleSet: CipaiScoringRuleSet,
  rhymeChars: string[] = []
): CipaiCheckResult => {
  const { match: charCountMatch, diff: charCountDiff } = checkCharCount(
    text,
    line.charCount,
    ruleSet.charCountTolerance
  )
  
  const { matches: toneMatches, matchRate: toneMatchRate } = checkTonePattern(
    text,
    line.tonePattern
  )
  
  const { match: rhymeMatch } = checkRhyme(text, line.rhyme, rhymeChars)
  
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!charCountMatch) {
    if (charCountDiff > ruleSet.charCountTolerance) {
      errors.push(`字数不符：应为${line.charCount}字，实际${text.length}字`)
    } else {
      warnings.push(`字数偏差${charCountDiff}字`)
    }
  }
  
  if (toneMatchRate < 1 - ruleSet.toneTolerance) {
    const mismatched = toneMatches.filter(m => !m).length
    if (toneMatchRate < 0.5) {
      errors.push(`平仄不符：${mismatched}字平仄不合`)
    } else {
      warnings.push(`平仄微调：${mismatched}字可斟酌`)
    }
  }
  
  if (line.rhyme && !rhymeMatch) {
    if (ruleSet.rhymeTolerance === 0) {
      errors.push('韵脚不符')
    } else {
      warnings.push('韵脚可酌')
    }
  }
  
  return {
    lineIndex: line.index,
    expectedCharCount: line.charCount,
    actualCharCount: text.length,
    charCountMatch,
    toneMatches,
    rhymeMatch,
    errors,
    warnings,
  }
}

export const calculateCipaiScore = (
  lines: string[],
  cipai: CipaiTemplate,
  ruleSet: CipaiScoringRuleSet
): CipaiScoreBreakdown => {
  if (lines.length === 0) {
    return { formMatch: 0, tonePattern: 0, rhyme: 0, rhythm: 0, total: 0 }
  }
  
  const checkResults: CipaiCheckResult[] = []
  const rhymeChars: string[] = []
  
  for (let i = 0; i < Math.min(lines.length, cipai.lines.length); i++) {
    const result = checkCipaiLine(lines[i], cipai.lines[i], ruleSet, rhymeChars)
    checkResults.push(result)
    
    if (cipai.lines[i].rhyme && lines[i].length > 0) {
      rhymeChars.push(lines[i][lines[i].length - 1])
    }
  }
  
  let formMatchScore = 0
  let tonePatternScore = 0
  let rhymeScore = 0
  let rhythmScore = 0
  
  checkResults.forEach((result, index) => {
    const line = cipai.lines[index]
    if (!line) return
    
    if (result.charCountMatch) {
      formMatchScore += 1
    } else {
      const diff = Math.abs(result.actualCharCount - result.expectedCharCount)
      formMatchScore += Math.max(0, 1 - diff / line.charCount)
    }
    
    const toneMatchRate = result.toneMatches.filter(m => m).length / line.tonePattern.length
    tonePatternScore += toneMatchRate
    
    if (line.rhyme) {
      rhymeScore += result.rhymeMatch ? 1 : 0
    }
  })
  
  const totalLines = checkResults.length
  formMatchScore = totalLines > 0 ? (formMatchScore / totalLines) * 100 : 0
  tonePatternScore = totalLines > 0 ? (tonePatternScore / totalLines) * 100 : 0
  
  const rhymeLines = cipai.lines.filter(l => l.rhyme).length
  const actualRhymeLines = checkResults.filter((r, i) => cipai.lines[i]?.rhyme).length
  rhymeScore = actualRhymeLines > 0 ? (rhymeScore / actualRhymeLines) * 100 : 100
  
  const lengths = lines.map(l => l.length)
  if (lengths.length >= 2) {
    let rhythmSum = 0
    for (let i = 0; i < lengths.length - 1; i++) {
      const ratio = Math.min(lengths[i], lengths[i + 1]) / Math.max(lengths[i], lengths[i + 1])
      rhythmSum += ratio
    }
    rhythmScore = (rhythmSum / (lengths.length - 1)) * 100
  } else {
    rhythmScore = 50
  }
  
  const { config } = ruleSet
  const totalWeight = config.formMatchWeight + config.tonePatternWeight + config.rhymeWeight + config.rhythmWeight
  const total = Math.round(
    (formMatchScore * config.formMatchWeight +
      tonePatternScore * config.tonePatternWeight +
      rhymeScore * config.rhymeWeight +
      rhythmScore * config.rhythmWeight) /
      totalWeight
  )
  
  return {
    formMatch: Math.round(formMatchScore),
    tonePattern: Math.round(tonePatternScore),
    rhyme: Math.round(rhymeScore),
    rhythm: Math.round(rhythmScore),
    total,
  }
}

export const generateCipaiRecommendations = (
  lines: string[],
  cipai: CipaiTemplate,
  phrases: Phrase[],
  ruleSet: CipaiScoringRuleSet
): CipaiRecommendation[] => {
  const recommendations: CipaiRecommendation[] = []
  
  const currentLineIndex = lines.findIndex(l => l.length === 0)
  const targetLineIndex = currentLineIndex === -1 ? lines.length : currentLineIndex
  const targetLine = cipai.lines[targetLineIndex]
  
  if (targetLine) {
    const charCountRecs = phrases
      .filter(p => Math.abs(p.text.length - targetLine.charCount) <= ruleSet.charCountTolerance + 1)
      .slice(0, 5)
      .map(p => p.text)
    
    if (charCountRecs.length > 0) {
      recommendations.push({
        type: 'char_count',
        description: `推荐第${targetLine.index + 1}句（${targetLine.charCount}字）`,
        suggestions: charCountRecs,
        priority: 'high',
      })
    }
    
    if (targetLine.rhyme && lines.length > 0) {
      const lastRhymeLine = [...lines].reverse().find((l, i) => {
        const lineIdx = lines.length - 1 - i
        return cipai.lines[lineIdx]?.rhyme && l.length > 0
      })
      
      if (lastRhymeLine) {
        const rhymeChar = lastRhymeLine[lastRhymeLine.length - 1]
        const rhymeRecs = phrases
          .filter(p => p.text.endsWith(rhymeChar) || getToneOfChar(p.text[p.text.length - 1]) === getToneOfChar(rhymeChar))
          .slice(0, 5)
          .map(p => p.text)
        
        if (rhymeRecs.length > 0) {
          recommendations.push({
            type: 'rhyme',
            description: `押韵推荐（韵脚：${rhymeChar}）`,
            suggestions: rhymeRecs,
            priority: 'medium',
          })
        }
      }
    }
  }
  
  const scenePhrases = phrases.filter(p => p.category === 'scene').slice(0, 3).map(p => p.text)
  if (scenePhrases.length > 0) {
    recommendations.push({
      type: 'category',
      description: '景物意象推荐',
      suggestions: scenePhrases,
      priority: 'low',
    })
  }
  
  return recommendations
}

export const phrasesToLines = (phrases: Phrase[]): string[] => {
  return phrases
    .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0) || (a.position?.x || 0) - (b.position?.x || 0))
    .map(p => p.text)
}

export const getCipaiScoreForPhrases = (
  phrases: Phrase[],
  cipaiId: string,
  scoringMode: string = 'standard'
): { score: CipaiScoreBreakdown; checkResults: CipaiCheckResult[]; recommendations: CipaiRecommendation[] } | null => {
  const cipai = getCipaiById(cipaiId)
  if (!cipai) return null
  
  const ruleSet = getCipaiScoringRuleByMode(scoringMode)
  if (!ruleSet) return null
  
  const lines = phrasesToLines(phrases)
  const score = calculateCipaiScore(lines, cipai, ruleSet)
  
  const checkResults: CipaiCheckResult[] = []
  const rhymeChars: string[] = []
  
  for (let i = 0; i < Math.min(lines.length, cipai.lines.length); i++) {
    const result = checkCipaiLine(lines[i], cipai.lines[i], ruleSet, rhymeChars)
    checkResults.push(result)
    if (cipai.lines[i].rhyme && lines[i].length > 0) {
      rhymeChars.push(lines[i][lines[i].length - 1])
    }
  }
  
  const recommendations = generateCipaiRecommendations(lines, cipai, phrases, ruleSet)
  
  return { score, checkResults, recommendations }
}

export const getCurrentLineIndex = (phrases: Phrase[], cipai: CipaiTemplate): number => {
  const lines = phrasesToLines(phrases)
  const idx = lines.findIndex(l => l.length === 0)
  return idx === -1 ? Math.min(lines.length, cipai.lines.length) : idx
}

export const getRhymeCharsFromLines = (phrases: Phrase[], cipai: CipaiTemplate): string[] => {
  const lines = phrasesToLines(phrases)
  const rhymeChars: string[] = []
  
  for (let i = 0; i < Math.min(lines.length, cipai.lines.length); i++) {
    if (cipai.lines[i].rhyme && lines[i].length > 0) {
      rhymeChars.push(lines[i][lines[i].length - 1])
    }
  }
  
  return rhymeChars
}

export const calculatePhraseMatchScore = (
  phrase: Phrase,
  targetLine: CipaiLine | undefined,
  rhymeChars: string[],
  ruleSet: CipaiScoringRuleSet
): number => {
  if (!targetLine) return 0.5
  
  let score = 0
  
  const charDiff = Math.abs(phrase.text.length - targetLine.charCount)
  const charScore = Math.max(0, 1 - charDiff / Math.max(targetLine.charCount, 1))
  score += charScore * 0.4
  
  const { matchRate: toneMatchRate } = checkTonePattern(phrase.text, targetLine.tonePattern)
  score += toneMatchRate * 0.3
  
  if (targetLine.rhyme && rhymeChars.length > 0) {
    const lastChar = phrase.text[phrase.text.length - 1]
    const lastCharTone = getToneOfChar(lastChar)
    const hasRhymeMatch = rhymeChars.some(rc => {
      const rcTone = getToneOfChar(rc)
      return rc === lastChar || rcTone === lastCharTone
    })
    score += hasRhymeMatch ? 0.3 : 0
  } else if (targetLine.rhyme) {
    score += 0.15
  } else {
    score += 0.15
  }
  
  const rarityBonus = phrase.rarity === 'legendary' ? 0.1 :
                      phrase.rarity === 'epic' ? 0.05 :
                      phrase.rarity === 'rare' ? 0.02 : 0
  score = Math.min(score + rarityBonus, 1)
  
  return score
}

export const sortPhrasesForCipai = (
  phrases: Phrase[],
  cipai: CipaiTemplate | null,
  placedPhrases: Phrase[],
  ruleSet: CipaiScoringRuleSet
): Phrase[] => {
  if (!cipai) return phrases
  
  const currentLineIdx = getCurrentLineIndex(placedPhrases, cipai)
  const targetLine = cipai.lines[currentLineIdx]
  const rhymeChars = getRhymeCharsFromLines(placedPhrases, cipai)
  
  const scored = phrases.map(phrase => ({
    phrase,
    score: calculatePhraseMatchScore(phrase, targetLine, rhymeChars, ruleSet),
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  return scored.map(s => s.phrase)
}

export const getCipaiPhraseRecommendations = (
  poolPhrases: Phrase[],
  cipai: CipaiTemplate | null,
  placedPhrases: Phrase[],
  ruleSet: CipaiScoringRuleSet,
  limit: number = 10
): Phrase[] => {
  if (!cipai) return []
  
  const sorted = sortPhrasesForCipai(poolPhrases, cipai, placedPhrases, ruleSet)
  return sorted.slice(0, limit)
}

export const getCipaiProgress = (
  placedPhrases: Phrase[],
  cipai: CipaiTemplate | null
): { filledLines: number; totalLines: number; filledChars: number; totalChars: number; percentage: number } => {
  if (!cipai) {
    return { filledLines: 0, totalLines: 0, filledChars: 0, totalChars: 0, percentage: 0 }
  }
  
  const lines = phrasesToLines(placedPhrases)
  const filledLines = Math.min(lines.filter(l => l.length > 0).length, cipai.lines.length)
  const totalLines = cipai.lines.length
  const filledChars = lines.reduce((sum, l) => sum + l.length, 0)
  const totalChars = cipai.totalChars
  const percentage = totalChars > 0 ? Math.round((filledChars / totalChars) * 100) : 0
  
  return { filledLines, totalLines, filledChars, totalChars, percentage }
}

export const getNextLineHint = (
  placedPhrases: Phrase[],
  cipai: CipaiTemplate | null
): { lineIndex: number; charCount: number; isRhyme: string; description: string } | null => {
  if (!cipai) return null
  
  const currentIdx = getCurrentLineIndex(placedPhrases, cipai)
  if (currentIdx >= cipai.lines.length) return null
  
  const line = cipai.lines[currentIdx]
  return {
    lineIndex: currentIdx,
    charCount: line.charCount,
    isRhyme: line.rhyme ? '是' : '否',
    description: line.description || '',
  }
}
