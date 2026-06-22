import type { ExhibitionTheme, ReputationMilestone, RareChapter, SocietyReviewCriterion, Phrase, PhraseCategory, PhraseRarity, PhraseSource, ReviewVerdict, SubmissionStatus, ReputationRank } from '@/types'
import { REPUTATION_RANK_ORDER, REPUTATION_RANK_MIN, REPUTATION_RANK_COLORS, REPUTATION_RANK_ICONS } from '@/types'

let phraseIdCounter = 0
const pid = () => `rp_${Date.now()}_${++phraseIdCounter}`

const createRareSource = (chapterId: string, description: string): PhraseSource => ({
  type: 'chapter',
  chapterId,
  description
})

const rp = (text: string, category: PhraseCategory, weight: number, rarity: PhraseRarity, chapterId: string, desc: string): Phrase => ({
  id: pid(),
  text,
  category,
  position: null,
  rotation: 0,
  isPlaced: false,
  weight,
  rarity,
  source: createRareSource(chapterId, desc)
})

export const exhibitionThemes: ExhibitionTheme[] = [
  {
    id: 'ex_spring',
    name: '春山雅集',
    description: '以春日山水为主题，展现万物复苏之象',
    icon: '🌸',
    accentColor: '#7ca97c',
    requiredKeywords: ['春', '花', '绿'],
    preferredCategories: ['scene', 'imagery'],
    minScore: 60,
    maxSlots: 5,
    bonusReputation: 30,
    backgroundGradient: 'linear-gradient(135deg, #1a2a1a 0%, #2a3a2a 100%)'
  },
  {
    id: 'ex_autumn',
    name: '秋水长天',
    description: '以秋日寥廓为主题，抒写远思与归意',
    icon: '🍂',
    accentColor: '#c9a86c',
    requiredKeywords: ['秋', '风', '远'],
    preferredCategories: ['scene', 'emotion'],
    minScore: 65,
    maxSlots: 5,
    bonusReputation: 35,
    backgroundGradient: 'linear-gradient(135deg, #2a1a0f 0%, #3a2a1f 100%)'
  },
  {
    id: 'ex_night',
    name: '夜话长安',
    description: '以月夜思忆为主题，月下独酌般的意境',
    icon: '🌙',
    accentColor: '#5b7a8c',
    requiredKeywords: ['月', '夜', '思'],
    preferredCategories: ['time', 'emotion'],
    minScore: 70,
    maxSlots: 4,
    bonusReputation: 40,
    backgroundGradient: 'linear-gradient(135deg, #0f0f2a 0%, #1a1a3e 100%)'
  },
  {
    id: 'ex_farewell',
    name: '送别长亭',
    description: '以离别惜别为主题，古人相送的惆怅与豪迈',
    icon: '🛤️',
    accentColor: '#8b4557',
    requiredKeywords: ['别', '远', '归'],
    preferredCategories: ['emotion', 'action'],
    minScore: 72,
    maxSlots: 4,
    bonusReputation: 45,
    backgroundGradient: 'linear-gradient(135deg, #2a1520 0%, #3a2030 100%)'
  },
  {
    id: 'ex_hermit',
    name: '山居隐逸',
    description: '以隐居山林为主题，淡泊超脱的禅意境界',
    icon: '🏔️',
    accentColor: '#7a9ea8',
    requiredKeywords: ['山', '隐', '静'],
    preferredCategories: ['scene', 'imagery'],
    minScore: 78,
    maxSlots: 3,
    bonusReputation: 55,
    backgroundGradient: 'linear-gradient(135deg, #1a2a30 0%, #2a3a40 100%)'
  },
  {
    id: 'ex_dao',
    name: '道法自然',
    description: '以道家哲思为主题，大象无形的大师级展陈',
    icon: '☯️',
    accentColor: '#9b59b6',
    requiredKeywords: ['道', '无', '然'],
    preferredCategories: ['imagery', 'emotion'],
    minScore: 85,
    maxSlots: 3,
    bonusReputation: 70,
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2e1a3e 100%)'
  }
]

export const reputationMilestones: ReputationMilestone[] = REPUTATION_RANK_ORDER.map(rank => ({
  rank,
  minReputation: REPUTATION_RANK_MIN[rank],
  titleReward: `${rank}·诗社${rank === '大学士' ? '宗师' : '弟子'}`,
  unlockedFeatures: getUnlockedFeatures(rank),
  accentColor: REPUTATION_RANK_COLORS[rank],
  icon: REPUTATION_RANK_ICONS[rank]
}))

function getUnlockedFeatures(rank: string): string[] {
  switch (rank) {
    case '童生': return ['投稿基础功能']
    case '秀才': return ['展陈参与', '春山雅集展览']
    case '举人': return ['秋水长天展览', '夜话长安展览', '评审他人投稿']
    case '进士': return ['送别长亭展览', '山居隐逸展览', '精选展陈位']
    case '翰林': return ['道法自然展览', '推荐他人作品', '稀有章节·幽谷寻仙']
    case '大学士': return ['稀有章节·天机密卷', '大师展陈位', '诗社名誉顾问']
    default: return []
  }
}

