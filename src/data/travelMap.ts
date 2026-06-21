import type { MapNode, StoryEvent, Achievement, DropEvent } from '@/types'

export const mapNodes: MapNode[] = [
  {
    id: 'node_ch1',
    chapterId: 'ch1',
    x: 10,
    y: 50,
    label: '春江花月',
    type: 'chapter',
    icon: '🌸',
    accentColor: '#c9a86c',
    eventId: 'event_ch1_unlock'
  },
  {
    id: 'node_ch1_event',
    chapterId: 'ch1',
    x: 22,
    y: 35,
    label: '月下邂逅',
    type: 'event',
    icon: '🌙',
    accentColor: '#d4a5a0',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch1', minScore: 60 }
    },
    eventId: 'event_ch1_story'
  },
  {
    id: 'node_ch1_milestone',
    chapterId: 'ch1',
    x: 22,
    y: 65,
    label: '春夜探花',
    type: 'milestone',
    icon: '🏆',
    accentColor: '#c9a86c',
    unlockCondition: {
      type: 'score_threshold',
      params: { chapterId: 'ch1', minScore: 75 }
    },
    rewards: [
      { type: 'phrase', params: { phraseTexts: ['月下独酌', '花前月下'] } }
    ]
  },
  {
    id: 'node_ch2',
    chapterId: 'ch2',
    x: 35,
    y: 50,
    label: '秋山孤旅',
    type: 'chapter',
    icon: '🍂',
    accentColor: '#d4a574',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch1', minScore: 60 }
    },
    eventId: 'event_ch2_unlock'
  },
  {
    id: 'node_ch2_event',
    chapterId: 'ch2',
    x: 47,
    y: 30,
    label: '古道西风',
    type: 'event',
    icon: '🏔️',
    accentColor: '#a89070',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch2', minScore: 60 }
    },
    eventId: 'event_ch2_story'
  },
  {
    id: 'node_ch2_branch',
    chapterId: 'ch2',
    x: 47,
    y: 70,
    label: '羁旅之思',
    type: 'branch',
    icon: '✉️',
    accentColor: '#d4a574',
    unlockCondition: {
      type: 'quest_complete',
      params: { questId: 'sq_ch2_1' }
    },
    rewards: [
      { type: 'phrase', params: { phraseTexts: ['乡书何处', '归雁洛阳'] } }
    ]
  },
  {
    id: 'node_ch3',
    chapterId: 'ch3',
    x: 60,
    y: 50,
    label: '雪夜归人',
    type: 'chapter',
    icon: '❄️',
    accentColor: '#a8c0d4',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch2', minScore: 60 }
    },
    eventId: 'event_ch3_unlock'
  },
  {
    id: 'node_ch3_event',
    chapterId: 'ch3',
    x: 72,
    y: 35,
    label: '故人来访',
    type: 'event',
    icon: '🏮',
    accentColor: '#d4a0a0',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch3', minScore: 60 }
    },
    eventId: 'event_ch3_story',
    rewards: [
      { type: 'phrase', params: { phraseTexts: ['故人具鸡黍', '把酒话桑麻'] } }
    ]
  },
  {
    id: 'node_ch3_milestone',
    chapterId: 'ch3',
    x: 72,
    y: 65,
    label: '风雪夜归',
    type: 'milestone',
    icon: '👑',
    accentColor: '#a8c0d4',
    unlockCondition: {
      type: 'score_threshold',
      params: { chapterId: 'ch3', minScore: 90 }
    },
    rewards: [
      { type: 'title', params: { title: '雪夜归人' } }
    ]
  },
  {
    id: 'node_ch4',
    chapterId: 'ch4',
    x: 85,
    y: 50,
    label: '江湖夜雨',
    type: 'chapter',
    icon: '⚔️',
    accentColor: '#7a9ea8',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch3', minScore: 60 }
    },
    eventId: 'event_ch4_unlock'
  },
  {
    id: 'node_ch4_event',
    chapterId: 'ch4',
    x: 95,
    y: 30,
    label: '十年一梦',
    type: 'event',
    icon: '🎵',
    accentColor: '#8a9ea8',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch4', minScore: 60 }
    },
    eventId: 'event_ch4_story'
  },
  {
    id: 'node_ch4_branch',
    chapterId: 'ch4',
    x: 95,
    y: 70,
    label: '桃李春风',
    type: 'branch',
    icon: '🍃',
    accentColor: '#7a9ea8',
    unlockCondition: {
      type: 'quest_complete',
      params: { questId: 'sq_ch4_2' }
    },
    rewards: [
      { type: 'phrase', params: { phraseTexts: ['桃李春风', '江湖夜雨'] } }
    ]
  },
  {
    id: 'node_ch5',
    chapterId: 'ch5',
    x: 100,
    y: 50,
    label: '自由之境',
    type: 'chapter',
    icon: '✨',
    accentColor: '#c98bc4',
    unlockCondition: {
      type: 'chapter_complete',
      params: { chapterId: 'ch4', minScore: 60 }
    },
    eventId: 'event_ch5_unlock'
  },
  {
    id: 'node_final',
    chapterId: 'ch5',
    x: 110,
    y: 50,
    label: '诗词之巅',
    type: 'milestone',
    icon: '🏛️',
    accentColor: '#c98bc4',
    unlockCondition: {
      type: 'phrase_collection',
      params: { minCount: 60 }
    },
    rewards: [
      { type: 'title', params: { title: '诗词宗师' } },
      { type: 'phrase', params: { phraseTexts: ['随心所欲', '不逾矩'] } }
    ]
  }
]

