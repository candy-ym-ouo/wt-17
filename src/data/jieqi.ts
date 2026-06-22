import type { JieqiInfo, JieqiChapter, JieqiPhrase, JieqiQuest, JieqiCollection, JieqiType, SettlementRule, PhraseCategory } from '@/types'

export const jieqiList: JieqiInfo[] = [
  {
    id: 'lichun', name: '立春', pinyin: 'Lìchūn', season: '春', order: 1, month: 2, day: 4,
    description: '东风带雨逐西风，大地阳和暖气生。万物苏萌山水醒，农家岁首又谋耕。',
    poem: '春到人间草木知，便觉眼前生意满。',
    icon: '🌱', accentColor: '#7ca97c',
    backgroundGradient: 'linear-gradient(135deg, #1a2a1a 0%, #2a3d2a 50%, #1a2a2a 100%)',
    decoration: 'leaves'
  },
  {
    id: 'yushui', name: '雨水', pinyin: 'Yǔshuǐ', season: '春', order: 2, month: 2, day: 19,
    description: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。',
    poem: '天街小雨润如酥，草色遥看近却无。',
    icon: '🌧️', accentColor: '#7ca9c9',
    backgroundGradient: 'linear-gradient(135deg, #1a202a 0%, #2a3540 50%, #1a2530 100%)',
    decoration: 'clouds'
  },
  {
    id: 'jingzhe', name: '惊蛰', pinyin: 'Jīngzhé', season: '春', order: 3, month: 3, day: 6,
    description: '微雨众卉新，一雷惊蛰始。田家几日闲，耕种从此起。',
    poem: '春雷响，万物长，一声霹雳醒蛇虫。',
    icon: '⚡', accentColor: '#c9a86c',
    backgroundGradient: 'linear-gradient(135deg, #2a251a 0%, #3d3520 50%, #2a2a1a 100%)',
    decoration: 'fireflies'
  },
  {
    id: 'chunfen', name: '春分', pinyin: 'Chūnfēn', season: '春', order: 4, month: 3, day: 21,
    description: '春分雨脚落声微，柳岸斜风带客归。时令北方偏向晚，可知早有绿腰肥。',
    poem: '春风如贵客，一到便繁华。',
    icon: '🌸', accentColor: '#c98bc4',
    backgroundGradient: 'linear-gradient(135deg, #2a1a2a 0%, #3d2a3d 50%, #2a1a2a 100%)',
    decoration: 'flowers'
  },
  {
    id: 'qingming', name: '清明', pinyin: 'Qīngmíng', season: '春', order: 5, month: 4, day: 5,
    description: '清明时节雨纷纷，路上行人欲断魂。借问酒家何处有，牧童遥指杏花村。',
    poem: '梨花风起正清明，游子寻春半出城。',
    icon: '🌿', accentColor: '#a8c97c',
    backgroundGradient: 'linear-gradient(135deg, #1a2a20 0%, #2a3d2a 50%, #1a2a25 100%)',
    decoration: 'leaves'
  },
  {
    id: 'guyu', name: '谷雨', pinyin: 'Gǔyǔ', season: '春', order: 6, month: 4, day: 20,
    description: '谷雨如丝复似尘，煮瓶浮蜡正尝新。牡丹破萼樱桃熟，未许飞花减却春。',
    poem: '谷雨春光晓，山川黛色青。',
    icon: '🌾', accentColor: '#7cc9a8',
    backgroundGradient: 'linear-gradient(135deg, #1a2a25 0%, #203d30 50%, #1a2a2a 100%)',
    decoration: 'waves'
  },
  {
    id: 'lixia', name: '立夏', pinyin: 'Lìxià', season: '夏', order: 7, month: 5, day: 6,
    description: '江南孟夏天，慈竹笋如编。蜃气为楼阁，蛙声作管弦。',
    poem: '首夏犹清和，芳草亦未歇。',
    icon: '☀️', accentColor: '#d4a574',
    backgroundGradient: 'linear-gradient(135deg, #2a2015 0%, #3d2d1a 50%, #2a2515 100%)',
    decoration: 'stars'
  },
  {
    id: 'xiaoman', name: '小满', pinyin: 'Xiǎomǎn', season: '夏', order: 8, month: 5, day: 21,
    description: '夜莺啼绿柳，皓月醒长空。最爱垄头麦，迎风笑落红。',
    poem: '梅子金黄杏子肥，麦花雪白菜花稀。',
    icon: '🌾', accentColor: '#c9a87c',
    backgroundGradient: 'linear-gradient(135deg, #252a1a 0%, #353d20 50%, #2a2a1a 100%)',
    decoration: 'fireflies'
  },
  {
    id: 'mangzhong', name: '芒种', pinyin: 'Mángzhòng', season: '夏', order: 9, month: 6, day: 6,
    description: '时雨及芒种，四野皆插秧。家家麦饭美，处处菱歌长。',
    poem: '芒种忙忙割，农家乐启镰。',
    icon: '🌾', accentColor: '#d4c074',
    backgroundGradient: 'linear-gradient(135deg, #2a2815 0%, #3d3820 50%, #2a2815 100%)',
    decoration: 'waves'
  },
  {
    id: 'xiazhi', name: '夏至', pinyin: 'Xiàzhì', season: '夏', order: 10, month: 6, day: 21,
    description: '昼晷已云极，宵漏自此长。未及施政教，所忧变炎凉。',
    poem: '日长之至，日影短至，故曰夏至。',
    icon: '🌞', accentColor: '#c97c5b',
    backgroundGradient: 'linear-gradient(135deg, #2a1a15 0%, #3d2520 50%, #2a1a15 100%)',
    decoration: 'stars'
  },
  {
    id: 'xiaoshu', name: '小暑', pinyin: 'Xiǎoshǔ', season: '夏', order: 11, month: 7, day: 7,
    description: '倏忽温风至，因循小暑来。竹喧先觉雨，山暗已闻雷。',
    poem: '小暑不足畏，深居如退藏。',
    icon: '🌤️', accentColor: '#d48b74',
    backgroundGradient: 'linear-gradient(135deg, #2a1f1a 0%, #3d2a25 50%, #2a1f1a 100%)',
    decoration: 'clouds'
  },
  {
    id: 'dashu', name: '大暑', pinyin: 'Dàshǔ', season: '夏', order: 12, month: 7, day: 23,
    description: '大暑三秋近，林钟九夏移。桂轮开子夜，萤火照空时。',
    poem: '赤日几时过，清风无处寻。',
    icon: '🔥', accentColor: '#c95b5b',
    backgroundGradient: 'linear-gradient(135deg, #2a1515 0%, #3d2020 50%, #2a1515 100%)',
    decoration: 'fireflies'
  },
  {
    id: 'liqiu', name: '立秋', pinyin: 'Lìqiū', season: '秋', order: 13, month: 8, day: 8,
    description: '乳鸦啼散玉屏空，一枕新凉一扇风。睡起秋色无觅处，满阶梧桐月明中。',
    poem: '一叶落知天下秋。',
    icon: '🍂', accentColor: '#c9a86c',
    backgroundGradient: 'linear-gradient(135deg, #2a251a 0%, #3d3020 50%, #2a251a 100%)',
    decoration: 'leaves'
  },
  {
    id: 'chushu', name: '处暑', pinyin: 'Chǔshǔ', season: '秋', order: 14, month: 8, day: 23,
    description: '离离暑云散，袅袅凉风起。池上秋又来，荷花半成子。',
    poem: '处暑无三日，新凉直万金。',
    icon: '🌅', accentColor: '#d4a574',
    backgroundGradient: 'linear-gradient(135deg, #2a201a 0%, #3d2a20 50%, #2a201a 100%)',
    decoration: 'clouds'
  },
  {
    id: 'bailu', name: '白露', pinyin: 'Báilù', season: '秋', order: 15, month: 9, day: 8,
    description: '蒹葭苍苍，白露为霜。所谓伊人，在水一方。',
    poem: '露从今夜白，月是故乡明。',
    icon: '💧', accentColor: '#a8c0d4',
    backgroundGradient: 'linear-gradient(135deg, #1a202a 0%, #2a303d 50%, #1a202a 100%)',
    decoration: 'stars'
  },
  {
    id: 'qiufen', name: '秋分', pinyin: 'Qiūfēn', season: '秋', order: 16, month: 9, day: 23,
    description: '金气秋分，风清露冷秋期半。凉蟾光满，桂子飘香远。',
    poem: '自古逢秋悲寂寥，我言秋日胜春朝。',
    icon: '🍁', accentColor: '#c97c5b',
    backgroundGradient: 'linear-gradient(135deg, #2a1a1a 0%, #3d2525 50%, #2a1a1a 100%)',
    decoration: 'leaves'
  },
  {
    id: 'hanlu', name: '寒露', pinyin: 'Hánlù', season: '秋', order: 17, month: 10, day: 8,
    description: '袅袅凉风动，凄凄寒露零。兰衰花始白，荷破叶犹青。',
    poem: '寒露惊秋晚，朝看菊渐黄。',
    icon: '🌙', accentColor: '#7a9ea8',
    backgroundGradient: 'linear-gradient(135deg, #1a1f2a 0%, #252a3d 50%, #1a1f2a 100%)',
    decoration: 'stars'
  },
  {
    id: 'shuangjiang', name: '霜降', pinyin: 'Shuāngjiàng', season: '秋', order: 18, month: 10, day: 24,
    description: '霜降水返壑，风落木归山。冉冉岁将宴，物皆复本源。',
    poem: '月落乌啼霜满天，江枫渔火对愁眠。',
    icon: '❄️', accentColor: '#a8c0d4',
    backgroundGradient: 'linear-gradient(135deg, #1a1f2a 0%, #252830 50%, #1a1a25 100%)',
    decoration: 'snow'
  },
  {
    id: 'lidong', name: '立冬', pinyin: 'Lìdōng', season: '冬', order: 19, month: 11, day: 8,
    description: '冻笔新诗懒写，寒炉美酒时温。醉看墨花月白，恍疑雪满前村。',
    poem: '落水荷塘满眼枯，西风渐作北风呼。',
    icon: '🌨️', accentColor: '#7ca9c9',
    backgroundGradient: 'linear-gradient(135deg, #151a25 0%, #202535 50%, #151a25 100%)',
    decoration: 'snow'
  },
  {
    id: 'xiaoxue', name: '小雪', pinyin: 'Xiǎoxuě', season: '冬', order: 20, month: 11, day: 22,
    description: '小雪已晴芦叶暗，长波乍急鹤声嘶。孤舟一夜宿流水，眼看山头月落溪。',
    poem: '小雪纷纷，掩尽重门。',
    icon: '🌨️', accentColor: '#a8c0d4',
    backgroundGradient: 'linear-gradient(135deg, #1a1f2a 0%, #252a35 50%, #1a1f2a 100%)',
    decoration: 'snow'
  },
  {
    id: 'daxue', name: '大雪', pinyin: 'Dàxuě', season: '冬', order: 21, month: 12, day: 7,
    description: '大雪压青松，青松挺且直。要知松高洁，待到雪化时。',
    poem: '忽如一夜春风来，千树万树梨花开。',
    icon: '❄️', accentColor: '#c0d4e8',
    backgroundGradient: 'linear-gradient(135deg, #151a20 0%, #202830 50%, #151a20 100%)',
    decoration: 'snow'
  },
  {
    id: 'dongzhi', name: '冬至', pinyin: 'Dōngzhì', season: '冬', order: 22, month: 12, day: 22,
    description: '天时人事日相催，冬至阳生春又来。刺绣五纹添弱线，吹葭六管动浮灰。',
    poem: '阴极之至，阳气始生，日南至，日短之至，日影长之至。',
    icon: '🌌', accentColor: '#9b59b6',
    backgroundGradient: 'linear-gradient(135deg, #1a1525 0%, #2a203d 50%, #1a1525 100%)',
    decoration: 'stars'
  },
  {
    id: 'xiaohan', name: '小寒', pinyin: 'Xiǎohán', season: '冬', order: 23, month: 1, day: 6,
    description: '小寒连大吕，欢鹊垒新巢。拾食寻河曲，衔紫绕树梢。',
    poem: '小寒时节，正同云暮惨，劲风朝烈。',
    icon: '🥶', accentColor: '#7ca9c9',
    backgroundGradient: 'linear-gradient(135deg, #151a20 0%, #202835 50%, #151a20 100%)',
    decoration: 'snow'
  },
  {
    id: 'dahan', name: '大寒', pinyin: 'Dàhán', season: '冬', order: 24, month: 1, day: 20,
    description: '大寒须遣酒争豪，更把梅花仔细看。明日独归花路远，人间何事不悠悠。',
    poem: '岁末大寒至，静候春归来。',
    icon: '🧊', accentColor: '#a8c0d4',
    backgroundGradient: 'linear-gradient(135deg, #151820 0%, #202530 50%, #151820 100%)',
    decoration: 'snow'
  }
]

