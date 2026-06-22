<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Composition, PoetrySocietyState, SocietySubmission, SubmissionStatus, ReviewVerdict, ExhibitionEntry, ReputationRank, RareChapter } from '@/types'
import { REPUTATION_RANK_ORDER, REPUTATION_RANK_MIN, REPUTATION_RANK_COLORS, REPUTATION_RANK_ICONS } from '@/types'
import { exhibitionThemes, rareChapters, reputationMilestones, reviewCriteria, getExhibitionThemeById, getRareChapterById } from '@/data/poetrySociety'
import { submitToSociety, reviewSubmission, exhibitComposition, featureExhibition, getReputationProgress, canSubmit, canExhibit, checkRareChapterUnlocks, claimMilestoneReward, isMilestoneRewardClaimed, getReviewScore } from '@/utils/poetrySociety'

interface Props {
  compositions: Composition[]
  societyState: PoetrySocietyState
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', compositionId: string): void
  (e: 'review', submissionId: string, compositionId: string): void
  (e: 'exhibit', compositionId: string, themeId: string): void
  (e: 'feature', entryId: string): void
  (e: 'unlockRareChapter', chapterId: string): void
  (e: 'claimMilestone', rank: ReputationRank): void
}>()

const activeTab = ref<'submit' | 'review' | 'exhibit' | 'reputation' | 'rare'>('submit')
const selectedCompositionId = ref<string | null>(null)
const reviewingSubmissionId = ref<string | null>(null)
const exhibitThemeId = ref<string | null>(null)

const tabs = [
  { key: 'submit' as const, label: '投稿', icon: '✉️' },
  { key: 'review' as const, label: '审核', icon: '📜' },
  { key: 'exhibit' as const, label: '展陈', icon: '🏛️' },
  { key: 'reputation' as const, label: '声望', icon: '⭐' },
  { key: 'rare' as const, label: '秘卷', icon: '🔮' }
]

const submittableCompositions = computed(() => {
  return props.compositions.filter(comp => {
    const result = canSubmit(comp)
    return result.canSubmit && comp.score.total >= 40
  })
})

const reviewedSubmissions = computed(() => {
  return props.societyState.submissions.filter(s => s.status !== 'pending')
})

const pendingSubmissions = computed(() => {
  return props.societyState.submissions.filter(s => s.status === 'pending')
})

const reputationProgress = computed(() => {
  return getReputationProgress(props.societyState.reputation)
})

const currentRankColor = computed(() => {
  return REPUTATION_RANK_COLORS[props.societyState.currentRank]
})

const currentRankIcon = computed(() => {
  return REPUTATION_RANK_ICONS[props.societyState.currentRank]
})

const availableExhibitions = computed(() => {
  const rankIndex = REPUTATION_RANK_ORDER.indexOf(props.societyState.currentRank)
  if (rankIndex < 1) return []
  if (rankIndex >= 4) return exhibitionThemes
  return exhibitionThemes.slice(0, Math.min(rankIndex, exhibitionThemes.length - 1))
})

const exhibitionEntries = computed(() => {
  return props.societyState.exhibitions
})

const unlockableRareChapters = computed(() => {
  const state = props.societyState
  return rareChapters.map(ch => {
    const rankIndex = REPUTATION_RANK_ORDER.indexOf(state.currentRank)
    const requiredIndex = REPUTATION_RANK_ORDER.indexOf(ch.requiredRank)
    const isUnlocked = state.unlockedRareChapterIds.includes(ch.id)
    const canUnlock = !isUnlocked && rankIndex >= requiredIndex && state.reputation >= ch.requiredReputation
    const isLocked = !isUnlocked && !canUnlock
    return { ...ch, isUnlocked, canUnlock, isLocked }
  })
})

const statusLabels: Record<SubmissionStatus, string> = {
  pending: '审核中',
  accepted: '已收录',
  rejected: '未收录',
  showcased: '展陈推荐'
}

const statusColors: Record<SubmissionStatus, string> = {
  pending: '#7a9ea8',
  accepted: '#7ca97c',
  rejected: '#8b4557',
  showcased: '#c9a86c'
}

