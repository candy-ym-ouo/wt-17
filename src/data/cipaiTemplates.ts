import type { CipaiTemplate, CipaiScoringRuleSet } from '@/types'

const ping = 'ping' as const
const ze = 'ze' as const
const any = 'any' as const

export const cipaiTemplates: CipaiTemplate[] = [
  {
    id: 'rumengling',
    name: '如梦令',
    alias: '忆仙姿',
    description: '单调三十三字，七句五仄韵、一叠韵。短小精悍，意境悠远。',
    origin: '后唐庄宗李存勗创制',
    difficulty: 'easy',
    totalLines: 7,
    totalChars: 33,
    lines: [
      { index: 0, charCount: 6, tonePattern: [ze, ze, ping, ping, ze, ze], rhyme: false, description: '起句' },
      { index: 1, charCount: 6, tonePattern: [ze, ze, ping, ping, ze, ze], rhyme: true, description: '次句' },
      { index: 2, charCount: 6, tonePattern: [ze, ze, ze, ping, ping], rhyme: false, description: '第三句' },
      { index: 3, charCount: 5, tonePattern: [ze, ze, ze, ping, ping], rhyme: false, description: '第四句' },
      { index: 4, charCount: 2, tonePattern: [ping, ping], rhyme: false, description: '叠句（衬字）' },
      { index: 5, charCount: 2, tonePattern: [ping, ping], rhyme: false, description: '叠句（重复）' },
      { index: 6, charCount: 6, tonePattern: [ze, ze, ze, ping, ping, ze], rhyme: true, description: '结句' },
    ],
    rhymeScheme: ['a', 'a', 'b', 'b', '', '', 'a'],
    recommendedThemes: ['春夜', '秋思', '归乡'],
    example: {
      title: '如梦令·常记溪亭日暮',
      author: '李清照',
      content: ['常记溪亭日暮', '沉醉不知归路', '兴尽晚回舟', '误入藕花深处', '争渡', '争渡', '惊起一滩鸥鹭'],
    },
  },
  {
    id: 'huanxisha',
    name: '浣溪沙',
    alias: '浣溪纱、小庭花',
    description: '双调四十二字，上片三平韵，下片两平韵。音节明快，句式整齐。',
    origin: '教坊曲名，后用作词牌',
    difficulty: 'easy',
    totalLines: 6,
    totalChars: 42,
    lines: [
      { index: 0, charCount: 7, tonePattern: [ze, ze, ping, ping, ze, ze, ping], rhyme: true, description: '上片首句' },
      { index: 1, charCount: 7, tonePattern: [ping, ze, ping, ping, ze, ze, ping], rhyme: true, description: '上片次句' },
      { index: 2, charCount: 7, tonePattern: [ping, ping, ze, ze, ze, ping, ping], rhyme: true, description: '上片第三句' },
      { index: 3, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '下片首句' },
      { index: 4, charCount: 7, tonePattern: [ping, ping, ze, ze, ze, ping, ping], rhyme: false, description: '下片次句' },
      { index: 5, charCount: 7, tonePattern: [ping, ping, ze, ze, ze, ping, ping], rhyme: true, description: '下片第三句（结）' },
    ],
    rhymeScheme: ['a', 'a', 'a', 'b', 'b', 'a'],
    recommendedThemes: ['春夜', '秋思', '江湖'],
    example: {
      title: '浣溪沙·一曲新词酒一杯',
      author: '晏殊',
      content: ['一曲新词酒一杯', '去年天气旧亭台', '夕阳西下几时回', '无可奈何花落去', '似曾相识燕归来', '小园香径独徘徊'],
    },
  },
  {
    id: 'dielianhua',
    name: '蝶恋花',
    alias: '鹊踏枝、凤栖梧',
    description: '双调六十字，上下片各四仄韵。缠绵悱恻，意境幽深。',
    origin: '教坊曲名，后用作词牌',
    difficulty: 'medium',
    totalLines: 12,
    totalChars: 60,
    lines: [
      { index: 0, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '上片首句' },
      { index: 1, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '上片次句' },
      { index: 2, charCount: 5, tonePattern: [ze, ze, ping, ping, ze], rhyme: false, description: '上片第三句' },
      { index: 3, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '上片第四句' },
      { index: 4, charCount: 7, tonePattern: [ping, ping, ze, ze, ping, ping, ze], rhyme: false, description: '下片首句' },
      { index: 5, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '下片次句' },
      { index: 6, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '下片第三句' },
      { index: 7, charCount: 5, tonePattern: [ze, ze, ping, ping, ze], rhyme: false, description: '下片第四句' },
      { index: 8, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '下片第五句' },
      { index: 9, charCount: 7, tonePattern: [ping, ping, ze, ze, ping, ping, ze], rhyme: false, description: '上片第五句' },
      { index: 10, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '上片第六句' },
      { index: 11, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '结句' },
    ],
    rhymeScheme: ['a', '', '', 'a', '', 'a', '', '', 'a', '', '', 'a'],
    recommendedThemes: ['秋思', '归乡', '江湖'],
    example: {
      title: '蝶恋花·伫倚危楼风细细',
      author: '柳永',
      content: ['伫倚危楼风细细', '望极春愁', '黯黯生天际', '草色烟光残照里', '无言谁会凭阑意', '拟把疏狂图一醉', '对酒当歌', '强乐还无味', '衣带渐宽终不悔', '为伊消得人憔悴'],
    },
  },
  {
    id: 'jianzilan',
    name: '减字木兰花',
    alias: '减兰、木兰香',
    description: '双调四十四字，上下片各四句两仄韵两平韵。平仄交替，音韵和谐。',
    origin: '由木兰花令减字而成',
    difficulty: 'medium',
    totalLines: 8,
    totalChars: 44,
    lines: [
      { index: 0, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '上片首句（仄韵）' },
      { index: 1, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '上片次句（仄韵）' },
      { index: 2, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: false, description: '上片第三句（转平）' },
      { index: 3, charCount: 7, tonePattern: [ping, ping, ze, ze, ze, ping, ping], rhyme: true, description: '上片第四句（平韵）' },
      { index: 4, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '下片首句（仄韵）' },
      { index: 5, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '下片次句（仄韵）' },
      { index: 6, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: false, description: '下片第三句（转平）' },
      { index: 7, charCount: 7, tonePattern: [ping, ping, ze, ze, ze, ping, ping], rhyme: true, description: '下片第四句（平韵）' },
    ],
    rhymeScheme: ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd'],
    recommendedThemes: ['春夜', '秋思'],
    example: {
      title: '减字木兰花·春月',
      author: '苏轼',
      content: ['春庭月午', '摇荡香醪光欲舞', '步转回廊', '半落梅花婉娩香', '轻云薄雾', '总是少年行乐处', '不似秋光', '只与离人照断肠'],
    },
  },
  {
    id: 'qingyin',
    name: '清平乐',
    alias: '清平乐令、忆萝月',
    description: '双调四十六字，上片四仄韵，下片三平韵。上片短促，下片舒展。',
    origin: '教坊曲名，后用作词牌',
    difficulty: 'medium',
    totalLines: 8,
    totalChars: 46,
    lines: [
      { index: 0, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '上片首句（仄韵）' },
      { index: 1, charCount: 5, tonePattern: [ze, ze, ping, ping, ze], rhyme: true, description: '上片次句（仄韵）' },
      { index: 2, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '上片第三句（仄韵）' },
      { index: 3, charCount: 6, tonePattern: [ze, ze, ping, ping, ping, ze], rhyme: true, description: '上片第四句（仄韵）' },
      { index: 4, charCount: 6, tonePattern: [ping, ping, ze, ze, ping, ping], rhyme: false, description: '下片首句（转平）' },
      { index: 5, charCount: 6, tonePattern: [ping, ping, ze, ze, ping, ping], rhyme: true, description: '下片次句（平韵）' },
      { index: 6, charCount: 6, tonePattern: [ze, ze, ping, ping, ze, ping], rhyme: false, description: '下片第三句（平韵）' },
      { index: 7, charCount: 6, tonePattern: [ping, ping, ze, ze, ping, ping], rhyme: true, description: '下片第四句（结）' },
    ],
    rhymeScheme: ['a', 'a', 'a', 'a', 'b', 'b', 'b', 'b'],
    recommendedThemes: ['归乡', '江湖'],
    example: {
      title: '清平乐·村居',
      author: '辛弃疾',
      content: ['茅檐低小', '溪上青青草', '醉里吴音相媚好', '白发谁家翁媪', '大儿锄豆溪东', '中儿正织鸡笼', '最喜小儿亡赖', '溪头卧剥莲蓬'],
    },
  },
  {
    id: 'yongyu',
    name: '雨霖铃',
    alias: '雨淋铃',
    description: '双调一百三字，上片十句五仄韵，下片九句五仄韵。长调慢词，情感深沉。',
    origin: '相传唐玄宗避安禄山乱入蜀，霖雨连日，栈道中闻铃声，遂制此曲',
    difficulty: 'hard',
    totalLines: 19,
    totalChars: 103,
    lines: [
      { index: 0, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '起句' },
      { index: 1, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '次句' },
      { index: 2, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '第三句' },
      { index: 3, charCount: 6, tonePattern: [ze, ze, ping, ping, ze, ping], rhyme: false, description: '第四句' },
      { index: 4, charCount: 6, tonePattern: [ze, ze, ping, ping, ping, ze], rhyme: true, description: '第五句' },
      { index: 5, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: false, description: '第六句' },
      { index: 6, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '第七句' },
      { index: 7, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: false, description: '第八句' },
      { index: 8, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: true, description: '第九句' },
      { index: 9, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: false, description: '第十句' },
      { index: 10, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '下片起' },
      { index: 11, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: false, description: '下片二' },
      { index: 12, charCount: 7, tonePattern: [ze, ze, ping, ping, ping, ze, ze], rhyme: true, description: '下片三' },
      { index: 13, charCount: 6, tonePattern: [ze, ze, ping, ping, ping, ze], rhyme: false, description: '下片四' },
      { index: 14, charCount: 6, tonePattern: [ze, ze, ping, ping, ping, ze], rhyme: true, description: '下片五' },
      { index: 15, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: false, description: '下片六' },
      { index: 16, charCount: 4, tonePattern: [ping, ping, ze, ze], rhyme: true, description: '下片七' },
      { index: 17, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: false, description: '下片八' },
      { index: 18, charCount: 4, tonePattern: [ze, ze, ping, ping], rhyme: true, description: '结句' },
    ],
    rhymeScheme: ['a', '', 'a', '', 'a', '', 'a', '', 'a', '', 'a', '', 'a', '', 'a', '', 'a', '', 'a'],
    recommendedThemes: ['秋思', '归乡'],
    example: {
      title: '雨霖铃·寒蝉凄切',
      author: '柳永',
      content: ['寒蝉凄切', '对长亭晚', '骤雨初歇', '都门帐饮无绪', '留恋处', '兰舟催发', '执手相看泪眼', '竟无语凝噎', '念去去', '千里烟波', '暮霭沉沉楚天阔', '多情自古伤离别', '更那堪', '冷落清秋节', '今宵酒醒何处', '杨柳岸', '晓风残月', '此去经年', '应是良辰好景虚设', '便纵有', '千种风情', '更与何人说'],
    },
  },
]