export const rareChapters: RareChapter[] = [
  {
    id: 'rch_ygxx',
    title: '幽谷寻仙',
    subtitle: '云深不知处',
    description: '隐于深山的古径，传说有仙人在此抚琴。词句中蕴含着超脱尘世的意韵。',
    theme: '隐逸',
    backgroundGradient: 'linear-gradient(135deg, #0a1a1a 0%, #1a2a2a 50%, #0a2020 100%)',
    accentColor: '#7ca97c',
    phrases: [
      rp('云深', 'scene', 3, 'epic', 'rch_ygxx', '幽谷寻仙·云'),
      rp('仙踪', 'imagery', 3, 'legendary', 'rch_ygxx', '幽谷寻仙·仙'),
      rp('古径', 'scene', 2, 'rare', 'rch_ygxx', '幽谷寻仙·径'),
      rp('幽兰', 'scene', 3, 'epic', 'rch_ygxx', '幽谷寻仙·兰'),
      rp('石苔', 'scene', 2, 'rare', 'rch_ygxx', '幽谷寻仙·苔'),
      rp('独往', 'action', 2, 'rare', 'rch_ygxx', '幽谷寻仙·独往'),
      rp('忘机', 'emotion', 3, 'epic', 'rch_ygxx', '幽谷寻仙·忘机'),
      rp('空山', 'scene', 3, 'epic', 'rch_ygxx', '幽谷寻仙·空山'),
      rp('不见人', 'imagery', 2, 'rare', 'rch_ygxx', '幽谷寻仙·不见人'),
      rp('但闻', 'action', 2, 'rare', 'rch_ygxx', '幽谷寻仙·但闻'),
      rp('松风', 'scene', 2, 'rare', 'rch_ygxx', '幽谷寻仙·松风'),
      rp('问道', 'action', 3, 'epic', 'rch_ygxx', '幽谷寻仙·问道'),
      rp('无极', 'imagery', 3, 'legendary', 'rch_ygxx', '幽谷寻仙·无极'),
      rp('归真', 'emotion', 3, 'epic', 'rch_ygxx', '幽谷寻仙·归真'),
      rp('长生', 'time', 2, 'rare', 'rch_ygxx', '幽谷寻仙·长生'),
      rp('鹤影', 'imagery', 2, 'rare', 'rch_ygxx', '幽谷寻仙·鹤影'),
    ],
    unlocked: false,
    targetPhraseCount: 6,
    hint: '以隐逸之心，寻超脱之境',
    requiredRank: '翰林',
    requiredReputation: 1000,
    rarity: 'epic',
    qualifierWords: ['隐', '仙', '空'],
    forbiddenWords: ['繁华', '尘嚣'],
    hiddenKeywords: ['云深', '忘机', '无极'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['隐', '仙', '空'], bonusPerWord: 5 }, description: '含隐逸关键词每字+5分' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['云深', '忘机', '无极'], bonusPerKeyword: 8 }, description: '隐含仙踪词句每条+8分' },
      { type: 'forbidden_penalty', params: { words: ['繁华', '尘嚣'], penaltyPerWord: 10 }, description: '含尘世词句每字-10分' },
      { type: 'category_combo', params: { categories: ['scene', 'imagery', 'emotion'], minCategories: 3, bonus: 12 }, description: '景·意·情三类别齐全+12分' }
    ]
  },
  {
    id: 'rch_tjmj',
    title: '天机密卷',
    subtitle: '道可道非常道',
    description: '传说中记载天地玄机的古老卷轴，词句深蕴道家至理，非大学士不可参悟。',
    theme: '天道',
    backgroundGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2e1a4e 50%, #1a1a3e 100%)',
    accentColor: '#9b59b6',
    phrases: [
      rp('天道', 'imagery', 3, 'legendary', 'rch_tjmj', '天机密卷·天道'),
      rp('玄机', 'imagery', 3, 'legendary', 'rch_tjmj', '天机密卷·玄机'),
      rp('混沌', 'scene', 3, 'epic', 'rch_tjmj', '天机密卷·混沌'),
      rp('太极', 'imagery', 3, 'epic', 'rch_tjmj', '天机密卷·太极'),
      rp('无为', 'action', 3, 'epic', 'rch_tjmj', '天机密卷·无为'),
      rp('天地', 'scene', 2, 'rare', 'rch_tjmj', '天机密卷·天地'),
      rp('万象', 'imagery', 3, 'epic', 'rch_tjmj', '天机密卷·万象'),
      rp('虚极', 'emotion', 3, 'legendary', 'rch_tjmj', '天机密卷·虚极'),
      rp('守静', 'action', 2, 'rare', 'rch_tjmj', '天机密卷·守静'),
      rp('归根', 'action', 3, 'epic', 'rch_tjmj', '天机密卷·归根'),
      rp('复命', 'action', 2, 'rare', 'rch_tjmj', '天机密卷·复命'),
      rp('常明', 'time', 3, 'epic', 'rch_tjmj', '天机密卷·常明'),
      rp('妙徼', 'imagery', 3, 'legendary', 'rch_tjmj', '天机密卷·妙徼'),
      rp('同出', 'action', 2, 'rare', 'rch_tjmj', '天机密卷·同出'),
      rp('玄之又玄', 'imagery', 3, 'legendary', 'rch_tjmj', '天机密卷·玄之又玄'),
      rp('众妙之门', 'imagery', 3, 'legendary', 'rch_tjmj', '天机密卷·众妙之门'),
    ],
    unlocked: false,
    targetPhraseCount: 7,
    hint: '道可道非常道，名可名非常名',
    requiredRank: '大学士',
    requiredReputation: 1500,
    rarity: 'legendary',
    qualifierWords: ['道', '无', '玄'],
    forbiddenWords: ['浮华', '争名'],
    hiddenKeywords: ['天道', '虚极', '众妙之门', '玄之又玄'],
    settlementRules: [
      { type: 'qualifier_bonus', params: { words: ['道', '无', '玄'], bonusPerWord: 6 }, description: '含道门关键词每字+6分' },
      { type: 'hidden_keyword_trigger', params: { keywords: ['天道', '虚极', '众妙之门', '玄之又玄'], bonusPerKeyword: 10 }, description: '隐含天机词句每条+10分' },
      { type: 'forbidden_penalty', params: { words: ['浮华', '争名'], penaltyPerWord: 15 }, description: '含俗世词句每字-15分' },
      { type: 'category_combo', params: { categories: ['imagery', 'action', 'emotion'], minCategories: 3, bonus: 15 }, description: '意·行·情三类别齐全+15分' },
      { type: 'all_hidden_revealed', params: { bonus: 25 }, description: '全部隐含词句揭示+25分' }
    ]
  }
]

