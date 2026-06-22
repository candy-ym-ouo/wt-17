import type { ImpromptuTopicTheme, ImpromptuTopic, TimePeriod, PhraseCategory, Phrase, PhraseRarity } from '@/types'
import { TIME_PERIOD_LABELS } from '@/types'

export const impromptuTopicThemes: ImpromptuTopicTheme[] = [
  {
    id: 'theme_dawn_awakening',
    name: '晨光初照',
    description: '黎明时分，万物苏醒。以新生与希望为墨，书写清晨的生机。',
    icon: '🌅',
    accentColor: '#e8b87a',
    periodAffinity: ['dawn', 'morning'],
    keywords: ['黎明', '初雪', '清风', '翠竹', '新燕', '初蕾', '清欢', '悠然'],
    categoryWeights: { scene: 1.4, time: 1.3, emotion: 1.1, imagery: 1.0, action: 0.8 },
    scoringPreference: { imagery: 0.3, themeMatch: 0.25, coherence: 0.25, rhythm: 0.2 },
    themeMatchBonus: 0.12,
    preferredCategories: ['scene', 'time', 'emotion']
  },
  {
    id: 'theme_noon_vigor',
    name: '日正当中',
    description: '正午阳光炽烈，万物尽显其形。以明快与力量入诗，书写日中的热烈。',
    icon: '☀️',
    accentColor: '#d4a04a',
    periodAffinity: ['noon', 'afternoon'],
    keywords: ['青山', '长河', '独坐', '凭栏', '落笔', '浊酒', '狂喜', '抚琴'],
    categoryWeights: { action: 1.4, scene: 1.2, imagery: 1.1, emotion: 1.0, time: 0.8 },
    scoringPreference: { coherence: 0.3, rhythm: 0.25, imagery: 0.25, themeMatch: 0.2 },
    themeMatchBonus: 0.1,
    preferredCategories: ['action', 'scene', 'imagery']
  },
  {
    id: 'theme_dusk_farewell',
    name: '落日余晖',
    description: '黄昏时分，光影交替。以离别与追忆为韵，书写暮色的柔情。',
    icon: '🌆',
    accentColor: '#c97a54',
    periodAffinity: ['dusk', 'afternoon'],
    keywords: ['残阳', '归雁', '日暮', '离愁', '惆怅', '古道', '西风', '遥望'],
    categoryWeights: { emotion: 1.4, scene: 1.3, time: 1.2, imagery: 1.0, action: 0.8 },
    scoringPreference: { themeMatch: 0.3, imagery: 0.25, coherence: 0.25, rhythm: 0.2 },
    themeMatchBonus: 0.12,
    preferredCategories: ['emotion', 'scene', 'time']
  },
  {
    id: 'theme_night_reverie',
    name: '月下幽思',
    description: '夜幕低垂，万籁俱寂。以思念与幽梦为引，书写夜晚的深邃。',
    icon: '🌙',
    accentColor: '#8ba8c9',
    periodAffinity: ['evening', 'midnight'],
    keywords: ['明月', '繁星', '夜雨', '青灯', '素笺', '残梦', '相思', '缱绻'],
    categoryWeights: { imagery: 1.4, emotion: 1.3, time: 1.1, scene: 1.0, action: 0.7 },
    scoringPreference: { imagery: 0.3, themeMatch: 0.25, coherence: 0.25, rhythm: 0.2 },
    themeMatchBonus: 0.12,
    preferredCategories: ['imagery', 'emotion', 'time']
  },
  {
    id: 'theme_midnight_zen',
    name: '子夜参禅',
    description: '万籁俱寂，子夜深沉。以空灵与顿悟为境，书写深夜的禅意。',
    icon: '🌌',
    accentColor: '#7a9ea8',
    periodAffinity: ['midnight', 'dawn'],
    keywords: ['千年', '一瞬', '淡泊', '忘言', '太虚', '无我', '独坐', '凝思'],
    categoryWeights: { imagery: 1.3, emotion: 1.2, time: 1.3, scene: 0.9, action: 0.8 },
    scoringPreference: { themeMatch: 0.3, imagery: 0.25, rhythm: 0.25, coherence: 0.2 },
    themeMatchBonus: 0.15,
    preferredCategories: ['imagery', 'time', 'emotion'],
    forbiddenWords: ['狂喜'],
    requiredKeywords: ['千年', '一瞬', '淡泊', '忘言', '太虚', '无我']
  },
  {
    id: 'theme_rain_solitude',
    name: '雨中独步',
    description: '细雨绵绵，独立于天地之间。以孤独与清寂为笔，书写雨中的诗情。',
    icon: '🌧️',
    accentColor: '#6b8e9b',
    periodAffinity: ['afternoon', 'evening', 'dusk'],
    keywords: ['夜雨', '寒烟', '孤舟', '寂寥', '古道', '残梦', '怅惘', '凭栏'],
    categoryWeights: { scene: 1.3, emotion: 1.3, imagery: 1.2, time: 0.9, action: 0.9 },
    scoringPreference: { coherence: 0.3, themeMatch: 0.25, imagery: 0.25, rhythm: 0.2 },
    themeMatchBonus: 0.12,
    preferredCategories: ['scene', 'emotion', 'imagery']
  }
]

