<script setup>
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import { computed, onBeforeUnmount, ref } from 'vue'
import AdminSimpleModal from '@/modules/Admin/admin-simple-modal.vue'
import { deleteBusinessJobPost } from '@/lib/jobs'

const props = defineProps({
  jobs: {
    type: Array,
    default: () => [],
  },
  newJobIds: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: 'all',
  },
})

const search = ref('')
const statusFilter = ref('all')
const actionNotice = ref(null)
const selectedJob = ref(null)
const isViewModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isDeletingJob = ref(false)
let actionNoticeTimer = 0

const TEST_JOB_KEYWORDS = ['test', 'sample', 'demo', 'mock']

const normalizeText = (value) => String(value || '').trim()
const normalizeStatusValue = (value) => normalizeText(value).toLowerCase()
const newJobIdSet = computed(() => new Set(
  (Array.isArray(props.newJobIds) ? props.newJobIds : [])
    .map((value) => normalizeText(value))
    .filter(Boolean),
))
const isNewJob = (job) => newJobIdSet.value.has(normalizeText(job?.id))

const titleCaseText = (value, fallback = 'Not set') => {
  const text = normalizeText(value)
  if (!text) return fallback

  return text
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const formatDate = (value) => {
  const normalizedValue = normalizeText(value)
  if (!normalizedValue) return 'Not set'

  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return 'Not set'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const clearActionNoticeTimer = () => {
  if (typeof window !== 'undefined' && actionNoticeTimer) {
    window.clearTimeout(actionNoticeTimer)
    actionNoticeTimer = 0
  }
}

const showActionNotice = (message, kind = 'success') => {
  clearActionNoticeTimer()
  actionNotice.value = {
    kind,
    message: normalizeText(message),
  }

  if (typeof window !== 'undefined') {
    actionNoticeTimer = window.setTimeout(() => {
      actionNotice.value = null
      actionNoticeTimer = 0
    }, kind === 'error' ? 4600 : 3200)
  }
}

const closeJobModals = () => {
  isViewModalOpen.value = false
  isDeleteModalOpen.value = false
  selectedJob.value = null
}

const isTestJobRecord = (job) => {
  const searchableText = [
    job?.title,
    job?.companyName,
    job?.category,
    job?.type,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean)
    .join(' ')

  return TEST_JOB_KEYWORDS.some((keyword) => searchableText.includes(keyword))
}

const jobRows = computed(() =>
  (Array.isArray(props.jobs) ? props.jobs : []).map((job) => ({
    id: normalizeText(job?.id),
    title: normalizeText(job?.title) || 'Untitled job post',
    companyName: normalizeText(job?.companyName) || 'Company',
    category: normalizeText(job?.category) || 'General',
    location: normalizeText(job?.location) || 'Not specified',
    description: normalizeText(job?.description) || 'No description provided.',
    setup: normalizeText(job?.setup || job?.type) || 'Not set',
    status: normalizeStatusValue(job?.status) || 'open',
    statusLabel: titleCaseText(job?.status, 'Open'),
    vacancies: Math.max(1, Number(job?.vacancies || 1) || 1),
    salary: normalizeText(job?.salaryRange || job?.salary) || 'Negotiable',
    disabilityType: normalizeText(job?.disabilityType) || 'PWD-friendly',
    qualifications: Array.isArray(job?.qualifications) ? job.qualifications.map((item) => normalizeText(item)).filter(Boolean) : [],
    responsibilities: Array.isArray(job?.responsibilities) ? job.responsibilities.map((item) => normalizeText(item)).filter(Boolean) : [],
    workspaceOwnerId: normalizeText(job?.workspaceOwnerId),
    workspaceOwnerEmail: normalizeText(job?.workspaceOwnerEmail),
    updatedAt: normalizeText(job?.updatedAt || job?.createdAt),
    postedAt: normalizeText(job?.createdAt || job?.updatedAt),
    isTest: isTestJobRecord(job),
  })),
)

const visibleJobRows = computed(() =>
  props.mode === 'test'
    ? jobRows.value.filter((job) => job.isTest)
    : jobRows.value,
)

const filteredJobRows = computed(() => {
  const query = normalizeText(search.value).toLowerCase()
  const selectedStatus = normalizeStatusValue(statusFilter.value || 'all')

  return visibleJobRows.value.filter((job) => {
    const matchesQuery = !query || [
      job.id,
      job.title,
      job.companyName,
      job.category,
      job.location,
      job.setup,
      job.workspaceOwnerId,
    ]
      .map((value) => normalizeText(value).toLowerCase())
      .some((value) => value.includes(query))

    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    return matchesQuery && matchesStatus
  })
})

const summaryCards = computed(() => {
  const rows = visibleJobRows.value
  const uniqueCompanyCount = new Set(
    rows
      .map((job) => normalizeText(job.companyName))
      .filter(Boolean),
  ).size
  const totalVacancies = rows.reduce((sum, job) => sum + (Number(job.vacancies) || 0), 0)
  const openCount = rows.filter((job) => job.status === 'open').length

  return [
    {
      label: props.mode === 'test' ? 'Test Posts' : 'Total Posts',
      value: rows.length,
    },
    {
      label: props.mode === 'test' ? 'Open Test Posts' : 'Open Posts',
      value: openCount,
    },
    {
      label: 'Companies',
      value: uniqueCompanyCount,
    },
    {
      label: 'Vacancies',
      value: totalVacancies,
    },
  ]
})

const panelTitle = computed(() =>
  props.mode === 'test' ? 'Test Job Posts' : 'All Job Posts',
)

const panelDescription = computed(() =>
  props.mode === 'test'
    ? 'Review job posts tagged by test-style naming such as test, sample, demo, or mock.'
    : 'Review all job posts created across business workspaces from one admin table.',
)

const emptyTitle = computed(() =>
  props.mode === 'test' ? 'No test job posts found.' : 'No job posts found.',
)

const emptyMessage = computed(() =>
  props.mode === 'test'
    ? 'Try another search or add a job title with test, sample, demo, or mock in its name.'
    : 'Try another search or wait for business workspaces to publish job posts.',
)

const viewJobDetailItems = computed(() => {
  const job = selectedJob.value
  if (!job) return []

  return [
    { label: 'Job ID', value: job.id || 'No job ID' },
    { label: 'Company', value: job.companyName || 'Company' },
    { label: 'Contact Email', value: job.workspaceOwnerEmail || 'No business email found' },
    { label: 'Workspace Owner ID', value: job.workspaceOwnerId || 'Not set' },
    { label: 'Category', value: job.category || 'General' },
    { label: 'Setup', value: job.setup || 'Not set' },
    { label: 'Location', value: job.location || 'Not specified' },
    { label: 'Vacancies', value: String(job.vacancies || 0) },
    { label: 'Salary', value: job.salary || 'Negotiable' },
    { label: 'Disability Fit', value: job.disabilityType || 'PWD-friendly' },
    { label: 'Posted', value: formatDate(job.postedAt) },
    { label: 'Updated', value: formatDate(job.updatedAt) },
  ]
})

const openViewModal = (job) => {
  selectedJob.value = job
  isViewModalOpen.value = true
}

const openDeleteModal = (job) => {
  selectedJob.value = job
  isDeleteModalOpen.value = true
}

const openMessageComposer = (job) => {
  const email = normalizeText(job?.workspaceOwnerEmail)
  if (!email) {
    showActionNotice('No business email found for this job post.', 'error')
    return
  }

  const subject = encodeURIComponent(`Regarding job post: ${normalizeText(job?.title) || 'Job Post'}`)
  const body = encodeURIComponent(`Hello,\n\nI am reaching out regarding the job post "${normalizeText(job?.title) || 'Job Post'}".\n\n`)

  if (typeof window !== 'undefined') {
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }
}

const confirmDeleteJob = async () => {
  const job = selectedJob.value
  if (!job?.id || isDeletingJob.value) return

  isDeletingJob.value = true
  try {
    await deleteBusinessJobPost(job.id, {
      workspaceOwnerId: job.workspaceOwnerId,
    })
    showActionNotice(`Deleted "${job.title}" successfully.`, 'success')
    closeJobModals()
  } catch (error) {
    showActionNotice(
      error instanceof Error ? error.message : 'Unable to delete this job post right now.',
      'error',
    )
  } finally {
    isDeletingJob.value = false
  }
}

onBeforeUnmount(() => {
  clearActionNoticeTimer()
})
</script>

<template>
  <section class="admin-job-posts">
    <div class="admin-job-posts__summary">
      <article v-for="card in summaryCards" :key="card.label" class="admin-job-posts__summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </div>

    <div class="admin-job-posts__toolbar">
      <label class="admin-job-posts__search">
        <span>Search</span>
        <div class="admin-job-posts__search-field">
          <i class="bi bi-search" aria-hidden="true" />
          <input
            v-model.trim="search"
            type="text"
            :placeholder="mode === 'test' ? 'Search test job posts...' : 'Search job posts...'"
          />
        </div>
      </label>

      <label class="admin-job-posts__filter">
        <span>Status</span>
        <select v-model="statusFilter">
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </label>
    </div>

    <div class="admin-job-posts__panel">
      <div class="admin-job-posts__head">
        <div>
          <h2>{{ panelTitle }}</h2>
          <p>{{ panelDescription }}</p>
        </div>
        <span class="admin-job-posts__pill">{{ filteredJobRows.length }} records</span>
      </div>

      <div
        v-if="actionNotice"
        class="admin-job-posts__notice"
        :class="actionNotice.kind === 'error' ? 'is-error' : 'is-success'"
      >
        {{ actionNotice.message }}
      </div>

    <div v-if="filteredJobRows.length" class="admin-job-posts__table-shell">
        <table class="admin-job-posts__table">
          <colgroup>
            <col class="admin-job-posts__col admin-job-posts__col--job">
            <col class="admin-job-posts__col admin-job-posts__col--company">
            <col class="admin-job-posts__col admin-job-posts__col--status">
            <col class="admin-job-posts__col admin-job-posts__col--vacancies">
            <col class="admin-job-posts__col admin-job-posts__col--salary">
            <col class="admin-job-posts__col admin-job-posts__col--updated">
            <col class="admin-job-posts__col admin-job-posts__col--actions">
          </colgroup>
          <thead>
            <tr>
              <th>Job Post</th>
              <th>Company</th>
              <th>Status</th>
              <th>Vacancies</th>
              <th>Salary</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="job in filteredJobRows"
              :key="job.id || `${job.title}-${job.companyName}`"
              class="admin-job-posts__row"
            >
              <td data-label="Job Post">
                <div class="admin-job-posts__job">
                  <strong>{{ job.title }}</strong>
                  <span>{{ job.id || 'No job ID' }}</span>
                  <div class="admin-job-posts__meta">
                    <span v-if="isNewJob(job)" class="admin-job-posts__badge admin-job-posts__badge--new">NEW</span>
                    <span>{{ job.category }}</span>
                    <span>{{ job.location }}</span>
                    <span>{{ job.setup }}</span>
                    <span v-if="job.isTest" class="admin-job-posts__badge">Test</span>
                  </div>
                </div>
              </td>
              <td data-label="Company">
                <div class="admin-job-posts__company">
                  <strong>{{ job.companyName }}</strong>
                  <span>{{ job.workspaceOwnerId || 'No workspace owner ID' }}</span>
                </div>
              </td>
              <td class="admin-job-posts__cell admin-job-posts__cell--status" data-label="Status">
                <span class="admin-job-posts__status" :class="`is-${job.status}`">
                  {{ job.statusLabel }}
                </span>
              </td>
              <td class="admin-job-posts__cell admin-job-posts__cell--metric" data-label="Vacancies">
                <span class="admin-job-posts__metric">{{ job.vacancies }}</span>
              </td>
              <td class="admin-job-posts__cell admin-job-posts__cell--metric" data-label="Salary">
                <span class="admin-job-posts__metric">{{ job.salary }}</span>
              </td>
              <td class="admin-job-posts__cell admin-job-posts__cell--dates" data-label="Updated">
                <div class="admin-job-posts__dates">
                  <strong>{{ formatDate(job.updatedAt) }}</strong>
                  <span>Posted {{ formatDate(job.postedAt) }}</span>
                </div>
              </td>
              <td class="admin-job-posts__cell admin-job-posts__cell--actions" data-label="Actions">
                <div class="admin-job-posts__actions">
                  <button
                    type="button"
                    class="admin-job-posts__action-button"
                    title="View"
                    aria-label="View"
                    @click="openViewModal(job)"
                  >
                    <i class="bi bi-eye" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="admin-job-posts__action-button"
                    title="Message"
                    aria-label="Message"
                    @click="openMessageComposer(job)"
                  >
                    <i class="bi bi-envelope-paper" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="admin-job-posts__action-button is-danger"
                    :disabled="isDeletingJob"
                    title="Delete"
                    aria-label="Delete"
                    @click="openDeleteModal(job)"
                  >
                    <i class="bi bi-trash3" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="admin-job-posts__empty">
        <i class="bi bi-briefcase" aria-hidden="true" />
        <strong>{{ emptyTitle }}</strong>
        <span>{{ emptyMessage }}</span>
      </div>
    </div>

    <AdminSimpleModal
      :open="isViewModalOpen"
      title="Job Post Details"
      subtitle="Review the selected job post and business contact details."
      max-width="46rem"
      @close="closeJobModals"
    >
      <div v-if="selectedJob" class="admin-job-posts__modal-content">
        <div class="admin-job-posts__modal-top">
          <div>
            <h3>{{ selectedJob.title }}</h3>
            <p>{{ selectedJob.companyName }}</p>
          </div>
          <div class="admin-job-posts__modal-badges">
            <span v-if="isNewJob(selectedJob)" class="admin-job-posts__badge admin-job-posts__badge--new">NEW</span>
            <span class="admin-job-posts__status" :class="`is-${selectedJob.status}`">
              {{ selectedJob.statusLabel }}
            </span>
            <span v-if="selectedJob.isTest" class="admin-job-posts__badge">Test Job</span>
          </div>
        </div>

        <div class="admin-job-posts__detail-grid">
          <article
            v-for="item in viewJobDetailItems"
            :key="item.label"
            class="admin-job-posts__detail-card"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>

        <section class="admin-job-posts__detail-section">
          <span>Description</span>
          <p>{{ selectedJob.description }}</p>
        </section>

        <section v-if="selectedJob.qualifications.length" class="admin-job-posts__detail-section">
          <span>Qualifications</span>
          <ul class="admin-job-posts__detail-list">
            <li v-for="item in selectedJob.qualifications" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section v-if="selectedJob.responsibilities.length" class="admin-job-posts__detail-section">
          <span>Responsibilities</span>
          <ul class="admin-job-posts__detail-list">
            <li v-for="item in selectedJob.responsibilities" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>

      <template #actions>
        <button type="button" class="admin-job-posts__modal-button" @click="closeJobModals">
          Close
        </button>
        <button type="button" class="admin-job-posts__modal-button" @click="openMessageComposer(selectedJob)">
          Message
        </button>
        <button type="button" class="admin-job-posts__modal-button is-danger" @click="isDeleteModalOpen = true">
          Delete
        </button>
      </template>
    </AdminSimpleModal>

    <AdminSimpleModal
      :open="isDeleteModalOpen"
      title="Delete Job Post"
      subtitle="This will permanently remove the selected job post."
      max-width="28rem"
      @close="closeJobModals"
    >
      <div class="admin-job-posts__delete-copy">
        <strong>{{ selectedJob?.title || 'Selected job post' }}</strong>
        <p>Do you want to delete this job post now?</p>
      </div>

      <template #actions>
        <button type="button" class="admin-job-posts__modal-button" :disabled="isDeletingJob" @click="closeJobModals">
          Cancel
        </button>
        <button
          type="button"
          class="admin-job-posts__modal-button is-danger"
          :disabled="isDeletingJob"
          @click="confirmDeleteJob"
        >
          {{ isDeletingJob ? 'Deleting...' : 'Delete' }}
        </button>
      </template>
    </AdminSimpleModal>
  </section>
</template>

<style scoped>
.admin-job-posts {
  display: grid;
  gap: 1rem;
}

.admin-job-posts__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.admin-job-posts__summary-card {
  display: grid;
  gap: 0.2rem;
  padding: 1rem 1.05rem;
  border: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.14));
  border-radius: 1rem;
  background: linear-gradient(180deg, var(--admin-bg-surface, #ffffff) 0%, var(--admin-bg-surface-muted, #f7fbf8) 100%);
  box-shadow: var(--admin-shadow-soft, 0 12px 24px rgba(15, 23, 42, 0.06));
}

.admin-job-posts__summary-card span {
  color: var(--admin-text-secondary, #6b8574);
  font-size: 0.75rem;
  font-weight: 600;
}

.admin-job-posts__summary-card strong {
  color: var(--admin-text-primary, #214133);
  font-size: 1.35rem;
  font-weight: 600;
}

.admin-job-posts__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 13rem;
  gap: 0.9rem;
}

.admin-job-posts__search,
.admin-job-posts__filter {
  display: grid;
  gap: 0.38rem;
}

.admin-job-posts__search span,
.admin-job-posts__filter span {
  color: var(--admin-text-secondary, #5c7b69);
  font-size: 0.76rem;
  font-weight: 600;
}

.admin-job-posts__search-field,
.admin-job-posts__filter select {
  min-height: 2.8rem;
  border: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.18));
  border-radius: 0.9rem;
  background: var(--admin-bg-surface, #ffffff);
  box-shadow: var(--admin-shadow-soft, 0 10px 22px rgba(15, 23, 42, 0.05));
}

.admin-job-posts__search-field {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.95rem;
}

.admin-job-posts__search-field i {
  color: var(--admin-text-muted, #7b8f83);
}

.admin-job-posts__search-field input,
.admin-job-posts__filter select {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--admin-input-text, #274234);
  font: inherit;
}

.admin-job-posts__search-field input::placeholder {
  color: var(--admin-input-placeholder, #7b8f83);
}

.admin-job-posts__filter select {
  padding: 0 0.95rem;
  cursor: pointer;
}

.admin-job-posts__panel {
  display: grid;
  gap: 0.9rem;
  padding: 1.1rem;
  border: 1px solid var(--admin-border-color, rgba(125, 182, 148, 0.16));
  border-radius: 1.15rem;
  background: var(--admin-bg-surface-elevated, rgba(255, 255, 255, 0.96));
  box-shadow: var(--admin-shadow-soft, 0 18px 38px rgba(31, 74, 51, 0.08));
}

.admin-job-posts__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-job-posts__head h2 {
  margin: 0;
  color: var(--admin-text-primary, #214133);
  font-size: 1.15rem;
  font-weight: 600;
}

.admin-job-posts__head p {
  margin: 0.2rem 0 0;
  color: var(--admin-text-secondary, #61806d);
  font-size: 0.88rem;
  line-height: 1.5;
}

.admin-job-posts__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: var(--admin-theme-accent-soft, rgba(47, 106, 73, 0.09));
  color: var(--admin-theme-accent, #29543d);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.admin-job-posts__notice {
  padding: 0.8rem 0.95rem;
  border-radius: 0.95rem;
  font-size: 0.84rem;
  font-weight: 500;
}

.admin-job-posts__notice.is-success {
  background: rgba(82, 175, 118, 0.12);
  color: #2e6d45;
  border: 1px solid rgba(82, 175, 118, 0.18);
}

.admin-job-posts__notice.is-error {
  background: rgba(214, 120, 92, 0.12);
  color: #9b4126;
  border: 1px solid rgba(214, 120, 92, 0.18);
}

.admin-job-posts__table-shell {
  border: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.12));
  border-radius: 1rem;
  background: var(--admin-bg-surface, #ffffff);
  overflow-x: auto;
}

.admin-job-posts__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 84rem;
}

.admin-job-posts__col--job {
  width: 24rem;
}

.admin-job-posts__col--company {
  width: 16rem;
}

.admin-job-posts__col--status {
  width: 8.5rem;
}

.admin-job-posts__col--vacancies {
  width: 7rem;
}

.admin-job-posts__col--salary {
  width: 11rem;
}

.admin-job-posts__col--updated {
  width: 11rem;
}

.admin-job-posts__col--actions {
  width: 9.75rem;
}

.admin-job-posts__table th {
  padding: 0.95rem 0.9rem;
  color: var(--admin-text-secondary, #6c8575);
  font-size: 0.76rem;
  font-weight: 600;
  text-align: left;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--admin-bg-surface-muted, #f7fbf8);
  border-bottom: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.12));
}

.admin-job-posts__table td {
  padding: 0.95rem 0.9rem;
  border-top: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.12));
  vertical-align: top;
  color: var(--admin-text-primary, #274234);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.admin-job-posts__row {
  transition: background-color 0.18s ease, transform 0.18s ease;
}

.admin-job-posts__row:hover {
  background: var(--admin-bg-hover, rgba(241, 245, 249, 0.96));
}

.admin-job-posts__cell--status,
.admin-job-posts__cell--metric,
.admin-job-posts__cell--actions {
  vertical-align: middle;
}

.admin-job-posts__cell--actions {
  text-align: right;
}

.admin-job-posts__job,
.admin-job-posts__company,
.admin-job-posts__dates {
  display: grid;
  gap: 0.22rem;
}

.admin-job-posts__job strong,
.admin-job-posts__company strong,
.admin-job-posts__dates strong {
  color: var(--admin-text-primary, #213c30);
  font-size: 0.94rem;
  font-weight: 600;
}

.admin-job-posts__job span,
.admin-job-posts__company span,
.admin-job-posts__dates span {
  color: var(--admin-text-secondary, #6f8579);
  font-size: 0.78rem;
}

.admin-job-posts__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.1rem;
}

.admin-job-posts__meta span,
.admin-job-posts__badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.55rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--admin-theme-accent-soft, rgba(47, 106, 73, 0.08));
  color: var(--admin-theme-accent, #2c5a42);
  font-size: 0.74rem;
  font-weight: 500;
}

.admin-job-posts__badge {
  background: rgba(212, 159, 54, 0.16);
  color: #8b6115;
}

.admin-job-posts__badge--new {
  background: rgba(34, 197, 94, 0.14);
  color: #18794e;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.admin-job-posts__status {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.admin-job-posts__status.is-open {
  background: rgba(82, 175, 118, 0.16);
  color: #2e6d45;
}

.admin-job-posts__status.is-closed {
  background: rgba(214, 120, 92, 0.16);
  color: #9b4126;
}

.admin-job-posts__status.is-draft {
  background: rgba(113, 129, 148, 0.16);
  color: #45586f;
}

.admin-job-posts__actions {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 2.1rem;
  gap: 0.45rem;
  justify-content: end;
  align-items: center;
  width: 100%;
  white-space: nowrap;
}

.admin-job-posts__action-button,
.admin-job-posts__modal-button {
  border: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.18));
  background: var(--admin-bg-surface, #ffffff);
  color: var(--admin-text-primary, #2b5540);
  font: inherit;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.admin-job-posts__action-button {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.82rem;
  display: grid;
  place-items: center;
  padding: 0;
  font-size: 0.95rem;
  line-height: 1;
  flex: 0 0 auto;
}

.admin-job-posts__modal-button {
  min-height: 2rem;
  padding: 0.35rem 0.8rem;
  border-radius: 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.admin-job-posts__action-button:hover,
.admin-job-posts__modal-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--admin-shadow-soft, 0 12px 20px rgba(31, 74, 51, 0.08));
  border-color: var(--admin-theme-accent-border, rgba(47, 106, 73, 0.26));
}

.admin-job-posts__action-button:disabled,
.admin-job-posts__modal-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.admin-job-posts__action-button.is-danger,
.admin-job-posts__modal-button.is-danger {
  border-color: rgba(214, 120, 92, 0.2);
  color: #9b4126;
  background: rgba(255, 247, 245, 0.98);
}

.admin-job-posts__modal-content {
  display: grid;
  gap: 1rem;
}

.admin-job-posts__modal-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.admin-job-posts__modal-top h3 {
  margin: 0;
  color: var(--admin-text-primary, #214133);
  font-size: 1.1rem;
  font-weight: 600;
}

.admin-job-posts__modal-top p {
  margin: 0.2rem 0 0;
  color: var(--admin-text-secondary, #6b8574);
  font-size: 0.84rem;
}

.admin-job-posts__modal-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.admin-job-posts__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.admin-job-posts__detail-card {
  display: grid;
  gap: 0.24rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.14));
  border-radius: 0.95rem;
  background: var(--admin-bg-surface-muted, rgba(247, 251, 248, 0.82));
}

.admin-job-posts__detail-card span,
.admin-job-posts__detail-section span {
  color: var(--admin-text-secondary, #6d8377);
  font-size: 0.75rem;
  font-weight: 600;
}

.admin-job-posts__detail-card strong {
  color: var(--admin-text-primary, #244133);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.45;
}

.admin-job-posts__detail-section {
  display: grid;
  gap: 0.45rem;
}

.admin-job-posts__detail-section p {
  margin: 0;
  color: var(--admin-text-primary, #294436);
  font-size: 0.9rem;
  line-height: 1.6;
}

.admin-job-posts__detail-list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--admin-text-primary, #294436);
  font-size: 0.88rem;
  line-height: 1.6;
}

.admin-job-posts__delete-copy {
  display: grid;
  gap: 0.35rem;
}

.admin-job-posts__delete-copy strong {
  color: var(--admin-text-primary, #244133);
  font-size: 0.96rem;
  font-weight: 600;
}

.admin-job-posts__delete-copy p {
  margin: 0;
  color: var(--admin-text-secondary, #6b8574);
  font-size: 0.86rem;
  line-height: 1.5;
}

.admin-job-posts__empty {
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  padding: 2rem 1rem;
  border: 1px dashed var(--admin-border-color, rgba(122, 179, 145, 0.26));
  border-radius: 1rem;
  background: var(--admin-bg-surface-muted, rgba(247, 251, 248, 0.85));
  text-align: center;
}

.admin-job-posts__empty i {
  color: var(--admin-text-muted, #7aa787);
  font-size: 1.45rem;
}

.admin-job-posts__empty strong {
  color: var(--admin-text-primary, #244133);
  font-size: 1rem;
  font-weight: 600;
}

.admin-job-posts__empty span {
  color: var(--admin-text-secondary, #6b8574);
  font-size: 0.84rem;
  line-height: 1.5;
}

.admin-job-posts__metric {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  color: var(--admin-text-primary, #274234);
  font-weight: 600;
  line-height: 1.4;
}

@media (max-width: 1080px) {
  .admin-job-posts__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-job-posts__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-job-posts__detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-job-posts__table {
    min-width: 76rem;
  }
}

@media (max-width: 900px) {
  .admin-job-posts__summary {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-job-posts__panel {
    padding: 0.95rem;
  }

  .admin-job-posts__head {
    flex-direction: column;
  }

  .admin-job-posts__modal-top {
    flex-direction: column;
  }

  .admin-job-posts__modal-badges {
    justify-content: flex-start;
  }

  .admin-job-posts__table,
  .admin-job-posts__table thead,
  .admin-job-posts__table tbody,
  .admin-job-posts__table tr,
  .admin-job-posts__table th,
  .admin-job-posts__table td {
    display: block;
    width: 100%;
  }

  .admin-job-posts__table {
    min-width: 0;
  }

  .admin-job-posts__table thead {
    display: none;
  }

  .admin-job-posts__row {
    display: grid;
    gap: 0.75rem;
    padding: 0.95rem;
    border-top: 1px solid var(--admin-border-color, rgba(122, 179, 145, 0.12));
  }

  .admin-job-posts__row:first-child {
    border-top: 0;
  }

  .admin-job-posts__table td {
    padding: 0;
    border-top: 0;
  }

  .admin-job-posts__table td::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 0.28rem;
    color: var(--admin-text-muted, #6c8575);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .admin-job-posts__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    width: auto;
    white-space: normal;
  }
}

@media (max-width: 640px) {
  .admin-job-posts__toolbar {
    gap: 0.75rem;
  }

  .admin-job-posts__summary-card,
  .admin-job-posts__panel {
    padding-inline: 0.9rem;
  }
}
</style>
