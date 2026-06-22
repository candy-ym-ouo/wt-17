<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Composition, ScoreBreakdown, TitleOption } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

type PostSaveMode = 'finish' | 'continue'

interface Props {
  visible: boolean
  title: string
  titleOptions?: TitleOption[]
  score: ScoreBreakdown
  unlockedNext: boolean
  nextChapterTitle: string | null
  isEditing: boolean
  originalTitle: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'confirm', title: string, continueEditing: boolean): void
  (e: 'saveAsNew', title: string, continueEditing: boolean): void
  (e: 'cancel'): void
  (e: 'nextChapter'): void
  (e: 'openFraming'): void
}>()

const inputTitle = ref('')
const selectedOptionIndex = ref(0)
const postSaveMode = ref<PostSaveMode>('finish')

const displayOptions = computed((): TitleOption[] => {
  if (props.titleOptions && props.titleOptions.length > 0) {
    return props.titleOptions
  }
  return [{
    title: props.title || '无题',
    strategy: 'classical_style',
    strategyLabel: '推荐',
    description: '系统自动生成标题',
    keywords: [],
    score: 80
  }]
})

watch(() => props.visible, (v) => {
  if (v) {
    selectedOptionIndex.value = 0
    inputTitle.value = displayOptions.value.length > 0 ? displayOptions.value[0].title : (props.title || '无题')
    postSaveMode.value = 'finish'
  }
})

watch(selectedOptionIndex, (idx) => {
  if (displayOptions.value[idx]) {
    inputTitle.value = displayOptions.value[idx].title
  }
})

const selectOption = (index: number) => {
  selectedOptionIndex.value = index
}

const grade = () => getScoreGrade(props.score.total)
</script>

<template>
  <div v-if="visible" class="save-overlay" @click.self="emit('cancel')">
    <div class="save-panel" @click.stop>
      <div class="save-hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-grade" :style="{ color: grade().color, borderColor: grade().color }">
            {{ grade().grade }}
          </div>
          <div class="hero-score" :style="{ color: grade().color }">{{ score.total }}</div>
          <div class="hero-label">分</div>
        </div>
      </div>
      
      <div class="save-body">
        <div v-if="isEditing" class="editing-badge">
          <span class="editing-dot"></span>
          <span>正在编辑「{{ originalTitle }}」</span>
        </div>
        
        <div class="save-comment">
          <span class="quote">「</span>
          {{ grade().comment }}
          <span class="quote">」</span>
        </div>
        
        <div class="title-suggestions-section">
          <label class="input-label">
            <span class="label-icon">✦</span>
            推荐题名
          </label>
          <div class="title-options">
            <button
              v-for="(option, index) in displayOptions"
              :key="option.title + index"
              class="title-option-card"
              :class="{ active: selectedOptionIndex === index }"
              @click="selectOption(index)"
            >
              <div class="option-header">
                <span class="option-title">{{ option.title }}</span>
                <span class="option-score" :style="{ opacity: 0.5 + option.score / 200 }">
                  {{ option.score }}分
                </span>
              </div>
              <div class="option-meta">
                <span class="option-strategy">{{ option.strategyLabel }}</span>
                <span class="option-keywords" v-if="option.keywords.length > 0">
                  {{ option.keywords.join(' · ') }}
                </span>
              </div>
              <div class="option-desc">{{ option.description }}</div>
            </button>
          </div>
        </div>

        <div class="title-input-group">
          <label class="input-label">
            <span class="label-icon">✎</span>
            自定义题名
          </label>
          <input 
            v-model="inputTitle"
            type="text" 
            class="title-input"
            :class="{ 'editing-input': isEditing }"
            placeholder="为这首诗起个名字..."
            maxlength="20"
          />
        </div>

        <div class="post-save-group">
          <label class="input-label">保存后</label>
          <div class="post-save-toggle">
            <button
              class="toggle-option"
              :class="{ active: postSaveMode === 'finish' }"
              @click="postSaveMode = 'finish'"
            >
              <span class="toggle-icon">✓</span>
              完成
            </button>
            <button
              class="toggle-option"
              :class="{ active: postSaveMode === 'continue' }"
              @click="postSaveMode = 'continue'"
            >
              <span class="toggle-icon">✎</span>
              继续润色
            </button>
          </div>
        </div>
        
        <div v-if="unlockedNext" class="unlock-notice">
          <span class="unlock-icon">✧</span>
          <span class="unlock-text">已解锁新章节「{{ nextChapterTitle }}」</span>
        </div>
      </div>
      
      <div class="save-actions">
        <button class="btn-cancel" @click="emit('cancel')">再修改</button>
        <button 
          class="btn-next" 
          v-if="unlockedNext"
          @click="emit('nextChapter')"
        >
          前往新章节
        </button>
        <button 
          v-if="isEditing" 
          class="btn-saveas" 
          @click="emit('saveAsNew', inputTitle || '无题', postSaveMode === 'continue')"
        >
          另存新稿
        </button>
        <button class="btn-confirm" @click="emit('confirm', inputTitle || '无题', postSaveMode === 'continue')">
          {{ isEditing ? '覆盖原稿' : '保存诗笺' }}
        </button>
        <button
          class="btn-framing"
          @click="emit('confirm', inputTitle || '无题', false); emit('openFraming')"
        >
          <span class="framing-icon">🖼️</span>
          <span>装裱</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.save-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.save-panel {
  width: 100%;
  max-width: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  animation: fadeIn 0.4s ease 0.1s both;
}

