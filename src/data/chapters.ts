import type { Chapter, Phrase, PhraseCategory, ChapterSoundscape, SettlementRule } from '@/types'
import {
  scenePhrases, emotionPhrases, timePhrases,
  actionPhrases, imageryPhrases, createPhrase,
  generateChapterPhrases, dropPhrases
} from './phrases'

const pickRandom = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export interface ChapterDropConfig {
  themeKeywords: string[]
  categoryDistribution: Partial<Record<PhraseCategory, number>>
  totalCount: number
  qualifierWords?: string[]
  forbiddenWords?: string[]
  hiddenKeywords?: string[]
}

export const chapterDropConfigs: Record<string, ChapterDropConfig> = {
  ch1: {
    themeKeywords: ['明月', '落花', '清风', '垂柳', '流水', '春深', '黄昏', '昨夜', '相思', '缱绻'],
    categoryDistribution: { scene: 0.35, emotion: 0.2, time: 0.15, action: 0.1, imagery: 0.2 },
    totalCount: 15,
    qualifierWords: ['明月', '落花', '清风'],
    forbiddenWords: ['狂喜', '孤苦'],
    hiddenKeywords: ['春深', '清欢']
  },
  ch2: {
    themeKeywords: ['青山', '残阳', '荒原', '寒烟', '孤舟', '日暮', '秋凉', '岁末', '离愁', '寂寥', '惆怅', '古道', '西风', '归雁', '浊酒'],
    categoryDistribution: { scene: 0.3, emotion: 0.25, time: 0.15, action: 0.1, imagery: 0.2 },
    totalCount: 15,
    qualifierWords: ['残阳', '古道', '西风'],
    forbiddenWords: ['清欢', '悠然'],
    hiddenKeywords: ['岁末', '归雁']
  },
  ch3: {
    themeKeywords: ['初雪', '夜雨', '繁星', '古寺', '白云', '黎明', '昨夜', '千年', '相思', '缱绻', '清欢', '遥望', '凭栏', '回眸', '独坐', '故人', '青灯', '素笺', '旧约'],
    categoryDistribution: { scene: 0.3, emotion: 0.25, time: 0.15, action: 0.15, imagery: 0.15 },
    totalCount: 16,
    qualifierWords: ['初雪', '故人', '青灯'],
    forbiddenWords: ['狂喜', '淡泊'],
    hiddenKeywords: ['旧约', '素笺']
  },
  ch4: {
    themeKeywords: ['夜雨', '翠竹', '小径', '长河', '古寺', '淡泊', '怅惘', '悲悯', '抚琴', '落笔', '轻吟', '独酌', '锦瑟', '玉笛', '青灯', '残梦'],
    categoryDistribution: { scene: 0.25, emotion: 0.2, time: 0.15, action: 0.2, imagery: 0.2 },
    totalCount: 17,
    qualifierWords: ['夜雨', '抚琴', '独酌'],
    forbiddenWords: ['清欢', '悠然'],
    hiddenKeywords: ['玉笛', '残梦']
  },
  ch5: {
    themeKeywords: [],
    categoryDistribution: {},
    totalCount: 0,
    qualifierWords: [],
    forbiddenWords: [],
    hiddenKeywords: []
  }
}

