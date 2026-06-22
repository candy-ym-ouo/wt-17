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

export type ClassicPoemDynasty = '先秦' | '汉' | '魏晋' | '南北朝' | '唐' | '宋' | '元' | '明' | '清'

export type ClassicPoemType = '诗' | '词' | '曲' | '赋' | '文'

export type ReconstructionDifficulty = '入门' | '进阶' | '精通' | '大师'

export const RECONSTRUCTION_DIFFICULTY_LABELS: Record<ReconstructionDifficulty, string> = {
  '入门': '入门',
  '进阶': '进阶',
  '精通': '精通',
  '大师': '大师'
}

export const RECONSTRUCTION_DIFFICULTY_COLORS: Record<ReconstructionDifficulty, string> = {
  '入门': '#7a9ea8',
  '进阶': '#c9a86c',
  '精通': '#a67bbf',
  '大师': '#d85050'
}

export const DYNASTY_LABELS: Record<ClassicPoemDynasty, string> = {
  '先秦': '先秦',
  '汉': '汉',
  '魏晋': '魏晋',
  '南北朝': '南北朝',
  '唐': '唐',
  '宋': '宋',
  '元': '元',
  '明': '明',
  '清': '清'
}

export const POEM_TYPE_LABELS: Record<ClassicPoemType, string> = {
  '诗': '诗',
  '词': '词',
  '曲': '曲',
  '赋': '赋',
  '文': '文'
}

export interface ClassicPoem {
  id: string
  title: string
  author: string
  dynasty: ClassicPoemDynasty
  type: ClassicPoemType
  content: string[]
  background: string
  translation?: string
  coreImageries: string[]
  emotions: string[]
  themes: string[]
  keywords: string[]
  difficulty: ReconstructionDifficulty
  targetPhraseCount: number
  accentColor: string
  icon: string
  unlockCondition?: {
    type: 'score_threshold' | 'chapter_count' | 'reputation_rank'
    params: Record<string, any>
  }
}

export type ImageryDeviationType = 'missing' | 'partial' | 'matched' | 'extra' | 'preserved' | 'transformed'

export interface ImageryDeviation {
  imagery: string
  originalImagery?: string
  deviationType?: ImageryDeviationType
  present: boolean
  matchScore: number
  matchedPhrases: string[]
  matchedPhrase?: string
  suggestion?: string
}

export interface ThemeDeviationDetail {
  theme: string
  matchDegree: number
  supportingKeywords: string[]
  missingElements: string[]
}

export interface EmotionDeviation {
  emotion: string
  matchDegree: number
  presentEmotions: string[]
  suggestion?: string
}

export interface StructuralDeviation {
  type: 'line_count' | 'rhyme_scheme' | 'meter' | 'parallelism'
  expected: any
  actual: any
  deviationLevel: 'high' | 'medium' | 'low'
  deviationDegree?: number
  suggestion?: string
}

export interface LexicalStyleAnalysis {
  styleMatch: number
  formalTone: number
  classicalVocab: number
  rhythmFlow: number
  suggestions: string[]
}

export interface ReconstructionAnalysis {
  imageryDeviations: ImageryDeviation[]
  themeDeviation: {
    matchDegree: number
    originalTheme?: string
    currentThemes?: string[]
    details: ThemeDeviationDetail[]
    missingElements?: string[]
    extraElements?: string[]
    overallSuggestion: string
  }
  emotionDeviation: {
    matchDegree: number
    originalEmotion?: string
    currentEmotions?: string[]
    intensityShift?: {
      original: number
      current: number
      shift: number
    }
    details: EmotionDeviation[]
    overallSuggestion: string
  }
  structuralDeviations: StructuralDeviation[]
  lexicalStyle: LexicalStyleAnalysis
}

export interface RestorationScore {
  imageryRestoration: number
  themeRestoration: number
  emotionRestoration: number
  structureRestoration: number
  styleRestoration: number
  total: number
  grade: ScoreGrade
  stars: number
}

export interface ReconstructionSuggestion {
  category: 'imagery' | 'theme' | 'emotion' | 'structure' | 'style'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: string
}

export interface ReconstructionResult {
  id: string
  poemId: string
  compositionId: string
  score: RestorationScore
  analysis: ReconstructionAnalysis
  suggestions: ReconstructionSuggestion[]
  elapsedSeconds: number
  timeUsedSeconds?: number
  phraseCount: number
  isCleared: boolean
  isNewBest: boolean
  isFirstClear?: boolean
  isNewRecord?: boolean
  earnedTitles: string[]
  unlockedPoems: string[]
  createdAt: number
}

