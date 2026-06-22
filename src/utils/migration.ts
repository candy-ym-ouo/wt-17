import type {
  Composition,
  GameState,
  QuestState,
  Collection,
  ThemeState,
  SnapshotStorage,
  Phrase,
  PhraseSource,
  CanvasPhrase,
} from '@/types'
import type { DraftState, EditingCompositionState } from '@/utils/storage'
import { DEFAULT_QUEST_STATE, DEFAULT_STATE } from '@/utils/storage'
import { DEFAULT_THEME_ID } from '@/data/themes'

export const CURRENT_SCHEMA_VERSION = 3

export type StorageDataType =
  | 'compositions'
  | 'gameState'
  | 'questState'
  | 'collections'
  | 'themeState'
  | 'snapshots'
  | 'draft'
  | 'editingComposition'
  | 'userActivity'
  | 'gatheringState'
  | 'achievementProgress'
  | 'travelMapState'
  | 'impromptuTopicState'
  | 'reviewState'
  | 'poetrySocietyState'
  | 'trialState'

export interface VersionedData<T> {
  _schemaVersion: number
  data: T
  _migratedAt?: number
  _migrationLog?: string[]
}

export interface MigrationContext {
  dataType: StorageDataType
  fromVersion: number
  toVersion: number
  timestamp: number
}

export type MigrationFn<T = any> = (data: T, context: MigrationContext) => T

interface MigrationEntry {
  targetVersion: number
  description: string
  migrate: MigrationFn
}

