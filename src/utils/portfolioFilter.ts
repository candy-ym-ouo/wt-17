import type { Composition, Collection, FilterState, GroupBy, SortBy, ScoreGrade, GroupedCompositions, DateGroup, Chapter } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

export const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '未知'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}时${remainingMinutes}分` : `${hours}小时`
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
  }
  return `${seconds}秒`
}

export const getTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export const getChapterProgress = (comp: Composition, chapter?: Chapter): { current: number; target: number; percentage: number; label: string } => {
  const target = chapter?.targetPhraseCount || 5
  const current = comp.phrases.length
  const percentage = Math.min(Math.round((current / target) * 100), 100)
  
  let label = ''
  if (current === 0) label = '未开始'
  else if (current < target * 0.5) label = '构思中'
  else if (current < target) label = '创作中'
  else if (current === target) label = '已完成'
  else label = '超量完成'
  
  return { current, target, percentage, label }
}

export const getEditStatus = (comp: Composition): { label: string; icon: string; isEdited: boolean; editCount: number } => {
  const editCount = comp.editCount || 0
  const isEdited = editCount > 0 || comp.updatedAt > comp.createdAt + 60000
  
  let label = '首次创作'
  let icon = '✦'
  
  if (editCount >= 5) {
    label = '反复雕琢'
    icon = '✧'
  } else if (editCount >= 3) {
    label = '多次润色'
    icon = '✦'
  } else if (editCount >= 1) {
    label = '有所修改'
    icon = '◇'
  } else if (comp.updatedAt > comp.createdAt + 300000) {
    label = '精心打磨'
    icon = '◆'
  }
  
  return { label, icon, isEdited, editCount: Math.max(editCount, comp.updatedAt > comp.createdAt + 60000 ? 1 : 0) }
}

const GRADE_ORDER: ScoreGrade[] = ['神品', '妙品', '佳品', '能品', '习作']

export const getGrade = (score: number): ScoreGrade => {
  const grade = getScoreGrade(score).grade
  return grade as ScoreGrade
}

export const filterCompositions = (
  compositions: Composition[],
  filter: FilterState
): Composition[] => {
  return compositions.filter(comp => {
    if (filter.chapterId && comp.chapterId !== filter.chapterId) {
      return false
    }
    if (filter.grade) {
      const compGrade = getGrade(comp.score.total)
      if (compGrade !== filter.grade) return false
    }
    if (filter.dateRange) {
      if (filter.dateRange.start && comp.createdAt < filter.dateRange.start) return false
      if (filter.dateRange.end && comp.createdAt > filter.dateRange.end) return false
    }
    if (filter.collectionId) {
      if (!comp.collectionIds?.includes(filter.collectionId)) return false
    }
    if (filter.searchText) {
      const search = filter.searchText.toLowerCase()
      const titleMatch = comp.title.toLowerCase().includes(search)
      const phraseMatch = comp.phrases.some(p => p.text.includes(search))
      if (!titleMatch && !phraseMatch) return false
    }
    return true
  })
}

export const sortCompositions = (
  compositions: Composition[],
  sortBy: SortBy,
  ascending: boolean = false
): Composition[] => {
  const sorted = [...compositions]
  const pinnedFirst = sorted.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    if (a.isPinned && b.isPinned) {
      return (b.pinnedAt || 0) - (a.pinnedAt || 0)
    }
    return 0
  })
  const rest = sorted.filter(c => !c.isPinned)
  const pinned = sorted.filter(c => c.isPinned)
  const sortRest = [...rest].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return ascending ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
      case 'score':
        return ascending ? a.score.total - b.score.total : b.score.total - a.score.total
      case 'title':
        return ascending 
          ? a.title.localeCompare(b.title, 'zh-CN')
          : b.title.localeCompare(a.title, 'zh-CN')
      default:
        return 0
    }
  })
  return [...pinned, ...sortRest]
}

const getDateGroupKey = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${month}`
}