export const jieqiChapters: Record<string, JieqiChapter> = {
  jq_lichun: {
    id: 'jq_lichun', jieqiId: 'lichun',
    title: '春回大地', subtitle: '立春·初章',
    description: '春到人间草木知，东风吹暖万物苏。在初绽的新芽中，捕捉春天的第一缕气息。',
    theme: '迎春', targetPhraseCount: 5, difficulty: 'easy',
    hint: '选取5个词句，描绘春回大地的生机与喜悦',
    qualifierWords: ['春深', '东风', '新芽'],
    forbiddenWords: ['秋凉', '岁末', '寂寥'],
    hiddenKeywords: ['春意', '萌动'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['春深', '东风', '新芽'], bonusPerWord: 4, label: '立春三候' }, description: '每含一个立春限定词，总分加4' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['春意', '萌动'], bonus: 6, label: '春意暗涌' }, description: '触发任一隐藏题眼，总分加6' },
      { type: 'category_combo', params: { categories: ['scene', 'emotion'], minCount: 2, bonus: 5, label: '情景相生' }, description: '景物与情感类各含2词以上，加5分' }
    ]
  },
  jq_yushui: {
    id: 'jq_yushui', jieqiId: 'yushui',
    title: '润物无声', subtitle: '雨水·第二章',
    description: '好雨知时节，当春乃发生。在绵绵细雨中，感受春天的温柔与润泽。',
    theme: '春雨', targetPhraseCount: 6, difficulty: 'easy',
    hint: '选取6个词句，书写春雨润物的诗意',
    qualifierWords: ['夜雨', '细雨', '润物'],
    forbiddenWords: ['骄阳', '酷暑', '狂喜'],
    hiddenKeywords: ['春雨', '如酥'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['夜雨', '细雨', '润物'], bonusPerWord: 4, label: '雨水三韵' }, description: '每含一个雨水限定词，总分加4' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['春雨', '如酥'], bonus: 6, label: '雨韵暗合' }, description: '触发任一隐藏题眼，总分加6' },
      { type: 'all_hidden_revealed', params: { keywords: ['春雨', '如酥'], bonus: 10, label: '雨润春意' }, description: '全部隐藏题眼触发，额外加10分' }
    ]
  },
  jq_jingzhe: {
    id: 'jq_jingzhe', jieqiId: 'jingzhe',
    title: '春雷初响', subtitle: '惊蛰·第三章',
    description: '微雨众卉新，一雷惊蛰始。春雷惊醒沉睡的万物，生机盎然。',
    theme: '惊蛰', targetPhraseCount: 6, difficulty: 'medium',
    hint: '选取6个词句，展现春雷惊醒万物的震撼',
    qualifierWords: ['春雷', '惊蛰', '初醒'],
    forbiddenWords: ['沉寂', '死寂', '淡泊'],
    hiddenKeywords: ['惊蛰', '万物苏'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['春雷', '惊蛰', '初醒'], bonusPerWord: 5, label: '惊蛰三响' }, description: '每含一个惊蛰限定词，总分加5' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['惊蛰', '万物苏'], bonus: 7, label: '春雷暗动' }, description: '触发任一隐藏题眼，总分加7' },
      { type: 'category_combo', params: { categories: ['action', 'imagery'], minCount: 2, bonus: 6, label: '动静相宜' }, description: '动作与意象类各含2词以上，加6分' }
    ]
  },
  jq_chunfen: {
    id: 'jq_chunfen', jieqiId: 'chunfen',
    title: '昼夜均分', subtitle: '春分·第四章',
    description: '春风如贵客，一到便繁华。昼夜平分，春色正好，莫负好时光。',
    theme: '春分', targetPhraseCount: 7, difficulty: 'medium',
    hint: '选取7个词句，描绘春分时节的绚烂春色',
    qualifierWords: ['春风', '花满', '柳绿'],
    forbiddenWords: ['秋凉', '冬寒', '寂寥'],
    hiddenKeywords: ['春分', '燕归来'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['春风', '花满', '柳绿'], bonusPerWord: 5, label: '春分三景' }, description: '每含一个春分限定词，总分加5' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['春分', '燕归来'], bonus: 8, label: '春意暗藏' }, description: '触发任一隐藏题眼，总分加8' },
      { type: 'all_hidden_revealed', params: { keywords: ['春分', '燕归来'], bonus: 12, label: '春归燕来' }, description: '全部隐藏题眼触发，额外加12分' }
    ]
  }
}

