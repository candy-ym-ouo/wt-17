import type { CanvasPhrase } from '@/types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SnapResult {
  x: number
  y: number
  snapped: boolean
  snapEdges: SnapEdge[]
}

export interface SnapEdge {
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'
  value: number
  targetId?: string
}

export interface GuideLine {
  type: 'vertical' | 'horizontal'
  position: number
  start?: number
  end?: number
  color?: string
}

export interface ConflictInfo {
  phrase1: CanvasPhrase
  phrase2: CanvasPhrase
  overlapArea: number
  overlapRatio: number
}

export const GRID_SIZE = 20
export const SNAP_THRESHOLD = 8
export const SNAP_EDGE_THRESHOLD = 10

export const getPhraseRect = (phrase: CanvasPhrase, ctx: CanvasRenderingContext2D, fontSize: number = 18): Rect => {
  ctx.font = `500 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-serif')}`
  const metrics = ctx.measureText(phrase.text)
  const width = metrics.width + 28
  const height = fontSize + 20
  return {
    x: phrase.position!.x - width / 2,
    y: phrase.position!.y - height / 2,
    width,
    height
  }
}

export const snapToGrid = (x: number, y: number, gridSize: number = GRID_SIZE): { x: number; y: number } => {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  }
}

export const snapToEdges = (
  draggingPhrase: CanvasPhrase,
  targetX: number,
  targetY: number,
  otherPhrases: CanvasPhrase[],
  ctx: CanvasRenderingContext2D,
  canvasSize: { width: number; height: number },
  threshold: number = SNAP_EDGE_THRESHOLD
): SnapResult => {
  const draggingRect = getPhraseRect({ ...draggingPhrase, position: { x: targetX, y: targetY } }, ctx)
  const draggingCenterX = targetX
  const draggingCenterY = targetY
  
  let snappedX = targetX
  let snappedY = targetY
  const snapEdges: SnapEdge[] = []
  let snapped = false

  const checkAndSnap = (current: number, target: number, edgeType: SnapEdge['type'], targetId?: string) => {
    if (Math.abs(current - target) <= threshold) {
      snapEdges.push({ type: edgeType, value: target, targetId })
      snapped = true
      return target
    }
    return current
  }

  otherPhrases.forEach(other => {
    if (other.id === draggingPhrase.id || !other.position) return
    
    const otherRect = getPhraseRect(other, ctx)
    const otherCenterX = other.position.x
    const otherCenterY = other.position.y

    snappedX = checkAndSnap(draggingRect.x, otherRect.x, 'left', other.id)
    snappedX = checkAndSnap(draggingRect.x + draggingRect.width, otherRect.x + otherRect.width, 'right', other.id)
    snappedX = checkAndSnap(draggingRect.x, otherRect.x + otherRect.width, 'left', other.id)
    snappedX = checkAndSnap(draggingRect.x + draggingRect.width, otherRect.x, 'right', other.id)
    snappedX = checkAndSnap(draggingCenterX, otherCenterX, 'centerX', other.id)

    snappedY = checkAndSnap(draggingRect.y, otherRect.y, 'top', other.id)
    snappedY = checkAndSnap(draggingRect.y + draggingRect.height, otherRect.y + otherRect.height, 'bottom', other.id)
    snappedY = checkAndSnap(draggingRect.y, otherRect.y + otherRect.height, 'top', other.id)
    snappedY = checkAndSnap(draggingRect.y + draggingRect.height, otherRect.y, 'bottom', other.id)
    snappedY = checkAndSnap(draggingCenterY, otherCenterY, 'centerY', other.id)
  })

  const padding = 20
  snappedX = checkAndSnap(draggingRect.x, padding, 'left')
  snappedX = checkAndSnap(draggingRect.x + draggingRect.width, canvasSize.width - padding, 'right')
  snappedX = checkAndSnap(draggingCenterX, canvasSize.width / 2, 'centerX')

  snappedY = checkAndSnap(draggingRect.y, padding, 'top')
  snappedY = checkAndSnap(draggingRect.y + draggingRect.height, canvasSize.height - padding, 'bottom')
  snappedY = checkAndSnap(draggingCenterY, canvasSize.height / 2, 'centerY')

  return {
    x: snappedX,
    y: snappedY,
    snapped,
    snapEdges
  }
}