.save-hero {
  position: relative;
  padding: 40px 24px 24px;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 30%, rgba(201, 168, 108, 0.15), transparent 70%);
}

.hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-grade {
  padding: 4px 18px;
  border: 1px solid;
  border-radius: 20px;
  font-family: var(--font-brush);
  font-size: 16px;
  letter-spacing: 3px;
  margin-bottom: 12px;
}

.hero-score {
  font-family: var(--font-serif);
  font-size: 64px;
  font-weight: 300;
  line-height: 1;
}

.hero-label {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.save-body {
  padding: 0 24px 24px;
}

.save-comment {
  text-align: center;
  padding: 16px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 10px;
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 20px;
}

.quote {
  color: var(--accent-gold);
  font-family: var(--font-brush);
  font-size: 18px;
  margin: 0 4px;
}

.title-input-group {
  margin-bottom: 16px;
}

.post-save-group {
  margin-bottom: 16px;
}

.post-save-toggle {
  display: flex;
  gap: 8px;
}

.toggle-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-family: var(--font-serif);
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.toggle-option:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.toggle-option.active {
  background: rgba(201, 168, 108, 0.1);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.toggle-icon {
  font-size: 12px;
  opacity: 0.6;
}

.toggle-option.active .toggle-icon {
  opacity: 1;
}

.input-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.title-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.title-input:focus {
  border-color: var(--accent-gold);
  background: rgba(255, 255, 255, 0.06);
}

.title-input::placeholder {
  color: var(--text-muted);
}

.unlock-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.1), rgba(201, 168, 108, 0.05));
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.unlock-icon {
  color: var(--accent-gold);
  font-size: 14px;
}

.unlock-text {
  font-size: 13px;
  color: var(--accent-gold);
}

.save-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border);
}

.btn-cancel, .btn-next, .btn-confirm, .btn-saveas, .btn-framing {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--font-serif);
  transition: all 0.2s ease;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.btn-next {
  background: rgba(107, 142, 107, 0.15);
  color: #6b8e6b;
  border: 1px solid rgba(107, 142, 107, 0.3);
}

.btn-next:hover {
  background: rgba(107, 142, 107, 0.25);
}

.btn-confirm {
  background: linear-gradient(135deg, #c9a86c 0%, #a8884c 100%);
  color: #1a1a2e;
  font-weight: 500;
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.editing-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: linear-gradient(90deg, rgba(139, 69, 87, 0.1), rgba(139, 69, 87, 0.05));
  border: 1px solid rgba(139, 69, 87, 0.3);
  border-radius: 10px;
  font-size: 12px;
  color: var(--accent-red);
  animation: fadeIn 0.3s ease;
}

.editing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-red);
  box-shadow: 0 0 8px var(--accent-red);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.editing-input {
  border-color: rgba(139, 69, 87, 0.3) !important;
  background: rgba(139, 69, 87, 0.04) !important;
}

.editing-input:focus {
  border-color: var(--accent-red) !important;
}

.btn-saveas {
  background: rgba(91, 122, 140, 0.15);
  color: var(--accent-blue);
  border: 1px solid rgba(91, 122, 140, 0.3);
}

.btn-saveas:hover {
  background: rgba(91, 122, 140, 0.25);
}

.btn-framing {
  background: rgba(212, 165, 116, 0.15);
  color: #d4a574;
  border: 1px solid rgba(212, 165, 116, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-framing:hover {
  background: rgba(212, 165, 116, 0.25);
}

.framing-icon {
  font-size: 14px;
}

.title-suggestions-section {
  margin-bottom: 16px;
}

.label-icon {
  margin-right: 4px;
  color: var(--accent-gold);
  font-size: 11px;
}

.title-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.title-options::-webkit-scrollbar {
  width: 4px;
}

.title-options::-webkit-scrollbar-track {
  background: transparent;
}

.title-options::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 108, 0.2);
  border-radius: 2px;
}

.title-option-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  font-family: var(--font-serif);
}

.title-option-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(201, 168, 108, 0.3);
}

.title-option-card.active {
  background: rgba(201, 168, 108, 0.08);
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 1px rgba(201, 168, 108, 0.2);
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.title-option-card.active .option-title {
  color: var(--accent-gold);
}

.option-score {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-serif);
  flex-shrink: 0;
}

.title-option-card.active .option-score {
  color: var(--accent-gold);
}

.option-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.option-strategy {
  font-size: 11px;
  color: var(--accent-gold);
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.1);
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.option-keywords {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.8;
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  opacity: 0.85;
}
</style>