export const jieqiPhrases: JieqiPhrase[] = [
  { text: '春深', category: 'time', rarity: 'common', jieqiId: 'lichun', isExclusive: false },
  { text: '东风', category: 'scene', rarity: 'common', jieqiId: 'lichun', isExclusive: false },
  { text: '新芽', category: 'imagery', rarity: 'rare', jieqiId: 'lichun', isExclusive: true },
  { text: '萌动', category: 'action', rarity: 'rare', jieqiId: 'lichun', isExclusive: true },
  { text: '春意', category: 'emotion', rarity: 'epic', jieqiId: 'lichun', isExclusive: true },
  { text: '细雨', category: 'scene', rarity: 'common', jieqiId: 'yushui', isExclusive: false },
  { text: '润物', category: 'action', rarity: 'rare', jieqiId: 'yushui', isExclusive: true },
  { text: '如酥', category: 'imagery', rarity: 'epic', jieqiId: 'yushui', isExclusive: true },
  { text: '春雷', category: 'scene', rarity: 'rare', jieqiId: 'jingzhe', isExclusive: true },
  { text: '惊蛰', category: 'time', rarity: 'rare', jieqiId: 'jingzhe', isExclusive: true },
  { text: '初醒', category: 'emotion', rarity: 'rare', jieqiId: 'jingzhe', isExclusive: false },
  { text: '万物苏', category: 'imagery', rarity: 'epic', jieqiId: 'jingzhe', isExclusive: true },
  { text: '花满', category: 'scene', rarity: 'common', jieqiId: 'chunfen', isExclusive: false },
  { text: '柳绿', category: 'scene', rarity: 'common', jieqiId: 'chunfen', isExclusive: false },
  { text: '燕归来', category: 'imagery', rarity: 'epic', jieqiId: 'chunfen', isExclusive: true }
]