const topicTemplates: Array<{
  titleTemplate: string
  subtitleTemplate: string
  descriptionTemplate: string
  requiredKeywordCount: number
  forbiddenCount: number
  timeLimitSeconds: number
  targetPhraseCount: number
  bonusTypes: ImpromptuTopic['bonusRules'][0]['type'][]
  poolRefreshCategory: PhraseCategory
  poolRefreshCount: number
}> = [
  {
    titleTemplate: '{period}·{theme}',
    subtitleTemplate: '限时{time}分钟 | 目标{count}词',
    descriptionTemplate: '以「{themeName}」为意，于{periodName}时分挥毫。{themeDesc}',
    requiredKeywordCount: 2,
    forbiddenCount: 1,
    timeLimitSeconds: 300,
    targetPhraseCount: 6,
    bonusTypes: ['keyword_combo', 'category_balance', 'speed_bonus'],
    poolRefreshCategory: 'scene',
    poolRefreshCount: 3
  },
  {
    titleTemplate: '即兴·{theme}',
    subtitleTemplate: '限时{time}分钟 | 目标{count}词',
    descriptionTemplate: '临场命题，以「{themeName}」入诗，须融入指定关键词。{themeDesc}',
    requiredKeywordCount: 3,
    forbiddenCount: 2,
    timeLimitSeconds: 240,
    targetPhraseCount: 5,
    bonusTypes: ['keyword_combo', 'rare_phrase', 'period_match'],
    poolRefreshCategory: 'imagery',
    poolRefreshCount: 4
  },
  {
    titleTemplate: '{period}即题·{theme}',
    subtitleTemplate: '限时{time}分钟 | 目标{count}词',
    descriptionTemplate: '限时临场，以「{themeName}」为题，{periodName}之景入诗。{themeDesc}',
    requiredKeywordCount: 2,
    forbiddenCount: 1,
    timeLimitSeconds: 180,
    targetPhraseCount: 5,
    bonusTypes: ['speed_bonus', 'category_balance', 'keyword_combo'],
    poolRefreshCategory: 'emotion',
    poolRefreshCount: 3
  }
]

export const getCurrentTimePeriod = (): TimePeriod => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 13) return 'noon'
  if (hour >= 13 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 19) return 'dusk'
  if (hour >= 19 && hour < 23) return 'evening'
  return 'midnight'
}

let topicIdCounter = 0
const tid = () => `imp_${Date.now()}_${++topicIdCounter}`

