<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { StoryEvent } from '@/types'
import { createRewardPhrase } from '@/data/phrases'
import { addChapterRewardPhrase, addWeightBoost, addEarnedTitle, collectPhrase } from '@/utils/storage'

interface Props {
  event: StoryEvent
  chapterId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'choice', choiceId: string, consequence: any): void
}>()

const currentLineIndex = ref(0)
const showChoices = ref(false)
const isTyping = ref(false)
const displayedText = ref('')
const typingSpeed = 30

const currentContent = computed(() => {
  return props.event.content[currentLineIndex.value] || ''
})

const totalLines = computed(() => props.event.content.length)

const isLastLine = computed(() => currentLineIndex.value >= totalLines.value - 1)

const typeText = (text: string) => {
  isTyping.value = true
  displayedText.value = ''
  let index = 0

  const type = () => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
      setTimeout(type, typingSpeed)
    } else {
      isTyping.value = false
    }
  }

  type()
}

const skipTyping = () => {
  if (isTyping.value) {
    isTyping.value = false
    displayedText.value = currentContent.value
  }
}

const handleNext = () => {
  if (isTyping.value) {
    skipTyping()
    return
  }

  if (currentLineIndex.value < totalLines.value - 1) {
    currentLineIndex.value++
    typeText(currentContent.value)
  } else if (props.event.choices && props.event.choices.length > 0) {
    showChoices.value = true
  } else {
    handleClose()
  }
}

const handleChoiceSelect = (choice: NonNullable<StoryEvent['choices']>[0]) => {
  if (choice.consequence) {
    const { type, params } = choice.consequence

    switch (type) {
      case 'phrase_unlock': {
        const phraseTexts = params.phraseTexts as string[]
        phraseTexts.forEach(text => {
          const phrase = createRewardPhrase(text)
          if (phrase) {
            addChapterRewardPhrase(props.chapterId, phrase)
            collectPhrase(text, props.chapterId)
          }
        })
        break
      }
      case 'score_boost': {
        addWeightBoost(params.dimension as string, params.boost as number)
        break
      }
      case 'title': {
        addEarnedTitle(params.title as string)
        break
      }
    }

    emit('choice', choice.id, choice.consequence)
  }

  handleClose()
}

const handleClose = () => {
  emit('close')
}

onMounted(() => {
  typeText(currentContent.value)
})
</script>

<template>
  <div class="story-overlay" @click.self="handleClose">
    <div class="story-panel" @click.stop>
      <div
        class="story-background"
        :style="{ background: event.backgroundGradient }"
      >
        <div class="story-particles"></div>
      </div>

      <div class="story-content">
        <div class="story-header">
          <h2 class="story-title" :style="{ color: event.accentColor }">
            {{ event.title }}
          </h2>
          <div v-if="event.character" class="story-character">
            <span class="character-label">对话</span>
            <span class="character-name">{{ event.character }}</span>
          </div>
        </div>

        <div class="story-body" @click="handleNext">
          <div class="story-text-wrapper">
            <p class="story-text">
              {{ displayedText }}
              <span v-if="isTyping" class="typing-cursor">|</span>
            </p>
          </div>

          <div class="story-progress">
            <span v-for="(line, idx) in event.content" :key="idx" class="progress-dot"
              :class="{ active: idx <= currentLineIndex, completed: idx < currentLineIndex }"
            ></span>
          </div>
        </div>

        <div v-if="!showChoices" class="story-footer">
          <div class="story-hint">
            <span v-if="isTyping">点击跳过</span>
            <span v-else-if="!isLastLine">点击继续</span>
            <span v-else>{{ event.choices && event.choices.length > 0 ? '请选择' : '点击关闭' }}</span>
          </div>
          <button class="continue-btn" :style="{ color: event.accentColor }" @click="handleNext">
            {{ isTyping ? '>>' : (isLastLine && (!event.choices || event.choices.length === 0) ? '✓' : '→') }}
          </button>
        </div>

        <div v-if="showChoices && event.choices" class="story-choices">
          <div class="choices-label">请做出你的选择：</div>
          <div class="choices-list">
            <button
              v-for="choice in event.choices"
              :key="choice.id"
              class="choice-btn"
              :style="{ borderColor: event.accentColor }"
              @click="handleChoiceSelect(choice)"
            >
              <span class="choice-text">{{ choice.text }}</span>
              <span v-if="choice.consequence" class="choice-reward">
                <span v-if="choice.consequence.type === 'phrase_unlock'">📜 解锁词句</span>
                <span v-else-if="choice.consequence.type === 'score_boost'">⭐ 评分加成</span>
                <span v-else-if="choice.consequence.type === 'title'">👑 获得称号</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <button class="story-close" @click="handleClose">
        <span>✕</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.story-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.4s ease;
}

.story-panel {
  position: relative;
  width: 100%;
  max-width: 700px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease;
}

.story-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.4;
}

.story-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  animation: shimmer 8s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.story-content {
  position: relative;
  z-index: 1;
  padding: 40px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%);
}

.story-header {
  text-align: center;
  margin-bottom: 32px;
}

.story-title {
  font-family: var(--font-brush);
  font-size: 36px;
  letter-spacing: 6px;
  margin-bottom: 8px;
  text-shadow: 0 0 30px currentColor;
  animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.story-character {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
}

.character-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.character-name {
  font-weight: 500;
  color: var(--text-primary);
}

.story-body {
  min-height: 180px;
  margin-bottom: 24px;
  cursor: pointer;
}

.story-text-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.story-text {
  font-size: 18px;
  color: var(--text-primary);
  line-height: 2;
  text-align: center;
  letter-spacing: 1px;
  font-family: var(--font-serif);
}

.typing-cursor {
  animation: blink 0.8s step-end infinite;
  color: var(--accent-gold);
  font-weight: 300;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.story-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: var(--accent-gold);
  transform: scale(1.2);
}

.progress-dot.completed {
  background: #6b8e6b;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.story-hint {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.continue-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid currentColor;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.continue-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.story-choices {
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.choices-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  text-align: left;
  transition: all 0.3s ease;
  cursor: pointer;
}

.choice-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.choice-text {
  font-family: var(--font-serif);
  letter-spacing: 0.5px;
}

.choice-reward {
  font-size: 11px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.story-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.story-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .story-content {
    padding: 24px 20px;
  }

  .story-title {
    font-size: 28px;
    letter-spacing: 4px;
  }

  .story-text {
    font-size: 16px;
    line-height: 1.8;
  }

  .choice-btn {
    padding: 14px 16px;
    font-size: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .choice-reward {
    align-self: flex-end;
  }
}
</style>
