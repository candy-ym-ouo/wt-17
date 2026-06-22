<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { JieqiInfo, JieqiSeason, JieqiState, JieqiChapter, Composition, JieqiPhrase, JieqiQuest } from '@/types'
import { jieqiList, getCurrentJieqi, getJieqiChapter, getJieqiQuests, isJieqiUnlocked, getJieqiPhrases } from '@/data/jieqi'
import { 
  loadJieqiState, 
  refreshJieqiUnlocks, 
  getJieqiBestScore, 
  completeJieqiChapter, 
  isJieqiChapterCompleted,
  getJieqiQuestStatus,
  claimJieqiQuestReward,
  isJieqiPhraseUnlocked
} from '@/utils/jieqi'
import { JIEQI_SEASON_LABELS, JIEQI_SEASON_COLORS } from '@/types'

const props = defineProps<{
  compositions: Composition[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startChapter', chapterId: string, jieqiId: string): void
  (e: 'openPortfolio'): void
}>()

const jieqiState = ref<JieqiState>(loadJieqiState())
const selectedSeason = ref<JieqiSeason>('春')
const selectedJieqi = ref<JieqiInfo | null>(null)
const showDetail = ref(false)
const activeTab = ref<'chapter' | 'quests' | 'phrases'>('chapter')
const claimMessage = ref<string>('')

const seasons: JieqiSeason[] = ['春', '夏', '秋', '冬']

const currentJieqi = computed(() => {
  return getCurrentJieqi()
})

const seasonJieqi = computed(() => {
  return jieqiList.filter(j => j.season === selectedSeason.value)
})

const selectedJieqiChapter = computed((): JieqiChapter | null => {
  if (!selectedJieqi.value) return null
  return getJieqiChapter(`jq_${selectedJieqi.value.id}`) || null
})

const selectedJieqiQuests = computed<JieqiQuest[]>(() => {
  if (!selectedJieqi.value) return []
  return getJieqiQuests(selectedJieqi.value.id)
})

const selectedJieqiPhrases = computed<JieqiPhrase[]>(() => {
  if (!selectedJieqi.value) return []
  return getJieqiPhrases(selectedJieqi.value.id)
})

const selectedJieqiBestScore = computed(() => {
  if (!selectedJieqi.value) return 0
  const chapterId = `jq_${selectedJieqi.value.id}`
  return getJieqiBestScore(chapterId, props.compositions)
})

const selectedJieqiCompleted = computed(() => {
  if (!selectedJieqi.value) return false
  const chapterId = `jq_${selectedJieqi.value.id}`
  return isJieqiChapterCompleted(chapterId)
})

const questProgress = computed(() => {
  if (!selectedJieqi.value) return { completed: 0, total: 0, percentage: 0 }
  const quests = selectedJieqiQuests.value
  const completed = quests.filter(q => {
    const status = getJieqiQuestStatus(q.id)
    return status === 'completed' || status === 'claimed'
  }).length
  return {
    completed,
    total: quests.length,
    percentage: quests.length > 0 ? Math.round((completed / quests.length) * 100) : 0
  }
})

const phraseProgress = computed(() => {
  if (!selectedJieqi.value) return { unlocked: 0, total: 0, percentage: 0 }
  const phrases = selectedJieqiPhrases.value
  const unlocked = phrases.filter(p => isJieqiPhraseUnlocked(p.text, selectedJieqi.value!.id)).length
  return {
    unlocked,
    total: phrases.length,
    percentage: phrases.length > 0 ? Math.round((unlocked / phrases.length) * 100) : 0
  }
})

const totalProgress = computed(() => {
  const total = jieqiList.length
  const completed = Object.keys(jieqiState.value.completedChapters).filter(
    id => jieqiState.value.completedChapters[id]
  ).length
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

const refreshState = () => {
  jieqiState.value = loadJieqiState()
}

const handleSelectSeason = (season: JieqiSeason) => {
  selectedSeason.value = season
  showDetail.value = false
  selectedJieqi.value = null
  activeTab.value = 'chapter'
}

const handleSelectJieqi = (jieqi: JieqiInfo) => {
  if (!isJieqiUnlocked(jieqi.id)) return
  selectedJieqi.value = jieqi
  showDetail.value = true
  activeTab.value = 'chapter'
  claimMessage.value = ''
}

const handleStartChapter = () => {
  if (!selectedJieqi.value || !selectedJieqiChapter.value) return
  if (!isJieqiUnlocked(selectedJieqi.value.id)) return
  emit('startChapter', selectedJieqiChapter.value.id, selectedJieqi.value.id)
}

const handleClaimReward = (questId: string) => {
  const result = claimJieqiQuestReward(questId)
  if (result.success) {
    claimMessage.value = result.rewards.join('、')
    refreshState()
    setTimeout(() => {
      claimMessage.value = ''
    }, 3000)
  }
}

const getQuestStatus = (questId: string) => {
  return getJieqiQuestStatus(questId)
}

const getPhraseUnlocked = (phraseText: string) => {
  if (!selectedJieqi.value) return false
  return isJieqiPhraseUnlocked(phraseText, selectedJieqi.value.id)
}

const handleBack = () => {
  showDetail.value = false
  selectedJieqi.value = null
  activeTab.value = 'chapter'
  claimMessage.value = ''
}

const getJieqiStatus = (jieqi: JieqiInfo): 'locked' | 'unlocked' | 'completed' => {
  if (!isJieqiUnlocked(jieqi.id)) return 'locked'
  const chapterId = `jq_${jieqi.id}`
  if (jieqiState.value.completedChapters[chapterId]) return 'completed'
  return 'unlocked'
}

onMounted(() => {
  jieqiState.value = refreshJieqiUnlocks()
  
  const current = getCurrentJieqi()
  if (current) {
    selectedSeason.value = current.season
  }
})
</script>

<template>
  <div class="jieqi-modal-overlay" @click.self="emit('close')">
    <div class="jieqi-modal">
      <div class="jieqi-modal-header">
        <div class="jieqi-title-section">
          <span class="jieqi-modal-icon">🎋</span>
          <div>
            <h2 class="jieqi-modal-title">节序雅集</h2>
            <p class="jieqi-modal-subtitle">二十四节气限定活动</p>
          </div>
        </div>
        <button class="jieqi-close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="jieqi-modal-body">
        <div v-if="!showDetail" class="jieqi-overview">
          <div class="jieqi-progress-card">
            <div class="progress-header">
              <span class="progress-label">年度进度</span>
              <span class="progress-value">{{ totalProgress.completed }}/{{ totalProgress.total }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: totalProgress.percentage + '%' }"
              ></div>
            </div>
            <div class="progress-total">{{ totalProgress.percentage }}%</div>
          </div>

          <div v-if="currentJieqi" class="current-jieqi-card" @click="handleSelectJieqi(currentJieqi)">
            <div class="current-label">当前节气</div>
            <div class="current-jieqi-info">
              <span class="current-jieqi-icon">{{ currentJieqi.icon }}</span>
              <div class="current-jieqi-text">
                <span class="current-jieqi-name">{{ currentJieqi.name }}</span>
                <span class="current-jieqi-date">{{ currentJieqi.month }}月{{ currentJieqi.day }}日</span>
              </div>
              <span class="current-jieqi-action">进入 →</span>
            </div>
          </div>

          <div class="season-tabs">
            <button
              v-for="season in seasons"
              :key="season"
              class="season-tab"
              :class="{ active: selectedSeason === season }"
              :style="{ '--season-color': JIEQI_SEASON_COLORS[season] }"
              @click="handleSelectSeason(season)"
            >
              {{ JIEQI_SEASON_LABELS[season] }}
            </button>
          </div>

          <div class="jieqi-grid">
            <div
              v-for="jieqi in seasonJieqi"
              :key="jieqi.id"
              class="jieqi-card"
              :class="{
                locked: getJieqiStatus(jieqi) === 'locked',
                completed: getJieqiStatus(jieqi) === 'completed',
                current: currentJieqi?.id === jieqi.id
              }"
              :style="{ '--jieqi-color': jieqi.accentColor }"
              @click="handleSelectJieqi(jieqi)"
            >
              <div class="jieqi-card-icon">{{ jieqi.icon }}</div>
              <div class="jieqi-card-name">{{ jieqi.name }}</div>
              <div class="jieqi-card-date">{{ jieqi.month }}.{{ jieqi.day }}</div>
              <div v-if="getJieqiStatus(jieqi) === 'locked'" class="jieqi-card-lock">🔒</div>
              <div v-else-if="getJieqiStatus(jieqi) === 'completed'" class="jieqi-card-check">✓</div>
              <div v-else-if="currentJieqi?.id === jieqi.id" class="jieqi-card-badge">进行中</div>
            </div>
          </div>

          <div class="jieqi-portfolio-entry" @click="emit('openPortfolio')">
            <span class="portfolio-icon">📖</span>
            <div class="portfolio-text">
              <span class="portfolio-title">纪念作品册</span>
              <span class="portfolio-desc">珍藏每一个节气的诗意</span>
            </div>
            <span class="portfolio-arrow">→</span>
          </div>
        </div>

        <div v-else class="jieqi-detail">
          <button class="jieqi-back-btn" @click="handleBack">← 返回</button>

          <div 
            class="jieqi-detail-header"
            :style="{ background: selectedJieqi?.backgroundGradient }"
          >
            <span class="detail-jieqi-icon">{{ selectedJieqi?.icon }}</span>
            <div class="detail-jieqi-info">
              <h3 class="detail-jieqi-name">{{ selectedJieqi?.name }}</h3>
              <p class="detail-jieqi-poem">{{ selectedJieqi?.poem }}</p>
            </div>
          </div>

          <div class="detail-tabs">
            <button 
              class="detail-tab" 
              :class="{ active: activeTab === 'chapter' }"
              @click="activeTab = 'chapter'"
            >
              限定章节
            </button>
            <button 
              class="detail-tab" 
              :class="{ active: activeTab === 'quests' }"
              @click="activeTab = 'quests'"
            >
              任务链
              <span v-if="questProgress.completed > 0" class="tab-badge">
                {{ questProgress.completed }}/{{ questProgress.total }}
              </span>
            </button>
            <button 
              class="detail-tab" 
              :class="{ active: activeTab === 'phrases' }"
              @click="activeTab = 'phrases'"
            >
              限定词库
              <span v-if="phraseProgress.unlocked > 0" class="tab-badge">
                {{ phraseProgress.unlocked }}/{{ phraseProgress.total }}
              </span>
            </button>
          </div>

          <div class="jieqi-detail-content">
            <div v-if="activeTab === 'chapter'" class="tab-content">
              <div v-if="selectedJieqiChapter" class="jieqi-chapter-section">
                <div class="chapter-card">
                  <div class="chapter-info">
                    <div>
                      <h5 class="chapter-title">{{ selectedJieqiChapter.title }}</h5>
                      <p class="chapter-subtitle">{{ selectedJieqiChapter.subtitle }}</p>
                    </div>
                    <div class="chapter-difficulty" :class="selectedJieqiChapter.difficulty">
                      {{ selectedJieqiChapter.difficulty === 'easy' ? '简单' : selectedJieqiChapter.difficulty === 'medium' ? '中等' : '困难' }}
                    </div>
                  </div>
                  <p class="chapter-desc">{{ selectedJieqiChapter.description }}</p>
                  <div class="chapter-stats">
                    <div class="stat-item">
                      <span class="stat-label">目标词句</span>
                      <span class="stat-value">{{ selectedJieqiChapter.targetPhraseCount }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">最佳分数</span>
                      <span class="stat-value">{{ selectedJieqiBestScore }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">状态</span>
                      <span class="stat-value" :class="{ completed: selectedJieqiCompleted }">
                        {{ selectedJieqiCompleted ? '已完成' : '未完成' }}
                      </span>
                    </div>
                  </div>
                  <button 
                    class="start-chapter-btn"
                    :style="{ '--btn-color': selectedJieqi?.accentColor }"
                    @click="handleStartChapter"
                  >
                    {{ selectedJieqiCompleted ? '再次挑战' : '开始创作' }}
                  </button>
                </div>
              </div>

              <div class="jieqi-hint-section">
                <h4 class="section-title">创作提示</h4>
                <div class="hint-card">
                  <p class="hint-text">{{ selectedJieqiChapter?.hint }}</p>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'quests'" class="tab-content">
              <div v-if="claimMessage" class="claim-success">
                <span class="claim-icon">🎉</span>
                <span class="claim-text">{{ claimMessage }}</span>
              </div>
              
              <div v-if="selectedJieqiQuests.length === 0" class="empty-state">
                <span class="empty-icon">📋</span>
                <span class="empty-text">暂无任务</span>
              </div>
              
              <div v-else class="quest-list">
                <div
                  v-for="(quest, index) in selectedJieqiQuests"
                  :key="quest.id"
                  class="quest-item"
                  :class="getQuestStatus(quest.id)"
                >
                  <div class="quest-icon">{{ quest.icon }}</div>
                  <div class="quest-info">
                    <h5 class="quest-title">{{ quest.title }}</h5>
                    <p class="quest-desc">{{ quest.description }}</p>
                    <div class="quest-rewards">
                      <span 
                        v-for="(reward, rIdx) in quest.rewards"
                        :key="rIdx"
                        class="reward-tag"
                      >
                        <template v-if="reward.type === 'phrase_unlock'">
                          🔓 {{ reward.params.phraseTexts?.join('、') || '限定词' }}
                        </template>
                        <template v-else-if="reward.type === 'title_reward'">
                          🏆 {{ reward.params.title || '限定称号' }}
                        </template>
                      </span>
                    </div>
                  </div>
                  <div class="quest-status">
                    <span v-if="getQuestStatus(quest.id) === 'locked'" class="status-locked">
                      🔒 未解锁
                    </span>
                    <span v-else-if="getQuestStatus(quest.id) === 'unlocked'" class="status-unlocked">
                      进行中
                    </span>
                    <span v-else-if="getQuestStatus(quest.id) === 'completed'" class="status-completed">
                      ✓ 可领取
                    </span>
                    <span v-else-if="getQuestStatus(quest.id) === 'claimed'" class="status-claimed">
                      ✓ 已领取
                    </span>
                    <button
                      v-if="getQuestStatus(quest.id) === 'completed'"
                      class="claim-btn"
                      @click="handleClaimReward(quest.id)"
                    >
                      领取
                    </button>
                  </div>
                  <div class="quest-order">{{ index + 1 }}</div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'phrases'" class="tab-content">
              <div class="phrase-progress-info">
                <span>已解锁 {{ phraseProgress.unlocked }} / {{ phraseProgress.total }} 个限定词</span>
                <div class="mini-progress">
                  <div 
                    class="mini-progress-fill"
                    :style="{ width: phraseProgress.percentage + '%' }"
                  ></div>
                </div>
              </div>
              
              <div class="phrase-list">
                <div
                  v-for="phrase in selectedJieqiPhrases"
                  :key="phrase.text"
                  class="phrase-item"
                  :class="[
                    `rarity-${phrase.rarity}`,
                    { locked: !getPhraseUnlocked(phrase.text) }
                  ]"
                >
                  <div class="phrase-text">{{ phrase.text }}</div>
                  <div class="phrase-info">
                    <span class="phrase-category">{{ phrase.category === 'scene' ? '景物' : phrase.category === 'emotion' ? '情感' : phrase.category === 'time' ? '时间' : phrase.category === 'action' ? '动作' : '意象' }}</span>
                    <span v-if="phrase.isExclusive" class="phrase-exclusive">限定</span>
                  </div>
                  <div v-if="!getPhraseUnlocked(phrase.text)" class="phrase-lock">🔒</div>
                  <div v-else class="phrase-unlocked">✓</div>
                </div>
              </div>
              
              <div class="phrase-hint">
                <span class="hint-icon">💡</span>
                <span class="hint-text">完成任务链任务即可解锁更多限定词句</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jieqi-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.jieqi-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  animation: societyReveal 0.4s ease-out;
}

.jieqi-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(201, 168, 108, 0.05);
}

.jieqi-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.jieqi-modal-icon {
  font-size: 32px;
}

.jieqi-modal-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--accent-gold);
  margin: 0;
}

