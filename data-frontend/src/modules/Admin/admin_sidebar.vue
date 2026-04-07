<script setup>
defineProps({
  logoSrc: {
    type: String,
    default: '',
  },
  wordmarkSrc: {
    type: String,
    default: '',
  },
  primaryItems: {
    type: Array,
    default: () => [],
  },
  userManagementItems: {
    type: Array,
    default: () => [],
  },
  userManagementBadge: {
    type: String,
    default: '',
  },
  paymentManagementItems: {
    type: Array,
    default: () => [],
  },
  paymentManagementBadge: {
    type: String,
    default: '',
  },
  jobManagementItems: {
    type: Array,
    default: () => [],
  },
  jobManagementBadge: {
    type: String,
    default: '',
  },
  storageManagementItems: {
    type: Array,
    default: () => [],
  },
  secondaryItems: {
    type: Array,
    default: () => [],
  },
  activeView: {
    type: String,
    default: 'dashboard',
  },
  userManagementOpen: {
    type: Boolean,
    default: false,
  },
  paymentManagementOpen: {
    type: Boolean,
    default: false,
  },
  jobManagementOpen: {
    type: Boolean,
    default: false,
  },
  storageManagementOpen: {
    type: Boolean,
    default: false,
  },
  profileName: {
    type: String,
    default: 'Admin User',
  },
  profileEmail: {
    type: String,
    default: 'admin@gmail.com',
  },
  profileInitials: {
    type: String,
    default: 'AU',
  },
})

defineEmits([
  'set-view',
  'open-setting',
  'toggle-user-management',
  'toggle-payment-management',
  'toggle-job-management',
  'toggle-storage-management',
])
</script>

