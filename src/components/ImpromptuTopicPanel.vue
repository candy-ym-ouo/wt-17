<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { ImpromptuTopic, ImpromptuTopicState, Phrase, ScoreBreakdown, PhraseCategory, PhraseRarity } from '@/types'
import { TIME_PERIOD_LABELS, TIME_PERIOD_ICONS, type TimePeriod } from '@/types'
import { getCurrentTimePeriod, generateImpromptuTopic, impromptuTopicThemes, getImpromptuTopicThemeById, evaluateImpromptuBonusRules } from '@/data/impromptuTopics'
import { loadImpromptuState, saveImpromptuResult, determineImpromptuRewardTier, claimImpromptuReward, isImpromptuRewardClaimed, getBestImpromptuResult, formatTime } from '@/utils/impromptuTopic'
import { getAllPhrases, generateChapterPhrases, rarityLabels, rarityColors, createChapterSource } from '@/data/phrases'
import { calculateScore } from '@/utils/scoring'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'startSession', topic: ImpromptuTopic, phrases: Phrase[], scoringPreference: Partial<import('@/types').ScoreWeights>, themeMatchBonus: number, preferredCategories: PhraseCategory[]): void
  (e: 'claimReward', topicId: string, tier: string, rewards: ImpromptuTopic['rewards'][0]['rewards']): void
}>()

const impromptuState = ref<ImpromptuTopicState>(loadImpromptuState())
const currentPeriod = ref<TimePeriod>(getCurrentTimePeriod())
const currentTopic = ref<ImpromptuTopic | null>(null)
const isGenerating = ref(false)

const sessionActive = ref(false)
const sessionPhrases = ref<Phrase[]>([])
const sessionBoardPhrases = ref<Phrase[]>([])
const sessionElapsedSeconds = ref(0)
const sessionIsRunning = ref(true)
const sessionIsTimeUp = ref(false)
let sessionTimer: number | null = null

const eligibleThemes = computed(() => {
  return impromptuTopicThemes.filter(t => t.periodAffinity.includes(currentPeriod.value))
})

const periodLabel = computed(() => TIME_PERIOD_LABELS[currentPeriod.value])
const periodIcon = computed(() => TIME_PERIOD_ICONS[currentPeriod.value])

const handleGenerate = () => {
  isGenerating.value = true
  setTimeout(() => {
    currentTopic.value = generateImpromptuTopic(currentPeriod.value)
    isGenerating.value = false
  }, 600)
}

const handleStartSession = () => {
  if (!currentTopic.value) return
  const theme = getImpromptuTopicThemeById(currentTopic.value.themeId)
  if (!theme) return

  const allPhrases = getAllPhrases()
  const source = createChapterSource('impromptu', '临场命题')
  const poolPhrases = generateChapterPhrases(
    theme.keywords,
    20,
    theme.categoryWeights,
    currentTopic.value.forbiddenWords
  ).map(p => ({ ...p, id: `ip_${p.id}_${Date.now()}`, source }))

  sessionPhrases.value = poolPhrases
  sessionBoardPhrases.value = []
  sessionElapsedSeconds.value = 0
  sessionIsRunning.value = true
  sessionIsTimeUp.value = false
  sessionActive.value = true

  startSessionTimer()
}

const startSessionTimer = () => {
  if (sessionTimer) clearInterval(sessionTimer)
  sessionTimer = window.setInterval(() => {
    if (sessionIsRunning.value && currentTopic.value) {
      sessionElapsedSeconds.value++
      if (sessionElapsedSeconds.value >= currentTopic.value.timeLimitSeconds) {
        sessionIsTimeUp.value = true
        sessionIsRunning.value = false
        handleSubmit()
      }
    }
  }, 1000)
}

const stopSessionTimer = () => {
  if (sessionTimer) {
    clearInterval(sessionTimer)
    sessionTimer = null
  }
}

const timeRemaining = computed(() => {
  if (!currentTopic.value) return 0
  return Math.max(0, currentTopic.value.timeLimitSeconds - sessionElapsedSeconds.value)
})

