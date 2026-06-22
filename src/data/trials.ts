import type { TrialTheme, TrialRareImagery, TrialTitle, TrialSpectra, TrialBonusRule, TrialSettlementRule } from '@/types'

const createBonusRules = (theme: string): TrialBonusRule[] => [
  {
    type: 'keyword_combo',
    label: '主题契合',
    description: `使用${theme}主题关键词`,
    bonus: 10,
    params: { requiredCount: 3 }
  },
  {
    type: 'category_balance',
    label: '词类均衡',
    description: '五大词类各至少一个',
    bonus: 8,
    params: {}
  },
  {
    type: 'speed_bonus',
    label: '下笔神速',
    description: '在时间限制内快速完成',
    bonus: 12,
    multiplier: 1.1,
    params: { timeThreshold: 120 }
  },
  {
    type: 'rare_phrase',
    label: '珠玉缀章',
    description: '使用稀有及以上词句',
    bonus: 5,
    params: { minRarity: 'rare', requiredCount: 2 }
  },
  {
    type: 'theme_match',
    label: '情景交融',
    description: '景物与情感完美融合',
    bonus: 10,
    multiplier: 1.05,
    params: {}
  },
  {
    type: 'perfect_combo',
    label: '天衣无缝',
    description: '所有关键词全部命中',
    bonus: 15,
    multiplier: 1.2,
    params: {}
  }
]

const createSettlementRules = (): TrialSettlementRule[] => [
  {
    type: 'imagery_drop',
    params: { rarity: 'rare', count: 1 },
    description: '获得稀有意象',
    minScore: 60
  },
  {
    type: 'phrase_unlock',
    params: { count: 2 },
    description: '解锁新词句',
    minScore: 70
  },
  {
    type: 'score_multiplier',
    params: { multiplier: 1.15 },
    description: '佳作加成',
    minScore: 75
  },
  {
    type: 'title_award',
    params: { minScore: 80 },
    description: '获得试炼称号',
    minScore: 80
  },
  {
    type: 'spectra_unlock',
    params: { rarity: 'epic' },
    description: '获得墨韵谱面',
    minScore: 85
  },
  {
    type: 'score_multiplier',
    params: { multiplier: 1.3 },
    description: '妙品加成',
    minScore: 85
  },
  {
    type: 'score_multiplier',
    params: { multiplier: 1.5 },
    description: '神品加成',
    minScore: 90
  },
  {
    type: 'score_multiplier',
    params: { multiplier: 1.2 },
    description: '传世之作',
    minScore: 95
  }
]

export const trialRareImageries: TrialRareImagery[] = [
  {
    id: 'img_moonlit_garden',
    name: '月下庭园',
    description: '月光倾泻，庭院深深，暗香浮动月黄昏。',
    rarity: 'rare',
    icon: '🌙',
    phraseTexts: ['明月', '清风', '暗香', '庭院'],
    dropRate: 0.3
  },
  {
    id: 'img_autumn_river',
    name: '秋水长天',
    description: '落霞与孤鹜齐飞，秋水共长天一色。',
    rarity: 'rare',
    icon: '🍂',
    phraseTexts: ['残阳', '流水', '归雁', '寒烟'],
    dropRate: 0.25
  },
  {
    id: 'img_snowy_mountain',
    name: '雪山孤影',
    description: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
    rarity: 'epic',
    icon: '❄️',
    phraseTexts: ['初雪', '荒原', '寒烟', '孤舟'],
    dropRate: 0.15
  },
  {
    id: 'img_spring_dawn',
    name: '春晓莺啼',
    description: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    rarity: 'epic',
    icon: '🌸',
    phraseTexts: ['落花', '清风', '新燕', '芳菲'],
    dropRate: 0.15
  },
  {
    id: 'img_past_memories',
    name: '锦瑟华年',
    description: '锦瑟无端五十弦，一弦一柱思华年。',
    rarity: 'epic',
    icon: '📜',
    phraseTexts: ['锦瑟', '故人', '相思', '旧约'],
    dropRate: 0.12
  },
  {
    id: 'img_drunken_immortal',
    name: '醉仙谪凡',
    description: '举杯邀明月，对影成三人。天若不爱酒，酒星不在天。',
    rarity: 'legendary',
    icon: '🍶',
    phraseTexts: ['浊酒', '独酌', '故人', '明月'],
    dropRate: 0.08,
    isExclusive: true
  },
  {
    id: 'img_ink_storm',
    name: '墨雨淋漓',
    description: '笔落惊风雨，诗成泣鬼神。',
    rarity: 'legendary',
    icon: '🖌️',
    phraseTexts: ['落笔', '轻吟', '锦瑟', '玉笛'],
    dropRate: 0.06,
    isExclusive: true
  },
  {
    id: 'img_eternal_night',
    name: '永夜星河',
    description: '醉后不知天在水，满船清梦压星河。',
    rarity: 'legendary',
    icon: '✨',
    phraseTexts: ['繁星', '静夜', '残梦', '青灯'],
    dropRate: 0.05,
    isExclusive: true
  }
]

