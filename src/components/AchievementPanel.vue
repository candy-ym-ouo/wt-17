<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Achievement, AchievementProgress, Chapter, QuestState } from '@/types'
import { achievements } from '@/data/travelMap'
import { ACHIEVEMENT_RARITY_LABELS, ACHIEVEMENT_RARITY_COLORS, ACHIEVEMENT_CATEGORY_LABELS } from '@/types'

interface Props {
  chapters: Chapter[]
  achievementProgress: AchievementProgress[]
  questState: QuestState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectedAchievement = ref<Achievement | null>(null)
const filterCategory = ref<string>('all')
const filterRarity = ref<string>('all')
const filterStatus = ref<string>('all')
const sortBy = ref<string>('rarity')

const categories = [
  { value: 'all', label: '全部' },
  { value: 'chapter', label: '章节' },
  { value: 'score', label: '评分' },
  { value: 'collection', label: '收集' },
  { value: 'combo', label: '组合' },
  { value: 'streak', label: '连胜' },
  { value: 'exploration', label: '探索' }
]

const rarities = [
  { value: 'all', label: '全部' },
  { value: 'bronze', label: '青铜' },
  { value: 'silver', label: '白银' },
  { value: 'gold', label: '黄金' },
  { value: 'platinum', label: '铂金' }
]

const statuses = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已完成' },
  { value: 'unlocked', label: '已解锁' },
  { value: 'locked', label: '未解锁' }
]

const sortOptions = [
  { value: 'rarity', label: '稀有度' },
  { value: 'category', label: '类别' },
  { value: 'progress', label: '进度' }
]

const rarityOrder: Record<string, number> = {
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1
}

const getAchievementStatus = (achievement: Achievement) => {
  const progress = props.achievementProgress.find(p => p.achievementId === achievement.id)
  return {
    unlocked: progress?.unlocked || false,
    completed: progress?.completed || false,
    claimed: progress?.claimed || false,
    unlockedAt: progress?.unlockedAt,
    completedAt: progress?.completedAt
  }
}

const filteredAchievements = computed(() => {
  let result = [...achievements]

  if (filterCategory.value !== 'all') {
    result = result.filter(a => a.category === filterCategory.value)
  }

  if (filterRarity.value !== 'all') {
    result = result.filter(a => a.rarity === filterRarity.value)
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(a => {
      const status = getAchievementStatus(a)
      if (filterStatus.value === 'completed') return status.completed
      if (filterStatus.value === 'unlocked') return status.unlocked && !status.completed
      if (filterStatus.value === 'locked') return !status.unlocked
      return true
    })
  }

  result.sort((a, b) => {
    if (sortBy.value === 'rarity') {
      return rarityOrder[b.rarity] - rarityOrder[a.rarity]
    }
    if (sortBy.value === 'category') {
      return a.category.localeCompare(b.category)
    }
    if (sortBy.value === 'progress') {
      const statusA = getAchievementStatus(a)
      const statusB = getAchievementStatus(b)
      const scoreA = (statusA.completed ? 3 : 0) + (statusA.unlocked ? 1 : 0)
      const scoreB = (statusB.completed ? 3 : 0) + (statusB.unlocked ? 1 : 0)
      return scoreB - scoreA
    }
    return 0
  })

  return result
})

const overallStats = computed(() => {
  const total = achievements.length
  const completed = props.achievementProgress.filter(p => p.completed).length
  const unlocked = props.achievementProgress.filter(p => p.unlocked && !p.completed).length
  const locked = total - completed - unlocked

  const byRarity: Record<string, { total: number; completed: number }> = {}
  const byCategory: Record<string, { total: number; completed: number }> = {}

  achievements.forEach(ach => {
    const status = getAchievementStatus(ach)

    if (!byRarity[ach.rarity]) {
      byRarity[ach.rarity] = { total: 0, completed: 0 }
    }
    byRarity[ach.rarity].total++
    if (status.completed) byRarity[ach.rarity].completed++

    if (!byCategory[ach.category]) {
      byCategory[ach.category] = { total: 0, completed: 0 }
    }
    byCategory[ach.category].total++
    if (status.completed) byCategory[ach.category].completed++
  })

  return {
    total,
    completed,
    unlocked,
    locked,
    percent: Math.round((completed / total) * 100),
    byRarity,
    byCategory
  }
})

