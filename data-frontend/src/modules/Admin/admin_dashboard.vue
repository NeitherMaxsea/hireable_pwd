<script setup>
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import AdminAllUser from '@/modules/Admin/admin-all-user.vue'
import AdminApplicantStorage from '@/modules/Admin/admin-applicant-storage.vue'
import AdminBusinessStorage from '@/modules/Admin/admin-business-storage.vue'
import AdminCreatePlan from '@/modules/Admin/admin-create-plan.vue'
import AdminCreateUser from '@/modules/Admin/admin-create-user.vue'
import AdminApplicantList from '@/modules/Admin/admin-applicantlist.vue'
import AdminDeletionHistory from '@/modules/Admin/admin-deletion-history.vue'
import AdminEmployeeList from '@/modules/Admin/admin-employeelist.vue'
import AdminJobPostList from '@/modules/Admin/admin-job-post-list.vue'
import AdminNavbar from '@/modules/Admin/adminnavbar.vue'
import AdminPreviewPlan from '@/modules/Admin/admin-preview-plan.vue'
import AdminRoleBasedControlSytem from '@/modules/Admin/admin-rolebasedcontrolsytem.vue'
import AdminSidebar from '@/modules/Admin/admin_sidebar.vue'
import logoPwd from '@/assets/logo-pwd.png'
import pwdWordmark from '@/assets/pwdlogo.png'
import {
  recordSystemActivity,
  sendAdminDirectMessage,
  subscribeToActivityLogs,
  subscribeToAdminProfiles,
  subscribeToBusinessWorkspaceUsers,
  subscribeToDeletedUserHistory,
} from '@/lib/auth'
import { clearAuthSession, getStoredAuthUser } from '@/lib/auth'
import { mediaUrl } from '@/lib/media'
import { subscribeToAdminPlanCatalog } from '@/lib/business_plan_access'
import {
  migrateBusinessPaymentHistoryEntries,
  subscribeToAllBusinessPaymentHistory,
} from '@/lib/business_payment_history'
import { getAllJobs, getPublicJobs, subscribeToAllJobs, subscribeToPublicJobs } from '@/lib/jobs'
import { auth, db } from '@/firebase'

const router = useRouter()
const LOGOUT_TOAST_KEY = 'showLoggedOutToast'
const primaryItemDefinitions = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid' },
]

const userManagementItemDefinitions = [
  { key: 'all-user', label: 'User Overview', icon: 'bi bi-people-fill' },
  { key: 'create-user', label: 'Create User', icon: 'bi bi-person-plus' },
  { key: 'applicant-list', label: 'Applicant List', icon: 'bi bi-person-lines-fill' },
  { key: 'employee-list', label: 'Business List', icon: 'bi bi-people' },
  { key: 'role-base-control-system', label: 'RBAC', icon: 'bi bi-shield-lock' },
  { key: 'history-delection-user', label: 'Delete User History', icon: 'bi bi-clock-history' },
]

const paymentManagementItemDefinitions = [
  { key: 'create-plan', label: 'Create Plan', icon: 'bi bi-plus-square' },
  { key: 'preview-plan', label: 'Preview Plan', icon: 'bi bi-card-checklist' },
  { key: 'payment-history', label: 'Payment History', icon: 'bi bi-credit-card-2-front' },
]

const jobManagementItemDefinitions = [
  { key: 'all-job-post', label: 'All Job Posts', icon: 'bi bi-card-list' },
  { key: 'test-job-post', label: 'Test Job Posts', icon: 'bi bi-bezier2' },
]

const storageManagementItemDefinitions = [
  { key: 'applicant-storage', label: 'Applicant Storage', icon: 'bi bi-folder-check' },
  { key: 'business-storage', label: 'Business Storage', icon: 'bi bi-hdd-stack' },
]

const secondaryItemDefinitions = [
  { key: 'logs', label: 'Logs', icon: 'bi bi-journal-text' },
  { key: 'settings', label: 'Settings', icon: 'bi bi-gear' },
]

const ADMIN_NOTIFICATION_STORAGE_KEY = 'adminDashboardNotifications'
const ADMIN_SEEN_APPLICANT_IDS_STORAGE_KEY = 'adminSeenApplicantIds'
const ADMIN_SEEN_EMPLOYER_IDS_STORAGE_KEY = 'adminSeenEmployerIds'
const ADMIN_SEEN_PAYMENT_ENTRY_IDS_STORAGE_KEY = 'adminSeenPaymentEntryIds'
const ADMIN_SEEN_JOB_POST_IDS_STORAGE_KEY = 'adminSeenJobPostIds'
const ADMIN_SEEN_ACTIVITY_LOG_IDS_STORAGE_KEY = 'adminSeenActivityLogIds'
const ADMIN_NOTIFICATION_LIMIT = 12
const ADMIN_PAYMENT_HISTORY_STORAGE_KEY = 'adminPaymentHistory'
const ADMIN_SIDEBAR_DROPDOWNS_STORAGE_KEY = 'adminSidebarDropdownState'
const ADMIN_SETTINGS_STORAGE_KEY = 'adminDashboardSettings'
const ADMIN_RECENT_RECORD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const ADMIN_THEME_OPTIONS = [
  {
    value: 'sage',
    label: 'Sage',
    description: 'Clean green workspace',
    preview: 'linear-gradient(135deg, #2f6a49 0%, #8fd0ad 100%)',
  },
  {
    value: 'ocean',
    label: 'Ocean',
    description: 'Cool blue control room',
    preview: 'linear-gradient(135deg, #355aa8 0%, #8eb4ff 100%)',
  },
  {
    value: 'sunrise',
    label: 'Sunrise',
    description: 'Warm gold highlight',
    preview: 'linear-gradient(135deg, #c86a27 0%, #f2c36b 100%)',
  },
]
const ADMIN_DOCUMENT_THEME_VARIABLE_KEYS = [
  '--admin-theme-accent',
  '--admin-theme-accent-soft',
  '--admin-theme-accent-border',
  '--admin-theme-shell-glow',
  '--admin-bg-shell-start',
  '--admin-bg-shell-mid',
  '--admin-bg-shell-end',
  '--admin-bg-content-glow',
  '--admin-bg-content-top',
  '--admin-bg-content-bottom',
  '--admin-bg-surface',
  '--admin-bg-surface-muted',
  '--admin-bg-surface-elevated',
  '--admin-bg-surface-inset',
  '--admin-bg-hover',
  '--admin-bg-hover-strong',
  '--admin-bg-overlay',
  '--admin-text-primary',
  '--admin-text-secondary',
  '--admin-text-muted',
  '--admin-border-color',
  '--admin-border-strong',
  '--admin-shadow-soft',
  '--admin-shadow-strong',
  '--admin-input-bg',
  '--admin-input-border',
  '--admin-input-text',
  '--admin-input-placeholder',
  '--admin-icon-color',
]

const profileMenuOpen = ref(false)
const notificationMenuOpen = ref(false)
const settingsModalOpen = ref(false)
const adminMessageModalOpen = ref(false)
const settingsActivePanel = ref('preferences')
const userManagementOpen = ref(false)
const paymentManagementOpen = ref(false)
const jobManagementOpen = ref(false)
const storageManagementOpen = ref(false)
const activeAdminView = ref('dashboard')
const recentApprovedSearch = ref('')
const recentApprovedRoleFilter = ref('all')
const isRecentApprovedRoleDropdownOpen = ref(false)
const paymentHistorySearch = ref('')
const paymentHistoryStatusFilter = ref('all')
const isPaymentHistoryStatusDropdownOpen = ref(false)
const workspaceMemberSearch = ref('')
const selectedWorkspaceMemberId = ref('all')
const currentUser = ref(null)
const adminProfiles = ref({
  applicants: [],
  employers: [],
})
const deletedUserHistory = ref([])
const activityLogs = ref([])
const businessWorkspaceUsers = ref({})
const adminNotifications = ref([])
const adminToast = ref(null)
const selectedAdminMessageRecipient = ref(null)
const isAdminMessageSubmitting = ref(false)
const adminDirectMessageForm = ref({
  title: '',
  message: '',
})
const publicJobs = ref([])
const adminJobPosts = ref([])
const adminPaymentHistory = ref([])
const adminPlanCatalog = ref([])
const seenApplicantIds = ref([])
const seenEmployerIds = ref([])
const seenPaymentEntryIds = ref([])
const seenJobPostIds = ref([])
const seenActivityLogIds = ref([])
const isInitialAdminLoading = ref(true)
const settingsPreferences = ref({
  compactCards: false,
  reduceMotion: false,
  darkMode: false,
})
const selectedAdminTheme = ref('sage')
let stopAuthWatcher = () => {}
let stopAdminProfiles = () => {}
let stopDeletedHistory = () => {}
let stopActivityLogs = () => {}
let stopAdminPlanCatalog = () => {}
let stopPublicJobs = () => {}
let stopAllJobs = () => {}
let stopBusinessPaymentHistory = () => {}
let notificationToastTimer = 0
let hasHydratedAdminNotificationState = false
let shouldSeedSeenApplicantIdsOnFirstSnapshot = true
let shouldSeedSeenEmployerIdsOnFirstSnapshot = true
let shouldSeedSeenPaymentEntryIdsOnFirstSnapshot = true
let shouldSeedSeenJobPostIdsOnFirstSnapshot = true
let shouldSeedSeenActivityLogIdsOnFirstSnapshot = true
let adminSessionStartedAt = Date.now()
let usePublicJobFallbackForAdminViews = false
const workspaceUserDirectoryStops = new Map()
const ADMIN_DIRECT_MESSAGE_TITLE_LIMIT = 80
const ADMIN_DIRECT_MESSAGE_BODY_LIMIT = 500

const isAnyAdminLoading = computed(() => isInitialAdminLoading.value)
const adminDirectMessageBodyLength = computed(() => String(adminDirectMessageForm.value.message || '').length)
const canSubmitAdminDirectMessage = computed(() =>
  String(adminDirectMessageForm.value.message || '').trim().length > 0
    && adminDirectMessageBodyLength.value <= ADMIN_DIRECT_MESSAGE_BODY_LIMIT,
)

watch([isAnyAdminLoading, settingsModalOpen, adminMessageModalOpen], ([isLoading, isSettingsOpen, isMessageOpen]) => {
  if (typeof document === 'undefined') return

  document.body.style.overflow = isLoading || isSettingsOpen || isMessageOpen ? 'hidden' : ''
})

watch(settingsPreferences, () => {
  persistAdminSettings()
}, { deep: true })

watch(selectedAdminTheme, () => {
  persistAdminSettings()
})

watch(
  () => (Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : []).map((entry) => String(entry?.id || '').trim()).sort().join('|'),
  () => {
    syncWorkspaceUserSubscriptions()
    reconcileEmployerSidebarState(adminProfiles.value.employers)
  },
)

watch(
  () => adminPaymentHistory.value.map((entry) => String(entry?.id || '').trim()).sort().join('|'),
  () => {
    reconcilePaymentHistorySidebarState(adminPaymentHistory.value)
  },
)

watch(
  () => adminJobPosts.value.map((entry) => String(entry?.id || '').trim()).sort().join('|'),
  () => {
    reconcileAdminJobSidebarState(adminJobPosts.value)
  },
)

watch(
  () => activityLogs.value.map((entry) => String(entry?.id || '').trim()).sort().join('|'),
  () => {
    reconcileAdminActivityLogSidebarState(activityLogs.value)
  },
)

const allAdminProfiles = computed(() => [
  ...(Array.isArray(adminProfiles.value.applicants) ? adminProfiles.value.applicants : []),
  ...(Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : []),
])

const normalizeStatusValue = (value) => String(value || '').trim().toLowerCase()
const normalizeStatusClass = (value) => normalizeStatusValue(value).replace(/[^a-z0-9]+/g, '-')
const normalizeIdList = (values = []) => [
  ...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  ),
]
const areIdListsEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index])

const initialsFromName = (value, fallback = 'AC') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || fallback

const dashboardAvatarClass = (role) => {
  const normalizedRole = normalizeStatusValue(role)
  return normalizedRole.includes('applicant')
    ? 'dashboard-approved-row__avatar--applicant'
    : 'dashboard-approved-row__avatar--business'
}

const employerAvatarUrl = (record) =>
  String(record?.business_avatar || record?.avatar || '').trim()

const applicantAvatarUrl = (record) =>
  mediaUrl(String(
    record?.avatar
    || record?.avatar_url
    || record?.applicant_registration?.avatar
    || record?.applicantRegistration?.avatar
    || record?.user?.avatar
    || ''
  ).trim())

const employerDirectoryLookup = computed(() => {
  const employers = Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : []
  const byId = new Map()
  const byEmail = new Map()

  employers.forEach((entry) => {
    const id = String(entry?.id || '').trim()
    const email = String(entry?.email || '').trim().toLowerCase()
    if (id) byId.set(id, entry)
    if (email) byEmail.set(email, entry)
  })

  return { byId, byEmail }
})

const resolveBusinessAvatarUrl = ({ id = '', email = '' } = {}) => {
  const normalizedId = String(id || '').trim()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const employer =
    (normalizedId ? employerDirectoryLookup.value.byId.get(normalizedId) : null)
    || (normalizedEmail ? employerDirectoryLookup.value.byEmail.get(normalizedEmail) : null)
    || null

  return employerAvatarUrl(employer)
}

const isExplicitlyActive = (record) => {
  const status = normalizeStatusValue(record?.status || record?.account_status || record?.plan_status)
  if (status) return status === 'active'
  if (typeof record?.is_active === 'boolean') return record.is_active
  if (typeof record?.active === 'boolean') return record.active
  return normalizeStatusValue(record?.approval_status) === 'approved'
}

const isExplicitlyInactive = (record) => {
  const status = normalizeStatusValue(record?.status || record?.account_status || record?.plan_status)
  if (status) return status === 'inactive'
  if (typeof record?.is_active === 'boolean') return record.is_active === false
  if (typeof record?.active === 'boolean') return record.active === false
  const approvalStatus = normalizeStatusValue(record?.approval_status)
  return approvalStatus === 'rejected' || approvalStatus === 'banned'
}

const dashboardMetrics = computed(() => {
  const profiles = allAdminProfiles.value

  return {
    applicantCount: Array.isArray(adminProfiles.value.applicants) ? adminProfiles.value.applicants.length : 0,
    companyCount: Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers.length : 0,
    jobsCount: Array.isArray(publicJobs.value) ? publicJobs.value.length : 0,
    deletedHistoryCount: Array.isArray(deletedUserHistory.value) ? deletedUserHistory.value.length : 0,
    pendingCount: profiles.filter((record) => normalizeStatusValue(record?.approval_status) === 'pending').length,
    approvedCount: profiles.filter((record) => normalizeStatusValue(record?.approval_status) === 'approved').length,
    rejectedCount: profiles.filter((record) => normalizeStatusValue(record?.approval_status) === 'rejected').length,
    activeCount: profiles.filter(isExplicitlyActive).length,
    inactiveCount: profiles.filter(isExplicitlyInactive).length,
  }
})

const parseRecordDate = (value) => {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value?.toDate === 'function') {
    const nextDate = value.toDate()
    return Number.isNaN(nextDate?.getTime?.()) ? null : nextDate
  }
  if (typeof value?.seconds === 'number') {
    const nextDate = new Date(value.seconds * 1000)
    return Number.isNaN(nextDate.getTime()) ? null : nextDate
  }
  const nextDate = new Date(value)
  return Number.isNaN(nextDate.getTime()) ? null : nextDate
}

const isRecentRecordDate = (value) => {
  const parsed = parseRecordDate(value)
  if (!parsed) return false

  const diffMs = Date.now() - parsed.getTime()
  return diffMs >= 0 && diffMs <= ADMIN_RECENT_RECORD_WINDOW_MS
}

const resolvePaymentHistoryRecordDate = (entry = {}) =>
  parseRecordDate(
    entry?.createdAt
    || entry?.updatedAt
    || `${entry?.date || ''} ${entry?.time || ''}`.trim()
    || entry?.date
    || '',
  )

const isRecentPaymentHistoryRecord = (entry = {}) => {
  const parsed = resolvePaymentHistoryRecordDate(entry)
  return parsed ? isRecentRecordDate(parsed) : false
}

const isRecentActivityLogRecord = (entry = {}) => isRecentRecordDate(entry?.createdAt)

const buildSmoothLinePath = (points) => {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const currentPoint = points[index]
    const nextPoint = points[index + 1]
    const controlX = currentPoint.x + (nextPoint.x - currentPoint.x) / 2
    path += ` C ${controlX.toFixed(2)} ${currentPoint.y.toFixed(2)}, ${controlX.toFixed(2)} ${nextPoint.y.toFixed(2)}, ${nextPoint.x.toFixed(2)} ${nextPoint.y.toFixed(2)}`
  }

  return path
}

const buildAreaPath = (points, chartHeight) => {
  if (!points.length) return ''
  const linePath = buildSmoothLinePath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  return `${linePath} L ${lastPoint.x.toFixed(2)} ${chartHeight.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${chartHeight.toFixed(2)} Z`
}

const calculateGrowth = (current, previous) => {
  const safeCurrent = Number(current) || 0
  const safePrevious = Number(previous) || 0
  if (safePrevious <= 0) {
    return {
      value: safeCurrent > 0 ? 100 : 0,
      isNew: safeCurrent > 0,
      trend: safeCurrent > 0 ? 'up' : 'neutral',
    }
  }

  const value = Math.round(((safeCurrent - safePrevious) / safePrevious) * 100)
  return {
    value,
    isNew: false,
    trend: value > 0 ? 'up' : value < 0 ? 'down' : 'neutral',
  }
}

const formatGrowthLabel = (growth) => {
  if (growth.isNew) return 'New activity'
  if (growth.value > 0) return `+${growth.value}%`
  if (growth.value < 0) return `${growth.value}%`
  return '0%'
}

const accountTrendChart = computed(() => {
  const { pendingCount, approvedCount, rejectedCount } = dashboardMetrics.value
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    date.setMonth(date.getMonth() - (5 - index))
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      applicants: 0,
      companies: 0,
    }
  })

  const monthMap = new Map(months.map((month) => [month.key, month]))
  allAdminProfiles.value.forEach((record) => {
    const createdAt = parseRecordDate(record?.created_at || record?.createdAt || record?.submitted_at)
    if (createdAt) {
      const createdKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(createdKey)) {
        const targetMonth = monthMap.get(createdKey)
        const normalizedRole = normalizeStatusValue(record?.role || record?.user?.role)
        if (normalizedRole === 'employer' || normalizedRole === 'business' || normalizedRole === 'business_owner') {
          targetMonth.companies += 1
        } else {
          targetMonth.applicants += 1
        }
      }
    }
  })

  const chartWidth = 520
  const chartHeight = 184
  const maxValue = Math.max(1, ...months.map((month) => Math.max(month.applicants, month.companies)))
  const stepX = months.length > 1 ? chartWidth / (months.length - 1) : chartWidth
  const toY = (value) => chartHeight - ((value / maxValue) * (chartHeight - 18) + 9)

  const applicantPoints = months.map((month, index) => ({
    x: index * stepX,
    y: toY(month.applicants),
    value: month.applicants,
    label: month.label,
  }))

  const companyPoints = months.map((month, index) => ({
    x: index * stepX,
    y: toY(month.companies),
    value: month.companies,
    label: month.label,
  }))

  const currentMonth = months[months.length - 1] || { applicants: 0, companies: 0, label: 'This month' }
  const previousMonth = months[months.length - 2] || { applicants: 0, companies: 0, label: 'Last month' }
  const applicantGrowth = calculateGrowth(currentMonth.applicants, previousMonth.applicants)
  const companyGrowth = calculateGrowth(currentMonth.companies, previousMonth.companies)
  return {
    months,
    chartWidth,
    chartHeight,
    maxValue,
    applicantPath: buildSmoothLinePath(applicantPoints),
    applicantAreaPath: buildAreaPath(applicantPoints, chartHeight),
    companyPath: buildSmoothLinePath(companyPoints),
    applicantPoints,
    companyPoints,
    currentMonth,
    previousMonth,
    applicantGrowth,
    companyGrowth,
    growthCards: [
      {
        label: 'Applicants',
        value: formatGrowthLabel(applicantGrowth),
        detail: `${currentMonth.applicants} this month vs ${previousMonth.applicants} last month`,
        trend: applicantGrowth.trend,
      },
      {
        label: 'Employers',
        value: formatGrowthLabel(companyGrowth),
        detail: `${currentMonth.companies} this month vs ${previousMonth.companies} last month`,
        trend: companyGrowth.trend,
      },
    ],
    totalApplicants: months.reduce((sum, month) => sum + month.applicants, 0),
    totalCompanies: months.reduce((sum, month) => sum + month.companies, 0),
  }
})


const approvalStatusChart = computed(() => {
  const {
    pendingCount,
    applicantCount,
    companyCount,
  } = dashboardMetrics.value
  const allSegments = [
    { label: 'Pending', count: pendingCount, color: '#d9a441' },
    { label: 'Applicant', count: applicantCount, color: '#3b82f6' },
    { label: 'Business', count: companyCount, color: '#7c3aed' },
  ]
  const total = allSegments.reduce((sum, item) => sum + item.count, 0)
  const segments = allSegments.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.count / total) * 100) : 0,
  }))
  const visibleLegend = segments.filter((item) => item.count > 0 || item.label === 'Pending')

  let currentStop = 0
  const gradientStops = []

  segments.forEach((item) => {
    if (!total || item.count <= 0) return
    const nextStop = currentStop + ((item.count / total) * 100)
    gradientStops.push(`${item.color} ${currentStop}% ${nextStop}%`)
    currentStop = nextStop
  })

  if (!gradientStops.length) {
    gradientStops.push('#dbe7e0 0 100%')
  } else if (currentStop < 100) {
    gradientStops.push(`#dbe7e0 ${currentStop}% 100%`)
  }

  return {
    centerValue: String(total),
    centerLabel: total === 1 ? 'Profile synced' : 'Profiles synced',
    legend: visibleLegend.length ? visibleLegend : segments,
    ringStyle: {
      background: `conic-gradient(${gradientStops.join(', ')})`,
    },
  }
})