export const storyEvents: StoryEvent[] = [
  {
    id: 'event_ch1_unlock',
    chapterId: 'ch1',
    triggerType: 'chapter_unlock',
    triggerParams: { chapterId: 'ch1' },
    title: '春夜初临',
    character: '诗仙',
    content: [
      '春江潮水连海平，海上明月共潮生。',
      '年轻的旅人啊，欢迎来到诗词的世界。',
      '今夜月色正好，何不对着这春江花月，写下你的第一首诗？',
      '记住，诗词之道，在于心诚，在于意境。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #1a2a3d 100%)',
    accentColor: '#c9a86c',
    choices: [
      {
        id: 'accept',
        text: '愿闻其详',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['春江潮水', '海上明月'] }
        }
      },
      {
        id: 'curious',
        text: '何谓意境？',
        consequence: {
          type: 'score_boost',
          params: { dimension: 'imagery', boost: 0.03 }
        }
      }
    ]
  },
  {
    id: 'event_ch1_story',
    chapterId: 'ch1',
    triggerType: 'chapter_complete',
    triggerParams: { chapterId: 'ch1', minScore: 60 },
    title: '月下邂逅',
    character: '神秘女子',
    content: [
      '月色如水，你独立于春江之畔。',
      '忽闻远处有琴声悠扬，循声而去，见一女子独坐月下，抚琴而歌。',
      '「公子好才情，方才那首《春江花月夜》，竟让这月色都增添了几分韵味。」',
      '她抬眸浅笑，似有深意：「若能在诗中同时融入明月与独酌，或许能引出一段佳话。」'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #1a2a3d 100%)',
    accentColor: '#d4a5a0',
    choices: [
      {
        id: 'accept',
        text: '愿请教姑娘芳名',
        consequence: {
          type: 'quest_trigger',
          params: { questId: 'sq_ch1_1' }
        }
      },
      {
        id: 'poem',
        text: '吟诗作对，岂容错过',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['月下独酌', '对影三人'] }
        }
      }
    ]
  },
  {
    id: 'event_ch2_unlock',
    chapterId: 'ch2',
    triggerType: 'chapter_unlock',
    triggerParams: { chapterId: 'ch2' },
    title: '秋意渐浓',
    character: '老旅人',
    content: [
      '春夜虽美，但若只知春夜之温柔，便无法体会诗词之全貌。',
      '看那远方的古道，西风正紧，残阳如血。',
      '羁旅之愁，是诗词永恒的主题。',
      '去吧，去感受那份孤寂，那份对故乡的思念。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a1520 0%, #3d2817 50%, #1a2018 100%)',
    accentColor: '#d4a574',
    choices: [
      {
        id: 'accept',
        text: '我愿踏上这旅途',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['古道西风', '枯藤老树'] }
        }
      },
      {
        id: 'question',
        text: '为何要写愁绪？',
        consequence: {
          type: 'score_boost',
          params: { dimension: 'emotion', boost: 0.03 }
        }
      }
    ]
  },
  {
    id: 'event_ch2_story',
    chapterId: 'ch2',
    triggerType: 'chapter_complete',
    triggerParams: { chapterId: 'ch2', minScore: 60 },
    title: '古道奇遇',
    character: '落魄书生',
    content: [
      '你行走在秋日的古道上，黄叶纷飞，西风猎猎。',
      '忽见一男子坐于路旁，衣衫褴褛，却目光如炬。',
      '「兄台的诗，我听到了。那份羁旅之愁，真是入木三分啊。」',
      '他叹道：「想我当年，也是意气风发，可如今... 罢了，若你能将古道、西风、归雁融入一诗，我便送你一场造化。」'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a1520 0%, #3d2817 50%, #1a2018 100%)',
    accentColor: '#a89070',
    choices: [
      {
        id: 'help',
        text: '先生请讲，我尽力而为',
        consequence: {
          type: 'quest_trigger',
          params: { questId: 'sq_ch2_1' }
        }
      },
      {
        id: 'sympathy',
        text: '同是天涯沦落人',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['断肠人在天涯', '瘦马'] }
        }
      }
    ]
  },
  {
    id: 'event_ch3_unlock',
    chapterId: 'ch3',
    triggerType: 'chapter_unlock',
    triggerParams: { chapterId: 'ch3' },
    title: '雪夜将至',
    character: '诗佛',
    content: [
      '秋意已尽，寒冬降临。',
      '看那漫天飞雪，覆盖了山川，却盖不住归乡的心。',
      '柴门闻犬吠，风雪夜归人。',
      '这份温暖，这份期盼，是诗词中最动人的情感。',
      '去吧，去寻找那盏为你而亮的灯火。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #151a2a 0%, #2a2d3d 50%, #1a1a28 100%)',
    accentColor: '#a8c0d4',
    choices: [
      {
        id: 'accept',
        text: '我已感受到那份温暖',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['柴门', '犬吠'] }
        }
      },
      {
        id: 'emotion',
        text: '归乡之情，人皆有之',
        consequence: {
          type: 'score_boost',
          params: { dimension: 'themeMatch', boost: 0.03 }
        }
      }
    ]
  },
  {
    id: 'event_ch3_story',
    chapterId: 'ch3',
    triggerType: 'chapter_complete',
    triggerParams: { chapterId: 'ch3', minScore: 60 },
    title: '故人来访',
    character: '故友',
    content: [
      '雪夜，你独坐窗前，看着窗外纷纷扬扬的雪花。',
      '忽然，门外传来了敲门声。',
      '「是我，你果然在这里。」',
      '开门，竟是多年未见的故友，满身风雪，却笑意盎然。',
      '「我就知道，你一定会写出好诗的。来，今日我们围炉夜话，不醉不归。」'
    ],
    backgroundGradient: 'linear-gradient(135deg, #151a2a 0%, #2a2d3d 50%, #1a1a28 100%)',
    accentColor: '#d4a0a0',
    choices: [
      {
        id: 'happy',
        text: '故人来访，不亦乐乎',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['围炉夜话', '剪烛西窗'] }
        }
      },
      {
        id: 'emotional',
        text: '这些年，你过得可好？',
        consequence: {
          type: 'quest_trigger',
          params: { questId: 'sq_ch3_1' }
        }
      }
    ]
  },
  {
    id: 'event_ch4_unlock',
    chapterId: 'ch4',
    triggerType: 'chapter_unlock',
    triggerParams: { chapterId: 'ch4' },
    title: '江湖路远',
    character: '剑侠',
    content: [
      '桃李春风一杯酒，江湖夜雨十年灯。',
      '年轻的诗人啊，你已走过了春、秋、冬，现在，该去闯荡江湖了。',
      '江湖之大，无奇不有。有快意恩仇，有离愁别绪，有十年磨一剑的执着。',
      '带上你的笔，去书写属于你的江湖传说吧。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #0f1a1f 0%, #1d2a30 50%, #151a1e 100%)',
    accentColor: '#7a9ea8',
    choices: [
      {
        id: 'accept',
        text: '愿持手中笔，写尽江湖事',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['桃李春风', '一杯酒'] }
        }
      },
      {
        id: 'question',
        text: '何谓江湖？',
        consequence: {
          type: 'score_boost',
          params: { dimension: 'rhythm', boost: 0.03 }
        }
      }
    ]
  },
  {
    id: 'event_ch4_story',
    chapterId: 'ch4',
    triggerType: 'chapter_complete',
    triggerParams: { chapterId: 'ch4', minScore: 60 },
    title: '夜雨听琴',
    character: '神秘琴师',
    content: [
      '夜雨淅沥，你独坐客栈，听着窗外的雨声。',
      '忽然，一缕琴音从隔壁传来，如泣如诉，似有无限心事。',
      '你循声而去，见一男子戴斗笠，披蓑衣，正抚琴而歌。',
      '「十年了... 没想到还能有人听懂这琴音。」',
      '他抬头，目光深邃：「你可愿听我讲一个关于江湖的故事？」'
    ],
    backgroundGradient: 'linear-gradient(135deg, #0f1a1f 0%, #1d2a30 50%, #151a1e 100%)',
    accentColor: '#8a9ea8',
    choices: [
      {
        id: 'listen',
        text: '愿闻其详',
        consequence: {
          type: 'quest_trigger',
          params: { questId: 'sq_ch4_1' }
        }
      },
      {
        id: 'play',
        text: '琴音美妙，我愿和诗一首',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['锦瑟', '五十弦'] }
        }
      }
    ]
  },
  {
    id: 'event_ch5_unlock',
    chapterId: 'ch5',
    triggerType: 'chapter_unlock',
    triggerParams: { chapterId: 'ch5' },
    title: '自由之境',
    character: '诗圣',
    content: [
      '恭喜你，年轻的旅人。',
      '你已走过了春、秋、冬、江湖，领略了诗词百态。',
      '现在，你来到了最高的境界——自由之境。',
      '在这里，没有格律的束缚，没有题材的限制。',
      '你可以随心所欲，书写任何你想写的东西。',
      '记住：文章本天成，妙手偶得之。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a0f1e 0%, #2e1a2d 33%, #1a1e2e 66%, #0f1e1a 100%)',
    accentColor: '#c98bc4',
    choices: [
      {
        id: 'accept',
        text: '感谢前辈指点',
        consequence: {
          type: 'phrase_unlock',
          params: { phraseTexts: ['大道至简', '大象无形'] }
        }
      },
      {
        id: 'enlightened',
        text: '我明白了，随心所欲不逾矩',
        consequence: {
          type: 'title',
          params: { title: '自由行者' }
        }
      }
    ]
  },
  {
    id: 'event_achievement_collector',
    chapterId: 'ch1',
    triggerType: 'phrase_collect',
    triggerParams: { minCount: 20 },
    title: '词海初涉',
    content: [
      '你已收集了20个不同的词句，初窥诗词殿堂之门径。',
      '继续努力，还有更多的佳句等待你去发现。'
    ],
    backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #1a2a3d 100%)',
    accentColor: '#6b8e6b',
    choices: [
      {
        id: 'continue',
        text: '继续探索',
        consequence: {
          type: 'score_boost',
          params: { dimension: 'imagery', boost: 0.02 }
        }
      }
    ]
  }
]