export const trialTitles: TrialTitle[] = [
  {
    id: 'title_budding_poet',
    name: '诗苑新秀',
    description: '初入墨韵试炼，展露锋芒。',
    rarity: 'rare',
    icon: '🌱',
    condition: {
      type: 'score_threshold',
      params: { minScore: 60 }
    }
  },
  {
    id: 'title_swift_pen',
    name: '捷才君子',
    description: '思如泉涌，下笔千言立就。',
    rarity: 'rare',
    icon: '⚡',
    condition: {
      type: 'speed_clear',
      params: { maxSeconds: 120 }
    }
  },
  {
    id: 'title_flawless',
    name: '无瑕美玉',
    description: '无一字不妥，无一句不工。',
    rarity: 'epic',
    icon: '💎',
    condition: {
      type: 'perfect_clear',
      params: { minScore: 90 }
    }
  },
  {
    id: 'title_keyword_master',
    name: '辞藻大家',
    description: '将所有主题关键词融会贯通。',
    rarity: 'epic',
    icon: '📚',
    condition: {
      type: 'all_keywords',
      params: {}
    }
  },
  {
    id: 'title_forbidden_breaker',
    name: '戴镣舞者',
    description: '在禁忌的束缚下仍创作出绝妙诗篇。',
    rarity: 'epic',
    icon: '🔗',
    condition: {
      type: 'no_forbidden',
      params: { minScore: 75 }
    }
  },
  {
    id: 'title_ink_saint',
    name: '墨圣谪仙',
    description: '墨韵试炼的至高荣耀，百年难遇的奇才。',
    rarity: 'legendary',
    icon: '🏆',
    condition: {
      type: 'score_threshold',
      params: { minScore: 95 }
    }
  }
]

export const trialSpectra: TrialSpectra[] = [
  {
    id: 'spec_gentle_wave',
    name: '柔波谱',
    description: '如微波荡漾，轻柔婉转。',
    rarity: 'rare',
    icon: '🌊',
    pattern: ['-', '～', '-', '～'],
    dropRate: 0.25
  },
  {
    id: 'spec_floating_cloud',
    name: '浮云谱',
    description: '行云流水，变幻莫测。',
    rarity: 'rare',
    icon: '☁️',
    pattern: ['～', '～', '-', '-'],
    dropRate: 0.2
  },
  {
    id: 'spec_towering_peak',
    name: '奇峰谱',
    description: '重峦叠嶂，气势磅礴。',
    rarity: 'epic',
    icon: '⛰️',
    pattern: ['/', '↑', '↓', '—'],
    dropRate: 0.12
  },
  {
    id: 'spec_celestial_circuit',
    name: '璇玑谱',
    description: '周天星斗，运转不息。',
    rarity: 'epic',
    icon: '🌟',
    pattern: ['☆', '★', '☆', '★'],
    dropRate: 0.1
  },
  {
    id: 'spec_dragon_snake',
    name: '龙蛇谱',
    description: '笔走龙蛇，气象万千。',
    rarity: 'legendary',
    icon: '🐉',
    pattern: ['∿', '⌒', '∿', '⌒'],
    dropRate: 0.06,
    effect: '作品自带龙蛇飞舞之姿'
  },
  {
    id: 'spec_five_colors',
    name: '五彩谱',
    description: '五色交辉，相得益彰。',
    rarity: 'legendary',
    icon: '🌈',
    pattern: ['●', '◆', '▲', '■'],
    dropRate: 0.05,
    effect: '作品呈现五彩斑斓之美'
  }
]

