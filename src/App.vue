<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Chapter, CanvasPhrase, Phrase, PhraseCategory, ScoreBreakdown, Composition, GameState, QuestState, SideQuest, QuestCondition, HistorySnapshot, CanvasState } from '@/types'
import { chapters, getChapterById } from '@/data/chapters'
import { sideQuests, getQuestsByChapter, getQuestById } from '@/data/sideQuests'
import { rewardPhrases, refreshPoolByCategory, createPhrase } from '@/data/phrases'
import { calculateScore, generatePoemTitle } from '@/utils/scoring'
import {
  loadGameState, saveGameState, loadCompositions, saveComposition, deleteComposition,
  unlockChapter, isChapterUnlocked,
  saveEditingComposition, loadEditingComposition, clearEditingComposition
} from '@/utils/storage'
import type { EditingCompositionState } from '@/utils/storage'
import {
  loadQuestState, saveQuestState, unlockQuest, completeQuest, claimReward,
  isQuestUnlocked, isQuestCompleted, isRewardClaimed, addWeightBoost,
  addChapterRewardPhrase, addEarnedTitle
} from '@/utils/storage'
import {
  createHistoryManager, createCanvasState, createSnapshot,
  addSnapshot, deleteSnapshot, loadSnapshots, setCurrentSnapshot, renameSnapshot
} from '@/utils/history'
import { musicPlayer } from '@/utils/music'

import TopHeader from '@/components/TopHeader.vue'
import PhrasePool from '@/components/PhrasePool.vue'
import CanvasBoard from '@/components/CanvasBoard.vue'
import ScorePanel from '@/components/ScorePanel.vue'
import ChapterSelect from '@/components/ChapterSelect.vue'
import Portfolio from '@/components/Portfolio.vue'
import SaveDialog from '@/components/SaveDialog.vue'
import SideQuestPanel from '@/components/SideQuestPanel.vue'
import SnapshotPanel from '@/components/SnapshotPanel.vue'

const gameState = ref<GameState>(loadGameState())

const currentChapterId = ref(gameState.value.currentChapterId)
const boardPhrases = ref<CanvasPhrase[]>([])
const compositions = ref<Composition[]>(loadCompositions())

const showChapters = ref(false)
const showPortfolio = ref(false)
const showSaveDialog = ref(false)
const showQuestPanel = ref(false)
const showSnapshotPanel = ref(false)
const justUnlockedChapter = ref<string | null>(null)
const questState = ref<QuestState>(loadQuestState())

const snapshotStorage = ref(loadSnapshots())
const editingComposition = ref<EditingCompositionState>(loadEditingComposition())

const isEditingComposition = computed(() => editingComposition.value.compositionId !== null)
const editingOriginalTitle = computed(() => editingComposition.value.originalTitle || '')

const historyManager = createHistoryManager(50)
const canUndo = ref(false)
const canRedo = ref(false)
const isApplyingHistory = ref(false)

const updateHistoryAvailability = () => {
  canUndo.value = historyManager.canUndo()
  canRedo.value = historyManager.canRedo()
}

const pushToHistory = () => {
  if (isApplyingHistory.value) return
  const state = createCanvasState(currentChapterId.value, boardPhrases.value)
  historyManager.push(state)
  updateHistoryAvailability()
}

const applyState = (state: CanvasState | null) => {
  if (!state) {
    boardPhrases.value = []
  } else {
    if (state.chapterId !== currentChapterId.value) {
      currentChapterId.value = state.chapterId
      gameState.value.currentChapterId = state.chapterId
      saveGameState({ currentChapterId: state.chapterId })
    }
    boardPhrases.value = state.phrases.map(p => ({
      ...p,
      isDragging: false,
      dragOffset: { x: 0, y: 0 }
    }))
  }
  updateHistoryAvailability()
}

const handleUndo = () => {
  if (!historyManager.canUndo()) return
  isApplyingHistory.value = true
  const prevState = historyManager.undo()
  applyState(prevState)
  musicPlayer.playPluckSound()
  nextTick(() => {
    isApplyingHistory.value = false
  })
}

