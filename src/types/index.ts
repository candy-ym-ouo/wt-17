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

export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'midnight'

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  dawn: '黎明',
  morning: '晨间',
  noon: '正午',
  afternoon: '午后',
  dusk: '黄昏',
  evening: '夜幕',
  midnight: '子夜'
}

export const TIME_PERIOD_ICONS: Record<TimePeriod, string> = {
  dawn: '🌅',
  morning: '🌤️',
  noon: '☀️',
  afternoon: '🌇',
  dusk: '🌆',
  evening: '🌙',
  midnight: '🌌'
}

export interface ImpromptuTopicTheme {
  id: string
  name: string
  description: string
  icon: string
  accentColor: string
  periodAffinity: TimePeriod[]
  keywords: string[]
  categoryWeights: Partial<Record<PhraseCategory, number>>
  scoringPreference: Partial<ScoreWeights>
  themeMatchBonus: number
  preferredCategories: PhraseCategory[]
  forbiddenWords?: string[]
  requiredKeywords?: string[]
}

export interface ImpromptuTopic {
  id: string
  themeId: string
  period: TimePeriod
  title: string
  subtitle: string
  description: string
  accentColor: string
  timeLimitSeconds: number
  targetPhraseCount: number
  requiredKeywords: string[]
  forbiddenWords: string[]
  bonusRules: ImpromptuTopicBonusRule[]
  rewards: ImpromptuTopicReward[]
  poolRefresh: {
    addKeywords: string[]
    addCategory: PhraseCategory
    addCount: number
  }
}

export interface ImpromptuTopicBonusRule {
  type: 'keyword_combo' | 'category_balance' | 'speed_bonus' | 'rare_phrase' | 'period_match'
  label: string
  description: string
  bonus: number
  params: Record<string, any>
}

export interface ImpromptuTopicReward {
  tier: 'bronze' | 'silver' | 'gold'
  minScore: number
  rewards: ImpromptuTopicRewardItem[]
}

export interface ImpromptuTopicRewardItem {
  type: 'phrase_unlock' | 'title_reward' | 'score_weight_boost' | 'phrase_pool_refresh'
  params: Record<string, any>
}

export interface ImpromptuTopicResult {
  topicId: string
  compositionId: string
  score: number
  timeUsedSeconds: number
  completedAt: number
  bonusAdjustment: number
  triggeredBonuses: string[]
  rewardTier: string | null
}

export interface ImpromptuTopicState {
  completedTopics: string[]
  topicResults: Record<string, ImpromptuTopicResult[]>
  claimedRewards: Record<string, string[]>
  totalCompleted: number
}

export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'showcased'
export type ReviewVerdict = 'accept' | 'reject' | 'showcase'
export type ReputationRank = '童生' | '秀才' | '举人' | '进士' | '翰林' | '大学士'

export interface SocietySubmission {
  id: string
  compositionId: string
  submittedAt: number
  status: SubmissionStatus
  reviewVerdict?: ReviewVerdict
  reviewedAt?: number
  reviewerName?: string
  reviewComment?: string
  reputationGained: number
  exhibitionThemeId?: string
}

export interface ExhibitionTheme {
  id: string
  name: string
  description: string
  icon: string
  accentColor: string
  requiredKeywords: string[]
  preferredCategories: PhraseCategory[]
  minScore: number
  maxSlots: number
  bonusReputation: number
  backgroundGradient: string
}

export interface ExhibitionEntry {
  id: string
  compositionId: string
  themeId: string
  exhibitedAt: number
  visitorCount: number
  reputationEarned: number
  isFeatured: boolean
}

export interface ReputationMilestone {
  rank: ReputationRank
  minReputation: number
  titleReward: string
  unlockedFeatures: string[]
  accentColor: string
  icon: string
}

export interface RareChapter {
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
  requiredRank: ReputationRank
  requiredReputation: number
  unlockQuestId?: string
  rarity: 'epic' | 'legendary'
  qualifierWords?: string[]
  forbiddenWords?: string[]
  hiddenKeywords?: string[]
  settlementRules?: SettlementRule[]
}

