<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MapNode, Chapter, ChapterProgress, QuestState, SideQuest, Achievement, AchievementProgress } from '@/types'
import { mapNodes, getMapPath, getStoryEventById, achievements } from '@/data/travelMap'
import { getScoreGrade } from '@/utils/scoring'
import { ACHIEVEMENT_RARITY_LABELS, ACHIEVEMENT_RARITY_COLORS, ACHIEVEMENT_CATEGORY_LABELS } from '@/types'

interface Props {
  chapters: Chapter[]
  currentChapterId: string
  unlockedChapterIds: string[]
  chapterProgress: Record<string, ChapterProgress>
  questState: QuestState
  sideQuests: SideQuest[]
  visitedNodeIds: string[]
  completedEventIds: string[]
  achievementProgress: AchievementProgress[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'selectChapter', chapterId: string): void
  (e: 'selectNode', node: MapNode): void
  (e: 'close'): void
}>()

const selectedNode = ref<MapNode | null>(null)
const showLegend = ref(false)

const mapPath = computed(() => getMapPath())

const nodeTypeLabels: Record<string, string> = {
  chapter: '章节',
  event: '剧情',
  milestone: '里程碑',
  branch: '分支'
}

const getNodeStatus = (node: MapNode) => {
  const isUnlocked = checkNodeUnlocked(node)
  const isVisited = props.visitedNodeIds.includes(node.id)
  const isCompleted = checkNodeCompleted(node)
  const isCurrent = node.chapterId === props.currentChapterId && node.type === 'chapter'

  return { isUnlocked, isVisited, isCompleted, isCurrent }
}

const checkNodeUnlocked = (node: MapNode): boolean => {
  if (!node.unlockCondition) {
    return true
  }

  const { type, params } = node.unlockCondition

  switch (type) {
    case 'chapter_complete': {
      const progress = props.chapterProgress[params.chapterId as string]
      return progress?.bestScore >= (params.minScore as number)
    }
    case 'score_threshold': {
      const progress = props.chapterProgress[params.chapterId as string]
      return progress?.bestScore >= (params.minScore as number)
    }
    case 'quest_complete': {
      return props.questState.completedQuests.includes(params.questId as string)
    }
    case 'phrase_collection': {
      return props.questState.phraseCollection.totalCollected >= (params.minCount as number)
    }
    default:
      return true
  }
}

const checkNodeCompleted = (node: MapNode): boolean => {
  if (node.type === 'chapter') {
    const progress = props.chapterProgress[node.chapterId]
    return progress?.bestScore >= 60
  }
  if (node.type === 'event') {
    return node.eventId ? props.completedEventIds.includes(node.eventId) : false
  }
  if (node.type === 'milestone') {
    return checkNodeUnlocked(node)
  }
  if (node.type === 'branch') {
    return checkNodeUnlocked(node)
  }
  return false
}

const getNodeConnections = () => {
  const connections: { from: MapNode; to: MapNode; completed: boolean }[] = []
  const path = mapPath.value

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]

    const mainLine = to.type === 'chapter' || to.type === 'milestone'
    if (mainLine) {
      connections.push({
        from,
        to,
        completed: checkNodeCompleted(from) && checkNodeUnlocked(to)
      })
    }
  }

  return connections
}

const connections = computed(() => getNodeConnections())

const getNodePosition = (node: MapNode) => {
  return {
    left: `${node.x}%`,
    top: `${node.y}%`
  }
}

const getChapterByNode = (node: MapNode) => {
  return props.chapters.find(ch => ch.id === node.chapterId)
}

const getNodeInfo = (node: MapNode) => {
  const chapter = getChapterByNode(node)
  const progress = props.chapterProgress[node.chapterId]
  const status = getNodeStatus(node)

  let rewards: string[] = []
  let requirements: string[] = []

  if (node.rewards) {
    node.rewards.forEach(r => {
      if (r.type === 'phrase' && r.params.phraseTexts) {
        rewards.push(...(r.params.phraseTexts as string[]))
      }
      if (r.type === 'title' && r.params.title) {
        rewards.push(`称号：${r.params.title}`)
      }
      if (r.type === 'score_boost' && r.params.dimension) {
        rewards.push(`评分加成：${r.params.dimension}`)
      }
    })
  }

  if (node.unlockCondition) {
    const { type, params } = node.unlockCondition
    switch (type) {
      case 'chapter_complete':
        requirements.push(`完成章节 ${params.chapterId}（${params.minScore}分以上）`)
        break
      case 'score_threshold':
        requirements.push(`在章节 ${params.chapterId} 获得 ${params.minScore} 分以上`)
        break
      case 'quest_complete':
        const quest = props.sideQuests.find(q => q.id === params.questId)
        requirements.push(`完成支线任务：${quest?.title || params.questId}`)
        break
      case 'phrase_collection':
        requirements.push(`收集 ${params.minCount} 个不同词句`)
        break
    }
  }

  const nodeAchievements = achievements.filter(a => a.chapterId === node.chapterId)
  const completedAchievements = nodeAchievements.filter(a =>
    props.achievementProgress.find(p => p.achievementId === a.id)?.completed
  )

  return {
    chapter,
    progress,
    status,
    rewards,
    requirements,
    achievements: nodeAchievements,
    completedAchievements
  }
}