export const trialThemes: TrialTheme[] = [
  {
    id: 'trial_spring_wind',
    name: '春风拂面',
    type: '山水',
    description: '春风十里，草长莺飞。在这生机盎然的季节里，谱一曲春之赞歌。',
    icon: '🌿',
    accentColor: '#7ca97c',
    backgroundGradient: 'linear-gradient(135deg, #1a2e1a 0%, #2a3d2a 50%, #1e3322 100%)',
    difficulty: '初级',
    requiredScore: 60,
    targetPhraseCount: 8,
    timeLimitSeconds: 300,
    requiredKeywords: ['明月', '落花', '清风', '垂柳'],
    forbiddenWords: ['离愁', '寂寥', '寒烟'],
    bonusRules: createBonusRules('春'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_spring_dawn', 'img_moonlit_garden'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_budding_poet', 'title_swift_pen'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_gentle_wave', 'spec_floating_cloud'].includes(s.id)),
      phraseUnlocks: ['芳菲', '呢喃']
    },
    unlockCondition: {
      type: 'score_threshold',
      params: { chapterId: 'ch1', minScore: 50 }
    }
  },
  {
    id: 'trial_autumn_thought',
    name: '秋思绵绵',
    type: '思乡',
    description: '自古逢秋悲寂寥，我言秋日胜春朝。金黄与萧瑟中，感受秋的深邃。',
    icon: '🍁',
    accentColor: '#d4a574',
    backgroundGradient: 'linear-gradient(135deg, #2a1f15 0%, #3d2a1a 50%, #2a1a1a 100%)',
    difficulty: '初级',
    requiredScore: 60,
    targetPhraseCount: 8,
    timeLimitSeconds: 300,
    requiredKeywords: ['残阳', '归雁', '离愁', '日暮'],
    forbiddenWords: ['芳菲', '新燕', '清风'],
    bonusRules: createBonusRules('秋'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_autumn_river', 'img_past_memories'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_budding_poet', 'title_forbidden_breaker'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_floating_cloud'].includes(s.id)),
      phraseUnlocks: ['秋凉', '霜']
    },
    unlockCondition: {
      type: 'score_threshold',
      params: { chapterId: 'ch2', minScore: 55 }
    }
  },
  {
    id: 'trial_starry_night',
    name: '星河耿耿',
    type: '风月',
    description: '银烛秋光冷画屏，轻罗小扇扑流萤。天阶夜色凉如水，卧看牵牛织女星。',
    icon: '🌌',
    accentColor: '#8ba8c9',
    backgroundGradient: 'linear-gradient(135deg, #0f1420 0%, #1a1f30 50%, #141825 100%)',
    difficulty: '中级',
    requiredScore: 70,
    targetPhraseCount: 10,
    timeLimitSeconds: 280,
    requiredKeywords: ['明月', '繁星', '静夜', '青灯'],
    forbiddenWords: ['白日', '正午', '喧闹'],
    bonusRules: createBonusRules('夜'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_eternal_night', 'img_moonlit_garden'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_keyword_master', 'title_swift_pen'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_celestial_circuit', 'spec_gentle_wave'].includes(s.id)),
      phraseUnlocks: ['素笺', '残梦']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_spring_wind' }
    }
  },
  {
    id: 'trial_mountain_water',
    name: '山水之间',
    type: '山水',
    description: '仁者乐山，智者乐水。在山水之间寻找内心的宁静与诗意。',
    icon: '⛰️',
    accentColor: '#7aa89a',
    backgroundGradient: 'linear-gradient(135deg, #15201e 0%, #234 50%, #1a2520 100%)',
    difficulty: '中级',
    requiredScore: 70,
    targetPhraseCount: 10,
    timeLimitSeconds: 280,
    requiredKeywords: ['青山', '流水', '白云', '古寺'],
    forbiddenWords: ['喧嚣', '烦恼', '名利'],
    bonusRules: createBonusRules('山水'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_snowy_mountain', 'img_autumn_river'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_flawless', 'title_keyword_master'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_towering_peak', 'spec_floating_cloud'].includes(s.id)),
      phraseUnlocks: ['独坐', '悠然']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_autumn_thought' }
    }
  },
  {
    id: 'trial_border_town',
    name: '边塞孤城',
    type: '边塞',
    description: '大漠孤烟直，长河落日圆。在边塞的苍茫中，感受将士的豪情与思乡。',
    icon: '🏯',
    accentColor: '#c98b6c',
    backgroundGradient: 'linear-gradient(135deg, #2a1f15 0%, #3d2a1a 33%, #2a2515 66%, #1f2a1a 100%)',
    difficulty: '高级',
    requiredScore: 75,
    targetPhraseCount: 12,
    timeLimitSeconds: 240,
    requiredKeywords: ['长河', '古道', '西风', '归雁'],
    forbiddenWords: ['温柔', '呢喃', '芳菲'],
    bonusRules: createBonusRules('边塞'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_snowy_mountain', 'img_autumn_river'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_flawless', 'title_forbidden_breaker'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_towering_peak', 'spec_gentle_wave'].includes(s.id)),
      phraseUnlocks: ['荒城', '孤烟']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_starry_night' }
    }
  },
  {
    id: 'trial_drunken_verse',
    name: '醉里挑灯',
    type: '咏史',
    description: '醉里挑灯看剑，梦回吹角连营。八百里分麾下炙，五十弦翻塞外声。',
    icon: '🍶',
    accentColor: '#c9a86c',
    backgroundGradient: 'linear-gradient(135deg, #1f1a15 0%, #2e251a 50%, #251f1a 100%)',
    difficulty: '高级',
    requiredScore: 75,
    targetPhraseCount: 12,
    timeLimitSeconds: 220,
    requiredKeywords: ['浊酒', '独酌', '玉笛', '蓦然回首'],
    forbiddenWords: ['清醒', '平淡', '无味'],
    bonusRules: createBonusRules('醉'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_drunken_immortal', 'img_past_memories'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_flawless', 'title_keyword_master'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_dragon_snake', 'spec_five_colors'].includes(s.id)),
      phraseUnlocks: ['对影三人', '五十弦']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_mountain_water' }
    }
  },
  {
    id: 'trial_boudoir_lament',
    name: '深闺怨情',
    type: '闺怨',
    description: '闺中少妇不知愁，春日凝妆上翠楼。忽见陌头杨柳色，悔教夫婿觅封侯。',
    icon: '🌸',
    accentColor: '#c98bc4',
    backgroundGradient: 'linear-gradient(135deg, #2d1a2e 0%, #3d2a3e 50%, #2a1a3d 100%)',
    difficulty: '高级',
    requiredScore: 78,
    targetPhraseCount: 12,
    timeLimitSeconds: 240,
    requiredKeywords: ['相思', '离愁', '素笺', '锦瑟'],
    forbiddenWords: ['豪放', '洒脱', '快意'],
    bonusRules: createBonusRules('闺怨'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => ['img_past_memories', 'img_moonlit_garden'].includes(img.id)),
      titles: trialTitles.filter(t => ['title_flawless', 'title_forbidden_breaker'].includes(t.id)),
      spectra: trialSpectra.filter(s => ['spec_gentle_wave', 'spec_floating_cloud'].includes(s.id)),
      phraseUnlocks: ['肠断', '泪痕']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_border_town' }
    }
  },
  {
    id: 'trial_ink_saint',
    name: '墨圣之境',
    type: '咏史',
    description: '笔落惊风雨，诗成泣鬼神。此乃墨韵试炼的终极挑战，非大才者不能过也。',
    icon: '🏆',
    accentColor: '#ffd700',
    backgroundGradient: 'linear-gradient(135deg, #1a1520 0%, #2d2530 33%, #2a1f2d 66%, #1f1a2a 100%)',
    difficulty: '传说',
    requiredScore: 90,
    targetPhraseCount: 15,
    timeLimitSeconds: 200,
    requiredKeywords: ['明月', '青山', '流水', '相思', '浊酒', '锦瑟'],
    forbiddenWords: ['普通', '平凡', '无味'],
    bonusRules: createBonusRules('墨圣'),
    settlementRules: createSettlementRules(),
    rewards: {
      rareImageries: trialRareImageries.filter(img => img.rarity === 'legendary'),
      titles: trialTitles.filter(t => t.rarity === 'legendary'),
      spectra: trialSpectra.filter(s => s.rarity === 'legendary'),
      phraseUnlocks: ['花间一壶酒', '大道至简', '大象无形']
    },
    unlockCondition: {
      type: 'trial_clear',
      params: { trialId: 'trial_drunken_verse' }
    }
  }
]

export const getTrialById = (id: string): TrialTheme | undefined => {
  return trialThemes.find(t => t.id === id)
}

export const getTrialsByType = (type: string): TrialTheme[] => {
  return trialThemes.filter(t => t.type === type)
}

export const getTrialRareImageryById = (id: string): TrialRareImagery | undefined => {
  return trialRareImageries.find(img => img.id === id)
}

export const getTrialTitleById = (id: string): TrialTitle | undefined => {
  return trialTitles.find(t => t.id === id)
}

export const getTrialSpectraById = (id: string): TrialSpectra | undefined => {
  return trialSpectra.find(s => s.id === id)
}