const migrations: Record<StorageDataType, MigrationEntry[]> = {
  compositions: [
    {
      targetVersion: 1,
      description: '添加 schema 版本号和基础字段回填',
      migrate: (data: Composition[], context) => {
        const now = context.timestamp
        return data.map((comp, index) => {
          const migrated: Composition & Partial<VersionedData<Composition>> = {
            ...comp,
            collectionIds: comp.collectionIds ?? [],
            creationDuration: comp.creationDuration ?? 0,
            coreImagery: comp.coreImagery ?? [],
            editCount: comp.editCount ?? 0,
            isPinned: comp.isPinned ?? false,
            phrases: comp.phrases.map(phrase => migratePhrase(phrase, context, comp.chapterId)),
          }
          return migrated as Composition
        })
      },
    },
    {
      targetVersion: 2,
      description: '修复 phrase 的 source 字段，确保 rarity 字段存在',
      migrate: (data: Composition[], context) => {
        return data.map(comp => ({
          ...comp,
          phrases: comp.phrases.map(phrase => ({
            ...phrase,
            rarity: phrase.rarity ?? 'common',
            weight: phrase.weight ?? 1,
            rotation: phrase.rotation ?? 0,
            isPlaced: phrase.isPlaced ?? true,
            source: fillSourceGaps(phrase.source, comp.chapterId),
          })),
          updatedAt: comp.updatedAt ?? comp.createdAt ?? context.timestamp,
        }))
      },
    },
    {
      targetVersion: 3,
      description: '深度补齐已有 source 的 chapterId 和 description 等缺失字段',
      migrate: (data: Composition[]) => {
        return data.map(comp => ({
          ...comp,
          phrases: comp.phrases.map(phrase => ({
            ...phrase,
            source: fillSourceGaps(phrase.source, comp.chapterId),
          })),
        }))
      },
    },
  ],
  gameState: [
    {
      targetVersion: 1,
      description: '回填缺失的游戏状态字段',
      migrate: (data: GameState, context) => {
        return {
          ...DEFAULT_STATE,
          ...data,
          musicEnabled: data.musicEnabled ?? true,
          musicVolume: data.musicVolume ?? 0.5,
        }
      },
    },
    {
      targetVersion: 2,
      description: '确保 unlockedChapters 至少包含 ch1',
      migrate: (data: GameState) => {
        const unlocked = data.unlockedChapters ?? []
        if (!unlocked.includes('ch1')) {
          unlocked.unshift('ch1')
        }
        return {
          ...data,
          unlockedChapters: unlocked,
        }
      },
    },
  ],
  questState: [
    {
      targetVersion: 1,
      description: '回填缺失的任务状态字段',
      migrate: (data: QuestState, context) => {
        const defaultStreak = {
          currentStreak: 0,
          bestStreak: 0,
          lastCompositionTime: null,
          lastScore: null,
        }
        const defaultCollection = {
          collectedPhrases: {},
          totalCollected: 0,
        }
        return {
          ...DEFAULT_QUEST_STATE,
          ...data,
          streak: { ...defaultStreak, ...data.streak },
          phraseCollection: { ...defaultCollection, ...data.phraseCollection },
          activeWeightBoosts: data.activeWeightBoosts ?? {},
          chapterRewardPhrases: data.chapterRewardPhrases ?? {},
          earnedTitles: data.earnedTitles ?? [],
          claimedRewards: data.claimedRewards ?? [],
        }
      },
    },
    {
      targetVersion: 2,
      description: '修复 phraseCollection 的 totalCollected 计算',
      migrate: (data: QuestState) => {
        const collection = data.phraseCollection
        const actualCount = Object.keys(collection.collectedPhrases ?? {}).length
        return {
          ...data,
          phraseCollection: {
            ...collection,
            totalCollected: actualCount,
          },
          unlockedQuests: data.unlockedQuests ?? [],
          completedQuests: data.completedQuests ?? [],
        }
      },
    },
    {
      targetVersion: 3,
      description: '深度补齐 chapterRewardPhrases 中词句的 source 缺失字段',
      migrate: (data: QuestState) => {
        const patchedRewardPhrases: Record<string, Phrase[]> = {}
        for (const [chapterId, phrases] of Object.entries(data.chapterRewardPhrases ?? {})) {
          patchedRewardPhrases[chapterId] = phrases.map((phrase: Phrase) => ({
            ...phrase,
            source: fillSourceGaps(phrase.source, chapterId),
          }))
        }
        return {
          ...data,
          chapterRewardPhrases: patchedRewardPhrases,
        }
      },
    },
  ],
  collections: [
    {
      targetVersion: 1,
      description: '添加 schema 版本号和基础字段回填',
      migrate: (data: Collection[], context) => {
        return data.map(coll => ({
          ...coll,
          compositionIds: coll.compositionIds ?? [],
          updatedAt: coll.updatedAt ?? coll.createdAt ?? context.timestamp,
        }))
      },
    },
    {
      targetVersion: 2,
      description: '确保 accentColor 字段存在',
      migrate: (data: Collection[]) => {
        return data.map(coll => ({
          ...coll,
          accentColor: coll.accentColor ?? '#c9a86c',
          description: coll.description ?? '',
        }))
      },
    },
  ],
  themeState: [
    {
      targetVersion: 1,
      description: '回填缺失的主题状态字段',
      migrate: (data: ThemeState) => {
        return {
          currentThemeId: data.currentThemeId ?? DEFAULT_THEME_ID,
          customThemes: data.customThemes ?? [],
        }
      },
    },
    {
      targetVersion: 2,
      description: '修复自定义主题的 createdAt 字段',
      migrate: (data: ThemeState) => {
        return {
          ...data,
          customThemes: data.customThemes.map(theme => ({
            ...theme,
            createdAt: theme.createdAt ?? Date.now(),
            isCustom: theme.isCustom ?? true,
          })),
        }
      },
    },
  ],
  snapshots: [
    {
      targetVersion: 1,
      description: '回填缺失的快照存储字段',
      migrate: (data: SnapshotStorage) => {
        return {
          snapshots: data.snapshots ?? [],
          currentSnapshotId: data.currentSnapshotId ?? null,
        }
      },
    },
    {
      targetVersion: 2,
      description: '修复快照中的 phrase 字段',
      migrate: (data: SnapshotStorage, context) => {
        return {
          ...data,
          snapshots: data.snapshots.map(snap => ({
            ...snap,
            phrases: snap.phrases.map(p => ({
              ...p,
              width: p.width ?? 0,
              height: p.height ?? 0,
              isDragging: false,
              dragOffset: p.dragOffset ?? { x: 0, y: 0 },
              rarity: p.rarity ?? 'common',
              weight: p.weight ?? 1,
              rotation: p.rotation ?? 0,
              source: fillSourceGaps(p.source, snap.chapterId),
            })),
          })),
        }
      },
    },
    {
      targetVersion: 3,
      description: '深度补齐快照中词句 source 的 chapterId 和 description',
      migrate: (data: SnapshotStorage) => {
        return {
          ...data,
          snapshots: data.snapshots.map(snap => ({
            ...snap,
            phrases: snap.phrases.map(p => ({
              ...p,
              source: fillSourceGaps(p.source, snap.chapterId),
            })),
          })),
        }
      },
    },
  ],
  draft: [
    {
      targetVersion: 1,
      description: '回填缺失的草稿状态字段',
      migrate: (data: DraftState | null, context) => {
        if (!data) return null
        return {
          ...data,
          source: data.source ?? 'auto',
          savedAt: data.savedAt ?? context.timestamp,
          editingCompositionId: data.editingCompositionId ?? null,
          editingOriginalTitle: data.editingOriginalTitle ?? null,
        }
      },
    },
    {
      targetVersion: 2,
      description: '修复草稿中的 phrase 字段',
      migrate: (data: DraftState | null, context) => {
        if (!data) return null
        return {
          ...data,
          phrases: data.phrases.map((p: CanvasPhrase) => ({
            ...p,
            width: p.width ?? 0,
            height: p.height ?? 0,
            isDragging: false,
            dragOffset: p.dragOffset ?? { x: 0, y: 0 },
            rarity: p.rarity ?? 'common',
            weight: p.weight ?? 1,
            rotation: p.rotation ?? 0,
            source: fillSourceGaps(p.source, data.chapterId),
          })),
        }
      },
    },
    {
      targetVersion: 3,
      description: '深度补齐草稿中词句 source 的 chapterId 和 description',
      migrate: (data: DraftState | null) => {
        if (!data) return null
        return {
          ...data,
          phrases: data.phrases.map((p: CanvasPhrase) => ({
            ...p,
            source: fillSourceGaps(p.source, data.chapterId),
          })),
        }
      },
    },
  ],
  editingComposition: [
    {
      targetVersion: 1,
      description: '回填缺失的编辑状态字段',
      migrate: (data: EditingCompositionState) => {
        return {
          compositionId: data.compositionId ?? null,
          originalTitle: data.originalTitle ?? null,
          loadedAt: data.loadedAt ?? null,
        }
      },
    },
    {
      targetVersion: 2,
      description: '确保 loadedAt 是数字或 null',
      migrate: (data: EditingCompositionState) => {
        return {
          ...data,
          loadedAt: typeof data.loadedAt === 'number' ? data.loadedAt : null,
        }
      },
    },
  ],
  userActivity: [
    {
      targetVersion: 1,
      description: '回填缺失的用户活动字段',
      migrate: (data: any) => {
        return {
          firstVisitTime: data.firstVisitTime ?? null,
          lastVisitTime: data.lastVisitTime ?? null,
          totalVisits: data.totalVisits ?? 0,
          totalCompositions: data.totalCompositions ?? 0,
          daysSinceLastVisit: data.daysSinceLastVisit ?? 0,
          completedChapterIds: data.completedChapterIds ?? [],
          hasSeenTutorial: data.hasSeenTutorial ?? false,
          hasDismissedWelcome: data.hasDismissedWelcome ?? false,
        }
      },
    },
  ],
  gatheringState: [],
  achievementProgress: [],
  travelMapState: [],
  impromptuTopicState: [],
  reviewState: [],
  poetrySocietyState: [],
  trialState: [],
}

