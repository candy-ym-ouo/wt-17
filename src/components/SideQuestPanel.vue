<script setup lang="ts">
import type { SideQuest, QuestState } from '@/types'

interface Props {
  quests: SideQuest[]
  questState: QuestState
  currentChapterId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'claim', questId: string): void
}>()

const visibleQuests = (quests: SideQuest[], questState: QuestState) => {
  return quests.filter(q => questState.unlockedQuests.includes(q.id) || questState.completedQuests.includes(q.id))
}

const getStatus = (quest: SideQuest, questState: QuestState): 'locked' | 'available' | 'completed' | 'claimed' => {
  if (questState.claimedRewards.includes(quest.id)) return 'claimed'
  if (questState.completedQuests.includes(quest.id)) return 'completed'
  if (questState.unlockedQuests.includes(quest.id)) return 'available'
  return 'locked'
}

const getRewardLabel = (quest: SideQuest): string[] => {
  return quest.rewards.map(r => {
    switch (r.type) {
      case 'phrase_unlock': return `解锁词句「${(r.params.phraseTexts as string[]).join('」「')}」`
      case 'phrase_pool_refresh': return `词池刷新：${r.params.count}个${r.params.addCategory === '__all__' ? '' : r.params.addCategory}词`
      case 'score_weight_boost': return `评分加成：${r.params.dimension}+${Math.round((r.params.boost as number) * 100)}%`
      case 'title_reward': return `获得称号「${r.params.title}」`
      default: return ''
    }
  })
}
</script>

<template>
  <div class="quest-overlay" @click.self="emit('close')">
    <div class="quest-panel" @click.stop>
      <div class="panel-header">
        <h2 class="panel-title">支线任务</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      <div class="quest-list">
        <div
          v-for="quest in visibleQuests(quests, questState)"
          :key="quest.id"
          class="quest-card"
          :class="[getStatus(quest, questState)]"
        >
          <div class="quest-icon-wrap" :style="{ background: quest.accentColor + '20', borderColor: quest.accentColor + '40' }">
            <span class="quest-icon">{{ quest.icon }}</span>
          </div>
          <div class="quest-body">
            <div class="quest-header">
              <h3 class="quest-title">{{ quest.title }}</h3>
              <span
                class="quest-status"
                :class="[getStatus(quest, questState)]"
                :style="{ color: getStatus(quest, questState) === 'claimed' ? '#6b6858' : quest.accentColor }"
              >
                {{ getStatus(quest, questState) === 'claimed' ? '已领取' : getStatus(quest, questState) === 'completed' ? '可领取' : getStatus(quest, questState) === 'available' ? '进行中' : '未解锁' }}
              </span>
            </div>
            <p class="quest-desc">{{ quest.description }}</p>
            <div class="quest-rewards">
              <span class="reward-label">奖励：</span>
              <span v-for="(rl, idx) in getRewardLabel(quest)" :key="idx" class="reward-tag">{{ rl }}</span>
            </div>
            <button
              v-if="getStatus(quest, questState) === 'completed'"
              class="claim-btn"
              :style="{ background: `linear-gradient(135deg, ${quest.accentColor}, ${quest.accentColor}cc)`, color: '#1a1a2e' }"
              @click="emit('claim', quest.id)"
            >
              领取奖励
            </button>
          </div>
        </div>
        <div v-if="visibleQuests(quests, questState).length === 0" class="empty-quest">
          <div class="empty-icon">📜</div>
          <div class="empty-text">继续创作，支线任务将逐步解锁</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-overlay {
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

.quest-panel {
  width: 100%;
  max-width: 560px;
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
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-family: var(--font-brush);
  font-size: 24px;
  color: var(--text-primary);
  letter-spacing: 4px;
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

.quest-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.quest-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all 0.3s ease;
}

.quest-card.claimed {
  opacity: 0.5;
  filter: grayscale(0.3);
}

.quest-card.completed {
  border-color: rgba(201, 168, 108, 0.5);
  box-shadow: 0 0 20px rgba(201, 168, 108, 0.08);
}

.quest-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quest-icon {
  font-size: 22px;
}

.quest-body {
  flex: 1;
  min-width: 0;
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.quest-title {
  font-family: var(--font-brush);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.quest-status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.quest-status.available {
  background: rgba(107, 142, 107, 0.15);
}

.quest-status.completed {
  background: rgba(201, 168, 108, 0.15);
}

.quest-status.claimed {
  background: rgba(107, 104, 88, 0.1);
}

.quest-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 10px;
}

.quest-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.reward-label {
  font-size: 11px;
  color: var(--text-muted);
}

.reward-tag {
  padding: 2px 8px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid rgba(201, 168, 108, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent-gold);
}

.claim-btn {
  margin-top: 12px;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-family: var(--font-serif);
  font-weight: 500;
  transition: all 0.2s ease;
}

.claim-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 108, 0.3);
}

.empty-quest {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-muted);
  font-size: 14px;
}
</style>
