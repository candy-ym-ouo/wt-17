import type { ClassicPoem, PhraseCategory } from '@/types'

export const classicPoems: ClassicPoem[] = [
  {
    id: 'cp_jingyesi',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: [
      { text: '床前明月光', annotation: '起句平实，以床前月景入诗' },
      { text: '疑是地上霜', annotation: '错觉生疑，月光如霜的清冷' },
      { text: '举头望明月', annotation: '仰望动作，由疑转望' },
      { text: '低头思故乡', annotation: '低头沉思，望月思乡之情' }
    ],
    theme: '思乡',
    mood: '孤寂思归',
    goals: [
      {
        dimension: 'mood',
        label: '孤寂思归',
        description: '以月光引出孤寂之感，最终归结于思乡之情',
        targetKeywords: ['明月', '相思', '遥望', '凭栏', '旧约'],
        targetCategories: ['emotion', 'scene'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '月夜清冷',
        description: '月光如霜的清冷意象，地面光影交织',
        targetKeywords: ['明月', '初雪', '青灯', '繁星'],
        targetCategories: ['scene', 'imagery'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '五言节奏',
        description: '五字一句的整齐节奏，平仄相间',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '起承转合',
        description: '由景入疑，由疑转望，由望生思的四段结构',
        targetKeywords: [],
        targetCategories: ['scene', 'imagery', 'action', 'emotion'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '月下思乡',
        description: '月亮与故乡的经典关联',
        targetKeywords: ['明月', '相思', '遥望', '故人'],
        targetCategories: ['scene', 'emotion'],
        weight: 0.15
      }
    ],
    keyImagery: ['明月', '霜', '月光'],
    keyEmotions: ['思乡', '孤寂', '怅惘'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 5,
      categorySequence: ['scene', 'imagery', 'action', 'emotion']
    },
    difficulty: '入门',
    accentColor: '#7a9ea8',
    icon: '🌙',
    description: '以月光为引，由景入情，最简约的思乡之诗',
    backgroundGradient: 'linear-gradient(135deg, #0f1628 0%, #1a2444 50%, #0d1a33 100%)'
  },
  {
    id: 'cp_chunxiao',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: [
      { text: '春眠不觉晓', annotation: '春日酣眠，不知不觉天已亮' },
      { text: '处处闻啼鸟', annotation: '鸟鸣声声，春意盎然' },
      { text: '夜来风雨声', annotation: '回忆昨夜风雨交加' },
      { text: '花落知多少', annotation: '风雨之后，落花几何' }
    ],
    theme: '春夜',
    mood: '惜春伤感',
    goals: [
      {
        dimension: 'mood',
        label: '惜春伤感',
        description: '春日美好与花落凋零的对比，惜春之情',
        targetKeywords: ['落花', '清风', '春深', '缱绻', '清欢'],
        targetCategories: ['emotion', 'scene'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '春景花鸟',
        description: '鸟啼、花落、风雨的春日意象',
        targetKeywords: ['落花', '清风', '垂柳', '黄昏'],
        targetCategories: ['scene', 'imagery', 'time'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '五言节奏',
        description: '五言整齐节奏，舒缓自然',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '先喜后叹',
        description: '由春眠之适到鸟鸣之喜，再到花落之叹',
        targetKeywords: [],
        targetCategories: ['time', 'scene', 'action', 'emotion'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '春暮花残',
        description: '春去花落的季节感伤',
        targetKeywords: ['落花', '春深', '清风'],
        targetCategories: ['scene', 'time'],
        weight: 0.15
      }
    ],
    keyImagery: ['落花', '啼鸟', '风雨'],
    keyEmotions: ['惜春', '怅惘', '缱绻'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 5,
      categorySequence: ['time', 'scene', 'action', 'emotion']
    },
    difficulty: '入门',
    accentColor: '#7ca97c',
    icon: '🌸',
    description: '春日晨起，由鸟鸣而忆风雨，由风雨而惜花落',
    backgroundGradient: 'linear-gradient(135deg, #0f1a14 0%, #1a2e22 50%, #0d1a12 100%)'
  },
  {
    id: 'cp_dengguanquelou',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: [
      { text: '白日依山尽', annotation: '落日西沉，没入群山' },
      { text: '黄河入海流', annotation: '黄河奔涌，东入大海' },
      { text: '欲穷千里目', annotation: '欲穷极目远眺' },
      { text: '更上一层楼', annotation: '再登高一层，以拓视野' }
    ],
    theme: '山水',
    mood: '壮阔进取',
    goals: [
      {
        dimension: 'mood',
        label: '壮阔进取',
        description: '由壮阔山水引出进取之志，气象宏大',
        targetKeywords: ['长河', '翠竹', '残梦', '淡泊'],
        targetCategories: ['scene', 'emotion'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '山河壮景',
        description: '日暮山景与大河奔流的宏大意象',
        targetKeywords: ['残阳', '长河', '古道', '荒原'],
        targetCategories: ['scene', 'imagery'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '五言对仗',
        description: '前两句对仗工整，后两句递进有力',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '景情递进',
        description: '前半写景，后半抒情，景为情设',
        targetKeywords: [],
        targetCategories: ['scene', 'scene', 'action', 'emotion'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '登高望远',
        description: '登高远望的哲理意蕴',
        targetKeywords: ['长河', '残阳', '古道'],
        targetCategories: ['scene', 'action'],
        weight: 0.15
      }
    ],
    keyImagery: ['白日', '山', '黄河', '海'],
    keyEmotions: ['壮阔', '进取', '淡泊'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 5,
      categorySequence: ['scene', 'scene', 'action', 'emotion']
    },
    difficulty: '进阶',
    accentColor: '#c9a86c',
    icon: '🏔️',
    description: '以山河壮景入诗，由景及理，志在千里',
    backgroundGradient: 'linear-gradient(135deg, #1a1508 0%, #2e2810 50%, #1a1508 100%)'
  },
  {
    id: 'cp_jiangxue',
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    content: [
      { text: '千山鸟飞绝', annotation: '群山之中，飞鸟绝迹' },
      { text: '万径人踪灭', annotation: '万条小路，不见人迹' },
      { text: '孤舟蓑笠翁', annotation: '唯见一叶孤舟，老翁独钓' },
      { text: '独钓寒江雪', annotation: '于寒江飞雪中独钓' }
    ],
    theme: '山水',
    mood: '孤高绝俗',
    goals: [
      {
        dimension: 'mood',
        label: '孤高绝俗',
        description: '极端孤寂中的高洁坚守，绝俗之志',
        targetKeywords: ['独酌', '淡泊', '抚琴', '落笔'],
        targetCategories: ['emotion', 'action'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '冰雪孤舟',
        description: '千山万径的空旷与孤舟老翁的对比',
        targetKeywords: ['初雪', '夜雨', '古寺', '青灯'],
        targetCategories: ['scene', 'imagery'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '五言绝句',
        description: '短句极简，字字千钧',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '由大及小',
        description: '从千山万径的大景聚焦到孤舟老翁',
        targetKeywords: [],
        targetCategories: ['scene', 'scene', 'imagery', 'action'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '寒江独钓',
        description: '以孤独抵御世俗的精神内核',
        targetKeywords: ['初雪', '独酌', '淡泊'],
        targetCategories: ['scene', 'emotion'],
        weight: 0.15
      }
    ],
    keyImagery: ['千山', '孤舟', '寒江', '雪'],
    keyEmotions: ['孤高', '淡泊', '寂寥'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 5,
      categorySequence: ['scene', 'scene', 'imagery', 'action']
    },
    difficulty: '进阶',
    accentColor: '#5b7a8c',
    icon: '❄️',
    description: '以千山万径之空旷，衬孤舟独钓之高洁',
    backgroundGradient: 'linear-gradient(135deg, #0a0f1a 0%, #141e33 50%, #0a1020 100%)'
  },
  {
    id: 'cp_chouyage',
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    content: [
      { text: '月落乌啼霜满天', annotation: '月落鸟啼，霜气弥漫' },
      { text: '江枫渔火对愁眠', annotation: '江边枫树渔火，对景难眠' },
      { text: '姑苏城外寒山寺', annotation: '姑苏城外的寒山古寺' },
      { text: '夜半钟声到客船', annotation: '半夜钟声传到客船' }
    ],
    theme: '思乡',
    mood: '羁旅愁思',
    goals: [
      {
        dimension: 'mood',
        label: '羁旅愁思',
        description: '客居他乡的愁绪，夜半钟声触动羁旅之情',
        targetKeywords: ['离愁', '寂寥', '惆怅', '日暮', '秋凉'],
        targetCategories: ['emotion', 'scene'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '秋夜江景',
        description: '月落、乌啼、霜天、江枫、渔火的层叠意象',
        targetKeywords: ['残阳', '夜雨', '古寺', '青灯', '初雪'],
        targetCategories: ['scene', 'imagery', 'time'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '七言节奏',
        description: '七字一句，节奏舒缓而深远',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '景境递深',
        description: '由自然之景到人文之境，层层深入',
        targetKeywords: [],
        targetCategories: ['time', 'scene', 'scene', 'action'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '夜泊客愁',
        description: '夜泊闻钟的客居之愁',
        targetKeywords: ['离愁', '寂寥', '古寺', '青灯'],
        targetCategories: ['scene', 'emotion'],
        weight: 0.15
      }
    ],
    keyImagery: ['月落', '霜', '江枫', '渔火', '寒山寺', '钟声'],
    keyEmotions: ['离愁', '寂寥', '惆怅'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 7,
      categorySequence: ['time', 'scene', 'scene', 'action']
    },
    difficulty: '高阶',
    accentColor: '#8b4557',
    icon: '🌉',
    description: '以秋夜江景层层铺陈，夜半钟声点破客愁',
    backgroundGradient: 'linear-gradient(135deg, #1a0f14 0%, #2e1a24 50%, #1a0f18 100%)'
  },
  {
    id: 'cp_wanglushan',
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    content: [
      { text: '日照香炉生紫烟', annotation: '阳光照射香炉峰，紫烟缭绕' },
      { text: '遥看瀑布挂前川', annotation: '远望瀑布如白练挂于山前' },
      { text: '飞流直下三千尺', annotation: '飞流直泻，势若三千尺' },
      { text: '疑是银河落九天', annotation: '疑是天上的银河倾泻而下' }
    ],
    theme: '山水',
    mood: '豪放奇丽',
    goals: [
      {
        dimension: 'mood',
        label: '豪放奇丽',
        description: '以夸张手法写壮美奇景，气魄宏大',
        targetKeywords: ['长河', '残梦', '淡泊', '抚琴'],
        targetCategories: ['scene', 'emotion'],
        weight: 0.3
      },
      {
        dimension: 'imagery',
        label: '山水奇观',
        description: '紫烟、飞瀑、银河的壮丽意象',
        targetKeywords: ['长河', '繁星', '古寺', '翠竹'],
        targetCategories: ['scene', 'imagery'],
        weight: 0.25
      },
      {
        dimension: 'rhythm',
        label: '七言绝句',
        description: '七言节奏，气势奔放',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '虚实相生',
        description: '前两句写实景，后两句以想象升华',
        targetKeywords: [],
        targetCategories: ['scene', 'scene', 'imagery', 'imagery'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '瀑布奇观',
        description: '以超凡想象描绘自然壮观',
        targetKeywords: ['长河', '繁星', '夜雨'],
        targetCategories: ['scene', 'imagery'],
        weight: 0.15
      }
    ],
    keyImagery: ['紫烟', '瀑布', '飞流', '银河'],
    keyEmotions: ['壮阔', '奇丽', '豪放'],
    structurePattern: {
      lineCount: 4,
      avgCharPerLine: 7,
      categorySequence: ['scene', 'scene', 'imagery', 'imagery']
    },
    difficulty: '高阶',
    accentColor: '#a87ac9',
    icon: '🏔️',
    description: '以超凡想象写瀑布之壮美，虚实相生',
    backgroundGradient: 'linear-gradient(135deg, #140f1a 0%, #241a2e 50%, #140f20 100%)'
  },
  {
    id: 'cp_shengchasi',
    title: '声声慢',
    author: '李清照',
    dynasty: '宋',
    content: [
      { text: '寻寻觅觅，冷冷清清', annotation: '寻觅无果，凄冷清寂' },
      { text: '凄凄惨惨戚戚', annotation: '层层叠加的悲愁' },
      { text: '乍暖还寒时候，最难将息', annotation: '冷暖交替，最难安歇' },
      { text: '三杯两盏淡酒', annotation: '借酒消愁，酒淡愁浓' },
      { text: '怎敌他、晚来风急', annotation: '怎挡得住晚来急风' },
      { text: '雁过也，正伤心', annotation: '过雁勾起伤心事' },
      { text: '却是旧时相识', annotation: '竟是旧日相识之雁' }
    ],
    theme: '秋思',
    mood: '凄婉悲愁',
    goals: [
      {
        dimension: 'mood',
        label: '凄婉悲愁',
        description: '层层递进的悲愁情绪，凄凉婉转',
        targetKeywords: ['离愁', '寂寥', '惆怅', '日暮', '秋凉'],
        targetCategories: ['emotion'],
        weight: 0.35
      },
      {
        dimension: 'imagery',
        label: '秋日残景',
        description: '淡酒、急风、过雁的凄凉意象',
        targetKeywords: ['残阳', '荒原', '寒烟', '古道', '西风'],
        targetCategories: ['scene', 'imagery', 'time'],
        weight: 0.2
      },
      {
        dimension: 'rhythm',
        label: '叠词韵律',
        description: '叠词双声的节奏美，反复低回',
        targetKeywords: [],
        targetCategories: [],
        weight: 0.15
      },
      {
        dimension: 'structure',
        label: '愁绪叠加',
        description: '由外景入内心，愁绪层层叠加',
        targetKeywords: [],
        targetCategories: ['emotion', 'emotion', 'time', 'action', 'scene', 'emotion', 'emotion'],
        weight: 0.15
      },
      {
        dimension: 'theme',
        label: '晚秋愁思',
        description: '秋日萧瑟中的孤寂与思念',
        targetKeywords: ['残阳', '离愁', '寂寥', '归雁', '西风'],
        targetCategories: ['scene', 'emotion', 'time'],
        weight: 0.15
      }
    ],
    keyImagery: ['淡酒', '风急', '雁过', '黄花'],
    keyEmotions: ['凄婉', '悲愁', '寂寥'],
    structurePattern: {
      lineCount: 7,
      avgCharPerLine: 6,
      categorySequence: ['emotion', 'emotion', 'time', 'action', 'scene', 'emotion', 'emotion']
    },
    difficulty: '宗师',
    accentColor: '#8b4557',
    icon: '🍂',
    description: '以叠词入词，层层铺写悲愁，千古绝唱',
    backgroundGradient: 'linear-gradient(135deg, #1a0f0f 0%, #2e1a1a 50%, #1a0f0f 100%)'
  }
]

export const getPoemById = (id: string): ClassicPoem | undefined => {
  return classicPoems.find(p => p.id === id)
}

export const getPoemsByDifficulty = (difficulty: string): ClassicPoem[] => {
  return classicPoems.filter(p => p.difficulty === difficulty)
}

export const getPoemsByTheme = (theme: string): ClassicPoem[] => {
  return classicPoems.filter(p => p.theme === theme)
}

export const getAllPoemThemes = (): string[] => {
  return [...new Set(classicPoems.map(p => p.theme))]
}

export const getAllPoemDifficulties = (): string[] => {
  return ['入门', '进阶', '高阶', '宗师']
}

export const GOAL_DIMENSION_LABELS: Record<string, string> = {
  mood: '意境',
  imagery: '意象',
  rhythm: '韵律',
  structure: '结构',
  theme: '主题'
}

export const GOAL_DIMENSION_ICONS: Record<string, string> = {
  mood: '💭',
  imagery: '🖼️',
  rhythm: '🎵',
  structure: '🏗️',
  theme: '🎯'
}