const dashboardSummaryCards = computed(() => {
  const {
    applicantCount,
    companyCount,
    jobsCount,
    deletedHistoryCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    activeCount,
    inactiveCount,
  } = dashboardMetrics.value

  return [
    {
      label: 'Applicant',
      value: String(applicantCount),
      subtitle: 'Applicant accounts',
      trend: applicantCount > 0 ? 'up' : 'neutral',
      icon: 'bi bi-person-badge',
      tone: 'emerald',
    },
    {
      label: 'Business',
      value: String(companyCount),
      subtitle: 'Company accounts',
      trend: companyCount > 0 ? 'up' : 'neutral',
      icon: 'bi bi-buildings',
      tone: 'sky',
    },
    {
      label: 'Jobs',
      value: String(jobsCount),
      subtitle: 'Published listings',
      trend: jobsCount > 0 ? 'up' : 'neutral',
      icon: 'bi bi-briefcase',
      tone: 'violet',
    },
    {
      label: 'Deleted',
      value: String(deletedHistoryCount),
      subtitle: 'History deleted users',
      trend: deletedHistoryCount > 0 ? 'down' : 'neutral',
      icon: 'bi bi-trash3',
      tone: 'rose',
    },
    {
      label: 'Pending',
      value: String(pendingCount),
      subtitle: 'Awaiting review',
      trend: pendingCount > 0 ? 'neutral' : 'up',
      icon: 'bi bi-hourglass-split',
      tone: 'amber',
    },
    {
      label: 'Approved',
      value: String(approvedCount),
      subtitle: 'Approved records',
      trend: approvedCount > 0 ? 'up' : 'neutral',
      icon: 'bi bi-patch-check',
      tone: 'mint',
    },
    {
      label: 'Rejected',
      value: String(rejectedCount),
      subtitle: 'Needs follow-up',
      trend: rejectedCount > 0 ? 'down' : 'neutral',
      icon: 'bi bi-x-circle',
      tone: 'rose',
    },
    {
      label: 'Active',
      value: String(activeCount),
      subtitle: 'Currently active',
      trend: activeCount > 0 ? 'up' : 'neutral',
      icon: 'bi bi-check-circle',
      tone: 'green',
    },
    {
      label: 'Inactive',
      value: String(inactiveCount),
      subtitle: 'Currently inactive',
      trend: inactiveCount > 0 ? 'down' : 'neutral',
      icon: 'bi bi-slash-circle',
      tone: 'slate',
    },
  ]
})

const dashboardStaggerStyle = (index, baseDelay = 0) => ({
  '--dashboard-enter-delay': `${baseDelay + (index * 90)}ms`,
})

const approvedAccountName = (record) =>
  String(
    record?.name
    || record?.company_name
    || record?.user?.name
    || `${record?.first_name || ''} ${record?.last_name || ''}`.trim()
    || 'Approved Account',
  ).trim()

const approvedAccountEmail = (record) =>
  String(record?.email || record?.user?.email || 'No email on file').trim() || 'No email on file'

const approvedAccountRole = (record) => {
  const normalizedRole = String(record?.role || record?.user?.role || '').trim().toLowerCase()
  if (normalizedRole === 'applicant') return 'Applicant'
  if (normalizedRole === 'employer') {
    const organizationType = String(record?.company_organization_type || record?.companyOrganizationType || '')
      .trim()
      .toLowerCase()
    return organizationType === 'business' ? 'Business' : 'Company'
  }
  if (normalizedRole === 'admin') return 'Admin'
  return 'Account'
}

const formatRecordCount = (value) => {
  const count = Number(value) || 0
  return `${count} ${count === 1 ? 'record' : 'records'}`
}

const formatApprovedAccountId = (value) => {
  const normalized = String(value || '').trim()
  return normalized || 'No ID'
}

const approvedStatusLabel = (record) => {
  const normalizedStatus = normalizeStatusValue(record?.approval_status)
  if (normalizedStatus === 'approved') return 'Approved'
  return 'Active'
}

const recentApprovedRoleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'applicant', label: 'Applicant' },
  { value: 'business', label: 'Business' },
]

const selectedRecentApprovedRoleLabel = computed(() =>
  recentApprovedRoleOptions.find((option) => option.value === recentApprovedRoleFilter.value)?.label || 'All Roles',
)

const paymentHistoryStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const selectedPaymentHistoryStatusLabel = computed(() =>
  paymentHistoryStatusOptions.find((option) => option.value === paymentHistoryStatusFilter.value)?.label || 'All',
)

const toggleRecentApprovedRoleDropdown = () => {
  isRecentApprovedRoleDropdownOpen.value = !isRecentApprovedRoleDropdownOpen.value
}

const selectRecentApprovedRole = (role) => {
  recentApprovedRoleFilter.value = String(role || 'all')
  isRecentApprovedRoleDropdownOpen.value = false
}

const togglePaymentHistoryStatusDropdown = () => {
  isPaymentHistoryStatusDropdownOpen.value = !isPaymentHistoryStatusDropdownOpen.value
}

const selectPaymentHistoryStatus = (status) => {
  paymentHistoryStatusFilter.value = String(status || 'all')
  isPaymentHistoryStatusDropdownOpen.value = false
}

const recentApprovedAccounts = computed(() =>
  allAdminProfiles.value
    .filter((record) => normalizeStatusValue(record?.approval_status) === 'approved')
    .sort((left, right) => {
      const leftTime = Date.parse(left?.reviewed_at || left?.created_at || '') || 0
      const rightTime = Date.parse(right?.reviewed_at || right?.created_at || '') || 0
      return rightTime - leftTime
    })
    .slice(0, 5)
    .map((record) => ({
      id: String(record?.id || ''),
      accountId: formatApprovedAccountId(record?.public_id || record?.user?.public_id || record?.id),
      name: approvedAccountName(record),
      email: approvedAccountEmail(record),
      role: approvedAccountRole(record),
      status: approvedStatusLabel(record),
      approvedAt: String(record?.reviewed_at || record?.created_at || '').trim(),
      avatarUrl: normalizeStatusValue(record?.role) === 'employer'
        ? resolveBusinessAvatarUrl({ id: record?.id, email: approvedAccountEmail(record) })
        : applicantAvatarUrl(record),
    })),
)

const workspaceMemberOptions = computed(() => {
  const members = Object.values(businessWorkspaceUsers.value)
    .flatMap((entries) => (Array.isArray(entries) ? entries : []))
    .map((member) => ({
      value: String(member?.id || ''),
      label: String(member?.name || member?.email || 'Workspace Member').trim() || 'Workspace Member',
    }))
    .filter((entry) => entry.value)
    .sort((left, right) => left.label.localeCompare(right.label))

  return [
    { value: 'all', label: 'All Team Members' },
    ...members,
  ]
})

const selectedWorkspaceMemberLabel = computed(() =>
  workspaceMemberOptions.value.find((entry) => entry.value === selectedWorkspaceMemberId.value)?.label || 'All Team Members',
)

const latestWorkspaceActivityByUid = computed(() => {
  const activityByUid = new Map()

  activityLogs.value.forEach((entry) => {
    const actorUid = String(entry?.actor?.uid || '').trim()
    if (!actorUid || activityByUid.has(actorUid)) return
    activityByUid.set(actorUid, entry)
  })

  return activityByUid
})

const adminWorkspaceMembers = computed(() => {
  const employers = Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : []
  const employersById = new Map(
    employers.map((entry) => [
      String(entry?.id || '').trim(),
      entry,
    ]),
  )

  return Object.entries(businessWorkspaceUsers.value)
    .flatMap(([workspaceOwnerId, members]) => {
      const employer = employersById.get(String(workspaceOwnerId || '').trim()) || {}
      return (Array.isArray(members) ? members : []).map((member) => {
        const permissionRole = member?.permissionRoleName
          || member?.workspace_permission_role?.name
          || member?.workspace_permission_role?.label
          || member?.roleId
          || 'Workspace Member'
        const latestActivity = latestWorkspaceActivityByUid.value.get(String(member?.id || '').trim()) || null

        return {
          id: String(member?.id || '').trim(),
          accountId: formatApprovedAccountId(member?.public_id || member?.id),
          name: String(member?.name || member?.email || 'Workspace Member').trim() || 'Workspace Member',
          email: String(member?.email || '').trim(),
          role: String(permissionRole || 'Workspace Member').trim() || 'Workspace Member',
          businessName: String(
            employer?.company_name
            || employer?.name
            || member?.workspaceOwnerName
            || 'Business account',
          ).trim() || 'Business account',
          businessEmail: String(
            employer?.email
            || member?.workspaceOwnerEmail
            || '',
          ).trim(),
          status: member?.email_verified === true ? 'Verified' : 'Pending',
          latestActivityTitle: String(latestActivity?.actionLabel || latestActivity?.action || 'No activity yet').trim() || 'No activity yet',
          latestActivityDescription: String(latestActivity?.description || 'No recorded activity yet for this team member.').trim() || 'No recorded activity yet for this team member.',
          latestActivityTime: String(latestActivity?.createdAt || '').trim(),
        }
      })
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.latestActivityTime || '') || 0
      const rightTime = Date.parse(right.latestActivityTime || '') || 0
      if (leftTime !== rightTime) return rightTime - leftTime
      return left.name.localeCompare(right.name)
    })
})

const filteredAdminWorkspaceMembers = computed(() => {
  const query = String(workspaceMemberSearch.value || '').trim().toLowerCase()
  const memberFilter = String(selectedWorkspaceMemberId.value || 'all').trim()

  return adminWorkspaceMembers.value.filter((member) => {
    const matchesQuery = !query || [
      member.accountId,
      member.name,
      member.email,
      member.role,
      member.businessName,
      member.latestActivityTitle,
      member.latestActivityDescription,
    ]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(query))

    const matchesMember = memberFilter === 'all' || member.id === memberFilter
    return matchesQuery && matchesMember
  })
})

const workspaceMemberActivityLogs = computed(() => {
  const knownMembers = new Map(adminWorkspaceMembers.value.map((member) => [member.id, member]))
  const memberFilter = String(selectedWorkspaceMemberId.value || 'all').trim()
  const query = String(workspaceMemberSearch.value || '').trim().toLowerCase()

  return activityLogs.value
    .filter((entry) => {
      const actorUid = String(entry?.actor?.uid || '').trim()
      if (!actorUid || !knownMembers.has(actorUid)) return false
      if (memberFilter !== 'all' && actorUid !== memberFilter) return false

      const member = knownMembers.get(actorUid)
      const haystack = [
        entry?.actionLabel,
        entry?.action,
        entry?.description,
        entry?.targetType,
        entry?.targetName,
        member?.name,
        member?.role,
        member?.businessName,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ')

      return !query || haystack.includes(query)
    })
    .slice(0, 18)
    .map((entry) => {
      const member = knownMembers.get(String(entry?.actor?.uid || '').trim()) || null
      return {
        id: String(entry?.id || '').trim(),
        memberName: member?.name || String(entry?.actor?.name || entry?.actor?.email || 'Workspace Member').trim() || 'Workspace Member',
        role: member?.role || 'Workspace Member',
        businessName: member?.businessName || 'Business account',
        title: String(entry?.actionLabel || entry?.action || 'Activity').trim() || 'Activity',
        description: String(entry?.description || 'No activity description provided.').trim() || 'No activity description provided.',
        createdAt: String(entry?.createdAt || '').trim(),
        status: String(entry?.status || '').trim().toLowerCase() === 'error' ? 'danger' : 'notification',
      }
    })
})

const filteredRecentApprovedAccounts = computed(() => {
  const query = String(recentApprovedSearch.value || '').trim().toLowerCase()
  const roleFilter = String(recentApprovedRoleFilter.value || 'all').trim().toLowerCase()

  return recentApprovedAccounts.value.filter((account) => {
    const matchesQuery = !query || [
      account.accountId,
      account.name,
      account.email,
      account.role,
      account.status,
    ]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(query))

    const matchesRole = roleFilter === 'all' || account.role.toLowerCase() === roleFilter
    return matchesQuery && matchesRole
  })
})

const recentApprovedPanelLabel = computed(() => {
  const total = Number(dashboardMetrics.value.approvedCount) || 0
  const visible = recentApprovedAccounts.value.length

  if (visible >= total) return formatRecordCount(total)
  return `${formatRecordCount(visible)} of ${formatRecordCount(total)}`
})

const currentViewTitle = computed(() => {
  if (activeAdminView.value === 'logs') return 'Logs'
  if (activeAdminView.value === 'create-user') return 'Create User'
  if (activeAdminView.value === 'all-user') return 'All User'
  if (activeAdminView.value === 'applicant-list') return 'Applicant List'
  if (activeAdminView.value === 'employee-list') return 'Business List'
  if (activeAdminView.value === 'role-base-control-system') return 'RBAC'
  if (activeAdminView.value === 'history-delection-user') return 'Delete User History'
  if (activeAdminView.value === 'create-plan') return 'Create Plan'
  if (activeAdminView.value === 'preview-plan') return 'Preview Plan'
  if (activeAdminView.value === 'payment-history') return 'Payment History'
  if (activeAdminView.value === 'all-job-post') return 'All Job Posts'
  if (activeAdminView.value === 'test-job-post') return 'Test Job Posts'
  if (activeAdminView.value === 'applicant-storage') return 'Applicant Storage'
  if (activeAdminView.value === 'business-storage') return 'Business Storage'
  return 'Dashboard'
})

const currentViewParent = computed(() =>
  activeAdminView.value === 'logs'
    ? 'Workspace'
    : ['create-user', 'all-user', 'applicant-list', 'employee-list', 'role-base-control-system', 'history-delection-user'].includes(activeAdminView.value)
    ? 'User Management'
    : ['create-plan', 'preview-plan', 'payment-history'].includes(activeAdminView.value)
      ? 'Subscription Management'
      : ['all-job-post', 'test-job-post'].includes(activeAdminView.value)
        ? 'Job Management'
        : ['applicant-storage', 'business-storage'].includes(activeAdminView.value)
          ? 'Storage Management'
          : 'Dashboard',
)

const currentViewSubtitle = computed(() => {
  if (activeAdminView.value === 'logs') return 'Recent admin activity, payment, and account history logs'
  if (activeAdminView.value === 'create-user') return 'Create business or applicant accounts'
  if (activeAdminView.value === 'all-user') return 'Combined applicant and employer management view'
  if (activeAdminView.value === 'applicant-list') return 'Applicant management'
  if (activeAdminView.value === 'employee-list') return 'Business management'
  if (activeAdminView.value === 'role-base-control-system') return 'Role-Based Access Control'
  if (activeAdminView.value === 'history-delection-user') return 'Deleted users history and restore tools'
  if (activeAdminView.value === 'create-plan') return 'Build a subscription plan with live preview'
  if (activeAdminView.value === 'preview-plan') return 'Review all saved subscription cards'
  if (activeAdminView.value === 'payment-history') return 'Subscription payment history tools will appear here'
  if (activeAdminView.value === 'all-job-post') return 'Monitor all job posts created across business workspaces'
  if (activeAdminView.value === 'test-job-post') return 'Review test, sample, demo, and mock job posts'
  if (activeAdminView.value === 'applicant-storage') return 'Review applicant-uploaded files like face verification, PWD IDs, and resume storage'
  if (activeAdminView.value === 'business-storage') return 'Review business verification documents and storage coverage by account'
  return 'Admin navigation'
})

const selectedThemeOption = computed(() =>
  ADMIN_THEME_OPTIONS.find((option) => option.value === selectedAdminTheme.value) || ADMIN_THEME_OPTIONS[0],
)

const isDarkAdminMode = computed(() => settingsPreferences.value.darkMode === true)

const adminShellStyle = computed(() => {
  const theme = selectedThemeOption.value
  const paletteByTheme = {
    sage: {
      accentLight: '#2f6a49',
      accentDark: '#67d39f',
      accentSoftLight: 'rgba(47, 106, 73, 0.12)',
      accentSoftDark: 'rgba(103, 211, 159, 0.16)',
      accentBorderLight: 'rgba(47, 106, 73, 0.2)',
      accentBorderDark: 'rgba(103, 211, 159, 0.24)',
      shellGlowLight: 'radial-gradient(circle at top right, rgba(104, 173, 126, 0.16), transparent 32%)',
      shellGlowDark: 'radial-gradient(circle at top right, rgba(78, 192, 139, 0.18), transparent 34%)',
    },
    ocean: {
      accentLight: '#355aa8',
      accentDark: '#85b4ff',
      accentSoftLight: 'rgba(53, 90, 168, 0.12)',
      accentSoftDark: 'rgba(133, 180, 255, 0.18)',
      accentBorderLight: 'rgba(53, 90, 168, 0.2)',
      accentBorderDark: 'rgba(133, 180, 255, 0.26)',
      shellGlowLight: 'radial-gradient(circle at top right, rgba(109, 150, 230, 0.18), transparent 34%)',
      shellGlowDark: 'radial-gradient(circle at top right, rgba(108, 158, 255, 0.2), transparent 34%)',
    },
    sunrise: {
      accentLight: '#b86528',
      accentDark: '#f2be73',
      accentSoftLight: 'rgba(184, 101, 40, 0.12)',
      accentSoftDark: 'rgba(242, 190, 115, 0.18)',
      accentBorderLight: 'rgba(184, 101, 40, 0.22)',
      accentBorderDark: 'rgba(242, 190, 115, 0.28)',
      shellGlowLight: 'radial-gradient(circle at top right, rgba(233, 171, 82, 0.2), transparent 32%)',
      shellGlowDark: 'radial-gradient(circle at top right, rgba(255, 191, 94, 0.18), transparent 34%)',
    },
  }
  const palette = paletteByTheme[theme.value] || paletteByTheme.sage
  const isDarkMode = isDarkAdminMode.value
  const surfacePalette = isDarkMode
    ? {
        accent: palette.accentDark,
        accentSoft: palette.accentSoftDark,
        accentBorder: palette.accentBorderDark,
        shellGlow: palette.shellGlowDark,
        shellStart: '#08111b',
        shellMid: '#0b1320',
        shellEnd: '#111827',
        contentGlow: 'rgba(103, 211, 159, 0.12)',
        contentTop: 'rgba(9, 15, 27, 0.96)',
        contentBottom: 'rgba(4, 8, 18, 0.98)',
        surface: 'rgba(15, 23, 42, 0.92)',
        surfaceMuted: 'rgba(30, 41, 59, 0.86)',
        surfaceElevated: 'rgba(15, 23, 42, 0.9)',
        surfaceInset: 'rgba(248, 252, 249, 0.08)',
        hover: 'rgba(51, 65, 85, 0.48)',
        hoverStrong: 'rgba(30, 41, 59, 0.82)',
        overlay: 'rgba(2, 6, 23, 0.72)',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        border: 'rgba(148, 163, 184, 0.18)',
        borderStrong: 'rgba(148, 163, 184, 0.28)',
        shadowSoft: '0 20px 40px rgba(2, 6, 23, 0.42)',
        shadowStrong: '0 24px 56px rgba(2, 6, 23, 0.56)',
        inputBg: 'rgba(15, 23, 42, 0.9)',
        inputBorder: 'rgba(148, 163, 184, 0.22)',
        inputText: '#f8fafc',
        inputPlaceholder: '#94a3b8',
        icon: '#dbe4f0',
      }
    : {
        accent: palette.accentLight,
        accentSoft: palette.accentSoftLight,
        accentBorder: palette.accentBorderLight,
        shellGlow: palette.shellGlowLight,
        shellStart: '#eef8f2',
        shellMid: '#f8fcf9',
        shellEnd: '#ffffff',
        contentGlow: 'rgba(46, 154, 104, 0.08)',
        contentTop: 'rgba(248, 252, 249, 0.92)',
        contentBottom: 'rgba(255, 255, 255, 0.96)',
        surface: '#ffffff',
        surfaceMuted: '#f8fafc',
        surfaceElevated: 'rgba(255, 255, 255, 0.94)',
        surfaceInset: 'rgba(248, 252, 249, 0.7)',
        hover: 'rgba(241, 245, 249, 0.96)',
        hoverStrong: 'rgba(240, 247, 243, 0.95)',
        overlay: 'rgba(15, 23, 42, 0.24)',
        textPrimary: '#172033',
        textSecondary: '#64748b',
        textMuted: '#8a93a5',
        border: 'rgba(223, 227, 234, 0.96)',
        borderStrong: 'rgba(213, 226, 219, 0.92)',
        shadowSoft: '0 20px 40px rgba(15, 23, 42, 0.16)',
        shadowStrong: '0 24px 56px rgba(15, 23, 42, 0.18)',
        inputBg: '#ffffff',
        inputBorder: 'rgba(223, 227, 234, 0.96)',
        inputText: '#172033',
        inputPlaceholder: '#8a93a5',
        icon: '#677188',
      }

  return {
    '--admin-theme-accent': surfacePalette.accent,
    '--admin-theme-accent-soft': surfacePalette.accentSoft,
    '--admin-theme-accent-border': surfacePalette.accentBorder,
    '--admin-theme-shell-glow': surfacePalette.shellGlow,
    '--admin-bg-shell-start': surfacePalette.shellStart,
    '--admin-bg-shell-mid': surfacePalette.shellMid,
    '--admin-bg-shell-end': surfacePalette.shellEnd,
    '--admin-bg-content-glow': surfacePalette.contentGlow,
    '--admin-bg-content-top': surfacePalette.contentTop,
    '--admin-bg-content-bottom': surfacePalette.contentBottom,
    '--admin-bg-surface': surfacePalette.surface,
    '--admin-bg-surface-muted': surfacePalette.surfaceMuted,
    '--admin-bg-surface-elevated': surfacePalette.surfaceElevated,
    '--admin-bg-surface-inset': surfacePalette.surfaceInset,
    '--admin-bg-hover': surfacePalette.hover,
    '--admin-bg-hover-strong': surfacePalette.hoverStrong,
    '--admin-bg-overlay': surfacePalette.overlay,
    '--admin-text-primary': surfacePalette.textPrimary,
    '--admin-text-secondary': surfacePalette.textSecondary,
    '--admin-text-muted': surfacePalette.textMuted,
    '--admin-border-color': surfacePalette.border,
    '--admin-border-strong': surfacePalette.borderStrong,
    '--admin-shadow-soft': surfacePalette.shadowSoft,
    '--admin-shadow-strong': surfacePalette.shadowStrong,
    '--admin-input-bg': surfacePalette.inputBg,
    '--admin-input-border': surfacePalette.inputBorder,
    '--admin-input-text': surfacePalette.inputText,
    '--admin-input-placeholder': surfacePalette.inputPlaceholder,
    '--admin-icon-color': surfacePalette.icon,
    '--admin-density-gap': settingsPreferences.value.compactCards ? '0.7rem' : '1rem',
    '--admin-density-page-padding': settingsPreferences.value.compactCards ? '1rem 1.15rem 0.85rem' : '1.25rem 1.5rem 1rem',
    '--admin-density-panel-padding': settingsPreferences.value.compactCards ? '0.9rem' : '1.08rem',
    '--admin-density-card-padding': settingsPreferences.value.compactCards ? '0.68rem 0.76rem' : '0.8rem 0.88rem',
    '--admin-density-card-min-height': settingsPreferences.value.compactCards ? '5.75rem' : '6.35rem',
    '--admin-density-grid-gap': settingsPreferences.value.compactCards ? '0.56rem' : '0.72rem',
    '--admin-motion-duration': settingsPreferences.value.reduceMotion ? '0.01ms' : '0.24s',
    '--admin-motion-duration-fast': settingsPreferences.value.reduceMotion ? '0.01ms' : '0.18s',
    '--admin-motion-duration-slow': settingsPreferences.value.reduceMotion ? '0.01ms' : '0.32s',
    '--admin-motion-duration-xl': settingsPreferences.value.reduceMotion ? '0.01ms' : '0.72s',
  }
})

