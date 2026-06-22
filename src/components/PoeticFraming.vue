<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Composition, FramingConfig, FramingLayout, TitleStyle, TitlePosition, SealConfig, SealType, Phrase } from '@/types'
import {
  FRAMING_LAYOUT_LABELS, FRAMING_LAYOUT_ICONS,
  TITLE_STYLE_LABELS, TITLE_POSITION_LABELS,
  SEAL_TYPE_LABELS, PAPER_TEXTURE_LABELS,
  DEFAULT_FRAMING_CONFIG
} from '@/types'
import { getScoreGrade } from '@/utils/scoring'

interface Props {
  composition: Composition
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const config = ref<FramingConfig>({ ...DEFAULT_FRAMING_CONFIG, seals: [] })
const activeTab = ref<'layout' | 'title' | 'seal' | 'export'>('layout')
const isExporting = ref(false)
const exportSuccess = ref(false)
const previewRef = ref<HTMLElement | null>(null)

const sealingText = ref('')
const sealingType = ref<SealType>('author')
const sealingShape = ref<'square' | 'round' | 'oval'>('square')
const sealingColor = ref('#c23a2b')

const layoutOptions: { value: FramingLayout; label: string; icon: string }[] = Object.entries(FRAMING_LAYOUT_LABELS).map(([k, v]) => ({
  value: k as FramingLayout,
  label: v,
  icon: FRAMING_LAYOUT_ICONS[k as FramingLayout]
}))

const titleStyleOptions: { value: TitleStyle; label: string }[] = Object.entries(TITLE_STYLE_LABELS).map(([k, v]) => ({
  value: k as TitleStyle,
  label: v
}))

const titlePositionOptions: { value: TitlePosition; label: string }[] = Object.entries(TITLE_POSITION_LABELS).map(([k, v]) => ({
  value: k as TitlePosition,
  label: v
}))

const sealTypeOptions: { value: SealType; label: string }[] = Object.entries(SEAL_TYPE_LABELS).map(([k, v]) => ({
  value: k as SealType,
  label: v
}))

const paperTextureOptions = Object.entries(PAPER_TEXTURE_LABELS).map(([k, v]) => ({
  value: k,
  label: v
}))

const backgroundPresets = [
  { color: '#f5f0e8', label: '素宣' },
  { color: '#e8e0d0', label: '古黄' },
  { color: '#d4cfc4', label: '烟灰' },
  { color: '#2c2c2c', label: '墨底' },
  { color: '#1a1a2e', label: '夜蓝' },
  { color: '#f0e6d6', label: '象牙' },
  { color: '#c9b896', label: '金笺' },
  { color: '#e0d4c4', label: '绢色' }
]

const borderPresets = [
  { color: '#c9a86c', label: '金边' },
  { color: '#8b4557', label: '朱边' },
  { color: '#4a5568', label: '墨边' },
  { color: '#5b7a8c', label: '青边' },
  { color: '#6b8e6b', label: '翠边' },
  { color: '#9b59b6', label: '紫边' }
]

const moodSealTexts = ['诗情', '墨趣', '逸兴', '清欢', '雅韵', '闲情', '妙悟', '心远']
const idiomSealTexts = ['妙笔生花', '气韵生动', '出神入化', '行云流水', '浑然天成', '独具匠心']
const authorSealTexts = ['诗客', '墨人', '隐者', '山人', '渔翁', '逸士']

const suggestedSealTexts = computed(() => {
  switch (sealingType.value) {
    case 'mood': return moodSealTexts
    case 'idiom': return idiomSealTexts
    case 'author': return authorSealTexts
    case 'zodiac': return ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    default: return []
  }
})

const addSeal = (text?: string) => {
  const sealText = text || sealingText.value
  if (!sealText.trim()) return

  const existingCount = config.value.seals.length
  const seal: SealConfig = {
    id: `seal_${Date.now()}`,
    type: sealingType.value,
    text: sealText.trim(),
    position: { x: 80 + existingCount * 5, y: 85 + existingCount * 3 },
    rotation: Math.random() * 10 - 5,
    color: sealingColor.value,
    shape: sealingShape.value,
    size: sealingShape.value === 'square' ? 36 : 40,
    opacity: 0.9
  }
  config.value.seals.push(seal)
  sealingText.value = ''
}

const removeSeal = (id: string) => {
  config.value.seals = config.value.seals.filter(s => s.id !== id)
}

const grade = computed(() => getScoreGrade(props.composition.score.total))

const phraseLines = computed(() => {
  const phrases = props.composition.phrases
  if (phrases.length === 0) return []
  return phrases.map(p => p.text)
})

const paperTextureStyle = computed(() => {
  switch (config.value.paperTexture) {
    case 'rice': return 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(0,0,0,0.02)\'/%3E%3C/svg%3E")'
    case 'bamboo': return 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'2\' height=\'2\' fill=\'rgba(0,0,0,0.03)\'/%3E%3C/svg%3E")'
    case 'silk': return 'url("data:image/svg+xml,%3Csvg width=\'8\' height=\'8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'0\' y1=\'0\' x2=\'8\' y2=\'8\' stroke=\'rgba(0,0,0,0.02)\' stroke-width=\'0.5\'/%3E%3C/svg%3E")'
    case 'aged': return 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\' fill=\'rgba(139,69,19,0.04)\'/%3E%3Ccircle cx=\'8\' cy=\'7\' r=\'0.5\' fill=\'rgba(139,69,19,0.03)\'/%3E%3C/svg%3E")'
    default: return 'none'
  }
})

const titleFontFamily = computed(() => {
  switch (config.value.titleStyle) {
    case 'seal-script': return 'var(--font-brush)'
    case 'running-script': return 'var(--font-brush)'
    case 'regular-script': return 'var(--font-serif)'
    case 'cursive': return 'var(--font-brush)'
    default: return 'var(--font-serif)'
  }
})

const layoutClass = computed(() => `layout-${config.value.layout}`)

const isDarkBackground = computed(() => {
  const hex = config.value.backgroundColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
})

const textColor = computed(() => isDarkBackground.value ? '#e8e4d9' : '#1a1a2e')
const subTextColor = computed(() => isDarkBackground.value ? '#a8a498' : '#4a5568')

const exportToCanvas = async () => {
  if (!previewRef.value) return
  isExporting.value = true

  try {
    await nextTick()

    const canvas = document.createElement('canvas')
    const scale = 2
    const rect = previewRef.value.getBoundingClientRect()
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)

    ctx.fillStyle = config.value.backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    const pad = config.value.padding
    const bw = config.value.borderWidth
    if (bw > 0) {
      ctx.strokeStyle = config.value.borderColor
      ctx.lineWidth = bw
      ctx.strokeRect(pad / 2, pad / 2, rect.width - pad, rect.height - pad)
    }

    const innerPad = pad + bw * 2
    const innerW = rect.width - innerPad * 2
    const innerH = rect.height - innerPad * 2

    if (config.value.showTitle) {
      const titleSize = config.value.layout === 'horizontal-scroll' ? 20 : 28
      ctx.font = `${titleSize}px "Ma Shan Zheng", cursive`
      ctx.fillStyle = textColor.value
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const titleY = config.value.titlePosition.startsWith('bottom')
        ? rect.height - innerPad - 30
        : innerPad + 8
      ctx.fillText(props.composition.title || '无题', rect.width / 2, titleY)
    }

    const contentStartY = config.value.showTitle && !config.value.titlePosition.startsWith('bottom')
      ? innerPad + 44
      : innerPad + 8
    const contentEndY = config.value.showTitle && config.value.titlePosition.startsWith('bottom')
      ? rect.height - innerPad - 40
      : rect.height - innerPad - 8

    if (config.value.layout === 'horizontal-scroll') {
      ctx.font = '16px "Noto Serif SC", serif'
      ctx.fillStyle = textColor.value
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      let xPos = innerPad + 8
      const yPos = (contentStartY + contentEndY) / 2 - 8
      phraseLines.value.forEach((line, i) => {
        const text = i < phraseLines.value.length - 1 ? line + '　' : line
        ctx.fillText(text, xPos, yPos)
        xPos += ctx.measureText(text).width
      })
    } else {
      ctx.font = '18px "Noto Serif SC", serif'
      ctx.fillStyle = textColor.value
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lineH = 36
      const totalH = phraseLines.value.length * lineH
      let startY = contentStartY + (contentEndY - contentStartY - totalH) / 2 + lineH / 2
      phraseLines.value.forEach((line) => {
        ctx.fillText(line, rect.width / 2, startY)
        startY += lineH
      })
    }

    if (config.value.showScore) {
      ctx.font = '12px "Noto Serif SC", serif'
      ctx.fillStyle = subTextColor.value
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`${grade.value.grade} · ${props.composition.score.total}分`, rect.width - innerPad, rect.height - innerPad + 4)
    }