export const reviewCriteria: SocietyReviewCriterion[] = [
  { id: 'rc_imagery', name: '意象', description: '意象是否新颖独到', weight: 0.25, icon: '🎨' },
  { id: 'rc_coherence', name: '连贯', description: '词句之间是否连贯自然', weight: 0.25, icon: '🔗' },
  { id: 'rc_emotion', name: '情感', description: '情感是否真挚深刻', weight: 0.2, icon: '💫' },
  { id: 'rc_rhythm', name: '韵律', description: '节奏韵律是否和谐', weight: 0.15, icon: '🎵' },
  { id: 'rc_theme', name: '主题', description: '主题是否鲜明切题', weight: 0.15, icon: '🎯' }
]

export const reviewerNames: string[] = [
  '青莲居士', '少陵野老', '香山居士', '六一居士',
  '东坡居士', '淮海居士', '白石道人', '后村居士',
  '梅溪居士', '竹坡居士', '碧山居士', '玉田居士'
]

export const reviewComments: Record<ReviewVerdict, string[]> = {
  accept: [
    '此作意象清雅，堪称佳品。',
    '情感真挚，词句连贯，可入社藏。',
    '韵律和谐，有古风之韵，准予收录。',
    '意境深远，措辞得当，诗社幸甚。'
  ],
  reject: [
    '意象尚浅，可再斟酌。',
    '词句间略显散乱，需重新打磨。',
    '情感未达，还需沉淀。',
    '韵律稍有欠缺，建议推敲后重投。'
  ],
  showcase: [
    '此作堪称神品，当展于社中，供众人瞻仰！',
    '妙绝！此篇当入精选展陈，以为社中楷模。',
    '意象与情感兼备，实乃难得之作，特予展陈！',
    '惊艳之作！诗社以此为荣，当入展陈之列。'
  ]
}

export function getExhibitionThemeById(id: string): ExhibitionTheme | undefined {
  return exhibitionThemes.find(t => t.id === id)
}

export function getRareChapterById(id: string): RareChapter | undefined {
  return rareChapters.find(c => c.id === id)
}

export function getMilestoneByRank(rank: string): ReputationMilestone | undefined {
  return reputationMilestones.find(m => m.rank === rank)
}

export function getAvailableExhibitions(currentRank: string): ExhibitionTheme[] {
  const rankIndex = REPUTATION_RANK_ORDER.indexOf(currentRank as ReputationRank)
  if (rankIndex < 1) return []
  if (rankIndex >= 4) return exhibitionThemes
  return exhibitionThemes.slice(0, Math.min(rankIndex, exhibitionThemes.length - 1))
}

export function getSubmittableRanks(): string[] {
  return REPUTATION_RANK_ORDER
}

export const SUBMISSION_REPUTATION_REWARD: Record<SubmissionStatus, number> = {
  pending: 0,
  accepted: 15,
  rejected: 3,
  showcased: 40
}