const verdictLabels: Record<ReviewVerdict, string> = {
  accept: '收录',
  reject: '退稿',
  showcase: '展陈推荐'
}

const getCompositionById = (id: string): Composition | undefined => {
  return props.compositions.find(c => c.id === id)
}

const getCompositionTitle = (id: string): string => {
  return getCompositionById(id)?.title || '未知作品'
}

const getCompositionScore = (id: string): number => {
  return getCompositionById(id)?.score.total || 0
}

const getThemeExhibitionEntries = (themeId: string): ExhibitionEntry[] => {
  return exhibitionEntries.value.filter(e => e.themeId === themeId)
}

const getThemeSlotInfo = (themeId: string) => {
  const theme = getExhibitionThemeById(themeId)
  if (!theme) return { used: 0, max: 0 }
  const used = getThemeExhibitionEntries(themeId).length
  return { used, max: theme.maxSlots }
}

const handleCompositionSelect = (compId: string) => {
  selectedCompositionId.value = compId
}

const handleSubmit = () => {
  if (!selectedCompositionId.value) return
  emit('submit', selectedCompositionId.value)
  selectedCompositionId.value = null
}

const handleReview = (submissionId: string) => {
  const submission = props.societyState.submissions.find(s => s.id === submissionId)
  if (!submission) return
  emit('review', submissionId, submission.compositionId)
}

const handleExhibit = (compositionId: string, themeId: string) => {
  emit('exhibit', compositionId, themeId)
}

const handleFeature = (entryId: string) => {
  emit('feature', entryId)
}

const handleUnlockRare = (chapterId: string) => {
  emit('unlockRareChapter', chapterId)
}

const handleClaimMilestone = (rank: ReputationRank) => {
  emit('claimMilestone', rank)
}
</script>