watch(
  adminShellStyle,
  (nextStyle) => {
    syncAdminDocumentTheme(nextStyle)
  },
  { immediate: true },
)

const unreadNotificationCount = computed(() =>
  adminNotifications.value.filter((notification) => notification.read !== true).length,
)

const recentAdminNotifications = computed(() =>
  adminNotifications.value.slice(0, 6),
)

const formatNotificationBadge = (value) => {
  const count = Number(value) || 0
  return count > 99 ? '99+' : String(count)
}

const recentApplicantIds = computed(() =>
  normalizeIdList(
    (Array.isArray(adminProfiles.value.applicants) ? adminProfiles.value.applicants : [])
      .filter((record) => isRecentRecordDate(record?.created_at || record?.createdAt || record?.submitted_at))
      .map((record) => record?.id),
  ),
)

const recentEmployerIds = computed(() =>
  normalizeIdList(
    (Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : [])
      .filter((record) => isRecentRecordDate(record?.created_at || record?.createdAt || record?.submitted_at))
      .map((record) => record?.id),
  ),
)

const recentAdminUserKeys = computed(() => [
  ...recentApplicantIds.value.map((id) => `applicant:${id}`),
  ...recentEmployerIds.value.map((id) => `employer:${id}`),
])

const recentAdminJobIds = computed(() =>
  normalizeIdList(
    (Array.isArray(adminJobPosts.value) ? adminJobPosts.value : [])
      .filter((record) => isRecentRecordDate(record?.createdAt || record?.created_at || record?.updatedAt || record?.updated_at))
      .map((record) => record?.id),
  ),
)

const applicantListSidebarCount = computed(() => {
  if (activeAdminView.value === 'applicant-list') return 0

  const seenIds = new Set(seenApplicantIds.value)
  return (Array.isArray(adminProfiles.value.applicants) ? adminProfiles.value.applicants : [])
    .filter((record) => {
      const applicantId = String(record?.id || '').trim()
      return applicantId
        && normalizeStatusValue(record?.approval_status) === 'pending'
        && !seenIds.has(applicantId)
    })
    .length
})

const businessListSidebarCount = computed(() => {
  if (['employee-list', 'all-user'].includes(activeAdminView.value)) return 0
  const seenIds = new Set(seenEmployerIds.value)
  return (Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : [])
    .filter((record) => {
      const employerId = String(record?.id || '').trim()
      return employerId && !seenIds.has(employerId)
    })
    .length
})

const paymentHistorySidebarCount = computed(() => {
  if (activeAdminView.value === 'payment-history') return 0
  const seenIds = new Set(seenPaymentEntryIds.value)
  return adminPaymentHistory.value
    .filter((entry) => {
      const entryId = String(entry?.id || '').trim()
      return entryId && !seenIds.has(entryId)
    })
    .length
})

const allJobPostSidebarCount = computed(() => {
  if (['all-job-post', 'test-job-post'].includes(activeAdminView.value)) return 0
  const seenIds = new Set(seenJobPostIds.value)
  return (Array.isArray(adminJobPosts.value) ? adminJobPosts.value : [])
    .filter((entry) => {
      const jobId = String(entry?.id || '').trim()
      return jobId && !seenIds.has(jobId)
    })
    .length
})

const adminLogsSidebarCount = computed(() => {
  if (activeAdminView.value === 'logs') return 0
  const seenIds = new Set(seenActivityLogIds.value)
  return (Array.isArray(activityLogs.value) ? activityLogs.value : [])
    .filter((entry) => {
      const logId = String(entry?.id || '').trim()
      return logId && !seenIds.has(logId)
    })
    .length
})

const applicantListSidebarBadge = computed(() =>
  applicantListSidebarCount.value > 0 ? formatNotificationBadge(applicantListSidebarCount.value) : '',
)

const businessListSidebarBadge = computed(() =>
  businessListSidebarCount.value > 0 ? formatNotificationBadge(businessListSidebarCount.value) : '',
)

const userManagementSidebarBadge = computed(() => {
  const total = applicantListSidebarCount.value + businessListSidebarCount.value
  return total > 0 ? formatNotificationBadge(total) : ''
})

const subscriptionManagementSidebarBadge = computed(() =>
  paymentHistorySidebarCount.value > 0
    ? formatNotificationBadge(paymentHistorySidebarCount.value)
    : '',
)

const jobManagementSidebarBadge = computed(() =>
  allJobPostSidebarCount.value > 0 ? formatNotificationBadge(allJobPostSidebarCount.value) : '',
)

const adminLogsSidebarBadge = computed(() =>
  adminLogsSidebarCount.value > 0 ? formatNotificationBadge(adminLogsSidebarCount.value) : '',
)

const primaryItems = computed(() => primaryItemDefinitions.map((item) => ({ ...item })))

const userManagementItems = computed(() =>
  userManagementItemDefinitions.map((item) => ({
    ...item,
    badge: item.key === 'applicant-list'
      ? applicantListSidebarBadge.value
      : item.key === 'employee-list'
        ? businessListSidebarBadge.value
        : '',
  })),
)

const paymentManagementItems = computed(() =>
  paymentManagementItemDefinitions.map((item) => ({
    ...item,
    badge: item.key === 'payment-history' ? subscriptionManagementSidebarBadge.value : '',
  })),
)

const jobManagementItems = computed(() =>
  jobManagementItemDefinitions.map((item) => ({
    ...item,
    badge: item.key === 'all-job-post' ? jobManagementSidebarBadge.value : '',
  })),
)

const storageManagementItems = computed(() =>
  storageManagementItemDefinitions.map((item) => ({ ...item })),
)

const secondaryItems = computed(() =>
  secondaryItemDefinitions.map((item) => ({
    ...item,
    badge: item.key === 'logs' ? adminLogsSidebarBadge.value : item.badge || '',
  })),
)

const topLinks = computed(() => [
  { label: 'Inbox', icon: 'bi bi-inbox', badge: '12' },
  {
    label: 'Notifications',
    icon: 'bi bi-bell',
    badge: unreadNotificationCount.value > 0 ? formatNotificationBadge(unreadNotificationCount.value) : '',
  },
])

const formatRecentApprovedDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently approved'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const PAYMENT_RECEIPT_CODE_PATTERN = /^#(?:TP|P)[A-HJ-NP-Z2-9]{8}$/i

const normalizePaymentReceiptCode = (value) => {
  const normalized = String(value || '').trim()
  return PAYMENT_RECEIPT_CODE_PATTERN.test(normalized) ? normalized.toUpperCase() : ''
}

const resolvePaymentReceiptLabel = (entry) => {
  const normalizedReceiptCode = normalizePaymentReceiptCode(entry?.receiptCode) || normalizePaymentReceiptCode(entry?.id)
  if (normalizedReceiptCode) return normalizedReceiptCode

  const rawReceiptCode = String(entry?.receiptCode || '').trim()
  if (rawReceiptCode) return rawReceiptCode

  const rawId = String(entry?.id || '').trim()
  if (rawId && !rawId.startsWith('payment-')) return rawId

  return 'Receipt Unavailable'
}

const inferPaymentHistoryStatus = (entry) => {
  const normalizedStatus = String(entry?.status || '').trim()
  const normalizedStatusKey = normalizeStatusValue(normalizedStatus)
  if (normalizedStatus && normalizedStatusKey !== 'pending') return normalizedStatus

  const normalizedPlan = String(entry?.plan || '').trim().toLowerCase()
  const normalizedBillingNote = String(entry?.billingNote || '').trim().toLowerCase()
  const normalizedAmount = String(entry?.amount || '').trim().toLowerCase()
  const hasReceiptCode = Boolean(
    normalizePaymentReceiptCode(entry?.receiptCode)
    || normalizePaymentReceiptCode(entry?.id),
  )

  if (
    normalizedPlan.includes('trial')
    || normalizedBillingNote.includes('trial')
    || normalizedBillingNote.includes('automatic billing starts')
    || normalizedAmount === 'php 0.00'
    || normalizedAmount === '0'
    || normalizedAmount === '0.00'
  ) {
    return 'Trial Active'
  }

  if (
    normalizedBillingNote.includes('payment completed')
    || normalizedBillingNote.includes('payment received')
    || normalizedBillingNote.includes('subscription payment completed')
    || hasReceiptCode
  ) {
    return 'Completed'
  }

  return normalizedStatus || 'Pending'
}

const normalizeAdminPaymentHistoryEntry = (entry, index = 0) => {
  const receiptCode = normalizePaymentReceiptCode(entry?.receiptCode) || normalizePaymentReceiptCode(entry?.id)
  const id = String(entry?.id || receiptCode || `payment-${Date.now()}-${index}`).trim()

  return {
    ...entry,
    id,
    buyer: String(entry?.buyer || entry?.ownerName || 'Business Account').trim() || 'Business Account',
    buyerEmail: String(entry?.buyerEmail || entry?.ownerEmail || 'No email').trim() || 'No email',
    role: String(entry?.role || 'business').trim() || 'business',
    plan: String(entry?.plan || 'Subscription').trim() || 'Subscription',
    amount: String(entry?.amount || '0').trim() || '0',
    method: String(entry?.method || 'Unknown').trim() || 'Unknown',
    status: inferPaymentHistoryStatus(entry),
    date: String(entry?.date || '').trim(),
    time: String(entry?.time || '').trim(),
    receiptCode,
    billingNote: String(entry?.billingNote || '').trim(),
    avatarUrl: resolveBusinessAvatarUrl({
      id: entry?.workspaceOwnerId || entry?.workspace_owner_id || entry?.buyerId || entry?.ownerId,
      email: entry?.buyerEmail || entry?.ownerEmail,
    }),
  }
}

const formatPaymentHistoryDateTime = (entry) => {
  const rawValue = `${entry?.date || ''} ${entry?.time || ''}`.trim()
  if (!rawValue) return 'No date'
  return rawValue
}