const handleNodeClick = (node: MapNode) => {
  const status = getNodeStatus(node)
  if (!status.isUnlocked) return

  selectedNode.value = node

  if (node.type === 'chapter') {
    emit('selectChapter', node.chapterId)
  } else {
    emit('selectNode', node)
  }
}

const overallStats = computed(() => {
  const totalNodes = mapNodes.length
  const unlockedNodes = mapNodes.filter(n => checkNodeUnlocked(n)).length
  const completedNodes = mapNodes.filter(n => checkNodeCompleted(n)).length
  const visitedNodes = props.visitedNodeIds.length

  const totalAchievements = achievements.length
  const unlockedAchievements = props.achievementProgress.filter(p => p.unlocked).length
  const completedAchievements = props.achievementProgress.filter(p => p.completed).length

  const explorationPercent = Math.round((visitedNodes / totalNodes) * 100)

  return {
    totalNodes,
    unlockedNodes,
    completedNodes,
    visitedNodes,
    totalAchievements,
    unlockedAchievements,
    completedAchievements,
    explorationPercent
  }
})

const getAchievementRarityStyle = (rarity: string) => {
  const color = ACHIEVEMENT_RARITY_COLORS[rarity]
  return {
    color,
    borderColor: color,
    background: `${color}15`
  }
}
</script>

