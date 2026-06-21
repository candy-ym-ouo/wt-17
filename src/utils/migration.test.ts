/**
 * 数据迁移验证脚本
 * 可以在浏览器控制台中运行 runMigrationTests() 来执行测试
 */

import {
  migrateData,
  needsMigration,
  getSchemaVersion,
  unwrapVersionedData,
  wrapWithVersion,
  CURRENT_SCHEMA_VERSION,
  runAllMigrations,
} from './migration'
import type { Composition, GameState, QuestState, Phrase } from '@/types'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function runTest(name: string, testFn: () => void): void {
  try {
    testFn()
    results.push({ name, passed: true })
    console.log(`  ✓ ${name}`)
  } catch (e) {
    results.push({ name, passed: false, error: (e as Error).message })
    console.log(`  ✗ ${name}`)
    console.log(`    Error: ${(e as Error).message}`)
  }
}

export function runMigrationTests(): void {
  console.group('🧪 数据迁移验证测试')
  results.length = 0

  localStorage.clear()

  console.log('\n📋 版本检测测试:')
  runTest('应该正确识别无版本号的数据为版本 0', () => {
    const oldData = { id: 'test', value: 123 }
    assertEqual(getSchemaVersion(oldData), 0, '版本号')
    assert(needsMigration(oldData) === true, '需要迁移')
  })

  runTest('应该正确识别带版本号的数据', () => {
    const versionedData = {
      _schemaVersion: 1,
      data: { id: 'test' },
    }
    assertEqual(getSchemaVersion(versionedData), 1, '版本号')
    assertEqual(needsMigration(versionedData), CURRENT_SCHEMA_VERSION > 1, '迁移判断')
  })

  runTest('应该识别最新版本的数据不需要迁移', () => {
    const latestData = {
      _schemaVersion: CURRENT_SCHEMA_VERSION,
      data: { id: 'test' },
    }
    assert(needsMigration(latestData) === false, '不需要迁移')
  })

  console.log('\n📦 数据包装和解包测试:')
  runTest('应该正确包装数据带版本号', () => {
    const data = { id: 'test', value: 456 }
    const wrapped = wrapWithVersion(data)
    assertEqual(wrapped._schemaVersion, CURRENT_SCHEMA_VERSION, 'schema版本')
    assertEqual(wrapped.data, data, '数据内容')
    assert(wrapped._migratedAt !== undefined, '迁移时间')
  })

  runTest('应该正确解包带版本的数据', () => {
    const original = { id: 'test', value: 789 }
    const wrapped = wrapWithVersion(original)
    const unwrapped = unwrapVersionedData(wrapped)
    assertEqual(unwrapped, original, '解包后数据')
  })

  runTest('应该直接返回未包装的数据', () => {
    const data = { id: 'test', value: 101 }
    assertEqual(unwrapVersionedData(data), data, '直接返回')
  })

  console.log('\n✍️ Composition 迁移测试:')
  runTest('应该从版本 0 迁移到最新版本', () => {
    const oldComposition: Partial<Composition> = {
      id: 'comp_1',
      chapterId: 'ch1',
      phrases: [
        {
          id: 'p1',
          text: '测试词句',
          category: 'scene',
          position: { x: 100, y: 200 },
          isPlaced: true,
        } as Partial<Phrase> as Phrase,
      ],
      score: { coherence: 80, imagery: 75, rhythm: 70, themeMatch: 85, total: 77.5 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: '测试作品',
    }

    const migrated = migrateData<Composition[]>('compositions', [oldComposition])

    assertEqual(migrated._schemaVersion, CURRENT_SCHEMA_VERSION, 'schema版本')
    assert((migrated._migrationLog?.length ?? 0) > 0, '迁移日志')

    const comp = migrated.data[0]
    assertEqual(comp.collectionIds, [], 'collectionIds')
    assertEqual(comp.creationDuration, 0, 'creationDuration')
    assertEqual(comp.coreImagery, [], 'coreImagery')
    assertEqual(comp.editCount, 0, 'editCount')
    assertEqual(comp.isPinned, false, 'isPinned')

    const phrase = comp.phrases[0]
    assertEqual(phrase.rarity, 'common', 'rarity')
    assertEqual(phrase.weight, 1, 'weight')
    assertEqual(phrase.rotation, 0, 'rotation')
    assert(phrase.source !== undefined, 'source存在')
    assertEqual(phrase.source?.type, 'initial', 'source.type')
  })

  runTest('应该回填缺失的 phrase source 字段', () => {
    const oldPhrase = {
      id: 'p1',
      text: '测试',
      category: 'emotion' as const,
      position: null,
      rotation: 0,
      isPlaced: false,
      weight: 1,
    }

    const oldData: Partial<Composition>[] = [
      {
        id: 'comp_2',
        chapterId: 'ch2',
        phrases: [oldPhrase as Phrase],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const phrase = migrated.data[0].phrases[0]

    assert(phrase.source !== undefined, 'source存在')
    assertEqual(phrase.source?.type, 'initial', 'source.type')
    assertEqual(phrase.source?.chapterId, 'ch2', 'source.chapterId')
    assertEqual(phrase.rarity, 'common', 'rarity')
  })

  console.log('\n🔗 v3 深度补齐 source 测试:')
  runTest('已有 source.type=chapter 但缺少 chapterId 时应补齐', () => {
    const oldData = [
      {
        id: 'comp_v3_1',
        chapterId: 'ch3',
        phrases: [
          {
            id: 'p1',
            text: '明月',
            category: 'scene',
            position: null,
            rotation: 0,
            isPlaced: true,
            weight: 1,
            rarity: 'common',
            source: { type: 'chapter' },
          },
        ] as Phrase[],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const source = migrated.data[0].phrases[0].source

    assertEqual(source.chapterId, 'ch3', 'chapterId 补齐')
    assertEqual(source.type, 'chapter', 'type 不变')
    assert(!!source.description, 'description 已补齐')
  })

  runTest('已有 source.type=initial 但缺少 chapterId 和 description 时应补齐', () => {
    const oldData = [
      {
        id: 'comp_v3_2',
        chapterId: 'ch2',
        phrases: [
          {
            id: 'p2',
            text: '清风',
            category: 'scene',
            position: null,
            rotation: 0,
            isPlaced: true,
            weight: 1,
            rarity: 'common',
            source: { type: 'initial' },
          },
        ] as Phrase[],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const source = migrated.data[0].phrases[0].source

    assertEqual(source.chapterId, 'ch2', 'chapterId 补齐')
    assertEqual(source.type, 'initial', 'type 不变')
    assertEqual(source.description, '初始词池', 'description 补齐')
  })

  runTest('已有 source.type=quest 但缺少 chapterId 时应补齐', () => {
    const oldData = [
      {
        id: 'comp_v3_3',
        chapterId: 'ch1',
        phrases: [
          {
            id: 'p3',
            text: '奖励词',
            category: 'emotion',
            position: null,
            rotation: 0,
            isPlaced: true,
            weight: 2,
            rarity: 'rare',
            source: { type: 'quest', questId: 'q1' },
          },
        ] as Phrase[],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const source = migrated.data[0].phrases[0].source

    assertEqual(source.chapterId, 'ch1', 'chapterId 补齐')
    assertEqual(source.questId, 'q1', 'questId 保留')
    assertEqual(source.type, 'quest', 'type 不变')
    assertEqual(source.description, '任务奖励', 'description 补齐')
  })

  runTest('已有 source.type=reward 但缺少 chapterId 和 description 时应补齐', () => {
    const oldData = [
      {
        id: 'comp_v3_4',
        chapterId: 'ch4',
        phrases: [
          {
            id: 'p4',
            text: '传说词',
            category: 'imagery',
            position: null,
            rotation: 0,
            isPlaced: true,
            weight: 3,
            rarity: 'legendary',
            source: { type: 'reward' },
          },
        ] as Phrase[],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const source = migrated.data[0].phrases[0].source

    assertEqual(source.chapterId, 'ch4', 'chapterId 补齐')
    assertEqual(source.type, 'reward', 'type 不变')
    assertEqual(source.description, '奖励词句', 'description 补齐')
  })

  runTest('source 已完整时不应被覆盖', () => {
    const oldData = [
      {
        id: 'comp_v3_5',
        chapterId: 'ch5',
        phrases: [
          {
            id: 'p5',
            text: '完整词',
            category: 'time',
            position: { x: 10, y: 20 },
            rotation: 0,
            isPlaced: true,
            weight: 1,
            rarity: 'rare',
            source: { type: 'chapter', chapterId: 'ch5', description: '章节掉落 · 自由之境' },
          },
        ] as Phrase[],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const migrated = migrateData<Composition[]>('compositions', oldData)
    const source = migrated.data[0].phrases[0].source

    assertEqual(source.chapterId, 'ch5', 'chapterId 保留')
    assertEqual(source.description, '章节掉落 · 自由之境', 'description 保留不被覆盖')
  })

  runTest('v2 已迁移数据再跑 v3 迁移应仍能补齐 source', () => {
    const v2Data = {
      _schemaVersion: 2,
      data: [
        {
          id: 'comp_v2_then_v3',
          chapterId: 'ch3',
          phrases: [
            {
              id: 'p_v2',
              text: '旧迁移词',
              category: 'scene',
              position: null,
              rotation: 0,
              isPlaced: true,
              weight: 1,
              rarity: 'common',
              source: { type: 'chapter' },
            },
          ],
          score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          title: 'test',
          collectionIds: [],
          creationDuration: 0,
          coreImagery: [],
          editCount: 0,
          isPinned: false,
        },
      ],
    }

    const migrated = migrateData<Composition[]>('compositions', v2Data)
    const source = migrated.data[0].phrases[0].source

    assertEqual(migrated._schemaVersion, CURRENT_SCHEMA_VERSION, '版本升至最新')
    assertEqual(source.chapterId, 'ch3', 'chapterId 被补齐')
    assert(!!source.description, 'description 被补齐')
  })

  console.log('\n🎮 GameState 迁移测试:')
  runTest('应该从版本 0 迁移到最新版本', () => {
    const oldData: Partial<GameState> = {
      currentChapterId: 'ch1',
      compositions: [],
      unlockedChapters: ['ch1'],
    }

    const migrated = migrateData<GameState>('gameState', oldData)

    assertEqual(migrated._schemaVersion, CURRENT_SCHEMA_VERSION, 'schema版本')
    assertEqual(migrated.data.musicEnabled, true, 'musicEnabled')
    assertEqual(migrated.data.musicVolume, 0.5, 'musicVolume')
    assert(migrated.data.unlockedChapters.includes('ch1'), '包含ch1')
  })

  runTest('应该确保 unlockedChapters 至少包含 ch1', () => {
    const oldData: Partial<GameState> = {
      currentChapterId: 'ch2',
      compositions: [],
      unlockedChapters: [],
      musicEnabled: true,
      musicVolume: 0.5,
    }

    const migrated = migrateData<GameState>('gameState', oldData)
    assert(migrated.data.unlockedChapters.includes('ch1'), '包含ch1')
  })

  console.log('\n📜 QuestState 迁移测试:')
  runTest('应该从版本 0 迁移到最新版本', () => {
    const oldData: Partial<QuestState> = {
      unlockedQuests: ['q1'],
      completedQuests: [],
      claimedRewards: [],
    }

    const migrated = migrateData<QuestState>('questState', oldData)

    assertEqual(migrated._schemaVersion, CURRENT_SCHEMA_VERSION, 'schema版本')
    assert(migrated.data.streak !== undefined, 'streak存在')
    assertEqual(migrated.data.streak.currentStreak, 0, 'currentStreak')
    assert(migrated.data.phraseCollection !== undefined, 'phraseCollection存在')
    assertEqual(migrated.data.phraseCollection.totalCollected, 0, 'totalCollected')
    assertEqual(migrated.data.activeWeightBoosts, {}, 'activeWeightBoosts')
  })

  runTest('应该重新计算 phraseCollection 的 totalCollected', () => {
    const oldData: Partial<QuestState> = {
      unlockedQuests: [],
      completedQuests: [],
      claimedRewards: [],
      earnedTitles: [],
      activeWeightBoosts: {},
      chapterRewardPhrases: {},
      phraseCollection: {
        collectedPhrases: {
          '词句1': { phraseText: '词句1', firstAcquiredAt: 123, acquiredCount: 1 },
          '词句2': { phraseText: '词句2', firstAcquiredAt: 456, acquiredCount: 2 },
        },
        totalCollected: 999,
      },
      streak: { currentStreak: 0, bestStreak: 0, lastCompositionTime: null, lastScore: null },
    }

    const migrated = migrateData<QuestState>('questState', oldData)
    assertEqual(migrated.data.phraseCollection.totalCollected, 2, 'totalCollected')
  })

  console.log('\n🔄 runAllMigrations 测试:')
  runTest('应该自动检测并迁移所有需要迁移的数据', () => {
    localStorage.clear()

    const oldCompositions: Partial<Composition>[] = [
      {
        id: 'comp_test',
        chapterId: 'ch1',
        phrases: [
          {
            id: 'p1',
            text: '测试',
            category: 'scene' as const,
            position: null,
            rotation: 0,
            isPlaced: true,
            weight: 1,
          } as Phrase,
        ],
        score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'test',
      },
    ]

    const oldGameState: Partial<GameState> = {
      currentChapterId: 'ch1',
      compositions: [],
      unlockedChapters: ['ch1'],
    }

    localStorage.setItem('poem_slices_compositions', JSON.stringify(oldCompositions))
    localStorage.setItem('poem_slices_game_state', JSON.stringify(oldGameState))

    const reports = runAllMigrations()

    assert(reports.length > 0, '有迁移报告')
    
    const compReport = reports.find(r => r.dataType === 'compositions')
    assert(compReport?.migrated === true, 'compositions已迁移')
    assertEqual(compReport?.fromVersion, 0, '起始版本')
    assertEqual(compReport?.toVersion, CURRENT_SCHEMA_VERSION, '目标版本')

    const storedComp = JSON.parse(localStorage.getItem('poem_slices_compositions')!)
    assertEqual(storedComp._schemaVersion, CURRENT_SCHEMA_VERSION, '存储版本')
    assertEqual(storedComp.data[0].collectionIds, [], 'collectionIds')

    localStorage.clear()
  })

  runTest('应该跳过已经是最新版本的数据', () => {
    localStorage.clear()
    const latestData = wrapWithVersion<Composition[]>([])
    localStorage.setItem('poem_slices_compositions', JSON.stringify(latestData))

    const reports = runAllMigrations()
    const compReport = reports.find(r => r.dataType === 'compositions')
    assert(compReport === undefined, '跳过已最新版本')

    localStorage.clear()
  })

  console.log('\n⚠️ 错误处理测试:')
  runTest('应该优雅地处理损坏的数据', () => {
    localStorage.clear()
    localStorage.setItem('poem_slices_compositions', 'invalid json {{{')
    let threw = false
    try {
      runAllMigrations()
    } catch (e) {
      threw = true
    }
    assert(threw === false, '不抛出异常')
    localStorage.clear()
  })

  runTest('应该在单个迁移失败时继续执行其他迁移', () => {
    localStorage.clear()
    localStorage.setItem('poem_slices_compositions', JSON.stringify({ invalid: 'data' }))
    localStorage.setItem('poem_slices_game_state', JSON.stringify({ currentChapterId: 'ch1' }))
    let threw = false
    try {
      runAllMigrations()
    } catch (e) {
      threw = true
    }
    assert(threw === false, '不抛出异常')
    localStorage.clear()
  })

  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`)

  if (passed < total) {
    console.log('\n❌ 失败的测试:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`)
      console.log(`    ${r.error}`)
    })
  } else {
    console.log('\n✅ 所有测试通过!')
  }

  console.groupEnd()
}

declare global {
  interface Window {
    runMigrationTests: typeof runMigrationTests
  }
}

if (typeof window !== 'undefined') {
  window.runMigrationTests = runMigrationTests
  console.log('💡 迁移验证测试已加载到 window.runMigrationTests')
  console.log('   在控制台运行 runMigrationTests() 执行测试')
}

