<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  Composition,
  Phrase,
  Annotation,
  AnnotationType,
  CompositionVersion,
  ReviewState,
  ReviewStatus,
  MentorReviewSession
} from '@/types'
import {
  ANNOTATION_TYPE_LABELS,
  ANNOTATION_TYPE_COLORS
} from '@/types'
import {
  loadReviewState,
  createAnnotation,
  saveAnnotation,
  deleteAnnotation,
  resolveAnnotation,
  addAnnotationReply,
  getAnnotationsByComposition,
  getAnnotationsByPhrase,
  getVersionsByComposition,
  createVersion,
  saveVersion,
  deleteVersion,
  getSessionsByComposition,
  createSession,
  saveSession,
  updateSessionStatus,
  getAnnotationCountByComposition
} from '@/utils/mentorReviews'

interface Props {
  composition: Composition
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'loadVersion', version: CompositionVersion): void
  (e: 'startCompare', versions: [CompositionVersion, CompositionVersion]): void
  (e: 'loadComposition', composition: Composition): void
}>()

const reviewState = ref<ReviewState>(loadReviewState())
const activeTab = ref<'annotations' | 'versions' | 'session'>('annotations')
const selectedPhraseId = ref<string | null>(null)
const showAnnotationForm = ref(false)
const newAnnotationType = ref<AnnotationType>('suggestion')
const newAnnotationContent = ref('')
const annotationTargetPhraseId = ref<string | null>(null)
const replyingToId = ref<string | null>(null)
const replyContent = ref('')
const showVersionForm = ref(false)
const newVersionLabel = ref('')
const newVersionDescription = ref('')
const newVersionChangeSummary = ref('')
const compareMode = ref(false)
const selectedForCompare = ref<string[]>([])
const selectedSession = ref<MentorReviewSession | null>(null)
const sessionOverallComment = ref('')

const annotations = computed(() => getAnnotationsByComposition(props.composition.id))
const versions = computed(() => getVersionsByComposition(props.composition.id))
const sessions = computed(() => getSessionsByComposition(props.composition.id))
const annotationCount = computed(() => getAnnotationCountByComposition(props.composition.id))

const sortedPhrases = computed(() => {
  return [...props.composition.phrases].sort((a, b) => {
    const ay = a.position?.y || 0
    const by = b.position?.y || 0
    if (Math.abs(ay - by) < 30) {
      return (a.position?.x || 0) - (b.position?.x || 0)
    }
    return ay - by
  })
})

const annotationsForSelectedPhrase = computed(() => {
  if (!selectedPhraseId.value) return []
  return getAnnotationsByPhrase(props.composition.id, selectedPhraseId.value)
})

const generalAnnotations = computed(() => {
  return annotations.value.filter(a => a.phraseId === null)
})

const annotationTypeOptions: { value: AnnotationType; label: string; color: string }[] = [
  { value: 'praise', label: '赞赏', color: ANNOTATION_TYPE_COLORS.praise },
  { value: 'suggestion', label: '建议', color: ANNOTATION_TYPE_COLORS.suggestion },
  { value: 'question', label: '疑问', color: ANNOTATION_TYPE_COLORS.question },
  { value: 'correction', label: '指正', color: ANNOTATION_TYPE_COLORS.correction },
  { value: 'general', label: '总评', color: ANNOTATION_TYPE_COLORS.general }
]

const getAnnotationsForPhrase = (phraseId: string): Annotation[] => {
  return annotations.value.filter(a => a.phraseId === phraseId)
}

const handleSelectPhrase = (phrase: Phrase) => {
  if (selectedPhraseId.value === phrase.id) {
    selectedPhraseId.value = null
  } else {
    selectedPhraseId.value = phrase.id
  }
}

const openAnnotationForm = (phraseId: string | null = null) => {
  annotationTargetPhraseId.value = phraseId
  newAnnotationType.value = phraseId ? 'suggestion' : 'general'
  newAnnotationContent.value = ''
  showAnnotationForm.value = true
}

const submitAnnotation = () => {
  if (!newAnnotationContent.value.trim()) return

  const annotation = createAnnotation(
    props.composition.id,
    annotationTargetPhraseId.value,
    newAnnotationType.value,
    newAnnotationContent.value.trim(),
    '我',
    'self'
  )

  reviewState.value = saveAnnotation(annotation)
  showAnnotationForm.value = false
  newAnnotationContent.value = ''
}

