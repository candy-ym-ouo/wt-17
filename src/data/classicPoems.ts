import type { ClassicPoem } from '@/types'

export const classicPoems: ClassicPoem[] = [
  {
    id: 'cp001',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    type: '诗',
    content: [
      '床前明月光，',
      '疑是地上霜。',
      '举头望明月，',
      '低头思故乡。'
    ],
    background: '这首诗写于唐玄宗开元十四年（726年）九月十五日的扬州旅舍，时李白26岁。同时同地所作的还有《秋夕旅怀》。',
    translation: '明亮的月光洒在窗户纸上，好像地上泛起了一层白霜。我抬起头来，看那天窗外空中的明月，不由得低头沉思，想起远方的家乡。',
    coreImageries: ['明月', '霜', '床前', '故乡'],
    emotions: ['思乡', '惆怅', '孤寂'],
    themes: ['思乡怀人', '月夜抒怀'],
    keywords: ['明月', '故乡', '霜', '举头', '低头', '静夜', '相思'],
    difficulty: '入门',
    targetPhraseCount: 5,
    accentColor: '#7a9ea8',
    icon: '🌙'
  },
  {
    id: 'cp002',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    type: '诗',
    content: [
      '春眠不觉晓，',
      '处处闻啼鸟。',
      '夜来风雨声，',
      '花落知多少。'
    ],
    background: '这首诗是唐代诗人孟浩然的作品。孟浩然早年隐居鹿门山，后入长安谋求官职，考进士不中，还归故乡。《春晓》即是他隐居鹿门山时所作。',
    translation: '春日里贪睡不知不觉天就亮了，到处可以听见小鸟的鸣叫声。回想昨夜的阵阵风雨声，吹落了多少芳香的春花。',
    coreImageries: ['啼鸟', '春花', '风雨', '春眠'],
    emotions: ['惜春', '悠然', '淡淡惆怅'],
    themes: ['春日田园', '惜春情怀'],
    keywords: ['春眠', '啼鸟', '风雨', '花落', '春晓', '春深', '清欢'],
    difficulty: '入门',
    targetPhraseCount: 5,
    accentColor: '#7ca97c',
    icon: '🌸'
  },
  {
    id: 'cp003',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    type: '诗',
    content: [
      '白日依山尽，',
      '黄河入海流。',
      '欲穷千里目，',
      '更上一层楼。'
    ],
    background: '此诗是唐代诗人王之涣仅存的六首绝句之一。一说，作者王之涣早年及第，曾任过冀州衡水（今河北衡水）县的主薄，不久因遭人诬陷而罢官，不到三十岁的王之涣从此过上了访友漫游的生活。写这首诗的时候，王之涣只有三十五岁。',
    translation: '夕阳依傍着西山慢慢地沉没，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。',
    coreImageries: ['白日', '黄河', '远山', '高楼'],
    emotions: ['豪迈', '进取', '壮阔'],
    themes: ['登高望远', '抒怀言志'],
    keywords: ['白日', '黄河', '远山', '高楼', '奔流', '云海', '壮阔'],
    difficulty: '进阶',
    targetPhraseCount: 6,
    accentColor: '#c9a86c',
    icon: '🏔️'
  },
  {
    id: 'cp004',
    title: '相思',
    author: '王维',
    dynasty: '唐',
    type: '诗',
    content: [
      '红豆生南国，',
      '春来发几枝。',
      '愿君多采撷，',
      '此物最相思。'
    ],
    background: '此诗一作《江上赠李龟年》，可见诗中抒写的是眷念朋友的情绪。这是借咏物而寄相思的诗，是眷怀友人之作。起句因物起兴，语虽单纯，却富于想象；接着以设问寄语，意味深长地寄托情思。',
    translation: '红豆生长在阳光明媚的南方，每逢春天不知长多少新枝。希望你多采摘一些红豆，它最能够引起人们的思念之情。',
    coreImageries: ['红豆', '南国', '春枝'],
    emotions: ['相思', '眷恋', '深情'],
    themes: ['相思怀人', '咏物寄情'],
    keywords: ['红豆', '南国', '相思', '眷恋', '春枝', '深情', '缱绻'],
    difficulty: '进阶',
    targetPhraseCount: 5,
    accentColor: '#c56b6b',
    icon: '🫘'
  },
  {
    id: 'cp005',
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    type: '诗',
    content: [
      '千山鸟飞绝，',
      '万径人踪灭。',
      '孤舟蓑笠翁，',
      '独钓寒江雪。'
    ],
    background: '此诗作于柳宗元谪居永州期间（公元805年—815年）。唐顺宗永贞元年，参加王叔文为首的政治革新运动。革新失败后被贬为邵州刺史，行未半路，又被加贬为永州司马。在永州，精神上受到沉重打击压抑，就借描写山水景物，借歌咏隐居在山水之间的渔翁，来寄托自己清高而孤傲的情感。',
    translation: '所有的山上，飞鸟的身影已经绝迹，所有道路都不见人的踪迹。江面孤舟上，一位披戴着蓑笠的老翁，独自在大雪覆盖的寒冷江面上垂钓。',
    coreImageries: ['飞雪', '孤舟', '寒江', '蓑笠翁', '荒山'],
    emotions: ['孤傲', '清冷', '超脱'],
    themes: ['山水隐逸', '孤独抒怀'],
    keywords: ['飞雪', '孤舟', '寒江', '蓑笠', '荒山', '独钓', '清绝', '寂寥'],
    difficulty: '精通',
    targetPhraseCount: 6,
    accentColor: '#a8a498',
    icon: '🎣'
  },
  {
    id: 'cp006',
    title: '水调歌头·明月几时有',
    author: '苏轼',
    dynasty: '宋',
    type: '词',
    content: [
      '明月几时有？把酒问青天。',
      '不知天上宫阙，今夕是何年。',
      '我欲乘风归去，又恐琼楼玉宇，高处不胜寒。',
      '起舞弄清影，何似在人间。',
      '转朱阁，低绮户，照无眠。',
      '不应有恨，何事长向别时圆？',
      '人有悲欢离合，月有阴晴圆缺，此事古难全。',
      '但愿人长久，千里共婵娟。'
    ],
    background: '这首词是宋神宗熙宁九年（1076）中秋苏轼在密州时所作。词前的小序交待了写词的过程："丙辰中秋，欢饮达旦，大醉，作此篇，兼怀子由。"',
    translation: '明月从什么时候才开始出现的？我端起酒杯遥问苍天。不知道在天上的宫殿，何年何月。我想要乘御清风回到天上，又恐怕在美玉砌成的楼宇，受不住高耸九天的寒冷。翩翩起舞玩赏着月下清影，哪像是在人间。',
    coreImageries: ['明月', '青天', '琼楼', '婵娟', '朱阁', '清影'],
    emotions: ['思念', '豁达', '哲思'],
    themes: ['中秋咏月', '思亲抒怀', '人生哲思'],
    keywords: ['明月', '青天', '琼楼', '婵娟', '清影', '把酒', '悲欢', '离合', '玉宇', '乘风'],
    difficulty: '精通',
    targetPhraseCount: 8,
    accentColor: '#9b59b6',
    icon: '🍶'
  },
  {
    id: 'cp007',
    title: '声声慢·寻寻觅觅',
    author: '李清照',
    dynasty: '宋',
    type: '词',
    content: [
      '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。',
      '乍暖还寒时候，最难将息。',
      '三杯两盏淡酒，怎敌他、晚来风急！',
      '雁过也，正伤心，却是旧时相识。',
      '满地黄花堆积，憔悴损，如今有谁堪摘？',
      '守着窗儿，独自怎生得黑！',
      '梧桐更兼细雨，到黄昏、点点滴滴。',
      '这次第，怎一个愁字了得！'
    ],
    background: '此词是李清照后期的作品，作于南渡以后，具体写作时间待考。多数学者认为是作者晚年时期的作品，也有人认为是作者中年时期所作。',
    translation: '苦苦地寻寻觅觅，却只见冷冷清清，怎不让人凄惨悲戚。乍暖还寒的时节，最难保养休息。喝三杯两杯淡酒，怎么能抵得住早晨的寒风急袭？',
    coreImageries: ['黄花', '梧桐', '细雨', '黄昏', '归雁', '淡酒'],
    emotions: ['悲愁', '孤寂', '凄怆'],
    themes: ['闺怨秋思', '亡国之痛'],
    keywords: ['黄花', '梧桐', '细雨', '黄昏', '归雁', '淡酒', '凄清', '愁绪', '孤寂', '寒秋'],
    difficulty: '大师',
    targetPhraseCount: 8,
    accentColor: '#c9a86c',
    icon: '🍂'
  },
  {
    id: 'cp008',
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    type: '诗',
    content: [
      '日照香炉生紫烟，',
      '遥看瀑布挂前川。',
      '飞流直下三千尺，',
      '疑是银河落九天。'
    ],
    background: '这首诗是李白出游金陵途中初游庐山时所作。李白一生好入名山游，他在庐山的香炉峰前，遥望瀑布，心潮澎湃，写出了这首千古绝唱。',
    translation: '香炉峰在阳光的照射下生起紫色烟霞，从远处看去瀑布好似白色绢绸悬挂山前。高崖上飞腾直落的瀑布好像有几千尺，令人怀疑是银河从天上泻落到人间。',
    coreImageries: ['香炉', '紫烟', '瀑布', '银河', '飞流', '山川'],
    emotions: ['豪放', '惊叹', '飘逸'],
    themes: ['山水田园', '壮景抒怀'],
    keywords: ['紫烟', '瀑布', '银河', '飞流', '山川', '云烟', '壮阔', '日照', '翠峰'],
    difficulty: '进阶',
    targetPhraseCount: 6,
    accentColor: '#7a9ea8',
    icon: '💧'
  },
  {
    id: 'cp009',
    title: '送杜少府之任蜀州',
    author: '王勃',
    dynasty: '唐',
    type: '诗',
    content: [
      '城阙辅三秦，风烟望五津。',
      '与君离别意，同是宦游人。',
      '海内存知己，天涯若比邻。',
      '无为在歧路，儿女共沾巾。'
    ],
    background: '《送杜少府之任蜀州》是王勃在长安的时候写的。"少府"是唐代对县尉的通称，这位姓杜的少府将到四川去做官，王勃在长安相送，临别时赠送给他这首送别诗。',
    translation: '三秦之地护卫着巍巍长安，透过那风云烟雾遥望着蜀川。和你离别心中怀着无限情意，因为我们同是在宦海中浮沉。',
    coreImageries: ['城阙', '风烟', '歧路', '天涯', '津渡'],
    emotions: ['豁达', '惜别', '豪情'],
    themes: ['送别怀人', '宦游感慨'],
    keywords: ['风烟', '歧路', '天涯', '知己', '离别', '津渡', '城阙', '山川', '宦游', '比邻'],
    difficulty: '精通',
    targetPhraseCount: 7,
    accentColor: '#7ca97c',
    icon: '🛤️'
  },
  {
    id: 'cp010',
    title: '锦瑟',
    author: '李商隐',
    dynasty: '唐',
    type: '诗',
    content: [
      '锦瑟无端五十弦，一弦一柱思华年。',
      '庄生晓梦迷蝴蝶，望帝春心托杜鹃。',
      '沧海月明珠有泪，蓝田日暖玉生烟。',
      '此情可待成追忆，只是当时已惘然。'
    ],
    background: '《锦瑟》是李商隐的代表作，爱诗的人无不乐道喜吟，堪称最享盛名；然而它又是最不易讲解的一篇难诗。有人说是写给令狐楚家一个叫"锦瑟"的侍女的爱情诗；有人说是睹物思人，写给故去的妻子王氏的悼亡诗。',
    translation: '锦瑟呀，你为何竟有五十条弦？每弦每节，都令人怀思黄金华年。我心如庄子，为蝴蝶晓梦而迷惘；又如望帝化杜鹃，寄托春心哀怨。',
    coreImageries: ['锦瑟', '蝴蝶', '杜鹃', '沧海', '明珠', '蓝田玉'],
    emotions: ['怅惘', '追忆', '幽怨'],
    themes: ['人生感怀', '爱情悼亡'],
    keywords: ['锦瑟', '蝴蝶', '杜鹃', '沧海', '明珠', '玉烟', '追忆', '华年', '春心', '惘然'],
    difficulty: '大师',
    targetPhraseCount: 8,
    accentColor: '#a87ac9',
    icon: '🎵'
  },
  {
    id: 'cp011',
    title: '雨霖铃·寒蝉凄切',
    author: '柳永',
    dynasty: '宋',
    type: '词',
    content: [
      '寒蝉凄切，对长亭晚，骤雨初歇。',
      '都门帐饮无绪，留恋处，兰舟催发。',
      '执手相看泪眼，竟无语凝噎。',
      '念去去，千里烟波，暮霭沉沉楚天阔。',
      '多情自古伤离别，更那堪，冷落清秋节！',
      '今宵酒醒何处？杨柳岸，晓风残月。',
      '此去经年，应是良辰好景虚设。',
      '便纵有千种风情，更与何人说？'
    ],
    background: '这首词是柳永从汴京南下时与恋人的惜别之作。全词围绕"伤离别"而构思，先写离别之前，重在勾勒环境；次写离别时刻，重在描写情态；再写别后想象，重在刻画心理。',
    translation: '秋蝉的叫声凄凉而急促，傍晚时分，面对着长亭，骤雨刚停。在京都郊外设帐饯行，却没有畅饮的心绪，正在依依不舍的时候，船上的人已催着出发。',
    coreImageries: ['寒蝉', '长亭', '兰舟', '烟波', '暮霭', '杨柳岸', '晓风残月'],
    emotions: ['伤别', '缱绻', '凄切'],
    themes: ['送别怀人', '羁旅愁思'],
    keywords: ['寒蝉', '长亭', '兰舟', '烟波', '暮霭', '杨柳', '晓风', '残月', '离别', '清秋'],
    difficulty: '大师',
    targetPhraseCount: 9,
    accentColor: '#c56b6b',
    icon: '🌧️'
  },
  {
    id: 'cp012',
    title: '陋室铭',
    author: '刘禹锡',
    dynasty: '唐',
    type: '文',
    content: [
      '山不在高，有仙则名。',
      '水不在深，有龙则灵。',
      '斯是陋室，惟吾德馨。',
      '苔痕上阶绿，草色入帘青。',
      '谈笑有鸿儒，往来无白丁。',
      '可以调素琴，阅金经。',
      '无丝竹之乱耳，无案牍之劳形。',
      '南阳诸葛庐，西蜀子云亭。',
      '孔子云：何陋之有？'
    ],
    background: '《陋室铭》作于和州任上（824—826年）。《历阳典录》："陋室，在州治内，唐和州刺史刘禹锡建，有铭，柳公权书碑。"作者因在任监察御史期间，曾经参加了王叔文的"永贞革新"，反对宦官和藩镇割据势力。',
    translation: '山不在于高，有仙人居住就有盛名；水不在于深，有蛟龙潜藏就显神灵。这是简陋的房子，只是我品德好就感觉不到简陋了。',
    coreImageries: ['陋室', '苔痕', '素琴', '金经', '鸿儒', '青山', '绿水'],
    emotions: ['清高', '淡泊', '悠然'],
    themes: ['隐逸情怀', '修身养性'],
    keywords: ['陋室', '苔痕', '素琴', '金经', '鸿儒', '青山', '绿水', '淡泊', '清雅', '德馨'],
    difficulty: '精通',
    targetPhraseCount: 7,
    accentColor: '#7ca97c',
    icon: '🏡'
  }
]

export const getPoemById = (id: string): ClassicPoem | null => {
  return classicPoems.find(p => p.id === id) || null
}

export const getPoemsByDifficulty = (difficulty: string): ClassicPoem[] => {
  return classicPoems.filter(p => p.difficulty === difficulty)
}

export const getPoemsByDynasty = (dynasty: string): ClassicPoem[] => {
  return classicPoems.filter(p => p.dynasty === dynasty)
}

export const getPoemsByType = (type: string): ClassicPoem[] => {
  return classicPoems.filter(p => p.type === type)
}

export const getAllPoems = (): ClassicPoem[] => {
  return [...classicPoems]
}

export const generatePoemPhrases = (poem: ClassicPoem): string[] => {
  const basePhrases = new Set<string>()
  
  poem.coreImageries.forEach((img: string) => basePhrases.add(img))
  poem.keywords.forEach((kw: string) => basePhrases.add(kw))
  
  return Array.from(basePhrases)
}
