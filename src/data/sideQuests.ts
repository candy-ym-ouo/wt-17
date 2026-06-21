import type { SideQuest } from '@/types'

export const sideQuests: SideQuest[] = [
  {
    id: 'sq_ch1_1',
    chapterId: 'ch1',
    title: '月下独酌',
    description: '在一首诗中同时使用「明月」与「独酌」，感受月下独饮的悠然。',
    icon: '🌙',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch1', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'phrase_combo', params: { texts: ['明月', '独酌'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['花间一壶酒', '对影三人'] } }
    ],
    accentColor: '#c9a86c'
  },
  {
    id: 'sq_ch1_2',
    chapterId: 'ch1',
    title: '春思百转',
    description: '在春夜之思中达到80分以上，证明你对春夜意象的领悟。',
    icon: '🌸',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch1', minCount: 2 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch1', minScore: 80 } }
    ],
    rewards: [
      { type: 'phrase_pool_refresh', params: { chapterId: 'ch1', addCategory: 'scene', count: 3 } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.05 } }
    ],
    accentColor: '#d4a5a0'
  },
  {
    id: 'sq_ch2_1',
    chapterId: 'ch2',
    title: '古道西风',
    description: '在一首秋思诗中同时使用「古道」「西风」「归雁」三词，重现经典意境。',
    icon: '🍂',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch2', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'phrase_combo', params: { texts: ['古道', '西风', '归雁'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['断肠人在天涯', '瘦马'] } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } }
    ],
    accentColor: '#d4a574'
  },
  {
    id: 'sq_ch2_2',
    chapterId: 'ch2',
    title: '秋思深处',
    description: '在秋山孤旅中选取至少6个词句并达到75分以上，深入秋思之意。',
    icon: '🏔️',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch2', minCount: 2 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch2', minScore: 75 } }
    ],
    rewards: [
      { type: 'phrase_pool_refresh', params: { chapterId: 'ch2', addCategory: 'time', count: 2 } },
      { type: 'phrase_unlock', params: { phraseTexts: ['霜降', '暮秋'] } }
    ],
    accentColor: '#a89070'
  },
  {
    id: 'sq_ch3_1',
    chapterId: 'ch3',
    title: '雪夜归途',
    description: '在一首诗中同时使用「初雪」「故人」「旧约」，唤醒归乡路上的温暖记忆。',
    icon: '❄️',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch3', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'phrase_combo', params: { texts: ['初雪', '故人', '旧约'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['柴门', '犬吠'] } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'sq_ch3_2',
    chapterId: 'ch3',
    title: '灯火阑珊',
    description: '在雪夜归人中达到90分以上，找到那盏指引归途的灯火。',
    icon: '🏮',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch3', minCount: 2 } },
      { type: 'score_threshold', params: { chapterId: 'ch3', minScore: 70 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch3', minScore: 90 } }
    ],
    rewards: [
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.08 } },
      { type: 'phrase_unlock', params: { phraseTexts: ['蓦然回首', '那人却在'] } }
    ],
    accentColor: '#d4a0a0'
  },
  {
    id: 'sq_ch4_1',
    chapterId: 'ch4',
    title: '十年一梦',
    description: '在一首诗中同时使用「锦瑟」「残梦」「玉笛」，追忆似水年华。',
    icon: '🎵',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch4', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'phrase_combo', params: { texts: ['锦瑟', '残梦', '玉笛'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['五十弦', '一弦一柱'] } },
      { type: 'score_weight_boost', params: { dimension: 'rhythm', boost: 0.05 } }
    ],
    accentColor: '#7a9ea8'
  },
  {
    id: 'sq_ch4_2',
    chapterId: 'ch4',
    title: '江湖路远',
    description: '在所有章节中累计完成5首作品，方知江湖之广阔。',
    icon: '⚔️',
    unlockConditions: [
      { type: 'chapter_count', params: { minCount: 3 } }
    ],
    completeConditions: [
      { type: 'composition_count', params: { chapterId: '__all__', minCount: 5 } }
    ],
    rewards: [
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } },
      { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: 'imagery', count: 3 } }
    ],
    accentColor: '#8a9ea8'
  },
  {
    id: 'sq_ch5_1',
    chapterId: 'ch5',
    title: '五韵俱全',
    description: '在一首诗中同时包含景物、情感、时间、动作、意象五类词句，臻于大雅。',
    icon: '✨',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch5', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'category_diversity', params: { minCategories: 5 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '五韵居士' } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } },
      { type: 'score_weight_boost', params: { dimension: 'rhythm', boost: 0.05 } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.05 } }
    ],
    accentColor: '#c98bc4'
  },
  {
    id: 'sq_ch5_2',
    chapterId: 'ch5',
    title: '无我之境',
    description: '在自由之境中达到95分以上，超脱格律，进入无我之境。',
    icon: '🌀',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch5', minCount: 2 } },
      { type: 'chapter_count', params: { minCount: 4 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch5', minScore: 95 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '无我居士' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['大道至简', '大象无形'] } }
    ],
    accentColor: '#b88bc9'
  }
]

export const getQuestsByChapter = (chapterId: string): SideQuest[] => {
  return sideQuests.filter(q => q.chapterId === chapterId)
}

export const getQuestById = (id: string): SideQuest | undefined => {
  return sideQuests.find(q => q.id === id)
}