export interface SocietyReviewCriterion {
  id: string
  name: string
  description: string
  weight: number
  icon: string
}

export interface SocietyReviewResult {
  criterionId: string
  score: number
  comment: string
}

export interface PoetrySocietyState {
  reputation: number
  currentRank: ReputationRank
  submissions: SocietySubmission[]
  exhibitions: ExhibitionEntry[]
  unlockedRareChapterIds: string[]
  totalSubmissions: number
  totalAccepted: number
  totalShowcased: number
  totalExhibitions: number
  claimedMilestoneRewards: string[]
  featuredCompositionId: string | null
}

export const REPUTATION_RANK_ORDER: ReputationRank[] = ['童生', '秀才', '举人', '进士', '翰林', '大学士']

export const REPUTATION_RANK_MIN: Record<ReputationRank, number> = {
  '童生': 0,
  '秀才': 100,
  '举人': 300,
  '进士': 600,
  '翰林': 1000,
  '大学士': 1500
}

export const REPUTATION_RANK_COLORS: Record<ReputationRank, string> = {
  '童生': '#a8a498',
  '秀才': '#7a9ea8',
  '举人': '#7ca97c',
  '进士': '#c9a86c',
  '翰林': '#9b59b6',
  '大学士': '#ffd700'
}

export const REPUTATION_RANK_ICONS: Record<ReputationRank, string> = {
  '童生': '📖',
  '秀才': '📝',
  '举人': '🎓',
  '进士': '🏛️',
  '翰林': '⭐',
  '大学士': '🏮'
}

export type TrialDifficulty = '初级' | '中级' | '高级' | '大师' | '传说'

export type TrialThemeType = '山水' | '风月' | '边塞' | '闺怨' | '咏史' | '田园' | '送别' | '思乡'

export interface TrialTheme {
  id: string
  name: string
  type: TrialThemeType
  description: string
  icon: string
  accentColor: string
  backgroundGradient: string
  difficulty: TrialDifficulty
  requiredScore: number
  targetPhraseCount: number
  timeLimitSeconds: number
  requiredKeywords: string[]
  forbiddenWords: string[]
  bonusRules: TrialBonusRule[]
  rewards: TrialRewardPool
  settlementRules: TrialSettlementRule[]
  unlockCondition?: {
    type: 'score_threshold' | 'chapter_count' | 'trial_clear' | 'reputation_rank'
    params: Record<string, any>
  }
}

export interface TrialBonusRule {
  type: 'keyword_combo' | 'category_balance' | 'speed_bonus' | 'rare_phrase' | 'theme_match' | 'perfect_combo'
  label: string
  description: string
  bonus: number
  multiplier?: number
  params: Record<string, any>
}

export interface TrialSettlementRule {
  type: 'imagery_drop' | 'title_award' | 'score_multiplier' | 'phrase_unlock' | 'spectra_unlock'
  params: Record<string, any>
  description: string
  minScore: number
}

export interface TrialRewardPool {
  rareImageries: TrialRareImagery[]
  titles: TrialTitle[]
  spectra: TrialSpectra[]
  phraseUnlocks: string[]
}

export interface TrialRareImagery {
  id: string
  name: string
  description: string
  rarity: 'rare' | 'epic' | 'legendary'
  icon: string
  phraseTexts: string[]
  dropRate: number
  isExclusive?: boolean
}

export interface TrialTitle {
  id: string
  name: string
  description: string
  rarity: 'rare' | 'epic' | 'legendary'
  icon: string
  condition: {
    type: 'score_threshold' | 'speed_clear' | 'perfect_clear' | 'all_keywords' | 'no_forbidden'
    params: Record<string, any>
  }
}

export interface TrialSpectra {
  id: string
  name: string
  description: string
  rarity: 'rare' | 'epic' | 'legendary'
  icon: string
  pattern: string[]
  dropRate: number
  effect?: string
}