const timeProgress = computed(() => {
  if (!currentTopic.value) return 1
  return Math.max(0, 1 - sessionElapsedSeconds.value / currentTopic.value.timeLimitSeconds)
})

const isTimeLow = computed(() => timeRemaining.value <= 30 && timeRemaining.value > 0)
const isTimeCritical = computed(() => timeRemaining.value <= 10 && timeRemaining.value > 0)

const sessionScore = computed<ScoreBreakdown>(() => {
  if (!currentTopic.value || sessionBoardPhrases.value.length === 0) {
    return { coherence: 0, imagery: 0, rhythm: 0, themeMatch: 0, total: 0 }
  }
  const theme = getImpromptuTopicThemeById(currentTopic.value.themeId)
  const fakeChapter = {
    id: 'impromptu',
    title: currentTopic.value.title,
    subtitle: '',
    description: currentTopic.value.description,
    theme: theme?.name || '',
    backgroundGradient: '',
    accentColor: currentTopic.value.accentColor,
    phrases: sessionPhrases.value,
    unlocked: true,
    targetPhraseCount: currentTopic.value.targetPhraseCount,
    hint: currentTopic.value.description,
    qualifierWords: currentTopic.value.requiredKeywords,
    forbiddenWords: currentTopic.value.forbiddenWords
  }
  return calculateScore(sessionBoardPhrases.value, fakeChapter, {}, theme ? {
    wordPool: { keywords: theme.keywords, categoryWeights: theme.categoryWeights },
    scoring: { scoreWeights: theme.scoringPreference, themeMatchBonus: theme.themeMatchBonus, preferredCategories: theme.preferredCategories },
    titlePattern: { connector: '·', preferCategories: theme.preferredCategories, maxWords: 2 },
    background: { gradient: '', particleColor: '', gridOpacity: 0 },
    decoration: 'stars' as const,
    id: theme.id,
    name: theme.name,
    description: theme.description,
    icon: theme.icon,
    accentColor: theme.accentColor
  } : undefined)
})

const sessionBonusResult = computed(() => {
  if (!currentTopic.value) return { totalBonus: 0, triggeredLabels: [] }
  const theme = getImpromptuTopicThemeById(currentTopic.value.themeId)
  return evaluateImpromptuBonusRules(
    sessionBoardPhrases.value,
    currentTopic.value.bonusRules,
    sessionElapsedSeconds.value,
    theme?.keywords || []
  )
})

const requiredKeywordsMet = computed(() => {
  if (!currentTopic.value) return []
  const boardTexts = new Set(sessionBoardPhrases.value.map(p => p.text))
  return currentTopic.value.requiredKeywords.map(kw => ({
    keyword: kw,
    met: boardTexts.has(kw)
  }))
})

const forbiddenUsed = computed(() => {
  if (!currentTopic.value) return []
  const boardTexts = new Set(sessionBoardPhrases.value.map(p => p.text))
  return currentTopic.value.forbiddenWords.filter(w => boardTexts.has(w))
})

const handleSelectPhrase = (phrase: Phrase) => {
  if (sessionBoardPhrases.value.find(p => p.id === phrase.id)) return
  sessionBoardPhrases.value.push(phrase)
}

const handleRemovePhrase = (phraseId: string) => {
  sessionBoardPhrases.value = sessionBoardPhrases.value.filter(p => p.id !== phraseId)
}

const handleSubmit = () => {
  if (!currentTopic.value) return
  stopSessionTimer()

  const finalScore = sessionScore.value.total + sessionBonusResult.value.totalBonus
  const rewardTier = determineImpromptuRewardTier(finalScore, currentTopic.value.rewards)

  const now = Date.now()
  saveImpromptuResult({
    topicId: currentTopic.value.id,
    compositionId: `icomp_${now}`,
    score: sessionScore.value.total,
    timeUsedSeconds: sessionElapsedSeconds.value,
    completedAt: now,
    bonusAdjustment: sessionBonusResult.value.totalBonus,
    triggeredBonuses: sessionBonusResult.value.triggeredLabels,
    rewardTier
  })
  impromptuState.value = loadImpromptuState()
  sessionActive.value = false

  if (rewardTier) {
    const reward = currentTopic.value.rewards.find(r => r.tier === rewardTier)
    if (reward && !isImpromptuRewardClaimed(currentTopic.value.id, rewardTier)) {
      emit('claimReward', currentTopic.value.id, rewardTier, reward.rewards)
    }
  }
}

