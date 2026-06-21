<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Phrase, CanvasPhrase, Theme, ThemeDecorationType } from '@/types'
import { categoryColors } from '@/data/phrases'
import { musicPlayer } from '@/utils/music'

interface Props {
  phrases: Phrase[]
  boardPhrases: CanvasPhrase[]
  accentColor: string
  theme?: Theme
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:boardPhrases', phrases: CanvasPhrase[]): void
  (e: 'remove', phraseId: string): void
  (e: 'place', phrase: Phrase): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const canvasSize = ref({ width: 800, height: 600 })
const hoveredPhraseId = ref<string | null>(null)
let animationId: number | null = null
let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = []
let decorationParticles: {
  x: number; y: number; vx: number; vy: number;
  size: number; rotation: number; rotationSpeed: number;
  life: number; maxLife: number; opacity: number;
  type: ThemeDecorationType; color: string;
}[] = []
let lastDecorationSpawn = 0

const placedIds = computed(() => new Set(props.boardPhrases.map(p => p.id)))

const measureText = (ctx: CanvasRenderingContext2D, text: string, fontSize: number): { width: number; height: number } => {
  ctx.font = `500 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-serif')}`
  const metrics = ctx.measureText(text)
  return {
    width: metrics.width + 28,
    height: fontSize + 20
  }
}

const initCanvas = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()
  canvasSize.value = { width: rect.width, height: rect.height }
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }
  render()
}

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = canvasSize.value
  const theme = props.theme
  const gridOpacity = theme?.background.gridOpacity ?? 0.04
  const watermarkText = theme?.background.watermarkText ?? '诗'
  const watermarkOpacity = theme?.background.watermarkOpacity ?? 0.03
  const accentColor = theme?.background.particleColor ?? props.accentColor
  
  ctx.fillStyle = 'rgba(15, 15, 26, 0.02)'
  ctx.fillRect(0, 0, width, height)
  
  ctx.strokeStyle = `rgba(201, 168, 108, ${gridOpacity})`
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.save()
  ctx.globalAlpha = watermarkOpacity
  ctx.font = `bold 180px ${getComputedStyle(document.documentElement).getPropertyValue('--font-brush')}`
  ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(watermarkText, width / 2, height / 2)
  ctx.restore()
}

const spawnDecorationParticle = () => {
  const theme = props.theme
  if (!theme) return
  
  const { width, height } = canvasSize.value
  const type = theme.decoration
  const color = theme.background.particleColor
  
  const particle = {
    x: Math.random() * width,
    y: -20,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0.3 + Math.random() * 0.5,
    size: 3 + Math.random() * 5,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    life: 1,
    maxLife: 1,
    opacity: 0.3 + Math.random() * 0.4,
    type,
    color
  }
  
  decorationParticles.push(particle)
}

const updateDecorationParticles = (deltaTime: number) => {
  const now = Date.now()
  if (now - lastDecorationSpawn > 800) {
    spawnDecorationParticle()
    lastDecorationSpawn = now
  }
  
  decorationParticles = decorationParticles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.rotation += p.rotationSpeed
    p.life -= 0.002
    
    if (p.type === 'waves') {
      p.y += Math.sin(p.x * 0.02 + now * 0.001) * 0.3
    } else if (p.type === 'clouds') {
      p.vx = 0.2 + Math.sin(now * 0.001) * 0.1
    } else if (p.type === 'fireflies') {
      p.vx += (Math.random() - 0.5) * 0.1
      p.vy += (Math.random() - 0.5) * 0.1
      p.opacity = 0.2 + Math.sin(now * 0.003 + p.x) * 0.3
    }
    
    return p.life > 0 && p.y < canvasSize.value.height + 50
  })
}

const drawDecorationParticles = (ctx: CanvasRenderingContext2D) => {
  if (!props.theme) return
  
  decorationParticles.forEach(p => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity * p.life
    const color = p.color
    ctx.fillStyle = color
    
    switch (p.type) {
      case 'stars':
        drawStar(ctx, p.size)
        break
      case 'flowers':
        drawFlower(ctx, p.size)
        break
      case 'waves':
        drawWave(ctx, p.size)
        break
      case 'mountains':
        drawMountain(ctx, p.size)
        break
      case 'clouds':
        drawCloud(ctx, p.size)
        break
      case 'fireflies':
        drawFirefly(ctx, p.size, color)
        break
      case 'leaves':
        drawLeaf(ctx, p.size)
        break
      case 'snow':
        drawSnowflake(ctx, p.size)
        break
      default:
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
    }
    
    ctx.restore()
  })
}

const drawStar = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const x = Math.cos(angle) * size
    const y = Math.sin(angle) * size
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

const drawFlower = (ctx: CanvasRenderingContext2D, size: number) => {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    const angle = (i * 2 * Math.PI) / 5
    const x = Math.cos(angle) * size * 0.6
    const y = Math.sin(angle) * size * 0.6
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#ffeb3b'
  ctx.fill()
}