const handleRedo = () => {
  if (!historyManager.canRedo()) return
  isApplyingHistory.value = true
  const nextState = historyManager.redo()
  applyState(nextState)
  musicPlayer.playPluckSound()
  nextTick(() => {
    isApplyingHistory.value = false
  })
}

const handleCreateSnapshot = () => {
  if (boardPhrases.value.length === 0) {
    alert('画布为空，无法创建快照')
    return
  }
  const snap = createSnapshot(currentChapterId.value, boardPhrases.value)
  snapshotStorage.value = addSnapshot(snap)
  musicPlayer.playSuccessSound()
}

const handleRestoreSnapshot = (snap: HistorySnapshot) => {
  if (snap.chapterId !== currentChapterId.value) {
    currentChapterId.value = snap.chapterId
    gameState.value.currentChapterId = snap.chapterId
    saveGameState({ currentChapterId: snap.chapterId })
  }
  boardPhrases.value = snap.phrases.map(p => ({
    ...p,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: 0,
    height: 0
  }))
  snapshotStorage.value = setCurrentSnapshot(snap.id)
  historyManager.reset()
  pushToHistory()
  showSnapshotPanel.value = false
  musicPlayer.playPluckSound()
}

const handleDeleteSnapshot = (snapshotId: string) => {
  if (!confirm('确定要删除这个快照吗？')) return
  snapshotStorage.value = deleteSnapshot(snapshotId)
}

const handleRenameSnapshot = (snapshotId: string, newName: string) => {
  snapshotStorage.value = renameSnapshot(snapshotId, newName)
}

const setEditingComposition = (compId: string | null, title: string | null = null) => {
  const state: EditingCompositionState = {
    compositionId: compId,
    originalTitle: title,
    loadedAt: compId ? Date.now() : null
  }
  editingComposition.value = state
  saveEditingComposition(state)
}

const clearEditingState = () => {
  setEditingComposition(null, null)
}

const handleKeydown = (e: KeyboardEvent) => {
  const isMeta = e.metaKey || e.ctrlKey
  if (isMeta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  } else if (isMeta && (e.key === 'z' || e.key === 'Z') && e.shiftKey) {
    e.preventDefault()
    handleRedo()
  } else if (isMeta && e.key === 'y') {
    e.preventDefault()
    handleRedo()
  } else if (isMeta && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

const canvasBoardRef = ref<InstanceType<typeof CanvasBoard> | null>(null)

const currentChapter = computed((): Chapter | null => {
  const ch = getChapterById(currentChapterId.value)
  return ch || null
})

const placedPhraseIds = computed(() => new Set(boardPhrases.value.map(p => p.id)))

const score = computed<ScoreBreakdown>((): ScoreBreakdown => {
  if (!currentChapter.value) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }
  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight
  }))
  return calculateScore(phrases, currentChapter.value, questState.value.activeWeightBoosts)
})

const poemTitle = computed(() => {
  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight
  }))
  return generatePoemTitle(phrases)
})

const unlockedChapterIds = computed(() => {
  const ids: string[] = []
  chapters.forEach(ch => {
    if (isChapterUnlocked(ch.id) || ch.unlocked) {
      ids.push(ch.id)
    }
  })
  return ids
})

const chaptersTitles = computed(() => {
  const map: Record<string, { title: string; accent: string }> = {}
  chapters.forEach(ch => {
    map[ch.id] = { title: ch.title, accent: ch.accentColor }
  })
  return map
})

const currentChapterQuests = computed(() => {
  return getQuestsByChapter(currentChapterId.value)
})

const availableQuestCount = computed(() => {
  const unlocked = sideQuests.filter(q => questState.value.unlockedQuests.includes(q.id))
  const unclaimed = unlocked.filter(q => !questState.value.claimedRewards.includes(q.id))
  return unclaimed.length
})

const enhancedChapterPhrases = computed((): Phrase[] => {
  const ch = currentChapter.value
  if (!ch) return []
  const rewardPhrases = questState.value.chapterRewardPhrases[currentChapterId.value] || []
  return [...ch.phrases, ...rewardPhrases]
})