export const jieqiQuests: JieqiQuest[] = [
  {
    id: 'jq_quest_1', jieqiId: 'lichun', order: 1,
    title: '迎春初试',
    description: '完成立春节气章节的首次创作',
    icon: '🌱',
    unlockConditions: [{ type: 'chapter_count', params: { minCount: 1 } }],
    completeConditions: [{ type: 'score_threshold', params: { minScore: 60, chapterId: 'jq_lichun' } }],
    rewards: [{ type: 'phrase_unlock', params: { phraseTexts: ['新芽', '萌动'] } }]
  },
  {
    id: 'jq_quest_2', jieqiId: 'lichun', order: 2,
    title: '春意盎然',
    description: '在立春章节获得80分以上的高分',
    icon: '🌸',
    unlockConditions: [{ type: 'score_threshold', params: { minScore: 60, chapterId: 'jq_lichun' } }],
    completeConditions: [{ type: 'score_threshold', params: { minScore: 80, chapterId: 'jq_lichun' } }],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['春意'] } },
      { type: 'title_reward', params: { title: '迎春使者' } }
    ]
  },
  {
    id: 'jq_quest_3', jieqiId: 'yushui', order: 1,
    title: '雨润初心',
    description: '完成雨水节气章节的首次创作',
    icon: '🌧️',
    unlockConditions: [{ type: 'score_threshold', params: { minScore: 60, chapterId: 'jq_lichun' } }],
    completeConditions: [{ type: 'score_threshold', params: { minScore: 60, chapterId: 'jq_yushui' } }],
    rewards: [{ type: 'phrase_unlock', params: { phraseTexts: ['润物'] } }]
  },
  {
    id: 'jq_quest_4', jieqiId: 'yushui', order: 2,
    title: '春雨如酥',
    description: '在雨水章节获得高分并解锁全部隐藏题眼',
    icon: '💧',
    unlockConditions: [{ type: 'score_threshold', params: { minScore: 60, chapterId: 'jq_yushui' } }],
    completeConditions: [{ type: 'score_threshold', params: { minScore: 85, chapterId: 'jq_yushui' } }],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['如酥'] } },
      { type: 'title_reward', params: { title: '听雨墨客' } }
    ]
  }
]

