<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Theme } from '@/types'
import { presetThemes, getAllThemes, getThemeById, decorationEmojis, categoryPriority } from '@/data/themes'
import { loadThemeState, setCurrentTheme, saveCustomTheme, deleteCustomTheme, getCustomThemes } from '@/utils/storage'
import { createCustomTheme } from '@/data/themes'
import { musicPlayer } from '@/utils/music'

interface Props {
  visible: boolean
  currentThemeId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', themeId: string): void
}>()

const themeState = ref(loadThemeState())
const activeTab = ref<'preset' | 'custom'>('preset')
const showCreateDialog = ref(false)
const newThemeName = ref('')
const newThemeDescription = ref('')
const selectedKeywords = ref<string[]>([])
const keywordInput = ref('')
const selectedCategories = ref<string[]>([])

const allThemes = computed(() => getAllThemes(getCustomThemes()))
const currentTheme = computed(() => getThemeById(props.currentThemeId, getCustomThemes()))

const presetThemesList = computed(() => allThemes.value.filter(t => !t.isCustom))
const customThemesList = computed(() => allThemes.value.filter(t => t.isCustom))

const availableKeywords = [
  '明月', '落花', '清风', '垂柳', '流水', '春深', '黄昏', '昨夜', '相思', '缱绻',
  '青山', '残阳', '荒原', '寒烟', '孤舟', '日暮', '秋凉', '岁末', '离愁', '寂寥',
  '初雪', '夜雨', '繁星', '古寺', '白云', '黎明', '千年', '清欢', '遥望', '凭栏',
  '翠竹', '小径', '长河', '淡泊', '怅惘', '悲悯', '抚琴', '落笔', '轻吟', '独酌',
  '故人', '归雁', '寒梅', '浊酒', '残梦', '旧约', '素笺', '锦瑟', '玉笛', '青灯',
  '古道', '西风', '无涯', '无我', '太虚', '忘言', '悠然', '惆怅', '蓦然', '沧桑'
]

const categoriesList = [
  { key: 'scene', label: '景物' },
  { key: 'emotion', label: '情感' },
  { key: 'time', label: '时间' },
  { key: 'action', label: '动作' },
  { key: 'imagery', label: '意象' }
]

const decorationsList = [
  { key: 'stars', label: '星辰', emoji: '✨' },
  { key: 'flowers', label: '落花', emoji: '🌸' },
  { key: 'leaves', label: '秋叶', emoji: '🍂' },
  { key: 'snow', label: '飞雪', emoji: '❄️' },
  { key: 'fireflies', label: '萤火', emoji: '🌟' },
  { key: 'clouds', label: '流云', emoji: '☁️' },
  { key: 'waves', label: '水波', emoji: '🌊' },
  { key: 'mountains', label: '远山', emoji: '⛰️' }
]

const gradientsList = [
  { label: '紫夜', value: 'linear-gradient(135deg, #1a0f1e 0%, #2e1a2d 33%, #1a1e2e 66%, #0f1e1a 100%)' },
  { label: '春粉', value: 'linear-gradient(135deg, #2d1a2e 0%, #3d2a3e 50%, #2a1a3d 100%)' },
  { label: '秋金', value: 'linear-gradient(135deg, #2a1f15 0%, #3d2a1a 50%, #2a1a1a 100%)' },
  { label: '夜蓝', value: 'linear-gradient(135deg, #0f1420 0%, #1a1f30 50%, #141825 100%)' },
  { label: '山青', value: 'linear-gradient(135deg, #15201e 0%, #234 50%, #1a2520 100%)' },
  { label: '酒红', value: 'linear-gradient(135deg, #1f1a15 0%, #2e251a 50%, #251f1a 100%)' },
  { label: '雪银', value: 'linear-gradient(135deg, #1a2028 0%, #2a303d 50%, #1f2530 100%)' },
  { label: '忆紫', value: 'linear-gradient(135deg, #1e1a28 0%, #2d253d 50%, #252030 100%)' }
]