const getDateGroupLabel = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year === currentYear && month === currentMonth) return '本月'
  if (year === currentYear && month === currentMonth - 1) return '上月'
  if (year === currentYear) return `${month}月`
  return `${year}年${month}月`
}

export const groupCompositions = (
  compositions: Composition[],
  groupBy: GroupBy,
  sortBy: SortBy,
  sortAscending: boolean,
  chaptersTitles: Record<string, { title: string; accent: string }>,
  collections: Collection[]
): GroupedCompositions[] => {
  if (groupBy === 'none') {
    return [{
      groupKey: 'all',
      groupLabel: '全部作品',
      compositions: sortCompositions(compositions, sortBy, sortAscending)
    }]
  }
  const groups = new Map<string, GroupedCompositions>()
  
  const addToGroup = (groupKey: string, groupLabel: string, comp: Composition) => {
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        groupLabel,
        compositions: []
      })
    }
    groups.get(groupKey)!.compositions.push(comp)
  }

  compositions.forEach(comp => {
    switch (groupBy) {
      case 'chapter': {
        const groupKey = comp.chapterId
        const groupLabel = chaptersTitles[comp.chapterId]?.title || '未知章节'
        addToGroup(groupKey, groupLabel, comp)
        break
      }
      case 'grade': {
        const groupKey = getGrade(comp.score.total)
        const groupLabel = groupKey
        addToGroup(groupKey, groupLabel, comp)
        break
      }
      case 'date': {
        const groupKey = getDateGroupKey(comp.createdAt)
        const groupLabel = getDateGroupLabel(comp.createdAt)
        addToGroup(groupKey, groupLabel, comp)
        break
      }
      case 'collection': {
        const collIds = comp.collectionIds || []
        if (collIds.length === 0) {
          addToGroup('uncategorized', '未分类', comp)
        } else {
          collIds.forEach(collId => {
            const coll = collections.find(c => c.id === collId)
            if (coll) {
              addToGroup(collId, coll.name, comp)
            }
          })
        }
        break
      }
    }
  })

  const result = Array.from(groups.values())
  result.forEach(g => {
    g.compositions = sortCompositions(g.compositions, sortBy, sortAscending)
  })

  if (groupBy === 'grade') {
    result.sort((a, b) => {
      const aIdx = GRADE_ORDER.indexOf(a.groupKey as ScoreGrade)
      const bIdx = GRADE_ORDER.indexOf(b.groupKey as ScoreGrade)
      return aIdx - bIdx
    })
  } else if (groupBy === 'date') {
    result.sort((a, b) => b.groupKey.localeCompare(a.groupKey))
  } else if (groupBy === 'chapter') {
    const chapterOrder = Object.keys(chaptersTitles)
    result.sort((a, b) => {
      const aIdx = chapterOrder.indexOf(a.groupKey)
      const bIdx = chapterOrder.indexOf(b.groupKey)
      return aIdx - bIdx
    })
  } else if (groupBy === 'collection') {
    result.sort((a, b) => {
      if (a.groupKey === 'uncategorized') return 1
      if (b.groupKey === 'uncategorized') return -1
      return a.groupLabel.localeCompare(b.groupLabel, 'zh-CN')
    })
  }
  return result
}

export const getDateGroups = (compositions: Composition[]): DateGroup[] => {
  const groups = new Map<string, DateGroup>()
  compositions.forEach(comp => {
    const date = new Date(comp.createdAt)
    const year = date.getFullYear()
    const month = date.getMonth()
    const key = `${year}-${month + 1}`
    if (!groups.has(key)) {
      const start = new Date(year, month, 1).getTime()
      const end = new Date(year, month + 1, 0, 23, 59, 59).getTime()
      groups.set(key, {
        key,
        label: getDateGroupLabel(comp.createdAt),
        start,
        end
      })
    }
  })
  return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key))
}

export const getGradeColor = (grade: ScoreGrade): string => {
  switch (grade) {
    case '神品': return '#c9a86c'
    case '妙品': return '#7a9ea8'
    case '佳品': return '#6b8e6b'
    case '能品': return '#a8a498'
    case '习作': return '#6b6858'
  }
}