export const chapterSettlementRules: Record<string, SettlementRule[]> = {
  ch1: [
    { type: 'qualifier_bonus', params: { words: ['明月', '落花', '清风'], bonusPerWord: 3, label: '春夜三题' }, description: '每含一个春夜限定词（明月、落花、清风），总分加3' },
    { type: 'hidden_keyword_trigger', params: { keywords: ['春深', '清欢'], bonus: 5, label: '春意暗藏' }, description: '触发任一隐藏题眼（春深、清欢），总分加5' },
    { type: 'forbidden_penalty', params: { words: ['狂喜', '孤苦'], penaltyPerWord: 5, label: '离题之忌' }, description: '每含一个禁用词（狂喜、孤苦），总分扣5' },
    { type: 'all_hidden_revealed', params: { keywords: ['春深', '清欢'], bonus: 8, label: '春意尽现' }, description: '全部隐藏题眼触发，额外加8分' },
  ],
  ch2: [
    { type: 'qualifier_bonus', params: { words: ['残阳', '古道', '西风'], bonusPerWord: 3, label: '秋途三景' }, description: '每含一个秋途限定词（残阳、古道、西风），总分加3' },
    { type: 'hidden_keyword_trigger', params: { keywords: ['岁末', '归雁'], bonus: 5, label: '暮秋暗意' }, description: '触发任一隐藏题眼（岁末、归雁），总分加5' },
    { type: 'forbidden_penalty', params: { words: ['清欢', '悠然'], penaltyPerWord: 5, label: '不合秋意' }, description: '每含一个禁用词（清欢、悠然），总分扣5' },
    { type: 'category_combo', params: { categories: ['scene', 'emotion'], minCount: 2, bonus: 6, label: '情景交融' }, description: '景物与情感类各含2词以上，加6分' },
  ],
  ch3: [
    { type: 'qualifier_bonus', params: { words: ['初雪', '故人', '青灯'], bonusPerWord: 3, label: '归途三忆' }, description: '每含一个归途限定词（初雪、故人、青灯），总分加3' },
    { type: 'hidden_keyword_trigger', params: { keywords: ['旧约', '素笺'], bonus: 5, label: '故园暗约' }, description: '触发任一隐藏题眼（旧约、素笺），总分加5' },
    { type: 'forbidden_penalty', params: { words: ['狂喜', '淡泊'], penaltyPerWord: 5, label: '不合归心' }, description: '每含一个禁用词（狂喜、淡泊），总分扣5' },
    { type: 'all_hidden_revealed', params: { keywords: ['旧约', '素笺'], bonus: 8, label: '故园情深' }, description: '全部隐藏题眼触发，额外加8分' },
  ],
  ch4: [
    { type: 'qualifier_bonus', params: { words: ['夜雨', '抚琴', '独酌'], bonusPerWord: 4, label: '江湖三韵' }, description: '每含一个江湖限定词（夜雨、抚琴、独酌），总分加4' },
    { type: 'hidden_keyword_trigger', params: { keywords: ['玉笛', '残梦'], bonus: 6, label: '夜雨暗声' }, description: '触发任一隐藏题眼（玉笛、残梦），总分加6' },
    { type: 'forbidden_penalty', params: { words: ['清欢', '悠然'], penaltyPerWord: 6, label: '不合江湖' }, description: '每含一个禁用词（清欢、悠然），总分扣6' },
    { type: 'category_combo', params: { categories: ['action', 'imagery'], minCount: 2, bonus: 7, label: '行吟意象' }, description: '动作与意象类各含2词以上，加7分' },
  ],
  ch5: []
}