const accentColorsList = [
  { label: '金色', value: '#c9a86c' },
  { label: '粉色', value: '#e8a5c4' },
  { label: '橙色', value: '#d4a574' },
  { label: '蓝色', value: '#8ba8c9' },
  { label: '青色', value: '#7aa89a' },
  { label: '紫色', value: '#c98bc4' },
  { label: '银色', value: '#a8c0d4' },
  { label: '淡紫', value: '#b89ac9' }
]

const selectedDecoration = ref('stars')
const selectedGradient = ref(gradientsList[0].value)
const selectedAccent = ref(accentColorsList[0].value)

const categoryWeights = ref<Record<string, number>>({
  scene: 1,
  emotion: 1,
  time: 1,
  action: 1,
  imagery: 1
})

const scoreWeights = ref<Record<string, number>>({
  coherence: 0.25,
  imagery: 0.2,
  rhythm: 0.15,
  themeMatch: 0.25
})

const handleSelectTheme = (theme: Theme) => {
  setCurrentTheme(theme.id)
  themeState.value = loadThemeState()
  musicPlayer.playPluckSound()
  emit('select', theme.id)
  emit('close')
}

const handleDeleteCustomTheme = (themeId: string) => {
  if (!confirm('确定要删除这个自定义主题吗？')) return
  deleteCustomTheme(themeId)
  themeState.value = loadThemeState()
  musicPlayer.playPluckSound()
}

const handleCreateTheme = () => {
  if (!newThemeName.value.trim()) {
    alert('请输入主题名称')
    return
  }
  
  const theme = createCustomTheme(
    newThemeName.value.trim(),
    newThemeDescription.value.trim() || `自定义主题：${newThemeName.value}`,
    {
      accentColor: selectedAccent.value,
      decoration: selectedDecoration.value as any,
      background: {
        gradient: selectedGradient.value,
        particleColor: selectedAccent.value,
        gridOpacity: 0.03,
        watermarkText: newThemeName.value.trim().charAt(0),
        watermarkOpacity: 0.03
      },
      wordPool: {
        keywords: [...selectedKeywords.value],
        categoryWeights: { ...categoryWeights.value } as any,
        rarityBoost: { epic: 0.1, legendary: 0.05 }
      },
      scoring: {
        scoreWeights: { ...scoreWeights.value } as any,
        themeMatchBonus: 0.1,
        preferredCategories: selectedCategories.value as any
      },
      titlePattern: {
        connector: '·',
        preferCategories: ['scene', 'imagery', 'emotion'],
        maxWords: 2,
        template: `{word1}·{word2}`
      }
    }
  )
  
  saveCustomTheme(theme)
  themeState.value = loadThemeState()
  musicPlayer.playSuccessSound()
  
  showCreateDialog.value = false
  newThemeName.value = ''
  newThemeDescription.value = ''
  selectedKeywords.value = []
  selectedCategories.value = []
}

const toggleKeyword = (keyword: string) => {
  const idx = selectedKeywords.value.indexOf(keyword)
  if (idx >= 0) {
    selectedKeywords.value.splice(idx, 1)
  } else {
    selectedKeywords.value.push(keyword)
  }
}

const addCustomKeyword = () => {
  const kw = keywordInput.value.trim()
  if (kw && !selectedKeywords.value.includes(kw)) {
    selectedKeywords.value.push(kw)
    keywordInput.value = ''
  }
}

const toggleCategory = (catKey: string) => {
  const idx = selectedCategories.value.indexOf(catKey)
  if (idx >= 0) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(catKey)
  }
}
</script>

