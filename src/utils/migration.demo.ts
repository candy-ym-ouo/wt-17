/**
 * 数据迁移演示和验证脚本
 * 可以在浏览器控制台中运行以下代码来测试迁移功能
 */

import {
  CURRENT_SCHEMA_VERSION,
  getMigrationStatus,
  runAllMigrations,
  migrateData,
  wrapWithVersion,
  unwrapVersionedData,
  needsMigration,
  getSchemaVersion,
} from './migration'
import type { Composition, GameState } from '@/types'

export function showMigrationStatus(): void {
  const status = getMigrationStatus()
  console.group('📊 数据迁移状态')
  console.log(`当前 Schema 版本: v${CURRENT_SCHEMA_VERSION}`)
  console.table(status)
  console.groupEnd()
}

export function demoMigration(): void {
  console.group('🚀 数据迁移演示')

  const oldComposition: Partial<Composition> = {
    id: 'comp_demo_1',
    chapterId: 'ch1',
    phrases: [
      {
        id: 'p1',
        text: '明月几时有',
        category: 'scene',
        position: { x: 100, y: 200 },
        isPlaced: true,
      } as any,
    ],
    score: { coherence: 80, imagery: 75, rhythm: 70, themeMatch: 85, total: 77.5 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: '水调歌头',
  }

  const oldGameState: Partial<GameState> = {
    currentChapterId: 'ch2',
    compositions: [],
    unlockedChapters: [],
  }

  console.log('原始数据 (v0):', { composition: oldComposition, gameState: oldGameState })

  const migratedComp = migrateData<Composition[]>('compositions', [oldComposition])
  const migratedGame = migrateData<GameState>('gameState', oldGameState)

  console.log('迁移后数据:', {
    composition: migratedComp.data[0],
    gameState: migratedGame.data,
  })

  console.log('迁移日志:')
  console.log('  Compositions:', migratedComp._migrationLog)
  console.log('  GameState:', migratedGame._migrationLog)

  console.groupEnd()
}

export function simulateOldDataAndMigrate(): void {
  console.group('🧪 模拟旧数据迁移')

  localStorage.clear()

  const oldCompositions: Partial<Composition>[] = [
    {
      id: 'comp_old_1',
      chapterId: 'ch1',
      phrases: [
        {
          id: 'p1',
          text: '床前明月光',
          category: 'scene',
          position: { x: 50, y: 50 },
          isPlaced: true,
        } as any,
        {
          id: 'p2',
          text: '疑是地上霜',
          category: 'imagery',
          position: { x: 150, y: 50 },
          isPlaced: true,
        } as any,
      ],
      score: { coherence: 85, imagery: 90, rhythm: 80, themeMatch: 88, total: 85.75 },
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      title: '静夜思',
    },
    {
      id: 'comp_old_2',
      chapterId: 'ch2',
      phrases: [
        {
          id: 'p3',
          text: '春眠不觉晓',
          category: 'time',
          position: null,
          isPlaced: false,
        } as any,
      ],
      score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 172800000,
      title: '春晓',
    },
  ]

  const oldGameState: Partial<GameState> = {
    currentChapterId: 'ch1',
    compositions: [],
    unlockedChapters: ['ch1'],
    musicEnabled: undefined as any,
    musicVolume: undefined as any,
  }

  localStorage.setItem('poem_slices_compositions', JSON.stringify(oldCompositions))
  localStorage.setItem('poem_slices_game_state', JSON.stringify(oldGameState))

  console.log('已写入模拟旧数据到 localStorage')

  const statusBefore = getMigrationStatus()
  console.log('迁移前状态:', statusBefore)

  const reports = runAllMigrations()
  console.log('迁移执行报告:', reports)

  const statusAfter = getMigrationStatus()
  console.log('迁移后状态:', statusAfter)

  const storedComp = JSON.parse(localStorage.getItem('poem_slices_compositions') || '{}')
  const storedGame = JSON.parse(localStorage.getItem('poem_slices_game_state') || '{}')

  console.log('验证迁移结果:')
  console.log('  Compositions 版本:', storedComp._schemaVersion)
  console.log('  GameState 版本:', storedGame._schemaVersion)
  console.log('  作品 1 的 collectionIds:', storedComp.data[0].collectionIds)
  console.log('  作品 1 的 phrase.rarity:', storedComp.data[0].phrases[0].rarity)
  console.log('  GameState musicEnabled:', storedGame.data.musicEnabled)

  localStorage.clear()
  console.log('已清理测试数据')

  console.groupEnd()
}

export function testMigrationEdgeCases(): void {
  console.group('🔍 边缘情况测试')

  console.log('1. 空数据迁移:')
  const emptyMigrated = migrateData<Composition[]>('compositions', [])
  console.log('   结果:', emptyMigrated.data)
  console.log('   版本:', emptyMigrated._schemaVersion)

  console.log('2. 部分字段缺失:')
  const partialPhrase = {
    id: 'p1',
    text: '测试',
    category: 'emotion',
  }
  const partialComp = {
    id: 'comp_partial',
    chapterId: 'ch1',
    phrases: [partialPhrase],
    score: { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 },
    createdAt: Date.now(),
    title: '测试',
  }
  const partialMigrated = migrateData<Composition[]>('compositions', [partialComp as any])
  console.log('   迁移后的 phrase:', partialMigrated.data[0].phrases[0])

  console.log('3. 版本包装和解包:')
  const testData = { foo: 'bar', num: 42 }
  const wrapped = wrapWithVersion(testData)
  const unwrapped = unwrapVersionedData(wrapped)
  console.log('   原始:', testData)
  console.log('   包装:', wrapped)
  console.log('   解包:', unwrapped)
  console.log('   一致:', JSON.stringify(testData) === JSON.stringify(unwrapped))

  console.log('4. 版本检测:')
  console.log('   v0 需要迁移:', needsMigration({ data: {} }))
  console.log('   v1 需要迁移 (当前v' + CURRENT_SCHEMA_VERSION + '):', needsMigration({ _schemaVersion: 1, data: {} }))
  console.log('   v' + CURRENT_SCHEMA_VERSION + ' 需要迁移:', needsMigration({ _schemaVersion: CURRENT_SCHEMA_VERSION, data: {} }))

  console.groupEnd()
}

declare global {
  interface Window {
    migrationDemo: {
      showMigrationStatus: typeof showMigrationStatus
      demoMigration: typeof demoMigration
      simulateOldDataAndMigrate: typeof simulateOldDataAndMigrate
      testMigrationEdgeCases: typeof testMigrationEdgeCases
      CURRENT_SCHEMA_VERSION: number
    }
  }
}

if (typeof window !== 'undefined') {
  window.migrationDemo = {
    showMigrationStatus,
    demoMigration,
    simulateOldDataAndMigrate,
    testMigrationEdgeCases,
    CURRENT_SCHEMA_VERSION,
  }
  console.log('💡 迁移演示工具已加载到 window.migrationDemo')
  console.log('   可用命令:')
  console.log('   - migrationDemo.showMigrationStatus()')
  console.log('   - migrationDemo.demoMigration()')
  console.log('   - migrationDemo.simulateOldDataAndMigrate()')
  console.log('   - migrationDemo.testMigrationEdgeCases()')
}
