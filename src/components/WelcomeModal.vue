<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WelcomeContent, RecommendationAction, GuideStep } from '@/types'

interface Props {
  visible: boolean
  content: WelcomeContent
  entryType: 'new' | 'returning'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'start', chapterId: string): void
  (e: 'selectRecommendation', rec: RecommendationAction): void
}>()

const currentStepIndex = ref(0)
const showRecommendations = ref(false)

const currentStep = computed<GuideStep | null>(() => {
  if (props.content.steps.length === 0) return null
  return props.content.steps[currentStepIndex.value] || null
})

const isLastStep = computed(() => {
  return currentStepIndex.value >= props.content.steps.length - 1
})

const isFirstStep = computed(() => {
  return currentStepIndex.value === 0
})

const recommendedChapters = computed(() => {
  return props.content.recommendations.filter(r => r.type === 'chapter' && r.isRecommended)
})

const recommendedPhrases = computed(() => {
  return props.content.recommendations.filter(r => r.type === 'phrase' && r.isRecommended)
})

const otherRecommendations = computed(() => {
  return props.content.recommendations.filter(r => r.type !== 'chapter' && r.type !== 'phrase')
})

const handleNext = () => {
  if (isLastStep.value) {
    showRecommendations.value = true
  } else {
    currentStepIndex.value++
  }
}

const handlePrev = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const handleSkip = () => {
  emit('close')
}

const handleStart = () => {
  emit('start', props.content.defaultChapterId)
}

const handleSelectRecommendation = (rec: RecommendationAction) => {
  emit('selectRecommendation', rec)
}

const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    chapter: '📚',
    phrase: '✦',
    quest: '🎯',
    theme: '🎨'
  }
  return icons[type] || '✨'
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    chapter: '章节推荐',
    phrase: '词句推荐',
    quest: '任务推荐',
    theme: '主题推荐'
  }
  return labels[type] || '推荐'
}

onMounted(() => {
  currentStepIndex.value = 0
  showRecommendations.value = false
})
</script>