const handleDeleteAnnotation = (annotationId: string) => {
  if (!confirm('确定要删除这条批注吗？')) return
  reviewState.value = deleteAnnotation(annotationId)
}

const handleResolveAnnotation = (annotationId: string) => {
  reviewState.value = resolveAnnotation(annotationId)
}

const startReply = (annotationId: string) => {
  replyingToId.value = annotationId
  replyContent.value = ''
}

const submitReply = (annotationId: string) => {
  if (!replyContent.value.trim()) return
  reviewState.value = addAnnotationReply(annotationId, replyContent.value.trim())
  replyingToId.value = null
  replyContent.value = ''
}

const openVersionForm = () => {
  const nextNum = versions.value.length === 0 ? 1 : versions.value[0].versionNumber + 1
  newVersionLabel.value = `v${nextNum}`
  newVersionDescription.value = ''
  newVersionChangeSummary.value = ''
  showVersionForm.value = true
}

const submitVersion = () => {
  const basedOn = versions.value.length > 0 ? versions.value[0].id : null
  const version = createVersion(
    props.composition.id,
    props.composition.phrases,
    props.composition.score,
    newVersionLabel.value.trim() || undefined,
    newVersionDescription.value.trim(),
    basedOn,
    newVersionChangeSummary.value.trim() || undefined
  )
  reviewState.value = saveVersion(version)
  showVersionForm.value = false
}

const handleDeleteVersion = (versionId: string) => {
  if (!confirm('确定要删除这个版本吗？')) return
  reviewState.value = deleteVersion(versionId)
}

const handleLoadVersion = (version: CompositionVersion) => {
  emit('loadVersion', version)
  emit('close')
}

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value
  selectedForCompare.value = []
}

const toggleSelectForCompare = (versionId: string, e: Event) => {
  e.stopPropagation()
  if (!compareMode.value) {
    compareMode.value = true
  }
  const idx = selectedForCompare.value.indexOf(versionId)
  if (idx > -1) {
    selectedForCompare.value.splice(idx, 1)
  } else {
    if (selectedForCompare.value.length < 2) {
      selectedForCompare.value.push(versionId)
    }
    if (selectedForCompare.value.length === 2) {
      const v1 = versions.value.find(v => v.id === selectedForCompare.value[0])
      const v2 = versions.value.find(v => v.id === selectedForCompare.value[1])
      if (v1 && v2) {
        emit('startCompare', [v1, v2])
        compareMode.value = false
        selectedForCompare.value = []
      }
    }
  }
}

const createNewSession = () => {
  const session = createSession(props.composition.id)
  reviewState.value = saveSession(session)
  selectedSession.value = session
  sessionOverallComment.value = ''
}

const selectSession = (session: MentorReviewSession) => {
  selectedSession.value = session
  sessionOverallComment.value = session.overallComment
}

const saveSessionOverallComment = () => {
  if (!selectedSession.value) return
  selectedSession.value.overallComment = sessionOverallComment.value
  reviewState.value = saveSession(selectedSession.value)
}

const handleUpdateSessionStatus = (status: ReviewStatus) => {
  if (!selectedSession.value) return
  reviewState.value = updateSessionStatus(selectedSession.value.id, status)
  const updated = sessions.value.find(s => s.id === selectedSession.value?.id)
  if (updated) selectedSession.value = updated
}

const statusLabels: Record<ReviewStatus, string> = {
  draft: '草稿',
  in_review: '评阅中',
  reviewed: '已评阅',
  revised: '已改稿'
}

