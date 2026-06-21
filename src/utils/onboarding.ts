import type { WelcomeContent, GuideStep, RecommendationAction, UserActivityState, Phrase } from '@/types'
import { chapters, getChapterById } from '@/data/chapters'
import { getAllBestScores } from '@/utils/storage'
import { scenePhrases, emotionPhrases, timePhrases, actionPhrases, imageryPhrases, createPhrase } from '@/data/phrases'

const NEW_USER_STEPS: GuideStep[] = [
  {
    id: 'intro',
    title: '欢迎来到诗词切片',
    description: '在这里，你将用古人的词句，编织属于你的诗意天地。',
    icon: '✦'
  },
  {
    id: 'browse',
    title: '第一步：浏览词句',
    description: '右侧词句池中有精选的古典词句，分为景物、情感、时间、动作、意象五大类。',
    icon: '📖',
    highlight: 'phrase-pool'
  },
  {
    id: 'select',
    title: '第二步：选择词句',
    description: '点击词句将其添加到画布，你可以拖拽调整位置和角度，创造独特的排版。',
    icon: '🖱️',
    highlight: 'canvas-board'
  },
  {
    id: 'score',
    title: '第三步：查看评分',
    description: '系统会从连贯性、意象丰富度、节奏韵律、主题契合四个维度为你的作品评分。',
    icon: '⭐',
    highlight: 'score-panel'
  },
  {
    id: 'save',
    title: '第四步：保存作品',
    description: '满意后点击保存按钮，为你的诗篇命名，永久珍藏这份诗意。',
    icon: '💾',
    highlight: 'save-button'
  }
]

const RETURNING_USER_STEPS: GuideStep[] = [
  {
    id: 'welcome-back',
    title: '欢迎回来，诗人',
    description: '时光流转，诗意不变。让我们继续这段文字之旅。',
    icon: '🌸'
  },
  {
    id: 'progress',
    title: '回顾你的足迹',
    description: '看看你已完成的章节，解锁的成就，以及那些未竟的诗篇。',
    icon: '📜',
    highlight: 'chapters-button'
  },
  {
    id: 'new-content',
    title: '发现新可能',
    description: '也许有新解锁的章节，或者可以挑战更高的评分，让作品臻于完美。',
    icon: '✨',
    highlight: 'quest-button'
  },
  {
    id: 'continue',
    title: '继续创作',
    description: '画布已为你铺开，词句正等待被唤醒。开始新的创作吧！',
    icon: '🖌️',
    highlight: 'canvas-board'
  }
]

const generateNewUserRecommendations = (): RecommendationAction[] => {
  const ch1 = getChapterById('ch1')
  const recommendations: RecommendationAction[] = []
  
  recommendations.push({
    id: 'rec-ch1',
    type: 'chapter',
    title: '从「春江花月」开始',
    description: '第一章是最适合新手的入门章节，主题温柔，词句优美。',
    icon: '🌙',
    priority: 1,
    targetId: 'ch1',
    isRecommended: true
  })
  
  if (ch1) {
    const starterPhrases: Phrase[] = [
      createPhrase('明月', 'scene', 1),
      createPhrase('相思', 'emotion', 1),
      createPhrase('昨夜', 'time', 1),
      createPhrase('遥望', 'action', 1),
      createPhrase('缱绻', 'imagery', 1)
    ]
    
    starterPhrases.forEach((phrase, idx) => {
      recommendations.push({
        id: `rec-phrase-${idx}`,
        type: 'phrase',
        title: `试试「${phrase.text}」`,
        description: `这是一个${getCategoryLabel(phrase.category)}类的词句，很适合作为开篇。`,
        icon: '✦',
        priority: 2 + idx * 0.1,
        targetId: phrase.id,
        phrase,
        isRecommended: true
      })
    })
  }
  
  recommendations.push({
    id: 'rec-quest',
    type: 'quest',
    title: '探索支线任务',
    description: '完成支线任务可以解锁专属词句，丰富你的词库。',
    icon: '🎯',
    priority: 3,
    targetId: 'ch1-quest-1',
    isRecommended: false
  })
  
  return recommendations.sort((a, b) => a.priority - b.priority)
}