<template>
  <div v-if="visible" class="welcome-overlay" @click.self="handleSkip">
    <div class="welcome-modal" @click.stop>
      <div v-if="!showRecommendations" class="guide-content">
        <div class="modal-header">
          <div class="header-icon" :style="{ color: content.accentColor }">
            {{ content.icon }}
          </div>
          <div class="header-text">
            <h2 class="modal-title">{{ content.title }}</h2>
            <p class="modal-subtitle">{{ content.subtitle }}</p>
          </div>
          <button class="close-btn" @click="handleSkip">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-description">{{ content.description }}</p>
          
          <div v-if="currentStep" class="step-card" :style="{ borderColor: content.accentColor }">
            <div class="step-icon">{{ currentStep.icon }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ currentStep.title }}</h3>
              <p class="step-description">{{ currentStep.description }}</p>
            </div>
          </div>

          <div class="progress-dots">
            <span
              v-for="(step, idx) in content.steps"
              :key="step.id"
              class="dot"
              :class="{
                active: idx === currentStepIndex,
                completed: idx < currentStepIndex
              }"
              :style="idx <= currentStepIndex ? { backgroundColor: content.accentColor } : {}"
            ></span>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="!isFirstStep" class="btn btn-secondary" @click="handlePrev">
            上一步
          </button>
          <button class="btn btn-skip" @click="handleSkip">
            跳过引导
          </button>
          <button class="btn btn-primary" :style="{ backgroundColor: content.accentColor }" @click="handleNext">
            {{ isLastStep ? '查看推荐' : '下一步' }}
          </button>
        </div>
      </div>

      <div v-else class="recommendations-content">
        <div class="modal-header">
          <div class="header-icon" :style="{ color: content.accentColor }">
            ✨
          </div>
          <div class="header-text">
            <h2 class="modal-title">为你推荐</h2>
            <p class="modal-subtitle">基于你的情况，我们精心挑选了以下内容</p>
          </div>
          <button class="close-btn" @click="handleSkip">✕</button>
        </div>

        <div class="modal-body recommendations-body">
          <div v-if="recommendedChapters.length > 0" class="rec-section">
            <h4 class="rec-section-title">
              <span class="section-icon">📚</span>
              推荐章节
            </h4>
            <div class="rec-cards">
              <div
                v-for="rec in recommendedChapters"
                :key="rec.id"
                class="rec-card chapter-card"
                :class="{ recommended: rec.isRecommended }"
                @click="handleSelectRecommendation(rec)"
              >
                <div class="rec-icon">{{ rec.icon }}</div>
                <div class="rec-info">
                  <h5 class="rec-title">{{ rec.title }}</h5>
                  <p class="rec-desc">{{ rec.description }}</p>
                </div>
                <div class="rec-action">→</div>
              </div>
            </div>
          </div>

          <div v-if="recommendedPhrases.length > 0" class="rec-section">
            <h4 class="rec-section-title">
              <span class="section-icon">✦</span>
              推荐词句
            </h4>
            <div class="rec-cards phrases-grid">
              <div
                v-for="rec in recommendedPhrases.slice(0, 4)"
                :key="rec.id"
                class="rec-card phrase-card"
                :class="{ recommended: rec.isRecommended }"
                @click="handleSelectRecommendation(rec)"
              >
                <div class="phrase-text" :style="{ color: content.accentColor }">
                  {{ rec.phrase?.text || '词句' }}
                </div>
                <p class="phrase-desc">{{ rec.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="otherRecommendations.length > 0" class="rec-section">
            <h4 class="rec-section-title">
              <span class="section-icon">💡</span>
              更多建议
            </h4>
            <div class="rec-cards">
              <div
                v-for="rec in otherRecommendations"
                :key="rec.id"
                class="rec-card suggestion-card"
                @click="handleSelectRecommendation(rec)"
              >
                <div class="rec-icon">{{ rec.icon }}</div>
                <div class="rec-info">
                  <h5 class="rec-title">{{ rec.title }}</h5>
                  <p class="rec-desc">{{ rec.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer recommendations-footer">
          <button class="btn btn-secondary" @click="showRecommendations = false">
            返回引导
          </button>
          <button class="btn btn-primary" :style="{ backgroundColor: content.accentColor }" @click="handleStart">
            开始创作
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.welcome-modal {
  width: 100%;
  max-width: 560px;
  background: linear-gradient(145deg, var(--bg-secondary), var(--bg-card));
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent);
}

.header-icon {
  font-size: 40px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 20px currentColor);
}

.header-text {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  letter-spacing: 3px;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 1px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px 28px;
  max-height: 55vh;
  overflow-y: auto;
}

.modal-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0 0 24px 0;
  font-family: var(--font-serif);
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-left: 3px solid;
  border-radius: 12px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.step-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-family: var(--font-serif);
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-weight: 600;
}

.step-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.3s ease;
}

.dot.active {
  transform: scale(1.3);
  box-shadow: 0 0 12px currentColor;
}

.dot.completed {
  opacity: 0.7;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.btn-primary {
  color: #1a1a2e;
  font-weight: 600;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(201, 168, 108, 0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-skip {
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
}

.btn-skip:hover {
  color: var(--text-secondary);
}

.recommendations-body {
  padding: 20px 28px;
}

.rec-section {
  margin-bottom: 24px;
}

.rec-section:last-child {
  margin-bottom: 0;
}

.rec-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.section-icon {
  font-size: 16px;
}

.rec-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phrases-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.rec-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rec-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-gold);
  transform: translateX(4px);
}

.rec-card.recommended {
  border-color: rgba(201, 168, 108, 0.3);
  background: rgba(201, 168, 108, 0.06);
}

.rec-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  font-weight: 500;
  font-family: var(--font-serif);
}

.rec-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.rec-action {
  font-size: 18px;
  color: var(--accent-gold);
  opacity: 0;
  transition: all 0.2s ease;
}

.rec-card:hover .rec-action {
  opacity: 1;
  transform: translateX(4px);
}

.phrase-card {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: center;
}

.phrase-text {
  font-family: var(--font-brush);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 0 20px currentColor;
}

.phrase-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.suggestion-card {
  padding: 12px 16px;
}

.recommendations-footer {
  justify-content: space-between;
}

@media (max-width: 640px) {
  .welcome-modal {
    max-width: 100%;
    border-radius: 16px;
  }
  
  .modal-header {
    padding: 20px 20px 16px;
  }
  
  .modal-title {
    font-size: 22px;
  }
  
  .modal-body {
    padding: 16px 20px;
    max-height: 60vh;
  }
  
  .modal-footer {
    padding: 16px 20px;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 10px 18px;
    font-size: 13px;
  }
  
  .phrases-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