const statusColors: Record<ReviewStatus, string> = {
  draft: '#6b6858',
  in_review: '#c9a86c',
  reviewed: '#7ca97c',
  revised: '#7a9ea8'
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatFullDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="review-overlay" @click.self="emit('close')">
    <div class="review-panel" @click.stop>
      <div class="review-header">
        <div class="review-title-row">
          <h2 class="review-title">师友评点</h2>
          <div class="review-meta">
            <span class="composition-title">{{ composition.title || '无题' }}</span>
            <span class="annotation-stats">
              批注 {{ annotationCount.resolved }}/{{ annotationCount.total }}
            </span>
          </div>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>
        <div class="review-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'annotations' }"
            @click="activeTab = 'annotations'"
          >
            <span class="tab-icon">📝</span>
            <span class="tab-label">批注点评</span>
            <span class="tab-badge" v-if="annotations.length > 0">{{ annotations.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'versions' }"
            @click="activeTab = 'versions'"
          >
            <span class="tab-icon">📚</span>
            <span class="tab-label">版本留痕</span>
            <span class="tab-badge" v-if="versions.length > 0">{{ versions.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'session' }"
            @click="activeTab = 'session'"
          >
            <span class="tab-icon">👥</span>
            <span class="tab-label">评点会话</span>
            <span class="tab-badge" v-if="sessions.length > 0">{{ sessions.length }}</span>
          </button>
        </div>
      </div>

      <div class="review-content">
        <div v-if="activeTab === 'annotations'" class="tab-content annotations-tab">
          <div class="phrases-column">
            <div class="column-header">
              <span class="column-title">作品词句</span>
              <button class="action-btn small" @click="openAnnotationForm(null)">
                ✒️ 总评
              </button>
            </div>
            <div class="phrases-list">
              <div
                v-for="phrase in sortedPhrases"
                :key="phrase.id"
                class="phrase-item"
                :class="{ selected: selectedPhraseId === phrase.id }"
                @click="handleSelectPhrase(phrase)"
              >
                <span class="phrase-text">{{ phrase.text }}</span>
                <div class="phrase-meta-row">
                  <span class="phrase-category">
                    {{ { scene: '景', emotion: '情', time: '时', action: '动', imagery: '意' }[phrase.category] }}
                  </span>
                  <span
                    v-if="getAnnotationsForPhrase(phrase.id).length > 0"
                    class="annotation-count"
                  >
                    {{ getAnnotationsForPhrase(phrase.id).length }}条
                  </span>
                </div>
                <button
                  class="add-annotation-btn"
                  @click.stop="openAnnotationForm(phrase.id)"
                  title="添加点评"
                >+</button>
              </div>
            </div>
          </div>

          <div class="annotations-column">
            <div class="column-header">
              <span class="column-title">
                {{ selectedPhraseId ? '词句批注' : '作品总评' }}
              </span>
            </div>

            <div v-if="showAnnotationForm" class="annotation-form">
              <div class="form-type-row">
                <button
                  v-for="opt in annotationTypeOptions"
                  :key="opt.value"
                  class="type-chip"
                  :class="{ active: newAnnotationType === opt.value }"
                  :style="{ '--chip-color': opt.color }"
                  @click="newAnnotationType = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <textarea
                v-model="newAnnotationContent"
                class="annotation-textarea"
                :placeholder="annotationTargetPhraseId ? '对此句的点评...' : '对整首作品的总评...'"
                rows="3"
              ></textarea>
              <div class="form-actions">
                <button class="cancel-btn" @click="showAnnotationForm = false">取消</button>
                <button
                  class="submit-btn"
                  :disabled="!newAnnotationContent.trim()"
                  @click="submitAnnotation"
                >
                  发布
                </button>
              </div>
            </div>

            <div class="annotations-list">
              <template v-if="selectedPhraseId">
                <div
                  v-for="ann in annotationsForSelectedPhrase"
                  :key="ann.id"
                  class="annotation-card"
                  :class="{ resolved: ann.isResolved }"
                  :style="{ '--ann-color': ANNOTATION_TYPE_COLORS[ann.type] }"
                >
                  <div class="annotation-head">
                    <span class="annotation-type" :style="{ background: ANNOTATION_TYPE_COLORS[ann.type] }">
                      {{ ANNOTATION_TYPE_LABELS[ann.type] }}
                    </span>
                    <span class="annotation-author">{{ ann.authorName }}</span>
                    <span class="annotation-date">{{ formatDate(ann.createdAt) }}</span>
                    <span v-if="ann.isResolved" class="resolved-badge">已处理</span>
                  </div>
                  <div class="annotation-content">{{ ann.content }}</div>
                  <div class="annotation-actions">
                    <button v-if="!ann.isResolved" class="action-link" @click="handleResolveAnnotation(ann.id)">
                      ✓ 标记处理
                    </button>
                    <button class="action-link" @click="startReply(ann.id)">
                      💬 回复
                    </button>
                    <button class="action-link danger" @click="handleDeleteAnnotation(ann.id)">
                      删除
                    </button>
                  </div>
                  <div v-if="ann.replies.length > 0" class="annotation-replies">
                    <div v-for="reply in ann.replies" :key="reply.id" class="reply-item">
                      <span class="reply-author">{{ reply.authorName }}：</span>
                      <span class="reply-content">{{ reply.content }}</span>
                      <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
                    </div>
                  </div>
                  <div v-if="replyingToId === ann.id" class="reply-form">
                    <input
                      v-model="replyContent"
                      type="text"
                      class="reply-input"
                      placeholder="写下回复..."
                      @keyup.enter="submitReply(ann.id)"
                    />
                    <div class="reply-form-actions">
                      <button class="cancel-btn" @click="replyingToId = null">取消</button>
                      <button class="submit-btn" :disabled="!replyContent.trim()" @click="submitReply(ann.id)">
                        回复
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="annotationsForSelectedPhrase.length === 0" class="empty-state">
                  此句暂无批注，点击 <b>+</b> 添加点评
                </div>
              </template>
              <template v-else>
                <div
                  v-for="ann in generalAnnotations"
                  :key="ann.id"
                  class="annotation-card"
                  :class="{ resolved: ann.isResolved }"
                  :style="{ '--ann-color': ANNOTATION_TYPE_COLORS[ann.type] }"
                >
                  <div class="annotation-head">
                    <span class="annotation-type" :style="{ background: ANNOTATION_TYPE_COLORS[ann.type] }">
                      {{ ANNOTATION_TYPE_LABELS[ann.type] }}
                    </span>
                    <span class="annotation-author">{{ ann.authorName }}</span>
                    <span class="annotation-date">{{ formatDate(ann.createdAt) }}</span>
                    <span v-if="ann.isResolved" class="resolved-badge">已处理</span>
                  </div>
                  <div class="annotation-content">{{ ann.content }}</div>
                  <div class="annotation-actions">
                    <button v-if="!ann.isResolved" class="action-link" @click="handleResolveAnnotation(ann.id)">
                      ✓ 标记处理
                    </button>
                    <button class="action-link" @click="startReply(ann.id)">
                      💬 回复
                    </button>
                    <button class="action-link danger" @click="handleDeleteAnnotation(ann.id)">
                      删除
                    </button>
                  </div>
                  <div v-if="ann.replies.length > 0" class="annotation-replies">
                    <div v-for="reply in ann.replies" :key="reply.id" class="reply-item">
                      <span class="reply-author">{{ reply.authorName }}：</span>
                      <span class="reply-content">{{ reply.content }}</span>
                      <span class="reply-date">{{ formatDate(reply.createdAt) }}</span>
                    </div>
                  </div>
                  <div v-if="replyingToId === ann.id" class="reply-form">
                    <input
                      v-model="replyContent"
                      type="text"
                      class="reply-input"
                      placeholder="写下回复..."
                      @keyup.enter="submitReply(ann.id)"
                    />
                    <div class="reply-form-actions">
                      <button class="cancel-btn" @click="replyingToId = null">取消</button>
                      <button class="submit-btn" :disabled="!replyContent.trim()" @click="submitReply(ann.id)">
                        回复
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="generalAnnotations.length === 0" class="empty-state">
                  暂无总评，点击上方 <b>✒️ 总评</b> 添加
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'versions'" class="tab-content versions-tab">
          <div class="versions-toolbar">
            <button class="action-btn primary" @click="openVersionForm">
              ＋ 保存当前版本
            </button>
            <div class="toolbar-right">
              <button
                class="action-btn"
                :class="{ active: compareMode }"
                @click="toggleCompareMode"
              >
                {{ compareMode ? `取消对比 (${selectedForCompare.length}/2)` : '🔍 版本对比' }}
              </button>
              <button
                v-if="compareMode && selectedForCompare.length === 2"
                class="action-btn primary"
                @click="() => {
                  const v1 = versions.find(v => v.id === selectedForCompare[0])
                  const v2 = versions.find(v => v.id === selectedForCompare[1])
                  if (v1 && v2) emit('startCompare', [v1, v2])
                }"
              >
                开始对比
              </button>
            </div>
          </div>

          <div v-if="showVersionForm" class="version-form">
            <div class="form-row">
              <label>版本标签</label>
              <input v-model="newVersionLabel" type="text" placeholder="如：初稿、改稿一、定稿" />
            </div>
            <div class="form-row">
              <label>版本说明</label>
              <input v-model="newVersionDescription" type="text" placeholder="简要描述此版本..." />
            </div>
            <div class="form-row">
              <label>改动摘要</label>
              <textarea v-model="newVersionChangeSummary" rows="2" placeholder="记录具体改动..."></textarea>
            </div>
            <div class="form-actions">
              <button class="cancel-btn" @click="showVersionForm = false">取消</button>
              <button class="submit-btn" :disabled="!newVersionLabel.trim()" @click="submitVersion">
                保存版本
              </button>
            </div>
          </div>

          <div class="versions-list">
            <div v-if="versions.length === 0" class="empty-state large">
              <div class="empty-icon">📚</div>
              <div class="empty-title">暂无版本记录</div>
              <div class="empty-desc">点击「保存当前版本」记录作品的改稿历程</div>
            </div>
            <div
              v-for="version in versions"
              :key="version.id"
              class="version-card"
              :class="{ 'selectable': compareMode, selected: selectedForCompare.includes(version.id) }"
              @click="compareMode ? toggleSelectForCompare(version.id, $event) : null"
            >
              <div class="version-head">
                <div class="version-label-group">
                  <span class="version-badge">{{ version.label }}</span>
                  <span class="version-number">#{{ version.versionNumber }}</span>
                </div>
                <div class="version-score">
                  <span class="score-num">{{ version.score.total }}</span>
                  <span class="score-label">分</span>
                </div>
              </div>
              <div v-if="version.description" class="version-desc">{{ version.description }}</div>
              <div v-if="version.changeSummary" class="version-changes">
                <span class="changes-label">改动：</span>
                <span class="changes-text">{{ version.changeSummary }}</span>
              </div>
              <div class="version-meta-row">
                <span class="meta-item">
                  <span class="meta-label">词句</span>
                  <span class="meta-value">{{ version.phrases.length }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">连贯</span>
                  <span class="meta-value">{{ version.score.coherence }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">意象</span>
                  <span class="meta-value">{{ version.score.imagery }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">韵律</span>
                  <span class="meta-value">{{ version.score.rhythm }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">契合</span>
                  <span class="meta-value">{{ version.score.themeMatch }}</span>
                </span>
                <span class="meta-date">{{ formatFullDate(version.createdAt) }}</span>
              </div>
              <div v-if="!compareMode" class="version-actions">
                <button class="action-link" @click="handleLoadVersion(version)">
                  📝 加载此版本
                </button>
                <button class="action-link danger" @click="handleDeleteVersion(version.id)">
                  删除
                </button>
              </div>
              <div v-if="compareMode && selectedForCompare.includes(version.id)" class="compare-selected">
                ✓ 已选
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'session'" class="tab-content session-tab">
          <div class="session-sidebar">
            <div class="column-header">
              <span class="column-title">评点会话</span>
              <button class="action-btn small" @click="createNewSession">
                ＋ 新建
              </button>
            </div>
            <div class="session-list">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="session-item"
                :class="{ selected: selectedSession?.id === session.id }"
                @click="selectSession(session)"
              >
                <div class="session-head">
                  <span class="session-status" :style="{ background: statusColors[session.status] }">
                    {{ statusLabels[session.status] }}
                  </span>
                  <span class="session-date">{{ formatFullDate(session.createdAt) }}</span>
                </div>
                <div v-if="session.mentorName" class="session-mentor">
                  导师：{{ session.mentorName }}
                </div>
                <div v-if="session.overallComment" class="session-preview">
                  {{ session.overallComment.slice(0, 30) }}{{ session.overallComment.length > 30 ? '...' : '' }}
                </div>
              </div>
              <div v-if="sessions.length === 0" class="empty-state">
                暂无会话，点击「新建」开始
              </div>
            </div>
          </div>

          <div class="session-detail">
            <template v-if="selectedSession">
              <div class="session-detail-header">
                <div class="session-status-row">
                  <span class="session-status large" :style="{ background: statusColors[selectedSession.status] }">
                    {{ statusLabels[selectedSession.status] }}
                  </span>
                  <div class="status-actions">
                    <button
                      class="status-chip"
                      :class="{ active: selectedSession.status === 'draft' }"
                      @click="handleUpdateSessionStatus('draft')"
                    >草稿</button>
                    <button
                      class="status-chip"
                      :class="{ active: selectedSession.status === 'in_review' }"
                      @click="handleUpdateSessionStatus('in_review')"
                    >评阅中</button>
                    <button
                      class="status-chip"
                      :class="{ active: selectedSession.status === 'reviewed' }"
                      @click="handleUpdateSessionStatus('reviewed')"
                    >已评阅</button>
                    <button
                      class="status-chip"
                      :class="{ active: selectedSession.status === 'revised' }"
                      @click="handleUpdateSessionStatus('revised')"
                    >已改稿</button>
                  </div>
                </div>
                <div class="session-meta">
                  创建于 {{ formatFullDate(selectedSession.createdAt) }}
                </div>
              </div>

              <div class="session-section">
                <div class="section-label">总体评价</div>
                <textarea
                  v-model="sessionOverallComment"
                  class="session-textarea"
                  rows="5"
                  placeholder="记录对此作品的总体评价、改稿方向、重点建议..."
                  @blur="saveSessionOverallComment"
                ></textarea>
              </div>

              <div class="session-section">
                <div class="section-label">关联批注</div>
                <div class="session-annotations">
                  <div
                    v-for="ann in annotations.slice(0, 6)"
                    :key="ann.id"
                    class="mini-annotation"
                    :style="{ borderColor: ANNOTATION_TYPE_COLORS[ann.type] }"
                  >
                    <span class="mini-type" :style="{ background: ANNOTATION_TYPE_COLORS[ann.type] }">
                      {{ ANNOTATION_TYPE_LABELS[ann.type] }}
                    </span>
                    <span class="mini-content">{{ ann.content.slice(0, 20) }}{{ ann.content.length > 20 ? '...' : '' }}</span>
                  </div>
                  <div v-if="annotations.length === 0" class="empty-state small">
                    暂无批注，前往「批注点评」添加
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="empty-state large">
              <div class="empty-icon">👥</div>
              <div class="empty-title">选择或创建评点会话</div>
              <div class="empty-desc">会话用于跟踪完整的评点流程，记录总体评价和改稿状态</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.review-panel {
  width: 90vw;
  max-width: 1100px;
  height: 85vh;
  max-height: 800px;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-header {
  padding: 20px 24px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.review-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.review-title {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--accent-gold);
  margin: 0;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.composition-title {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.annotation-stats {
  font-size: 13px;
  color: var(--text-muted);
  background: rgba(201, 168, 108, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.review-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--accent-gold);
  border-radius: 2px;
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  background: var(--accent-gold);
  color: #0f0f1a;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.review-content {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow: hidden;
}

.annotations-tab {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
}

.phrases-column {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.01);
}

.annotations-column {
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.column-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.action-btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--accent-gold);
  color: #0f0f1a;
  font-weight: 500;
}

.action-btn.primary:hover {
  background: #d4b57c;
}

.action-btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.action-btn.active {
  background: rgba(201, 168, 108, 0.2);
  color: var(--accent-gold);
}

.phrases-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.phrase-item {
  position: relative;
  padding: 12px 32px 12px 14px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.phrase-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(201, 168, 108, 0.3);
}

.phrase-item.selected {
  background: rgba(201, 168, 108, 0.12);
  border-color: var(--accent-gold);
}

.phrase-text {
  display: block;
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 6px;
}

.phrase-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.phrase-category {
  color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

.annotation-count {
  color: var(--text-muted);
}

.add-annotation-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(201, 168, 108, 0.15);
  color: var(--accent-gold);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.phrase-item:hover .add-annotation-btn {
  opacity: 1;
}

.add-annotation-btn:hover {
  background: var(--accent-gold);
  color: #0f0f1a;
}

.annotation-form,
.version-form {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(201, 168, 108, 0.04);
}

.form-type-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.type-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.type-chip:hover {
  border-color: var(--chip-color);
}

.type-chip.active {
  background: color-mix(in srgb, var(--chip-color) 20%, transparent);
  border-color: var(--chip-color);
  color: var(--chip-color);
}

.annotation-textarea,
.session-textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.annotation-textarea:focus,
.session-textarea:focus {
  border-color: var(--accent-gold);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.cancel-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  background: transparent;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.submit-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: var(--accent-gold);
  color: #0f0f1a;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #d4b57c;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.annotations-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.annotation-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 3px solid var(--ann-color);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.annotation-card.resolved {
  opacity: 0.6;
}

.annotation-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.annotation-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
}

.annotation-type {
  padding: 2px 10px;
  border-radius: 10px;
  color: #0f0f1a;
  font-weight: 500;
  font-size: 11px;
}

.annotation-author {
  color: var(--text-primary);
  font-weight: 500;
}

.annotation-date {
  color: var(--text-muted);
}

.resolved-badge {
  margin-left: auto;
  background: rgba(124, 169, 124, 0.2);
  color: #7ca97c;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.annotation-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.7;
  margin-bottom: 10px;
}

.annotation-actions {
  display: flex;
  gap: 16px;
}

.action-link {
  font-size: 12px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.action-link:hover {
  color: var(--accent-gold);
}

.action-link.danger:hover {
  color: #c56b6b;
}

.annotation-replies {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.reply-author {
  color: var(--accent-gold);
  font-weight: 500;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  color: var(--text-primary);
}

.reply-date {
  color: var(--text-muted);
  font-size: 11px;
  flex-shrink: 0;
}

.reply-form {
  margin-top: 10px;
}

.reply-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 13px;
  outline: none;
}

.reply-input:focus {
  border-color: var(--accent-gold);
}

.reply-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  text-align: center;
  font-size: 13px;
  gap: 8px;
}

.empty-state.large {
  flex-direction: column;
  gap: 12px;
}

.empty-state.small {
  padding: 20px;
  font-size: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.empty-title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

.empty-desc {
  font-size: 13px;
  max-width: 300px;
}

.versions-tab {
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
}

.versions-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.form-row {
  margin-bottom: 12px;
}

.form-row label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.form-row input,
.form-row textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: var(--font-serif);
  font-size: 13px;
  outline: none;
}

.form-row input:focus,
.form-row textarea:focus {
  border-color: var(--accent-gold);
}

.versions-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  align-content: start;
  padding-right: 4px;
}

.version-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  position: relative;
}

.version-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(201, 168, 108, 0.3);
}

.version-card.selectable {
  cursor: pointer;
}

.version-card.selected {
  border-color: var(--accent-gold);
  background: rgba(201, 168, 108, 0.08);
}

.version-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.version-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge {
  background: var(--accent-gold);
  color: #0f0f1a;
  font-weight: 600;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 6px;
}

.version-number {
  font-size: 12px;
  color: var(--text-muted);
}

.version-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-num {
  font-family: var(--font-brush);
  font-size: 28px;
  color: var(--accent-gold);
}

.score-label {
  font-size: 12px;
  color: var(--text-muted);
}

.version-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.version-changes {
  font-size: 12px;
  padding: 8px 10px;
  background: rgba(201, 168, 108, 0.08);
  border-radius: 6px;
  margin-bottom: 10px;
  line-height: 1.5;
}

.changes-label {
  color: var(--accent-gold);
  font-weight: 500;
}

.changes-text {
  color: var(--text-secondary);
}

.version-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.meta-label {
  color: var(--text-muted);
}

.meta-value {
  color: var(--text-primary);
  font-weight: 500;
}

.meta-date {
  margin-left: auto;
  color: var(--text-muted);
}

.version-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.compare-selected {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--accent-gold);
  color: #0f0f1a;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.session-tab {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
}

.session-sidebar {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.01);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.session-item {
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.session-item.selected {
  background: rgba(201, 168, 108, 0.1);
  border-color: var(--accent-gold);
}

.session-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-status {
  padding: 3px 10px;
  border-radius: 10px;
  color: #0f0f1a;
  font-size: 11px;
  font-weight: 500;
}

.session-status.large {
  padding: 5px 14px;
  font-size: 13px;
}

.session-date {
  font-size: 11px;
  color: var(--text-muted);
}

.session-mentor {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.session-preview {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.session-detail {
  padding: 24px 28px;
  overflow-y: auto;
}

.session-detail-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.session-status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.status-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.status-chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  transition: all 0.2s;
}

.status-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.status-chip.active {
  background: var(--accent-gold);
  color: #0f0f1a;
  font-weight: 500;
}

.session-meta {
  font-size: 13px;
  color: var(--text-muted);
}

.session-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 13px;
  color: var(--accent-gold);
  margin-bottom: 10px;
  font-weight: 500;
}

.session-annotations {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-annotation {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border-left: 2px solid;
  font-size: 12px;
}

.mini-type {
  padding: 1px 6px;
  border-radius: 4px;
  color: #0f0f1a;
  font-size: 10px;
  font-weight: 500;
}

.mini-content {
  color: var(--text-secondary);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