export const achievements: Achievement[] = [
  {
    id: 'ach_chapter_1',
    chapterId: 'ch1',
    category: 'chapter',
    title: '初入诗门',
    description: '完成第一章《春江花月》，开启诗词之旅。',
    icon: '🌸',
    rarity: 'bronze',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch1', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch1', minScore: 60 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['初窥门径'] } }
    ],
    accentColor: '#c9a86c'
  },
  {
    id: 'ach_chapter_2',
    chapterId: 'ch2',
    category: 'chapter',
    title: '秋意渐浓',
    description: '完成第二章《秋山孤旅》，体会羁旅之愁。',
    icon: '🍂',
    rarity: 'bronze',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch2', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch2', minScore: 60 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['秋意正浓'] } }
    ],
    accentColor: '#d4a574'
  },
  {
    id: 'ach_chapter_3',
    chapterId: 'ch3',
    category: 'chapter',
    title: '归心似箭',
    description: '完成第三章《雪夜归人》，感受归乡之暖。',
    icon: '❄️',
    rarity: 'bronze',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch3', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch3', minScore: 60 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['归心似箭'] } }
    ],
    accentColor: '#a8c0d4'
  },
  {
    id: 'ach_chapter_4',
    chapterId: 'ch4',
    category: 'chapter',
    title: '江湖过客',
    description: '完成第四章《江湖夜雨》，体验江湖之远。',
    icon: '⚔️',
    rarity: 'bronze',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch4', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch4', minScore: 60 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['江湖过客'] } }
    ],
    accentColor: '#7a9ea8'
  },
  {
    id: 'ach_chapter_5',
    chapterId: 'ch5',
    category: 'chapter',
    title: '自由行者',
    description: '完成终章《自由之境》，臻于化境。',
    icon: '✨',
    rarity: 'silver',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: 'ch5', minCount: 1 } }
    ],
    completeConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch5', minScore: 60 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '自由行者' } }
    ],
    accentColor: '#c98bc4'
  },
  {
    id: 'ach_exploration_1',
    chapterId: 'ch1',
    category: 'exploration',
    title: '游历四方',
    description: '解锁所有章节，游历诗词世界的每一个角落。',
    icon: '🗺️',
    rarity: 'silver',
    unlockConditions: [
      { type: 'chapter_count', params: { minCount: 3 } }
    ],
    completeConditions: [
      { type: 'chapter_count', params: { minCount: 5 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['游历四方', '足迹遍天下'] } },
      { type: 'score_weight_boost', params: { dimension: 'themeMatch', boost: 0.05 } }
    ],
    accentColor: '#6b8e6b'
  },
  {
    id: 'ach_exploration_2',
    chapterId: 'ch3',
    category: 'exploration',
    title: '地图大师',
    description: '在游历地图中访问10个以上的节点。',
    icon: '📍',
    rarity: 'gold',
    unlockConditions: [
      { type: 'chapter_count', params: { minCount: 4 } }
    ],
    completeConditions: [
      { type: 'composition_count', params: { chapterId: '__all__', minCount: 15 } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '地图大师' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['了如指掌', '如数家珍'] } }
    ],
    accentColor: '#c9a86c'
  },
  {
    id: 'ach_score_perfect',
    chapterId: 'ch5',
    category: 'score',
    title: '完美无瑕',
    description: '在任意章节获得95分以上的完美评价。',
    icon: '💎',
    rarity: 'platinum',
    unlockConditions: [
      { type: 'score_threshold', params: { chapterId: 'ch1', minScore: 85 } }
    ],
    completeConditions: [
      { type: 'perfect_clear', params: { chapterId: 'ch1' } }
    ],
    rewards: [
      { type: 'title_reward', params: { title: '完美诗人' } },
      { type: 'phrase_unlock', params: { phraseTexts: ['完美无瑕', '天衣无缝'] } }
    ],
    accentColor: '#e5e4e2',
    isSecret: true
  },
  {
    id: 'ach_combo_master',
    chapterId: 'ch5',
    category: 'combo',
    title: '词库大师',
    description: '在一首诗中同时使用8个以上不同的词句。',
    icon: '🎯',
    rarity: 'gold',
    unlockConditions: [
      { type: 'composition_count', params: { chapterId: '__all__', minCount: 10 } }
    ],
    completeConditions: [
      { type: 'category_diversity', params: { minCategories: 5 } }
    ],
    rewards: [
      { type: 'phrase_unlock', params: { phraseTexts: ['融会贯通', '信手拈来'] } }
    ],
    accentColor: '#c98bc4'
  }
]