export interface TrialState {
  unlockedThemes: string[]
  clearedThemes: string[]
  bestScores: Record<string, number>
  bestTimes: Record<string, number>
  earnedTitles: string[]
  collectedImageries: string[]
  collectedSpectra: string[]
  totalTrials: number
  totalCleared: number
  currentStreak: number
  bestStreak: number
}

export interface TrialSessionState {
  themeId: string
  startTime: number
  elapsedSeconds: number
  isPaused: boolean
  isComplete: boolean
  boardPhrases: Phrase[]
}

export interface TrialSettlementResult {
  themeId: string
  themeName: string
  score: number
  scoreGrade: ScoreGrade
  timeUsedSeconds: number
  triggeredBonuses: TrialBonusResult[]
  totalBonus: number
  scoreMultiplier: number
  scoreBeforeMultiplier: number
  finalScore: number
  earnedImageries: TrialRareImagery[]
  earnedTitles: TrialTitle[]
  earnedSpectra: TrialSpectra[]
  unlockedPhrases: string[]
  isNewRecord: boolean
  isFirstClear: boolean
  stars: number
}

export interface TrialBonusResult {
  type: string
  label: string
  bonus: number
  multiplier?: number
  description: string
}

export const TRIAL_DIFFICULTY_LABELS: Record<TrialDifficulty, string> = {
  '初级': '初级',
  '中级': '中级',
  '高级': '高级',
  '大师': '大师级',
  '传说': '传说级'
}

export const TRIAL_DIFFICULTY_COLORS: Record<TrialDifficulty, string> = {
  '初级': '#7ca97c',
  '中级': '#7a9ea8',
  '高级': '#c9a86c',
  '大师': '#a87ac9',
  '传说': '#c95b5b'
}

export const TRIAL_THEME_TYPE_LABELS: Record<TrialThemeType, string> = {
  '山水': '山水田园',
  '风月': '风花雪月',
  '边塞': '边塞征战',
  '闺怨': '闺怨情思',
  '咏史': '咏史怀古',
  '田园': '田园隐逸',
  '送别': '送别离愁',
  '思乡': '思乡怀人'
}

export type PoeticGoalDimension = 'mood' | 'imagery' | 'rhythm' | 'structure' | 'theme'

export interface PoeticGoal {
  dimension: PoeticGoalDimension
  label: string
  description: string
  targetKeywords: string[]
  targetCategories: PhraseCategory[]
  weight: number
}

export interface ClassicPoemLine {
  text: string
  annotation?: string
}

export interface ClassicPoem {
  id: string
  title: string
  author: string
  dynasty: string
  content: ClassicPoemLine[]
  theme: string
  mood: string
  goals: PoeticGoal[]
  keyImagery: string[]
  keyEmotions: string[]
  structurePattern: {
    lineCount: number
    avgCharPerLine: number
    categorySequence: PhraseCategory[]
  }
  difficulty: '入门' | '进阶' | '高阶' | '宗师'
  accentColor: string
  icon: string
  description: string
  backgroundGradient: string
}

export interface DimensionDeviation {
  dimension: PoeticGoalDimension
  label: string
  originalScore: number
  currentScore: number
  deviation: number
  deviationLevel: 'perfect' | 'slight' | 'moderate' | 'severe'
  analysis: string
  suggestions: string[]
}

export interface DeviationReport {
  totalDeviation: number
  dimensions: DimensionDeviation[]
  capturedKeywords: string[]
  missedKeywords: string[]
  extraKeywords: string[]
  overallAnalysis: string
  restorationAdvice: string
}

export interface RestorationScore {
  total: number
  fidelity: number
  creativity: number
  balance: number
  grade: '传神' | '神似' | '形似' | '近似' | '远韵'
  breakdown: {
    moodFidelity: number
    imageryFidelity: number
    rhythmFidelity: number
    structureFidelity: number
    themeFidelity: number
    creativeBonus: number
  }
}

export interface ClassicReconstructionState {
  activePoemId: string | null
  completedPoemIds: string[]
  bestScores: Record<string, number>
  totalAttempts: number
}