const handleQuitSession = () => {
  stopSessionTimer()
  sessionActive.value = false
  sessionBoardPhrases.value = []
  sessionPhrases.value = []
}

const handleClaimReward = (topicId: string, tier: string) => {
  const results = loadImpromptuState().topicResults[topicId]
  if (!results || results.length === 0) return
  const topic = currentTopic.value
  if (!topic) return
  const reward = topic.rewards.find(r => r.tier === tier)
  if (!reward) return
  claimImpromptuReward(topicId, tier)
  emit('claimReward', topicId, tier, reward.rewards)
  impromptuState.value = loadImpromptuState()
}

const getRarityClass = (rarity: PhraseRarity) => `rarity-${rarity}`

onMounted(() => {
  currentPeriod.value = getCurrentTimePeriod()
})

onUnmounted(() => {
  stopSessionTimer()
})

watch(() => props.visible, (val) => {
  if (val) {
    currentPeriod.value = getCurrentTimePeriod()
    impromptuState.value = loadImpromptuState()
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="impromptu-overlay" @click.self="emit('close')">
      <div class="impromptu-panel">
        <template v-if="!sessionActive">
          <div class="panel-header">
            <div class="header-left">
              <span class="panel-icon">🎯</span>
              <span class="panel-title">临场命题</span>
            </div>
            <button class="close-btn" @click="emit('close')">✕</button>
          </div>

          <div class="period-banner" :style="{ borderColor: 'var(--accent-gold)' + '30' }">
            <span class="period-icon">{{ periodIcon }}</span>
            <span class="period-label">当前时段</span>
            <span class="period-name">{{ periodLabel }}</span>
          </div>

          <div class="eligible-themes" v-if="eligibleThemes.length > 0">
            <div class="section-label">此时段可选意境</div>
            <div class="theme-chips">
              <div v-for="theme in eligibleThemes" :key="theme.id" class="theme-chip" :style="{ borderColor: theme.accentColor + '40' }">
                <span class="chip-icon">{{ theme.icon }}</span>
                <span class="chip-name" :style="{ color: theme.accentColor }">{{ theme.name }}</span>
              </div>
            </div>
          </div>

          <div v-if="!currentTopic" class="generate-section">
            <div class="generate-hint">
              根据当前时段「{{ periodLabel }}」生成临场命题，限时创作，获取专属奖励
            </div>
            <button class="generate-btn" @click="handleGenerate" :disabled="isGenerating">
              <span v-if="isGenerating" class="generating-spinner">◎</span>
              <span v-else>🎯 生成命题</span>
            </button>
          </div>

          <div v-if="currentTopic" class="topic-detail">
            <div class="topic-header" :style="{ borderColor: currentTopic.accentColor + '40' }">
              <div class="topic-title-row">
                <span class="topic-title" :style="{ color: currentTopic.accentColor }">{{ currentTopic.title }}</span>
              </div>
              <div class="topic-subtitle">{{ currentTopic.subtitle }}</div>
              <div class="topic-description">{{ currentTopic.description }}</div>
            </div>

            <div class="topic-rules">
              <div class="rules-section">
                <span class="rules-label">必选关键词</span>
                <div class="keyword-tags">
                  <span v-for="kw in currentTopic.requiredKeywords" :key="kw" class="kw-tag required" :style="{ borderColor: currentTopic.accentColor + '50' }">
                    {{ kw }}
                  </span>
                </div>
              </div>
              <div v-if="currentTopic.forbiddenWords.length > 0" class="rules-section">
                <span class="rules-label">禁用词</span>
                <div class="keyword-tags">
                  <span v-for="w in currentTopic.forbiddenWords" :key="w" class="kw-tag forbidden">
                    {{ w }}
                  </span>
                </div>
              </div>
              <div class="rules-section">
                <span class="rules-label">加分规则</span>
                <div class="bonus-list">
                  <div v-for="rule in currentTopic.bonusRules" :key="rule.label" class="bonus-item">
                    <span class="bonus-label">{{ rule.label }}</span>
                    <span class="bonus-desc">{{ rule.description }}</span>
                    <span class="bonus-value" :style="{ color: currentTopic.accentColor }">+{{ rule.bonus }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="topic-rewards">
              <span class="rules-label">奖励</span>
              <div class="reward-tiers">
                <div v-for="reward in currentTopic.rewards" :key="reward.tier" class="reward-tier" :class="`tier-${reward.tier}`">
                  <span class="tier-label">{{ { bronze: '铜', silver: '银', gold: '金' }[reward.tier] }}</span>
                  <span class="tier-min">≥{{ reward.minScore }}分</span>
                </div>
              </div>
            </div>

            <div class="topic-actions">
              <button class="regenerate-btn" @click="handleGenerate" :disabled="isGenerating">
                换一题
              </button>
              <button class="start-btn" :style="{ background: `linear-gradient(135deg, ${currentTopic.accentColor}, ${currentTopic.accentColor}cc)` }" @click="handleStartSession">
                开始创作
              </button>
            </div>
          </div>

          <div class="completed-section" v-if="impromptuState.totalCompleted > 0">
            <div class="section-label">已完成 {{ impromptuState.totalCompleted }} 次临场命题</div>
          </div>
        </template>

        <template v-if="sessionActive && currentTopic">
          <div class="session-container">
            <div class="session-header" :style="{ borderColor: currentTopic.accentColor + '30' }">
              <div class="session-top-bar">
                <button class="quit-btn" @click="handleQuitSession">✕ 退出</button>
                <div class="session-title" :style="{ color: currentTopic.accentColor }">{{ currentTopic.title }}</div>
                <div class="timer-block" :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }">
                  <span class="timer-icon">⏱</span>
                  <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
                </div>
              </div>
              <div class="timer-track">
                <div class="timer-fill" :class="{ 'time-low': isTimeLow, 'time-critical': isTimeCritical }" :style="{ width: (timeProgress * 100) + '%' }"></div>
              </div>
              <div class="session-meta">
                <div class="keyword-check">
                  <span v-for="kw in requiredKeywordsMet" :key="kw.keyword" class="kw-chip" :class="{ met: kw.met }" :style="{ borderColor: kw.met ? currentTopic.accentColor + '60' : undefined }">
                    <span class="kw-icon">{{ kw.met ? '✓' : '○' }}</span>
                    {{ kw.keyword }}
                  </span>
                </div>
                <div v-if="forbiddenUsed.length > 0" class="forbidden-warn">
                  ⚠ 禁用词：{{ forbiddenUsed.join('、') }}
                </div>
              </div>
            </div>

            <div class="session-body">
              <div class="phrase-pool-section">
                <div class="pool-header">
                  <span class="pool-title">词池</span>
                  <span class="pool-count">{{ sessionBoardPhrases.length }} / {{ currentTopic.targetPhraseCount }}</span>
                </div>
                <div class="phrase-grid">
                  <button v-for="phrase in sessionPhrases" :key="phrase.id" class="phrase-chip" :class="[getRarityClass(phrase.rarity)]" :style="{ borderColor: rarityColors[phrase.rarity] + '30' }" @click="handleSelectPhrase(phrase)">
                    <span class="phrase-text">{{ phrase.text }}</span>
                    <span class="phrase-rarity" :style="{ color: rarityColors[phrase.rarity] }">{{ rarityLabels[phrase.rarity] }}</span>
                  </button>
                </div>
              </div>

              <div class="board-section">
                <div class="board-header">
                  <span class="board-title">画布</span>
                  <span class="board-score" :style="{ color: currentTopic.accentColor }">
                    {{ sessionScore.total }}分
                    <span v-if="sessionBonusResult.totalBonus > 0" class="bonus-badge" :style="{ background: currentTopic.accentColor + '20', color: currentTopic.accentColor }">
                      +{{ sessionBonusResult.totalBonus }}
                    </span>
                  </span>
                </div>
                <div class="board-phrases">
                  <div v-for="bp in sessionBoardPhrases" :key="bp.id" class="board-phrase" :class="[getRarityClass(bp.rarity)]">
                    <span class="bp-text">{{ bp.text }}</span>
                    <button class="bp-remove" @click="handleRemovePhrase(bp.id)">✕</button>
                  </div>
                  <div v-if="sessionBoardPhrases.length === 0" class="board-empty">
                    从词池中选择词句...
                  </div>
                </div>

                <div v-if="sessionBonusResult.triggeredLabels.length > 0" class="bonus-triggered">
                  <span v-for="label in sessionBonusResult.triggeredLabels" :key="label" class="bonus-label-chip" :style="{ borderColor: currentTopic.accentColor + '40', color: currentTopic.accentColor }">
                    ✦ {{ label }}
                  </span>
                </div>
              </div>
            </div>

            <div class="session-footer">
              <div class="score-summary">
                <div class="score-dims">
                  <span class="dim" v-for="dim in ['coherence', 'imagery', 'rhythm', 'themeMatch']" :key="dim">
                    <span class="dim-label">{{ { coherence: '连贯', imagery: '意象', rhythm: '韵律', themeMatch: '契合' }[dim] }}</span>
                    <span class="dim-value">{{ (sessionScore as any)[dim] }}</span>
                  </span>
                </div>
              </div>
              <button class="submit-btn" :disabled="sessionBoardPhrases.length === 0" :style="{ background: sessionBoardPhrases.length > 0 ? `linear-gradient(135deg, ${currentTopic.accentColor}, ${currentTopic.accentColor}cc)` : undefined, color: sessionBoardPhrases.length > 0 ? '#1a1a2e' : undefined }" @click="handleSubmit">
                {{ sessionIsTimeUp ? '时间到，提交作品' : '提交作品' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.impromptu-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}

.impromptu-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 22px;
  color: var(--accent-gold);
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 3px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.period-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(201, 168, 108, 0.06);
  border: 1px solid;
  border-radius: 12px;
  margin-bottom: 18px;
}

.period-icon {
  font-size: 20px;
}

.period-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.period-name {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--accent-gold);
  letter-spacing: 2px;
}

.eligible-themes {
  margin-bottom: 20px;
}

.section-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.theme-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.chip-icon {
  font-size: 14px;
}

.chip-name {
  font-size: 13px;
  font-family: var(--font-serif);
  letter-spacing: 1px;
}

.generate-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
}

.generate-hint {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.7;
  max-width: 400px;
}

.generate-btn {
  padding: 12px 36px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--accent-gold), #a8884c);
  color: #1a1a2e;
  font-size: 16px;
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 2px;
  transition: all 0.2s ease;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 168, 108, 0.35);
}