<template>
  <div class="society-overlay" @click.self="emit('close')">
    <div class="society-panel" @click.stop>
      <div class="panel-header">
        <div class="header-title-row">
          <span class="header-icon">🏛️</span>
          <h2 class="panel-title">诗社经营</h2>
        </div>
        <div class="header-rank" :style="{ color: currentRankColor, borderColor: currentRankColor + '40' }">
          <span class="rank-icon">{{ currentRankIcon }}</span>
          <span class="rank-name">{{ societyState.currentRank }}</span>
          <span class="rank-rep">{{ societyState.reputation }}</span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          :style="activeTab === tab.key ? { borderBottomColor: currentRankColor, color: currentRankColor } : {}"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.key === 'review' && pendingSubmissions.length > 0" class="tab-badge">{{ pendingSubmissions.length }}</span>
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'submit'" class="submit-tab">
          <div class="submit-info">
            <p class="info-text">选择一首作品投稿至诗社，等待社中评审收录。</p>
            <p class="info-sub">评分40分以上的作品方可投稿，被收录将获得声望。</p>
          </div>
          <div v-if="submittableCompositions.length === 0" class="empty-state">
            <span class="empty-icon">✉️</span>
            <span class="empty-text">暂无可投稿的作品</span>
            <span class="empty-hint">创作评分40分以上的作品后即可投稿</span>
          </div>
          <div v-else class="composition-list">
            <div
              v-for="comp in submittableCompositions"
              :key="comp.id"
              class="composition-card"
              :class="{ selected: selectedCompositionId === comp.id }"
              :style="selectedCompositionId === comp.id ? { borderColor: currentRankColor + '60', background: currentRankColor + '08' } : {}"
              @click="handleCompositionSelect(comp.id)"
            >
              <div class="comp-header">
                <span class="comp-title">{{ comp.title }}</span>
                <span class="comp-score" :style="{ color: comp.score.total >= 90 ? '#ffd700' : comp.score.total >= 75 ? '#7ca97c' : '#7a9ea8' }">
                  {{ comp.score.total }}分
                </span>
              </div>
              <div class="comp-phrases">
                {{ comp.phrases.map(p => p.text).join(' · ') }}
              </div>
              <div class="comp-meta">
                <span class="meta-item">{{ comp.phrases.length }}词</span>
                <span class="meta-item">{{ new Date(comp.createdAt).toLocaleDateString('zh-CN') }}</span>
              </div>
            </div>
          </div>
          <div class="submit-actions">
            <button
              class="submit-btn"
              :disabled="!selectedCompositionId"
              :style="selectedCompositionId ? { background: `linear-gradient(135deg, ${currentRankColor}, ${currentRankColor}cc)`, color: '#1a1a2e' } : {}"
              @click="handleSubmit"
            >
              投稿至诗社
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'review'" class="review-tab">
          <div v-if="pendingSubmissions.length > 0" class="pending-section">
            <div class="section-label">待审核</div>
            <div class="submission-list">
              <div v-for="sub in pendingSubmissions" :key="sub.id" class="submission-card pending">
                <div class="sub-header">
                  <span class="sub-title">{{ getCompositionTitle(sub.compositionId) }}</span>
                  <span class="sub-status" :style="{ color: statusColors.pending }">{{ statusLabels.pending }}</span>
                </div>
                <div class="sub-meta">
                  <span>{{ getCompositionScore(sub.compositionId) }}分</span>
                  <span>{{ new Date(sub.submittedAt).toLocaleDateString('zh-CN') }}</span>
                </div>
                <button
                  class="review-btn"
                  :style="{ borderColor: currentRankColor + '40', color: currentRankColor }"
                  @click="handleReview(sub.id)"
                >
                  请求审核
                </button>
              </div>
            </div>
          </div>

          <div class="section-label">审核记录</div>
          <div v-if="reviewedSubmissions.length === 0" class="empty-state compact">
            <span class="empty-icon">📜</span>
            <span class="empty-text">暂无审核记录</span>
          </div>
          <div v-else class="submission-list">
            <div
              v-for="sub in reviewedSubmissions"
              :key="sub.id"
              class="submission-card"
              :class="[sub.status]"
            >
              <div class="sub-header">
                <span class="sub-title">{{ getCompositionTitle(sub.compositionId) }}</span>
                <span class="sub-status" :style="{ color: statusColors[sub.status] }">
                  {{ statusLabels[sub.status] }}
                </span>
              </div>
              <div v-if="sub.reviewerName" class="sub-reviewer">
                <span class="reviewer-label">评审</span>
                <span class="reviewer-name">{{ sub.reviewerName }}</span>
              </div>
              <div v-if="sub.reviewComment" class="sub-comment">
                「{{ sub.reviewComment }}」
              </div>
              <div class="sub-footer">
                <span class="sub-rep" :style="{ color: sub.reputationGained > 0 ? '#7ca97c' : '#8b4557' }">
                  {{ sub.reputationGained > 0 ? `+${sub.reputationGained}` : sub.reputationGained }} 声望
                </span>
                <span class="sub-date">{{ sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleDateString('zh-CN') : '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'exhibit'" class="exhibit-tab">
          <div v-if="availableExhibitions.length === 0" class="empty-state">
            <span class="empty-icon">🏛️</span>
            <span class="empty-text">展陈功能尚未开放</span>
            <span class="empty-hint">声望达到「秀才」后可参与展陈</span>
          </div>
          <div v-else class="exhibition-list">
            <div
              v-for="theme in availableExhibitions"
              :key="theme.id"
              class="exhibition-card"
              :style="{ borderColor: theme.accentColor + '30' }"
            >
              <div class="exhibition-header" :style="{ background: theme.accentColor + '08' }">
                <div class="exhibition-icon-wrap" :style="{ background: theme.accentColor + '15', borderColor: theme.accentColor + '30' }">
                  <span class="exhibition-icon">{{ theme.icon }}</span>
                </div>
                <div class="exhibition-info">
                  <h3 class="exhibition-title" :style="{ color: theme.accentColor }">{{ theme.name }}</h3>
                  <p class="exhibition-desc">{{ theme.description }}</p>
                </div>
                <div class="exhibition-slots">
                  <span class="slots-count">{{ getThemeSlotInfo(theme.id).used }}/{{ getThemeSlotInfo(theme.id).max }}</span>
                  <span class="slots-label">展位</span>
                </div>
              </div>
              <div class="exhibition-requirements">
                <span class="req-tag" :style="{ borderColor: theme.accentColor + '30' }">🎯 {{ theme.minScore }}分</span>
                <span class="req-tag" :style="{ borderColor: theme.accentColor + '30' }">✦ +{{ theme.bonusReputation }}声望</span>
                <span v-for="kw in theme.requiredKeywords" :key="kw" class="req-tag keyword" :style="{ borderColor: theme.accentColor + '30', color: theme.accentColor }">
                  {{ kw }}
                </span>
              </div>
              <div v-if="getThemeExhibitionEntries(theme.id).length > 0" class="exhibition-entries">
                <div
                  v-for="entry in getThemeExhibitionEntries(theme.id)"
                  :key="entry.id"
                  class="entry-item"
                  :class="{ featured: entry.isFeatured }"
                >
                  <span class="entry-title">{{ getCompositionTitle(entry.compositionId) }}</span>
                  <span class="entry-visitors">👁 {{ entry.visitorCount }}</span>
                  <span v-if="entry.isFeatured" class="entry-featured" :style="{ color: theme.accentColor }">精选</span>
                  <button v-if="!entry.isFeatured" class="feature-btn" :style="{ color: theme.accentColor }" @click="handleFeature(entry.id)" title="设为精选">
                    ★
                  </button>
                </div>
              </div>
              <div class="exhibition-actions">
                <button
                  class="exhibit-btn"
                  :style="{ borderColor: theme.accentColor + '40', color: theme.accentColor }"
                  :disabled="getThemeSlotInfo(theme.id).used >= getThemeSlotInfo(theme.id).max"
                  @click="exhibitThemeId = theme.id; activeTab = 'submit'"
                >
                  参展
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'reputation'" class="reputation-tab">
          <div class="reputation-overview" :style="{ borderColor: currentRankColor + '30' }">
            <div class="rep-rank-display">
              <div class="rep-rank-icon" :style="{ background: currentRankColor + '15', borderColor: currentRankColor + '30' }">
                <span class="rep-icon-large">{{ currentRankIcon }}</span>
              </div>
              <div class="rep-info">
                <div class="rep-current-rank" :style="{ color: currentRankColor }">{{ societyState.currentRank }}</div>
                <div class="rep-points">{{ societyState.reputation }} 声望</div>
              </div>
            </div>
            <div v-if="reputationProgress.nextRank" class="rep-progress">
              <div class="rep-progress-header">
                <span class="rep-next-label">下一品阶：{{ reputationProgress.nextRank }}</span>
                <span class="rep-next-value">{{ reputationProgress.current }} / {{ reputationProgress.next }}</span>
              </div>
              <div class="rep-progress-track">
                <div
                  class="rep-progress-fill"
                  :style="{ width: reputationProgress.percentage + '%', background: `linear-gradient(90deg, ${currentRankColor}, ${currentRankColor}cc)` }"
                ></div>
              </div>
            </div>
            <div v-else class="rep-max">已达最高品阶</div>
          </div>

          <div class="rep-stats">
            <div class="stat-item">
              <span class="stat-value">{{ societyState.totalSubmissions }}</span>
              <span class="stat-label">总投稿</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ societyState.totalAccepted }}</span>
              <span class="stat-label">已收录</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ societyState.totalShowcased }}</span>
              <span class="stat-label">展陈推荐</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ societyState.totalExhibitions }}</span>
              <span class="stat-label">参展</span>
            </div>
          </div>

          <div class="milestones-section">
            <div class="section-label">声望阶梯</div>
            <div class="milestone-list">
              <div
                v-for="milestone in reputationMilestones"
                :key="milestone.rank"
                class="milestone-item"
                :class="{
                  current: milestone.rank === societyState.currentRank,
                  achieved: REPUTATION_RANK_ORDER.indexOf(milestone.rank) <= REPUTATION_RANK_ORDER.indexOf(societyState.currentRank),
                  locked: REPUTATION_RANK_ORDER.indexOf(milestone.rank) > REPUTATION_RANK_ORDER.indexOf(societyState.currentRank)
                }"
                :style="{ borderColor: milestone.accentColor + '30' }"
              >
                <div class="milestone-header">
                  <span class="milestone-icon">{{ milestone.icon }}</span>
                  <span class="milestone-rank" :style="{ color: milestone.accentColor }">{{ milestone.rank }}</span>
                  <span class="milestone-req">{{ milestone.minReputation }}声望</span>
                </div>
                <div class="milestone-features">
                  <span v-for="feat in milestone.unlockedFeatures" :key="feat" class="feature-tag" :style="{ borderColor: milestone.accentColor + '20' }">
                    {{ feat }}
                  </span>
                </div>
                <div class="milestone-reward">
                  <span class="reward-label">称号</span>
                  <span class="reward-title" :style="{ color: milestone.accentColor }">{{ milestone.titleReward }}</span>
                </div>
                <button
                  v-if="REPUTATION_RANK_ORDER.indexOf(milestone.rank) <= REPUTATION_RANK_ORDER.indexOf(societyState.currentRank) && !isMilestoneRewardClaimed(milestone.rank)"
                  class="claim-milestone-btn"
                  :style="{ background: `linear-gradient(135deg, ${milestone.accentColor}, ${milestone.accentColor}cc)`, color: '#1a1a2e' }"
                  @click="handleClaimMilestone(milestone.rank)"
                >
                  领取称号
                </button>
                <span v-else-if="isMilestoneRewardClaimed(milestone.rank)" class="claimed-label" :style="{ color: milestone.accentColor }">✓ 已领取</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'rare'" class="rare-tab">
          <div class="rare-info">
            <p class="info-text">声望达至一定品阶，将解锁稀有章节，获取独特的词句与挑战。</p>
          </div>
          <div class="rare-list">
            <div
              v-for="chapter in unlockableRareChapters"
              :key="chapter.id"
              class="rare-card"
              :class="{ unlocked: chapter.isUnlocked, unlockable: chapter.canUnlock, locked: chapter.isLocked }"
              :style="chapter.isUnlocked || chapter.canUnlock ? { borderColor: chapter.accentColor + '40' } : {}"
            >
              <div class="rare-header" :style="{ background: (chapter.isUnlocked || chapter.canUnlock) ? chapter.accentColor + '08' : 'transparent' }">
                <div class="rare-rarity" :class="[chapter.rarity]">
                  {{ chapter.rarity === 'legendary' ? '传说' : '史诗' }}
                </div>
                <div class="rare-title-row">
                  <h3 class="rare-title" :style="{ color: (chapter.isUnlocked || chapter.canUnlock) ? chapter.accentColor : '#6b6858' }">
                    {{ chapter.title }}
                  </h3>
                  <span class="rare-subtitle">{{ chapter.subtitle }}</span>
                </div>
                <p class="rare-desc">{{ chapter.description }}</p>
              </div>

              <div v-if="chapter.isLocked" class="rare-locked">
                <div class="lock-requirement">
                  <span class="lock-icon">🔒</span>
                  <span class="lock-text">需达到「{{ chapter.requiredRank }}」（{{ chapter.requiredReputation }}声望）</span>
                </div>
                <div class="lock-progress">
                  <div class="lock-track">
                    <div
                      class="lock-fill"
                      :style="{ width: Math.min(100, Math.round((props.societyState.reputation / chapter.requiredReputation) * 100)) + '%' }"
                    ></div>
                  </div>
                  <span class="lock-pct">{{ Math.min(100, Math.round((props.societyState.reputation / chapter.requiredReputation) * 100)) }}%</span>
                </div>
              </div>

              <div v-if="chapter.canUnlock" class="rare-unlock">
                <div class="unlock-ready">
                  <span class="ready-icon">✨</span>
                  <span class="ready-text">已满足解锁条件</span>
                </div>
                <button
                  class="unlock-btn"
                  :style="{ background: `linear-gradient(135deg, ${chapter.accentColor}, ${chapter.accentColor}cc)`, color: '#1a1a2e' }"
                  @click="handleUnlockRare(chapter.id)"
                >
                  解锁章节
                </button>
              </div>

              <div v-if="chapter.isUnlocked" class="rare-unlocked">
                <div class="unlocked-badge" :style="{ color: chapter.accentColor }">
                  <span>✓ 已解锁</span>
                </div>
                <div class="rare-phrases-preview">
                  <span class="preview-label">独有词句</span>
                  <div class="preview-phrases">
                    <span
                      v-for="phrase in chapter.phrases.slice(0, 6)"
                      :key="phrase.id"
                      class="preview-phrase"
                      :class="[phrase.rarity]"
                    >
                      {{ phrase.text }}
                    </span>
                    <span v-if="chapter.phrases.length > 6" class="preview-more">
                      +{{ chapter.phrases.length - 6 }}
                    </span>
                  </div>
                </div>
                <div v-if="chapter.settlementRules && chapter.settlementRules.length > 0" class="rare-rules">
                  <span class="rules-label">结算规则</span>
                  <div class="rules-list">
                    <span v-for="rule in chapter.settlementRules" :key="rule.description" class="rule-tag">
                      {{ rule.description }}
                    </span>
                  </div>
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
.society-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.3s ease;
}

