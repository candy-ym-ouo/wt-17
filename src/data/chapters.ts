import type { Chapter, Phrase } from '@/types'
import {
  scenePhrases, emotionPhrases, timePhrases,
  actionPhrases, imageryPhrases, createPhrase
} from './phrases'

const pickRandom = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
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
    hint: '选取5个词句，构建一幅春夜思念的图景'
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
    hint: '选取6个词句，描绘一段秋日远行的孤寂'
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
    hint: '选取7个词句，书写归乡路上的温暖与期盼'
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
    hint: '选取8个词句，勾勒江湖夜雨十年的沧桑'
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
    hint: '自由选择词句，不受格律限制，创造独一无二的诗篇'
  }
]

export const getChapterById = (id: string): Chapter | undefined => {
  return chapters.find(ch => ch.id === id)
}