export const chapters: Chapter[] = [
  {
    id: 'ch1',
    title: '春江花月',
    subtitle: '第一章 · 春夜之思',
    description: '春江湖水连海平，海上明月共潮生。在花与月的交织中，寻觅千年以前的那份幽思。',
    theme: '春夜',
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #1a2a3d 100%)',
    accentColor: '#c9a86c',
    phrases: [
      ...pickRandom(scenePhrases.filter(p => ['明月', '落花', '清风', '垂柳', '流水'].includes(p.text)), 5),
      ...pickRandom(emotionPhrases, 3),
      ...pickRandom(timePhrases.filter(p => ['黄昏', '昨夜', '春深'].includes(p.text)), 2),
      ...pickRandom(actionPhrases, 2),
      ...pickRandom(imageryPhrases, 3),
    ],
    unlocked: true,
    targetPhraseCount: 5,
    hint: '选取5个词句，构建一幅春夜思念的图景',
    qualifierWords: ['明月', '落花', '清风'],
    forbiddenWords: ['狂喜', '孤苦'],
    hiddenKeywords: ['春深', '清欢'],
    settlementRules: chapterSettlementRules.ch1
  },
  {
    id: 'ch2',
    title: '秋山孤旅',
    subtitle: '第二章 · 羁旅之愁',
    description: '枯藤老树昏鸦，小桥流水人家。行走在秋日的古道上，行囊里装满了远方的思念。',
    theme: '秋思',
    backgroundGradient: 'linear-gradient(135deg, #1a1520 0%, #3d2817 50%, #1a2018 100%)',
    accentColor: '#d4a574',
    phrases: [
      ...pickRandom(scenePhrases.filter(p => ['青山', '残阳', '荒原', '寒烟', '孤舟'].includes(p.text)), 5),
      ...pickRandom(emotionPhrases.filter(p => ['离愁', '寂寥', '惆怅'].includes(p.text)), 3),
      ...pickRandom(timePhrases.filter(p => ['日暮', '秋凉', '岁末'].includes(p.text)), 2),
      ...pickRandom(actionPhrases, 2),
      ...pickRandom(imageryPhrases.filter(p => ['古道', '西风', '归雁', '浊酒'].includes(p.text)), 3),
    ],
    unlocked: false,
    targetPhraseCount: 6,
    hint: '选取6个词句，描绘一段秋日远行的孤寂',
    qualifierWords: ['残阳', '古道', '西风'],
    forbiddenWords: ['清欢', '悠然'],
    hiddenKeywords: ['岁末', '归雁'],
    settlementRules: chapterSettlementRules.ch2
  },
  {
    id: 'ch3',
    title: '雪夜归人',
    subtitle: '第三章 · 故园之念',
    description: '柴门闻犬吠，风雪夜归人。在茫茫白雪中，那盏微弱的灯火，是心之所向。',
    theme: '归乡',
    backgroundGradient: 'linear-gradient(135deg, #151a2a 0%, #2a2d3d 50%, #1a1a28 100%)',
    accentColor: '#a8c0d4',
    phrases: [
      ...pickRandom(scenePhrases.filter(p => ['初雪', '夜雨', '繁星', '古寺', '白云'].includes(p.text)), 5),
      ...pickRandom(emotionPhrases.filter(p => ['相思', '缱绻', '清欢'].includes(p.text)), 3),
      ...pickRandom(timePhrases.filter(p => ['黎明', '昨夜', '千年'].includes(p.text)), 2),
      ...pickRandom(actionPhrases.filter(p => ['遥望', '凭栏', '回眸', '独坐'].includes(p.text)), 3),
      ...pickRandom(imageryPhrases.filter(p => ['故人', '青灯', '素笺', '旧约'].includes(p.text)), 3),
    ],
    unlocked: false,
    targetPhraseCount: 7,
    hint: '选取7个词句，书写归乡路上的温暖与期盼',
    qualifierWords: ['初雪', '故人', '青灯'],
    forbiddenWords: ['狂喜', '淡泊'],
    hiddenKeywords: ['旧约', '素笺'],
    settlementRules: chapterSettlementRules.ch3
  },
  {
    id: 'ch4',
    title: '江湖夜雨',
    subtitle: '第四章 · 江湖之远',
    description: '桃李春风一杯酒，江湖夜雨十年灯。岁月流转，故人何在？唯有一盏孤灯相伴。',
    theme: '江湖',
    backgroundGradient: 'linear-gradient(135deg, #0f1a1f 0%, #1d2a30 50%, #151a1e 100%)',
    accentColor: '#7a9ea8',
    phrases: [
      ...pickRandom(scenePhrases.filter(p => ['夜雨', '翠竹', '小径', '长河', '古寺'].includes(p.text)), 5),
      ...pickRandom(emotionPhrases.filter(p => ['淡泊', '怅惘', '悲悯'].includes(p.text)), 3),
      ...pickRandom(timePhrases, 3),
      ...pickRandom(actionPhrases.filter(p => ['抚琴', '落笔', '轻吟', '独酌'].includes(p.text)), 3),
      ...pickRandom(imageryPhrases.filter(p => ['锦瑟', '玉笛', '青灯', '残梦'].includes(p.text)), 3),
    ],
    unlocked: false,
    targetPhraseCount: 8,
    hint: '选取8个词句，勾勒江湖夜雨十年的沧桑',
    qualifierWords: ['夜雨', '抚琴', '独酌'],
    forbiddenWords: ['清欢', '悠然'],
    hiddenKeywords: ['玉笛', '残梦'],
    settlementRules: chapterSettlementRules.ch4
  },
  {
    id: 'ch5',
    title: '自由之境',
    subtitle: '终章 · 无拘无束',
    description: '行到水穷处，坐看云起时。打破所有格律，让词语自由生长，创造属于你的诗意天地。',
    theme: '自由',
    backgroundGradient: 'linear-gradient(135deg, #1a0f1e 0%, #2e1a2d 33%, #1a1e2e 66%, #0f1e1a 100%)',
    accentColor: '#c98bc4',
    phrases: [
      ...scenePhrases,
      ...emotionPhrases,
      ...timePhrases,
      ...actionPhrases,
      ...imageryPhrases,
      createPhrase('无涯', 'imagery', 1),
      createPhrase('无我', 'emotion', 1),
      createPhrase('太虚', 'scene', 1),
      createPhrase('忘言', 'action', 1),
    ],
    unlocked: false,
    targetPhraseCount: 10,
    hint: '自由选择词句，不受格律限制，创造独一无二的诗篇',
    qualifierWords: [],
    forbiddenWords: [],
    hiddenKeywords: [],
    settlementRules: chapterSettlementRules.ch5
  }
]