export const generateGuideLines = (
  draggingPhrase: CanvasPhrase,
  snapEdges: SnapEdge[],
  otherPhrases: CanvasPhrase[],
  ctx: CanvasRenderingContext2D,
  canvasSize: { width: number; height: number }
): GuideLine[] => {
  const guidelines: GuideLine[] = []
  const draggingRect = getPhraseRect(draggingPhrase, ctx)

  snapEdges.forEach(edge => {
    if (edge.type === 'left' || edge.type === 'right' || edge.type === 'centerX') {
      let x = edge.value
      if (edge.type === 'left') x = edge.value
      else if (edge.type === 'right') x = edge.value
      else if (edge.type === 'centerX') x = edge.value

      let minY = Math.min(draggingRect.y, 0)
      let maxY = Math.max(draggingRect.y + draggingRect.height, canvasSize.height)

      if (edge.targetId) {
        const target = otherPhrases.find(p => p.id === edge.targetId)
        if (target && target.position) {
          const targetRect = getPhraseRect(target, ctx)
          minY = Math.min(draggingRect.y, targetRect.y)
          maxY = Math.max(draggingRect.y + draggingRect.height, targetRect.y + targetRect.height)
        }
      }

      guidelines.push({
        type: 'vertical',
        position: x,
        start: minY,
        end: maxY,
        color: 'rgba(201, 168, 108, 0.8)'
      })
    } else if (edge.type === 'top' || edge.type === 'bottom' || edge.type === 'centerY') {
      let y = edge.value
      if (edge.type === 'top') y = edge.value
      else if (edge.type === 'bottom') y = edge.value
      else if (edge.type === 'centerY') y = edge.value

      let minX = Math.min(draggingRect.x, 0)
      let maxX = Math.max(draggingRect.x + draggingRect.width, canvasSize.width)

      if (edge.targetId) {
        const target = otherPhrases.find(p => p.id === edge.targetId)
        if (target && target.position) {
          const targetRect = getPhraseRect(target, ctx)
          minX = Math.min(draggingRect.x, targetRect.x)
          maxX = Math.max(draggingRect.x + draggingRect.width, targetRect.x + targetRect.width)
        }
      }

      guidelines.push({
        type: 'horizontal',
        position: y,
        start: minX,
        end: maxX,
        color: 'rgba(201, 168, 108, 0.8)'
      })
    }
  })

  return guidelines
}

export const checkRectOverlap = (rect1: Rect, rect2: Rect): boolean => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

export const getOverlapArea = (rect1: Rect, rect2: Rect): number => {
  const overlapX = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x))
  const overlapY = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y))
  return overlapX * overlapY
}

export const detectConflicts = (
  phrases: CanvasPhrase[],
  ctx: CanvasRenderingContext2D,
  minOverlapRatio: number = 0.1
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = []
  const rects = phrases.map(p => ({ phrase: p, rect: getPhraseRect(p, ctx) }))

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const { phrase: p1, rect: r1 } = rects[i]
      const { phrase: p2, rect: r2 } = rects[j]

      if (checkRectOverlap(r1, r2)) {
        const overlapArea = getOverlapArea(r1, r2)
        const area1 = r1.width * r1.height
        const area2 = r2.width * r2.height
        const minArea = Math.min(area1, area2)
        const overlapRatio = overlapArea / minArea

        if (overlapRatio >= minOverlapRatio) {
          conflicts.push({
            phrase1: p1,
            phrase2: p2,
            overlapArea,
            overlapRatio
          })
        }
      }
    }
  }

  return conflicts
}

