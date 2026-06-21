<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Composition, ScoreBreakdown } from '@/types'
import { getScoreGrade } from '@/utils/scoring'

type PostSaveMode = 'finish' | 'continue'

interface Props {
  visible: boolean
  title: string
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
}>()

const inputTitle = ref('')
const postSaveMode = ref<PostSaveMode>('finish')

watch(() => props.visible, (v) => {
  if (v) {
    inputTitle.value = props.title
    postSaveMode.value = 'finish'
  }
})

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
        
        <div class="title-input-group">
          <label class="input-label">题名</label>
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

.btn-cancel, .btn-next, .btn-confirm, .btn-saveas {
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
</style>