.generate-btn:disabled {
  opacity: 0.6;
}

.generating-spinner {
  display: inline-block;
  animation: spinSlow 1s linear infinite;
}

@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.topic-detail {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.topic-header {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid;
  border-radius: 14px;
  margin-bottom: 16px;
}

.topic-title-row {
  margin-bottom: 6px;
}

.topic-title {
  font-family: var(--font-brush);
  font-size: 22px;
  letter-spacing: 2px;
}

.topic-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.topic-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.topic-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.rules-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rules-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.keyword-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.kw-tag {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid;
}

.kw-tag.required {
  background: rgba(201, 168, 108, 0.08);
  color: var(--text-primary);
  border-color: rgba(201, 168, 108, 0.3);
}

.kw-tag.forbidden {
  background: rgba(139, 69, 87, 0.08);
  color: #e07070;
  border-color: rgba(139, 69, 87, 0.3);
  text-decoration: line-through;
}

.bonus-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bonus-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.bonus-label {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  min-width: 72px;
}

.bonus-desc {
  font-size: 11px;
  color: var(--text-muted);
  flex: 1;
}

.bonus-value {
  font-size: 13px;
  font-weight: 600;
}

.topic-rewards {
  margin-bottom: 20px;
}

.reward-tiers {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.reward-tier {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.reward-tier.tier-gold {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.06);
}

.reward-tier.tier-silver {
  border-color: rgba(192, 192, 192, 0.3);
  background: rgba(192, 192, 192, 0.04);
}

.reward-tier.tier-bronze {
  border-color: rgba(205, 127, 50, 0.3);
  background: rgba(205, 127, 50, 0.04);
}

.tier-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.tier-min {
  font-size: 11px;
  color: var(--text-muted);
}

.topic-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.regenerate-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  font-family: var(--font-serif);
}

.regenerate-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.start-btn {
  padding: 10px 28px;
  border-radius: 10px;
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 600;
  font-family: var(--font-serif);
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.completed-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.session-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 500px;
}

.session-header {
  padding: 14px 0;
  border-bottom: 1px solid;
  margin-bottom: 16px;
}

.session-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.quit-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

.quit-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.session-title {
  font-family: var(--font-brush);
  font-size: 18px;
  letter-spacing: 2px;
}

.timer-block {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 10px;
  background: rgba(201, 168, 108, 0.1);
  transition: all 0.3s ease;
}

.timer-block.time-low {
  background: rgba(212, 165, 112, 0.15);
  animation: pulseSoft 1.5s ease-in-out infinite;
}

.timer-block.time-critical {
  background: rgba(139, 69, 87, 0.2);
  animation: pulseSoft 0.8s ease-in-out infinite;
}

.timer-icon { font-size: 14px; }

.timer-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-serif);
}