.jieqi-modal-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

.jieqi-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.jieqi-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.jieqi-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.jieqi-progress-card {
  background: rgba(201, 168, 108, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 14px;
  color: var(--accent-gold);
  font-weight: 500;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), #e8c878);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-total {
  text-align: right;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.current-jieqi-card {
  background: linear-gradient(135deg, rgba(124, 169, 124, 0.15), rgba(124, 169, 124, 0.05));
  border: 1px solid rgba(124, 169, 124, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.current-jieqi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(124, 169, 124, 0.2);
}

.current-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.current-jieqi-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-jieqi-icon {
  font-size: 36px;
}

.current-jieqi-text {
  flex: 1;
}

.current-jieqi-name {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.current-jieqi-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.current-jieqi-action {
  color: var(--accent-gold);
  font-size: 14px;
}

.season-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.season-tab {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-serif);
  transition: all 0.2s;
  border: 1px solid transparent;
}

.season-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.season-tab.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--season-color);
  border-color: var(--season-color);
}

.jieqi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.jieqi-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.jieqi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--jieqi-color);
  opacity: 0.6;
}

.jieqi-card:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-color: var(--jieqi-color);
}

.jieqi-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.jieqi-card.completed {
  border-color: var(--jieqi-color);
  background: rgba(255, 255, 255, 0.05);
}