export const jieqiCollections: JieqiCollection[] = [
  {
    id: 'jq_collect_chun',
    jieqiId: 'chunfen',
    title: '春季雅集',
    subtitle: '春之卷',
    accentColor: '#7ca97c',
    maxSlots: 12,
    description: '收录春季六节气的佳作，珍藏春日的每一份诗意'
  },
  {
    id: 'jq_collect_xia',
    jieqiId: 'dashu',
    title: '夏季雅集',
    subtitle: '夏之卷',
    accentColor: '#d4a574',
    maxSlots: 12,
    description: '收录夏季六节气的佳作，珍藏夏日的每一份热情'
  },
  {
    id: 'jq_collect_qiu',
    jieqiId: 'shuangjiang',
    title: '秋季雅集',
    subtitle: '秋之卷',
    accentColor: '#c9a86c',
    maxSlots: 12,
    description: '收录秋季六节气的佳作，珍藏秋日的每一份思绪'
  },
  {
    id: 'jq_collect_dong',
    jieqiId: 'dahan',
    title: '冬季雅集',
    subtitle: '冬之卷',
    accentColor: '#7ca9c9',
    maxSlots: 12,
    description: '收录冬季六节气的佳作，珍藏冬日的每一份静谧'
  }
]

export const getJieqiById = (id: JieqiType): JieqiInfo | undefined => {
  return jieqiList.find(j => j.id === id)
}