const handlePhraseSelect = (phrase: Phrase) => {
  canvasBoardRef.value?.addPhrase(phrase)
}

const handleBoardPhrasesUpdate = (phrases: CanvasPhrase[]) => {
  boardPhrases.value = phrases
}

const handleRemovePhrase = (phraseId: string) => {
  boardPhrases.value = boardPhrases.value.filter(p => p.id !== phraseId)
}

const handleToggleMusic = () => {
  gameState.value.musicEnabled = !gameState.value.musicEnabled
  saveGameState({ musicEnabled: gameState.value.musicEnabled })
  if (gameState.value.musicEnabled) {
    musicPlayer.init()
    musicPlayer.play()
  } else {
    musicPlayer.stop()
  }
}

const handleChangeVolume = (vol: number) => {
  gameState.value.musicVolume = vol
  saveGameState({ musicVolume: vol })
  musicPlayer.setVolume(vol)
}

const handleSelectChapter = (chapterId: string) => {
  if (boardPhrases.value.length > 0) {
    const hint = isEditingComposition.value
      ? `切换章节将清空当前编辑中的「${editingOriginalTitle.value}」，确定吗？`
      : '切换章节将清空当前画布，确定吗？'
    if (!confirm(hint)) {
      return
    }
  }
  currentChapterId.value = chapterId
  gameState.value.currentChapterId = chapterId
  saveGameState({ currentChapterId: chapterId })
  boardPhrases.value = []
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  showChapters.value = false
  justUnlockedChapter.value = null
}

const handleReset = () => {
  if (boardPhrases.value.length === 0) return
  const hint = isEditingComposition.value
    ? `确定要清空当前编辑中的「${editingOriginalTitle.value}」吗？将退出编辑态。`
    : '确定要清空画布吗？'
  if (confirm(hint)) {
    boardPhrases.value = []
    snapshotStorage.value = setCurrentSnapshot(null)
    clearEditingState()
    pushToHistory()
  }
}

const handleSave = () => {
  if (boardPhrases.value.length === 0) {
    alert('请先选择一些词句')
    return
  }
  showSaveDialog.value = true
}

const doSaveComposition = (title: string, asNewCopy: boolean) => {
  if (!currentChapter.value) return

  const phrases = boardPhrases.value.map(p => ({
    id: p.id,
    text: p.text,
    category: p.category,
    position: p.position,
    rotation: p.rotation,
    isPlaced: p.isPlaced,
    weight: p.weight
  }))

  const now = Date.now()
  const isEditing = isEditingComposition.value && !asNewCopy
  const existingCompId = editingComposition.value.compositionId

  let composition: Composition
  if (isEditing && existingCompId) {
    const existing = compositions.value.find(c => c.id === existingCompId)
    composition = {
      id: existingCompId,
      chapterId: currentChapterId.value,
      phrases,
      score: score.value,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      title
    }
  } else {
    composition = {
      id: `comp_${now}`,
      chapterId: currentChapterId.value,
      phrases,
      score: score.value,
      createdAt: now,
      updatedAt: now,
      title
    }
  }

  saveComposition(composition)
  compositions.value = loadCompositions()
  musicPlayer.playSuccessSound()

  if (currentChapter.value && score.value.total >= 60) {
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId.value)
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1]
      if (!isChapterUnlocked(nextChapter.id)) {
        unlockChapter(nextChapter.id)
        justUnlockedChapter.value = nextChapter.title
      }
    }
  }

  checkQuestUnlocks()
  checkQuestCompletion()

  showSaveDialog.value = false
  boardPhrases.value = []
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  justUnlockedChapter.value = null
}

const handleConfirmSave = (title: string) => {
  doSaveComposition(title, false)
}

const handleSaveAsNew = (title: string) => {
  doSaveComposition(title, true)
}

