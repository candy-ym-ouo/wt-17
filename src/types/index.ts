export interface Phrase {
  id: string
  text: string
  category: PhraseCategory
  position: { x: number; y: number } | null
  rotation: number
  isPlaced: boolean
  weight: number
}

export type PhraseCategory = 
  | 'scene'      // 景物
  | 'emotion'    // 情感
  | 'time'       // 时间
  | 'action'     // 动作
  | 'imagery'    // 意象

export interface Chapter {
  id: string
  title: string
  subtitle: string
  description: string
  theme: string
  backgroundGradient: string
  accentColor: string
  phrases: Phrase[]
  unlocked: boolean
  targetPhraseCount: number
  hint: string
}

export interface ScoreBreakdown {
  coherence: number       // 连贯性
  imagery: number         // 意象丰富度
  rhythm: number          // 节奏韵律
  themeMatch: number      // 主题契合
  total: number
}

export interface ScoreLoss {
  dimension: 'coherence' | 'imagery' | 'rhythm' | 'themeMatch'
  dimensionLabel: string
  lossPoints: number
  reasons: string[]
  severity: 'high' | 'medium' | 'low'
}

export interface ThemeDeviation {
  isDeviated: boolean
  deviationDegree: number
  currentKeywords: string[]
  missingKeywords: string[]
  suggestion: string
}

export interface CategoryBalance {
  category: PhraseCategory
  label: string
  count: number
  percentage: number
  idealPercentage: number
  status: 'balanced' | 'excess' | 'deficit'
}

export interface WordClassImbalance {
  isImbalanced: boolean
  balances: CategoryBalance[]
  dominantCategories: PhraseCategory[]
  missingCategories: PhraseCategory[]
  suggestion: string
}

export interface RevisionStep {
  order: number
  title: string
  description: string
  action: string
  priority: 'critical' | 'important' | 'enhancement'
  dimension?: 'coherence' | 'imagery' | 'rhythm' | 'themeMatch'
}

export interface DiagnosticReport {
  scoreLosses: ScoreLoss[]
  themeDeviation: ThemeDeviation
  wordClassImbalance: WordClassImbalance
  revisionPath: RevisionStep[]
  overallSuggestion: string
}

export interface Composition {
  id: string
  chapterId: string
  phrases: Phrase[]
  score: ScoreBreakdown
  createdAt: number
  updatedAt: number
  title: string
}

export interface GameState {
  currentChapterId: string
  compositions: Composition[]
  unlockedChapters: string[]
  musicEnabled: boolean
  musicVolume: number
}

export type QuestConditionType =
  | 'score_threshold'
  | 'phrase_combo'
  | 'composition_count'
  | 'chapter_count'
  | 'category_diversity'

export interface QuestCondition {
  type: QuestConditionType
  params: Record<string, any>
}

export type QuestRewardType =
  | 'phrase_unlock'
  | 'phrase_pool_refresh'
  | 'score_weight_boost'
  | 'title_reward'

export interface QuestReward {
  type: QuestRewardType
  params: Record<string, any>
}

export interface SideQuest {
  id: string
  chapterId: string
  title: string
  description: string
  icon: string
  unlockConditions: QuestCondition[]
  completeConditions: QuestCondition[]
  rewards: QuestReward[]
  accentColor: string
}

export interface QuestState {
  unlockedQuests: string[]
  completedQuests: string[]
  claimedRewards: string[]
  earnedTitles: string[]
  activeWeightBoosts: Record<string, number>
  chapterRewardPhrases: Record<string, Phrase[]>
}

export interface ScoreWeights {
  coherence: number
  imagery: number
  rhythm: number
  themeMatch: number
}

export interface CanvasPhrase extends Phrase {
  width: number
  height: number
  isDragging: boolean
  dragOffset: { x: number; y: number }
}

export interface CanvasState {
  chapterId: string
  phrases: CanvasPhrase[]
  timestamp: number
}

export interface HistorySnapshot {
  id: string
  name: string
  chapterId: string
  phrases: CanvasPhrase[]
  createdAt: number
  thumbnail?: string
}

export interface HistoryState {
  past: CanvasState[]
  future: CanvasState[]
  maxHistory: number
}

export interface SnapshotStorage {
  snapshots: HistorySnapshot[]
  currentSnapshotId: string | null
}
