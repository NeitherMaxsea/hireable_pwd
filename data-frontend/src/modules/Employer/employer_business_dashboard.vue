<script setup>
import { computed, onErrorCaptured, ref } from 'vue'
import { useRouter } from 'vue-router'
import BusinessWorkspaceFlow from '@/modules/Employer/Business/business-flow.vue'
import { clearAuthSession, getStoredAuthUser } from '@/lib/auth'

const router = useRouter()
const workspaceError = ref('')
const BUSINESS_WORKSPACE_AUTO_RECOVERY_KEY = 'businessWorkspaceAutoRecovery'
const workspaceRenderKey = ref(0)
const storedUser = computed(() => getStoredAuthUser())
const businessName = computed(() =>
  String(storedUser.value?.company_name || storedUser.value?.name || 'Business Workspace').trim() || 'Business Workspace',
)
const businessEmail = computed(() =>
  String(storedUser.value?.email || storedUser.value?.business_contact_email || '').trim().toLowerCase(),
)
const workspaceErrorMessage = computed(() => {
  const normalizedMessage = String(workspaceError.value || '').trim()
  if (!normalizedMessage) return 'The workspace could not finish loading.'
  if (normalizedMessage.includes("reading 'value'")) {
    return 'The workspace hit a temporary loading problem. Reload the workspace to continue.'
  }

  return 'The workspace could not finish loading. Reload the workspace to continue.'
})

const recoverBusinessWorkspace = () => {
  workspaceError.value = ''
  workspaceRenderKey.value += 1
}

onErrorCaptured((error, instance, info) => {
  console.error('[employer-business-dashboard] workspace render failed:', error, info)
  const normalizedErrorMessage = error instanceof Error ? String(error.message || '').trim() : ''

  if (
    typeof window !== 'undefined'
    && normalizedErrorMessage
    && (
      normalizedErrorMessage.includes("reading 'visible'")
      || normalizedErrorMessage.includes("reading 'value'")
    )
    && sessionStorage.getItem(BUSINESS_WORKSPACE_AUTO_RECOVERY_KEY) !== '1'
  ) {
    sessionStorage.setItem(BUSINESS_WORKSPACE_AUTO_RECOVERY_KEY, '1')
    recoverBusinessWorkspace()
    return false
  }

  workspaceError.value =
    error instanceof Error
      ? error.message || 'The business workspace could not load.'
      : 'The business workspace could not load.'
  return false
})

const reloadWorkspace = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(BUSINESS_WORKSPACE_AUTO_RECOVERY_KEY)
    recoverBusinessWorkspace()
  }
}

const goToLogin = async () => {
  sessionStorage.removeItem(BUSINESS_WORKSPACE_AUTO_RECOVERY_KEY)
  clearAuthSession()
  sessionStorage.setItem('showLoggedOutToast', '1')
  await router.replace('/login')
}
</script>

<template>
  <BusinessWorkspaceFlow v-if="!workspaceError" :key="workspaceRenderKey" />

  <section v-else class="business-dashboard-fallback">
    <article class="business-dashboard-fallback__card">
      <span class="business-dashboard-fallback__eyebrow">Business Workspace</span>
      <h1>{{ businessName }}</h1>
      <p v-if="businessEmail" class="business-dashboard-fallback__email">{{ businessEmail }}</p>
      <strong>The business page hit a loading error.</strong>
      <p class="business-dashboard-fallback__copy">
        The workspace could not finish loading. Try reloading the workspace first.
      </p>
      <p class="business-dashboard-fallback__error">{{ workspaceErrorMessage }}</p>
      <div class="business-dashboard-fallback__actions">
        <button type="button" class="business-dashboard-fallback__button business-dashboard-fallback__button--primary" @click="reloadWorkspace">
          Reload Workspace
        </button>
        <button type="button" class="business-dashboard-fallback__button business-dashboard-fallback__button--secondary" @click="goToLogin">
          Back to Login
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.business-dashboard-fallback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: linear-gradient(180deg, #f4f8f4 0%, #fbfdfb 100%);
}

.business-dashboard-fallback__card {
  width: min(34rem, 100%);
  display: grid;
  gap: 0.85rem;
  padding: 1.75rem;
  border: 1px solid rgba(196, 212, 201, 0.92);
  border-radius: 24px;
  background: #ffffff;
  color: #1d3025;
  box-shadow: 0 24px 50px rgba(22, 40, 30, 0.08);
}

.business-dashboard-fallback__eyebrow {
  color: #5f7a6b;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.business-dashboard-fallback__card h1 {
  margin: 0;
  font-size: clamp(1.6rem, 2.6vw, 2.1rem);
}

.business-dashboard-fallback__email {
  margin: -0.35rem 0 0;
  color: #668071;
  font-size: 0.95rem;
}

.business-dashboard-fallback__copy {
  margin: 0;
  color: #52665a;
  line-height: 1.55;
}

.business-dashboard-fallback__error {
  margin: 0;
  padding: 0.85rem 0.95rem;
  border-radius: 16px;
  background: #f4f8f5;
  color: #365140;
  line-height: 1.5;
  word-break: break-word;
}

.business-dashboard-fallback__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.business-dashboard-fallback__button {
  min-height: 2.8rem;
  padding: 0.72rem 1.1rem;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.business-dashboard-fallback__button--primary {
  background: #1f7448;
  color: #ffffff;
}

.business-dashboard-fallback__button--secondary {
  background: #edf5f0;
  color: #1f4f34;
}
</style>