export const cipaiScoringRuleSets: CipaiScoringRuleSet[] = [
  {
    mode: 'relaxed',
    label: '写意',
    description: '不拘格律，重在意境。句式大体符合即可，平仄韵脚从宽。',
    config: {
      rhythmWeight: 0.15,
      rhymeWeight: 0.15,
      tonePatternWeight: 0.1,
      formMatchWeight: 0.3,
    },
    charCountTolerance: 2,
    toneTolerance: 0.5,
    rhymeTolerance: 0.5,
  },
  {
    mode: 'standard',
    label: '正格',
    description: '遵循基本格律，句式与韵脚需符合要求，平仄可适度灵活。',
    config: {
      rhythmWeight: 0.2,
      rhymeWeight: 0.25,
      tonePatternWeight: 0.2,
      formMatchWeight: 0.35,
    },
    charCountTolerance: 1,
    toneTolerance: 0.3,
    rhymeTolerance: 0.2,
  },
  {
    mode: 'strict',
    label: '严律',
    description: '严格遵循格律，字数、平仄、韵脚均需精准对应，讲究工稳。',
    config: {
      rhythmWeight: 0.25,
      rhymeWeight: 0.3,
      tonePatternWeight: 0.25,
      formMatchWeight: 0.2,
    },
    charCountTolerance: 0,
    toneTolerance: 0.1,
    rhymeTolerance: 0,
  },
]

export const getCipaiById = (id: string): CipaiTemplate | undefined => {
  return cipaiTemplates.find(c => c.id === id)
}

export const getCipaiScoringRuleByMode = (mode: string): CipaiScoringRuleSet | undefined => {
  return cipaiScoringRuleSets.find(r => r.mode === mode)
}

export const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    easy: '入门',
    medium: '进阶',
    hard: '高阶',
  }
  return labels[difficulty] || difficulty
}

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    easy: '#5b7a8c',
    medium: '#c9a86c',
    hard: '#8b4557',
  }
  return colors[difficulty] || '#6b6858'
}