.jieqi-card.current {
  animation: glowPulse 2s ease-in-out infinite;
  border-color: var(--jieqi-color);
}

.jieqi-card-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.jieqi-card-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.jieqi-card-date {
  font-size: 11px;
  color: var(--text-muted);
}

.jieqi-card-lock,
.jieqi-card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
}

.jieqi-card-check {
  color: var(--jieqi-color);
}

.jieqi-card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  padding: 2px 6px;
  background: var(--jieqi-color);
  color: var(--bg-primary);
  border-radius: 4px;
  font-weight: 600;
}

.jieqi-portfolio-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(155, 89, 182, 0.1);
  border: 1px solid rgba(155, 89, 182, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.jieqi-portfolio-entry:hover {
  background: rgba(155, 89, 182, 0.15);
  transform: translateY(-1px);
}

.portfolio-icon {
  font-size: 28px;
}

.portfolio-text {
  flex: 1;
}

.portfolio-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.portfolio-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.portfolio-arrow {
  color: var(--text-secondary);
  font-size: 18px;
}

.jieqi-detail {
  animation: fadeSlideIn 0.3s ease-out;
}

.jieqi-back-btn {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 0;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.jieqi-back-btn:hover {
  color: var(--text-primary);
}

.jieqi-detail-header {
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-jieqi-icon {
  font-size: 48px;
}

.detail-jieqi-name {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.detail-jieqi-poem {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

.detail-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.detail-tab {
  padding: 10px 16px;
  background: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-serif);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
  position: relative;
}

.detail-tab:hover {
  color: var(--text-primary);
}

.detail-tab.active {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
}

.tab-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  font-size: 11px;
  border-radius: 10px;
}

.jieqi-detail-content {
  min-height: 300px;
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 3px solid var(--accent-gold);
}

.jieqi-chapter-section {
  margin-bottom: 20px;
}

.chapter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.chapter-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.chapter-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.chapter-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.chapter-difficulty {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.chapter-difficulty.easy {
  background: rgba(124, 169, 124, 0.2);
  color: #7ca97c;
}

.chapter-difficulty.medium {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.chapter-difficulty.hard {
  background: rgba(201, 91, 91, 0.2);
  color: #c95b5b;
}

.chapter-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 16px;
}

.chapter-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-value.completed {
  color: #7ca97c;
}

.start-chapter-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--btn-color), color-mix(in srgb, var(--btn-color) 70%, white));
  color: var(--bg-primary);
  font-size: 15px;
  font-weight: 500;
  font-family: var(--font-serif);
  transition: all 0.3s;
}

.start-chapter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.jieqi-hint-section {
  margin-top: 20px;
}

.hint-card {
  padding: 14px 16px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 10px;
  border-left: 3px solid var(--accent-gold);
}

.hint-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.7;
}