const drawWave = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.quadraticCurveTo(-size / 2, -size, 0, 0)
  ctx.quadraticCurveTo(size / 2, size, size, 0)
  ctx.lineWidth = 2
  ctx.strokeStyle = ctx.fillStyle
  ctx.stroke()
}

const drawMountain = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  ctx.moveTo(-size, size * 0.6)
  ctx.lineTo(0, -size * 0.6)
  ctx.lineTo(size, size * 0.6)
  ctx.closePath()
  ctx.fill()
}

const drawCloud = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  ctx.arc(-size * 0.5, 0, size * 0.4, 0, Math.PI * 2)
  ctx.arc(0, -size * 0.2, size * 0.5, 0, Math.PI * 2)
  ctx.arc(size * 0.5, 0, size * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

const drawFirefly = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = color
  ctx.shadowBlur = size * 3
  ctx.fill()
  ctx.shadowBlur = 0
}

const drawLeaf = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  ctx.ellipse(0, 0, size, size * 0.6, Math.PI / 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-size * 0.6, -size * 0.4)
  ctx.lineTo(size * 0.6, size * 0.4)
  ctx.stroke()
}

const drawSnowflake = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
    const midX = Math.cos(angle) * size * 0.6
    const midY = Math.sin(angle) * size * 0.6
    const branchAngle1 = angle + Math.PI / 6
    const branchAngle2 = angle - Math.PI / 6
    ctx.moveTo(midX, midY)
    ctx.lineTo(midX + Math.cos(branchAngle1) * size * 0.3, midY + Math.sin(branchAngle1) * size * 0.3)
    ctx.moveTo(midX, midY)
    ctx.lineTo(midX + Math.cos(branchAngle2) * size * 0.3, midY + Math.sin(branchAngle2) * size * 0.3)
  }
  ctx.lineWidth = 2
  ctx.strokeStyle = ctx.fillStyle
  ctx.stroke()
}