.society-panel {
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
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
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
}

.header-rank {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
}

.rank-icon {
  font-size: 14px;
}

.rank-name {
  letter-spacing: 2px;
}

.rank-rep {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
  font-size: 12px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  overflow-x: auto;
}

.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: var(--font-serif);
}

.tab-btn:hover {
  color: var(--text-secondary);
}

.tab-btn.active {
  color: var(--accent-gold);
  border-bottom-color: var(--accent-gold);
}

.tab-icon {
  font-size: 14px;
}

.tab-label {
  letter-spacing: 1px;
}

.tab-badge {
  position: absolute;
  top: 6px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--accent-red);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.submit-info,
.rare-info {
  margin-bottom: 16px;
}

.info-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.info-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
}

.empty-state.compact {
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-text {
  color: var(--text-muted);
  font-size: 14px;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 6px;
  opacity: 0.7;
}

.composition-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.composition-card {
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.composition-card:hover {
  border-color: rgba(201, 168, 108, 0.3);
}

.composition-card.selected {
  border-color: rgba(201, 168, 108, 0.5);
  background: rgba(201, 168, 108, 0.05);
}

.comp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comp-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.comp-score {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.comp-phrases {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.comp-meta {
  display: flex;
  gap: 10px;
}

.meta-item {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
}

.submit-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 10px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 2px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.section-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-bottom: 12px;
  font-weight: 500;
}

.submission-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.submission-card {
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.submission-card.showcased {
  border-color: rgba(201, 168, 108, 0.3);
  background: rgba(201, 168, 108, 0.04);
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sub-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.sub-status {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
}

.sub-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.sub-reviewer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.reviewer-label {
  font-size: 11px;
  color: var(--text-muted);
}

.reviewer-name {
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
}

.sub-comment {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 8px;
}

.sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-rep {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sub-date {
  font-size: 11px;
  color: var(--text-muted);
}

.review-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-serif);
  background: transparent;
  border: 1px solid;
  transition: all 0.2s ease;
}

.review-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.exhibition-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exhibition-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.exhibition-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.exhibition-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exhibition-icon {
  font-size: 20px;
}

.exhibition-info {
  flex: 1;
  min-width: 0;
}

.exhibition-title {
  font-family: var(--font-brush);
  font-size: 17px;
  letter-spacing: 2px;
  margin-bottom: 2px;
}

.exhibition-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.exhibition-slots {
  text-align: center;
  flex-shrink: 0;
}

.slots-count {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.slots-label {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
}

.exhibition-requirements {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid var(--border);
}

.req-tag {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.req-tag.keyword {
  font-weight: 500;
}

.exhibition-entries {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.entry-item.featured {
  background: rgba(201, 168, 108, 0.06);
}

.entry-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.entry-visitors {
  font-size: 11px;
  color: var(--text-muted);
}

.entry-featured {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
}

.feature-btn {
  font-size: 14px;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.feature-btn:hover {
  opacity: 1;
}

.exhibition-actions {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.exhibit-btn {
  padding: 7px 18px;
  border-radius: 10px;
  font-size: 12px;
  font-family: var(--font-serif);
  background: transparent;
  border: 1px solid;
  transition: all 0.2s ease;
}

.exhibit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.exhibit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.reputation-overview {
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid;
  border-radius: 14px;
  margin-bottom: 20px;
}

.rep-rank-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.rep-rank-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rep-icon-large {
  font-size: 28px;
}

.rep-info {
  flex: 1;
}

.rep-current-rank {
  font-family: var(--font-brush);
  font-size: 26px;
  letter-spacing: 4px;
  margin-bottom: 2px;
}

.rep-points {
  font-size: 14px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.rep-progress {
  margin-top: 4px;
}

.rep-progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.rep-next-label {
  font-size: 12px;
  color: var(--text-muted);
}

.rep-next-value {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.rep-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.rep-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
  animation: progressFill 1s ease-out;
}

.rep-max {
  text-align: center;
  font-size: 14px;
  color: var(--accent-gold);
  font-weight: 500;
  letter-spacing: 2px;
  padding: 8px;
}

.rep-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 14px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.milestone-item {
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.milestone-item.current {
  background: rgba(201, 168, 108, 0.04);
}

.milestone-item.locked {
  opacity: 0.5;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.milestone-icon {
  font-size: 16px;
}

.milestone-rank {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
}

.milestone-req {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}

.milestone-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.feature-tag {
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.milestone-reward {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.reward-label {
  font-size: 11px;
  color: var(--text-muted);
}

.reward-title {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
}

.claim-milestone-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: var(--font-serif);
  font-weight: 600;
  transition: all 0.2s ease;
}

.claim-milestone-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.claimed-label {
  font-size: 12px;
  letter-spacing: 1px;
}

.rare-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rare-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.rare-card.locked {
  opacity: 0.6;
}

.rare-header {
  padding: 18px;
}

.rare-rarity {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.rare-rarity.epic {
  background: rgba(168, 122, 201, 0.15);
  color: #a87ac9;
}

.rare-rarity.legendary {
  background: rgba(201, 168, 108, 0.15);
  color: #c9a86c;
}

.rare-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.rare-title {
  font-family: var(--font-brush);
  font-size: 20px;
  letter-spacing: 3px;
}

.rare-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.rare-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.rare-locked {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
}

.lock-requirement {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.lock-icon {
  font-size: 14px;
}

.lock-text {
  font-size: 12px;
  color: var(--text-muted);
}

.lock-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lock-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.lock-fill {
  height: 100%;
  background: var(--accent-gold);
  border-radius: 2px;
  transition: width 0.6s ease;
}

.lock-pct {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}

.rare-unlock {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.unlock-ready {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ready-icon {
  font-size: 16px;
  animation: float 3s ease-in-out infinite;
}

.ready-text {
  font-size: 13px;
  color: var(--accent-gold);
  font-weight: 500;
}

.unlock-btn {
  padding: 8px 22px;
  border-radius: 10px;
  font-size: 13px;
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 2px;
  transition: all 0.2s ease;
}

.unlock-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.rare-unlocked {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
}

.unlocked-badge {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.rare-phrases-preview {
  margin-bottom: 10px;
}

.preview-label,
.rules-label {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
  margin-bottom: 6px;
  display: block;
}

.preview-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-phrase {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
}

.preview-phrase.epic {
  background: rgba(168, 122, 201, 0.1);
  color: #a87ac9;
}

.preview-phrase.legendary {
  background: rgba(201, 168, 108, 0.1);
  color: #c9a86c;
}

.preview-more {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.rare-rules {
  margin-top: 8px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-tag {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 0;
}

.pending-section {
  margin-bottom: 20px;
}
</style>
