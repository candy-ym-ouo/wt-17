export type PhraseRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type PhraseSourceType = 'chapter' | 'quest' | 'event' | 'reward' | 'initial'

export interface PhraseSource {
  type: PhraseSourceType
  chapterId?: string
  questId?: string
  eventId?: string
  description?: string
}

export interface Phrase {
  id: string
  text: string
  category: PhraseCategory
  position: { x: number; y: number } | null
  rotation: number
  isPlaced: boolean
  weight: number
  rarity: PhraseRarity
  source: PhraseSource
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

export interface LayoutAnalysis {
  spatialRhythm: number
  spatialCompleteness: number
  wordOrderCoherence: number
  readingOrder: string[]
  layoutIssues: string[]
  hasPositions: boolean
}

export interface DiagnosticReport {
  scoreLosses: ScoreLoss[]
  themeDeviation: ThemeDeviation
  wordClassImbalance: WordClassImbalance
  layoutAnalysis: LayoutAnalysis
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
  isPinned?: boolean
  pinnedAt?: number
  collectionIds?: string[]
  creationDuration?: number
  coreImagery?: string[]
  editCount?: number
}

export interface Collection {
  id: string
  name: string
  description: string
  accentColor: string
  compositionIds: string[]
  createdAt: number
  updatedAt: number
}

export interface ChapterProgress {
  bestScore: number
  starRating: number
  completedQuests: string[]
  totalQuests: string[]
  compositionCount: number
}

export type ScoreGrade = '神品' | '妙品' | '佳品' | '能品' | '习作'

export type GroupBy = 'chapter' | 'grade' | 'date' | 'collection' | 'none'

export type SortBy = 'date' | 'score' | 'title'

export interface FilterState {
  chapterId: string | null
  grade: ScoreGrade | null
  dateRange: { start: number | null; end: number | null } | null
  collectionId: string | null
  searchText: string
}

export interface DateGroup {
  key: string
  label: string
  start: number
  end: number
}

export interface GroupedCompositions {
  groupKey: string
  groupLabel: string
  compositions: Composition[]
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
  | 'win_streak'
  | 'phrase_collection_count'
  | 'phrase_collection_rarity'
  | 'rarity_combo'
  | 'all_chapters_score'
  | 'collection_composition_count'
  | 'perfect_clear'

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

export interface PhraseCollectionRecord {
  phraseText: string
  firstAcquiredAt: number
  acquiredCount: number
  sourceChapterId?: string
  sourceQuestId?: string
}

export interface PhraseCollectionState {
  collectedPhrases: Record<string, PhraseCollectionRecord>
  totalCollected: number
}

export interface StreakState {
  currentStreak: number
  bestStreak: number
  lastCompositionTime: number | null
  lastScore: number | null
}

export interface QuestState {
  unlockedQuests: string[]
  completedQuests: string[]
  claimedRewards: string[]
  earnedTitles: string[]
  activeWeightBoosts: Record<string, number>
  chapterRewardPhrases: Record<string, Phrase[]>
  phraseCollection: PhraseCollectionState
  streak: StreakState
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

export interface ChapterSoundscape {
  droneBase: number
  droneHarmonic: number
  droneGain: number
  harmonicGain: number
  droneAnimCycle: number
  scale: number[]
  melodyInterval: number
  melodyAttack: number
  melodyDecay: number
  melodyPeakGain: number
  melodySkipChance: number
  melodyTypes: OscillatorType[]
  octaveShifts: number[]
  pluckFreqMultiplier: number
  pluckDecay: number
  successNotes: number[]
  successNoteGap: number
  milestoneChime: number[]
  label: string
}

export type ThemeDecorationType = 'stars' | 'flowers' | 'waves' | 'mountains' | 'clouds' | 'fireflies' | 'leaves' | 'snow'

export interface ThemeBackground {
  gradient: string
  particleColor: string
  gridOpacity: number
  watermarkText?: string
  watermarkOpacity?: number
}

export interface ThemeWordPool {
  keywords: string[]
  categoryWeights: Partial<Record<PhraseCategory, number>>
  excludedPhrases?: string[]
  rarityBoost?: Partial<Record<PhraseRarity, number>>
}

export interface ThemeScoring {
  scoreWeights: Partial<ScoreWeights>
  themeMatchBonus: number
  preferredCategories: PhraseCategory[]
}

export interface ThemeTitlePattern {
  connector: string
  preferCategories: PhraseCategory[]
  maxWords: number
  template?: string
}

export interface Theme {
  id: string
  name: string
  description: string
  icon: string
  accentColor: string
  background: ThemeBackground
  decoration: ThemeDecorationType
  wordPool: ThemeWordPool
  scoring: ThemeScoring
  titlePattern: ThemeTitlePattern
  isCustom?: boolean
  createdAt?: number
}

export interface ThemeState {
  currentThemeId: string
  customThemes: Theme[]
}

export type TitleStrategyType =
  | 'theme_match'
  | 'core_imagery'
  | 'composition_structure'
  | 'emotional_core'
  | 'classical_style'

export interface TitleOption {
  title: string
  strategy: TitleStrategyType
  strategyLabel: string
  description: string
  keywords: string[]
  score: number
}

export type CountPhase = 'empty' | 'early' | 'building' | 'sufficient' | 'exceed'
export type ScorePhase = 'unstarted' | 'nascent' | 'forming' | 'refining' | 'polishing' | 'masterpiece'
export type CategoryPhase = 'mono' | 'dual' | 'varied' | 'balanced'

export interface CategoryInsight {
  category: PhraseCategory
  label: string
  count: number
  percentage: number
  idealPercentage: number
  status: 'balanced' | 'excess' | 'deficit' | 'none'
}

export interface PhasedGuidance {
  countPhase: CountPhase
  scorePhase: ScorePhase
  categoryPhase: CategoryPhase
  progress: {
    current: number
    target: number
    percentage: number
  }
  categoryInsights: CategoryInsight[]
  headline: string
  primarySuggestion: string
  secondarySuggestion?: string
  categorySuggestion?: string
  scoreSuggestion?: string
  countSuggestion?: string
  encouragement: string
  stageLabel: string
  stageIcon: string
  accentTone: 'cold' | 'warm' | 'gold' | 'jade' | 'violet'
}
