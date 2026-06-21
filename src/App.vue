<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Chapter, CanvasPhrase, Phrase, ScoreBreakdown, Composition, GameState } from '@/types'
import { chapters, getChapterById } from '@/data/chapters'
import { calculateScore, generatePoemTitle } from '@/utils/scoring'
import {
  loadGameState, saveGameState, loadCompositions, saveComposition, deleteComposition,
  unlockChapter, isChapterUnlocked
} from '@/utils/storage'
import { musicPlayer } from '@/utils/music'

import TopHeader from '@/components/TopHeader.vue'
import PhrasePool from '@/components/PhrasePool.vue'
import CanvasBoard from '@/components/CanvasBoard.vue'
import ScorePanel from '@/components/ScorePanel.vue'
import ChapterSelect from '@/components/ChapterSelect.vue'
import Portfolio from '@/components/Portfolio.vue'
import SaveDialog from '@/components/SaveDialog.vue'

const gameState = ref<GameState>(loadGameState())

const currentChapterId = ref(gameState.value.currentChapterId)
const boardPhrases = ref<CanvasPhrase[]>([])
const compositions = ref<Composition[]>(loadCompositions())

const showChapters = ref(false)
const showPortfolio = ref(false)
const showSaveDialog = ref(false)
const justUnlockedChapter = ref<string | null>(null)

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
  return calculateScore(phrases, currentChapter.value)
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
    if (!confirm('切换章节将清空当前画布，确定吗？')) {
      return
    }
  }
  currentChapterId.value = chapterId
  gameState.value.currentChapterId = chapterId
  saveGameState({ currentChapterId: chapterId })
  boardPhrases.value = []
  showChapters.value = false
  justUnlockedChapter.value = null
}

const handleReset = () => {
  if (boardPhrases.value.length === 0) return
  if (confirm('确定要清空画布吗？')) {
    boardPhrases.value = []
  }
}

const handleSave = () => {
  if (boardPhrases.value.length === 0) {
    alert('请先选择一些词句')
    return
  }
  showSaveDialog.value = true
  
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
}

const handleConfirmSave = (title: string) => {
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
  const composition: Composition = {
    id: `comp_${now}`,
    chapterId: currentChapterId.value,
    phrases,
    score: score.value,
    createdAt: now,
    updatedAt: now,
    title
  }
  
  saveComposition(composition)
  compositions.value = loadCompositions()
  musicPlayer.playSuccessSound()
  
  showSaveDialog.value = false
  boardPhrases.value = []
  justUnlockedChapter.value = null
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
  
  showPortfolio.value = false
}

const handleDeleteComposition = (id: string) => {
  if (!confirm('确定要删除这首诗吗？')) return
  deleteComposition(id)
  compositions.value = loadCompositions()
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
  justUnlockedChapter.value = null
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
})
</script>

<template>
  <div class="app-container" :style="{ background: currentChapter?.backgroundGradient || '#0f0f1a' }">
    <TopHeader
      :chapter="currentChapter"
      :musicEnabled="gameState.musicEnabled"
      :musicVolume="gameState.musicVolume"
      @toggleMusic="handleToggleMusic"
      @changeVolume="handleChangeVolume"
      @openChapters="showChapters = true"
      @openPortfolio="showPortfolio = true"
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
            :phrases="currentChapter?.phrases || []"
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
          />
        </div>
        
        <div class="panel-section pool-section">
          <div class="section-header">
            <span class="section-title">词句池</span>
            <span class="section-count">
              {{ (currentChapter?.phrases.length || 0) - boardPhrases.length }}
              /
              {{ currentChapter?.phrases.length || 0 }}
            </span>
          </div>
          <div class="pool-wrapper">
            <PhrasePool
              :phrases="currentChapter?.phrases || []"
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
      @confirm="handleConfirmSave"
      @cancel="showSaveDialog = false"
      @nextChapter="handleNextChapter"
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
