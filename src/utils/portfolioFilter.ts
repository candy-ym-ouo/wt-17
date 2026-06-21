import type { Composition, Collection, FilterState, GroupBy, SortBy, ScoreGrade, GroupedCompositions, DateGroup } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

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
  chaptersTitles: Record<string, { title: string; accent: string }>,
  collections: Collection[]
): GroupedCompositions[] => {
  if (groupBy === 'none') {
    return [{
      groupKey: 'all',
      groupLabel: '全部作品',
      compositions: sortCompositions(compositions, 'date')
    }]
  }
  const groups = new Map<string, GroupedCompositions>()
  compositions.forEach(comp => {
    let groupKey = ''
    let groupLabel = ''
    switch (groupBy) {
      case 'chapter':
        groupKey = comp.chapterId
        groupLabel = chaptersTitles[comp.chapterId]?.title || '未知章节'
        break
      case 'grade':
        groupKey = getGrade(comp.score.total)
        groupLabel = groupKey
        break
      case 'date':
        groupKey = getDateGroupKey(comp.createdAt)
        groupLabel = getDateGroupLabel(comp.createdAt)
        break
      case 'collection':
        const collIds = comp.collectionIds || []
        if (collIds.length === 0) {
          groupKey = 'uncategorized'
          groupLabel = '未分类'
        } else {
          groupKey = collIds[0]
          const coll = collections.find(c => c.id === groupKey)
          groupLabel = coll?.name || '未知合集'
        }
        break
    }
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        groupLabel,
        compositions: []
      })
    }
    groups.get(groupKey)!.compositions.push(comp)
  })
  const result = Array.from(groups.values())
  result.forEach(g => {
    g.compositions = sortCompositions(g.compositions, 'date')
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