export interface ReconstructionState {
  bestScores: Record<string, number>
  bestTimes?: Record<string, number>
  clearedPoemIds: string[]
  earnedTitles: string[]
  totalReconstructions: number
  currentStreak: number
  unlockedPoemIds: string[]
}

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'legendary'
export type AchievementCategory = 'reconstruction' | 'creation' | 'exploration' | 'collection' | 'social'

export const ACHIEVEMENT_RARITY_LABELS: Record<AchievementRarity, string> = {
  bronze: '铜',
  silver: '银',
  gold: '金',
  legendary: '传说'
}

export const ACHIEVEMENT_RARITY_COLORS: Record<AchievementRarity, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  legendary: '#9400d3'
}

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  reconstruction: '重构',
  creation: '创作',
  exploration: '探索',
  collection: '收集',
  social: '社交'
}

export interface AchievementCondition {
  type: string
  params: Record<string, any>
}

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string
  targetValue: number
  conditionType: string
  conditionParams: Record<string, any>
  rewards: Record<string, any>
  isSecret?: boolean
  chapterId?: string
  hint?: string
  completeConditions?: AchievementCondition[]
}

export interface AchievementProgress {
  achievementId: string
  currentValue: number
  unlocked: boolean
  unlockedAt?: number
  claimed: boolean
  completed?: boolean
  completedAt?: number
}

export type TimePeriod = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night' | 'late_night'

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  dawn: '黎明',
  morning: '上午',
  afternoon: '午后',
  dusk: '黄昏',
  night: '夜晚',
  late_night: '深夜'
}

export const TIME_PERIOD_ICONS: Record<TimePeriod, string> = {
  dawn: '🌅',
  morning: '🌞',
  afternoon: '☀️',
  dusk: '🌇',
  night: '🌙',
  late_night: '🌌'
}

export interface ImpromptuTopic {
  id: string
  title: string
  subtitle?: string
  description?: string
  prompt: string
  timePeriod: TimePeriod
  scene: string
  mood: string
  keywords: string[]
  requiredKeywords?: string[]
  forbiddenWords?: string[]
  bonusRules?: any[]
  targetPhraseCount: number
  timeLimit: number
  timeLimitSeconds?: number
  themeId?: string
  rewards?: any[]
  accentColor: string
}

export interface ImpromptuTopicState {
  activeTopicId: string | null
  startAt: number | null
  completedTopics: Record<string, { bestScore: number; attempts: number }>
  topicResults?: Record<string, any>
  totalCompleted?: number
}

export type TrialDifficulty = 'warmup' | 'standard' | 'challenge' | 'master'
export type TrialThemeType = 'imagery' | 'emotion' | 'scene' | 'technique'

export const TRIAL_DIFFICULTY_LABELS: Record<TrialDifficulty, string> = {
  warmup: '热身',
  standard: '标准',
  challenge: '挑战',
  master: '大师'
}

export const TRIAL_DIFFICULTY_COLORS: Record<TrialDifficulty, string> = {
  warmup: '#7a9ea8',
  standard: '#c9a86c',
  challenge: '#d85050',
  master: '#a67bbf'
}

export const TRIAL_THEME_TYPE_LABELS: Record<TrialThemeType, string> = {
  imagery: '意象',
  emotion: '情感',
  scene: '场景',
  technique: '技法'
}

export interface TrialRareImagery {
  id?: string
  word: string
  points: number
  description: string
}

export interface TrialTitle {
  id?: string
  name: string
  requirement: string
  threshold: number
  color: string
}

export interface TrialSpectra {
  id?: string
  label: string
  value: number
  maxValue: number
  description: string
}

export interface TrialTheme {
  id: string
  name?: string
  title: string
  subtitle: string
  type: TrialThemeType
  difficulty: TrialDifficulty
  description: string
  coreThemes: string[]
  requiredKeywords: string[]
  bonusKeywords: string[]
  rareImageries: TrialRareImagery[]
  forbiddenWords: string[]
  timeLimit: number
  targetPhraseCount: number
  accentColor: string
  backgroundGradient?: string
  icon?: string
  titles: TrialTitle[]
  passThreshold: number
  requiredScore?: number
  unlockCondition?: {
    type: string
    params: Record<string, any>
  }
}

export interface TrialState {
  completedThemes: Record<string, { bestScore: number; bestTitle?: string; attempts: number }>
  unlockedThemeIds: string[]
  unlockedThemes?: string[]
  totalTrials: number
  earnedTitles?: string[]
  clearedThemes?: string[]
  bestScores?: Record<string, number>
  bestTimes?: Record<string, number>
  collectedImageries?: Record<string, number>
  collectedSpectra?: Record<string, number>
  currentStreak?: number
  bestStreak?: number
}