export const dropEvents: DropEvent[] = [
  {
    id: 'drop_ch1_start',
    chapterId: 'ch1',
    triggerType: 'chapter_start',
    triggerParams: { chapterId: 'ch1' },
    phraseTexts: ['明月', '落花', '清风', '垂柳', '流水', '春深', '黄昏', '昨夜'],
    rarityBoost: { common: 0.2 },
    isExclusive: false,
    description: '春夜词库初启'
  },
  {
    id: 'drop_ch1_milestone_75',
    chapterId: 'ch1',
    triggerType: 'score_milestone',
    triggerParams: { chapterId: 'ch1', minScore: 75 },
    phraseTexts: ['月下独酌', '花前月下', '春意盎然'],
    rarityBoost: { rare: 0.3, epic: 0.1 },
    isExclusive: true,
    description: '春夜初探奖励'
  },
  {
    id: 'drop_ch2_start',
    chapterId: 'ch2',
    triggerType: 'chapter_start',
    triggerParams: { chapterId: 'ch2' },
    phraseTexts: ['青山', '残阳', '荒原', '寒烟', '孤舟', '日暮', '秋凉', '岁末'],
    rarityBoost: { common: 0.2 },
    isExclusive: false,
    description: '秋山词库初启'
  },
  {
    id: 'drop_ch2_quest_complete',
    chapterId: 'ch2',
    triggerType: 'quest_complete',
    triggerParams: { questId: 'sq_ch2_1' },
    phraseTexts: ['断肠人在天涯', '瘦马', '乡书何处', '归雁洛阳'],
    rarityBoost: { epic: 0.2, legendary: 0.05 },
    isExclusive: true,
    description: '古道西风奖励'
  },
  {
    id: 'drop_ch3_start',
    chapterId: 'ch3',
    triggerType: 'chapter_start',
    triggerParams: { chapterId: 'ch3' },
    phraseTexts: ['初雪', '夜雨', '繁星', '古寺', '白云', '黎明', '昨夜', '千年'],
    rarityBoost: { common: 0.2 },
    isExclusive: false,
    description: '雪夜词库初启'
  },
  {
    id: 'drop_ch3_milestone_90',
    chapterId: 'ch3',
    triggerType: 'score_milestone',
    triggerParams: { chapterId: 'ch3', minScore: 90 },
    phraseTexts: ['蓦然回首', '那人却在', '灯火阑珊'],
    rarityBoost: { legendary: 0.15 },
    isExclusive: true,
    description: '雪夜状元奖励'
  },
  {
    id: 'drop_ch4_start',
    chapterId: 'ch4',
    triggerType: 'chapter_start',
    triggerParams: { chapterId: 'ch4' },
    phraseTexts: ['夜雨', '翠竹', '小径', '长河', '古寺', '淡泊', '怅惘', '悲悯'],
    rarityBoost: { common: 0.2 },
    isExclusive: false,
    description: '江湖词库初启'
  },
  {
    id: 'drop_ch5_start',
    chapterId: 'ch5',
    triggerType: 'chapter_start',
    triggerParams: { chapterId: 'ch5' },
    phraseTexts: ['无涯', '无我', '太虚', '忘言', '随心所欲', '不逾矩'],
    rarityBoost: { epic: 0.3, legendary: 0.1 },
    isExclusive: true,
    description: '自由之境专属词库'
  },
  {
    id: 'drop_story_choice',
    chapterId: 'ch1',
    triggerType: 'story_choice',
    triggerParams: { eventId: 'event_ch1_story', choiceId: 'poem' },
    phraseTexts: ['月下独酌', '对影三人'],
    rarityBoost: { legendary: 0.2 },
    isExclusive: true,
    description: '剧情选择奖励'
  }
]