<template>
  <div class="travelmap-overlay" @click.self="emit('close')">
    <div class="travelmap-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-header-left">
          <h2 class="panel-title">游历地图</h2>
          <div class="stats-badge">
            <span class="stat-pill">
              <span class="stat-icon">🗺️</span>
              {{ overallStats.explorationPercent }}% 探索
            </span>
            <span class="stat-pill">
              <span class="stat-icon">🏆</span>
              {{ overallStats.completedAchievements }}/{{ overallStats.totalAchievements }} 成就
            </span>
            <span class="stat-pill">
              <span class="stat-icon">📍</span>
              {{ overallStats.visitedNodes }}/{{ overallStats.totalNodes }} 节点
            </span>
          </div>
        </div>
        <div class="panel-header-right">
          <button class="legend-btn" @click="showLegend = !showLegend">
            <span>📖</span> 图例
          </button>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>
      </div>

      <div v-if="showLegend" class="legend-panel">
        <div class="legend-title">地图图例</div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-dot" style="background: #c9a86c"></div>
            <span>章节节点</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #d4a5a0"></div>
            <span>剧情事件</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #a8c0d4"></div>
            <span>里程碑</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #7a9ea8"></div>
            <span>分支路线</span>
          </div>
          <div class="legend-item">
            <div class="legend-line" style="background: #6b8e6b"></div>
            <span>已通关路径</span>
          </div>
          <div class="legend-item">
            <div class="legend-line" style="background: var(--border)"></div>
            <span>未解锁路径</span>
          </div>
        </div>
      </div>

      <div class="map-container">
        <div class="map-canvas">
          <svg class="connections-svg">
            <line
              v-for="(conn, idx) in connections"
              :key="'conn-' + idx"
              :x1="conn.from.x + '%'"
              :y1="conn.from.y + '%'"
              :x2="conn.to.x + '%'"
              :y2="conn.to.y + '%'"
              :class="['connection-line', { completed: conn.completed }]"
            />
          </svg>

          <div
            v-for="node in mapPath"
            :key="node.id"
            class="map-node"
            :class="{
              unlocked: getNodeStatus(node).isUnlocked,
              visited: getNodeStatus(node).isVisited,
              completed: getNodeStatus(node).isCompleted,
              current: getNodeStatus(node).isCurrent,
              locked: !getNodeStatus(node).isUnlocked,
              [`type-${node.type}`]: true
            }"
            :style="{
              ...getNodePosition(node),
              borderColor: getNodeStatus(node).isUnlocked ? node.accentColor : undefined
            }"
            @click="handleNodeClick(node)"
          >
            <div class="node-icon" :style="{ color: getNodeStatus(node).isUnlocked ? node.accentColor : undefined }">
              {{ node.icon }}
            </div>
            <div class="node-label">{{ node.label }}</div>
            <div v-if="getNodeStatus(node).isCompleted" class="node-check">✓</div>
            <div v-if="!getNodeStatus(node).isUnlocked" class="node-lock">🔒</div>
            <div v-if="getNodeStatus(node).isCurrent" class="node-current-pulse"></div>
          </div>

          <div class="map-decoration decoration-1">🌸</div>
          <div class="map-decoration decoration-2">🍂</div>
          <div class="map-decoration decoration-3">❄️</div>
          <div class="map-decoration decoration-4">⚔️</div>
          <div class="map-decoration decoration-5">✨</div>
        </div>
      </div>

      <div v-if="selectedNode" class="node-detail-panel">
        <div class="detail-header" :style="{ borderColor: selectedNode.accentColor }">
          <div class="detail-icon" :style="{ color: selectedNode.accentColor }">{{ selectedNode.icon }}</div>
          <div class="detail-title-group">
            <h3 class="detail-title">{{ selectedNode.label }}</h3>
            <span class="detail-type" :style="{ color: selectedNode.accentColor }">
              {{ nodeTypeLabels[selectedNode.type] }}
            </span>
          </div>
          <button class="detail-close" @click="selectedNode = null">✕</button>
        </div>

        <div class="detail-content">
          <div v-if="getNodeInfo(selectedNode).chapter" class="detail-section">
            <div class="section-label">章节介绍</div>
            <p class="chapter-desc">{{ getNodeInfo(selectedNode).chapter?.description }}</p>
          </div>

          <div v-if="getNodeInfo(selectedNode).progress" class="detail-section">
            <div class="section-label">章节进度</div>
            <div class="progress-stats">
              <div class="progress-stat">
                <span class="progress-label">最佳分数</span>
                <span class="progress-value" :class="{ scored: getNodeInfo(selectedNode).progress?.bestScore > 0 }">
                  {{ getNodeInfo(selectedNode).progress?.bestScore || '--' }} 分
                </span>
              </div>
              <div class="progress-stat">
                <span class="progress-label">星级评价</span>
                <div class="progress-stars">
                  <span
                    v-for="s in 3"
                    :key="s"
                    class="star"
                    :class="{ filled: s <= (getNodeInfo(selectedNode).progress?.starRating || 0) }"
                  >★</span>
                </div>
              </div>
              <div class="progress-stat">
                <span class="progress-label">作品数量</span>
                <span class="progress-value">{{ getNodeInfo(selectedNode).progress?.compositionCount || 0 }} 首</span>
              </div>
            </div>
          </div>

          <div v-if="getNodeInfo(selectedNode).requirements.length > 0" class="detail-section">
            <div class="section-label">解锁条件</div>
            <ul class="requirements-list">
              <li v-for="(req, idx) in getNodeInfo(selectedNode).requirements" :key="idx" class="requirement-item">
                {{ req }}
              </li>
            </ul>
          </div>

          <div v-if="getNodeInfo(selectedNode).rewards.length > 0" class="detail-section">
            <div class="section-label">可得奖励</div>
            <div class="rewards-tags">
              <span v-for="(reward, idx) in getNodeInfo(selectedNode).rewards" :key="idx" class="reward-tag">
                {{ reward }}
              </span>
            </div>
          </div>

          <div v-if="getNodeInfo(selectedNode).achievements.length > 0" class="detail-section">
            <div class="section-label">
              相关成就
              <span class="achievement-count">
                {{ getNodeInfo(selectedNode).completedAchievements.length }}/{{ getNodeInfo(selectedNode).achievements.length }}
              </span>
            </div>
            <div class="achievements-grid">
              <div
                v-for="ach in getNodeInfo(selectedNode).achievements"
                :key="ach.id"
                class="achievement-card"
                :class="{ completed: props.achievementProgress.find(p => p.achievementId === ach.id)?.completed }"
                :style="getAchievementRarityStyle(ach.rarity)"
              >
                <div class="ach-icon">{{ ach.icon }}</div>
                <div class="ach-info">
                  <div class="ach-title">{{ ach.title }}</div>
                  <div class="ach-desc">{{ ach.description }}</div>
                  <div class="ach-rarity" :style="{ color: ACHIEVEMENT_RARITY_COLORS[ach.rarity] }">
                    {{ ACHIEVEMENT_RARITY_LABELS[ach.rarity] }} · {{ ACHIEVEMENT_CATEGORY_LABELS[ach.category] }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedNode.type === 'chapter' && getNodeStatus(selectedNode).isUnlocked" class="detail-actions">
            <button
              class="action-btn primary"
              :style="{ background: selectedNode.accentColor }"
              @click="emit('selectChapter', selectedNode.chapterId)"
            >
              进入章节
            </button>
          </div>
        </div>
      </div>

      <div v-if="!selectedNode" class="map-tip">
        <p>💡 点击地图上的节点查看详情，解锁章节、剧情事件和专属奖励</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.travelmap-overlay {
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

.travelmap-panel {
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.stats-badge {
  display: flex;
  gap: 8px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
}

.stat-icon {
  font-size: 14px;
}

.panel-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.legend-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.legend-panel {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border);
}

.legend-title {
  font-size: 13px;
  color: var(--accent-gold);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
}

.map-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(201, 168, 108, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(122, 158, 168, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(201, 139, 196, 0.05) 0%, transparent 60%);
}

.map-canvas {
  position: relative;
  width: 100%;
  min-height: 500px;
  height: 600px;
}

.connections-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-line {
  stroke: var(--border);
  stroke-width: 3;
  stroke-dasharray: 8 4;
  transition: all 0.5s ease;
}

.connection-line.completed {
  stroke: #6b8e6b;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 4px rgba(107, 142, 107, 0.4));
}

.map-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  z-index: 2;
}

.map-node:hover:not(.locked) {
  transform: translate(-50%, -50%) scale(1.1);
}

.map-node.locked {
  cursor: not-allowed;
  opacity: 0.5;
}

.map-node.completed {
  filter: saturate(1.2);
}

.map-node.current {
  z-index: 3;
}

.node-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 3px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.map-node.completed .node-icon {
  background: rgba(107, 142, 107, 0.15);
}

.map-node.locked .node-icon {
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--border) !important;
}