export interface TrialSettlementResult {
  score: number
  grade: ScoreGrade
  title?: TrialTitle
  spectra: TrialSpectra[]
  rareImageriesFound: TrialRareImagery[]
  bonusPoints: number
  deductions: number
  isNewBest: boolean
  isNewRecord?: boolean
  totalAttempts: number
  themeId?: string
  finalScore?: number
  timeUsedSeconds?: number
  earnedImageries?: TrialRareImagery[]
  earnedTitles?: TrialTitle[]
  earnedSpectra?: TrialSpectra[]
  unlockedPhrases?: string[]
}

export type AnnotationType = 'praise' | 'suggestion' | 'correction' | 'question'

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  praise: '赞赏',
  suggestion: '建议',
  correction: '纠正',
  question: '疑问'
}

export const ANNOTATION_TYPE_COLORS: Record<AnnotationType, string> = {
  praise: '#ffd700',
  suggestion: '#4a9eff',
  correction: '#ff6b6b',
  question: '#9b59b6'
}

export interface Annotation {
  id: string
  type: AnnotationType
  phraseId?: string
  text: string
  comment: string
  createdAt: number
}

export interface CompositionVersion {
  id: string
  compositionId: string
  phrases: Phrase[]
  score: ScoreBreakdown
  title: string
  createdAt: number
  annotations: Annotation[]
  parentVersionId?: string
}

export type ReviewStatus = 'pending' | 'in_progress' | 'completed'

export interface ReviewState {
  activeReviewId: string | null
  reviews: Record<string, MentorReviewSession>
}

export interface MentorReviewSession {
  id: string
  compositionId: string
  originalVersion: CompositionVersion
  currentVersion: CompositionVersion
  status: ReviewStatus
  mentorName: string
  mentorAvatar: string
  annotations: Annotation[]
  overallComment: string
  suggestions: string[]
  startedAt: number
  completedAt?: number
}

export type ReputationRank = 'novice' | 'scholar' | 'master' | 'sage' | 'immortal'
export type SubmissionStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'exhibited'
export type ReviewVerdict = 'accept' | 'revise' | 'reject'

export const REPUTATION_RANK_ORDER: ReputationRank[] = ['novice', 'scholar', 'master', 'sage', 'immortal']
export const REPUTATION_RANK_MIN: Record<ReputationRank, number> = {
  novice: 0,
  scholar: 100,
  master: 500,
  sage: 1500,
  immortal: 4000
}
export const REPUTATION_RANK_COLORS: Record<ReputationRank, string> = {
  novice: '#8b9a85',
  scholar: '#7a9ea8',
  master: '#c9a86c',
  sage: '#a67bbf',
  immortal: '#d85050'
}
export const REPUTATION_RANK_ICONS: Record<ReputationRank, string> = {
  novice: '🌱',
  scholar: '📖',
  master: '🎓',
  sage: '🏮',
  immortal: '✨'
}

export interface RareChapter {
  id: string
  chapterId: string
  title: string
  subtitle: string
  description: string
  rarity: AchievementRarity | 'epic'
  reputationRequired?: number
  requiredRank?: ReputationRank
  requiredReputation?: number
  theme: string
  accentColor: string
  bonusPhrases: Phrase[]
}

export interface PoetrySocietyState {
  reputation: number
  rank: ReputationRank
  currentRank?: ReputationRank
  joinDate: number
  submissions: SocietySubmission[]
  exhibitions: ExhibitionEntry[]
  mentorReviews: number
  totalAccepted: number
  weeklyContestEntries: number
}

export interface SocietySubmission {
  id: string
  compositionId: string
  title: string
  submittedAt: number
  status: SubmissionStatus
  reviewStartedAt?: number
  reviewedAt?: number
  verdict?: ReviewVerdict
  reviewerName?: string
  feedback?: string
  reputationChange: number
  exhibited: boolean
}

export interface ExhibitionEntry {
  id: string
  compositionId: string
  title: string
  authorName: string
  exhibitedAt: number
  likes: number
  comments: number
  theme: string
}

export interface StoryEvent {
  id: string
  title: string
  description: string
  chapterId: string
  triggerType: 'first_entry' | 'score_milestone' | 'phrase_count' | 'quest_complete'
  triggerParams: Record<string, any>
  narrative: string
  choices?: { id: string; text: string; consequence: string }[]
  rewards?: Record<string, any>
}

export interface MapNode {
  id: string
  label: string
  x: number
  y: number
  type: 'chapter' | 'landmark' | 'hidden' | 'event'
  chapterId?: string
  unlocked: boolean
  visited: boolean
  connections: string[]
  icon?: string
}