const getAchievementRarityStyle = (rarity: string, completed: boolean) => {
  const color = ACHIEVEMENT_RARITY_COLORS[rarity]
  return {
    color: completed ? color : undefined,
    borderColor: completed ? color : 'var(--border)',
    background: completed ? `${color}15` : 'rgba(255, 255, 255, 0.02)'
  }
}

const getChapterTitle = (chapterId: string) => {
  return props.chapters.find(ch => ch.id === chapterId)?.title || chapterId
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '--'
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleAchievementClick = (achievement: Achievement) => {
  selectedAchievement.value = achievement
}
</script>

<template>
  <div class="achievement-overlay" @click.self="emit('close')">
    <div class="achievement-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-header-left">
          <h2 class="panel-title">成就收集</h2>
          <div class="stats-badge">
            <span class="stat-pill">
              <span class="stat-icon">🏆</span>
              {{ overallStats.completed }}/{{ overallStats.total }} 已完成
            </span>
            <span class="stat-pill">
              <span class="stat-icon">📊</span>
              {{ overallStats.percent }}% 进度
            </span>
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="stats-overview">
        <div class="overview-card">
          <div class="overview-icon" style="color: #6b8e6b">✓</div>
          <div class="overview-info">
            <div class="overview-value">{{ overallStats.completed }}</div>
            <div class="overview-label">已完成</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="overview-icon" style="color: #c9a86c">🔓</div>
          <div class="overview-info">
            <div class="overview-value">{{ overallStats.unlocked }}</div>
            <div class="overview-label">进行中</div>
          </div>
        </div>
        <div class="overview-card">
          <div class="overview-icon" style="color: var(--text-muted)">🔒</div>
          <div class="overview-info">
            <div class="overview-value">{{ overallStats.locked }}</div>
            <div class="overview-label">未解锁</div>
          </div>
        </div>
      </div>

      <div class="rarity-breakdown">
        <div
          v-for="rarity in ['platinum', 'gold', 'silver', 'bronze']"
          :key="rarity"
          class="rarity-item"
        >
          <div class="rarity-dot" :style="{ background: ACHIEVEMENT_RARITY_COLORS[rarity] }"></div>
          <span class="rarity-name">{{ ACHIEVEMENT_RARITY_LABELS[rarity] }}</span>
          <span class="rarity-count">
            {{ overallStats.byRarity[rarity]?.completed || 0 }}/{{ overallStats.byRarity[rarity]?.total || 0 }}
          </span>
          <div class="rarity-bar">
            <div
              class="rarity-bar-fill"
              :style="{
                width: overallStats.byRarity[rarity]
                  ? `${(overallStats.byRarity[rarity].completed / overallStats.byRarity[rarity].total) * 100}%`
                  : '0%',
                background: ACHIEVEMENT_RARITY_COLORS[rarity]
              }"
            ></div>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label class="filter-label">类别</label>
          <select v-model="filterCategory" class="filter-select">
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">稀有度</label>
          <select v-model="filterRarity" class="filter-select">
            <option v-for="rar in rarities" :key="rar.value" :value="rar.value">
              {{ rar.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">状态</label>
          <select v-model="filterStatus" class="filter-select">
            <option v-for="st in statuses" :key="st.value" :value="st.value">
              {{ st.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">排序</label>
          <select v-model="sortBy" class="filter-select">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="achievements-container">
        <div v-if="filteredAchievements.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>没有找到符合条件的成就</p>
        </div>
        <div v-else class="achievements-grid">
          <div
            v-for="ach in filteredAchievements"
            :key="ach.id"
            class="achievement-card"
            :class="{
              completed: getAchievementStatus(ach).completed,
              unlocked: getAchievementStatus(ach).unlocked && !getAchievementStatus(ach).completed,
              locked: !getAchievementStatus(ach).unlocked,
              selected: selectedAchievement?.id === ach.id,
              secret: ach.isSecret && !getAchievementStatus(ach).unlocked
            }"
            :style="getAchievementRarityStyle(ach.rarity, getAchievementStatus(ach).completed)"
            @click="handleAchievementClick(ach)"
          >
            <div class="ach-icon">
              <template v-if="ach.isSecret && !getAchievementStatus(ach).unlocked">❓</template>
              <template v-else>{{ ach.icon }}</template>
            </div>
            <div class="ach-info">
              <div class="ach-title">
                <template v-if="ach.isSecret && !getAchievementStatus(ach).unlocked">???</template>
                <template v-else>{{ ach.title }}</template>
              </div>
              <div class="ach-desc">
                <template v-if="ach.isSecret && !getAchievementStatus(ach).unlocked">
                  完成特定条件解锁隐藏成就
                </template>
                <template v-else>{{ ach.description }}</template>
              </div>
              <div class="ach-meta">
                <span class="ach-rarity" :style="{ color: ACHIEVEMENT_RARITY_COLORS[ach.rarity] }">
                  {{ ACHIEVEMENT_RARITY_LABELS[ach.rarity] }}
                </span>
                <span class="ach-category">
                  {{ ACHIEVEMENT_CATEGORY_LABELS[ach.category] }}
                </span>
                <span v-if="getAchievementStatus(ach).completed" class="ach-status completed">
                  ✓ 已完成
                </span>
                <span v-else-if="getAchievementStatus(ach).unlocked" class="ach-status unlocked">
                  进行中
                </span>
                <span v-else class="ach-status locked">
                  未解锁
                </span>
              </div>
            </div>
            <div v-if="getAchievementStatus(ach).completed" class="ach-check">✓</div>
            <div v-else-if="!getAchievementStatus(ach).unlocked" class="ach-lock">🔒</div>
          </div>
        </div>
      </div>

      <div v-if="selectedAchievement" class="achievement-detail">
        <div
          class="detail-header"
          :style="{ borderColor: ACHIEVEMENT_RARITY_COLORS[selectedAchievement.rarity] }"
        >
          <div
            class="detail-icon"
            :style="{ color: ACHIEVEMENT_RARITY_COLORS[selectedAchievement.rarity] }"
          >
            {{ selectedAchievement.icon }}
          </div>
          <div class="detail-title-group">
            <h3 class="detail-title">{{ selectedAchievement.title }}</h3>
            <div class="detail-meta">
              <span
                class="detail-rarity"
                :style="{ color: ACHIEVEMENT_RARITY_COLORS[selectedAchievement.rarity] }"
              >
                {{ ACHIEVEMENT_RARITY_LABELS[selectedAchievement.rarity] }}
              </span>
              <span class="detail-category">
                {{ ACHIEVEMENT_CATEGORY_LABELS[selectedAchievement.category] }}
              </span>
              <span class="detail-chapter">
                {{ getChapterTitle(selectedAchievement.chapterId) }}
              </span>
            </div>
          </div>
          <button class="detail-close" @click="selectedAchievement = null">✕</button>
        </div>

        <div class="detail-content">
          <div class="detail-section">
            <div class="section-label">成就描述</div>
            <p class="detail-desc">{{ selectedAchievement.description }}</p>
          </div>

          <div v-if="selectedAchievement.hint" class="detail-section">
            <div class="section-label">💡 提示</div>
            <p class="detail-hint">{{ selectedAchievement.hint }}</p>
          </div>

          <div class="detail-section">
            <div class="section-label">完成进度</div>
            <div class="progress-info">
              <div class="progress-item">
                <span class="progress-label">解锁状态</span>
                <span
                  class="progress-value"
                  :class="{ completed: getAchievementStatus(selectedAchievement).unlocked }"
                >
                  {{ getAchievementStatus(selectedAchievement).unlocked ? '已解锁' : '未解锁' }}
                </span>
              </div>
              <div class="progress-item">
                <span class="progress-label">完成状态</span>
                <span
                  class="progress-value"
                  :class="{ completed: getAchievementStatus(selectedAchievement).completed }"
                >
                  {{ getAchievementStatus(selectedAchievement).completed ? '已完成' : '未完成' }}
                </span>
              </div>
              <div class="progress-item">
                <span class="progress-label">解锁时间</span>
                <span class="progress-value">
                  {{ formatDate(getAchievementStatus(selectedAchievement).unlockedAt) }}
                </span>
              </div>
              <div class="progress-item">
                <span class="progress-label">完成时间</span>
                <span class="progress-value">
                  {{ formatDate(getAchievementStatus(selectedAchievement).completedAt) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedAchievement.rewards.length > 0" class="detail-section">
            <div class="section-label">🎁 奖励</div>
            <div class="rewards-list">
              <div
                v-for="(reward, idx) in selectedAchievement.rewards"
                :key="idx"
                class="reward-item"
              >
                <span v-if="reward.type === 'phrase_unlock'" class="reward-icon">📜</span>
                <span v-else-if="reward.type === 'title_reward'" class="reward-icon">👑</span>
                <span v-else-if="reward.type === 'score_weight_boost'" class="reward-icon">⭐</span>
                <span v-else-if="reward.type === 'phrase_pool_refresh'" class="reward-icon">🔄</span>
                <span class="reward-text">
                  <template v-if="reward.type === 'phrase_unlock'">
                    解锁词句：{{ (reward.params.phraseTexts as string[]).join('、') }}
                  </template>
                  <template v-else-if="reward.type === 'title_reward'">
                    获得称号：{{ reward.params.title }}
                  </template>
                  <template v-else-if="reward.type === 'score_weight_boost'">
                    评分加成：{{ reward.params.dimension }} +{{ (reward.params.boost as number) * 100 }}%
                  </template>
                  <template v-else-if="reward.type === 'phrase_pool_refresh'">
                    词库刷新
                  </template>
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedAchievement.completeConditions.length > 0" class="detail-section">
            <div class="section-label">📋 完成条件</div>
            <ul class="conditions-list">
              <li
                v-for="(cond, idx) in selectedAchievement.completeConditions"
                :key="idx"
                class="condition-item"
              >
                <template v-if="cond.type === 'score_threshold'">
                  在章节 {{ cond.params.chapterId }} 获得 {{ cond.params.minScore }} 分以上
                </template>
                <template v-else-if="cond.type === 'composition_count'">
                  创作 {{ cond.params.minCount }} 首作品
                  <template v-if="cond.params.chapterId !== '__all__'">
                    （章节：{{ cond.params.chapterId }}）
                  </template>
                </template>
                <template v-else-if="cond.type === 'chapter_count'">
                  完成 {{ cond.params.minCount }} 个章节
                </template>
                <template v-else-if="cond.type === 'category_diversity'">
                  在一首诗中使用 {{ cond.params.minCategories }} 个不同类别的词句
                </template>
                <template v-else-if="cond.type === 'perfect_clear'">
                  在章节 {{ cond.params.chapterId }} 获得完美评价
                </template>
                <template v-else>
                  {{ cond.type }}: {{ JSON.stringify(cond.params) }}
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-overlay {
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

.achievement-panel {
  width: 100%;
  max-width: 1100px;
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.overview-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.rarity-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--border);
}

.rarity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rarity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rarity-name {
  width: 40px;
  font-size: 12px;
  color: var(--text-secondary);
}

.rarity-count {
  width: 60px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.rarity-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.rarity-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.01);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.filter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: var(--accent-gold);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-gold);
}

.achievements-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.achievement-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.achievement-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.achievement-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.achievement-card.completed {
  opacity: 1;
}

.achievement-card.selected {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.achievement-card.secret {
  filter: grayscale(1);
}

.ach-icon {
  font-size: 32px;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
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
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ach-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ach-rarity {
  font-size: 10px;
  letter-spacing: 1px;
  font-weight: 500;
}

.ach-category {
  font-size: 10px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.ach-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.ach-status.completed {
  color: #6b8e6b;
  background: rgba(107, 142, 107, 0.15);
}

.ach-status.unlocked {
  color: #c9a86c;
  background: rgba(201, 168, 108, 0.15);
}

.ach-status.locked {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.ach-check {
  position: absolute;
  top: 8px;
  right: 8px;
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

.ach-lock {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
  opacity: 0.6;
}

.achievement-detail {
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  max-height: 350px;
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
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.detail-title-group {
  flex: 1;
}

.detail-title {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-rarity {
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: 500;
}

.detail-category,
.detail-chapter {
  font-size: 11px;
  color: var(--text-muted);
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
}

.detail-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.detail-hint {
  font-size: 13px;
  color: #c9a86c;
  line-height: 1.8;
  padding: 12px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 8px;
  border-left: 3px solid #c9a86c;
}

.progress-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.progress-label {
  font-size: 12px;
  color: var(--text-muted);
}

.progress-value {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-value.completed {
  color: #6b8e6b;
  font-weight: 500;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(201, 168, 108, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.reward-icon {
  font-size: 18px;
}

.reward-text {
  font-size: 13px;
  color: var(--text-primary);
}

.conditions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.condition-item {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  line-height: 1.6;
}

.condition-item::before {
  content: '◇';
  position: absolute;
  left: 0;
  color: var(--accent-gold);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .achievement-overlay {
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

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    gap: 12px;
  }

  .filter-group {
    flex: 1;
    min-width: 120px;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .progress-info {
    grid-template-columns: 1fr;
  }
}
</style>