.time-low .timer-value { color: #d4a574; }
.time-critical .timer-value { color: #e07070; }

.timer-track {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-fill {
  height: 100%;
  background: var(--accent-gold);
  border-radius: 2px;
  transition: width 1s linear;
}

.timer-fill.time-low { background: #d4a574; }
.timer-fill.time-critical { background: #e07070; }

.session-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.keyword-check {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.kw-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.kw-chip.met {
  color: var(--text-primary);
  background: rgba(201, 168, 108, 0.08);
}

.kw-icon { font-size: 10px; }
.kw-chip.met .kw-icon { color: var(--accent-gold); }

.forbidden-warn {
  font-size: 11px;
  color: #e07070;
  padding: 3px 8px;
  background: rgba(224, 112, 112, 0.08);
  border-radius: 4px;
}

.session-body {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 300px;
}

.phrase-pool-section {
  width: 45%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-header,
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-title,
.board-title {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
}

.pool-count {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.phrase-grid {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
}

.phrase-chip {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.phrase-chip:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.phrase-text {
  font-size: 13px;
  color: var(--text-primary);
}

.phrase-rarity {
  font-size: 9px;
  opacity: 0.7;
}

.board-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-score {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bonus-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.board-phrases {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  min-height: 120px;
}

.board-phrase {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.2);
}

.bp-text { font-size: 13px; color: var(--text-primary); }

.bp-remove {
  font-size: 10px;
  color: var(--text-muted);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.bp-remove:hover {
  background: rgba(224, 112, 112, 0.2);
  color: #e07070;
}

.board-empty {
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px;
}

.bonus-triggered {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bonus-label-chip {
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 6px;
  font-size: 11px;
  animation: fadeIn 0.5s ease;
}

.session-footer {
  padding: 12px 0;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.score-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-dims {
  display: flex;
  gap: 10px;
}

.dim {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dim-label {
  font-size: 10px;
  color: var(--text-muted);
}

.dim-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.submit-btn {
  padding: 9px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.submit-btn:disabled {
  opacity: 0.3;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.rarity-common {}
.rarity-rare .phrase-text, .rarity-rare .bp-text { color: #5b9ea8; }
.rarity-epic .phrase-text, .rarity-epic .bp-text { color: #a87ac9; }
.rarity-legendary .phrase-text, .rarity-legendary .bp-text { color: #c9a86c; }

@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