<template>
  <aside class="admin-sidebar" aria-label="Admin sidebar">
    <div class="admin-brand-row">
      <div class="admin-brand">
        <span class="admin-brand__mark">
          <img :src="logoSrc" alt="PWD logo" class="admin-brand__mark-image" />
        </span>
        <span class="admin-brand__copy">
          <img :src="wordmarkSrc" alt="PWD Jobs" class="admin-brand__wordmark" />
          <small class="admin-brand__subtext">Admin Operations</small>
        </span>
      </div>
    </div>

    <div class="admin-section-label admin-section-label--headline">Workspace</div>

    <nav class="admin-link-group" aria-label="Main navigation">
      <button
        v-for="item in primaryItems"
        :key="item.key || item.label"
        class="admin-nav-button"
        :class="{ 'is-active': activeView === (item.key || 'dashboard') }"
        type="button"
        @click="$emit('set-view', item.key || 'dashboard')"
      >
        <span class="admin-nav-button__left">
          <i :class="item.icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </span>
        <span v-if="item.badge" class="admin-nav-button__badge">{{ item.badge }}</span>
      </button>

      <div class="admin-dropdown-group">
        <button
          class="admin-nav-button admin-nav-button--dropdown"
          :class="{ 'is-active-soft': userManagementItems.some((item) => item.key === activeView) }"
          type="button"
          :aria-expanded="userManagementOpen ? 'true' : 'false'"
          @click="$emit('toggle-user-management')"
        >
          <span class="admin-nav-button__left">
            <i class="bi bi-people-fill" aria-hidden="true" />
            <span>User Management</span>
          </span>
          <span class="admin-nav-button__right">
            <span v-if="userManagementBadge" class="admin-nav-button__badge">{{ userManagementBadge }}</span>
            <span class="admin-nav-button__chevron" :class="{ 'is-open': userManagementOpen }">
              <i class="bi bi-chevron-down" aria-hidden="true" />
            </span>
          </span>
        </button>

        <Transition name="admin-submenu-collapse">
          <div v-if="userManagementOpen" class="admin-submenu" aria-label="User management submenu">
            <button
              v-for="item in userManagementItems"
              :key="item.label"
              class="admin-submenu__item"
              :class="{ 'is-active': activeView === item.key }"
              type="button"
              @click="$emit('set-view', item.key)"
            >
              <span class="admin-nav-button__left">
                <i :class="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
              <span v-if="item.badge" class="admin-nav-button__badge">{{ item.badge }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <div class="admin-dropdown-group">
        <button
          class="admin-nav-button admin-nav-button--dropdown"
          :class="{ 'is-active-soft': paymentManagementItems.some((item) => item.key === activeView) }"
          type="button"
          :aria-expanded="paymentManagementOpen ? 'true' : 'false'"
          @click="$emit('toggle-payment-management')"
        >
          <span class="admin-nav-button__left">
            <i class="bi bi-wallet2" aria-hidden="true" />
            <span>Subscription Management</span>
          </span>
          <span class="admin-nav-button__right">
            <span v-if="paymentManagementBadge" class="admin-nav-button__badge">{{ paymentManagementBadge }}</span>
            <span class="admin-nav-button__chevron" :class="{ 'is-open': paymentManagementOpen }">
              <i class="bi bi-chevron-down" aria-hidden="true" />
            </span>
          </span>
        </button>

        <Transition name="admin-submenu-collapse">
          <div v-if="paymentManagementOpen" class="admin-submenu" aria-label="Payment management submenu">
            <button
              v-for="item in paymentManagementItems"
              :key="item.label"
              class="admin-submenu__item"
              :class="{ 'is-active': activeView === item.key }"
              type="button"
              @click="$emit('set-view', item.key)"
            >
              <span class="admin-nav-button__left">
                <i :class="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
              <span v-if="item.badge" class="admin-nav-button__badge">{{ item.badge }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <div class="admin-dropdown-group">
        <button
          class="admin-nav-button admin-nav-button--dropdown"
          :class="{ 'is-active-soft': jobManagementItems.some((item) => item.key === activeView) }"
          type="button"
          :aria-expanded="jobManagementOpen ? 'true' : 'false'"
          @click="$emit('toggle-job-management')"
        >
          <span class="admin-nav-button__left">
            <i class="bi bi-briefcase-fill" aria-hidden="true" />
            <span>Job Management</span>
          </span>
          <span class="admin-nav-button__right">
            <span v-if="jobManagementBadge" class="admin-nav-button__badge">{{ jobManagementBadge }}</span>
            <span class="admin-nav-button__chevron" :class="{ 'is-open': jobManagementOpen }">
              <i class="bi bi-chevron-down" aria-hidden="true" />
            </span>
          </span>
        </button>

        <Transition name="admin-submenu-collapse">
          <div v-if="jobManagementOpen" class="admin-submenu" aria-label="Job management submenu">
            <button
              v-for="item in jobManagementItems"
              :key="item.label"
              class="admin-submenu__item"
              :class="{ 'is-active': activeView === item.key }"
              type="button"
              @click="$emit('set-view', item.key)"
            >
              <span class="admin-nav-button__left">
                <i :class="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
              <span v-if="item.badge" class="admin-nav-button__badge">{{ item.badge }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <div class="admin-dropdown-group">
        <button
          class="admin-nav-button admin-nav-button--dropdown"
          :class="{ 'is-active-soft': storageManagementItems.some((item) => item.key === activeView) }"
          type="button"
          :aria-expanded="storageManagementOpen ? 'true' : 'false'"
          @click="$emit('toggle-storage-management')"
        >
          <span class="admin-nav-button__left">
            <i class="bi bi-hdd-network" aria-hidden="true" />
            <span>Storage Management</span>
          </span>
          <span class="admin-nav-button__chevron" :class="{ 'is-open': storageManagementOpen }">
            <i class="bi bi-chevron-down" aria-hidden="true" />
          </span>
        </button>

        <Transition name="admin-submenu-collapse">
          <div v-if="storageManagementOpen" class="admin-submenu" aria-label="Storage management submenu">
            <button
              v-for="item in storageManagementItems"
              :key="item.label"
              class="admin-submenu__item"
              :class="{ 'is-active': activeView === item.key }"
              type="button"
              @click="$emit('set-view', item.key)"
            >
              <span class="admin-nav-button__left">
                <i :class="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
            </button>
          </div>
        </Transition>
      </div>

    </nav>

    <div class="admin-sidebar__spacer" />

    <div v-if="secondaryItems.length" class="admin-sidebar__secondary">
      <div class="admin-section-label">Quick Access</div>
      <div class="admin-link-group admin-link-group--secondary">
        <button
          v-for="item in secondaryItems"
          :key="item.key || item.label"
          class="admin-nav-button admin-nav-button--secondary"
          :class="{ 'is-active': item.key === 'logs' && activeView === 'logs' }"
          type="button"
          @click="item.key === 'settings' ? $emit('open-setting') : $emit('set-view', item.key || 'dashboard')"
        >
          <span class="admin-nav-button__left">
            <i :class="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </span>
          <span v-if="item.badge" class="admin-nav-button__badge">{{ item.badge }}</span>
        </button>
      </div>
    </div>

    <section class="admin-sidebar-profile" aria-label="Sidebar profile">
      <div class="admin-sidebar-profile__avatar">{{ profileInitials }}</div>
      <div class="admin-sidebar-profile__meta">
        <strong>{{ profileName }}</strong>
        <span>{{ profileEmail }}</span>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.74rem 0.54rem 0.5rem;
  background: linear-gradient(180deg, var(--admin-bg-surface) 0%, var(--admin-bg-surface-muted) 100%);
  border-right: 1px solid var(--admin-border-color);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  transition: padding 0.22s ease, gap 0.22s ease;
}

.admin-brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.56rem;
  padding: 0.04rem 0.12rem 0.1rem;
}

.admin-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.68rem;
  min-width: 0;
}

