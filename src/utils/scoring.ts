import type { Phrase, ScoreBreakdown, Chapter } from '@/types'

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

export const calculateScore = (phrases: Phrase[], chapter: Chapter): ScoreBreakdown => {
  if (phrases.length === 0) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }

  const coherence = calcCoherence(phrases)
  const imagery = calcImagery(phrases)
  const rhythm = calcRhythm(phrases)
  const themeMatch = calcThemeMatch(phrases, chapter)
  
  const countBonus = Math.min(phrases.length / chapter.targetPhraseCount, 1)
  const total = Math.round(
    (coherence * 0.3 + imagery * 0.25 + rhythm * 0.2 + themeMatch * 0.25) * 100 * countBonus
  )

  return {
    coherence: Math.round(coherence * 100),
    imagery: Math.round(imagery * 100),
    rhythm: Math.round(rhythm * 100),
    themeMatch: Math.round(themeMatch * 100),
    total
  }
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

const calcThemeMatch = (phrases: Phrase[], chapter: Chapter): number => {
  if (chapter.theme === '自由') return 0.85
  const keywords = themeKeywords[chapter.theme] || []
  if (keywords.length === 0) return 0.6
  
  let matchCount = 0
  phrases.forEach(p => {
    if (keywords.includes(p.text)) matchCount++
  })
  
  const directMatch = matchCount / Math.max(phrases.length, 1)
  const categoryMatch = phrases.filter(p => 
    p.category === 'scene' || p.category === 'imagery' || p.category === 'emotion'
  ).length / phrases.length
  
  return Math.min(directMatch * 0.6 + categoryMatch * 0.4, 1)
}

export const getScoreGrade = (total: number): { grade: string; color: string; comment: string } => {
  if (total >= 90) return { grade: '神品', color: '#c9a86c', comment: '此曲只应天上有，人间能得几回闻。' }
  if (total >= 75) return { grade: '妙品', color: '#7a9ea8', comment: '笔落惊风雨，诗成泣鬼神。' }
  if (total >= 60) return { grade: '佳品', color: '#6b8e6b', comment: '清水出芙蓉，天然去雕饰。' }
  if (total >= 40) return { grade: '能品', color: '#a8a498', comment: '初窥门径，尚可雕琢。' }
  return { grade: '习作', color: '#6b6858', comment: '诗无达诂，意蕴由心。' }
}

export const generatePoemTitle = (phrases: Phrase[]): string => {
  if (phrases.length === 0) return '无题'
  const keyPhrases = phrases
    .filter(p => p.category === 'scene' || p.category === 'imagery' || p.category === 'emotion')
    .slice(0, 2)
  if (keyPhrases.length === 0) return phrases[0].text
  return keyPhrases.map(p => p.text).join('·')
}
