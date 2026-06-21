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

export type SettlementRuleType =
  | 'qualifier_bonus'
  | 'hidden_keyword_trigger'
  | 'forbidden_penalty'
  | 'category_combo'
  | 'all_hidden_revealed'

export interface SettlementRule {
  type: SettlementRuleType
  params: Record<string, any>
  description: string
}

export interface SettlementTriggeredRule {
  type: SettlementRuleType
  label: string
  adjustment: number
  description: string
}

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
  qualifierWords?: string[]
  forbiddenWords?: string[]
  hiddenKeywords?: string[]
  settlementRules?: SettlementRule[]
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
  hasPositions: boolean
  spatialRhythm: number
  spatialCompleteness: number
  wordOrderCoherence: number
  readingOrder: string[]
  layoutIssues: string[]
}

export interface DiagnosticReport {
  scoreLosses: ScoreLoss[]
  themeDeviation: ThemeDeviation
  wordClassImbalance: WordClassImbalance
  layoutAnalysis: LayoutAnalysis
  revisionPath: RevisionStep[]
  overallSuggestion: string
  settlementResult?: {
    totalAdjustment: number
    triggeredRules: SettlementTriggeredRule[]
  }
  forbiddenWarnings?: string[]
  qualifierHints?: string[]
  hiddenKeywordStatus?: {
    total: number
    revealed: string[]
    unrevealed: number
  }
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

export type UserEntryType = 'new' | 'returning' | 'existing'

export interface UserActivityState {
  firstVisitTime: number | null
  lastVisitTime: number | null
  totalVisits: number
  totalCompositions: number
  daysSinceLastVisit: number
  completedChapterIds: string[]
  hasSeenTutorial: boolean
  hasDismissedWelcome: boolean
}

export interface GuideStep {
  id: string
  title: string
  description: string
  icon: string
  highlight?: string
  action?: {
    type: 'highlight' | 'click' | 'auto'
    target?: string
  }
}

export interface RecommendationAction {
  id: string
  type: 'chapter' | 'phrase' | 'quest' | 'theme'
  title: string
  description: string
  icon: string
  priority: number
  targetId?: string
  phrase?: Phrase
  isRecommended: boolean
}

export interface WelcomeContent {
  title: string
  subtitle: string
  description: string
  icon: string
  accentColor: string
  steps: GuideStep[]
  recommendations: RecommendationAction[]
  defaultChapterId: string
}

export type GatheringStatus = 'upcoming' | 'active' | 'settling' | 'archived'

export interface GatheringChapter {
  id: string
  title: string
  description: string
  theme: string
  timeLimitSeconds: number
  targetPhraseCount: number
  requiredKeywords: string[]
  forbiddenWords: string[]
  bonusRules: GatheringBonusRule[]
}

export interface GatheringBonusRule {
  type: 'keyword_combo' | 'category_balance' | 'speed_bonus' | 'rare_phrase'
  label: string
  description: string
  bonus: number
  params: Record<string, any>
}

export interface GatheringReward {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  minScore: number
  minChaptersCleared: number
  rewards: GatheringRewardItem[]
}

export interface GatheringRewardItem {
  type: 'phrase_unlock' | 'title_reward' | 'score_weight_boost' | 'phrase_pool_refresh'
  params: Record<string, any>
}

export interface PoetryGathering {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  accentColor: string
  status: GatheringStatus
  startDate: number
  endDate: number
  chapters: GatheringChapter[]
  rewards: GatheringReward[]
  archiveCollectionId?: string
}

export interface GatheringChapterResult {
  chapterId: string
  gatheringId: string
  compositionId: string
  score: number
  timeUsedSeconds: number
  completedAt: number
  bonusAdjustment: number
  triggeredBonuses: string[]
}

export interface GatheringRankEntry {
  rank: number
  totalScore: number
  chaptersCleared: number
  bestChapterResults: Record<string, GatheringChapterResult>
}

export interface GatheringState {
  activeGatheringId: string | null
  chapterResults: Record<string, GatheringChapterResult[]>
  claimedRewards: Record<string, string[]>
  archivedGatheringIds: string[]
}

export interface GatheringSessionState {
  gatheringId: string
  chapterId: string
  startTime: number
  elapsedSeconds: number
  isPaused: boolean
  isComplete: boolean
}

export type TonePattern = 'ping' | 'ze' | 'any'

export interface CipaiLine {
  index: number
  charCount: number
  tonePattern: TonePattern[]
  rhyme: boolean
  description?: string
}

export interface CipaiTemplate {
  id: string
  name: string
  alias?: string
  description: string
  origin?: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalLines: number
  totalChars: number
  lines: CipaiLine[]
  rhymeScheme?: string[]
  recommendedThemes?: string[]
  example?: {
    title: string
    author: string
    content: string[]
  }
}

export interface CipaiScoringConfig {
  rhythmWeight: number
  rhymeWeight: number
  tonePatternWeight: number
  formMatchWeight: number
}

export interface CipaiCheckResult {
  lineIndex: number
  expectedCharCount: number
  actualCharCount: number
  charCountMatch: boolean
  toneMatches: boolean[]
  rhymeMatch: boolean
  errors: string[]
  warnings: string[]
}

export interface CipaiScoreBreakdown {
  formMatch: number
  tonePattern: number
  rhyme: number
  rhythm: number
  total: number
}

export interface CipaiRecommendation {
  type: 'char_count' | 'tone' | 'rhyme' | 'category'
  description: string
  suggestions: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface CipaiWorkshopState {
  activeCipaiId: string | null
  currentLineIndex: number
  checkResults: CipaiCheckResult[]
  score: CipaiScoreBreakdown
  recommendations: CipaiRecommendation[]
  strictMode: boolean
}

export type CipaiScoringMode = 'relaxed' | 'standard' | 'strict'

export interface CipaiScoringRuleSet {
  mode: CipaiScoringMode
  label: string
  description: string
  config: CipaiScoringConfig
  charCountTolerance: number
  toneTolerance: number
  rhymeTolerance: number
}

export type AnnotationType = 'praise' | 'suggestion' | 'question' | 'correction' | 'general'

export interface Annotation {
  id: string
  compositionId: string
  phraseId: string | null
  type: AnnotationType
  content: string
  authorId: string
  authorName: string
  authorRole: 'mentor' | 'friend' | 'self'
  createdAt: number
  updatedAt: number
  isResolved: boolean
  resolvedAt?: number
  replies: AnnotationReply[]
}

export interface AnnotationReply {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: 'mentor' | 'friend' | 'self'
  createdAt: number
}

export interface CompositionVersion {
  id: string
  compositionId: string
  versionNumber: number
  label: string
  description: string
  phrases: Phrase[]
  score: ScoreBreakdown
  createdAt: number
  createdBy: string
  basedOnVersionId: string | null
  changeSummary?: string
}

export interface PhraseDiff {
  phraseId: string
  phraseText: string
  status: 'added' | 'removed' | 'modified' | 'unchanged'
  originalPhrase?: Phrase
  newPhrase?: Phrase
}

export interface VersionComparison {
  versionAId: string
  versionBId: string
  versionALabel: string
  versionBLabel: string
  added: Phrase[]
  removed: Phrase[]
  modified: { before: Phrase; after: Phrase }[]
  unchanged: Phrase[]
  scoreDifference: {
    coherence: number
    imagery: number
    rhythm: number
    themeMatch: number
    total: number
  }
}

export type ReviewStatus = 'draft' | 'in_review' | 'reviewed' | 'revised'

export interface MentorReviewSession {
  id: string
  compositionId: string
  status: ReviewStatus
  mentorId: string | null
  mentorName: string | null
  invitedFriendIds: string[]
  overallComment: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export interface ReviewState {
  annotations: Annotation[]
  versions: CompositionVersion[]
  sessions: MentorReviewSession[]
}

export interface MapNode {
  id: string
  chapterId: string
  x: number
  y: number
  label: string
  type: 'chapter' | 'event' | 'milestone' | 'branch'
  unlockCondition?: {
    type: 'chapter_complete' | 'score_threshold' | 'quest_complete' | 'phrase_collection'
    params: Record<string, any>
  }
  rewards?: {
    type: 'phrase' | 'title' | 'score_boost' | 'chapter_unlock'
    params: Record<string, any>
  }[]
  eventId?: string
  icon: string
  accentColor: string
}

export interface StoryEvent {
  id: string
  chapterId: string
  triggerType: 'chapter_unlock' | 'chapter_complete' | 'quest_complete' | 'achievement_unlock' | 'phrase_collect'
  triggerParams: Record<string, any>
  title: string
  content: string[]
  character?: string
  backgroundGradient?: string
  accentColor: string
  choices?: {
    id: string
    text: string
    consequence?: {
      type: 'phrase_unlock' | 'score_boost' | 'title' | 'quest_trigger'
      params: Record<string, any>
    }
  }[]
}

export type AchievementCategory = 'chapter' | 'score' | 'collection' | 'combo' | 'streak' | 'exploration'

export interface Achievement {
  id: string
  chapterId: string
  category: AchievementCategory
  title: string
  description: string
  icon: string
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum'
  unlockConditions: QuestCondition[]
  completeConditions: QuestCondition[]
  rewards: QuestReward[]
  accentColor: string
  hint?: string
  isSecret?: boolean
}

export interface AchievementProgress {
  achievementId: string
  unlocked: boolean
  completed: boolean
  claimed: boolean
  unlockedAt?: number
  completedAt?: number
}

export interface TravelMapState {
  currentNodeId: string
  visitedNodeIds: string[]
  completedEventIds: string[]
  achievements: AchievementProgress[]
  unlockedChapterIds: string[]
  mapExplorationPercent: number
}

export interface DropEvent {
  id: string
  chapterId: string
  triggerType: 'chapter_start' | 'score_milestone' | 'quest_complete' | 'story_choice'
  triggerParams: Record<string, any>
  phraseTexts: string[]
  rarityBoost?: Partial<Record<PhraseRarity, number>>
  isExclusive: boolean
  description: string
}

export interface TravelMapNode {
  node: MapNode
  progress: {
    unlocked: boolean
    completed: boolean
    visited: boolean
    percent: number
  }
}

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  praise: '赞赏',
  suggestion: '建议',
  question: '疑问',
  correction: '指正',
  general: '总评'
}

export const ANNOTATION_TYPE_COLORS: Record<AnnotationType, string> = {
  praise: '#7ca97c',
  suggestion: '#c9a86c',
  question: '#7a9ea8',
  correction: '#c56b6b',
  general: '#a8a498'
}

export const ACHIEVEMENT_RARITY_LABELS: Record<string, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金'
}

export const ACHIEVEMENT_RARITY_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2'
}

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  chapter: '章节',
  score: '评分',
  collection: '收集',
  combo: '组合',
  streak: '连胜',
  exploration: '探索'
}