const handleLoadComposition = (comp: Composition) => {
  if (comp.chapterId !== currentChapterId.value) {
    currentChapterId.value = comp.chapterId
    gameState.value.currentChapterId = comp.chapterId
    saveGameState({ currentChapterId: comp.chapterId })
  }
  
  boardPhrases.value = comp.phrases.map(p => ({
    ...p,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: 0,
    height: 0
  }))
  
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  setEditingComposition(comp.id, comp.title)
  showPortfolio.value = false
}

const handleDeleteComposition = (id: string) => {
  if (!confirm('确定要删除这首诗吗？')) return
  deleteComposition(id)
  compositions.value = loadCompositions()
  if (editingComposition.value.compositionId === id) {
    clearEditingState()
  }
}

const handleNextChapter = () => {
  showSaveDialog.value = false
  if (justUnlockedChapter.value) {
    const nextCh = chapters.find(ch => ch.title === justUnlockedChapter.value)
    if (nextCh) {
      currentChapterId.value = nextCh.id
      gameState.value.currentChapterId = nextCh.id
      saveGameState({ currentChapterId: nextCh.id })
    }
  }
  boardPhrases.value = []
  historyManager.reset()
  pushToHistory()
  snapshotStorage.value = setCurrentSnapshot(null)
  clearEditingState()
  justUnlockedChapter.value = null
}

const checkCondition = (condition: QuestCondition, ctx: { compositions: Composition[]; boardPhrases: Phrase[]; chapterId: string; score: ScoreBreakdown; unlockedChapterCount: number }): boolean => {
  const { type, params } = condition
  switch (type) {
    case 'score_threshold': {
      const targetChapter = params.chapterId as string
      if (targetChapter === ctx.chapterId) {
        return ctx.score.total >= (params.minScore as number)
      }
      const chapterComps = ctx.compositions.filter(c => c.chapterId === targetChapter)
      return chapterComps.some(c => c.score.total >= (params.minScore as number))
    }
    case 'phrase_combo': {
      const texts = params.texts as string[]
      const boardTexts = new Set(ctx.boardPhrases.map(p => p.text))
      return texts.every(t => boardTexts.has(t))
    }
    case 'composition_count': {
      const targetChapter = params.chapterId as string
      if (targetChapter === '__all__') {
        return ctx.compositions.length >= (params.minCount as number)
      }
      const chapterComps = ctx.compositions.filter(c => c.chapterId === targetChapter)
      return chapterComps.length >= (params.minCount as number)
    }
    case 'chapter_count': {
      return ctx.unlockedChapterCount >= (params.minCount as number)
    }
    case 'category_diversity': {
      const categories = new Set(ctx.boardPhrases.map(p => p.category))
      return categories.size >= (params.minCategories as number)
    }
    default:
      return false
  }
}

const checkQuestUnlocks = () => {
  const ctx = {
    compositions: compositions.value,
    boardPhrases: boardPhrases.value.map(p => ({
      id: p.id, text: p.text, category: p.category,
      position: p.position, rotation: p.rotation,
      isPlaced: p.isPlaced, weight: p.weight
    })),
    chapterId: currentChapterId.value,
    score: score.value,
    unlockedChapterCount: unlockedChapterIds.value.length
  }

  sideQuests.forEach(quest => {
    if (questState.value.unlockedQuests.includes(quest.id)) return
    const allMet = quest.unlockConditions.every(c => checkCondition(c, ctx))
    if (allMet) {
      unlockQuest(quest.id)
      questState.value = loadQuestState()
    }
  })
}

const checkQuestCompletion = () => {
  const ctx = {
    compositions: compositions.value,
    boardPhrases: boardPhrases.value.map(p => ({
      id: p.id, text: p.text, category: p.category,
      position: p.position, rotation: p.rotation,
      isPlaced: p.isPlaced, weight: p.weight
    })),
    chapterId: currentChapterId.value,
    score: score.value,
    unlockedChapterCount: unlockedChapterIds.value.length
  }

  sideQuests.forEach(quest => {
    if (!questState.value.unlockedQuests.includes(quest.id)) return
    if (questState.value.completedQuests.includes(quest.id)) return
    const allMet = quest.completeConditions.every(c => checkCondition(c, ctx))
    if (allMet) {
      completeQuest(quest.id)
      questState.value = loadQuestState()
    }
  })
}