.admin-brand__mark {
  width: 2.72rem;
  height: 2.72rem;
  display: grid;
  place-items: center;
}

.admin-brand__mark-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.admin-brand__copy {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
}

.admin-brand__wordmark {
  width: auto;
  height: 1.22rem;
  object-fit: contain;
  object-position: left center;
}

.admin-brand__subtext {
  color: var(--admin-text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
}

.admin-link-group {
  display: grid;
  gap: 0.14rem;
  padding: 0.04rem 0;
}

.admin-section-label {
  padding: 0.04rem 0.4rem 0.12rem;
  color: var(--admin-text-secondary);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-section-label--headline {
  padding-top: 0;
}

.admin-nav-button {
  min-height: 1.96rem;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 0.76rem;
  padding: 0.42rem 0.54rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.42rem;
  background: transparent;
  color: var(--admin-text-primary);
  font-size: 0.79rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    background-color 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    color 0.24s ease,
    transform 0.24s ease;
}

.admin-nav-button:hover {
  background: var(--admin-bg-hover);
  box-shadow: none;
  transform: translateX(2px);
}

.admin-nav-button.is-active {
  border-color: var(--admin-theme-accent-border);
  background: linear-gradient(135deg, var(--admin-theme-accent-soft) 0%, var(--admin-bg-surface) 100%);
  box-shadow: var(--admin-shadow-soft);
  color: var(--admin-theme-accent);
  transform: translateX(0);
}

.admin-nav-button.is-active .admin-nav-button__left i,
.admin-nav-button.is-active .admin-nav-button__left span {
  color: var(--admin-theme-accent);
}

.admin-nav-button.is-active-soft {
  background: var(--admin-bg-hover);
  color: var(--admin-text-primary);
}

.admin-nav-button.is-active-soft .admin-nav-button__left i,
.admin-nav-button.is-active-soft .admin-nav-button__left span,
.admin-nav-button.is-active-soft .admin-nav-button__chevron {
  color: var(--admin-text-primary);
}

.admin-nav-button--dropdown {
  width: 100%;
  padding-left: 0.54rem;
  padding-right: 0.52rem;
  font-size: 0.77rem;
}

.admin-nav-button__left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.46rem;
  min-width: 0;
  flex: 1;
  text-align: left;
}

.admin-nav-button__left span {
  min-width: 0;
  flex: 1 1 auto;
  line-height: 1.12;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-nav-button__left i {
  font-size: 0.8rem;
  color: var(--admin-text-secondary);
  flex: 0 0 auto;
}

.admin-nav-button__right {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 auto;
}

.admin-nav-button__badge {
  min-width: 1.4rem;
  padding: 0.14rem 0.42rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--admin-theme-accent) 14%, transparent);
  color: var(--admin-theme-accent);
  border: 1px solid color-mix(in srgb, var(--admin-theme-accent) 24%, transparent);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  flex: 0 0 auto;
}

.admin-nav-button__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--admin-text-secondary);
  flex: 0 0 auto;
  transition: transform 0.2s ease;
}

.admin-nav-button__chevron.is-open {
  transform: rotate(180deg);
}

.admin-dropdown-group {
  display: grid;
  gap: 0.1rem;
  width: 100%;
}

.admin-submenu {
  position: relative;
  display: grid;
  gap: 0.08rem;
  margin-left: 0.68rem;
  padding: 0.08rem 0 0.12rem 1.15rem;
  transform-origin: top;
  overflow: hidden;
}