.node-label {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 500;
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.map-node.locked .node-label {
  color: var(--text-muted);
}

.node-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #6b8e6b;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-lock {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 14px;
}

.node-current-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--accent-gold);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 0; }
}

.map-decoration {
  position: absolute;
  font-size: 32px;
  opacity: 0.15;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

.decoration-1 { top: 10%; left: 5%; animation-delay: 0s; }
.decoration-2 { top: 20%; right: 10%; animation-delay: 1s; }
.decoration-3 { bottom: 15%; left: 15%; animation-delay: 2s; }
.decoration-4 { bottom: 10%; right: 5%; animation-delay: 3s; }
.decoration-5 { top: 40%; right: 3%; animation-delay: 4s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.node-detail-panel {
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  max-height: 320px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.02);
}

.detail-icon {
  font-size: 36px;
}

.detail-title-group {
  flex: 1;
}

.detail-title {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 2px;
}

.detail-type {
  font-size: 12px;
  letter-spacing: 1px;
}

.detail-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 14px;
}

.detail-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.detail-content {
  padding: 20px 24px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  color: var(--accent-gold);
  letter-spacing: 1px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.achievement-count {
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.chapter-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.progress-stats {
  display: flex;
  gap: 24px;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 11px;
  color: var(--text-muted);
}

.progress-value {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-value.scored {
  color: var(--accent-gold);
}

.progress-stars {
  display: flex;
  gap: 2px;
}

.progress-stars .star {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.1);
}

.progress-stars .star.filled {
  color: var(--accent-gold);
  text-shadow: 0 0 8px rgba(201, 168, 108, 0.5);
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requirement-item {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 6px 0;
  padding-left: 20px;
  position: relative;
}

.requirement-item::before {
  content: '◇';
  position: absolute;
  left: 0;
  color: var(--accent-gold);
}

.rewards-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-tag {
  font-size: 12px;
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.achievement-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.02);
  opacity: 0.6;
  transition: all 0.2s ease;
}

.achievement-card.completed {
  opacity: 1;
  background: rgba(255, 215, 0, 0.05);
}

.ach-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.ach-info {
  flex: 1;
  min-width: 0;
}

.ach-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 4px;
}

.ach-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 4px;
}

.ach-rarity {
  font-size: 10px;
  letter-spacing: 1px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.action-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  color: white;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.map-tip {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  text-align: center;
}

.map-tip p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .travelmap-overlay {
    padding: 12px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .panel-header-left {
    flex-wrap: wrap;
  }

  .stats-badge {
    flex-wrap: wrap;
  }

  .map-canvas {
    height: 450px;
    min-height: 450px;
  }

  .node-icon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }

  .node-label {
    font-size: 11px;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .progress-stats {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