function fillSourceGaps(source: PhraseSource | undefined | null, chapterId: string): PhraseSource {
  if (!source || typeof source !== 'object') {
    return {
      type: 'chapter',
      chapterId,
      description: `章节掉落`,
    }
  }

  const patched = { ...source }

  if (!patched.chapterId && (patched.type === 'chapter' || patched.type === 'initial')) {
    patched.chapterId = chapterId
  }

  if (!patched.chapterId && patched.type === 'quest') {
    patched.chapterId = chapterId
  }

  if (!patched.chapterId && patched.type === 'reward') {
    patched.chapterId = chapterId
  }

  if (!patched.chapterId && patched.type === 'event') {
    patched.chapterId = chapterId
  }

  if (!patched.description) {
    switch (patched.type) {
      case 'chapter':
        patched.description = `章节掉落`
        break
      case 'quest':
        patched.description = `任务奖励`
        break
      case 'reward':
        patched.description = `奖励词句`
        break
      case 'event':
        patched.description = `事件获得`
        break
      case 'initial':
        patched.description = `初始词池`
        break
    }
  }

  return patched
}

function migratePhrase(phrase: Phrase, context: MigrationContext, fallbackChapterId?: string): Phrase {
  const chapterId = fallbackChapterId ?? ''
  return {
    ...phrase,
    position: phrase.position ?? null,
    rotation: phrase.rotation ?? 0,
    isPlaced: phrase.isPlaced ?? true,
    weight: phrase.weight ?? 1,
    rarity: phrase.rarity ?? 'common',
    source: fillSourceGaps(phrase.source, chapterId),
  }
}

