<script setup>
import { toRefs } from 'vue'

const props = defineProps([
  'showBusinessSidebar',
  'pwdLogo',
  'businessName',
  'businessBrandSubtitle',
  'profileName',
  'profileAvatar',
  'profileInitials',
  'profileEmail',
  'profileRoleLabel',
  'secondarySectionLabel',
  'showSubscriptionOnlySidebar',
  'showBusinessSubscriptionShortcut',
  'showBusinessProfileShortcut',
  'sidebarGroups',
  'activeSection',
  'activeSidebarGroup',
  'expandedSidebarGroups',
  'openSidebarGroup',
  'handleSidebarSectionClick',
  'setSidebarLinkRef',
  'getSidebarItemIcon',
  'isPremiumGuideTarget',
  'isLogoutSubmitting',
  'openLogoutConfirm',
  'openBusinessSubscriptionSection',
  'openBusinessProfileSection',
])

const {
  showBusinessSidebar,
  pwdLogo,
  businessName,
  businessBrandSubtitle,
  profileName,
  profileAvatar,
  profileInitials,
  profileEmail,
  profileRoleLabel,
  secondarySectionLabel,
  showSubscriptionOnlySidebar,
  showBusinessSubscriptionShortcut,
  showBusinessProfileShortcut,
  sidebarGroups,
  activeSection,
  activeSidebarGroup,
  expandedSidebarGroups,
  openSidebarGroup,
  handleSidebarSectionClick,
  setSidebarLinkRef,
  getSidebarItemIcon,
  isPremiumGuideTarget,
  isLogoutSubmitting,
  openLogoutConfirm,
  openBusinessSubscriptionSection,
  openBusinessProfileSection,
} = toRefs(props)
</script>

<template>
  <aside v-if="showBusinessSidebar" class="business-sidebar business-user-sidebar" aria-label="Employee workspace sidebar">
    <div class="business-sidebar__brand-row">
      <div class="business-sidebar__brand">
        <span class="business-sidebar__brand-mark">
          <img :src="pwdLogo" alt="PWD logo" class="business-sidebar__logo" />
        </span>
        <span class="business-sidebar__brand-copy">
          <strong>{{ businessName }}</strong>
          <small>{{ businessBrandSubtitle || 'Business Workspace' }}</small>
        </span>
      </div>
    </div>

    <section class="business-user-sidebar__workspace-card" aria-label="Employee workspace role">
      <span class="business-user-sidebar__mode-badge">Employee Workspace</span>
      <strong>{{ profileRoleLabel || 'Workspace User' }}</strong>
      <p>Access assigned by {{ businessName }}</p>
    </section>

    <div class="business-sidebar__section-label business-sidebar__section-label--headline">Assigned Modules</div>

    <TransitionGroup name="business-sidebar-reveal" tag="nav" class="business-sidebar__nav" aria-label="Employee workspace sections">
      <button
        v-if="sidebarGroups.some((group) => group.id === 'dashboard' && group.items.some((item) => item.id === 'dashboard'))"
        key="dashboard-link"
        type="button"
        class="business-sidebar__link business-sidebar__link--group"
        :class="{ 'is-active': activeSection === 'dashboard' }"
        @click="handleSidebarSectionClick({ id: 'dashboard' })"
      >
        <span class="business-sidebar__link-main">
          <i class="bi bi-grid-1x2-fill" aria-hidden="true" />
          <span>Dashboard</span>
        </span>
      </button>

      <div
        v-for="group in sidebarGroups.filter((entry) => entry.id !== 'dashboard')"
        :key="group.id"
        class="business-sidebar__dropdown-group"
      >
        <button
          type="button"
          class="business-sidebar__link business-sidebar__link--group"
          :class="{ 'is-active-soft': activeSidebarGroup === group.id || group.items.some((item) => item.id === activeSection) }"
          :aria-expanded="expandedSidebarGroups.includes(group.id) ? 'true' : 'false'"
          @click="openSidebarGroup(group)"
        >
          <span class="business-sidebar__link-main">
            <i :class="group.icon" aria-hidden="true" />
            <span>{{ group.label }}</span>
          </span>
          <span class="business-sidebar__chevron" :class="{ 'is-open': expandedSidebarGroups.includes(group.id) }">
            <i class="bi bi-chevron-down" aria-hidden="true" />
          </span>
        </button>

        <Transition name="business-submenu-collapse">
          <div
            v-if="expandedSidebarGroups.includes(group.id)"
            class="business-sidebar__submenu"
            :aria-label="`${group.label} submenu`"
          >
            <button
              v-for="item in group.items"
              :key="item.id"
              :ref="(element) => setSidebarLinkRef(item.id, element)"
              type="button"
              class="business-sidebar__submenu-item"
              :class="{
                'is-active': activeSection === item.id,
                'business-guide-target': isPremiumGuideTarget('sidebar-new', item.id),
              }"
              @click="handleSidebarSectionClick(item)"
            >
              <span class="business-sidebar__link-main">
                <i :class="getSidebarItemIcon(item.id)" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
            </button>
          </div>
        </Transition>
      </div>
    </TransitionGroup>

    <div class="business-sidebar__spacer" />

    <div class="business-sidebar__secondary">
      <div class="business-sidebar__section-label">{{ secondarySectionLabel || 'Employee Access' }}</div>
      <p class="business-user-sidebar__secondary-copy">Your tools depend on the role assigned by the workspace owner.</p>
      <div class="business-sidebar__secondary-links">
        <button
          v-if="showBusinessSubscriptionShortcut"
          type="button"
          class="business-sidebar__footer-link"
          :class="{ 'is-active': activeSection === 'subscriptions' }"
          @click="openBusinessSubscriptionSection"
        >
          <span class="business-sidebar__link-main">
            <i class="bi bi-stars" aria-hidden="true" />
            <span>Subscriptions</span>
          </span>
        </button>
        <button
          v-if="showBusinessProfileShortcut"
          type="button"
          class="business-sidebar__footer-link"
          :class="{ 'is-active': activeSection === 'profile' }"
          @click="openBusinessProfileSection"
        >
          <span class="business-sidebar__link-main">
            <i class="bi bi-person-circle" aria-hidden="true" />
            <span>Edit Profile</span>
          </span>
        </button>
        <button type="button" class="business-sidebar__footer-link" :disabled="isLogoutSubmitting" @click="openLogoutConfirm">
          <span class="business-sidebar__link-main">
            <i class="bi bi-box-arrow-right" aria-hidden="true" />
            <span>{{ isLogoutSubmitting ? 'Logging Out...' : 'Log Out' }}</span>
          </span>
        </button>
      </div>
    </div>

    <section class="business-sidebar__profile" aria-label="Employee workspace profile">
      <div class="business-sidebar__profile-avatar">
        <img v-if="profileAvatar" :src="profileAvatar" alt="Employee avatar" class="business-sidebar__profile-image" />
        <template v-else>{{ profileInitials }}</template>
      </div>
      <div class="business-sidebar__profile-meta">
        <div class="business-sidebar__profile-name-row">
          <strong>{{ profileName }}</strong>
          <span v-if="profileRoleLabel" class="business-sidebar__profile-role">{{ profileRoleLabel }}</span>
        </div>
        <span class="business-sidebar__profile-email">{{ profileEmail }}</span>
      </div>
    </section>
  </aside>
</template>