const handleClaimReward = (questId: string) => {
  const quest = getQuestById(questId)
  if (!quest || questState.value.claimedRewards.includes(questId)) return

  quest.rewards.forEach(reward => {
    switch (reward.type) {
      case 'phrase_unlock': {
        const texts = reward.params.phraseTexts as string[]
        const targetChapter = quest.chapterId
        texts.forEach(text => {
          const rp = rewardPhrases[text]
          if (rp) {
            const phrase = createPhrase(rp.text, rp.category, rp.weight)
            addChapterRewardPhrase(targetChapter, phrase)
          }
        })
        break
      }
      case 'phrase_pool_refresh': {
        const targetChapterId = reward.params.chapterId as string
        const category = reward.params.addCategory as PhraseCategory
        const count = reward.params.count as number
        const refreshed = refreshPoolByCategory(category, count)
        if (targetChapterId === '__all__') {
          chapters.forEach(ch => {
            refreshed.forEach(p => {
              addChapterRewardPhrase(ch.id, { ...p, id: `${p.id}_${ch.id}` })
            })
          })
        } else {
          refreshed.forEach(p => {
            addChapterRewardPhrase(targetChapterId, p)
          })
        }
        break
      }
      case 'score_weight_boost': {
        addWeightBoost(reward.params.dimension as string, reward.params.boost as number)
        break
      }
      case 'title_reward': {
        addEarnedTitle(reward.params.title as string)
        break
      }
    }
  })

  claimReward(questId)
  questState.value = loadQuestState()
}

const handleFirstInteraction = () => {
  if (gameState.value.musicEnabled) {
    musicPlayer.init()
    musicPlayer.setVolume(gameState.value.musicVolume)
    musicPlayer.play()
  }
}

onMounted(() => {
  document.addEventListener('click', handleFirstInteraction, { once: true })
  document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true })
  document.addEventListener('keydown', handleKeydown)
  pushToHistory()
  checkQuestUnlocks()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

watch(boardPhrases, () => {
  checkQuestUnlocks()
  checkQuestCompletion()
  if (!isApplyingHistory.value) {
    pushToHistory()
  }
}, { deep: true })
</script>