const buildAdminPaymentReceiptHtml = (entry) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Receipt ${resolvePaymentReceiptLabel(entry)}</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #f6fbf7;
        color: #173927;
      }
      .receipt-card {
        width: min(100%, 520px);
        margin: 0 auto;
        padding: 28px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid #d8e6dd;
        box-shadow: 0 22px 48px rgba(23, 57, 39, 0.12);
      }
      h1 {
        margin: 0 0 6px;
        font-size: 28px;
      }
      p {
        margin: 0 0 20px;
        color: #607167;
      }
      .receipt-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid #edf3ef;
      }
      .receipt-row:last-child {
        border-bottom: 0;
      }
      .receipt-row span {
        color: #607167;
      }
      .receipt-row strong {
        color: #173927;
        text-align: right;
      }
      .receipt-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 24px;
      }
      .receipt-actions button {
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid #cfe6d7;
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff 0%, #eef8f2 100%);
        color: #1f6f46;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="receipt-card">
      <h1>Payment Receipt</h1>
      <p>Subscription transaction details</p>
      <div class="receipt-row"><span>Receipt</span><strong>${resolvePaymentReceiptLabel(entry)}</strong></div>
      <div class="receipt-row"><span>Business</span><strong>${entry.buyer}</strong></div>
      <div class="receipt-row"><span>Email</span><strong>${entry.buyerEmail}</strong></div>
      <div class="receipt-row"><span>Plan</span><strong>${entry.plan}</strong></div>
      <div class="receipt-row"><span>Amount</span><strong>${entry.amount}</strong></div>
      <div class="receipt-row"><span>Method</span><strong>${entry.method}</strong></div>
      <div class="receipt-row"><span>Status</span><strong>${entry.status}</strong></div>
      ${entry.billingNote ? `<div class="receipt-row"><span>Billing</span><strong>${entry.billingNote}</strong></div>` : ''}
      <div class="receipt-row"><span>Date</span><strong>${formatPaymentHistoryDateTime(entry)}</strong></div>
      <div class="receipt-actions">
        <button type="button" onclick="window.print()">Print Receipt</button>
      </div>
    </div>
  </body>
</html>`

const printAdminPaymentReceipt = (entry) => {
  if (typeof window === 'undefined') return

  const receiptWindow = window.open('', '_blank', 'noopener=false,noreferrer=false')
  if (!receiptWindow) return

  receiptWindow.document.open()
  receiptWindow.document.write(buildAdminPaymentReceiptHtml(entry))
  receiptWindow.document.close()
}

const syncAdminPaymentHistoryState = () => {
  const storedEntries = readLocalJson(ADMIN_PAYMENT_HISTORY_STORAGE_KEY, [])
  adminPaymentHistory.value = Array.isArray(storedEntries)
    ? storedEntries
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry, index) => normalizeAdminPaymentHistoryEntry(entry, index))
    : []

  if (Array.isArray(storedEntries)) {
    const serializedStoredEntries = JSON.stringify(storedEntries)
    const serializedNormalizedEntries = JSON.stringify(adminPaymentHistory.value)
    if (serializedStoredEntries !== serializedNormalizedEntries) {
      writeLocalJson(ADMIN_PAYMENT_HISTORY_STORAGE_KEY, adminPaymentHistory.value)
    }
  }
}

const startAdminPaymentHistorySync = async () => {
  stopBusinessPaymentHistory()
  syncAdminPaymentHistoryState()

  const localEntries = readLocalJson(ADMIN_PAYMENT_HISTORY_STORAGE_KEY, [])
  if (Array.isArray(localEntries) && localEntries.length) {
    try {
      await migrateBusinessPaymentHistoryEntries(localEntries)
    } catch {
      // Keep the local admin history visible if Firestore migration fails.
    }
  }

  stopBusinessPaymentHistory = subscribeToAllBusinessPaymentHistory(
    (entries) => {
      adminPaymentHistory.value = Array.isArray(entries)
        ? entries.map((entry, index) => normalizeAdminPaymentHistoryEntry(entry, index))
        : []
      writeLocalJson(ADMIN_PAYMENT_HISTORY_STORAGE_KEY, adminPaymentHistory.value)
    },
    () => {
      syncAdminPaymentHistoryState()
    },
  )
}

const filteredPaymentHistoryEntries = computed(() => {
  const query = String(paymentHistorySearch.value || '').trim().toLowerCase()
  const statusFilter = String(paymentHistoryStatusFilter.value || 'all').trim().toLowerCase()

  return adminPaymentHistory.value.filter((entry) => {
    const matchesQuery = !query || [
      entry.id,
      entry.receiptCode,
      entry.buyer,
      entry.buyerEmail,
      entry.plan,
      entry.method,
      entry.amount,
    ]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(query))

    const matchesStatus = statusFilter === 'all' || normalizeStatusValue(entry.status) === statusFilter
    return matchesQuery && matchesStatus
  })
})

const formatAdminActivityLabel = (value, fallback = 'Activity') =>
  String(value || '')
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()) || fallback

const formatAdminActivityStatusLabel = (value) => {
  const normalized = String(value || 'success').trim().toLowerCase()
  if (normalized === 'error') return 'Error'
  if (normalized === 'warning') return 'Warning'
  if (normalized === 'pending') return 'Pending'
  return formatAdminActivityLabel(normalized || 'success', 'Success')
}

const formatAdminActivityDateTime = (value) => {
  const parsed = parseRecordDate(value)
  if (!parsed) return 'No timestamp'

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatAdminActivityRelativeTime = (value) => {
  const parsed = parseRecordDate(value)
  if (!parsed) return 'No timestamp'

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 60 * 1000) return 'Just now'
  if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)))
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  if (diffMs < 30 * 24 * 60 * 60 * 1000) {
    const weeks = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)))
    return `${weeks} wk${weeks === 1 ? '' : 's'} ago`
  }
  if (diffMs < 365 * 24 * 60 * 60 * 1000) {
    const months = Math.max(1, Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000)))
    return `${months} mo${months === 1 ? '' : 's'} ago`
  }

  const years = Math.max(1, Math.floor(diffMs / (365 * 24 * 60 * 60 * 1000)))
  return `${years} yr${years === 1 ? '' : 's'} ago`
}

const formatAdminActivityMetadataValue = (value) => {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  const normalized = String(value || '').trim()
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized
}

const buildAdminActivityMetadataSummary = (metadata = {}) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return ''

  return Object.entries(metadata)
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && String(value).trim() !== ''
    })
    .slice(0, 3)
    .map(([key, value]) => `${formatAdminActivityLabel(key, 'Detail')}: ${formatAdminActivityMetadataValue(value)}`)
    .join(' • ')
}

const buildAdminActivityActorLabel = (entry = {}) => {
  const actorName = String(entry?.actor?.name || entry?.actor?.email || entry?.actor?.uid || '').trim()
  const actorRole = formatAdminActivityLabel(entry?.actor?.role, '')
  if (!actorName) return 'System'
  return actorRole ? `${actorName} (${actorRole})` : actorName
}

const buildAdminActivityTargetLabel = (entry = {}) => {
  const targetBase = String(entry?.targetName || entry?.targetEmail || entry?.targetId || '').trim()
  const targetType = formatAdminActivityLabel(entry?.targetType, 'System')

  if (targetBase && targetType) return `${targetBase} (${targetType})`
  return targetBase || targetType
}

const adminActivityLogs = computed(() => {
  return activityLogs.value
    .map((entry) => {
      const actionKey = String(entry?.action || '').trim()
      const meta = formatAdminActivityLabel(entry?.targetType || entry?.actionLabel || 'Activity')
      const loweredActionKey = actionKey.toLowerCase()
      const loweredMeta = meta.toLowerCase()
      const tone = String(entry?.status || '').toLowerCase() === 'error'
        ? 'danger'
        : loweredActionKey.includes('delete') || loweredMeta.includes('deleted')
          ? 'danger'
          : loweredActionKey.includes('plan') || loweredActionKey.includes('payment') || loweredMeta.includes('plan') || loweredMeta.includes('subscription')
          ? 'payment'
          : 'notification'

      return {
        id: entry.id,
        title: String(entry.actionLabel || 'System activity').trim() || 'System activity',
        description: String(entry.description || 'No activity description provided.').trim() || 'No activity description provided.',
        meta: meta || 'Activity',
        actorLabel: buildAdminActivityActorLabel(entry),
        targetLabel: buildAdminActivityTargetLabel(entry),
        sourceLabel: formatAdminActivityLabel(entry.source || 'frontend', 'Frontend'),
        statusLabel: formatAdminActivityStatusLabel(entry.status),
        eventLabel: actionKey || 'system.activity',
        metadataSummary: buildAdminActivityMetadataSummary(entry.metadata),
        createdAt: entry.createdAt,
        createdAtLabel: formatAdminActivityDateTime(entry.createdAt),
        createdAtRelative: formatAdminActivityRelativeTime(entry.createdAt),
        tone,
      }
    })
    .slice(0, 40)
})

const profileName = computed(() => {
  const user = currentUser.value || {}
  return String(user.name || user.company_name || 'Admin User').trim() || 'Admin User'
})

const profileEmail = computed(() => {
  const user = currentUser.value || {}
  return String(user.email || 'admin@gmail.com').trim() || 'admin@gmail.com'
})

const profileInitials = computed(() =>
  profileName.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'BS',
)

const closeProfileMenu = () => {
  profileMenuOpen.value = false
}

const closeNotificationMenu = () => {
  notificationMenuOpen.value = false
}

const closeSettingsModal = () => {
  settingsModalOpen.value = false
}

const getAdminMessageRecipientRoleLabel = (recipient = {}) => {
  const normalizedRole = String(recipient?.role || '').trim().toLowerCase()
  if (normalizedRole === 'applicant') return 'Applicant'
  if (normalizedRole === 'employer') return 'Business'
  return 'User'
}

const resetAdminMessageComposer = () => {
  selectedAdminMessageRecipient.value = null
  adminDirectMessageForm.value = {
    title: '',
    message: '',
  }
}

const closeAdminMessageModal = () => {
  if (isAdminMessageSubmitting.value) return
  adminMessageModalOpen.value = false
  resetAdminMessageComposer()
}

const openAdminMessageModal = (recipient = {}) => {
  const normalizedRecipient = recipient && typeof recipient === 'object' ? recipient : {}
  const recipientId = String(normalizedRecipient?.id || '').trim()
  const recipientName = String(normalizedRecipient?.name || '').trim()

  if (!recipientId || !recipientName) {
    showAdminToast('That account could not be opened for messaging.', 'error')
    return
  }

  selectedAdminMessageRecipient.value = normalizedRecipient
  adminDirectMessageForm.value = {
    title: `Message for ${recipientName}`,
    message: '',
  }
  adminMessageModalOpen.value = true
}

const submitAdminDirectMessage = async () => {
  const recipient = selectedAdminMessageRecipient.value || {}
  const recipientId = String(recipient?.id || '').trim()
  const recipientName = String(recipient?.name || '').trim() || 'the selected user'
  const messageTitle = String(adminDirectMessageForm.value.title || '').trim().slice(0, ADMIN_DIRECT_MESSAGE_TITLE_LIMIT)
  const messageBody = String(adminDirectMessageForm.value.message || '').trim().slice(0, ADMIN_DIRECT_MESSAGE_BODY_LIMIT)

  if (!recipientId) {
    showAdminToast('That account is missing a valid ID.', 'error')
    return
  }

  if (!messageBody) {
    showAdminToast('Write a message before sending.', 'error')
    return
  }

  isAdminMessageSubmitting.value = true

  try {
    await sendAdminDirectMessage(recipient, {
      title: messageTitle || 'Admin message',
      message: messageBody,
      tone: 'accent',
      senderName: profileName.value,
      senderEmail: profileEmail.value,
      senderRole: String(currentUser.value?.role || 'admin').trim() || 'admin',
    })

    await recordSystemActivity({
      action: 'account.admin.message',
      actionLabel: 'Admin message sent',
      description: `${profileName.value} sent a direct message to ${recipientName}.`,
      targetType: String(recipient?.role || 'user').trim() || 'user',
      targetId: recipientId,
      targetName: recipientName,
      targetEmail: String(recipient?.email || '').trim(),
      metadata: {
        title: messageTitle || 'Admin message',
        delivery: 'firebase-profile-notification',
      },
    }, currentUser.value)

    showAdminToast(`Message sent to ${recipientName}.`, 'success')
    adminMessageModalOpen.value = false
    resetAdminMessageComposer()
  } catch (error) {
    showAdminToast(error instanceof Error ? error.message : 'The message could not be sent right now.', 'error')
  } finally {
    isAdminMessageSubmitting.value = false
  }
}

const clearAdminToastTimer = () => {
  if (typeof window === 'undefined' || !notificationToastTimer) return
  window.clearTimeout(notificationToastTimer)
  notificationToastTimer = 0
}

const dismissAdminToast = () => {
  clearAdminToastTimer()
  adminToast.value = null
}

const stopAllWorkspaceUserSubscriptions = () => {
  workspaceUserDirectoryStops.forEach((stop) => {
    if (typeof stop === 'function') stop()
  })
  workspaceUserDirectoryStops.clear()
}

const syncWorkspaceUserSubscriptions = () => {
  const employers = Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : []
  const nextEmployerIds = new Set(
    employers
      .map((entry) => String(entry?.id || '').trim())
      .filter(Boolean),
  )

  workspaceUserDirectoryStops.forEach((stop, employerId) => {
    if (nextEmployerIds.has(employerId)) return
    if (typeof stop === 'function') stop()
    workspaceUserDirectoryStops.delete(employerId)

    const nextUsers = { ...businessWorkspaceUsers.value }
    delete nextUsers[employerId]
    businessWorkspaceUsers.value = nextUsers
  })

  employers.forEach((employer) => {
    const employerId = String(employer?.id || '').trim()
    if (!employerId || workspaceUserDirectoryStops.has(employerId)) return

    const stop = subscribeToBusinessWorkspaceUsers(
      employerId,
      (workspaceUsers) => {
        businessWorkspaceUsers.value = {
          ...businessWorkspaceUsers.value,
          [employerId]: Array.isArray(workspaceUsers) ? workspaceUsers : [],
        }
      },
      (error) => {
        console.error(`Admin workspace user sync failed for employer ${employerId}`, error)
      },
    )

    workspaceUserDirectoryStops.set(employerId, stop)
  })
}

const getAdminToastIconClass = () => {
  const title = String(adminToast.value?.title || '').trim().toLowerCase()
  const kind = String(adminToast.value?.kind || '').trim().toLowerCase()

  if (title.includes('missing') || title.includes('required')) return 'bi bi-question-circle-fill'
  if (kind === 'error') return 'bi bi-exclamation-circle-fill'
  if (kind === 'success') return 'bi bi-check-circle-fill'
  return ''
}

const handleAdminToastAction = () => {
  const action = String(adminToast.value?.action || '').trim()

  if (action === 'preview-plan') {
    dismissAdminToast()
    setAdminView('preview-plan')
    return
  }

  dismissAdminToast()
}

const showAdminToast = (message, kind = 'info', title = '') => {
  clearAdminToastTimer()
  adminToast.value = {
    title: String(title || '').trim() || (kind === 'error' ? 'Unable to send' : kind === 'success' ? 'Message sent' : 'Notice'),
    kind,
    message: String(message || '').trim(),
  }

  if (typeof window !== 'undefined') {
    notificationToastTimer = window.setTimeout(() => {
      adminToast.value = null
      notificationToastTimer = 0
    }, kind === 'error' ? 4200 : 3000)
  }
}

const startInitialAdminLoader = () => {
  isInitialAdminLoading.value = true
}

const finishInitialAdminLoader = () => {
  isInitialAdminLoading.value = false
}

const handlePlanStatusUpdated = (payload) => {
  const message = String(payload?.message || '').trim()
  if (!message) return
  showAdminToast(message, payload?.kind === 'error' ? 'error' : 'success')
}

const toggleProfileMenu = () => {
  closeNotificationMenu()
  profileMenuOpen.value = !profileMenuOpen.value
}

const persistSidebarDropdownState = () => {
  writeLocalJson(ADMIN_SIDEBAR_DROPDOWNS_STORAGE_KEY, {
    userManagementOpen: userManagementOpen.value === true,
    paymentManagementOpen: paymentManagementOpen.value === true,
    jobManagementOpen: jobManagementOpen.value === true,
    storageManagementOpen: storageManagementOpen.value === true,
  })
}

const hydrateSidebarDropdownState = () => {
  const storedState = readLocalJson(ADMIN_SIDEBAR_DROPDOWNS_STORAGE_KEY, null)
  userManagementOpen.value = storedState?.userManagementOpen === true
  paymentManagementOpen.value = storedState?.paymentManagementOpen === true
  jobManagementOpen.value = storedState?.jobManagementOpen === true
  storageManagementOpen.value = storedState?.storageManagementOpen === true
}

const toggleUserManagement = () => {
  userManagementOpen.value = !userManagementOpen.value
  persistSidebarDropdownState()
}

const togglePaymentManagement = () => {
  paymentManagementOpen.value = !paymentManagementOpen.value
  persistSidebarDropdownState()
}

const toggleJobManagement = () => {
  jobManagementOpen.value = !jobManagementOpen.value
  persistSidebarDropdownState()
}

const toggleStorageManagement = () => {
  storageManagementOpen.value = !storageManagementOpen.value
  persistSidebarDropdownState()
}

const setAdminView = (viewKey) => {
  if (viewKey === 'inactive-status' || viewKey === 'active-list') {
    viewKey = 'all-user'
  }

  if (!viewKey || activeAdminView.value === viewKey) return

  activeAdminView.value = viewKey
  if (viewKey === 'applicant-list') {
    syncApplicantListSeenState()
    return
  }

  if (['employee-list', 'all-user'].includes(viewKey)) {
    syncEmployerListSeenState()
    return
  }

  if (viewKey === 'payment-history') {
    syncPaymentHistorySeenState()
    return
  }

  if (['all-job-post', 'test-job-post'].includes(viewKey)) {
    syncAdminJobSeenState()
    return
  }

  if (viewKey === 'logs') {
    syncAdminActivityLogSeenState()
  }
}

watch(activeAdminView, (nextView) => {
  if (nextView === 'inactive-status' || nextView === 'active-list') {
    activeAdminView.value = 'all-user'
    return
  }
}, { immediate: true })

const handleAdminManagedAccountCreated = (payload) => {
  const message = String(payload?.message || '').trim()
  const nextView = String(payload?.accountType || '').trim().toLowerCase() === 'business'
    ? 'employee-list'
    : 'applicant-list'

  if (message) {
    showAdminToast(
      message,
      payload?.kind === 'error' ? 'error' : 'success',
      String(payload?.title || '').trim() || 'User Created',
    )
  }

  setAdminView(nextView)
}

const handleAdminManagedAccountToast = (payload) => {
  const message = String(payload?.message || '').trim()
  if (!message) return

  showAdminToast(
    message,
    payload?.kind === 'error' ? 'error' : payload?.kind === 'success' ? 'success' : 'info',
    String(payload?.title || '').trim(),
  )
}

const handleAllUserOpen = (payload) => {
  const normalizedRole = String(payload?.role || '').trim().toLowerCase()
  setAdminView(normalizedRole === 'applicant' ? 'applicant-list' : 'employee-list')
}

const handleAdminPlanSaved = (payload) => {
  const message = String(payload?.message || '').trim()
  const title = String(payload?.title || '').trim()
  const kind = payload?.kind === 'error' ? 'error' : 'success'

  if (title || message) {
    clearAdminToastTimer()
    adminToast.value = {
      title: title || (kind === 'error' ? 'Save Failed' : 'Plan Saved'),
      message: message || (kind === 'error' ? 'Could not save plan.' : 'Plan saved successfully. Check Preview Plan.'),
      kind,
      action: kind === 'error' ? '' : 'preview-plan',
    }

    if (typeof window !== 'undefined') {
      notificationToastTimer = window.setTimeout(() => {
        adminToast.value = null
        notificationToastTimer = 0
      }, kind === 'error' ? 4200 : 3600)
    }
  }
}

const readLocalJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const writeLocalJson = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function syncAdminDocumentTheme(styleMap = {}) {
  if (typeof document === 'undefined') return

  const body = document.body
  if (!body) return

  body.dataset.adminColorMode = isDarkAdminMode.value ? 'dark' : 'light'
  body.style.colorScheme = isDarkAdminMode.value ? 'dark' : 'light'

  ADMIN_DOCUMENT_THEME_VARIABLE_KEYS.forEach((key) => {
    const value = styleMap?.[key]
    if (typeof value === 'string' && value.trim()) {
      body.style.setProperty(key, value)
      return
    }

    body.style.removeProperty(key)
  })
}

function clearAdminDocumentTheme() {
  if (typeof document === 'undefined') return

  const body = document.body
  if (!body) return

  delete body.dataset.adminColorMode
  body.style.removeProperty('color-scheme')

  ADMIN_DOCUMENT_THEME_VARIABLE_KEYS.forEach((key) => {
    body.style.removeProperty(key)
  })
}

const persistAdminSettings = () => {
  writeLocalJson(ADMIN_SETTINGS_STORAGE_KEY, {
    theme: selectedAdminTheme.value,
    preferences: {
      compactCards: settingsPreferences.value.compactCards === true,
      reduceMotion: settingsPreferences.value.reduceMotion === true,
      darkMode: settingsPreferences.value.darkMode === true,
    },
  })
}

const hydrateAdminSettings = () => {
  const storedSettings = readLocalJson(ADMIN_SETTINGS_STORAGE_KEY, null)
  const theme = String(storedSettings?.theme || '').trim().toLowerCase()
  if (ADMIN_THEME_OPTIONS.some((option) => option.value === theme)) {
    selectedAdminTheme.value = theme
  }

  settingsPreferences.value = {
    compactCards: storedSettings?.preferences?.compactCards === true,
    reduceMotion: storedSettings?.preferences?.reduceMotion === true,
    darkMode: storedSettings?.preferences?.darkMode === true,
  }
}

const openSettingsModal = (panel = 'preferences') => {
  settingsActivePanel.value = panel === 'themes' ? 'themes' : 'preferences'
  settingsModalOpen.value = true
}

const handleProfileMenuAction = (label) => {
  closeProfileMenu()

  const normalizedLabel = String(label || '').trim().toLowerCase()
  if (normalizedLabel === 'settings') {
    openSettingsModal('preferences')
  }
}

const persistAdminNotifications = () => {
  writeLocalJson(ADMIN_NOTIFICATION_STORAGE_KEY, adminNotifications.value.slice(0, ADMIN_NOTIFICATION_LIMIT))
}

const persistSeenApplicantIds = () => {
  writeLocalJson(ADMIN_SEEN_APPLICANT_IDS_STORAGE_KEY, seenApplicantIds.value)
}

const persistSeenEmployerIds = () => {
  writeLocalJson(ADMIN_SEEN_EMPLOYER_IDS_STORAGE_KEY, seenEmployerIds.value)
}

const persistSeenPaymentEntryIds = () => {
  writeLocalJson(ADMIN_SEEN_PAYMENT_ENTRY_IDS_STORAGE_KEY, seenPaymentEntryIds.value)
}

const persistSeenJobPostIds = () => {
  writeLocalJson(ADMIN_SEEN_JOB_POST_IDS_STORAGE_KEY, seenJobPostIds.value)
}

const persistSeenActivityLogIds = () => {
  writeLocalJson(ADMIN_SEEN_ACTIVITY_LOG_IDS_STORAGE_KEY, seenActivityLogIds.value)
}

const markApplicantIdsAsSeen = (applicants = []) => {
  const applicantIds = (Array.isArray(applicants) ? applicants : [])
    .map((applicant) => String(applicant?.id || '').trim())
    .filter(Boolean)

  if (!applicantIds.length) return

  seenApplicantIds.value = normalizeIdList([
    ...seenApplicantIds.value,
    ...applicantIds,
  ])
  persistSeenApplicantIds()
}

const markNotificationApplicantIdsAsSeen = (notifications = []) => {
  const applicantIds = (Array.isArray(notifications) ? notifications : [])
    .map((notification) => String(notification?.applicantId || '').trim())
    .filter(Boolean)

  if (!applicantIds.length) return

  seenApplicantIds.value = normalizeIdList([
    ...seenApplicantIds.value,
    ...applicantIds,
  ])
  persistSeenApplicantIds()
}

const syncApplicantListSeenState = () => {
  seenApplicantIds.value = normalizeIdList(
    (Array.isArray(adminProfiles.value.applicants) ? adminProfiles.value.applicants : [])
      .map((record) => record?.id),
  )
  persistSeenApplicantIds()
  markAllNotificationsAsRead()
  dismissAdminToast()
}

const syncEmployerListSeenState = () => {
  seenEmployerIds.value = normalizeIdList(
    (Array.isArray(adminProfiles.value.employers) ? adminProfiles.value.employers : [])
      .map((record) => record?.id),
  )
  persistSeenEmployerIds()
}

const syncPaymentHistorySeenState = () => {
  seenPaymentEntryIds.value = normalizeIdList(
    (Array.isArray(adminPaymentHistory.value) ? adminPaymentHistory.value : [])
      .map((entry) => entry?.id),
  )
  persistSeenPaymentEntryIds()
}

const syncAdminJobSeenState = () => {
  seenJobPostIds.value = normalizeIdList(
    (Array.isArray(adminJobPosts.value) ? adminJobPosts.value : [])
      .map((entry) => entry?.id),
  )
  persistSeenJobPostIds()
}

const syncAdminActivityLogSeenState = () => {
  seenActivityLogIds.value = normalizeIdList(
    (Array.isArray(activityLogs.value) ? activityLogs.value : [])
      .map((entry) => entry?.id),
  )
  persistSeenActivityLogIds()
}

const applicantNotificationName = (record) =>
  String(
    `${record?.first_name || ''} ${record?.last_name || ''}`.trim()
    || record?.user?.name
    || record?.email
    || 'A new applicant',
  ).trim()

const hydrateAdminNotificationState = () => {
  if (hasHydratedAdminNotificationState) return

  const storedNotifications = readLocalJson(ADMIN_NOTIFICATION_STORAGE_KEY, [])
  adminNotifications.value = Array.isArray(storedNotifications)
    ? storedNotifications
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => ({
        id: String(entry.id || `notification-${Date.now()}`),
        kind: String(entry.kind || 'applicant'),
        title: String(entry.title || 'Notification'),
        message: String(entry.message || '').trim(),
        createdAt: String(entry.createdAt || ''),
        applicantId: String(entry.applicantId || ''),
        read: entry.read === true,
      }))
      .filter((entry) => entry.message)
      .slice(0, ADMIN_NOTIFICATION_LIMIT)
    : []

  const storedApplicantIds = readLocalJson(ADMIN_SEEN_APPLICANT_IDS_STORAGE_KEY, [])
  if (Array.isArray(storedApplicantIds) && storedApplicantIds.length) {
    seenApplicantIds.value = normalizeIdList(storedApplicantIds)
    shouldSeedSeenApplicantIdsOnFirstSnapshot = false
  } else {
    seenApplicantIds.value = []
    shouldSeedSeenApplicantIdsOnFirstSnapshot = true
  }

  const storedEmployerIds = readLocalJson(ADMIN_SEEN_EMPLOYER_IDS_STORAGE_KEY, [])
  if (Array.isArray(storedEmployerIds) && storedEmployerIds.length) {
    seenEmployerIds.value = normalizeIdList(storedEmployerIds)
    shouldSeedSeenEmployerIdsOnFirstSnapshot = false
  } else {
    seenEmployerIds.value = []
    shouldSeedSeenEmployerIdsOnFirstSnapshot = true
  }

  const storedPaymentEntryIds = readLocalJson(ADMIN_SEEN_PAYMENT_ENTRY_IDS_STORAGE_KEY, [])
  if (Array.isArray(storedPaymentEntryIds) && storedPaymentEntryIds.length) {
    seenPaymentEntryIds.value = normalizeIdList(storedPaymentEntryIds)
    shouldSeedSeenPaymentEntryIdsOnFirstSnapshot = false
  } else {
    seenPaymentEntryIds.value = []
    shouldSeedSeenPaymentEntryIdsOnFirstSnapshot = true
  }

  const storedJobPostIds = readLocalJson(ADMIN_SEEN_JOB_POST_IDS_STORAGE_KEY, [])
  if (Array.isArray(storedJobPostIds) && storedJobPostIds.length) {
    seenJobPostIds.value = normalizeIdList(storedJobPostIds)
    shouldSeedSeenJobPostIdsOnFirstSnapshot = false
  } else {
    seenJobPostIds.value = []
    shouldSeedSeenJobPostIdsOnFirstSnapshot = true
  }

  const storedActivityLogIds = readLocalJson(ADMIN_SEEN_ACTIVITY_LOG_IDS_STORAGE_KEY, [])
  if (Array.isArray(storedActivityLogIds) && storedActivityLogIds.length) {
    seenActivityLogIds.value = normalizeIdList(storedActivityLogIds)
    shouldSeedSeenActivityLogIdsOnFirstSnapshot = false
  } else {
    seenActivityLogIds.value = []
    shouldSeedSeenActivityLogIdsOnFirstSnapshot = true
  }

  hasHydratedAdminNotificationState = true
}

const markAllNotificationsAsRead = () => {
  dismissAdminToast()
  if (!unreadNotificationCount.value) return

  markNotificationApplicantIdsAsSeen(adminNotifications.value)
  adminNotifications.value = adminNotifications.value.map((notification) => (
    notification.read ? notification : { ...notification, read: true }
  ))
  persistAdminNotifications()
}

const toggleNotificationMenu = () => {
  closeProfileMenu()
  notificationMenuOpen.value = !notificationMenuOpen.value

  if (notificationMenuOpen.value) {
    markAllNotificationsAsRead()
  }
}

const openApplicantNotifications = async () => {
  syncApplicantListSeenState()
  closeNotificationMenu()
  setAdminView('applicant-list')
}

const openNotification = (notificationId) => {
  const matchedNotification = adminNotifications.value.find((notification) => notification.id === notificationId)
  markNotificationApplicantIdsAsSeen(matchedNotification ? [matchedNotification] : [])
  adminNotifications.value = adminNotifications.value.map((notification) => (
    notification.id === notificationId ? { ...notification, read: true } : notification
  ))
  persistAdminNotifications()
  openApplicantNotifications()
}

const announceNewApplicants = (newApplicants) => {
  if (!newApplicants.length) return

  const now = new Date().toISOString()
  const nextNotifications = newApplicants.map((applicant) => ({
    id: `applicant-${String(applicant?.id || Date.now())}-${String(applicant?.created_at || applicant?.submitted_at || now)}`,
    kind: 'applicant',
    title: 'New applicant account',
    message: `${applicantNotificationName(applicant)} created an account. Check your Applicant List.`,
    createdAt: String(applicant?.created_at || applicant?.submitted_at || now),
    applicantId: String(applicant?.id || ''),
    read: notificationMenuOpen.value,
  }))

  adminNotifications.value = [
    ...nextNotifications,
    ...adminNotifications.value,
  ].slice(0, ADMIN_NOTIFICATION_LIMIT)
  persistAdminNotifications()

  if (notificationMenuOpen.value) {
    dismissAdminToast()
    return
  }

  adminToast.value = newApplicants.length === 1
    ? {
        title: 'New applicant',
        message: `${applicantNotificationName(newApplicants[0])} just created an account. Check your Applicant List.`,
      }
    : {
        title: 'New applicants',
        message: `${newApplicants.length} new applicants just created accounts. Check your Applicant List.`,
      }

  clearAdminToastTimer()
  if (typeof window !== 'undefined') {
    notificationToastTimer = window.setTimeout(() => {
      adminToast.value = null
    }, 7000)
  }
}

const isApplicantCreatedDuringCurrentAdminSession = (applicant) => {
  const createdAt = parseRecordDate(applicant?.created_at || applicant?.createdAt || applicant?.submitted_at)
  if (!createdAt) return false
  return createdAt.getTime() >= adminSessionStartedAt
}

const reconcileApplicantNotifications = (applicants) => {
  hydrateAdminNotificationState()
  const applicantRecords = Array.isArray(applicants) ? applicants : []

  const currentIds = normalizeIdList(
    applicantRecords
      .map((applicant) => String(applicant?.id || '').trim())
      .filter(Boolean),
  )

  if (shouldSeedSeenApplicantIdsOnFirstSnapshot) {
    seenApplicantIds.value = currentIds
    persistSeenApplicantIds()
    shouldSeedSeenApplicantIdsOnFirstSnapshot = false
    return
  }

  const prunedSeenIds = seenApplicantIds.value.filter((id) => currentIds.includes(id))
  if (!areIdListsEqual(prunedSeenIds, seenApplicantIds.value)) {
    seenApplicantIds.value = prunedSeenIds
    persistSeenApplicantIds()
  }

  if (activeAdminView.value === 'applicant-list') {
    if (!areIdListsEqual(currentIds, seenApplicantIds.value)) {
      seenApplicantIds.value = currentIds
      persistSeenApplicantIds()
    }
    markAllNotificationsAsRead()
    dismissAdminToast()
    return
  }

  const notifiedApplicantIds = new Set(
    adminNotifications.value
      .map((notification) => String(notification?.applicantId || '').trim())
      .filter(Boolean),
  )
  const seenApplicantIdSet = new Set(seenApplicantIds.value)
  const newApplicants = applicantRecords.filter((applicant) => {
    const applicantId = String(applicant?.id || '').trim()
    return applicantId
      && !seenApplicantIdSet.has(applicantId)
      && !notifiedApplicantIds.has(applicantId)
      && isApplicantCreatedDuringCurrentAdminSession(applicant)
  })

  if (newApplicants.length) {
    announceNewApplicants(newApplicants)
  }
}

const reconcileEmployerSidebarState = (employers = []) => {
  hydrateAdminNotificationState()

  const currentIds = normalizeIdList(
    (Array.isArray(employers) ? employers : [])
      .map((record) => record?.id),
  )

  if (shouldSeedSeenEmployerIdsOnFirstSnapshot) {
    seenEmployerIds.value = currentIds
    persistSeenEmployerIds()
    shouldSeedSeenEmployerIdsOnFirstSnapshot = false
    return
  }

  const prunedSeenIds = seenEmployerIds.value.filter((id) => currentIds.includes(id))
  if (!areIdListsEqual(prunedSeenIds, seenEmployerIds.value)) {
    seenEmployerIds.value = prunedSeenIds
    persistSeenEmployerIds()
  }

  if (['employee-list', 'all-user'].includes(activeAdminView.value)) {
    if (!areIdListsEqual(currentIds, seenEmployerIds.value)) {
      seenEmployerIds.value = currentIds
      persistSeenEmployerIds()
    }
  }
}

const reconcilePaymentHistorySidebarState = (entries = []) => {
  hydrateAdminNotificationState()

  const currentIds = normalizeIdList(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => entry?.id),
  )

  if (shouldSeedSeenPaymentEntryIdsOnFirstSnapshot) {
    seenPaymentEntryIds.value = currentIds
    persistSeenPaymentEntryIds()
    shouldSeedSeenPaymentEntryIdsOnFirstSnapshot = false
    return
  }

  const prunedSeenIds = seenPaymentEntryIds.value.filter((id) => currentIds.includes(id))
  if (!areIdListsEqual(prunedSeenIds, seenPaymentEntryIds.value)) {
    seenPaymentEntryIds.value = prunedSeenIds
    persistSeenPaymentEntryIds()
  }

  if (activeAdminView.value === 'payment-history') {
    if (!areIdListsEqual(currentIds, seenPaymentEntryIds.value)) {
      seenPaymentEntryIds.value = currentIds
      persistSeenPaymentEntryIds()
    }
  }
}

const reconcileAdminJobSidebarState = (jobs = []) => {
  hydrateAdminNotificationState()

  const currentIds = normalizeIdList(
    (Array.isArray(jobs) ? jobs : [])
      .map((entry) => entry?.id),
  )

  if (shouldSeedSeenJobPostIdsOnFirstSnapshot) {
    seenJobPostIds.value = currentIds
    persistSeenJobPostIds()
    shouldSeedSeenJobPostIdsOnFirstSnapshot = false
    return
  }

  const prunedSeenIds = seenJobPostIds.value.filter((id) => currentIds.includes(id))
  if (!areIdListsEqual(prunedSeenIds, seenJobPostIds.value)) {
    seenJobPostIds.value = prunedSeenIds
    persistSeenJobPostIds()
  }

  if (['all-job-post', 'test-job-post'].includes(activeAdminView.value)) {
    if (!areIdListsEqual(currentIds, seenJobPostIds.value)) {
      seenJobPostIds.value = currentIds
      persistSeenJobPostIds()
    }
  }
}

const reconcileAdminActivityLogSidebarState = (entries = []) => {
  hydrateAdminNotificationState()

  const currentIds = normalizeIdList(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => entry?.id),
  )

  if (shouldSeedSeenActivityLogIdsOnFirstSnapshot) {
    seenActivityLogIds.value = currentIds
    persistSeenActivityLogIds()
    shouldSeedSeenActivityLogIdsOnFirstSnapshot = false
    return
  }

  const prunedSeenIds = seenActivityLogIds.value.filter((id) => currentIds.includes(id))
  if (!areIdListsEqual(prunedSeenIds, seenActivityLogIds.value)) {
    seenActivityLogIds.value = prunedSeenIds
    persistSeenActivityLogIds()
  }

  if (activeAdminView.value === 'logs') {
    if (!areIdListsEqual(currentIds, seenActivityLogIds.value)) {
      seenActivityLogIds.value = currentIds
      persistSeenActivityLogIds()
    }
  }
}

const syncCurrentUser = async (firebaseUser) => {
  const storedUser = getStoredAuthUser()
  const storedUid = String(storedUser?.uid || storedUser?.id || '').trim()
  const firebaseUid = String(firebaseUser?.uid || '').trim()
  const storedRole = String(storedUser?.role || '').trim().toLowerCase()

  if (!firebaseUser?.uid) {
    currentUser.value = null
    clearAuthSession()
    void router.replace('/login')
    return
  }

  if (!storedUid || storedUid !== firebaseUid || !['admin', 'system_admin'].includes(storedRole)) {
    currentUser.value = null
    dismissAdminToast()
    clearAuthSession()
    await signOut(auth).catch(() => {})
    void router.replace('/login')
    return
  }

  if (String(currentUser.value?.uid || '').trim() !== firebaseUid) {
    adminSessionStartedAt = Date.now()
  }

  const fallbackUser = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || '',
    email: firebaseUser.email || '',
  }

  try {
    const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (snapshot.exists()) {
      currentUser.value = {
        uid: firebaseUser.uid,
        ...snapshot.data(),
        email: snapshot.data()?.email || fallbackUser.email,
        name: snapshot.data()?.name || fallbackUser.name,
      }
      return
    }
  } catch {
    // Keep the Firebase Auth profile as a safe fallback when Firestore is unavailable.
  }

  currentUser.value = fallbackUser
}

const onDocumentClick = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (!target.closest('.admin-user-menu')) {
    closeProfileMenu()
  }
  if (!target.closest('.admin-navbar__notification-wrap')) {
    closeNotificationMenu()
  }
  if (!target.closest('.dashboard-approved-filter')) {
    isRecentApprovedRoleDropdownOpen.value = false
  }
  if (!target.closest('.admin-payment-history-status-filter')) {
    isPaymentHistoryStatusDropdownOpen.value = false
  }
}

const handleLogout = async () => {
  closeProfileMenu()
  closeNotificationMenu()
  closeSettingsModal()
  dismissAdminToast()
  sessionStorage.setItem(LOGOUT_TOAST_KEY, '1')
  await signOut(auth).catch(() => {})
  await router.replace('/login')
}

const handleAdminDashboardStorageChange = (event) => {
  const storageKey = String(event?.key || '').trim()
  if (!storageKey) return

  if ([
    ADMIN_NOTIFICATION_STORAGE_KEY,
    ADMIN_SEEN_APPLICANT_IDS_STORAGE_KEY,
    ADMIN_SEEN_EMPLOYER_IDS_STORAGE_KEY,
    ADMIN_SEEN_PAYMENT_ENTRY_IDS_STORAGE_KEY,
    ADMIN_SEEN_JOB_POST_IDS_STORAGE_KEY,
    ADMIN_SEEN_ACTIVITY_LOG_IDS_STORAGE_KEY,
  ].includes(storageKey)) {
    hasHydratedAdminNotificationState = false
    hydrateAdminNotificationState()
    return
  }

  if (storageKey === ADMIN_PAYMENT_HISTORY_STORAGE_KEY) {
    syncAdminPaymentHistoryState()
    return
  }

  if (storageKey === ADMIN_SETTINGS_STORAGE_KEY) {
    hydrateAdminSettings()
  }
}

onMounted(() => {
  startInitialAdminLoader()
  hydrateAdminNotificationState()
  void startAdminPaymentHistorySync()
  hydrateSidebarDropdownState()
  hydrateAdminSettings()

  stopAuthWatcher = onAuthStateChanged(auth, (firebaseUser) => {
    void syncCurrentUser(firebaseUser).finally(() => {
      finishInitialAdminLoader()
    })
  })

  void getPublicJobs()
    .then((jobs) => {
      publicJobs.value = Array.isArray(jobs) ? jobs : []
      if (usePublicJobFallbackForAdminViews) {
        adminJobPosts.value = Array.isArray(jobs) ? [...jobs] : []
      }
    })
    .catch(() => {
      publicJobs.value = []
      if (usePublicJobFallbackForAdminViews) {
        adminJobPosts.value = []
      }
    })

  void getAllJobs()
    .then((jobs) => {
      usePublicJobFallbackForAdminViews = false
      adminJobPosts.value = Array.isArray(jobs) ? jobs : []
    })
    .catch(() => {
      usePublicJobFallbackForAdminViews = true
      adminJobPosts.value = Array.isArray(publicJobs.value) ? [...publicJobs.value] : []
    })

  stopPublicJobs = subscribeToPublicJobs(
    (jobs) => {
      publicJobs.value = Array.isArray(jobs) ? jobs : []
      if (usePublicJobFallbackForAdminViews) {
        adminJobPosts.value = Array.isArray(jobs) ? [...jobs] : []
      }
    },
    (error) => {
      console.error('Admin realtime jobs sync failed', error)
    },
  )

  stopAllJobs = subscribeToAllJobs(
    (jobs) => {
      usePublicJobFallbackForAdminViews = false
      adminJobPosts.value = Array.isArray(jobs) ? jobs : []
    },
    (error) => {
      console.error('Admin realtime all jobs sync failed', error)
      usePublicJobFallbackForAdminViews = true
      adminJobPosts.value = Array.isArray(publicJobs.value) ? [...publicJobs.value] : []
    },
  )

  stopAdminProfiles = subscribeToAdminProfiles(
    (nextProfiles) => {
      const nextApplicants = Array.isArray(nextProfiles?.applicants) ? nextProfiles.applicants : []
      const nextEmployers = Array.isArray(nextProfiles?.employers) ? nextProfiles.employers : []

      adminProfiles.value = {
        applicants: nextApplicants,
        employers: nextEmployers,
      }
      reconcileApplicantNotifications(nextApplicants)
    },
    (error) => {
      console.error('Admin realtime profile sync failed', error)
    },
  )

  stopDeletedHistory = subscribeToDeletedUserHistory(
    (nextHistory) => {
      deletedUserHistory.value = Array.isArray(nextHistory) ? nextHistory : []
    },
    (error) => {
      console.error('Admin realtime deleted history sync failed', error)
    },
  )

  stopActivityLogs = subscribeToActivityLogs(
    (nextLogs) => {
      activityLogs.value = Array.isArray(nextLogs) ? nextLogs : []
    },
    (error) => {
      console.error('Admin realtime activity log sync failed', error)
    },
  )

  void subscribeToAdminPlanCatalog(
    (plans) => {
      adminPlanCatalog.value = Array.isArray(plans) ? plans : []
    },
    (error) => {
      console.error('Admin realtime plan sync failed', error)
    },
  ).then((unsubscribe) => {
    stopAdminPlanCatalog = typeof unsubscribe === 'function' ? unsubscribe : () => {}
  })

  document.addEventListener('click', onDocumentClick)
  window.addEventListener('storage', handleAdminDashboardStorageChange)
})

onBeforeUnmount(() => {
  stopAuthWatcher()
  stopAdminProfiles()
  stopDeletedHistory()
  stopActivityLogs()
  stopAdminPlanCatalog()
  stopPublicJobs()
  stopAllJobs()
  stopBusinessPaymentHistory()
  stopAllWorkspaceUserSubscriptions()
  clearAdminToastTimer()
  document.body.style.overflow = ''
  clearAdminDocumentTheme()
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('storage', handleAdminDashboardStorageChange)
})
</script>

<template>
  <section
    class="admin-shell"
    :style="adminShellStyle"
    :data-color-mode="settingsPreferences.darkMode ? 'dark' : 'light'"
    :data-compact-spacing="settingsPreferences.compactCards ? 'true' : 'false'"
    :data-reduce-motion="settingsPreferences.reduceMotion ? 'true' : 'false'"
  >
    <AdminSidebar
      :logo-src="logoPwd"
      :wordmark-src="pwdWordmark"
      :primary-items="primaryItems"
      :user-management-items="userManagementItems"
      :user-management-badge="userManagementSidebarBadge"
      :payment-management-items="paymentManagementItems"
      :payment-management-badge="subscriptionManagementSidebarBadge"
      :job-management-items="jobManagementItems"
      :job-management-badge="jobManagementSidebarBadge"
      :storage-management-items="storageManagementItems"
      :active-view="activeAdminView"
      :user-management-open="userManagementOpen"
      :payment-management-open="paymentManagementOpen"
      :job-management-open="jobManagementOpen"
      :storage-management-open="storageManagementOpen"
      :secondary-items="secondaryItems"
      :profile-name="profileName"
      :profile-email="profileEmail"
      :profile-initials="profileInitials"
      @set-view="setAdminView"
      @open-setting="openSettingsModal('preferences')"
      @toggle-user-management="toggleUserManagement"
      @toggle-payment-management="togglePaymentManagement"
      @toggle-job-management="toggleJobManagement"
      @toggle-storage-management="toggleStorageManagement"
    />

    <main class="admin-content" aria-label="Admin content area">
      <div class="admin-navbar-shell">
        <AdminNavbar
          :title="currentViewTitle"
          :subtitle="currentViewSubtitle"
          :breadcrumb-parent="currentViewParent"
          :breadcrumb-current="currentViewTitle"
          :notifications="recentAdminNotifications"
          :notification-count="unreadNotificationCount"
          :notification-menu-open="notificationMenuOpen"
          :profile-name="profileName"
          :profile-email="profileEmail"
          :profile-initials="profileInitials"
          :profile-menu-open="profileMenuOpen"
          @toggle-notifications="toggleNotificationMenu"
          @open-notification="openNotification"
          @toggle-profile="toggleProfileMenu"
          @logout="handleLogout"
        />
      </div>

      <section class="dashboard-page">
        <transition name="admin-settings-modal">
          <div
            v-if="settingsModalOpen"
            class="admin-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Admin settings"
            @click.self="closeSettingsModal"
          >
            <div class="admin-settings-modal__card">
              <div class="admin-settings-modal__header">
                <div>
                  <span class="admin-settings-modal__eyebrow">Account Settings</span>
                  <h2>Workspace Settings</h2>
                  <p>Tune the admin workspace from one place.</p>
                </div>

                <button
                  type="button"
                  class="admin-settings-modal__close"
                  aria-label="Close settings"
                  @click="closeSettingsModal"
                >
                  <i class="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <div class="admin-settings-modal__body">
                <aside class="admin-settings-modal__nav" aria-label="Settings sections">
                  <button
                    type="button"
                    class="admin-settings-modal__nav-item"
                    :class="{ 'is-active': settingsActivePanel === 'preferences' }"
                    @click="settingsActivePanel = 'preferences'"
                  >
                    <i class="bi bi-sliders" aria-hidden="true" />
                    <span>Preferences</span>
                  </button>
                  <button
                    type="button"
                    class="admin-settings-modal__nav-item"
                    :class="{ 'is-active': settingsActivePanel === 'themes' }"
                    @click="settingsActivePanel = 'themes'"
                  >
                    <i class="bi bi-palette" aria-hidden="true" />
                    <span>Themes</span>
                  </button>
                </aside>

                <div class="admin-settings-modal__content">
                  <section v-if="settingsActivePanel === 'preferences'" class="admin-settings-section">
                    <div class="admin-settings-section__head">
                      <h3>Preferences</h3>
                      <p>Adjust the admin layout behavior and visual feel.</p>
                    </div>

                    <label class="admin-settings-toggle">
                      <div class="admin-settings-toggle__copy">
                        <strong>Dark mode</strong>
                        <span>Switch the whole admin workspace to a low-light dashboard theme.</span>
                      </div>
                      <input v-model="settingsPreferences.darkMode" type="checkbox" />
                      <span class="admin-settings-toggle__switch" aria-hidden="true" />
                    </label>

                    <label class="admin-settings-toggle">
                      <div class="admin-settings-toggle__copy">
                        <strong>Compact spacing</strong>
                        <span>Tighten dashboard gaps and cards for a denser layout.</span>
                      </div>
                      <input v-model="settingsPreferences.compactCards" type="checkbox" />
                      <span class="admin-settings-toggle__switch" aria-hidden="true" />
                    </label>

                    <label class="admin-settings-toggle">
                      <div class="admin-settings-toggle__copy">
                        <strong>Reduce motion</strong>
                        <span>Keep transitions subtle across the admin workspace.</span>
                      </div>
                      <input v-model="settingsPreferences.reduceMotion" type="checkbox" />
                      <span class="admin-settings-toggle__switch" aria-hidden="true" />
                    </label>
                  </section>

                  <section v-else class="admin-settings-section">
                    <div class="admin-settings-section__head">
                      <h3>Themes</h3>
                      <p>Pick the mood you want for the admin workspace.</p>
                    </div>

                    <div class="admin-theme-grid">
                      <button
                        v-for="theme in ADMIN_THEME_OPTIONS"
                        :key="theme.value"
                        type="button"
                        class="admin-theme-card"
                        :class="{ 'is-active': selectedAdminTheme === theme.value }"
                        @click="selectedAdminTheme = theme.value"
                      >
                        <span class="admin-theme-card__preview" :style="{ background: theme.preview }" />
                        <strong>{{ theme.label }}</strong>
                        <span>{{ theme.description }}</span>
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <transition name="admin-settings-modal">
          <div
            v-if="adminMessageModalOpen && selectedAdminMessageRecipient"
            class="admin-message-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-message-modal-title"
            @click.self="closeAdminMessageModal"
          >
            <div class="admin-message-modal__panel">
              <div class="admin-message-modal__header">
                <div>
                  <span class="admin-message-modal__eyebrow">Direct Message</span>
                  <h2 id="admin-message-modal-title">Send Message</h2>
                  <p>Deliver a real-time admin message to this account.</p>
                </div>

                <button
                  type="button"
                  class="admin-message-modal__close"
                  aria-label="Close message composer"
                  :disabled="isAdminMessageSubmitting"
                  @click="closeAdminMessageModal"
                >
                  <i class="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <div class="admin-message-modal__body">
                <div class="admin-message-modal__recipient">
                  <span class="admin-message-modal__recipient-label">Recipient</span>
                  <strong>{{ selectedAdminMessageRecipient.name }}</strong>
                  <small>{{ selectedAdminMessageRecipient.email }} · {{ getAdminMessageRecipientRoleLabel(selectedAdminMessageRecipient) }}</small>
                </div>

                <label class="admin-message-modal__field">
                  <span>Title</span>
                  <input
                    v-model.trim="adminDirectMessageForm.title"
                    type="text"
                    :maxlength="ADMIN_DIRECT_MESSAGE_TITLE_LIMIT"
                    placeholder="Admin message"
                  />
                </label>

                <label class="admin-message-modal__field">
                  <span>Message</span>
                  <textarea
                    v-model="adminDirectMessageForm.message"
                    rows="6"
                    :maxlength="ADMIN_DIRECT_MESSAGE_BODY_LIMIT"
                    placeholder="Write the message you want to send..."
                  />
                </label>

                <div class="admin-message-modal__meta">
                  <small>{{ adminDirectMessageBodyLength }}/{{ ADMIN_DIRECT_MESSAGE_BODY_LIMIT }}</small>
                </div>

                <div class="admin-message-modal__actions">
                  <button
                    type="button"
                    class="admin-message-modal__button admin-message-modal__button--ghost"
                    :disabled="isAdminMessageSubmitting"
                    @click="closeAdminMessageModal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="admin-message-modal__button admin-message-modal__button--primary"
                    :disabled="isAdminMessageSubmitting || !canSubmitAdminDirectMessage"
                    @click="submitAdminDirectMessage"
                  >
                    {{ isAdminMessageSubmitting ? 'Sending...' : 'Send' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <transition name="admin-toast">
          <div v-if="adminToast" class="admin-toast" role="status" aria-live="polite">
            <div class="admin-toast__icon" aria-hidden="true">
              <i :class="getAdminToastIconClass()" />
            </div>

            <div class="admin-toast__copy">
              <strong>{{ adminToast.title }}</strong>
              <span>{{ adminToast.message }}</span>
            </div>

            <div class="admin-toast__actions">
              <button
                v-if="adminToast.action"
                type="button"
                class="admin-toast__action"
                @click="handleAdminToastAction"
              >
                {{ adminToast.action === 'preview-plan' ? 'Check Preview Plan' : adminToast.action }}
              </button>
              <button type="button" class="admin-toast__close" aria-label="Close notification" @click="dismissAdminToast">
                <i class="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>
          </div>
        </transition>

        <transition name="admin-view" mode="out-in" appear>
          <div v-if="!isInitialAdminLoading" :key="activeAdminView" class="admin-view-stage">
            <template v-if="activeAdminView === 'dashboard'">
              <section class="dashboard-summary-grid" aria-label="Dashboard summary">
                <article
                  v-for="(card, cardIndex) in dashboardSummaryCards"
                  :key="card.label"
                  class="dashboard-summary-card dashboard-summary-card--enter"
                  :class="`dashboard-summary-card--${card.tone}`"
                  :style="dashboardStaggerStyle(cardIndex)"
                >
                  <div class="dashboard-summary-card__top">
                    <span class="dashboard-summary-card__label">
                      {{ card.label }}
                    </span>
                    <span class="dashboard-summary-card__icon" :class="`is-${card.trend}`" aria-hidden="true">
                      <i :class="card.icon" />
                    </span>
                  </div>
                  <div class="dashboard-summary-card__body">
                    <strong class="dashboard-summary-card__value">{{ card.value }}</strong>
                    <span class="dashboard-summary-card__subtitle">{{ card.subtitle }}</span>
                  </div>
                </article>
              </section>

              <section class="dashboard-analytics-grid">
                <article
                  class="dashboard-panel dashboard-panel--enter dashboard-chart-panel"
                  :style="dashboardStaggerStyle(0, 320)"
                >
                  <div class="dashboard-panel__head">
                    <div>
                      <h2>Account Trends</h2>
                      <p class="dashboard-panel__subcopy">Monthly applicant and employer activity</p>
                    </div>
                    <span class="dashboard-panel__pill">6 months</span>
                  </div>

                  <div class="dashboard-line-chart__growth-grid">
                    <article
                      v-for="growthCard in accountTrendChart.growthCards"
                      :key="growthCard.label"
                      class="dashboard-line-chart__growth-card"
                      :class="`is-${growthCard.trend}`"
                    >
                      <span class="dashboard-line-chart__growth-label">{{ growthCard.label }}</span>
                      <strong class="dashboard-line-chart__growth-value">{{ growthCard.value }}</strong>
                      <span class="dashboard-line-chart__growth-detail">{{ growthCard.detail }}</span>
                    </article>
                  </div>

                  <div class="dashboard-line-chart">
                    <div class="dashboard-line-chart__grid" />
                    <svg
                      class="dashboard-line-chart__svg"
                      :viewBox="`0 0 ${accountTrendChart.chartWidth} ${accountTrendChart.chartHeight}`"
                      aria-hidden="true"
                    >
                      <path class="dashboard-line-chart__area-path" :d="accountTrendChart.applicantAreaPath" />
                      <path class="dashboard-line-chart__line dashboard-line-chart__line--registration" :d="accountTrendChart.applicantPath" />
                      <path class="dashboard-line-chart__line dashboard-line-chart__line--approval" :d="accountTrendChart.companyPath" />

                      <circle
                        v-for="point in accountTrendChart.applicantPoints"
                        :key="`applicant-${point.label}`"
                        class="dashboard-line-chart__point dashboard-line-chart__point--registration"
                        :cx="point.x"
                        :cy="point.y"
                        r="4.5"
                      />
                      <circle
                        v-for="point in accountTrendChart.companyPoints"
                        :key="`company-${point.label}`"
                        class="dashboard-line-chart__point dashboard-line-chart__point--approval"
                        :cx="point.x"
                        :cy="point.y"
                        r="3.5"
                      />
                    </svg>
                    <div class="dashboard-line-chart__summary">
                      <span class="dashboard-line-chart__legend-item">
                        <i class="bi bi-dash-lg" />
                        {{ accountTrendChart.totalApplicants }} Applicant
                      </span>
                      <span class="dashboard-line-chart__legend-item is-approval">
                        <i class="bi bi-dash-lg" />
                        {{ accountTrendChart.totalCompanies }} Business
                      </span>
                    </div>
                    <div class="dashboard-line-chart__labels">
                      <span v-for="month in accountTrendChart.months" :key="month.key">{{ month.label }}</span>
                    </div>
                  </div>

                </article>

                <article
                  class="dashboard-panel dashboard-panel--enter dashboard-distribution-panel"
                  :style="dashboardStaggerStyle(1, 320)"
                >
                  <div class="dashboard-panel__head">
                    <div>
                      <h2>Profile Distribution</h2>
                      <p class="dashboard-panel__subcopy">Pending, applicant, and employer accounts</p>
                    </div>
                    <span class="dashboard-panel__pill">Live</span>
                  </div>

                  <div class="dashboard-donut">
                    <div class="dashboard-donut__chart">
                      <Transition name="dashboard-donut-status" mode="out-in">
                        <div :key="approvalStatusChart.ringStyle.background" class="dashboard-donut__status-layer">
                          <div class="dashboard-donut__ring" :style="approvalStatusChart.ringStyle" />
                          <div class="dashboard-donut__center">
                            <strong>{{ approvalStatusChart.centerValue }}</strong>
                            <span>{{ approvalStatusChart.centerLabel }}</span>
                          </div>
                        </div>
                      </Transition>
                    </div>

                    <div class="dashboard-donut__legend">
                      <div
                        v-for="item in approvalStatusChart.legend"
                        :key="item.label"
                        class="dashboard-donut__legend-item"
                      >
                        <span class="dashboard-donut__swatch" :style="{ background: item.color }" />
                        <span>{{ item.label }}: {{ item.count }} ({{ item.percentage }}%)</span>
                      </div>
                    </div>
                  </div>
                </article>

              </section>

              <section class="dashboard-approved-grid">
                <article
                  class="dashboard-panel dashboard-panel--enter"
                  :style="dashboardStaggerStyle(2, 320)"
                >
                  <div class="dashboard-panel__head">
                    <div>
                      <h2>Recent Approved</h2>
                      <p class="dashboard-panel__subcopy">Latest approved accounts</p>
                    </div>
                    <span class="dashboard-panel__pill">{{ recentApprovedPanelLabel }}</span>
                  </div>

                  <div class="dashboard-approved-toolbar">
                    <label class="dashboard-approved-search">
                      <i class="bi bi-search" aria-hidden="true" />
                      <input
                        v-model.trim="recentApprovedSearch"
                        type="text"
                        placeholder="Search approved accounts..."
                      />
                    </label>

                    <div
                      class="dashboard-approved-filter"
                      :class="{ 'dashboard-approved-filter--open': isRecentApprovedRoleDropdownOpen }"
                    >
                      <span class="dashboard-approved-filter__icon" aria-hidden="true">
                        <i class="bi bi-people" />
                      </span>
                      <button
                        type="button"
                        class="dashboard-approved-filter__trigger"
                        aria-haspopup="listbox"
                        :aria-expanded="isRecentApprovedRoleDropdownOpen ? 'true' : 'false'"
                        @click="toggleRecentApprovedRoleDropdown"
                        @keydown.esc.prevent="isRecentApprovedRoleDropdownOpen = false"
                      >
                        <span class="dashboard-approved-filter__value">{{ selectedRecentApprovedRoleLabel }}</span>
                      </button>
                      <span class="dashboard-approved-filter__caret" aria-hidden="true" />
                      <transition name="dashboard-approved-filter-dropdown">
                        <div
                          v-if="isRecentApprovedRoleDropdownOpen"
                          class="dashboard-approved-filter__menu"
                          role="listbox"
                          aria-label="Filter approved accounts by role"
                        >
                          <button
                            v-for="option in recentApprovedRoleOptions"
                            :key="option.value"
                            type="button"
                            class="dashboard-approved-filter__option"
                            :class="{ 'dashboard-approved-filter__option--active': recentApprovedRoleFilter === option.value }"
                            role="option"
                            :aria-selected="recentApprovedRoleFilter === option.value ? 'true' : 'false'"
                            @click="selectRecentApprovedRole(option.value)"
                          >
                            <span class="dashboard-approved-filter__option-mark" aria-hidden="true" />
                            <span>{{ option.label }}</span>
                          </button>
                        </div>
                      </transition>
                    </div>
                  </div>

                  <div v-if="filteredRecentApprovedAccounts.length" class="dashboard-approved-table-shell">
                    <div class="dashboard-approved-table">
                      <div class="dashboard-approved-table__head">
                        <span>ID</span>
                        <span>Account</span>
                        <span>Role</span>
                        <span>Approved Date</span>
                        <span>Status</span>
                      </div>

                      <article
                        v-for="account in filteredRecentApprovedAccounts"
                        :key="account.id || `${account.email}-${account.name}`"
                        class="dashboard-approved-row"
                      >
                        <div class="dashboard-approved-row__id">{{ account.accountId }}</div>

                        <div class="dashboard-approved-row__account">
                        <div
                          class="dashboard-approved-row__avatar"
                          :class="dashboardAvatarClass(account.role)"
                        >
                            <img
                              v-if="account.avatarUrl"
                              :src="account.avatarUrl"
                              :alt="`${account.name} avatar`"
                              class="dashboard-approved-row__avatar-image"
                            >
                            <template v-else>{{ initialsFromName(account.name, 'AC') }}</template>
                          </div>

                          <div class="dashboard-approved-row__meta">
                            <strong>{{ account.name }}</strong>
                            <span>{{ account.email }}</span>
                          </div>
                        </div>

                        <div class="dashboard-approved-row__role">{{ account.role }}</div>
                        <div class="dashboard-approved-row__date">{{ formatRecentApprovedDate(account.approvedAt) }}</div>
                        <div class="dashboard-approved-row__status">
                          <span class="dashboard-approved-status-pill" :class="`is-${normalizeStatusValue(account.status)}`">{{ account.status }}</span>
                        </div>
                      </article>
                    </div>
                  </div>

                  <div v-else class="dashboard-approved-empty">
                    No approved accounts match the current filter.
                  </div>
                </article>
              </section>
            </template>

            <AdminCreateUser
              v-else-if="activeAdminView === 'create-user'"
              @created="handleAdminManagedAccountCreated"
              @toast="handleAdminManagedAccountToast"
            />

            <AdminAllUser
              v-else-if="activeAdminView === 'all-user'"
              :applicants="adminProfiles.applicants"
              :employees="adminProfiles.employers"
              :new-user-keys="recentAdminUserKeys"
              @open-user="handleAllUserOpen"
            />

            <AdminApplicantList
              v-else-if="activeAdminView === 'applicant-list'"
              :applicants="adminProfiles.applicants"
              :new-applicant-ids="recentApplicantIds"
            />

            <section v-else-if="activeAdminView === 'employee-list'" class="admin-workspace-members-stack">
              <AdminEmployeeList
                :employees="adminProfiles.employers"
                :new-employee-ids="recentEmployerIds"
                :workspace-members-by-business-id="businessWorkspaceUsers"
              />

            </section>

            <AdminRoleBasedControlSytem
              v-else-if="activeAdminView === 'role-base-control-system'"
              :applicants="adminProfiles.applicants"
              :employers="adminProfiles.employers"
              :workspace-members-by-business-id="businessWorkspaceUsers"
            />

            <AdminDeletionHistory
              v-else-if="activeAdminView === 'history-delection-user'"
              :records="deletedUserHistory"
            />

            <AdminCreatePlan
              v-else-if="activeAdminView === 'create-plan'"
              @saved="handleAdminPlanSaved"
            />

            <AdminPreviewPlan
              v-else-if="activeAdminView === 'preview-plan'"
              @create-new="setAdminView('create-plan')"
              @plan-status-updated="handlePlanStatusUpdated"
            />

            <AdminJobPostList
              v-else-if="activeAdminView === 'all-job-post'"
              :jobs="adminJobPosts"
              :new-job-ids="recentAdminJobIds"
              mode="all"
            />

            <AdminJobPostList
              v-else-if="activeAdminView === 'test-job-post'"
              :jobs="adminJobPosts"
              :new-job-ids="recentAdminJobIds"
              mode="test"
            />

            <AdminApplicantStorage
              v-else-if="activeAdminView === 'applicant-storage'"
              :applicants="adminProfiles.applicants"
            />

            <AdminBusinessStorage
              v-else-if="activeAdminView === 'business-storage'"
              :employees="adminProfiles.employers"
            />

            <section v-else-if="activeAdminView === 'logs'" class="dashboard-panel admin-logs-panel">
              <div class="dashboard-panel__head">
                <div>
                  <h2>Admin Logs</h2>
                  <p class="dashboard-panel__subcopy">Recent system, auth, account, billing, and admin actions with actor and target details.</p>
                </div>
                <span class="dashboard-panel__pill">{{ adminActivityLogs.length }} items</span>
              </div>

              <div v-if="adminActivityLogs.length" class="admin-logs-list">
                <article
                  v-for="entry in adminActivityLogs"
                  :key="entry.id"
                  class="admin-logs-item"
                  :class="`admin-logs-item--${entry.tone}`"
                >
                  <div class="admin-logs-item__badge">{{ entry.meta }}</div>
                  <div class="admin-logs-item__body">
                    <div class="admin-logs-item__title-row">
                      <span v-if="isRecentActivityLogRecord(entry)" class="admin-row-new-badge">NEW</span>
                      <strong>{{ entry.title }}</strong>
                      <span class="admin-logs-item__status" :class="`admin-logs-item__status--${entry.tone}`">
                        {{ entry.statusLabel }}
                      </span>
                    </div>
                    <p>{{ entry.description }}</p>
                    <p v-if="entry.metadataSummary" class="admin-logs-item__summary">{{ entry.metadataSummary }}</p>
                    <div class="admin-logs-item__details">
                      <span class="admin-logs-item__detail">
                        <i class="bi bi-person" aria-hidden="true" />
                        {{ entry.actorLabel }}
                      </span>
                      <span class="admin-logs-item__detail">
                        <i class="bi bi-bullseye" aria-hidden="true" />
                        {{ entry.targetLabel }}
                      </span>
                      <span class="admin-logs-item__detail">
                        <i class="bi bi-hdd-network" aria-hidden="true" />
                        {{ entry.sourceLabel }}
                      </span>
                      <span class="admin-logs-item__detail admin-logs-item__detail--event">
                        <i class="bi bi-terminal" aria-hidden="true" />
                        {{ entry.eventLabel }}
                      </span>
                    </div>
                  </div>
                  <span class="admin-logs-item__time">
                    <strong>{{ entry.createdAtRelative }}</strong>
                    <small>{{ entry.createdAtLabel }}</small>
                  </span>
                </article>
              </div>

              <div v-else class="dashboard-approved-empty">
                No logs available yet.
              </div>
            </section>

            <section v-else-if="activeAdminView === 'payment-history'" class="dashboard-panel admin-payment-history-panel">
              <div class="dashboard-panel__head">
                <div>
                  <h2>Payment History</h2>
                  <p class="dashboard-panel__subcopy">Latest business subscription payments synced from admin payment records.</p>
                </div>
                <span class="dashboard-panel__pill">{{ filteredPaymentHistoryEntries.length }} records</span>
              </div>

              <div class="admin-payment-history-search-card">
                <div class="admin-payment-history-toolbar">
                  <label class="admin-payment-history-filter admin-payment-history-filter--search">
                    <span>Search</span>
                    <div class="dashboard-approved-search">
                      <i class="bi bi-search" aria-hidden="true" />
                      <input
                        v-model.trim="paymentHistorySearch"
                        type="text"
                        placeholder="Search payment history..."
                      />
                    </div>
                  </label>

                  <label class="admin-payment-history-filter admin-payment-history-filter--status">
                    <span>Status</span>
                    <div
                      class="dashboard-approved-filter admin-payment-history-status-filter"
                      :class="{ 'dashboard-approved-filter--open': isPaymentHistoryStatusDropdownOpen }"
                    >
                      <span class="dashboard-approved-filter__icon" aria-hidden="true">
                        <i class="bi bi-funnel" />
                      </span>
                      <button
                        type="button"
                        class="dashboard-approved-filter__trigger"
                        aria-haspopup="listbox"
                        :aria-expanded="isPaymentHistoryStatusDropdownOpen ? 'true' : 'false'"
                        @click="togglePaymentHistoryStatusDropdown"
                        @keydown.esc.prevent="isPaymentHistoryStatusDropdownOpen = false"
                      >
                        <span class="dashboard-approved-filter__value">{{ selectedPaymentHistoryStatusLabel }}</span>
                      </button>
                      <span class="dashboard-approved-filter__caret" aria-hidden="true" />
                      <transition name="dashboard-approved-filter-dropdown">
                        <div
                          v-if="isPaymentHistoryStatusDropdownOpen"
                          class="dashboard-approved-filter__menu"
                          role="listbox"
                          aria-label="Filter payment history by status"
                        >
                          <button
                            v-for="option in paymentHistoryStatusOptions"
                            :key="option.value"
                            type="button"
                            class="dashboard-approved-filter__option"
                            :class="{ 'dashboard-approved-filter__option--active': paymentHistoryStatusFilter === option.value }"
                            role="option"
                            :aria-selected="paymentHistoryStatusFilter === option.value ? 'true' : 'false'"
                            @click="selectPaymentHistoryStatus(option.value)"
                          >
                            <span class="dashboard-approved-filter__option-mark" aria-hidden="true" />
                            <span>{{ option.label }}</span>
                          </button>
                        </div>
                      </transition>
                    </div>
                  </label>
                </div>
              </div>

              <div v-if="filteredPaymentHistoryEntries.length" class="dashboard-approved-table-shell dashboard-payment-table-shell">
                <div class="dashboard-approved-table dashboard-payment-table">
                  <div class="dashboard-approved-table__head">
                    <span>Receipt</span>
                    <span>Business</span>
                    <span>Plan</span>
                    <span>Method</span>
                    <span>Amount</span>
                    <span>Date</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>

                  <article
                    v-for="entry in filteredPaymentHistoryEntries"
                    :key="entry.id"
                    class="dashboard-approved-row dashboard-payment-row"
                  >
                    <div class="dashboard-approved-row__id">{{ resolvePaymentReceiptLabel(entry) }}</div>

                    <div class="dashboard-approved-row__account">
                      <div
                        class="dashboard-approved-row__avatar dashboard-approved-row__avatar--business"
                      >
                        <img
                          v-if="entry.avatarUrl"
                          :src="entry.avatarUrl"
                          :alt="`${entry.buyer} avatar`"
                          class="dashboard-approved-row__avatar-image"
                        >
                        <template v-else>{{ initialsFromName(entry.buyer, 'BA') }}</template>
                      </div>

                      <div class="dashboard-approved-row__meta">
                        <div class="dashboard-approved-row__meta-top">
                          <span v-if="isRecentPaymentHistoryRecord(entry)" class="admin-row-new-badge">NEW</span>
                          <strong>{{ entry.buyer }}</strong>
                        </div>
                        <span>{{ entry.buyerEmail }}</span>
                      </div>
                    </div>

                    <div class="dashboard-approved-row__role">{{ entry.plan }}</div>
                    <div class="dashboard-approved-row__date">{{ entry.method }}</div>
                    <div class="dashboard-approved-row__date">{{ entry.amount }}</div>
                    <div class="dashboard-approved-row__date">{{ formatPaymentHistoryDateTime(entry) }}</div>
                    <div class="dashboard-approved-row__status">
                      <span class="dashboard-approved-status-pill" :class="`is-${normalizeStatusClass(entry.status)}`">{{ entry.status }}</span>
                    </div>
                    <div class="dashboard-payment-row__actions">
                      <button
                        type="button"
                        class="dashboard-payment-action-btn"
                        title="Print receipt"
                        aria-label="Print receipt"
                        @click="printAdminPaymentReceipt(entry)"
                      >
                        <i class="bi bi-printer" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                </div>
              </div>

              <div v-else class="dashboard-approved-empty">
                No payment history records match the current filter.
              </div>
            </section>
          </div>
        </transition>
      </section>
    </main>
  </section>
</template>

<style>
body[data-admin-color-mode='dark'] {
  color-scheme: dark;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='toolbar-card'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='table-shell'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-card'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__card'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-panel'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__panel'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-sheet'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__sheet'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-surface'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__surface'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-toolbar'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__toolbar'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-search'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='search-field'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-summary'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__summary'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-empty'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__empty'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-notice'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__notice'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-toast'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__toast'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-message'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__message'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-switch'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__switch'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-dropzone'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-lock'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-filter'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__details'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__editor'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__matrix'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-access'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__access'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-zone'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__access-zone'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-shell'],
body[data-admin-color-mode='dark'] [class*='-modal__panel'],
body[data-admin-color-mode='dark'] [class*='-modal__empty'] {
  background: var(--admin-bg-surface) !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--admin-border-color) !important;
  box-shadow: var(--admin-shadow-soft) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage h1,
body[data-admin-color-mode='dark'] .admin-view-stage h2,
body[data-admin-color-mode='dark'] .admin-view-stage h3,
body[data-admin-color-mode='dark'] .admin-view-stage h4,
body[data-admin-color-mode='dark'] .admin-view-stage h5,
body[data-admin-color-mode='dark'] .admin-view-stage h6,
body[data-admin-color-mode='dark'] .admin-view-stage strong,
body[data-admin-color-mode='dark'] .admin-view-stage label,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-title'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__title'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-heading'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__heading'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-label'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__label'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-value'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__value'],
body[data-admin-color-mode='dark'] [class*='-modal__copy'] strong {
  color: var(--admin-text-primary) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage p,
body[data-admin-color-mode='dark'] .admin-view-stage small,
body[data-admin-color-mode='dark'] .admin-view-stage li,
body[data-admin-color-mode='dark'] .admin-view-stage dt,
body[data-admin-color-mode='dark'] .admin-view-stage dd,
body[data-admin-color-mode='dark'] .admin-view-stage th,
body[data-admin-color-mode='dark'] .admin-view-stage td,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-copy'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__copy'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-meta'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__meta'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-detail'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__detail'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-subtitle'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__subtitle'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-subcopy'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__subcopy'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-identity'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__identity'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-summary'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-message'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-item'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-check'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-select'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-empty'],
body[data-admin-color-mode='dark'] [class*='-modal__copy'],
body[data-admin-color-mode='dark'] [class*='-modal__warning'],
body[data-admin-color-mode='dark'] [class*='-modal__error'] {
  color: var(--admin-text-secondary) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage input:not([type='checkbox']):not([type='radio']):not([type='file']),
body[data-admin-color-mode='dark'] .admin-view-stage select,
body[data-admin-color-mode='dark'] .admin-view-stage textarea,
body[data-admin-color-mode='dark'] [class*='-modal__field'] input,
body[data-admin-color-mode='dark'] [class*='-modal__field'] select,
body[data-admin-color-mode='dark'] [class*='-modal__field'] textarea {
  background: var(--admin-input-bg) !important;
  color: var(--admin-input-text) !important;
  border-color: var(--admin-input-border) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage input:not([type='checkbox']):not([type='radio']):not([type='file'])::placeholder,
body[data-admin-color-mode='dark'] .admin-view-stage textarea::placeholder,
body[data-admin-color-mode='dark'] [class*='-modal__field'] input::placeholder,
body[data-admin-color-mode='dark'] [class*='-modal__field'] textarea::placeholder {
  color: var(--admin-input-placeholder) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage input[type='checkbox'],
body[data-admin-color-mode='dark'] .admin-view-stage input[type='radio'] {
  background: var(--admin-bg-surface-muted) !important;
  border-color: var(--admin-input-border) !important;
  color: var(--admin-input-text) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage input[type='checkbox']:checked,
body[data-admin-color-mode='dark'] .admin-view-stage input[type='radio']:checked {
  background: linear-gradient(135deg, var(--admin-theme-accent) 0%, #2fa66a 100%) !important;
  border-color: var(--admin-theme-accent) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='switch-indicator'] {
  background: var(--admin-bg-surface-elevated) !important;
  border: 1px solid var(--admin-border-color) !important;
  box-shadow: var(--admin-shadow-soft) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage thead th {
  background: var(--admin-bg-surface-muted) !important;
  color: var(--admin-text-secondary) !important;
  border-color: var(--admin-border-color) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage tbody td,
body[data-admin-color-mode='dark'] .admin-view-stage tbody th,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-row'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__row'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-item'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__item'] {
  background: transparent !important;
  border-color: var(--admin-border-color) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage tbody tr:hover td,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-row']:hover,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__row']:hover,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-item']:hover,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__item']:hover {
  background: var(--admin-bg-hover) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='ghost-btn'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='filter-btn'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='action-btn'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-button'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__button'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__ghost'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__submit'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='template-button'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='tone-option'],
body[data-admin-color-mode='dark'] .admin-view-stage .admin-table-action,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__close'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__trigger'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__option'] {
  background: var(--admin-bg-surface-muted) !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--admin-border-color) !important;
  box-shadow: none !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='-pill'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__pill'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-badge'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__badge'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-chip'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__chip'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-tag'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__tag'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-status'],
body[data-admin-color-mode='dark'] .admin-view-stage span[class*='__status'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-access-head'] span,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__access-head'] span,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='-zone-head'] span,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='__zone-head'] span,
body[data-admin-color-mode='dark'] .admin-view-stage [class*='tag-action'] {
  background: var(--admin-bg-surface-muted) !important;
  color: var(--admin-text-secondary) !important;
  border-color: var(--admin-border-color) !important;
  box-shadow: none !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-active'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--selected'] {
  background: rgba(46, 154, 98, 0.18) !important;
  color: #dcfce8 !important;
  border-color: rgba(79, 194, 131, 0.34) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-approved'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-open'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--success'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--approve'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--restore'] {
  background: rgba(31, 111, 70, 0.24) !important;
  color: #bbf7d0 !important;
  border-color: rgba(74, 222, 128, 0.24) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-pending'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-closed'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-draft'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--warning'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--archive'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--neutral'] {
  background: rgba(180, 120, 24, 0.22) !important;
  color: #fde68a !important;
  border-color: rgba(245, 158, 11, 0.28) !important;
}

body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-rejected'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='is-error'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--danger'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--reject'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--remove'],
body[data-admin-color-mode='dark'] .admin-view-stage [class*='--delete'],
body[data-admin-color-mode='dark'] [class*='-modal__warning'],
body[data-admin-color-mode='dark'] [class*='-modal__error'] {
  background: rgba(153, 47, 47, 0.22) !important;
  color: #fecaca !important;
  border-color: rgba(248, 113, 113, 0.24) !important;
}

body[data-admin-color-mode='dark'] [class*='-modal__approve-icon'] {
  background: linear-gradient(135deg, rgba(31, 111, 70, 0.34), rgba(20, 83, 45, 0.9)) !important;
  color: #dcfce7 !important;
  box-shadow: none !important;
}

body[data-admin-color-mode='dark'] [class*='-modal__danger-icon'] {
  background: linear-gradient(135deg, rgba(153, 47, 47, 0.34), rgba(69, 10, 10, 0.9)) !important;
  color: #fecaca !important;
  box-shadow: none !important;
}
</style>

<style scoped>
.admin-shell {
  --admin-theme-accent: #2f6a49;
  --admin-theme-accent-soft: rgba(47, 106, 73, 0.12);
  --admin-theme-accent-border: rgba(47, 106, 73, 0.2);
  --admin-theme-shell-glow: radial-gradient(circle at top right, rgba(63, 166, 122, 0.14), transparent 28%);
  --admin-bg-shell-start: #eef8f2;
  --admin-bg-shell-mid: #f8fcf9;
  --admin-bg-shell-end: #ffffff;
  --admin-bg-content-glow: rgba(46, 154, 104, 0.08);
  --admin-bg-content-top: rgba(248, 252, 249, 0.92);
  --admin-bg-content-bottom: rgba(255, 255, 255, 0.96);
  --admin-bg-surface: #ffffff;
  --admin-bg-surface-muted: #f8fafc;
  --admin-bg-surface-elevated: rgba(255, 255, 255, 0.94);
  --admin-bg-surface-inset: rgba(248, 252, 249, 0.7);
  --admin-bg-hover: rgba(241, 245, 249, 0.96);
  --admin-bg-hover-strong: rgba(240, 247, 243, 0.95);
  --admin-bg-overlay: rgba(15, 23, 42, 0.24);
  --admin-text-primary: #172033;
  --admin-text-secondary: #64748b;
  --admin-text-muted: #8a93a5;
  --admin-border-color: rgba(223, 227, 234, 0.96);
  --admin-border-strong: rgba(213, 226, 219, 0.92);
  --admin-shadow-soft: 0 20px 40px rgba(15, 23, 42, 0.16);
  --admin-shadow-strong: 0 24px 56px rgba(15, 23, 42, 0.18);
  --admin-input-bg: #ffffff;
  --admin-input-border: rgba(223, 227, 234, 0.96);
  --admin-input-text: #172033;
  --admin-input-placeholder: #8a93a5;
  --admin-icon-color: #677188;
  --admin-density-gap: 1.5rem;
  --admin-motion-duration: 0.24s;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 252px 1fr;
  font-family: "Inter", "Segoe UI", sans-serif;
  color: var(--admin-text-primary);
  color-scheme: light;
  background:
    var(--admin-theme-shell-glow),
    linear-gradient(180deg, var(--admin-bg-shell-start) 0%, var(--admin-bg-shell-mid) 48%, var(--admin-bg-shell-end) 100%);
  transition: grid-template-columns var(--admin-motion-duration) ease;
}

.admin-shell[data-color-mode='dark'] {
  color-scheme: dark;
}

.admin-icon-button {
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.8rem;
  display: grid;
  place-items: center;
  color: var(--admin-icon-color);
  background: var(--admin-bg-surface-muted);
  cursor: pointer;
  transition:
    background-color 0.22s ease,
    color 0.22s ease,
    transform 0.22s ease;
}

.admin-icon-button:hover {
  color: var(--admin-text-primary);
  background: var(--admin-bg-hover);
  transform: translateY(-1px);
}

.admin-icon-button--small {
  width: 1.8rem;
  height: 1.8rem;
}

.admin-nav-button--utility {
  border-radius: 0.82rem;
  padding-left: 0.62rem;
  padding-right: 0.62rem;
  background: var(--admin-bg-surface-muted);
}

.admin-nav-button__badge {
  color: var(--admin-text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

@keyframes admin-submenu-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scaleY(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}


@keyframes admin-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.admin-view-enter-active,
.admin-view-leave-active {
  transition:
    opacity 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-view-enter-from,
.admin-view-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
}

.admin-view-enter-to,
.admin-view-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.admin-content {
  position: relative;
  min-width: 0;
  padding: 0;
  color: var(--admin-text-primary);
  background:
    radial-gradient(circle at top left, var(--admin-bg-content-glow), transparent 22%),
    linear-gradient(180deg, var(--admin-bg-content-top) 0%, var(--admin-bg-content-bottom) 100%);
}

.admin-navbar-shell {
  position: sticky;
  top: 0;
  z-index: 80;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--admin-border-color);
  background: var(--admin-bg-surface-elevated);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: padding var(--admin-motion-duration) ease;
}

.admin-message-modal {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: var(--admin-bg-overlay);
  backdrop-filter: blur(10px);
}

.admin-message-modal__panel {
  width: min(100%, 34rem);
  border: 1px solid var(--admin-border-color);
  border-radius: 1.35rem;
  background: linear-gradient(180deg, var(--admin-bg-surface) 0%, var(--admin-bg-surface-muted) 100%);
  box-shadow: var(--admin-shadow-strong);
  overflow: hidden;
}

.admin-message-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.2rem 1rem;
  border-bottom: 1px solid var(--admin-border-color);
}

.admin-message-modal__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  background: var(--admin-theme-accent-soft);
  color: var(--admin-theme-accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-message-modal__header h2 {
  margin: 0.44rem 0 0;
  color: var(--admin-text-primary);
  font-size: 1.28rem;
}

.admin-message-modal__header p {
  margin: 0.34rem 0 0;
  color: var(--admin-text-secondary);
  font-size: 0.84rem;
}

.admin-message-modal__close {
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 0.88rem;
  background: var(--admin-bg-surface);
  color: var(--admin-text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.admin-message-modal__body {
  display: grid;
  gap: 0.95rem;
  padding: 1.2rem;
}

.admin-message-modal__recipient {
  display: grid;
  gap: 0.18rem;
  padding: 0.92rem 1rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 1rem;
  background: var(--admin-bg-surface);
}

.admin-message-modal__recipient-label {
  color: var(--admin-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.admin-message-modal__recipient strong {
  color: var(--admin-text-primary);
  font-size: 1rem;
}

.admin-message-modal__recipient small {
  color: var(--admin-text-secondary);
  font-size: 0.8rem;
}

.admin-message-modal__field {
  display: grid;
  gap: 0.42rem;
}

.admin-message-modal__field span {
  color: var(--admin-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}

.admin-message-modal__field input,
.admin-message-modal__field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--admin-input-border);
  border-radius: 0.92rem;
  background: var(--admin-input-bg);
  color: var(--admin-input-text);
  font: inherit;
  padding: 0.78rem 0.92rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-message-modal__field textarea {
  min-height: 7.8rem;
  resize: vertical;
}

.admin-message-modal__field input:focus,
.admin-message-modal__field textarea:focus {
  outline: none;
  border-color: var(--admin-theme-accent-border);
  box-shadow: 0 0 0 3px var(--admin-theme-accent-soft);
}

.admin-message-modal__meta {
  display: flex;
  justify-content: flex-end;
  color: var(--admin-text-muted);
  font-size: 0.76rem;
}

.admin-message-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.admin-message-modal__button {
  min-height: 2.7rem;
  padding: 0 1rem;
  border-radius: 0.92rem;
  border: 1px solid var(--admin-border-color);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.admin-message-modal__button:disabled,
.admin-message-modal__close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-message-modal__button--ghost {
  background: var(--admin-bg-surface);
  color: var(--admin-text-secondary);
}

.admin-message-modal__button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--admin-theme-accent) 0%, #5b9f79 100%);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16);
}

.admin-message-modal__button:not(:disabled):hover,
.admin-message-modal__close:not(:disabled):hover {
  transform: translateY(-1px);
}

.admin-toast {
  position: fixed;
  left: 1.5rem;
  bottom: 2rem;
  z-index: 24;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  width: min(28rem, calc(100% - 1.5rem));
  transform: none;
  padding: 0.95rem 1rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 1rem;
  background: var(--admin-bg-surface-elevated);
  box-shadow: var(--admin-shadow-soft);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  gap: 0.85rem;
}

.admin-toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.96) 0%, rgba(220, 252, 231, 0.82) 100%);
  color: #16a34a;
  box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.24);
  flex: 0 0 2.5rem;
}

.admin-toast__icon i {
  font-size: 1.1rem;
  line-height: 1;
}

.admin-toast__copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.admin-toast__copy strong,
.admin-toast__copy span {
  margin: 0;
}

.admin-toast__copy strong {
  color: var(--admin-text-primary);
  font-size: 0.92rem;
  font-weight: 800;
}

.admin-toast__copy span {
  color: var(--admin-text-secondary);
  font-size: 0.78rem;
  line-height: 1.45;
}

.admin-toast__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-toast__action,
.admin-toast__close {
  border: 0;
  cursor: pointer;
}

.admin-toast__action {
  min-height: 2.45rem;
  padding: 0 0.95rem;
  border-radius: 0.9rem;
  background: linear-gradient(135deg, #2f8f61 0%, #348b63 100%);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(47, 143, 97, 0.18);
  transition: transform var(--admin-motion-duration-fast) ease, box-shadow var(--admin-motion-duration-fast) ease;
}

.admin-toast__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(47, 143, 97, 0.22);
}

.admin-toast__close {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 999px;
  background: var(--admin-bg-surface);
  color: var(--admin-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--admin-motion-duration-fast) ease,
    border-color var(--admin-motion-duration-fast) ease,
    color var(--admin-motion-duration-fast) ease,
    transform var(--admin-motion-duration-fast) ease;
}

.admin-toast__close:hover {
  background: var(--admin-bg-hover);
  border-color: var(--admin-theme-accent-border);
  color: var(--admin-theme-accent);
  transform: rotate(90deg);
}

.admin-toast-enter-active,
.admin-toast-leave-active {
  transition: opacity var(--admin-motion-duration) ease, transform var(--admin-motion-duration) ease;
}

.admin-toast-enter-from,
.admin-toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}


.dashboard-page {
  position: relative;
  display: grid;
  gap: var(--admin-density-gap);
  min-height: calc(100vh - 5rem);
  padding: var(--admin-density-page-padding);
  transition: padding var(--admin-motion-duration) ease, gap var(--admin-motion-duration) ease;
}

.admin-settings-modal {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: var(--admin-bg-overlay);
  backdrop-filter: blur(10px);
}

.admin-settings-modal__card {
  width: min(52rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border: 1px solid var(--admin-border-color);
  border-radius: 1.4rem;
  background: linear-gradient(180deg, var(--admin-bg-surface) 0%, var(--admin-bg-surface-muted) 100%);
  box-shadow: var(--admin-shadow-strong);
}

.admin-settings-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.2rem 1rem;
  border-bottom: 1px solid var(--admin-border-color);
}

.admin-settings-modal__eyebrow {
  display: inline-block;
  margin-bottom: 0.42rem;
  color: var(--admin-theme-accent);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-settings-modal__header h2 {
  margin: 0;
  color: var(--admin-text-primary);
  font-size: 1.35rem;
}

.admin-settings-modal__header p {
  margin: 0.3rem 0 0;
  color: var(--admin-text-secondary);
  font-size: 0.86rem;
}

.admin-settings-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 0.9rem;
  display: grid;
  place-items: center;
  background: var(--admin-bg-surface);
  color: var(--admin-text-secondary);
  cursor: pointer;
}

.admin-settings-modal__body {
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: 1.1rem;
  padding: 1.1rem 1.2rem 1.2rem;
}

.admin-settings-modal__nav {
  display: grid;
  gap: 0.6rem;
  align-content: start;
}

.admin-settings-modal__nav-item {
  width: 100%;
  min-height: 3rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  padding: 0.85rem 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--admin-bg-surface-muted);
  color: var(--admin-text-secondary);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.admin-settings-modal__nav-item.is-active {
  border-color: var(--admin-theme-accent-border);
  background: var(--admin-theme-accent-soft);
  color: var(--admin-theme-accent);
}

.admin-settings-section {
  display: grid;
  gap: 0.95rem;
}

.admin-settings-section__head h3 {
  margin: 0;
  color: var(--admin-text-primary);
  font-size: 1.08rem;
}

.admin-settings-section__head p {
  margin: 0.3rem 0 0;
  color: var(--admin-text-secondary);
  font-size: 0.84rem;
}

.admin-settings-toggle {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.9rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--admin-border-color);
  border-radius: 1rem;
  background: var(--admin-bg-surface);
  cursor: pointer;
}

.admin-settings-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.admin-settings-toggle__copy {
  display: grid;
  gap: 0.22rem;
}

.admin-settings-toggle__copy strong {
  color: var(--admin-text-primary);
  font-size: 0.92rem;
}

.admin-settings-toggle__copy span {
  color: var(--admin-text-secondary);
  font-size: 0.8rem;
  line-height: 1.5;
}

.admin-settings-toggle__switch {
  width: 3.3rem;
  height: 1.95rem;
  border-radius: 999px;
  position: relative;
  background: var(--admin-bg-hover);
  transition: background-color var(--admin-motion-duration) ease;
}

.admin-settings-toggle__switch::after {
  content: "";
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 999px;
  background: var(--admin-bg-surface);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
  transition: transform var(--admin-motion-duration) ease;
}

.admin-settings-toggle input:checked + .admin-settings-toggle__switch {
  background: var(--admin-theme-accent);
}

.admin-settings-toggle input:checked + .admin-settings-toggle__switch::after {
  transform: translateX(1.35rem);
}

.admin-theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.admin-theme-card {
  border: 1px solid var(--admin-border-color);
  border-radius: 1rem;
  padding: 0.82rem;
  display: grid;
  gap: 0.55rem;
  background: var(--admin-bg-surface);
  color: var(--admin-text-secondary);
  text-align: left;
  cursor: pointer;
}

.admin-theme-card.is-active {
  border-color: var(--admin-theme-accent-border);
  box-shadow: 0 0 0 3px var(--admin-theme-accent-soft);
}

.admin-theme-card__preview {
  height: 4.2rem;
  border-radius: 0.85rem;
}

.admin-theme-card strong {
  color: var(--admin-text-primary);
  font-size: 0.9rem;
}

.admin-theme-card span {
  color: var(--admin-text-secondary);
  font-size: 0.78rem;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='toolbar-card']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='table-shell']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-card']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__card']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-panel']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__panel']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-sheet']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__sheet']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-toolbar']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-search']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-summary']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-empty']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-notice']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-toast']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__toast']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-message']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__message']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-switch']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__switch']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-dropzone']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-lock']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-filter']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-surface']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__surface']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-access']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-zone']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-shell']) {
  background: var(--admin-bg-surface) !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--admin-border-color) !important;
  box-shadow: var(--admin-shadow-soft) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h1),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h2),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h3),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h4),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h5),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(h6),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(strong),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(label),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-title']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__title']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-heading']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__heading']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-label']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__label']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-value']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__value']) {
  color: var(--admin-text-primary) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(p),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(small),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(li),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(dt),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(dd),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(th),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(td),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-copy']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__copy']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-meta']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__meta']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-detail']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__detail']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-subtitle']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__subtitle']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-subcopy']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__subcopy']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-identity']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-summary']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-message']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-item']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-check']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-select']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-empty']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__identity']) {
  color: var(--admin-text-secondary) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input:not([type='checkbox']):not([type='radio']):not([type='file'])),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(select),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(textarea) {
  background: var(--admin-input-bg) !important;
  color: var(--admin-input-text) !important;
  border-color: var(--admin-input-border) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input:not([type='checkbox']):not([type='radio']):not([type='file'])::placeholder),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(textarea::placeholder) {
  color: var(--admin-input-placeholder) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input[type='checkbox']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input[type='radio']) {
  background: var(--admin-bg-surface-muted) !important;
  border-color: var(--admin-input-border) !important;
  color: var(--admin-input-text) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input[type='checkbox']:checked),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(input[type='radio']:checked) {
  background: linear-gradient(135deg, var(--admin-theme-accent) 0%, #2fa66a 100%) !important;
  border-color: var(--admin-theme-accent) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='switch-indicator']) {
  background: var(--admin-bg-surface-elevated) !important;
  border: 1px solid var(--admin-border-color) !important;
  box-shadow: var(--admin-shadow-soft) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(thead th) {
  background: var(--admin-bg-surface-muted) !important;
  color: var(--admin-text-secondary) !important;
  border-color: var(--admin-border-color) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(tbody td),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-row']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__row']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-item']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__item']) {
  background: transparent !important;
  border-color: var(--admin-border-color) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep(tbody tr:hover td),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-row']:hover),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__row']:hover),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-item']:hover),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__item']:hover) {
  background: var(--admin-bg-hover) !important;
}

.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='ghost-btn']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='filter-btn']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='action-btn']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='-button']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__button']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__ghost']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__submit']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__close']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__trigger']),
.admin-shell[data-color-mode='dark'] .admin-view-stage :deep([class*='__option']) {
  background: var(--admin-bg-surface-muted) !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--admin-border-color) !important;
}

.admin-settings-modal-enter-active,
.admin-settings-modal-leave-active {
  transition: opacity var(--admin-motion-duration) ease;
}

.admin-settings-modal-enter-active .admin-settings-modal__card,
.admin-settings-modal-leave-active .admin-settings-modal__card {
  transition:
    opacity var(--admin-motion-duration) ease,
    transform var(--admin-motion-duration) ease;
}

.admin-settings-modal-enter-from,
.admin-settings-modal-leave-to {
  opacity: 0;
}

.admin-settings-modal-enter-from .admin-settings-modal__card,
.admin-settings-modal-leave-to .admin-settings-modal__card {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.dashboard-panel,
.dashboard-summary-card {
  border: 1px solid rgba(112, 168, 136, 0.16);
  border-radius: 1.12rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 251, 247, 0.92) 100%);
  box-shadow:
    0 16px 36px rgba(79, 129, 102, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.dashboard-summary-card--enter,
.dashboard-panel--enter {
  opacity: 0;
  transform: translateY(22px);
  animation: dashboard-fade-up var(--admin-motion-duration-xl) cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--dashboard-enter-delay, 0ms);
  will-change: transform, opacity;
}

.dashboard-eyebrow,
.dashboard-panel__eyebrow {
  margin: 0 0 0.35rem;
  color: #4e7b63;
  font-size: 0.77rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.dashboard-panel h2 {
  margin: 0;
  color: #1f3a2d;
  letter-spacing: -0.03em;
}

.dashboard-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-items: stretch;
  justify-content: stretch;
  column-gap: var(--admin-density-grid-gap);
  row-gap: var(--admin-density-grid-gap);
  margin-bottom: 0.8rem;
}

.dashboard-summary-card {
  padding: var(--admin-density-card-padding);
  display: grid;
  gap: 0.62rem;
  min-height: var(--admin-density-card-min-height);
  width: 100%;
  border: 1px solid rgba(22, 28, 45, 0.08);
  border-radius: 1rem;
  background: #ffffff;
  box-shadow:
    0 1px 0 rgba(15, 23, 42, 0.03),
    0 14px 28px rgba(15, 23, 42, 0.08),
    0 4px 10px rgba(52, 109, 78, 0.04);
  transition:
    transform var(--admin-motion-duration) ease,
    box-shadow var(--admin-motion-duration) ease;
}

.dashboard-summary-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.1),
    0 6px 14px rgba(52, 109, 78, 0.06);
}

.dashboard-summary-card--emerald {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(250, 253, 251, 1) 100%);
}

.dashboard-summary-card--sky {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(249, 252, 255, 1) 100%);
}

.dashboard-summary-card--violet {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(252, 250, 255, 1) 100%);
}

.dashboard-summary-card--amber {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 251, 245, 1) 100%);
}

.dashboard-summary-card--mint {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(249, 254, 251, 1) 100%);
}

.dashboard-summary-card--rose {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 250, 250, 1) 100%);
}

.dashboard-summary-card--green {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(249, 254, 250, 1) 100%);
}

.dashboard-summary-card--slate {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(250, 251, 252, 1) 100%);
}

.dashboard-summary-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.68rem;
}

.dashboard-summary-card__label {
  color: #1f2937;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
}

.dashboard-summary-card__icon {
  width: 1.52rem;
  height: 1.52rem;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(210, 180, 140, 0.45);
  color: #d39a55;
  background: rgba(255, 250, 243, 0.95);
  font-size: 0.7rem;
  line-height: 1;
  flex-shrink: 0;
}

.dashboard-summary-card__icon.is-up {
  color: #b98549;
}

.dashboard-summary-card__icon.is-down {
  color: #c07266;
}

.dashboard-summary-card__icon.is-neutral {
  color: #ca9b60;
}

.dashboard-summary-card__value {
  color: #111827;
  font-size: 1.42rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
}

.dashboard-summary-card__body {
  display: grid;
  gap: 0.18rem;
}

.dashboard-summary-card__subtitle {
  color: #6b7280;
  font-size: 0.69rem;
  font-weight: 500;
  line-height: 1.35;
}

.dashboard-analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  align-items: stretch;
  gap: var(--admin-density-gap);
  margin-top: 0.2rem;
  margin-bottom: 1rem;
}

.dashboard-distribution-panel {
  align-self: stretch;
  justify-self: stretch;
  display: flex;
  flex-direction: column;
}

.dashboard-approved-grid {
  display: grid;
  grid-template-columns: 1fr;
  margin-top: 0.1rem;
}

.dashboard-panel {
  padding: var(--admin-density-panel-padding);
}

.dashboard-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard-panel__subcopy {
  margin: 0.22rem 0 0;
  color: #79907d;
  font-size: 0.73rem;
}

.dashboard-panel__pill {
  border-radius: 999px;
  padding: 0.34rem 0.62rem;
  background: rgba(56, 143, 101, 0.08);
  color: #3d6d57;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.dashboard-line-chart__growth-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--admin-density-grid-gap);
  margin-bottom: 0.8rem;
}

.dashboard-line-chart__growth-card {
  display: grid;
  gap: 0.18rem;
  padding: var(--admin-density-card-padding);
  border: 1px solid rgba(205, 216, 226, 0.92);
  border-radius: 1rem;
  background: #ffffff;
}

.dashboard-line-chart__growth-card.is-up {
  border-color: rgba(67, 160, 112, 0.28);
  background: linear-gradient(180deg, rgba(247, 253, 249, 1) 0%, rgba(240, 249, 244, 1) 100%);
}

.dashboard-line-chart__growth-card.is-down {
  border-color: rgba(223, 115, 134, 0.24);
  background: linear-gradient(180deg, rgba(255, 250, 250, 1) 0%, rgba(255, 245, 246, 1) 100%);
}

.dashboard-line-chart__growth-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.dashboard-line-chart__growth-value {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.dashboard-line-chart__growth-detail {
  color: #6f8277;
  font-size: 0.69rem;
  line-height: 1.45;
}

.dashboard-line-chart {
  position: relative;
  border-radius: 1rem;
  padding: var(--admin-density-card-padding);
  min-height: 17.35rem;
  border: 1px solid rgba(126, 180, 146, 0.14);
  background:
    radial-gradient(circle at top right, rgba(70, 164, 118, 0.09), transparent 26%),
    linear-gradient(180deg, rgba(252, 255, 253, 0.98) 0%, rgba(246, 252, 248, 0.92) 100%);
  overflow: hidden;
}

.dashboard-line-chart__grid {
  position: absolute;
  inset: 0.8rem 0.9rem 3rem;
  background-image:
    linear-gradient(rgba(92, 138, 112, 0.12) 1px, transparent 1px);
  background-size: 100% 25%;
}

.dashboard-line-chart__svg {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 3rem;
  height: 11.5rem;
  width: calc(100% - 2rem);
  overflow: visible;
  filter: drop-shadow(0 12px 20px rgba(31, 138, 88, 0.08));
}

.dashboard-line-chart__area-path {
  fill: rgba(36, 140, 92, 0.14);
}

.dashboard-line-chart__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dashboard-line-chart__line--registration {
  stroke: #4867ff;
  stroke-width: 3.5;
}

.dashboard-line-chart__line--approval {
  stroke: #7c3aed;
  stroke-width: 3;
}

.dashboard-line-chart__point {
  stroke: #ffffff;
  stroke-width: 2.5;
}

.dashboard-line-chart__point--registration {
  fill: #4867ff;
}

.dashboard-line-chart__point--approval {
  fill: #7c3aed;
}

.dashboard-line-chart__summary {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 12.15rem;
}

.dashboard-line-chart__summary span {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.2rem 0.1rem;
  border-radius: 999px;
  background: transparent;
  color: #6f8277;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: none;
}

.dashboard-line-chart__legend-item i {
  color: #4867ff;
  font-size: 1rem;
  line-height: 1;
}

.dashboard-line-chart__legend-item.is-approval i {
  color: #f09a4a;
}

.dashboard-line-chart__labels {
  position: relative;
  z-index: 1;
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  color: #78907d;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.dashboard-donut {
  min-height: 18rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--admin-density-gap);
}

.dashboard-donut__chart {
  position: relative;
  display: grid;
  place-items: center;
}

.dashboard-donut__status-layer {
  position: relative;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.dashboard-donut__ring {
  width: 9.5rem;
  height: 9.5rem;
  border-radius: 999px;
  background: conic-gradient(#1ca56f 0 71%, #94d3af 71% 100%);
  position: relative;
  box-shadow: 0 16px 28px rgba(71, 139, 102, 0.12);
  transform-origin: center;
  will-change: transform, opacity, filter;
}

.dashboard-donut__ring::after {
  content: "";
  position: absolute;
  inset: 1.05rem;
  border-radius: 999px;
  background: #ffffff;
}

.dashboard-donut__center {
  position: absolute;
  display: grid;
  place-items: center;
  text-align: center;
  z-index: 1;
}

.dashboard-donut__center strong {
  color: #214133;
  font-size: 1.15rem;
  line-height: 1;
}

.dashboard-donut__center span {
  margin-top: 0.18rem;
  color: #74907d;
  font-size: 0.72rem;
  font-weight: 600;
}

.dashboard-donut-status-enter-active .dashboard-donut__ring {
  animation: dashboard-donut-spin-in var(--admin-motion-duration-slow) cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-donut-status-leave-active .dashboard-donut__ring {
  animation: dashboard-donut-spin-out var(--admin-motion-duration) ease forwards;
}

.dashboard-donut-status-enter-active,
.dashboard-donut-status-leave-active {
  transition:
    opacity var(--admin-motion-duration-slow) ease,
    transform var(--admin-motion-duration-slow) ease,
    filter var(--admin-motion-duration-slow) ease;
}

.dashboard-donut-status-enter-from,
.dashboard-donut-status-leave-to {
  opacity: 0;
  transform: scale(0.96);
  filter: blur(1px);
}

@keyframes dashboard-donut-spin-in {
  0% {
    transform: rotate(-135deg) scale(0.9);
    opacity: 0.4;
    filter: saturate(0.88);
  }

  65% {
    transform: rotate(16deg) scale(1.02);
    opacity: 1;
    filter: saturate(1);
  }

  100% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
    filter: saturate(1);
  }
}

@keyframes dashboard-donut-spin-out {
  0% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }

  100% {
    transform: rotate(36deg) scale(0.97);
    opacity: 0;
  }
}

.admin-shell[data-compact-spacing='true'] .admin-navbar-shell {
  padding-left: 1.15rem;
  padding-right: 1.15rem;
}

.admin-shell[data-reduce-motion='true'] .admin-view-enter-active,
.admin-shell[data-reduce-motion='true'] .admin-view-leave-active,
.admin-shell[data-reduce-motion='true'] .admin-toast-enter-active,
.admin-shell[data-reduce-motion='true'] .admin-toast-leave-active,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-enter-active,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-leave-active,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-enter-active .admin-settings-modal__card,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-leave-active .admin-settings-modal__card,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-enter-active,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-leave-active,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-enter-active .dashboard-donut__ring,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-leave-active .dashboard-donut__ring,
.admin-shell[data-reduce-motion='true'] .dashboard-summary-card,
.admin-shell[data-reduce-motion='true'] .admin-toast__action,
.admin-shell[data-reduce-motion='true'] .admin-toast__close,
.admin-shell[data-reduce-motion='true'] .admin-icon-button,
.admin-shell[data-reduce-motion='true'] .admin-settings-toggle__switch,
.admin-shell[data-reduce-motion='true'] .admin-settings-toggle__switch::after {
  animation: none !important;
  transition-duration: 0.01ms !important;
}

.admin-shell[data-reduce-motion='true'] .admin-view-enter-from,
.admin-shell[data-reduce-motion='true'] .admin-view-leave-to,
.admin-shell[data-reduce-motion='true'] .admin-toast-enter-from,
.admin-shell[data-reduce-motion='true'] .admin-toast-leave-to,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-enter-from .admin-settings-modal__card,
.admin-shell[data-reduce-motion='true'] .admin-settings-modal-leave-to .admin-settings-modal__card,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-enter-from,
.admin-shell[data-reduce-motion='true'] .dashboard-donut-status-leave-to,
.admin-shell[data-reduce-motion='true'] .dashboard-summary-card--enter,
.admin-shell[data-reduce-motion='true'] .dashboard-panel--enter,
.admin-shell[data-reduce-motion='true'] .dashboard-summary-card:hover,
.admin-shell[data-reduce-motion='true'] .admin-toast__action:hover,
.admin-shell[data-reduce-motion='true'] .admin-toast__close:hover,
.admin-shell[data-reduce-motion='true'] .admin-icon-button:hover {
  transform: none !important;
  filter: none !important;
}

.dashboard-donut__legend {
  width: 100%;
  display: grid;
  gap: 0.48rem;
}

.dashboard-donut__legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  color: #6a8573;
  font-size: 0.78rem;
  font-weight: 600;
}

.dashboard-donut__swatch {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
}


.dashboard-approved-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-bottom: 0.9rem;
}

.dashboard-approved-search {
  min-width: 0;
  flex: 1;
  max-width: 26rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0 0.85rem;
  min-height: 2.8rem;
  border: 1px solid rgba(206, 211, 220, 0.82);
  border-radius: 0.85rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dashboard-approved-search i {
  color: #8b95a7;
  font-size: 0.84rem;
}

.dashboard-approved-search:hover {
  border-color: #c9d8ce;
  box-shadow: 0 14px 28px rgba(27, 138, 84, 0.08);
}

.dashboard-approved-search:focus-within {
  border-color: #1f7a3f;
  box-shadow:
    0 0 0 4px rgba(31, 122, 63, 0.12),
    0 16px 30px rgba(27, 138, 84, 0.12);
}

.dashboard-approved-search input,
.dashboard-approved-filter__trigger {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #253042;
  font: inherit;
}

.dashboard-approved-search input::placeholder {
  color: #9aa4b5;
}

.dashboard-approved-filter {
  position: relative;
  width: 11rem;
  flex-shrink: 0;
}

.dashboard-approved-filter--open {
  z-index: 12;
}

.dashboard-approved-filter__icon {
  position: absolute;
  top: 50%;
  left: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  color: #718096;
  transform: translateY(-50%);
  pointer-events: none;
}

.dashboard-approved-filter__icon i {
  font-size: 0.82rem;
  line-height: 1;
}

.dashboard-approved-filter__caret {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 0.72rem;
  height: 0.72rem;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  transform: translateY(-58%) rotate(45deg);
  transition: transform 0.2s ease, border-color 0.2s ease;
  pointer-events: none;
}

.dashboard-approved-filter__trigger {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.8rem;
  padding: 0.55rem 2.6rem 0.55rem 2.55rem;
  border: 1px solid #d7e0e9;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
  text-align: left;
}

.dashboard-approved-filter__value {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-approved-filter:hover .dashboard-approved-filter__trigger {
  border-color: #bdd6c7;
  box-shadow: 0 14px 28px rgba(27, 138, 84, 0.08);
}

.dashboard-approved-filter:hover .dashboard-approved-filter__caret {
  border-color: #1b8a54;
}

.dashboard-approved-filter:focus-within .dashboard-approved-filter__trigger,
.dashboard-approved-filter--open .dashboard-approved-filter__trigger {
  border-color: #1f7a3f;
  box-shadow:
    0 0 0 4px rgba(31, 122, 63, 0.12),
    0 16px 30px rgba(27, 138, 84, 0.12);
}

.dashboard-approved-filter:focus-within .dashboard-approved-filter__icon {
  color: #1b8a54;
}

.dashboard-approved-filter:focus-within .dashboard-approved-filter__caret {
  border-color: #1b8a54;
  transform: translateY(-34%) rotate(225deg);
}

.dashboard-approved-filter--open .dashboard-approved-filter__caret {
  border-color: #1b8a54;
  transform: translateY(-34%) rotate(225deg);
}

.dashboard-approved-filter__menu {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: 0.35rem;
  padding: 0.55rem;
  border: 1px solid #d7e6dd;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 22px 40px rgba(23, 35, 29, 0.14);
}

.dashboard-approved-filter__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.78rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #ffffff;
  color: #21313c;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.dashboard-approved-filter__option:hover {
  transform: translateX(2px);
  border-color: #cfe1d6;
  background: #f4fbf7;
}

.dashboard-approved-filter__option--active {
  border-color: rgba(27, 138, 84, 0.24);
  background: linear-gradient(135deg, rgba(27, 138, 84, 0.12) 0%, rgba(27, 138, 84, 0.04) 100%);
  box-shadow: inset 0 0 0 1px rgba(27, 138, 84, 0.06);
  color: #14543a;
}

.dashboard-approved-filter__option-mark {
  width: 0.72rem;
  height: 0.72rem;
  flex: 0 0 auto;
  border: 2px solid #c4d2c9;
  border-radius: 999px;
  background: #ffffff;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-approved-filter__option--active .dashboard-approved-filter__option-mark {
  border-color: #1b8a54;
  background: #1b8a54;
  box-shadow: 0 0 0 3px rgba(27, 138, 84, 0.16);
}

.dashboard-approved-filter-dropdown-enter-active,
.dashboard-approved-filter-dropdown-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.dashboard-approved-filter-dropdown-enter-from,
.dashboard-approved-filter-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dashboard-approved-table-shell {
  overflow: hidden;
  border: 1px solid rgba(223, 227, 234, 0.96);
  border-radius: 1rem;
  background: #ffffff;
}

.dashboard-approved-table {
  display: grid;
}

.dashboard-approved-table__head,
.dashboard-approved-row {
  display: grid;
  grid-template-columns: 140px minmax(260px, 1.5fr) 140px 140px 130px;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1rem;
}

.dashboard-approved-table__head {
  border-bottom: 1px solid rgba(223, 227, 234, 0.96);
  background: #fcfcfd;
  color: #5f6b7d;
  font-size: 0.78rem;
  font-weight: 700;
}

.dashboard-approved-row {
  border-bottom: 1px solid rgba(239, 241, 245, 0.96);
  transition: background-color 0.2s ease;
}

.dashboard-approved-row:last-child {
  border-bottom: 0;
}

.dashboard-approved-row:hover {
  background: #fafbfd;
}

.dashboard-approved-row__id {
  color: #737f90;
  font-size: 0.79rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-approved-row__account {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.dashboard-approved-row__avatar {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  overflow: hidden;
}

.dashboard-approved-row__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dashboard-approved-row__avatar--applicant {
  border-radius: 0.7rem;
  border: 1px solid rgba(44, 138, 98, 0.18);
  background: linear-gradient(135deg, #2c8a62 0%, #8fd0ad 100%);
  box-shadow: 0 8px 18px rgba(44, 138, 98, 0.16);
}

.dashboard-approved-row__avatar--business {
  border-radius: 0.7rem;
  border: 1px solid rgba(53, 90, 168, 0.18);
  background: linear-gradient(135deg, #355aa8 0%, #7fa2eb 100%);
  box-shadow: 0 8px 18px rgba(53, 90, 168, 0.16);
}

.dashboard-approved-row__meta {
  min-width: 0;
  display: grid;
  gap: 0.14rem;
}

.dashboard-approved-row__meta-top {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.42rem;
}

.dashboard-approved-row__meta-top strong {
  min-width: 0;
}

.dashboard-approved-row__meta strong {
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-approved-row__meta span {
  color: #7b8798;
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-approved-row__role,
.dashboard-approved-row__date {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
}

.dashboard-approved-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.34rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(249, 115, 22, 0.12);
  background: rgba(249, 115, 22, 0.08);
  color: #d97706;
  font-size: 0.74rem;
  font-weight: 700;
}

.dashboard-approved-status-pill.is-approved {
  border-color: #cfe6d7;
  background: linear-gradient(180deg, #ffffff 0%, #eef8f2 100%);
  color: #1f6f46;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.dashboard-approved-status-pill.is-paid,
.dashboard-approved-status-pill.is-completed {
  background: rgba(31, 138, 88, 0.12);
  color: #1f8a58;
}

.dashboard-approved-status-pill.is-trial-active {
  background: rgba(53, 90, 168, 0.12);
  color: #355aa8;
}

.dashboard-approved-status-pill.is-pending {
  background: rgba(240, 154, 74, 0.14);
  color: #be7b39;
}

.dashboard-approved-status-pill.is-failed {
  background: rgba(223, 115, 134, 0.12);
  color: #bf5f72;
}

.dashboard-approved-empty {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(247, 251, 248, 0.92);
  color: #6e8578;
  font-size: 0.86rem;
}

.admin-workspace-members-stack {
  display: grid;
  gap: 1.15rem;
}

.admin-workspace-members-panel,
.admin-workspace-member-logs-panel {
  display: grid;
  gap: 1rem;
}

.admin-workspace-members-toolbar {
  align-items: end;
}

.admin-workspace-members-select {
  display: grid;
  gap: 0.4rem;
  min-width: 14rem;
}

.admin-workspace-members-select span {
  color: #5d7466;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.admin-workspace-members-select select {
  min-height: 3rem;
  padding: 0.72rem 0.95rem;
  border: 1px solid rgba(205, 219, 212, 0.98);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
  color: #24362c;
  font-size: 0.92rem;
  font-weight: 600;
}

.admin-workspace-members-select select:focus {
  outline: none;
  border-color: rgba(73, 122, 91, 0.55);
  box-shadow: 0 0 0 4px rgba(69, 125, 90, 0.12);
}

.admin-workspace-members-table .dashboard-approved-table__head,
.admin-workspace-members-row {
  grid-template-columns: minmax(5rem, 0.7fr) minmax(13rem, 1.2fr) minmax(13rem, 1.15fr) minmax(8rem, 0.8fr) minmax(16rem, 1.6fr) minmax(8.5rem, 0.85fr);
}

.admin-workspace-members-row__activity {
  display: grid;
  gap: 0.28rem;
  min-width: 0;
}

.admin-workspace-members-row__activity strong {
  color: #233429;
  font-size: 0.88rem;
}

.admin-workspace-members-row__activity span {
  color: #607167;
  font-size: 0.8rem;
  line-height: 1.45;
}

.admin-payment-history-panel {
  display: grid;
  gap: 1rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.admin-payment-history-search-card {
  border: 1px solid rgba(223, 227, 234, 0.96);
  border-radius: 1.25rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.96);
}

.admin-payment-history-toolbar {
  display: flex;
  align-items: end;
  gap: 0.9rem;
}

.admin-payment-history-filter {
  display: grid;
  gap: 0.38rem;
}

.admin-payment-history-filter span {
  color: #5c7b69;
  font-size: 0.76rem;
  font-weight: 700;
}

.admin-payment-history-filter--search {
  flex: 1;
  min-width: 0;
}

.admin-payment-history-filter--status {
  width: 12rem;
  flex-shrink: 0;
}

.admin-payment-history-status-filter {
  width: 100%;
}

.admin-payment-history-filter .dashboard-approved-search,
.admin-payment-history-filter .dashboard-approved-filter {
  max-width: none;
  width: 100%;
}

.dashboard-payment-table-shell {
  border: 1px solid rgba(223, 227, 234, 0.96);
  border-radius: 1.25rem;
  background: #ffffff;
}

.dashboard-payment-table .dashboard-approved-table__head,
.dashboard-payment-row {
  grid-template-columns: 140px minmax(240px, 1.5fr) 140px 120px 110px 150px 120px 110px;
}

.dashboard-payment-row__actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.28rem;
}

.dashboard-payment-action-btn {
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid rgba(122, 179, 145, 0.18);
  border-radius: 0.82rem;
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #2b5540;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.dashboard-payment-action-btn i {
  font-size: 0.95rem;
}

.dashboard-payment-action-btn:hover {
  transform: translateY(-1px);
  background: #ffffff;
  color: #2b5540;
  border-color: rgba(47, 106, 73, 0.26);
  box-shadow: 0 12px 20px rgba(31, 74, 51, 0.08);
}

.admin-logs-panel {
  display: grid;
  gap: 1rem;
}

.admin-logs-list {
  display: grid;
  gap: 0.85rem;
}

.admin-logs-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.9rem;
  align-items: start;
  padding: 1rem 1.05rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.admin-logs-item--notification {
  border-color: #d9e7ff;
  background: linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%);
}

.admin-logs-item--payment {
  border-color: #d8eadf;
  background: linear-gradient(180deg, #ffffff 0%, #f2fbf5 100%);
}

.admin-logs-item--danger {
  border-color: #f0d7d7;
  background: linear-gradient(180deg, #ffffff 0%, #fff6f6 100%);
}

.admin-logs-item__badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.8rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 0.74rem;
  font-weight: 800;
}

.admin-logs-item__body {
  display: grid;
  gap: 0.32rem;
}

.admin-logs-item__title-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.admin-row-new-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.35rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  color: #18794e;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}

.admin-logs-item__body strong {
  color: #172033;
  font-size: 0.96rem;
}

.admin-logs-item__body p {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.55;
}

.admin-logs-item__summary {
  color: #475569;
  font-size: 0.8rem;
}

.admin-logs-item__details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.2rem;
}

.admin-logs-item__detail {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.34rem 0.55rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #475569;
  font-size: 0.76rem;
  font-weight: 700;
}

.admin-logs-item__detail .bi {
  color: #64748b;
}

.admin-logs-item__detail--event {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.admin-logs-item__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  min-height: 1.85rem;
  padding: 0 0.72rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.admin-logs-item__status--notification {
  background: #e8f1ff;
  color: #315ea8;
}

.admin-logs-item__status--payment {
  background: #e8f7ee;
  color: #2d7a4b;
}

.admin-logs-item__status--danger {
  background: #fdecec;
  color: #b24a4a;
}

.admin-logs-item__time {
  display: grid;
  justify-items: end;
  gap: 0.15rem;
  color: #94a3b8;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.admin-logs-item__time strong {
  color: #475569;
  font-size: 0.76rem;
}

.admin-logs-item__time small {
  font-size: 0.72rem;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .admin-logs-item {
    grid-template-columns: 1fr;
  }

  .admin-logs-item__title-row {
    flex-wrap: wrap;
  }

  .admin-logs-item__time {
    justify-items: start;
    white-space: normal;
  }
}

@keyframes dashboard-fade-up {
  0% {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1380px) {
  .dashboard-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .admin-shell {
    grid-template-columns: 236px 1fr;
  }

  .dashboard-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-content {
    display: block;
    padding: 0;
  }

  .admin-navbar-shell {
    padding: 0 1rem;
  }

  .admin-toast {
    top: auto;
    left: 1rem;
    right: auto;
    bottom: 1rem;
    width: calc(100vw - 2rem);
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .admin-toast__actions {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-panel__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-summary-grid,
  .dashboard-analytics-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-line-chart__growth-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-page {
    padding: 1rem;
  }

  .dashboard-approved-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-payment-history-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-payment-history-filter--status {
    width: 100%;
  }

  .dashboard-approved-filter {
    width: 100%;
  }

  .dashboard-approved-table-shell {
    overflow-x: auto;
  }

  .dashboard-approved-table {
    min-width: 860px;
  }
}

@media (max-width: 768px) {
  .admin-navbar-shell {
    padding: 0 0.9rem;
  }

  .dashboard-page {
    gap: 0.9rem;
    padding: 0.9rem;
  }
}

@media (max-width: 640px) {
  .admin-navbar-shell {
    padding: 0 0.8rem;
  }

  .dashboard-page {
    padding: 0.8rem;
  }

  .admin-toast {
    left: 0.8rem;
    bottom: 0.8rem;
    width: calc(100vw - 1.6rem);
    padding: 0.82rem 0.88rem;
  }
}
</style>