export const POEM_DIFFICULTY_LABELS: Record<string, string> = {
  '入门': '入门初探',
  '进阶': '进阶修习',
  '高阶': '高阶领悟',
  '宗师': '宗师境界'
}

export const POEM_DIFFICULTY_COLORS: Record<string, string> = {
  '入门': '#7ca97c',
  '进阶': '#7a9ea8',
  '高阶': '#c9a86c',
  '宗师': '#c95b5b'
}

export const RESTORATION_GRADE_COLORS: Record<string, string> = {
  '传神': '#ffd700',
  '神似': '#c9a86c',
  '形似': '#7a9ea8',
  '近似': '#a8a498',
  '远韵': '#6b6858'
}

export type CollaborativeStatus = 'draft' | 'in_progress' | 'scoring' | 'completed' | 'archived'

export interface Participant {
  id: string
  name: string
  avatar?: string
  joinedAt: number
  reputation?: number
}

export interface Turn {
  id: string
  poemId: string
  turnNumber: number
  participantId: string
  participantName: string
  content: string
  submittedAt: number
  isLocked: boolean
  lockedBy?: string
  lockedAt?: number
  comment?: string
}

export interface TurnScore {
  turnId: string
  scorerId: string
  scorerName: string
  coherence: number
  imagery: number
  rhythm: number
  themeMatch: number
  comment: string
  scoredAt: number
}

export interface CollaborativePoem {
  id: string
  title: string
  theme: string
  description: string
  totalTurns: number
  currentTurnNumber: number
  status: CollaborativeStatus
  creatorId: string
  creatorName: string
  createdAt: number
  updatedAt: number
  completedAt?: number
  archivedAt?: number
  participants: Participant[]
  turns: Turn[]
  turnScores: TurnScore[]
  requiredKeywords?: string[]
  forbiddenWords?: string[]
  turnTimeLimitSeconds?: number
  accentColor: string
  icon: string
}

export interface CollaborativeUser {
  id: string
  name: string
  avatar?: string
  createdAt: number
}

export interface CollaborativeState {
  activePoemId: string | null
  poems: CollaborativePoem[]
  archivedPoemIds: string[]
  currentUserId: string
  currentUserName: string
  users: CollaborativeUser[]
}

export const COLLABORATIVE_STATUS_LABELS: Record<CollaborativeStatus, string> = {
  draft: '草稿',
  in_progress: '创作中',
  scoring: '评分中',
  completed: '已完成',
  archived: '已归档'
}

export const COLLABORATIVE_STATUS_COLORS: Record<CollaborativeStatus, string> = {
  draft: '#a8a498',
  in_progress: '#7ca97c',
  scoring: '#c9a86c',
  completed: '#9b59b6',
  archived: '#6b6858'
}

export type JieqiSeason = '春' | '夏' | '秋' | '冬'

export type JieqiType = 
  | 'lichun' | 'yushui' | 'jingzhe' | 'chunfen' | 'qingming' | 'guyu'
  | 'lixia' | 'xiaoman' | 'mangzhong' | 'xiazhi' | 'xiaoshu' | 'dashu'
  | 'liqiu' | 'chushu' | 'bailu' | 'qiufen' | 'hanlu' | 'shuangjiang'
  | 'lidong' | 'xiaoxue' | 'daxue' | 'dongzhi' | 'xiaohan' | 'dahan'

export interface JieqiInfo {
  id: JieqiType
  name: string
  pinyin: string
  season: JieqiSeason
  order: number
  month: number
  day: number
  description: string
  poem: string
  icon: string
  accentColor: string
  backgroundGradient: string
  decoration: ThemeDecorationType
}