<template>
  <div class="app-container" :style="{ background: currentChapter?.backgroundGradient || '#0f0f1a' }">
    <TopHeader
      :chapter="currentChapter"
      :musicEnabled="gameState.musicEnabled"
      :musicVolume="gameState.musicVolume"
      :questCount="availableQuestCount"
      :canUndo="canUndo"
      :canRedo="canRedo"
      :snapshotCount="snapshotStorage.snapshots.length"
      :isEditingComposition="isEditingComposition"
      :editingTitle="editingOriginalTitle"
      @toggleMusic="handleToggleMusic"
      @changeVolume="handleChangeVolume"
      @openChapters="showChapters = true"
      @openPortfolio="showPortfolio = true"
      @openQuests="showQuestPanel = true"
      @openSnapshots="showSnapshotPanel = true"
      @undo="handleUndo"
      @redo="handleRedo"
      @save="handleSave"
      @reset="handleReset"
    />
    
    <main class="main-content">
      <div class="left-panel">
        <div v-if="currentChapter" class="chapter-info">
          <div class="chapter-hint">
            <span class="hint-icon">✦</span>
            <span class="hint-text">{{ currentChapter.hint }}</span>
          </div>
        </div>
        
        <div class="board-wrapper">
          <CanvasBoard
            ref="canvasBoardRef"
            :phrases="enhancedChapterPhrases"
            :boardPhrases="boardPhrases"
            :accentColor="currentChapter?.accentColor || '#c9a86c'"
            @update:boardPhrases="handleBoardPhrasesUpdate"
            @remove="handleRemovePhrase"
          />
        </div>
      </div>
      
      <aside class="right-panel">
        <div class="panel-section">
          <ScorePanel
            :score="score"
            :phrasesCount="boardPhrases.length"
            :targetCount="currentChapter?.targetPhraseCount || 5"
            :weightBoosts="questState.activeWeightBoosts"
          />
        </div>
        
        <div class="panel-section pool-section">
          <div class="section-header">
            <span class="section-title">词句池</span>
            <span class="section-count">
              {{ (enhancedChapterPhrases.length) - boardPhrases.length }}
              /
              {{ enhancedChapterPhrases.length }}
            </span>
          </div>
          <div class="pool-wrapper">
            <PhrasePool
              :phrases="enhancedChapterPhrases"
              :placedPhraseIds="placedPhraseIds"
              @select="handlePhraseSelect"
            />
          </div>
        </div>
      </aside>
    </main>
    
    <ChapterSelect
      v-if="showChapters"
      :chapters="chapters"
      :unlockedIds="unlockedChapterIds"
      :currentId="currentChapterId"
      @select="handleSelectChapter"
      @close="showChapters = false"
    />
    
    <Portfolio
      v-if="showPortfolio"
      :compositions="compositions"
      :chaptersTitles="chaptersTitles"
      :editingCompositionId="editingComposition.compositionId"
      @load="handleLoadComposition"
      @delete="handleDeleteComposition"
      @close="showPortfolio = false"
    />
    
    <SaveDialog
      :visible="showSaveDialog"
      :title="poemTitle"
      :score="score"
      :unlockedNext="!!justUnlockedChapter"
      :nextChapterTitle="justUnlockedChapter"
      :isEditing="isEditingComposition"
      :originalTitle="editingOriginalTitle"
      @confirm="handleConfirmSave"
      @saveAsNew="handleSaveAsNew"
      @cancel="showSaveDialog = false"
      @nextChapter="handleNextChapter"
    />
    
    <SideQuestPanel
      v-if="showQuestPanel"
      :quests="sideQuests"
      :questState="questState"
      :currentChapterId="currentChapterId"
      @close="showQuestPanel = false"
      @claim="handleClaimReward"
    />
    
    <SnapshotPanel
      v-if="showSnapshotPanel"
      :snapshots="snapshotStorage.snapshots"
      :currentSnapshotId="snapshotStorage.currentSnapshotId"
      :chaptersTitles="chaptersTitles"
      @restore="handleRestoreSnapshot"
      @delete="handleDeleteSnapshot"
      @rename="handleRenameSnapshot"
      @close="showSnapshotPanel = false"
      @create="handleCreateSnapshot"
    />
    
    <div class="bg-decoration">
      <div class="deco-line" style="top: 10%; left: 5%;"></div>
      <div class="deco-line" style="top: 30%; right: 8%; animation-delay: -2s;"></div>
      <div class="deco-line" style="bottom: 20%; left: 10%; animation-delay: -4s;"></div>
      <div class="deco-dot" style="top: 15%; right: 15%;"></div>
      <div class="deco-dot" style="bottom: 25%; left: 20%; animation-delay: -3s;"></div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background 1s ease;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-line {
  position: absolute;
  width: 1px;
  height: 120px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(201, 168, 108, 0.15),
    transparent
  );
  animation: float 8s ease-in-out infinite;
}

.deco-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(201, 168, 108, 0.2);
  animation: float 6s ease-in-out infinite;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  min-height: 0;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.chapter-info {
  flex-shrink: 0;
}

.chapter-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.hint-icon {
  color: var(--accent-gold);
  font-size: 14px;
}

.hint-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: var(--font-serif);
}

.board-wrapper {
  flex: 1;
  min-height: 0;
}

.right-panel {
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.panel-section {
  flex-shrink: 0;
}

.pool-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 10px;
}

.section-title {
  font-family: var(--font-brush);
  font-size: 15px;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.section-count {
  font-size: 12px;
  color: var(--text-muted);
}

.pool-wrapper {
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .right-panel {
    width: 100%;
    max-height: 40%;
  }
  
  .pool-section {
    min-height: 180px;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 12px;
    gap: 10px;
  }
  
  .right-panel {
    width: 100%;
  }
}
</style>