export const chapterSoundscapes: Record<string, ChapterSoundscape> = {
  ch1: {
    droneBase: 130.81,
    droneHarmonic: 196.00,
    droneGain: 0.08,
    harmonicGain: 0.04,
    droneAnimCycle: 8,
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    melodyInterval: 3500,
    melodyAttack: 2,
    melodyDecay: 4,
    melodyPeakGain: 0.04,
    melodySkipChance: 0.3,
    melodyTypes: ['triangle', 'sine'],
    octaveShifts: [0.5, 1],
    pluckFreqMultiplier: 1.5,
    pluckDecay: 0.3,
    successNotes: [523.25, 659.25, 783.99],
    successNoteGap: 120,
    milestoneChime: [523.25, 659.25, 783.99, 1046.50],
    label: '春夜流水'
  },
  ch2: {
    droneBase: 110.00,
    droneHarmonic: 164.81,
    droneGain: 0.07,
    harmonicGain: 0.05,
    droneAnimCycle: 10,
    scale: [220.00, 246.94, 261.63, 329.63, 349.23, 440.00, 493.88, 523.25],
    melodyInterval: 4500,
    melodyAttack: 2.5,
    melodyDecay: 5,
    melodyPeakGain: 0.035,
    melodySkipChance: 0.4,
    melodyTypes: ['sine', 'triangle'],
    octaveShifts: [0.5, 1],
    pluckFreqMultiplier: 1.2,
    pluckDecay: 0.4,
    successNotes: [440.00, 523.25, 659.25],
    successNoteGap: 140,
    milestoneChime: [440.00, 523.25, 659.25, 880.00],
    label: '秋风古道'
  },
  ch3: {
    droneBase: 146.83,
    droneHarmonic: 220.00,
    droneGain: 0.06,
    harmonicGain: 0.03,
    droneAnimCycle: 12,
    scale: [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99],
    melodyInterval: 5000,
    melodyAttack: 3,
    melodyDecay: 6,
    melodyPeakGain: 0.03,
    melodySkipChance: 0.45,
    melodyTypes: ['sine'],
    octaveShifts: [1, 2],
    pluckFreqMultiplier: 1.8,
    pluckDecay: 0.5,
    successNotes: [587.33, 698.46, 880.00],
    successNoteGap: 160,
    milestoneChime: [587.33, 698.46, 880.00, 1174.66],
    label: '雪夜归灯'
  },
  ch4: {
    droneBase: 98.00,
    droneHarmonic: 146.83,
    droneGain: 0.09,
    harmonicGain: 0.06,
    droneAnimCycle: 7,
    scale: [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
    melodyInterval: 3000,
    melodyAttack: 1.5,
    melodyDecay: 3.5,
    melodyPeakGain: 0.045,
    melodySkipChance: 0.25,
    melodyTypes: ['triangle', 'sawtooth'],
    octaveShifts: [0.5, 1],
    pluckFreqMultiplier: 1.0,
    pluckDecay: 0.25,
    successNotes: [392.00, 493.88, 587.33],
    successNoteGap: 100,
    milestoneChime: [392.00, 493.88, 587.33, 783.99],
    label: '夜雨抚琴'
  },
  ch5: {
    droneBase: 164.81,
    droneHarmonic: 246.94,
    droneGain: 0.05,
    harmonicGain: 0.03,
    droneAnimCycle: 14,
    scale: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25, 587.33, 659.25, 739.99],
    melodyInterval: 2800,
    melodyAttack: 2,
    melodyDecay: 5,
    melodyPeakGain: 0.038,
    melodySkipChance: 0.2,
    melodyTypes: ['sine', 'triangle'],
    octaveShifts: [1, 2],
    pluckFreqMultiplier: 2.0,
    pluckDecay: 0.35,
    successNotes: [523.25, 659.25, 783.99, 1046.50],
    successNoteGap: 90,
    milestoneChime: [523.25, 659.25, 783.99, 1046.50, 1318.51],
    label: '太虚幻境'
  }
}

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(ch => ch.id === id)
}
