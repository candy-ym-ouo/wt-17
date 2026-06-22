<script setup lang="ts">
import { computed } from 'vue'
import type { JieqiChapter, Phrase, ScoreBreakdown, JieqiInfo } from '@/types'

const props = defineProps<{
  chapter: JieqiChapter
  jieqiInfo: JieqiInfo | null
  phrases: Phrase[]
  score: ScoreBreakdown
  boardPhrases: Phrase[]
}>()

const emit = defineEmits<{
  (e: 'selectPhrase', phrase: Phrase): void
  (e: 'removePhrase', phraseId: string): void
  (e: 'submit'): void
  (e: 'quit'): void
}>()

const availablePhrases = computed(() => {
  const placedIds = new Set(props.boardPhrases.map(p => p.id))
  return props.phrases.filter(p => !placedIds.has(p.id))
})

const progressPercentage = computed(() => {
  const target = props.chapter.targetPhraseCount
  const current = props.boardPhrases.length
  return Math.min((current / target) * 100, 100)
})

const canSubmit = computed(() => {
  return props.boardPhrases.length >= props.chapter.targetPhraseCount
})
</script>

<template>
  <div class="jieqi-session-overlay">
    <div class="jieqi-session-modal" :style="{ '--jieqi-color': jieqiInfo?.accentColor || '#c9a86c' }">
      <div class="session-header" :style="{ background: jieqiInfo?.backgroundGradient }">
        <div class="session-jieqi-info">
          <span class="jieqi-icon">{{ jieqiInfo?.icon }}</span>
          <div>
            <h2 class="jieqi-name">{{ jieqiInfo?.name }}</h2>
            <p class="chapter-subtitle">{{ chapter.subtitle }}</p>
          </div>
        </div>
        <button class="session-quit-btn" @click="emit('quit')">退出</button>
      </div>

      <div class="session-body">
        <div class="session-progress">
          <div class="progress-info">
            <span>已选词句</span>
            <span class="progress-count">{{ boardPhrases.length }} / {{ chapter.targetPhraseCount }}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <div class="session-content">
          <div class="session-board">
            <div class="board-label">画布</div>
            <div class="board-area">
              <div v-if="boardPhrases.length === 0" class="board-empty">
                <span class="empty-icon">✍️</span>
                <span class="empty-text">从右侧选择词句开始创作</span>
              </div>
              <div v-else class="board-phrases">
                <div
                  v-for="phrase in boardPhrases"
                  :key="phrase.id"
                  class="board-phrase"
                  :class="`rarity-${phrase.rarity}`"
                  @click="emit('removePhrase', phrase.id)"
                >
                  {{ phrase.text }}
                </div>
              </div>
            </div>
          </div>

          <div class="session-pool">
            <div class="pool-label">词句池</div>
            <div class="pool-area">
              <div
                v-for="phrase in availablePhrases"
                :key="phrase.id"
                class="pool-phrase"
                :class="`rarity-${phrase.rarity}`"
                @click="emit('selectPhrase', phrase)"
              >
                {{ phrase.text }}
              </div>
            </div>
          </div>
        </div>

        <div class="session-footer">
          <div class="score-display">
            <span class="score-label">当前得分</span>
            <span class="score-value">{{ score.total }}</span>
          </div>
          <button 
            class="submit-btn"
            :class="{ disabled: !canSubmit }"
            :disabled="!canSubmit"
            @click="emit('submit')"
          >
            提交作品
          </button>
        </div>

        <div class="session-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">{{ chapter.hint }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jieqi-session-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 26, 0.9);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.jieqi-session-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  animation: collaborativeReveal 0.4s ease-out;
}

.session-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-jieqi-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.jieqi-icon {
  font-size: 42px;
}

.jieqi-name {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.chapter-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.session-quit-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-serif);
  transition: all 0.2s;
}

.session-quit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

.session-body {
  padding: 20px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.session-progress {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-count {
  color: var(--jieqi-color);
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--jieqi-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.session-content {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 300px;
}

.session-board {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.board-label,
.pool-label {
  font-size: 13px;
  color: var(--text-muted);
  padding-left: 4px;
}

.board-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  border: 1px dashed var(--border);
  min-height: 200px;
}

.board-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
}

.board-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.board-phrase {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(201, 168, 108, 0.15);
  border: 1px solid rgba(201, 168, 108, 0.3);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.board-phrase:hover {
  background: rgba(201, 91, 91, 0.2);
  border-color: rgba(201, 91, 91, 0.4);
}

.board-phrase.rarity-rare {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.3);
}

.board-phrase.rarity-epic {
  background: rgba(155, 89, 182, 0.15);
  border-color: rgba(155, 89, 182, 0.3);
}

.board-phrase.rarity-legendary {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
}

.session-pool {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pool-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  overflow-y: auto;
  max-height: 350px;
}

.pool-phrase {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.pool-phrase:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: var(--jieqi-color);
}

.pool-phrase.rarity-rare {
  color: #5dade2;
}

.pool-phrase.rarity-epic {
  color: #bb8fce;
}

.pool-phrase.rarity-legendary {
  color: #f4d03f;
}

.session-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  font-size: 13px;
  color: var(--text-muted);
}

.score-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--jieqi-color);
}

.submit-btn {
  padding: 12px 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--jieqi-color), color-mix(in srgb, var(--jieqi-color) 70%, white));
  color: var(--bg-primary);
  font-size: 15px;
  font-weight: 500;
  font-family: var(--font-serif);
  transition: all 0.3s;
}

.submit-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.submit-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.session-hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 10px;
  border-left: 3px solid var(--accent-gold);
}

.hint-icon {
  font-size: 18px;
}

.hint-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes collaborativeReveal {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 768px) {
  .session-content {
    flex-direction: column;
  }
  
  .session-board,
  .session-pool {
    flex: none;
  }
  
  .board-area {
    min-height: 150px;
  }
  
  .pool-area {
    max-height: 200px;
  }
}
</style>