.claim-success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(124, 169, 124, 0.15);
  border: 1px solid rgba(124, 169, 124, 0.3);
  border-radius: 10px;
  animation: fadeIn 0.3s ease-out;
}

.claim-icon {
  font-size: 20px;
}

.claim-text {
  font-size: 14px;
  color: #7ca97c;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  position: relative;
  transition: all 0.2s;
}

.quest-item.locked {
  opacity: 0.6;
}

.quest-item.completed {
  border-color: rgba(124, 169, 124, 0.4);
  background: rgba(124, 169, 124, 0.08);
}

.quest-item.claimed {
  opacity: 0.7;
}

.quest-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.quest-info {
  flex: 1;
  min-width: 0;
}

.quest-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.quest-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
}

.quest-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reward-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  font-size: 11px;
  border-radius: 4px;
}

.quest-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.status-locked {
  font-size: 12px;
  color: var(--text-muted);
}

.status-unlocked {
  font-size: 12px;
  color: var(--accent-gold);
}

.status-completed {
  font-size: 12px;
  color: #7ca97c;
  font-weight: 500;
}

.status-claimed {
  font-size: 12px;
  color: var(--text-muted);
}

.claim-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #7ca97c, #5d8a5d);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}

.claim-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(124, 169, 124, 0.4);
}