    config.value.seals.forEach(seal => {
      const sx = (seal.position.x / 100) * rect.width
      const sy = (seal.position.y / 100) * rect.height
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate((seal.rotation * Math.PI) / 180)
      ctx.globalAlpha = seal.opacity

      const halfSize = seal.size / 2
      ctx.strokeStyle = seal.color
      ctx.lineWidth = 1.5

      if (seal.shape === 'square') {
        ctx.strokeRect(-halfSize, -halfSize, seal.size, seal.size)
      } else if (seal.shape === 'round') {
        ctx.beginPath()
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.ellipse(0, 0, halfSize, halfSize * 0.7, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      const charCount = seal.text.length
      const fontSize = charCount <= 2 ? seal.size * 0.5 : seal.size * 0.35
      ctx.font = `bold ${fontSize}px "Ma Shan Zheng", cursive`
      ctx.fillStyle = seal.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (charCount <= 2) {
        ctx.fillText(seal.text, 0, 0)
      } else if (charCount <= 4) {
        ctx.fillText(seal.text.substring(0, 2), 0, -fontSize * 0.55)
        ctx.fillText(seal.text.substring(2), 0, fontSize * 0.55)
      } else {
        const mid = Math.ceil(charCount / 2)
        ctx.fillText(seal.text.substring(0, mid), 0, -fontSize * 0.55)
        ctx.fillText(seal.text.substring(mid), 0, fontSize * 0.55)
      }

      ctx.restore()
    })

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `诗境装裱_${props.composition.title || '无题'}.png`
    link.href = dataUrl
    link.click()

    exportSuccess.value = true
    setTimeout(() => {
      exportSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('导出失败:', err)
  } finally {
    isExporting.value = false
  }
}

const shareViaWebShare = async () => {
  if (!previewRef.value) return
  isExporting.value = true

  try {
    const canvas = document.createElement('canvas')
    const scale = 2
    const rect = previewRef.value.getBoundingClientRect()
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.fillStyle = config.value.backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `诗境装裱_${props.composition.title || '无题'}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `诗境装裱 · ${props.composition.title || '无题'}`,
            text: `${phraseLines.value.join('')}`,
            files: [file]
          })
        } catch (e) {
          exportToCanvas()
        }
      } else {
        exportToCanvas()
      }
    }, 'image/png')
  } finally {
    isExporting.value = false
  }
}

const copyToClipboard = async () => {
  if (!previewRef.value) return
  isExporting.value = true

  try {
    const canvas = document.createElement('canvas')
    const scale = 2
    const rect = previewRef.value.getBoundingClientRect()
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.fillStyle = config.value.backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        exportSuccess.value = true
        setTimeout(() => { exportSuccess.value = false }, 3000)
      } catch {
        exportToCanvas()
      }
    }, 'image/png')
  } finally {
    isExporting.value = false
  }
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

watch(sealingType, () => {
  const suggestions = suggestedSealTexts.value
  if (suggestions.length > 0) {
    sealingText.value = suggestions[Math.floor(Math.random() * suggestions.length)]
  }
})
</script>

<template>
  <div class="framing-overlay" @click.self="emit('close')">
    <div class="framing-panel">
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-icon">🖼️</span>
          <h2 class="panel-title">诗境装裱</h2>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <div class="preview-area">
          <div
            ref="previewRef"
            class="preview-canvas"
            :class="layoutClass"
            :style="{
              background: config.backgroundColor,
              backgroundImage: paperTextureStyle,
              borderColor: config.borderColor,
              borderWidth: config.borderWidth + 'px',
              padding: config.padding + 'px',
              color: textColor
            }"
          >
            <div class="preview-inner">
              <div
                v-if="config.showTitle && !config.titlePosition.startsWith('bottom')"
                class="preview-title"
                :class="[`pos-${config.titlePosition}`]"
                :style="{ fontFamily: titleFontFamily }"
              >
                {{ composition.title || '无题' }}
              </div>

              <div class="preview-content" :class="layoutClass">
                <template v-if="config.layout === 'horizontal-scroll'">
                  <span
                    v-for="(line, i) in phraseLines"
                    :key="i"
                    class="phrase-inline"
                  >{{ line }}<span v-if="i < phraseLines.length - 1" class="phrase-gap">　</span></span>
                </template>
                <template v-else>
                  <span
                    v-for="(line, i) in phraseLines"
                    :key="i"
                    class="phrase-line"
                  >{{ line }}</span>
                </template>
              </div>

              <div
                v-if="config.showTitle && config.titlePosition.startsWith('bottom')"
                class="preview-title bottom"
                :class="[`pos-${config.titlePosition}`]"
                :style="{ fontFamily: titleFontFamily }"
              >
                {{ composition.title || '无题' }}
              </div>

              <div v-if="config.showScore" class="preview-score" :style="{ color: subTextColor }">
                {{ grade.grade }} · {{ composition.score.total }}分
              </div>

              <div
                v-for="seal in config.seals"
                :key="seal.id"
                class="preview-seal"
                :class="[`shape-${seal.shape}`]"
                :style="{
                  left: seal.position.x + '%',
                  top: seal.position.y + '%',
                  transform: `translate(-50%, -50%) rotate(${seal.rotation}deg)`,
                  color: seal.color,
                  borderColor: seal.color,
                  opacity: seal.opacity,
                  width: seal.size + 'px',
                  height: seal.shape === 'oval' ? (seal.size * 0.7) + 'px' : seal.size + 'px'
                }"
              >
                <span class="seal-text">{{ seal.text }}</span>
              </div>

              <div class="preview-date" :style="{ color: subTextColor }">
                {{ formatDate(composition.createdAt) }}
              </div>
            </div>
          </div>
        </div>

        <div class="controls-area">
          <div class="tab-bar">
            <button
              v-for="tab in ([
                { key: 'layout', label: '排版', icon: '📐' },
                { key: 'title', label: '题签', icon: '✒️' },
                { key: 'seal', label: '印章', icon: '🔴' },
                { key: 'export', label: '导出', icon: '📤' }
              ] as const)"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <div class="tab-content">
            <div v-if="activeTab === 'layout'" class="tab-panel">
              <div class="control-section">
                <div class="control-label">装裱样式</div>
                <div class="layout-grid">
                  <button
                    v-for="opt in layoutOptions"
                    :key="opt.value"
                    class="layout-option"
                    :class="{ active: config.layout === opt.value }"
                    @click="config.layout = opt.value"
                  >
                    <span class="layout-icon">{{ opt.icon }}</span>
                    <span class="layout-name">{{ opt.label }}</span>
                  </button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">纸质纹理</div>
                <div class="chips-row">
                  <button
                    v-for="opt in paperTextureOptions"
                    :key="opt.value"
                    class="chip"
                    :class="{ active: config.paperTexture === opt.value }"
                    @click="config.paperTexture = opt.value as any"
                  >{{ opt.label }}</button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">底色</div>
                <div class="color-grid">
                  <button
                    v-for="preset in backgroundPresets"
                    :key="preset.color"
                    class="color-swatch"
                    :class="{ active: config.backgroundColor === preset.color }"
                    :style="{ background: preset.color }"
                    @click="config.backgroundColor = preset.color"
                    :title="preset.label"
                  ></button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">边框色</div>
                <div class="color-grid">
                  <button
                    v-for="preset in borderPresets"
                    :key="preset.color"
                    class="color-swatch"
                    :class="{ active: config.borderColor === preset.color }"
                    :style="{ background: preset.color }"
                    @click="config.borderColor = preset.color"
                    :title="preset.label"
                  ></button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">边框宽度</div>
                <div class="slider-row">
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    v-model.number="config.borderWidth"
                    class="slider"
                  />
                  <span class="slider-value">{{ config.borderWidth }}px</span>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">内边距</div>
                <div class="slider-row">
                  <input
                    type="range"
                    min="16"
                    max="64"
                    step="4"
                    v-model.number="config.padding"
                    class="slider"
                  />
                  <span class="slider-value">{{ config.padding }}px</span>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'title'" class="tab-panel">
              <div class="control-section">
                <div class="control-label">题签风格</div>
                <div class="chips-row">
                  <button
                    v-for="opt in titleStyleOptions"
                    :key="opt.value"
                    class="chip"
                    :class="{ active: config.titleStyle === opt.value }"
                    @click="config.titleStyle = opt.value"
                  >{{ opt.label }}</button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">题签位置</div>
                <div class="chips-row">
                  <button
                    v-for="opt in titlePositionOptions"
                    :key="opt.value"
                    class="chip"
                    :class="{ active: config.titlePosition === opt.value }"
                    @click="config.titlePosition = opt.value"
                  >{{ opt.label }}</button>
                </div>
              </div>

              <div class="control-section">
                <div class="toggle-row">
                  <span class="toggle-label">显示题名</span>
                  <button
                    class="toggle-btn"
                    :class="{ on: config.showTitle }"
                    @click="config.showTitle = !config.showTitle"
                  >{{ config.showTitle ? '开' : '关' }}</button>
                </div>
              </div>

              <div class="control-section">
                <div class="toggle-row">
                  <span class="toggle-label">显示评分</span>
                  <button
                    class="toggle-btn"
                    :class="{ on: config.showScore }"
                    @click="config.showScore = !config.showScore"
                  >{{ config.showScore ? '开' : '关' }}</button>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'seal'" class="tab-panel">
              <div class="control-section">
                <div class="control-label">印章类型</div>
                <div class="chips-row">
                  <button
                    v-for="opt in sealTypeOptions"
                    :key="opt.value"
                    class="chip"
                    :class="{ active: sealingType === opt.value }"
                    @click="sealingType = opt.value"
                  >{{ opt.label }}</button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">印形</div>
                <div class="chips-row">
                  <button
                    class="chip"
                    :class="{ active: sealingShape === 'square' }"
                    @click="sealingShape = 'square'"
                  >方印</button>
                  <button
                    class="chip"
                    :class="{ active: sealingShape === 'round' }"
                    @click="sealingShape = 'round'"
                  >圆印</button>
                  <button
                    class="chip"
                    :class="{ active: sealingShape === 'oval' }"
                    @click="sealingShape = 'oval'"
                  >椭圆印</button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">印色</div>
                <div class="color-grid">
                  <button
                    v-for="c in ['#c23a2b', '#a02020', '#8b0000', '#d4483b', '#b85450', '#2c2c2c']"
                    :key="c"
                    class="color-swatch small"
                    :class="{ active: sealingColor === c }"
                    :style="{ background: c }"
                    @click="sealingColor = c"
                  ></button>
                </div>
              </div>

              <div class="control-section">
                <div class="control-label">印文</div>
                <div class="seal-input-row">
                  <input
                    v-model="sealingText"
                    type="text"
                    class="seal-input"
                    placeholder="输入印文..."
                    maxlength="6"
                    @keydown.enter="addSeal()"
                  />
                  <button class="add-seal-btn" @click="addSeal()" :disabled="!sealingText.trim()">盖印</button>
                </div>
                <div v-if="suggestedSealTexts.length > 0" class="suggested-seals">
                  <span class="suggested-label">推荐：</span>
                  <button
                    v-for="text in suggestedSealTexts"
                    :key="text"
                    class="suggested-chip"
                    @click="addSeal(text)"
                  >{{ text }}</button>
                </div>
              </div>

              <div v-if="config.seals.length > 0" class="control-section">
                <div class="control-label">已盖印章（{{ config.seals.length }}）</div>
                <div class="seal-list">
                  <div
                    v-for="seal in config.seals"
                    :key="seal.id"
                    class="seal-item"
                  >
                    <span
                      class="seal-preview"
                      :class="`shape-${seal.shape}`"
                      :style="{ color: seal.color, borderColor: seal.color }"
                    >{{ seal.text }}</span>
                    <span class="seal-type-label">{{ SEAL_TYPE_LABELS[seal.type] }}</span>
                    <button class="seal-remove" @click="removeSeal(seal.id)">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'export'" class="tab-panel">
              <div class="export-section">
                <div class="export-preview-summary">
                  <div class="summary-item">
                    <span class="summary-label">装裱样式</span>
                    <span class="summary-value">{{ FRAMING_LAYOUT_LABELS[config.layout] }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">纸质</span>
                    <span class="summary-value">{{ PAPER_TEXTURE_LABELS[config.paperTexture] }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">题签</span>
                    <span class="summary-value">{{ config.showTitle ? TITLE_STYLE_LABELS[config.titleStyle] : '隐藏' }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">印章</span>
                    <span class="summary-value">{{ config.seals.length }}枚</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">题名</span>
                    <span class="summary-value">{{ composition.title || '无题' }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">品级</span>
                    <span class="summary-value" :style="{ color: grade.color }">{{ grade.grade }} · {{ composition.score.total }}分</span>
                  </div>
                </div>

                <button
                  class="export-btn primary"
                  :disabled="isExporting"
                  @click="exportToCanvas"
                >
                  <span class="export-icon">📥</span>
                  <span>{{ isExporting ? '导出中...' : '下载图片' }}</span>
                </button>

                <button
                  class="export-btn secondary"
                  :disabled="isExporting"
                  @click="copyToClipboard"
                >
                  <span class="export-icon">📋</span>
                  <span>复制到剪贴板</span>
                </button>

                <button
                  class="export-btn secondary"
                  :disabled="isExporting"
                  @click="shareViaWebShare"
                >
                  <span class="export-icon">🔗</span>
                  <span>分享</span>
                </button>

                <div v-if="exportSuccess" class="export-success">
                  <span class="success-icon">✓</span>
                  <span>导出成功！</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.framing-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.framing-panel {
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease 0.1s both;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(201, 168, 108, 0.05);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 20px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--accent-gold);
  letter-spacing: 3px;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  gap: 0;
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  overflow: auto;
  min-height: 400px;
}

.preview-canvas {
  position: relative;
  border-style: solid;
  min-width: 200px;
  max-width: 360px;
  aspect-ratio: 3 / 4;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-canvas.layout-horizontal-scroll {
  aspect-ratio: 4 / 3;
  max-width: 420px;
}

.preview-canvas.layout-fan {
  aspect-ratio: 4 / 3;
  border-radius: 0 0 50% 50% / 0 0 30% 30%;
  max-width: 360px;
}

.preview-canvas.layout-circular {
  aspect-ratio: 1;
  border-radius: 50%;
  max-width: 320px;
}

.preview-canvas.layout-album {
  aspect-ratio: 1;
  max-width: 320px;
}

.preview-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.preview-title {
  font-size: 22px;
  letter-spacing: 3px;
  margin-bottom: 16px;
  text-align: center;
  opacity: 0.9;
}

.preview-title.bottom {
  margin-bottom: 0;
  margin-top: 16px;
  order: 10;
}

.preview-title.pos-top-left {
  text-align: left;
}

.preview-title.pos-top-right {
  text-align: right;
}

.preview-title.pos-bottom-left {
  text-align: left;
}

.preview-title.pos-bottom-right {
  text-align: right;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
}

.preview-content.layout-horizontal-scroll {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0;
}

.phrase-line {
  font-family: var(--font-serif);
  font-size: 18px;
  letter-spacing: 2px;
  line-height: 2;
  text-align: center;
}

.phrase-inline {
  font-family: var(--font-serif);
  font-size: 16px;
  letter-spacing: 1px;
}

.phrase-gap {
  opacity: 0.3;
}

.preview-score {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  letter-spacing: 1px;
  opacity: 0.7;
}

.preview-date {
  position: absolute;
  bottom: 8px;
  left: 12px;
  font-size: 10px;
  letter-spacing: 1px;
  opacity: 0.5;
}

.preview-seal {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid;
  font-family: var(--font-brush);
  font-weight: 500;
  letter-spacing: 1px;
  z-index: 5;
  pointer-events: none;
}

.preview-seal .seal-text {
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  word-break: break-all;
}

.preview-seal.shape-round {
  border-radius: 50%;
}

.preview-seal.shape-oval {
  border-radius: 50%;
}

.controls-area {
  width: 320px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.15);
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  letter-spacing: 1px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.tab-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.layout-option:hover {
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--text-primary);
}

.layout-option.active {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  color: var(--accent-gold);
}

.layout-icon {
  font-size: 20px;
}

.layout-name {
  font-size: 11px;
  letter-spacing: 1px;
}

.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip:hover {
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--text-primary);
}

.chip.active {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  color: var(--accent-gold);
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.color-swatch.small {
  width: 28px;
  height: 28px;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(201, 168, 108, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-gold);
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.toggle-btn {
  padding: 4px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.on {
  background: rgba(201, 168, 108, 0.15);
  border-color: rgba(201, 168, 108, 0.4);
  color: var(--accent-gold);
}

.seal-input-row {
  display: flex;
  gap: 8px;
}

.seal-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease;
}

.seal-input:focus {
  border-color: var(--accent-gold);
}

.seal-input::placeholder {
  color: var(--text-muted);
}

.add-seal-btn {
  padding: 8px 16px;
  background: rgba(194, 58, 43, 0.15);
  border: 1px solid rgba(194, 58, 43, 0.4);
  border-radius: 8px;
  color: #c23a2b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-seal-btn:hover:not(:disabled) {
  background: rgba(194, 58, 43, 0.25);
}

.add-seal-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.suggested-seals {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.suggested-label {
  font-size: 11px;
  color: var(--text-muted);
}

.suggested-chip {
  padding: 3px 10px;
  background: rgba(194, 58, 43, 0.08);
  border: 1px solid rgba(194, 58, 43, 0.2);
  border-radius: 10px;
  color: #d4483b;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggested-chip:hover {
  background: rgba(194, 58, 43, 0.15);
  border-color: rgba(194, 58, 43, 0.4);
}

.seal-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.seal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.seal-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid;
  font-family: var(--font-brush);
  font-size: 10px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.seal-preview.shape-round {
  border-radius: 50%;
}

.seal-preview.shape-oval {
  border-radius: 50%;
  height: 24px;
}

.seal-type-label {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
}

.seal-remove {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-remove:hover {
  background: rgba(139, 69, 87, 0.2);
  color: var(--accent-red);
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-preview-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.summary-label {
  color: var(--text-muted);
}

.summary-value {
  color: var(--text-primary);
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn.primary {
  background: linear-gradient(135deg, #c9a86c 0%, #a8884c 100%);
  color: #1a1a2e;
  font-weight: 500;
}

.export-btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.export-btn.secondary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.export-btn.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.export-icon {
  font-size: 16px;
}

.export-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(107, 142, 107, 0.15);
  border: 1px solid rgba(107, 142, 107, 0.3);
  border-radius: 10px;
  color: #7ca97c;
  font-size: 14px;
  animation: fadeIn 0.3s ease;
}

.success-icon {
  font-size: 18px;
  font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 700px) {
  .framing-panel {
    max-height: 95vh;
  }

  .panel-body {
    flex-direction: column;
  }

  .preview-area {
    min-height: 280px;
    padding: 16px;
  }

  .controls-area {
    width: 100%;
    max-height: 50vh;
  }
}
</style>