export const getPhraseConflicts = (
  phrase: CanvasPhrase,
  otherPhrases: CanvasPhrase[],
  ctx: CanvasRenderingContext2D,
  minOverlapRatio: number = 0.1
): ConflictInfo[] => {
  const conflicts: ConflictInfo[] = []
  const phraseRect = getPhraseRect(phrase, ctx)

  otherPhrases.forEach(other => {
    if (other.id === phrase.id || !other.position) return

    const otherRect = getPhraseRect(other, ctx)
    if (checkRectOverlap(phraseRect, otherRect)) {
      const overlapArea = getOverlapArea(phraseRect, otherRect)
      const area1 = phraseRect.width * phraseRect.height
      const area2 = otherRect.width * otherRect.height
      const minArea = Math.min(area1, area2)
      const overlapRatio = overlapArea / minArea

      if (overlapRatio >= minOverlapRatio) {
        conflicts.push({
          phrase1: phrase,
          phrase2: other,
          overlapArea,
          overlapRatio
        })
      }
    }
  })

  return conflicts
}

export const drawGuideLines = (ctx: CanvasRenderingContext2D, guidelines: GuideLine[]) => {
  ctx.save()
  ctx.strokeStyle = 'rgba(201, 168, 108, 0.8)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])

  guidelines.forEach(line => {
    if (line.color) {
      ctx.strokeStyle = line.color
    }
    
    ctx.beginPath()
    if (line.type === 'vertical') {
      const startY = line.start ?? 0
      const endY = line.end ?? ctx.canvas.height
      ctx.moveTo(line.position, startY)
      ctx.lineTo(line.position, endY)
    } else {
      const startX = line.start ?? 0
      const endX = line.end ?? ctx.canvas.width
      ctx.moveTo(startX, line.position)
      ctx.lineTo(endX, line.position)
    }
    ctx.stroke()

    if (line.type === 'vertical') {
      ctx.setLineDash([])
      ctx.fillStyle = line.color || 'rgba(201, 168, 108, 1)'
      ctx.beginPath()
      ctx.arc(line.position, line.start ?? 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(line.position, line.end ?? ctx.canvas.height, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.setLineDash([6, 4])
    } else {
      ctx.setLineDash([])
      ctx.fillStyle = line.color || 'rgba(201, 168, 108, 1)'
      ctx.beginPath()
      ctx.arc(line.start ?? 0, line.position, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(line.end ?? ctx.canvas.width, line.position, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.setLineDash([6, 4])
    }
  })

  ctx.restore()
}

export const drawConflictIndicator = (
  ctx: CanvasRenderingContext2D,
  phrase: CanvasPhrase,
  conflictCount: number,
  fontSize: number = 18
) => {
  if (!phrase.position) return
  if (conflictCount <= 0) return

  const rect = getPhraseRect(phrase, ctx, fontSize)
  const badgeRadius = 12
  const badgeX = rect.x + rect.width - 4
  const badgeY = rect.y - 4

  ctx.save()
  
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)'
  ctx.shadowBlur = 8
  
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(conflictCount > 9 ? '9+' : String(conflictCount), badgeX, badgeY)

  ctx.restore()
}

export const drawSnapIndicator = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  edges: SnapEdge[]
) => {
  if (edges.length === 0) return

  ctx.save()
  ctx.fillStyle = 'rgba(201, 168, 108, 0.9)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const label = edges.length > 0 ? '吸附' : ''
  const labelY = y - 30

  ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
  const metrics = ctx.measureText(label)
  const padding = 6
  ctx.beginPath()
  ctx.roundRect(
    x - metrics.width / 2 - padding,
    labelY - 10,
    metrics.width + padding * 2,
    20,
    4
  )
  ctx.fill()

  ctx.fillStyle = '#c9a86c'
  ctx.fillText(label, x, labelY)

  ctx.restore()
}