.quest-order {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phrase-progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.mini-progress {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: var(--accent-gold);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.phrase-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.phrase-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  position: relative;
  transition: all 0.2s;
}

.phrase-item.locked {
  opacity: 0.5;
}

.phrase-item.rarity-rare {
  border-color: rgba(52, 152, 219, 0.3);
  background: rgba(52, 152, 219, 0.05);
}

.phrase-item.rarity-epic {
  border-color: rgba(155, 89, 182, 0.3);
  background: rgba(155, 89, 182, 0.05);
}

.phrase-item.rarity-legendary {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.phrase-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.phrase-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.phrase-category {
  font-size: 11px;
  color: var(--text-muted);
}

.phrase-exclusive {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
  border-radius: 4px;
}

.phrase-lock,
.phrase-unlocked {
  font-size: 14px;
  margin-left: 4px;
}

.phrase-unlocked {
  color: #7ca97c;
}

.phrase-hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 10px;
  border-left: 3px solid var(--accent-gold);
}

.phrase-hint .hint-icon {
  font-size: 16px;
}

.phrase-hint .hint-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes societyReveal {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(201, 168, 108, 0.5); }
  50% { box-shadow: 0 0 20px rgba(201, 168, 108, 0.8), 0 0 40px rgba(201, 168, 108, 0.4); }
}

@media (max-width: 600px) {
  .jieqi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .jieqi-modal {
    max-height: 90vh;
  }
  
  .phrase-list {
    grid-template-columns: 1fr;
  }
}
</style>