.admin-submenu::before {
  content: '';
  position: absolute;
  left: 0.36rem;
  top: 0.28rem;
  bottom: 0.42rem;
  width: 1.5px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent 0%, var(--admin-border-strong) 18%, var(--admin-border-color) 82%, transparent 100%);
}

.admin-submenu__item {
  position: relative;
  min-height: 1.78rem;
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 0.68rem;
  padding: 0.36rem 0.54rem 0.36rem 0.92rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  color: var(--admin-text-primary);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    background-color 0.24s ease,
    color 0.24s ease,
    transform 0.24s ease,
    box-shadow 0.24s ease;
  box-shadow: none;
}

.admin-submenu__item:hover {
  background: var(--admin-bg-hover);
  color: var(--admin-text-primary);
  transform: translateX(2px);
  box-shadow: none;
}

.admin-submenu__item.is-active {
  background: linear-gradient(135deg, var(--admin-theme-accent-soft) 0%, var(--admin-bg-surface) 100%);
  color: var(--admin-theme-accent);
  box-shadow: none;
}

.admin-submenu__item.is-active .admin-nav-button__left i,
.admin-submenu__item.is-active .admin-nav-button__left span {
  color: var(--admin-theme-accent);
}

.admin-submenu__item .admin-nav-button__left i {
  font-size: 0.76rem;
}

.admin-submenu__item:hover .admin-nav-button__left i,
.admin-submenu__item:hover .admin-nav-button__left span {
  color: var(--admin-text-primary);
}

.admin-sidebar__spacer {
  flex: 1 1 auto;
  min-height: 0.32rem;
}

.admin-sidebar__secondary {
  display: grid;
  gap: 0.12rem;
}

.admin-link-group--secondary {
  gap: 0.12rem;
}

.admin-nav-button--secondary {
  min-height: 1.92rem;
}

.admin-sidebar-profile {
  display: flex;
  align-items: center;
  gap: 0.48rem;
  margin-top: 0;
  padding: 0.58rem 0.4rem 0.08rem;
  border-top: 1px solid var(--admin-border-color);
}

.admin-sidebar-profile__avatar {
  width: 1.92rem;
  height: 1.92rem;
  min-width: 1.92rem;
  min-height: 1.92rem;
  aspect-ratio: 1 / 1;
  border-radius: 0.72rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #2d3952 0%, #5a74b0 100%);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 12px 22px rgba(45, 57, 82, 0.18);
}

.admin-sidebar-profile__meta {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
}

.admin-sidebar-profile__meta strong {
  color: var(--admin-text-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.admin-sidebar-profile__meta span {
  color: var(--admin-text-secondary);
  font-size: 0.66rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-submenu-collapse-enter-active,
.admin-submenu-collapse-leave-active {
  transition:
    max-height 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease,
    transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    margin-top 0.26s ease,
    padding-top 0.26s ease,
    padding-bottom 0.26s ease;
  max-height: 18rem;
}

.admin-submenu-collapse-enter-from,
.admin-submenu-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
  max-height: 0;
}

@media (max-width: 1120px) {
  .admin-sidebar {
    padding-inline: 0.5rem;
  }
}

@media (max-width: 900px) {
  .admin-sidebar {
    position: static;
    height: auto;
    overflow-y: visible;
    min-height: auto;
    border-right: 0;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    gap: 0.44rem;
    padding: 0.72rem 0.5rem 0.54rem;
  }

  .admin-brand-row {
    padding-inline: 0.08rem;
  }

  .admin-brand {
    gap: 0.58rem;
  }

  .admin-brand__subtext {
    display: none;
  }

  .admin-nav-button,
  .admin-submenu__item {
    min-height: 1.9rem;
    font-size: 0.78rem;
  }
}

@media (max-width: 640px) {
  .admin-sidebar {
    gap: 0.4rem;
    padding: 0.68rem 0.5rem 0.5rem;
  }

  .admin-brand-row {
    gap: 0.5rem;
    padding: 0.08rem 0.08rem 0.14rem;
  }

  .admin-brand {
    gap: 0.54rem;
  }

  .admin-brand__mark {
    width: 2.34rem;
    height: 2.34rem;
  }

  .admin-brand__wordmark {
    height: 1.08rem;
  }

  .admin-brand__subtext {
    font-size: 0.64rem;
  }

  .admin-nav-button,
  .admin-submenu__item {
    min-height: 1.84rem;
  }
}
</style>