const drawPhrase = (ctx: CanvasRenderingContext2D, phrase: CanvasPhrase, time: number) => {
  const fontSize = 18
  const { width, height } = measureText(ctx, phrase.text, fontSize)
  
  ctx.save()
  
  if (phrase.position) {
    ctx.translate(phrase.position.x, phrase.position.y)
  }
  
  const isHovered = hoveredPhraseId.value === phrase.id
  const isDragging = phrase.isDragging
  
  if (isDragging) {
    ctx.rotate(Math.sin(time / 600) * 0.01)
  }
  
  const shadowBlur = isDragging ? 25 : (isHovered ? 15 : 8)
  const shadowOffset = isDragging ? 8 : (isHovered ? 4 : 2)
  
  ctx.shadowColor = `rgba(0, 0, 0, ${isDragging ? 0.5 : 0.3})`
  ctx.shadowBlur = shadowBlur
  ctx.shadowOffsetY = shadowOffset
  
  const color = categoryColors[phrase.category]
  const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0)
  gradient.addColorStop(0, `rgba(26, 26, 46, 0.95)`)
  gradient.addColorStop(1, `rgba(30, 30, 55, 0.95)`)
  
  const radius = 8
  const x = -width / 2
  const y = -height / 2
  
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fillStyle = gradient
  ctx.fill()
  
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  
  ctx.strokeStyle = isDragging ? color : `color-mix(in srgb, ${color} 50%, transparent)`
  ctx.lineWidth = isDragging ? 2 : 1
  ctx.stroke()
  
  const barWidth = 3
  ctx.fillStyle = color
  ctx.fillRect(x, y + 4, barWidth, height - 8)
  
  ctx.font = `500 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-serif')}`
  ctx.fillStyle = isHovered ? color : 'var(--text-primary)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#e8e4d9'
  ctx.fillText(phrase.text, 0, 0)
  
  if (isHovered) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(width / 2 - 6, -height / 2 + 6, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.font = `bold 10px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('×', width / 2 - 6, -height / 2 + 6)
  }
  
  ctx.restore()
}

const drawParticles = (ctx: CanvasRenderingContext2D) => {
  particles = particles.filter(p => p.life > 0)
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    p.vy += 0.02
    
    ctx.save()
    ctx.globalAlpha = p.life * 0.6
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

const spawnParticles = (x: number, y: number, color: string) => {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12
    const speed = 1 + Math.random() * 2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      color
    })
  }
}

const render = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvasSize.value.width, canvasSize.value.height)
  drawBackground(ctx)
  
  const deltaTime = 16
  updateDecorationParticles(deltaTime)
  drawDecorationParticles(ctx)
  
  drawParticles(ctx)
  
  const time = performance.now()
  props.boardPhrases.forEach(phrase => {
    drawPhrase(ctx, phrase, time)
  })
  
  animationId = requestAnimationFrame(render)
}

const getCanvasCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  let clientX: number, clientY: number
  
  if ('touches' in e) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const hitTest = (x: number, y: number): CanvasPhrase | null => {
  const canvas = canvasRef.value
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  
  for (let i = props.boardPhrases.length - 1; i >= 0; i--) {
    const phrase = props.boardPhrases[i]
    if (!phrase.position) continue
    
    const { width, height } = measureText(ctx, phrase.text, 18)
    const px = phrase.position.x
    const py = phrase.position.y
    
    if (
      x >= px - width / 2 &&
      x <= px + width / 2 &&
      y >= py - height / 2 &&
      y <= py + height / 2
    ) {
      return phrase
    }
  }
  return null
}

let dragPhrase: CanvasPhrase | null = null
let hasMoved = false

const onPointerDown = (e: MouseEvent | TouchEvent) => {
  const coords = getCanvasCoords(e)
  const hit = hitTest(coords.x, coords.y)
  
  if (hit) {
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (!ctx || !hit.position) return
    
    const { width, height } = measureText(ctx, hit.text, 18)
    
    if (
      coords.x >= hit.position.x + width / 2 - 12 &&
      coords.x <= hit.position.x + width / 2 &&
      coords.y >= hit.position.y - height / 2 &&
      coords.y <= hit.position.y - height / 2 + 12
    ) {
      spawnParticles(hit.position.x, hit.position.y, categoryColors[hit.category])
      musicPlayer.playRemoveSound()
      emit('remove', hit.id)
      return
    }
    
    dragPhrase = hit
    hasMoved = false
    dragPhrase.isDragging = true
    dragPhrase.dragOffset = {
      x: coords.x - hit.position.x,
      y: coords.y - hit.position.y
    }
    
    const updated = [...props.boardPhrases]
    const idx = updated.findIndex(p => p.id === hit.id)
    if (idx >= 0) {
      updated.splice(idx, 1)
      updated.push(dragPhrase)
    }
    emit('update:boardPhrases', updated)
  }
}

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  const coords = getCanvasCoords(e)
  const hit = hitTest(coords.x, coords.y)
  hoveredPhraseId.value = hit?.id || null
  
  if (dragPhrase && dragPhrase.isDragging) {
    hasMoved = true
    const newPhrases = props.boardPhrases.map(p => {
      if (p.id === dragPhrase!.id) {
        return {
          ...p,
          position: {
            x: coords.x - p.dragOffset.x,
            y: coords.y - p.dragOffset.y
          }
        }
      }
      return p
    })
    emit('update:boardPhrases', newPhrases)
  }
}

const onPointerUp = () => {
  if (dragPhrase) {
    if (!hasMoved) {
      musicPlayer.playPluckSound()
    }
    const newPhrases = props.boardPhrases.map(p => {
      if (p.id === dragPhrase!.id) {
        return { ...p, isDragging: false }
      }
      return p
    })
    emit('update:boardPhrases', newPhrases)
    dragPhrase = null
  }
}

const addPhraseToBoard = (phrase: Phrase) => {
  const canvas = canvasRef.value
  if (!canvas || placedIds.value.has(phrase.id)) return
  
  const { width, height } = canvasSize.value
  const padding = 60
  const x = padding + Math.random() * (width - padding * 2)
  const y = padding + Math.random() * (height - padding * 2)
  
  const canvasPhrase: CanvasPhrase = {
    ...phrase,
    position: { x, y },
    isPlaced: true,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    width: 0,
    height: 0
  }
  
  spawnParticles(x, y, categoryColors[phrase.category])
  musicPlayer.playPlaceSound()
  
  const newBoardPhrases = [...props.boardPhrases, canvasPhrase]
  emit('update:boardPhrases', newBoardPhrases)
  emit('place', phrase)
}

const addPhraseFromClick = (phrase: Phrase) => {
  addPhraseToBoard(phrase)
}

const handleResize = () => {
  initCanvas()
}

defineExpose({ addPhrase: addPhraseFromClick })

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
  
  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('mouseleave', onPointerUp)
    canvas.addEventListener('touchstart', onPointerDown, { passive: true })
    canvas.addEventListener('touchmove', onPointerMove, { passive: true })
    canvas.addEventListener('touchend', onPointerUp)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousedown', onPointerDown)
    canvas.removeEventListener('mousemove', onPointerMove)
    canvas.removeEventListener('mouseup', onPointerUp)
    canvas.removeEventListener('mouseleave', onPointerUp)
    canvas.removeEventListener('touchstart', onPointerDown)
    canvas.removeEventListener('touchmove', onPointerMove)
    canvas.removeEventListener('touchend', onPointerUp)
  }
})

watch(() => props.boardPhrases.length, () => {
  // Trigger re-render when phrases change
})
</script>

<template>
  <div ref="containerRef" class="canvas-board">
    <canvas ref="canvasRef"></canvas>
    <div v-if="boardPhrases.length === 0" class="empty-overlay">
      <div class="empty-inner">
        <div class="empty-icon">✦</div>
        <div class="empty-text">点击下方词句，将其放置于此</div>
        <div class="empty-sub">让词语自由组合，拼出你的诗意</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-board {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
}

canvas {
  display: block;
  cursor: default;
  touch-action: none;
}

.empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-inner {
  text-align: center;
  opacity: 0.4;
}

.empty-icon {
  font-size: 48px;
  color: var(--accent-gold);
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-family: var(--font-serif);
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