export interface JieqiChapter {
  id: string
  jieqiId: JieqiType
  title: string
  subtitle: string
  description: string
  theme: string
  targetPhraseCount: number
  hint: string
  qualifierWords: string[]
  forbiddenWords: string[]
  hiddenKeywords: string[]
  settlementRules: SettlementRule[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface JieqiPhrase {
  text: string
  category: PhraseCategory
  rarity: PhraseRarity
  jieqiId: JieqiType
  isExclusive: boolean
}

export interface JieqiQuest {
  id: string
  jieqiId: JieqiType
  title: string
  description: string
  icon: string
  order: number
  unlockConditions: QuestCondition[]
  completeConditions: QuestCondition[]
  rewards: QuestReward[]
}

export interface JieqiCollection {
  id: string
  jieqiId: JieqiType
  title: string
  subtitle: string
  accentColor: string
  maxSlots: number
  description: string
}

export interface JieqiState {
  unlockedJieqi: JieqiType[]
  completedChapters: Record<string, boolean>
  claimedRewards: Record<string, boolean>
  collectedPhrases: string[]
  earnedTitles: string[]
  portfolioCompositions: Record<string, string[]>
  activeJieqiId: JieqiType | null
  currentYear: number
}

export const JIEQI_SEASON_LABELS: Record<JieqiSeason, string> = {
  '春': '春季',
  '夏': '夏季',
  '秋': '秋季',
  '冬': '冬季'
}

export const JIEQI_SEASON_COLORS: Record<JieqiSeason, string> = {
  '春': '#7ca97c',
  '夏': '#d4a574',
  '秋': '#c97c7c',
  '冬': '#7ca9c9'
}

export type FramingLayout = 'vertical-scroll' | 'horizontal-scroll' | 'fan' | 'album' | 'frame' | 'circular'

export const FRAMING_LAYOUT_LABELS: Record<FramingLayout, string> = {
  'vertical-scroll': '立轴',
  'horizontal-scroll': '横卷',
  'fan': '折扇',
  'album': '册页',
  'frame': '画框',
  'circular': '团扇'
}

export const FRAMING_LAYOUT_ICONS: Record<FramingLayout, string> = {
  'vertical-scroll': '📜',
  'horizontal-scroll': '🎑',
  'fan': '🪭',
  'album': '📖',
  'frame': '🖼️',
  'circular': '🪭'
}

export type TitleStyle = 'seal-script' | 'running-script' | 'regular-script' | 'cursive'

export const TITLE_STYLE_LABELS: Record<TitleStyle, string> = {
  'seal-script': '篆书题签',
  'running-script': '行书题签',
  'regular-script': '楷书题签',
  'cursive': '草书题签'
}

export type TitlePosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left'

export const TITLE_POSITION_LABELS: Record<TitlePosition, string> = {
  'top-right': '右上',
  'top-left': '左上',
  'top-center': '居上',
  'bottom-right': '右下',
  'bottom-left': '左下'
}

export type SealType = 'author' | 'mood' | 'idiom' | 'zodiac' | 'custom'

export const SEAL_TYPE_LABELS: Record<SealType, string> = {
  'author': '名印',
  'mood': '闲章',
  'idiom': '成语印',
  'zodiac': '生肖印',
  'custom': '自定义印'
}

export interface SealConfig {
  id: string
  type: SealType
  text: string
  position: { x: number; y: number }
  rotation: number
  color: string
  shape: 'square' | 'round' | 'oval'
  size: number
  opacity: number
}

export interface FramingConfig {
  layout: FramingLayout
  titleStyle: TitleStyle
  titlePosition: TitlePosition
  showTitle: boolean
  showScore: boolean
  seals: SealConfig[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
  padding: number
  paperTexture: 'plain' | 'rice' | 'bamboo' | 'silk' | 'aged'
}

export const PAPER_TEXTURE_LABELS: Record<FramingConfig['paperTexture'], string> = {
  'plain': '素纸',
  'rice': '宣纸',
  'bamboo': '竹纸',
  'silk': '绢帛',
  'aged': '古纸'
}

export const DEFAULT_FRAMING_CONFIG: FramingConfig = {
  layout: 'vertical-scroll',
  titleStyle: 'seal-script',
  titlePosition: 'top-right',
  showTitle: true,
  showScore: false,
  seals: [],
  backgroundColor: '#f5f0e8',
  borderColor: '#c9a86c',
  borderWidth: 2,
  padding: 40,
  paperTexture: 'rice'
}