export const getMapNodeById = (id: string): MapNode | undefined => {
  return mapNodes.find(n => n.id === id)
}

export const getNodesByChapter = (chapterId: string): MapNode[] => {
  return mapNodes.filter(n => n.chapterId === chapterId)
}

export const getStoryEventById = (id: string): StoryEvent | undefined => {
  return storyEvents.find(e => e.id === id)
}

export const getEventsByTrigger = (
  triggerType: StoryEvent['triggerType'],
  params: Record<string, any>
): StoryEvent[] => {
  return storyEvents.filter(event => {
    if (event.triggerType !== triggerType) return false
    for (const [key, value] of Object.entries(params)) {
      if (event.triggerParams[key] !== value) return false
    }
    return true
  })
}

export const getAchievementById = (id: string): Achievement | undefined => {
  return achievements.find(a => a.id === id)
}

export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
  return achievements.filter(a => a.category === category)
}

export const getAchievementsByChapter = (chapterId: string): Achievement[] => {
  return achievements.filter(a => a.chapterId === chapterId)
}

export const getDropEventById = (id: string): DropEvent | undefined => {
  return dropEvents.find(d => d.id === id)
}

export const getDropEventsByTrigger = (
  triggerType: DropEvent['triggerType'],
  params: Record<string, any>
): DropEvent[] => {
  return dropEvents.filter(drop => {
    if (drop.triggerType !== triggerType) return false
    for (const [key, value] of Object.entries(params)) {
      if (drop.triggerParams[key] !== value) return false
    }
    return true
  })
}

export const getMapPath = (): MapNode[] => {
  return [...mapNodes].sort((a, b) => a.x - b.x)
}
