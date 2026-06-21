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
  },
  {
    id: 'ach_highscore_1',
    chapterId: 'ch1',
    title: '春夜探花',
    description: '在春江花月章节达到90分以上，摘取春夜最美的花。',
    icon: '🏆',
    unlockConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch1', minScore: 75 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch1', minScore: 90 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '探花郎' } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } }
    ],
    accentColor: '#c9a86c'
  },
  {
    id: 'ach_highscore_2',
    chapterId: 'ch2',
    title: '秋山会元',
    description: '在秋山孤旅章节达到90分以上，羁旅之愁化为笔下锦绣。',
    icon: '🏅',
    unlockConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch2', minScore: 75 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch2', minScore: 90 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '会元' } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } }
    ],
    accentColor: '#d4a574'
  },
  {
    id: 'ach_highscore_3',
    chapterId: 'ch3',
    title: '雪夜状元',
    description: '在雪夜归人章节达到90分以上，归乡路上摘得桂冠。',
    icon: '👑',
    unlockConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch3', minScore: 75 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch3', minScore: 90 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '状元' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['金榜题名', '衣锦还乡'] } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'ach_highscore_4',
    chapterId: 'ch4',
    title: '江湖盟主',
    description: '在江湖夜雨章节达到90分以上，成为江湖人人敬仰的盟主。',
    icon: '⚔️',
    unlockConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch4', minScore: 75 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch4', minScore: 90 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '武林盟主' } },
      { type: 'score_weight_boost', params: { dimension: 'rhythm', boost: 0.05 } }
    ],
    accentColor: '#7a9ea8'
  },
  {
    id: 'ach_highscore_5',
    chapterId: 'ch1',
    title: '大满贯',
    description: '在所有章节都达到80分以上，诗词之道融会贯通。',
    icon: '🎖️',
    unlockConditions: [
      { type: 'chapter_count', params: { minCount: 4 } }
    ],
    completeConditions: [
      { type: 'all_chapters_score', params: { minScore: 80 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '诗词圣手' } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.05 } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.05 } }
    ],
    accentColor: '#c98bc4'
  },
  {
    id: 'ach_combo_1',
    chapterId: 'ch1',
    title: '星月交辉',
    description: '在一首诗中同时使用史诗与传说稀有度的词句，星月同辉。',
    icon: '⭐',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch1', minCount: 3 } }
    ],
    completeConditions: [
      { type: 'rarity_combo', params: { rarities: ['epic', 'legendary'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['星月交辉', '璀璨星河'] } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.03 } }
    ],
    accentColor: '#c9a86c'
  },
  {
    id: 'ach_combo_2',
    chapterId: 'ch3',
    title: '雪夜故人来',
    description: '在一首诗中同时使用「初雪」「故人」「青灯」「旧约」四词。',
    icon: '❄️',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch3', minCount: 2 } }
    ],
    completeConditions: [
      { type: 'phrase_combo', params: { texts: ['初雪', '故人', '青灯', '旧约'] } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['围炉夜话', '剪烛西窗'] } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.04 } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'ach_combo_3',
    chapterId: 'ch5',
    title: '稀世珍藏',
    description: '在一首诗中同时使用稀有、史诗、传说三种稀有度的词句。',
    icon: '💎',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch5', minCount: 3 } }
    ],
    completeConditions: [
      { type: 'rarity_combo', params: { rarities: ['rare', 'epic', 'legendary'] } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '鉴宝大师' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['稀世之珍', '价值连城'] } }
    ],
    accentColor: '#c98bc4'
  },
  {
    id: 'ach_streak_1',
    chapterId: 'ch1',
    title: '三连佳作',
    description: '连续三首作品都达到60分以上，手感正佳。',
    icon: '🔥',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: '__all__', minCount: 3 } }
    ],
    completeConditions: [
      { type: 'win_streak', params: { minStreak: 3, streakType: 'current' } }
    ],
    rewards: [
      { type: 'score_weight_boost', params: { dimension: 'rhythm', boost: 0.03 } }
    ],
    accentColor: '#d4a0a0'
  },
  {
    id: 'ach_streak_2',
    chapterId: 'ch2',
    title: '五连妙品',
    description: '连续五首作品都达到75分以上，妙笔生花。',
    icon: '🌟',
    unlockConditions: [
      { type: 'win_streak', params: { minStreak: 3, streakType: 'best' } }
    ],
    completeConditions: [
      { type: 'win_streak', params: { minStreak: 5, streakType: 'current' } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '妙笔生花' } },
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.04 } }
    ],
    accentColor: '#d4a574'
  },
  {
    id: 'ach_streak_3',
    chapterId: 'ch3',
    title: '十全十美',
    description: '最佳连胜记录达到10次，笔耕不辍，佳作连连。',
    icon: '💯',
    unlockConditions: [
      { type: 'win_streak', params: { minStreak: 5, streakType: 'best' } }
    ],
    completeConditions: [
      { type: 'win_streak', params: { minStreak: 10, streakType: 'best' } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '十全十美' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['笔耕不辍', '佳作连篇'] } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.05 } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'ach_collection_1',
    chapterId: 'ch1',
    title: '初涉词海',
    description: '收集20个不同的词句，初窥诗词殿堂之门径。',
    icon: '📚',
    unlockConditions: [
      { type: 'phrase_collection_count', params: { minCount: 10 } }
    ],
    completeConditions: [
      { type: 'phrase_collection_count', params: { minCount: 20 } }
    ],
    rewards: [
      { type: 'score_weight_boost', params: { dimension: 'imagery', boost: 0.02 } }
    ],
    accentColor: '#6b8e6b'
  },
  {
    id: 'ach_collection_2',
    chapterId: 'ch2',
    title: '学富五车',
    description: '收集40个不同的词句，腹有诗书气自华。',
    icon: '📖',
    unlockConditions: [
      { type: 'phrase_collection_count', params: { minCount: 25 } }
    ],
    completeConditions: [
      { type: 'phrase_collection_count', params: { minCount: 40 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '学富五车' } },
      { type: 'score_weight_boost', params: { dimension: 'coherence', boost: 0.03 } }
    ],
    accentColor: '#d4a574'
  },
  {
    id: 'ach_collection_3',
    chapterId: 'ch3',
    title: '才高八斗',
    description: '收集60个不同的词句，才高八斗，学贯古今。',
    icon: '🎓',
    unlockConditions: [
      { type: 'phrase_collection_count', params: { minCount: 45 } }
    ],
    completeConditions: [
      { type: 'phrase_collection_count', params: { minCount: 60 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '才高八斗' } },
      { type: 'phrase_pool_refresh', params: { chapterId: '__all__', addCategory: 'imagery', count: 2 } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'ach_collection_4',
    chapterId: 'ch4',
    title: '珍藏传奇',
    description: '收集5个传说稀有度的词句，字字珠玑。',
    icon: '🏺',
    unlockConditions: [
      { type: 'phrase_collection_rarity', params: { rarity: 'epic', minCount: 3 } }
    ],
    completeConditions: [
      { type: 'phrase_collection_rarity', params: { rarity: 'legendary', minCount: 5 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '奇珍收藏家' } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.04 } }
    ],
    accentColor: '#7a9ea8'
  },
  {
    id: 'ach_collection_5',
    chapterId: 'ch5',
    title: '策展大师',
    description: '将10首作品收入收藏集，策展你的诗意天地。',
    icon: '🖼️',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: '__all__', minCount: 5 } }
    ],
    completeConditions: [
      { type: 'collection_composition_count', params: { minCount: 10 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '策展人' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['雅俗共赏', '匠心独运'] } }
    ],
    accentColor: '#c98bc4'
  }
]

export const getQuestsByChapter = (chapterId: string): SideQuest[] => {
  return sideQuests.filter(q => q.chapterId === chapterId)
}

export const getQuestById = (id: string): SideQuest | undefined => {
  return sideQuests.find(q => q.id === id)
}
