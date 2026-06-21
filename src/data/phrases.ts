import type { Phrase, PhraseCategory } from '@/types'

let phraseIdCounter = 0
const pid = () => `p_${Date.now()}_${++phraseIdCounter}`

export const createPhrase = (text: string, category: PhraseCategory, weight = 1): Phrase => ({
  id: pid(),
  text,
  category,
  position: null,
  rotation: 0,
  isPlaced: false,
  weight
})

export const scenePhrases: Phrase[] = [
  createPhrase('明月', 'scene', 3),
  createPhrase('青山', 'scene', 3),
  createPhrase('流水', 'scene', 3),
  createPhrase('落花', 'scene', 3),
  createPhrase('白云', 'scene', 2),
  createPhrase('清风', 'scene', 2),
  createPhrase('残阳', 'scene', 2),
  createPhrase('孤舟', 'scene', 2),
  createPhrase('垂柳', 'scene', 2),
  createPhrase('寒烟', 'scene', 2),
  createPhrase('翠竹', 'scene', 2),
  createPhrase('小径', 'scene', 1),
  createPhrase('古寺', 'scene', 1),
  createPhrase('长河', 'scene', 1),
  createPhrase('荒原', 'scene', 1),
  createPhrase('繁星', 'scene', 1),
  createPhrase('夜雨', 'scene', 1),
  createPhrase('初雪', 'scene', 1),
]

export const emotionPhrases: Phrase[] = [
  createPhrase('相思', 'emotion', 3),
  createPhrase('离愁', 'emotion', 3),
  createPhrase('怅惘', 'emotion', 2),
  createPhrase('悠然', 'emotion', 2),
  createPhrase('寂寥', 'emotion', 2),
  createPhrase('缱绻', 'emotion', 2),
  createPhrase('惆怅', 'emotion', 2),
  createPhrase('清欢', 'emotion', 2),
  createPhrase('孤苦', 'emotion', 1),
  createPhrase('狂喜', 'emotion', 1),
  createPhrase('悲悯', 'emotion', 1),
  createPhrase('淡泊', 'emotion', 1),
]

export const timePhrases: Phrase[] = [
  createPhrase('千年', 'time', 2),
  createPhrase('一瞬', 'time', 2),
  createPhrase('昨夜', 'time', 2),
  createPhrase('今朝', 'time', 2),
  createPhrase('黄昏', 'time', 3),
  createPhrase('黎明', 'time', 2),
  createPhrase('日暮', 'time', 2),
  createPhrase('岁末', 'time', 1),
  createPhrase('春深', 'time', 1),
  createPhrase('秋凉', 'time', 1),
]

export const actionPhrases: Phrase[] = [
  createPhrase('独坐', 'action', 2),
  createPhrase('遥望', 'action', 2),
  createPhrase('轻吟', 'action', 2),
  createPhrase('独酌', 'action', 2),
  createPhrase('漫步', 'action', 1),
  createPhrase('凝思', 'action', 2),
  createPhrase('落笔', 'action', 1),
  createPhrase('抚琴', 'action', 1),
  createPhrase('凭栏', 'action', 2),
  createPhrase('低眉', 'action', 1),
  createPhrase('长叹', 'action', 1),
  createPhrase('回眸', 'action', 2),
]

export const imageryPhrases: Phrase[] = [
  createPhrase('故人', 'imagery', 3),
  createPhrase('归雁', 'imagery', 2),
  createPhrase('寒梅', 'imagery', 2),
  createPhrase('浊酒', 'imagery', 2),
  createPhrase('残梦', 'imagery', 2),
  createPhrase('旧约', 'imagery', 2),
  createPhrase('素笺', 'imagery', 1),
  createPhrase('锦瑟', 'imagery', 1),
  createPhrase('玉笛', 'imagery', 1),
  createPhrase('青灯', 'imagery', 2),
  createPhrase('古道', 'imagery', 2),
  createPhrase('西风', 'imagery', 2),
]

export const getAllPhrases = (): Phrase[] => [
  ...scenePhrases,
  ...emotionPhrases,
  ...timePhrases,
  ...actionPhrases,
  ...imageryPhrases,
]

export const categoryLabels: Record<PhraseCategory, string> = {
  scene: '景物',
  emotion: '情感',
  time: '时间',
  action: '动作',
  imagery: '意象'
}

export const categoryColors: Record<PhraseCategory, string> = {
  scene: '#5b7a8c',
  emotion: '#8b4557',
  time: '#c9a86c',
  action: '#6b8e6b',
  imagery: '#7a5b8c'
}