export function getSchemaVersion(rawData: any): number {
  if (rawData && typeof rawData === 'object' && '_schemaVersion' in rawData) {
    return rawData._schemaVersion
  }
  return 0
}

export function needsMigration(rawData: any): boolean {
  const version = getSchemaVersion(rawData)
  return version < CURRENT_SCHEMA_VERSION
}

export function migrateData<T>(
  dataType: StorageDataType,
  rawData: any,
): VersionedData<T> {
  const currentVersion = getSchemaVersion(rawData)
  const now = Date.now()

  let data: T = rawData?._schemaVersion !== undefined ? rawData.data : rawData

  const migrationLog: string[] = []
  const typeMigrations = migrations[dataType] ?? []

  for (const migration of typeMigrations) {
    if (currentVersion < migration.targetVersion) {
      const context: MigrationContext = {
        dataType,
        fromVersion: currentVersion,
        toVersion: migration.targetVersion,
        timestamp: now,
      }

      try {
        data = migration.migrate(data, context) as T
        migrationLog.push(
          `v${context.fromVersion}→v${context.toVersion}: ${migration.description}`,
        )
      } catch (e) {
        console.error(
          `[Migration] Failed to migrate ${dataType} from v${context.fromVersion} to v${context.toVersion}:`,
          e,
        )
        migrationLog.push(
          `v${context.fromVersion}→v${context.toVersion}: FAILED - ${(e as Error).message}`,
        )
      }
    }
  }

  return {
    _schemaVersion: CURRENT_SCHEMA_VERSION,
    data,
    _migratedAt: now,
    _migrationLog: migrationLog.length > 0 ? migrationLog : undefined,
  }
}

export function unwrapVersionedData<T>(versioned: VersionedData<T> | T): T {
  if (versioned && typeof versioned === 'object' && '_schemaVersion' in versioned) {
    return (versioned as VersionedData<T>).data
  }
  return versioned as T
}

export function wrapWithVersion<T>(data: T, version: number = CURRENT_SCHEMA_VERSION): VersionedData<T> {
  return {
    _schemaVersion: version,
    data,
    _migratedAt: Date.now(),
  }
}

export interface MigrationReport {
  dataType: StorageDataType
  fromVersion: number
  toVersion: number
  migrated: boolean
  log: string[]
  duration: number
}

