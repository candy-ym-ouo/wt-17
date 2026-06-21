import type { PoetryGathering, Phrase, PhraseCategory } from '@/types'
import { generateChapterPhrasesWithSource } from './phrases'

const now = Date.now()
const DAY = 24 * 60 * 60 * 1000

export const poetryGatherings: PoetryGathering[] = [
  {
    id: 'pg_moonlit',
    title: '月下诗会',
    subtitle: '花间一壶酒，独酌无相亲',
    description: '月色如水，花影扶疏。限时以月、花、酒为题，逐章创作，角逐诗坛桂冠。',
    icon: '🌙',
    accentColor: '#c9a86c',
    status: 'active',
    startDate: now - DAY,
    endDate: now + 6 * DAY,
    chapters: [
      {
        id: 'pg_moonlit_ch1',
        title: '对月独酌',
        description: '举杯邀明月，对影成三人。以月与酒为引，选词成诗。',
        theme: '月下独酌',
        timeLimitSeconds: 180,
        targetPhraseCount: 5,
        requiredKeywords: ['明月', '独酌'],
        forbiddenWords: ['狂喜'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '月酒双辉',
            description: '同时使用「明月」与「独酌」，总分加5',
            bonus: 5,
            params: { keywords: ['明月', '独酌'] }
          },
          {
            type: 'speed_bonus',
            label: '才思敏捷',
            description: '90秒内完成创作，总分加3',
            bonus: 3,
            params: { maxSeconds: 90 }
          }
        ]
      },
      {
        id: 'pg_moonlit_ch2',
        title: '花间月影',
        description: '花间一壶酒，月下两徘徊。融入花与月，成双成对。',
        theme: '花月交辉',
        timeLimitSeconds: 180,
        targetPhraseCount: 6,
        requiredKeywords: ['落花', '清风'],
        forbiddenWords: ['孤苦'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '花月相逢',
            description: '同时使用「落花」与「清风」，总分加5',
            bonus: 5,
            params: { keywords: ['落花', '清风'] }
          },
          {
            type: 'category_balance',
            label: '情景交融',
            description: '景物与情感类各含2词以上，总分加4',
            bonus: 4,
            params: { categories: ['scene', 'emotion'], minCount: 2 }
          }
        ]
      },
      {
        id: 'pg_moonlit_ch3',
        title: '月落归人',
        description: '月落乌啼霜满天，江枫渔火对愁眠。以归思收束月夜长歌。',
        theme: '月夜归思',
        timeLimitSeconds: 240,
        targetPhraseCount: 7,
        requiredKeywords: ['相思', '缱绻'],
        forbiddenWords: ['淡泊'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '相思缱绻',
            description: '同时使用「相思」与「缱绻」，总分加6',
            bonus: 6,
            params: { keywords: ['相思', '缱绻'] }
          },
          {
            type: 'rare_phrase',
            label: '珍词妙句',
            description: '使用稀有及以上词句3个，总分加4',
            bonus: 4,
            params: { minRarity: 'rare', minCount: 3 }
          },
          {
            type: 'speed_bonus',
            label: '挥毫立就',
            description: '120秒内完成创作，总分加4',
            bonus: 4,
            params: { maxSeconds: 120 }
          }
        ]
      }
    ],
    rewards: [
      {
        tier: 'bronze',
        minScore: 50,
        minChaptersCleared: 1,
        rewards: [
          { type: 'phrase_unlock', params: { phraseTexts: ['月下独酌', '对影三人'] } }
        ]
      },
      {
        tier: 'silver',
        minScore: 70,
        minChaptersCleared: 2,
        rewards: [
          { type: 'title_reward', params: { title: '月下才子' } },
          { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.04 } }
        ]
      },
      {
        tier: 'gold',
        minScore: 85,
        minChaptersCleared: 3,
        rewards: [
          { type: 'title_reward', params: { title: '花月诗仙' } },
          { type: 'phrase_unlock', params: { phraseTexts: ['花间一壶酒', '举杯邀明月'] } },
          { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } }
        ]
      },
      {
        tier: 'platinum',
        minScore: 95,
        minChaptersCleared: 3,
        rewards: [
          { type: 'title_reward', params: { title: '月宫词客' } },
          { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: 'imagery', count: 3 } },
          { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } }
        ]
      }
    ]
  },
  {
    id: 'pg_autumn',
    title: '秋风雅集',
    subtitle: '自古逢秋悲寂寥，我言秋日胜春朝',
    description: '秋意渐浓，以秋山、古道、归雁为题，三番限时竞逐，秋思为伴。',
    icon: '🍂',
    accentColor: '#d4a574',
    status: 'upcoming',
    startDate: now + 3 * DAY,
    endDate: now + 10 * DAY,
    chapters: [
      {
        id: 'pg_autumn_ch1',
        title: '秋山远望',
        description: '远上寒山石径斜，白云生处有人家。以秋山起笔，写尽秋日远望。',
        theme: '秋山远望',
        timeLimitSeconds: 180,
        targetPhraseCount: 5,
        requiredKeywords: ['残阳', '青山'],
        forbiddenWords: ['清欢'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '残阳青山',
            description: '同时使用「残阳」与「青山」，总分加5',
            bonus: 5,
            params: { keywords: ['残阳', '青山'] }
          }
        ]
      },
      {
        id: 'pg_autumn_ch2',
        title: '古道西风',
        description: '古道西风瘦马，夕阳西下，断肠人在天涯。',
        theme: '古道秋思',
        timeLimitSeconds: 180,
        targetPhraseCount: 6,
        requiredKeywords: ['古道', '西风'],
        forbiddenWords: ['悠然'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '古道西风',
            description: '同时使用「古道」与「西风」，总分加5',
            bonus: 5,
            params: { keywords: ['古道', '西风'] }
          },
          {
            type: 'category_balance',
            label: '情景交融',
            description: '景物与情感类各含2词以上，总分加4',
            bonus: 4,
            params: { categories: ['scene', 'emotion'], minCount: 2 }
          }
        ]
      },
      {
        id: 'pg_autumn_ch3',
        title: '归雁长空',
        description: '乡书何处达？归雁洛阳边。以归雁寄托秋思，收束全篇。',
        theme: '秋雁归思',
        timeLimitSeconds: 240,
        targetPhraseCount: 7,
        requiredKeywords: ['归雁', '离愁'],
        forbiddenWords: ['狂喜'],
        bonusRules: [
          {
            type: 'keyword_combo',
            label: '雁归愁生',
            description: '同时使用「归雁」与「离愁」，总分加6',
            bonus: 6,
            params: { keywords: ['归雁', '离愁'] }
          },
          {
            type: 'rare_phrase',
            label: '秋词珍选',
            description: '使用稀有及以上词句3个，总分加4',
            bonus: 4,
            params: { minRarity: 'rare', minCount: 3 }
          }
        ]
      }
    ],
    rewards: [
      {
        tier: 'bronze',
        minScore: 50,
        minChaptersCleared: 1,
        rewards: [
          { type: 'phrase_unlock', params: { phraseTexts: ['秋水长天', '落霞孤鹜'] } }
        ]
      },
      {
        tier: 'silver',
        minScore: 70,
        minChaptersCleared: 2,
        rewards: [
          { type: 'title_reward', params: { title: '秋山墨客' } },
          { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.04 } }
        ]
      },
      {
        tier: 'gold',
        minScore: 85,
        minChaptersCleared: 3,
        rewards: [
          { type: 'title_reward', params: { title: '秋风雅士' } },
          { type: 'phrase_unlock', params: { phraseTexts: ['霜天晓角', '秋声赋'] } },
          { type: 'score_weight_boost', params: { dimension: 'rhythm', boost: 0.05 } }
        ]
      },
      {
        tier: 'platinum',
        minScore: 95,
        minChaptersCleared: 3,
        rewards: [
          { type: 'title_reward', params: { title: '秋水词宗' } },
          { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: 'scene', count: 3 } }
        ]
      }
    ]
  }
]

export const getGatheringById = (id: string): PoetryGathering | undefined => {
  return poetryGatherings.find(g => g.id === id)
}

export const getActiveGatherings = (): PoetryGathering[] => {
  return poetryGatherings.filter(g => g.status === 'active')
}

export const getGatheringChapterById = (gatheringId: string, chapterId: string) => {
  const gathering = getGatheringById(gatheringId)
  if (!gathering) return undefined
  return gathering.chapters.find(ch => ch.id === chapterId)
}

export const getGatheringChapterPhrases = (gatheringId: string, chapterId: string): Phrase[] => {
  const chapter = getGatheringChapterById(gatheringId, chapterId)
  if (!chapter) return []
  const gathering = getGatheringById(gatheringId)!
  const themeKeywords = chapter.requiredKeywords
  const phrases = generateChapterPhrasesWithSource(
    gatheringId,
    `${gathering.title}·${chapter.title}`,
    themeKeywords,
    chapter.targetPhraseCount + 8,
    { scene: 0.3, emotion: 0.25, imagery: 0.2, time: 0.1, action: 0.15 } as Partial<Record<PhraseCategory, number>>
  )
  return phrases
}