<template>
  <div class="theme-panel-overlay" @click.self="emit('close')">
    <div class="theme-panel">
      <div class="theme-panel-header">
        <div class="header-title-row">
          <span class="header-icon">🎨</span>
          <span class="header-title">主题选择</span>
        </div>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      
      <div class="theme-panel-body">
        <div class="current-theme-preview">
          <div class="preview-label">当前主题</div>
          <div v-if="currentTheme" class="preview-card" :style="{ background: currentTheme.background.gradient }">
            <div class="preview-icon">{{ currentTheme.icon }}</div>
            <div class="preview-info">
              <div class="preview-name">{{ currentTheme.name }}</div>
              <div class="preview-desc">{{ currentTheme.description }}</div>
            </div>
            <div class="preview-decoration">{{ decorationEmojis[currentTheme.decoration] || '✨' }}</div>
          </div>
        </div>
        
        <div class="tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'preset' }"
            @click="activeTab = 'preset'"
          >
            预设主题
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'custom' }"
            @click="activeTab = 'custom'"
          >
            自定义主题
          </button>
        </div>
        
        <div v-if="activeTab === 'preset'" class="themes-grid">
          <div 
            v-for="theme in presetThemesList" 
            :key="theme.id"
            class="theme-card"
            :class="{ selected: theme.id === currentThemeId }"
            @click="handleSelectTheme(theme)"
          >
            <div class="theme-card-bg" :style="{ background: theme.background.gradient }"></div>
            <div class="theme-card-content">
              <div class="theme-card-header">
                <span class="theme-icon">{{ theme.icon }}</span>
                <span class="theme-name">{{ theme.name }}</span>
              </div>
              <div class="theme-card-desc">{{ theme.description }}</div>
              <div class="theme-card-tags">
                <span v-if="theme.wordPool.keywords.length > 0" class="tag">
                  {{ theme.wordPool.keywords.length }} 关键词
                </span>
                <span class="tag decoration-tag">
                  {{ decorationEmojis[theme.decoration] }} {{ theme.decoration }}
                </span>
              </div>
            </div>
            <div v-if="theme.id === currentThemeId" class="selected-badge">✓</div>
          </div>
        </div>
        
        <div v-else class="custom-themes-section">
          <button class="create-btn" @click="showCreateDialog = true">
            <span class="create-icon">+</span>
            创建新主题
          </button>
          
          <div v-if="customThemesList.length === 0" class="empty-custom">
            <div class="empty-icon">✨</div>
            <div class="empty-text">暂无自定义主题</div>
            <div class="empty-sub">点击上方按钮创建属于你的诗意主题</div>
          </div>
          
          <div v-else class="themes-grid">
            <div 
              v-for="theme in customThemesList" 
              :key="theme.id"
              class="theme-card"
              :class="{ selected: theme.id === currentThemeId }"
            >
              <div class="theme-card-bg" :style="{ background: theme.background.gradient }"></div>
              <div class="theme-card-content">
                <div class="theme-card-header">
                  <span class="theme-icon">{{ theme.icon }}</span>
                  <span class="theme-name">{{ theme.name }}</span>
                </div>
                <div class="theme-card-desc">{{ theme.description }}</div>
                <div class="theme-card-tags">
                  <span v-if="theme.wordPool.keywords.length > 0" class="tag">
                    {{ theme.wordPool.keywords.length }} 关键词
                  </span>
                  <span class="tag decoration-tag">
                    {{ decorationEmojis[theme.decoration] }} {{ theme.decoration }}
                  </span>
                </div>
                <div class="theme-card-actions">
                  <button class="action-btn apply-btn" @click.stop="handleSelectTheme(theme)">
                    应用
                  </button>
                  <button class="action-btn delete-btn" @click.stop="handleDeleteCustomTheme(theme.id)">
                    删除
                  </button>
                </div>
              </div>
              <div v-if="theme.id === currentThemeId" class="selected-badge">✓</div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="showCreateDialog" class="create-dialog-overlay" @click.self="showCreateDialog = false">
        <div class="create-dialog">
          <div class="dialog-header">
            <span class="dialog-title">创建自定义主题</span>
            <button class="close-btn" @click="showCreateDialog = false">×</button>
          </div>
          
          <div class="dialog-body">
            <div class="form-group">
              <label class="form-label">主题名称</label>
              <input 
                v-model="newThemeName" 
                type="text" 
                class="form-input" 
                placeholder="输入主题名称"
                maxlength="10"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">主题描述</label>
              <textarea 
                v-model="newThemeDescription" 
                class="form-textarea" 
                placeholder="描述这个主题的意境"
                rows="2"
                maxlength="50"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">背景渐变</label>
                <div class="color-grid">
                  <div 
                    v-for="grad in gradientsList" 
                    :key="grad.value"
                    class="color-option"
                    :class="{ selected: selectedGradient === grad.value }"
                    :style="{ background: grad.value }"
                    @click="selectedGradient = grad.value"
                    :title="grad.label"
                  ></div>
                </div>
              </div>
              
              <div class="form-group half">
                <label class="form-label">主题色</label>
                <div class="color-grid">
                  <div 
                    v-for="color in accentColorsList" 
                    :key="color.value"
                    class="color-option"
                    :class="{ selected: selectedAccent === color.value }"
                    :style="{ background: color.value }"
                    @click="selectedAccent = color.value"
                    :title="color.label"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">装饰效果</label>
              <div class="decoration-grid">
                <div 
                  v-for="dec in decorationsList" 
                  :key="dec.key"
                  class="decoration-option"
                  :class="{ selected: selectedDecoration === dec.key }"
                  @click="selectedDecoration = dec.key"
                >
                  <span class="dec-emoji">{{ dec.emoji }}</span>
                  <span class="dec-label">{{ dec.label }}</span>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">主题关键词 ({{ selectedKeywords.length }})</label>
              <div class="keyword-input-row">
                <input 
                  v-model="keywordInput" 
                  type="text" 
                  class="form-input small" 
                  placeholder="输入自定义关键词"
                  @keyup.enter="addCustomKeyword"
                />
                <button class="add-btn" @click="addCustomKeyword">添加</button>
              </div>
              <div class="keywords-grid">
                <div 
                  v-for="kw in availableKeywords" 
                  :key="kw"
                  class="keyword-chip"
                  :class="{ selected: selectedKeywords.includes(kw) }"
                  @click="toggleKeyword(kw)"
                >
                  {{ kw }}
                </div>
              </div>
              <div v-if="selectedKeywords.length > 0" class="selected-keywords">
                <span class="selected-label">已选：</span>
                <span 
                  v-for="kw in selectedKeywords" 
                  :key="kw"
                  class="selected-chip"
                  @click="toggleKeyword(kw)"
                >
                  {{ kw }} ×
                </span>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">词类权重</label>
              <div class="weight-sliders">
                <div v-for="cat in categoriesList" :key="cat.key" class="weight-row">
                  <span class="weight-label">{{ cat.label }}</span>
                  <input 
                    type="range" 
                    v-model.number="categoryWeights[cat.key]" 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                    class="weight-slider"
                  />
                  <span class="weight-value">{{ categoryWeights[cat.key].toFixed(1) }}</span>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">评分维度权重</label>
              <div class="weight-sliders">
                <div class="weight-row">
                  <span class="weight-label">连贯性</span>
                  <input 
                    type="range" 
                    v-model.number="scoreWeights.coherence" 
                    min="0.1" 
                    max="0.4" 
                    step="0.05"
                    class="weight-slider"
                  />
                  <span class="weight-value">{{ (scoreWeights.coherence * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-row">
                  <span class="weight-label">意象</span>
                  <input 
                    type="range" 
                    v-model.number="scoreWeights.imagery" 
                    min="0.1" 
                    max="0.4" 
                    step="0.05"
                    class="weight-slider"
                  />
                  <span class="weight-value">{{ (scoreWeights.imagery * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-row">
                  <span class="weight-label">韵律</span>
                  <input 
                    type="range" 
                    v-model.number="scoreWeights.rhythm" 
                    min="0.1" 
                    max="0.4" 
                    step="0.05"
                    class="weight-slider"
                  />
                  <span class="weight-value">{{ (scoreWeights.rhythm * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-row">
                  <span class="weight-label">主题契合</span>
                  <input 
                    type="range" 
                    v-model.number="scoreWeights.themeMatch" 
                    min="0.1" 
                    max="0.4" 
                    step="0.05"
                    class="weight-slider"
                  />
                  <span class="weight-value">{{ (scoreWeights.themeMatch * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="dialog-footer">
            <button class="dialog-btn cancel-btn" @click="showCreateDialog = false">取消</button>
            <button class="dialog-btn confirm-btn" @click="handleCreateTheme">创建主题</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.theme-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 20px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.theme-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(201, 168, 108, 0.15);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
}

.header-title {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 28px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.theme-panel-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.current-theme-preview {
  margin-bottom: 24px;
}

.preview-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.preview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 14px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.preview-icon {
  font-size: 32px;
}

.preview-info {
  flex: 1;
}

.preview-name {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.preview-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-decoration {
  font-size: 28px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px;
  border-radius: 10px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-serif);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--accent-gold);
  color: #1a1a2e;
  font-weight: 500;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.theme-card:hover {
  transform: translateY(-3px);
}

.theme-card.selected {
  border-color: var(--accent-gold);
}

.theme-card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.4;
}

.theme-card-content {
  position: relative;
  padding: 18px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

.theme-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.theme-icon {
  font-size: 24px;
}

.theme-name {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.theme-card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 40px;
}

.theme-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  background: rgba(201, 168, 108, 0.15);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 12px;
  font-size: 11px;
  color: var(--accent-gold);
}

.decoration-tag {
  background: rgba(138, 158, 168, 0.15);
  border-color: rgba(138, 158, 168, 0.2);
  color: #8ba8c9;
}

.selected-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  background: var(--accent-gold);
  color: #1a1a2e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.theme-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn {
  background: var(--accent-gold);
  color: #1a1a2e;
}

.apply-btn:hover {
  background: #d4b87a;
}

.delete-btn {
  background: rgba(139, 69, 87, 0.3);
  color: #e8a5c4;
  border: 1px solid rgba(139, 69, 87, 0.3);
}

.delete-btn:hover {
  background: rgba(139, 69, 87, 0.5);
}

.custom-themes-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.2) 0%, rgba(201, 139, 196, 0.2) 100%);
  border: 2px dashed rgba(201, 168, 108, 0.4);
  border-radius: 12px;
  color: var(--accent-gold);
  font-family: var(--font-serif);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: linear-gradient(135deg, rgba(201, 168, 108, 0.3) 0%, rgba(201, 139, 196, 0.3) 100%);
  border-color: rgba(201, 168, 108, 0.6);
}

.create-icon {
  font-size: 20px;
  font-weight: bold;
}

.empty-custom {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-family: var(--font-serif);
  font-size: 16px;
  margin-bottom: 6px;
}

.empty-sub {
  font-size: 13px;
}

.create-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.create-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(201, 168, 108, 0.15);
}

.dialog-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-serif);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-gold);
  background: rgba(0, 0, 0, 0.4);
}

.form-input.small {
  flex: 1;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-serif);
  resize: none;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--accent-gold);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.color-option {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.decoration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.decoration-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(201, 168, 108, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.decoration-option:hover {
  background: rgba(201, 168, 108, 0.1);
}

.decoration-option.selected {
  background: rgba(201, 168, 108, 0.2);
  border-color: var(--accent-gold);
}

.dec-emoji {
  font-size: 24px;
}

.dec-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.keyword-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.add-btn {
  padding: 8px 16px;
  background: var(--accent-gold);
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-size: 13px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #d4b87a;
}

.keywords-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.keyword-chip {
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(201, 168, 108, 0.15);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.keyword-chip:hover {
  background: rgba(201, 168, 108, 0.15);
  color: var(--text-primary);
}

.keyword-chip.selected {
  background: var(--accent-gold);
  color: #1a1a2e;
  border-color: var(--accent-gold);
}

.selected-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(201, 168, 108, 0.1);
}

.selected-label {
  font-size: 12px;
  color: var(--text-muted);
}

.selected-chip {
  padding: 4px 10px;
  background: rgba(201, 168, 108, 0.2);
  border-radius: 12px;
  font-size: 11px;
  color: var(--accent-gold);
  cursor: pointer;
}

.weight-sliders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weight-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weight-label {
  width: 60px;
  font-size: 13px;
  color: var(--text-secondary);
}

.weight-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  outline: none;
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent-gold);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.weight-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.weight-value {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: var(--accent-gold);
  font-family: monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(201, 168, 108, 0.15);
}

.dialog-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.cancel-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.confirm-btn {
  background: var(--accent-gold);
  color: #1a1a2e;
}

.confirm-btn:hover {
  background: #d4b87a;
}
</style>