const generateReturningUserRecommendations = (activity: UserActivityState): RecommendationAction[] => {
  const recommendations: RecommendationAction[] = []
  const bestScores = getAllBestScores()
  
  let nextChapterId = 'ch1'
  for (const ch of chapters) {
    if (!activity.completedChapterIds.includes(ch.id)) {
      nextChapterId = ch.id
      break
    }
  }
  
  const nextChapter = getChapterById(nextChapterId)
  if (nextChapter) {
    recommendations.push({
      id: 'rec-next-chapter',
      type: 'chapter',
      title: `继续「${nextChapter.title}」`,
      description: `你已完成 ${activity.completedChapterIds.length}/${chapters.length} 章，这是下一个等待你的挑战。`,
      icon: '📚',
      priority: 1,
      targetId: nextChapterId,
      isRecommended: true
    })
  }
  
  const incompleteChapters = chapters.filter(ch => {
    const score = bestScores[ch.id] || 0
    return activity.completedChapterIds.includes(ch.id) && score < 90
  })
  
  if (incompleteChapters.length > 0) {
    const improveChapter = incompleteChapters[0]
    const currentScore = bestScores[improveChapter.id] || 0
    recommendations.push({
      id: 'rec-improve',
      type: 'chapter',
      title: `精进「${improveChapter.title}」`,
      description: `当前最佳 ${currentScore} 分，冲击 90 分获得三星评价！`,
      icon: '⭐',
      priority: 2,
      targetId: improveChapter.id,
      isRecommended: true
    })
  }
  
  const freeRealm = getChapterById('ch5')
  if (activity.completedChapterIds.length >= 3 && freeRealm) {
    recommendations.push({
      id: 'rec-free-realm',
      type: 'theme',
      title: '探索「自由之境」',
      description: '打破所有格律限制，自定义主题，创造独一无二的诗篇。',
      icon: '🎨',
      priority: 3,
      targetId: 'ch5',
      isRecommended: true
    })
  }
  
  recommendations.push({
    id: 'rec-quest',
    type: 'quest',
    title: '完成支线任务',
    description: '还有未完成的支线任务，领取奖励解锁更多词句。',
    icon: '🎯',
    priority: 4,
    isRecommended: false
  })
  
  const categoryWeights: Record<string, number> = {
    scene: 0.25,
    emotion: 0.25,
    time: 0.15,
    action: 0.2,
    imagery: 0.15
  }
  
  const currentChapter = getChapterById(nextChapterId)
  if (currentChapter) {
    const recommendedPhrases: Phrase[] = []
    const allPhrases = [...scenePhrases, ...emotionPhrases, ...timePhrases, ...actionPhrases, ...imageryPhrases]
    
    for (const [cat, weight] of Object.entries(categoryWeights)) {
      const catPhrases = allPhrases.filter(p => p.category === cat)
      const count = Math.ceil(weight * 3)
      const selected = catPhrases.sort(() => Math.random() - 0.5).slice(0, count)
      recommendedPhrases.push(...selected)
    }
    
    recommendedPhrases.slice(0, 3).forEach((phrase, idx) => {
      recommendations.push({
        id: `rec-return-phrase-${idx}`,
        type: 'phrase',
        title: `试试「${phrase.text}」`,
        description: `精选${getCategoryLabel(phrase.category)}类词句，激发你的创作灵感。`,
        icon: '✦',
        priority: 2.5 + idx * 0.1,
        targetId: phrase.id,
        phrase,
        isRecommended: true
      })
    })
  }
  
  return recommendations.sort((a, b) => a.priority - b.priority)
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    scene: '景物',
    emotion: '情感',
    time: '时间',
    action: '动作',
    imagery: '意象'
  }
  return labels[category] || category
}

export const generateWelcomeContent = (
  entryType: 'new' | 'returning',
  activity: UserActivityState
): WelcomeContent => {
  if (entryType === 'new') {
    return {
      title: '开启你的诗意之旅',
      subtitle: '诗词切片 · 新手引导',
      description: '在这里，每一个词句都有灵魂，每一次排列都是创作。让我们一起走进古典诗词的世界。',
      icon: '🌙',
      accentColor: '#c9a86c',
      steps: NEW_USER_STEPS,
      recommendations: generateNewUserRecommendations(),
      defaultChapterId: 'ch1'
    }
  } else {
    const daysText = activity.daysSinceLastVisit >= 30 
      ? `已${Math.floor(activity.daysSinceLastVisit / 30)}个月`
      : `${activity.daysSinceLastVisit}天`
    
    return {
      title: '好久不见，诗人',
      subtitle: `你已离开 ${daysText}`,
      description: `你已完成 ${activity.completedChapterIds.length}/${chapters.length} 章，创作了 ${activity.totalCompositions} 首诗篇。让我们继续这段文字之旅。`,
      icon: '🌸',
      accentColor: '#d4a574',
      steps: RETURNING_USER_STEPS,
      recommendations: generateReturningUserRecommendations(activity),
      defaultChapterId: determineDefaultChapter(activity)
    }
  }
}

export const determineDefaultChapter = (activity: UserActivityState): string => {
  for (const ch of chapters) {
    if (!activity.completedChapterIds.includes(ch.id)) {
      return ch.id
    }
  }
  return 'ch1'
}

export const getRecommendedPhrases = (chapterId: string, count: number = 3): Phrase[] => {
  const chapter = getChapterById(chapterId)
  if (!chapter) return []
  
  const recommended: Phrase[] = []
  const categories = ['scene', 'emotion', 'imagery'] as const
  
  for (const cat of categories) {
    const catPhrases = chapter.phrases.filter(p => p.category === cat)
    if (catPhrases.length > 0) {
      const randomIndex = Math.floor(Math.random() * catPhrases.length)
      recommended.push({ ...catPhrases[randomIndex] })
    }
  }
  
  return recommended.slice(0, count)
}