export const getJieqiBySeason = (season: string): JieqiInfo[] => {
  return jieqiList.filter(j => j.season === season)
}

export const getCurrentJieqi = (): JieqiInfo | null => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  
  for (let i = jieqiList.length - 1; i >= 0; i--) {
    const jieqi = jieqiList[i]
    if (month > jieqi.month || (month === jieqi.month && day >= jieqi.day)) {
      return jieqi
    }
  }
  return jieqiList[jieqiList.length - 1]
}

export const getJieqiChapter = (id: string): JieqiChapter | undefined => {
  return jieqiChapters[id]
}

export const getJieqiPhrases = (jieqiId: JieqiType): JieqiPhrase[] => {
  return jieqiPhrases.filter(p => p.jieqiId === jieqiId)
}

export const getJieqiQuests = (jieqiId: JieqiType): JieqiQuest[] => {
  return jieqiQuests.filter(q => q.jieqiId === jieqiId).sort((a, b) => a.order - b.order)
}

export const isJieqiUnlocked = (jieqiId: JieqiType): boolean => {
  const now = new Date()
  const jieqi = getJieqiById(jieqiId)
  if (!jieqi) return false
  
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  
  if (currentMonth > jieqi.month) return true
  if (currentMonth === jieqi.month && currentDay >= jieqi.day) return true
  
  return false
}