export function runMigrationsForType<T>(
  dataType: StorageDataType,
  rawData: any,
  saveFn: (data: VersionedData<T>) => void,
): MigrationReport {
  const startTime = performance.now()
  const fromVersion = getSchemaVersion(rawData)
  const migrated = needsMigration(rawData)

  let log: string[] = []

  if (migrated) {
    const result = migrateData<T>(dataType, rawData)
    saveFn(result)
    log = result._migrationLog ?? []
  }

  const duration = performance.now() - startTime

  return {
    dataType,
    fromVersion,
    toVersion: CURRENT_SCHEMA_VERSION,
    migrated,
    log,
    duration,
  }
}

export function runAllMigrations(): MigrationReport[] {
  const reports: MigrationReport[] = []
  
  const storageKeys = [
    { key: 'poem_slices_compositions', type: 'compositions' as StorageDataType },
    { key: 'poem_slices_game_state', type: 'gameState' as StorageDataType },
    { key: 'poem_slices_quest_state', type: 'questState' as StorageDataType },
    { key: 'poem_slices_collections', type: 'collections' as StorageDataType },
    { key: 'poem_slices_theme_state', type: 'themeState' as StorageDataType },
    { key: 'poem_slices_snapshots', type: 'snapshots' as StorageDataType },
    { key: 'poem_slices_draft', type: 'draft' as StorageDataType },
    { key: 'poem_slices_editing_composition', type: 'editingComposition' as StorageDataType },
  ]

  for (const { key, type } of storageKeys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      
      const data = JSON.parse(raw)
      if (!needsMigration(data)) continue
      
      const report = runMigrationsForType(
        type,
        data,
        (versioned) => localStorage.setItem(key, JSON.stringify(versioned)),
      )
      reports.push(report)
      
      if (report.migrated && report.log.length > 0) {
        console.info(`[Migration] ${type} migrated from v${report.fromVersion} to v${report.toVersion}`, report.log)
      }
    } catch (e) {
      console.error(`[Migration] Failed to migrate ${type}:`, e)
    }
  }

  return reports
}

export function getMigrationStatus(): Record<StorageDataType, { current: number; latest: number; needsUpgrade: boolean }> {
  const status: any = {}
  
  const storageKeys: Record<StorageDataType, string> = {
    compositions: 'poem_slices_compositions',
    gameState: 'poem_slices_game_state',
    questState: 'poem_slices_quest_state',
    collections: 'poem_slices_collections',
    themeState: 'poem_slices_theme_state',
    snapshots: 'poem_slices_snapshots',
    draft: 'poem_slices_draft',
    editingComposition: 'poem_slices_editing_composition',
    userActivity: 'poem_slices_user_activity',
    gatheringState: 'poem_slices_gathering_state',
    achievementProgress: 'poem_slices_achievement_progress',
    travelMapState: 'poem_slices_travel_map_state',
    impromptuTopicState: 'poem_slices_impromptu_state',
    reviewState: 'poem_slices_review_state',
    poetrySocietyState: 'poem_slices_poetry_society',
    trialState: 'poem_slices_trial_state',
  }

  const types: StorageDataType[] = [
    'compositions',
    'gameState',
    'questState',
    'collections',
    'themeState',
    'snapshots',
    'draft',
    'editingComposition',
    'userActivity',
    'gatheringState',
    'achievementProgress',
    'travelMapState',
    'impromptuTopicState',
    'reviewState',
    'poetrySocietyState',
    'trialState',
  ]

  types.forEach(type => {
    let current = 0
    try {
      const raw = localStorage.getItem(storageKeys[type])
      if (raw) {
        const data = JSON.parse(raw)
        current = getSchemaVersion(data)
      }
    } catch (e) {
      console.error(`[Migration] Failed to get status for ${type}:`, e)
    }
    
    status[type] = {
      current,
      latest: CURRENT_SCHEMA_VERSION,
      needsUpgrade: current < CURRENT_SCHEMA_VERSION,
    }
  })
  
  return status
}