export const generateImpromptuTopic = (period?: TimePeriod): ImpromptuTopic => {
  const currentPeriod = period || getCurrentTimePeriod()
  
  const eligibleThemes = impromptuTopicThemes.filter(t =>
    t.periodAffinity.includes(currentPeriod)
  )
  const theme = eligibleThemes.length > 0
    ? eligibleThemes[Math.floor(Math.random() * eligibleThemes.length)]
    : impromptuTopicThemes[Math.floor(Math.random() * impromptuTopicThemes.length)]

  const template = topicTemplates[Math.floor(Math.random() * topicTemplates.length)]

  const periodLabel = TIME_PERIOD_LABELS[currentPeriod]

  const shuffledKeywords = [...theme.keywords].sort(() => Math.random() - 0.5)
  const requiredKeywords = shuffledKeywords.slice(0, template.requiredKeywordCount)

  const allPhraseTexts = [
    '明月', '青山', '流水', '落花', '白云', '清风', '残阳', '孤舟',
    '垂柳', '寒烟', '翠竹', '古寺', '长河', '荒原', '繁星', '夜雨',
    '初雪', '相思', '离愁', '怅惘', '悠然', '寂寥', '缱绻', '惆怅',
    '清欢', '独坐', '遥望', '轻吟', '独酌', '漫步', '凝思', '落笔',
    '抚琴', '凭栏', '低眉', '长叹', '回眸', '故人', '归雁', '寒梅',
    '浊酒', '残梦', '旧约', '素笺', '锦瑟', '玉笛', '青灯', '古道',
    '西风', '千年', '一瞬', '昨夜', '今朝', '黄昏', '黎明', '日暮',
    '岁末', '春深', '秋凉', '淡泊', '忘言', '太虚', '无我'
  ]
  const availableForbidden = allPhraseTexts.filter(
    t => !theme.keywords.includes(t) && !requiredKeywords.includes(t)
  )
  const forbiddenWords = availableForbidden
    .sort(() => Math.random() - 0.5)
    .slice(0, template.forbiddenCount)

  const bonusRules: ImpromptuTopic['bonusRules'] = []

  if (template.bonusTypes.includes('keyword_combo')) {
    bonusRules.push({
      type: 'keyword_combo',
      label: '关键词连击',
      description: `同时使用${requiredKeywords.length}个指定关键词`,
      bonus: 8,
      params: { keywords: requiredKeywords }
    })
  }

  if (template.bonusTypes.includes('category_balance')) {
    bonusRules.push({
      type: 'category_balance',
      label: '词类均衡',
      description: '使用至少3个不同词类',
      bonus: 5,
      params: { categories: ['scene', 'emotion', 'imagery', 'time', 'action'], minCount: 1 }
    })
  }

  if (template.bonusTypes.includes('speed_bonus')) {
    bonusRules.push({
      type: 'speed_bonus',
      label: '速战速决',
      description: `在${Math.floor(template.timeLimitSeconds * 0.6)}秒内完成`,
      bonus: 6,
      params: { maxSeconds: Math.floor(template.timeLimitSeconds * 0.6) }
    })
  }

  if (template.bonusTypes.includes('rare_phrase')) {
    bonusRules.push({
      type: 'rare_phrase',
      label: '珍词妙用',
      description: '使用至少2个稀有及以上词句',
      bonus: 5,
      params: { minRarity: 'rare', minCount: 2 }
    })
  }

  if (template.bonusTypes.includes('period_match')) {
    bonusRules.push({
      type: 'period_match',
      label: '时令契合',
      description: '使用与当前时段相关的词句',
      bonus: 4,
      params: { periodKeywords: theme.keywords.slice(0, 5) }
    })
  }

  const rewards: ImpromptuTopic['rewards'] = [
    {
      tier: 'bronze',
      minScore: 50,
      rewards: [
        { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: template.poolRefreshCategory, count: 2 } }
      ]
    },
    {
      tier: 'silver',
      minScore: 70,
      rewards: [
        { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: template.poolRefreshCategory, count: 3 } },
        { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.05 } }
      ]
    },
    {
      tier: 'gold',
      minScore: 90,
      rewards: [
        { type: 'phrase_unlock', params: { phraseTexts: theme.keywords.slice(0, 2) } },
        { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.08 } },
        { type: 'title_reward', params: { title: `临场·${theme.name}` } }
      ]
    }
  ]

  const title = template.titleTemplate
    .replace('{period}', periodLabel)
    .replace('{theme}', theme.name)
  const subtitle = template.subtitleTemplate
    .replace('{time}', String(Math.floor(template.timeLimitSeconds / 60)))
    .replace('{count}', String(template.targetPhraseCount))
  const description = template.descriptionTemplate
    .replace('{themeName}', theme.name)
    .replace('{periodName}', periodLabel)
    .replace('{themeDesc}', theme.description)

  return {
    id: tid(),
    themeId: theme.id,
    period: currentPeriod,
    title,
    subtitle,
    description,
    accentColor: theme.accentColor,
    timeLimitSeconds: template.timeLimitSeconds,
    targetPhraseCount: template.targetPhraseCount,
    requiredKeywords,
    forbiddenWords,
    bonusRules,
    rewards,
    poolRefresh: {
      addKeywords: theme.keywords.slice(0, 4),
      addCategory: template.poolRefreshCategory,
      addCount: template.poolRefreshCount
    }
  }
}

export const getImpromptuTopicThemeById = (id: string): ImpromptuTopicTheme | undefined => {
  return impromptuTopicThemes.find(t => t.id === id)
}

export const getEligibleThemesForPeriod = (period: TimePeriod): ImpromptuTopicTheme[] => {
  return impromptuTopicThemes.filter(t => t.periodAffinity.includes(period))
}

export const evaluateImpromptuBonusRules = (
  phrases: Phrase[],
  rules: ImpromptuTopic['bonusRules'],
  elapsedSeconds: number,
  periodKeywords: string[] = []
): { totalBonus: number; triggeredLabels: string[] } => {
  let totalBonus = 0
  const triggeredLabels: string[] = []
  const phraseTexts = new Set(phrases.map(p => p.text))

  rules.forEach(rule => {
    let triggered = false
    switch (rule.type) {
      case 'keyword_combo': {
        const keywords = rule.params.keywords as string[]
        triggered = keywords.every(k => phraseTexts.has(k))
        break
      }
      case 'category_balance': {
        const categories = rule.params.categories as string[]
        const minCount = rule.params.minCount as number
        const catCounts: Record<string, number> = {}
        phrases.forEach(p => {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1
        })
        triggered = categories.filter(cat => (catCounts[cat] || 0) >= minCount).length >= 3
        break
      }
      case 'speed_bonus': {
        const maxSeconds = rule.params.maxSeconds as number
        triggered = elapsedSeconds <= maxSeconds
        break
      }
      case 'rare_phrase': {
        const minRarity = rule.params.minRarity as PhraseRarity
        const minCountR = rule.params.minCount as number
        const rarityOrder: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }
        const count = phrases.filter(p => rarityOrder[p.rarity] >= rarityOrder[minRarity]).length
        triggered = count >= minCountR
        break
      }
      case 'period_match': {
        const keywords = (rule.params.periodKeywords as string[]) || periodKeywords
        const matched = phrases.filter(p => keywords.includes(p.text)).length
        triggered = matched >= 2
        break
      }
    }

    if (triggered) {
      totalBonus += rule.bonus
      triggeredLabels.push(rule.label)
    }
  })

  return { totalBonus, triggeredLabels }
}
