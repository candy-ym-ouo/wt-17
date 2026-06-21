import type { Theme, PhraseCategory } from '@/types'

export const DEFAULT_THEME_ID = 'theme_free'

export const presetThemes: Theme[] = [
  {
    id: 'theme_free',
    name: '无拘无束',
    description: '打破所有格律，让词语自由生长，创造属于你的诗意天地。',
    icon: '✦',
    accentColor: '#c98bc4',
    background: {
      gradient: 'linear-gradient(135deg, #1a0f1e 0%, #2e1a2d 33%, #1a1e2e 66%, #0f1e1a 100%)',
      particleColor: '#c98bc4',
      gridOpacity: 0.04,
      watermarkText: '自由',
      watermarkOpacity: 0.03
    },
    decoration: 'stars',
    wordPool: {
      keywords: [],
      categoryWeights: {},
      rarityBoost: {}
    },
    scoring: {
      scoreWeights: {},
      themeMatchBonus: 0,
      preferredCategories: []
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['scene', 'imagery', 'emotion'],
      maxWords: 2
    }
  },
  {
    id: 'theme_spring',
    name: '春意盎然',
    description: '春风十里，不如你。在万物复苏的季节里，寻觅那份温柔与生机。',
    icon: '🌸',
    accentColor: '#e8a5c4',
    background: {
      gradient: 'linear-gradient(135deg, #2d1a2e 0%, #3d2a3e 50%, #2a1a3d 100%)',
      particleColor: '#ffb7c5',
      gridOpacity: 0.03,
      watermarkText: '春',
      watermarkOpacity: 0.03
    },
    decoration: 'flowers',
    wordPool: {
      keywords: ['明月', '落花', '清风', '垂柳', '流水', '春深', '清风', '细雨', '新燕', '初蕾', '芳菲', '呢喃'],
      categoryWeights: { scene: 1.3, emotion: 1.2, time: 0.9, action: 0.9, imagery: 1.1 },
      rarityBoost: { rare: 0.2, epic: 0.1 }
    },
    scoring: {
      scoreWeights: { imagery: 0.25, coherence: 0.25, themeMatch: 0.3, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['scene', 'emotion', 'imagery']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['scene', 'imagery'],
      maxWords: 2,
      template: '春·{word1}·{word2}'
    }
  },
  {
    id: 'theme_autumn',
    name: '秋意浓',
    description: '自古逢秋悲寂寥，我言秋日胜春朝。在金黄与萧瑟中，感受秋的深邃。',
    icon: '🍂',
    accentColor: '#d4a574',
    background: {
      gradient: 'linear-gradient(135deg, #2a1f15 0%, #3d2a1a 50%, #2a1a1a 100%)',
      particleColor: '#d4a574',
      gridOpacity: 0.03,
      watermarkText: '秋',
      watermarkOpacity: 0.03
    },
    decoration: 'leaves',
    wordPool: {
      keywords: ['残阳', '荒原', '寒烟', '古道', '西风', '归雁', '离愁', '寂寥', '日暮', '秋凉', '霜', '落叶'],
      categoryWeights: { scene: 1.2, emotion: 1.3, time: 1.1, action: 0.9, imagery: 1.2 },
      rarityBoost: { epic: 0.2, legendary: 0.1 }
    },
    scoring: {
      scoreWeights: { themeMatch: 0.3, coherence: 0.25, imagery: 0.25, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['scene', 'emotion', 'imagery']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['scene', 'emotion'],
      maxWords: 2,
      template: '秋·{word1}·{word2}'
    }
  },
  {
    id: 'theme_night',
    name: '静夜思',
    description: '床前明月光，疑是地上霜。在宁静的夜晚，与自己对话。',
    icon: '🌙',
    accentColor: '#8ba8c9',
    background: {
      gradient: 'linear-gradient(135deg, #0f1420 0%, #1a1f30 50%, #141825 100%)',
      particleColor: '#8ba8c9',
      gridOpacity: 0.02,
      watermarkText: '夜',
      watermarkOpacity: 0.02
    },
    decoration: 'stars',
    wordPool: {
      keywords: ['明月', '繁星', '夜雨', '青灯', '素笺', '残梦', '静夜', '无眠', '望月', '思归'],
      categoryWeights: { imagery: 1.3, emotion: 1.2, time: 1.1, scene: 1.1, action: 0.8 },
      rarityBoost: { legendary: 0.2, epic: 0.1 }
    },
    scoring: {
      scoreWeights: { imagery: 0.3, themeMatch: 0.25, coherence: 0.25, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['imagery', 'emotion', 'scene']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['imagery', 'scene'],
      maxWords: 2,
      template: '夜·{word1}·{word2}'
    }
  },
  {
    id: 'theme_rivers',
    name: '山水间',
    description: '仁者乐山，智者乐水。在自然中寻找内心的宁静。',
    icon: '⛰️',
    accentColor: '#7aa89a',
    background: {
      gradient: 'linear-gradient(135deg, #15201e 0%, #234 50%, #1a2520 100%)',
      particleColor: '#7aa89a',
      gridOpacity: 0.03,
      watermarkText: '山水',
      watermarkOpacity: 0.02
    },
    decoration: 'mountains',
    wordPool: {
      keywords: ['青山', '流水', '白云', '翠竹', '古寺', '长河', '独坐', '悠然', '淡泊', '忘言', '太虚', '无我'],
      categoryWeights: { scene: 1.4, imagery: 1.2, action: 1.0, emotion: 0.9, time: 0.9 },
      rarityBoost: { epic: 0.15, rare: 0.1 }
    },
    scoring: {
      scoreWeights: { coherence: 0.3, imagery: 0.3, themeMatch: 0.2, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['scene', 'imagery', 'action']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['scene', 'imagery'],
      maxWords: 2,
      template: '山水·{word1}·{word2}'
    }
  },
  {
    id: 'theme_wine',
    name: '醉里挑灯',
    description: '举杯邀明月，对影成三人。酒入愁肠，化作诗意。',
    icon: '🍶',
    accentColor: '#c9a86c',
    background: {
      gradient: 'linear-gradient(135deg, #1f1a15 0%, #2e251a 50%, #251f1a 100%)',
      particleColor: '#c9a86c',
      gridOpacity: 0.03,
      watermarkText: '醉',
      watermarkOpacity: 0.03
    },
    decoration: 'fireflies',
    wordPool: {
      keywords: ['浊酒', '独酌', '抚琴', '轻吟', '落笔', '残梦', '蓦然回首', '故人', '旧约', '锦瑟', '玉笛'],
      categoryWeights: { action: 1.3, imagery: 1.2, emotion: 1.1, scene: 1.0, time: 0.9 },
      rarityBoost: { legendary: 0.25, epic: 0.15 }
    },
    scoring: {
      scoreWeights: { rhythm: 0.3, coherence: 0.25, imagery: 0.25, themeMatch: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['action', 'imagery', 'emotion']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['action', 'imagery'],
      maxWords: 2,
      template: '醉·{word1}·{word2}'
    }
  },
  {
    id: 'theme_snow',
    name: '雪中行',
    description: '忽如一夜春风来，千树万树梨花开。白雪皑皑中的诗意。',
    icon: '❄️',
    accentColor: '#a8c0d4',
    background: {
      gradient: 'linear-gradient(135deg, #1a2028 0%, #2a303d 50%, #1f2530 100%)',
      particleColor: '#c9d4e0',
      gridOpacity: 0.02,
      watermarkText: '雪',
      watermarkOpacity: 0.02
    },
    decoration: 'snow',
    wordPool: {
      keywords: ['初雪', '寒梅', '寒烟', '荒原', '凛冽', '冰封', '雪夜', '归人', '素裹', '晶莹'],
      categoryWeights: { scene: 1.3, time: 1.2, imagery: 1.1, emotion: 1.0, action: 0.9 },
      rarityBoost: { rare: 0.15, epic: 0.1 }
    },
    scoring: {
      scoreWeights: { imagery: 0.3, themeMatch: 0.25, coherence: 0.25, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['scene', 'imagery', 'time']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['scene', 'time'],
      maxWords: 2,
      template: '雪·{word1}·{word2}'
    }
  },
  {
    id: 'theme_past',
    name: '忆往昔',
    description: '春花秋月何时了，往事知多少。在回忆中寻找诗意。',
    icon: '📜',
    accentColor: '#b89ac9',
    background: {
      gradient: 'linear-gradient(135deg, #1e1a28 0%, #2d253d 50%, #252030 100%)',
      particleColor: '#b89ac9',
      gridOpacity: 0.03,
      watermarkText: '忆',
      watermarkOpacity: 0.03
    },
    decoration: 'clouds',
    wordPool: {
      keywords: ['故人', '旧约', '素笺', '锦瑟', '回眸', '相思', '离愁', '往事', '追忆', '年华', '沧桑'],
      categoryWeights: { emotion: 1.3, imagery: 1.3, time: 1.1, scene: 1.0, action: 0.9 },
      rarityBoost: { epic: 0.2, legendary: 0.15 }
    },
    scoring: {
      scoreWeights: { coherence: 0.3, themeMatch: 0.25, imagery: 0.25, rhythm: 0.2 },
      themeMatchBonus: 0.1,
      preferredCategories: ['emotion', 'imagery', 'time']
    },
    titlePattern: {
      connector: '·',
      preferCategories: ['emotion', 'imagery'],
      maxWords: 2,
      template: '忆·{word1}·{word2}'
    }
  }
]

export const getAllThemes = (customThemes: Theme[] = []): Theme[] => {
  return [...presetThemes, ...customThemes]
}

export const getThemeById = (id: string, customThemes: Theme[] = []): Theme | undefined => {
  return getAllThemes(customThemes).find(t => t.id === id)
}

export const getDefaultTheme = (): Theme => {
  return presetThemes[0]
}

export const createCustomTheme = (
  name: string,
  description: string,
  config: Partial<Theme>
): Theme => {
  const baseTheme = getDefaultTheme()
  return {
    ...baseTheme,
    id: `custom_${Date.now()}`,
    name,
    description,
    isCustom: true,
    createdAt: Date.now(),
    ...config
  }
}

export const decorationEmojis: Record<string, string> = {
  stars: '✨',
  flowers: '🌸',
  waves: '🌊',
  mountains: '⛰️',
  clouds: '☁️',
  fireflies: '🌟',
  leaves: '🍂',
  snow: '❄️'
}

export const categoryPriority: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}
