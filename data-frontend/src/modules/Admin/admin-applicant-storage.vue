<script setup>
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import { computed, ref } from 'vue'

const props = defineProps({
  applicants: {
    type: Array,
    default: () => [],
  },
})

const search = ref('')

const normalizeStatusValue = (value) => String(value || '').trim().toLowerCase()

const titleCaseText = (value, fallback = 'Not set') => {
  const text = String(value || '').trim()
  if (!text) return fallback

  return text
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const applicantDisplayName = (applicant) =>
  String(
    `${applicant?.first_name || ''} ${applicant?.last_name || ''}`.trim()
    || applicant?.name
    || applicant?.user?.name
    || 'Applicant',
  ).trim()

const storageFilesForApplicant = (applicant) => ([
  { label: 'Face Verification', path: applicant?.profile_image_path },
  { label: 'PWD Front ID', path: applicant?.pwd_id_front_file_path },
  { label: 'PWD Back ID', path: applicant?.pwd_id_back_file_path },
  { label: 'Resume', path: applicant?.resume_file_path || applicant?.resume_storage_path },
].filter((item) => String(item.path || '').trim()))

const applicantStorageRows = computed(() =>
  (Array.isArray(props.applicants) ? props.applicants : []).map((applicant) => {
    const documents = storageFilesForApplicant(applicant)
    return {
      id: String(applicant?.id || '').trim(),
      accountId: String(applicant?.public_id || '').trim() || 'Pending ID',
      applicantName: applicantDisplayName(applicant),
      email: String(applicant?.email || applicant?.user?.email || 'No email').trim() || 'No email',
      status: titleCaseText(applicant?.approval_status, 'Pending'),
      pwdId: String(applicant?.pwd_id_number || '').trim() || 'Not set',
      fileCount: documents.length,
      documentLabels: documents.map((item, index) => ({
        id: `${applicant?.id || 'applicant'}-doc-${index + 1}`,
        label: item.label,
        path: String(item.path || '').trim(),
      })),
      updatedAt: formatDate(applicant?.reviewed_at || applicant?.submitted_at || applicant?.created_at),
    }
  }),
)

const filteredApplicantStorageRows = computed(() => {
  const query = String(search.value || '').trim().toLowerCase()
  if (!query) return applicantStorageRows.value

  return applicantStorageRows.value.filter((row) =>
    [
      row.accountId,
      row.applicantName,
      row.email,
      row.status,
      row.pwdId,
      ...row.documentLabels.map((item) => item.label),
      ...row.documentLabels.map((item) => item.path),
    ]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(query)),
  )
})

const storageSummary = computed(() => {
  const rows = applicantStorageRows.value
  const totalApplicants = rows.length
  const totalFiles = rows.reduce((sum, row) => sum + row.fileCount, 0)
  const applicantsWithFiles = rows.filter((row) => row.fileCount > 0).length
  const emptyApplicants = totalApplicants - applicantsWithFiles

  return [
    { label: 'Applicant Accounts', value: totalApplicants },
    { label: 'Stored Files', value: totalFiles },
    { label: 'With Storage', value: applicantsWithFiles },
    { label: 'Empty Storage', value: emptyApplicants },
  ]
})
</script>

<template>
  <section class="applicant-storage">
    <div class="applicant-storage__summary">
      <article v-for="card in storageSummary" :key="card.label" class="applicant-storage__summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </div>

    <div class="applicant-storage__toolbar">
      <label class="applicant-storage__search">
        <span>Search</span>
        <div class="applicant-storage__search-field">
          <i class="bi bi-search" aria-hidden="true" />
          <input
            v-model.trim="search"
            type="text"
            placeholder="Search applicant storage..."
          />
        </div>
      </label>
    </div>

    <div class="applicant-storage__panel">
      <div class="applicant-storage__head">
        <div>
          <h2>Applicant Storage</h2>
          <p>View uploaded applicant files like PWD IDs, face verification, and resume storage per account.</p>
        </div>
        <span class="applicant-storage__pill">{{ filteredApplicantStorageRows.length }} records</span>
      </div>

      <div v-if="filteredApplicantStorageRows.length" class="applicant-storage__table-shell">
        <table class="applicant-storage__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Status</th>
              <th>PWD ID</th>
              <th>Storage Files</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredApplicantStorageRows" :key="row.id || row.accountId">
              <td>{{ row.accountId }}</td>
              <td>
                <div class="applicant-storage__applicant">
                  <strong>{{ row.applicantName }}</strong>
                  <span>{{ row.email }}</span>
                </div>
              </td>
              <td>
                <span
                  class="applicant-storage__status"
                  :class="`is-${normalizeStatusValue(row.status)}`"
                >
                  {{ row.status }}
                </span>
              </td>
              <td>{{ row.pwdId }}</td>
              <td>
                <div v-if="row.documentLabels.length" class="applicant-storage__files">
                  <span
                    v-for="item in row.documentLabels"
                    :key="item.id"
                    class="applicant-storage__file-chip"
                    :title="item.path"
                  >
                    {{ item.label }}
                  </span>
                </div>
                <span v-else class="applicant-storage__empty-copy">No files attached</span>
              </td>
              <td>{{ row.updatedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="applicant-storage__empty">
        <i class="bi bi-folder-x" aria-hidden="true" />
        <strong>No applicant storage records found.</strong>
        <span>Try another search or wait for applicant accounts with attached verification files.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.applicant-storage {
  display: grid;
  gap: 1rem;
}

.applicant-storage__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.applicant-storage__summary-card {
  padding: 1rem 1.05rem;
  border: 1px solid rgba(122, 179, 145, 0.14);
  border-radius: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
  display: grid;
  gap: 0.2rem;
}

.applicant-storage__summary-card span {
  color: #6b8574;
  font-size: 0.75rem;
  font-weight: 700;
}

.applicant-storage__summary-card strong {
  color: #214133;
  font-size: 1.35rem;
  font-weight: 800;
}

.applicant-storage__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.applicant-storage__search {
  display: grid;
  gap: 0.38rem;
}

.applicant-storage__search span {
  color: #5c7b69;
  font-size: 0.76rem;
  font-weight: 700;
}

.applicant-storage__search-field {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.8rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(122, 179, 145, 0.18);
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
}

.applicant-storage__search-field i {
  color: #7b8f83;
}

.applicant-storage__search-field input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #274234;
  font: inherit;
}

.applicant-storage__panel {
  padding: 1rem 1.05rem;
  border: 1px solid rgba(122, 179, 145, 0.14);
  border-radius: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fcfa 100%);
  display: grid;
  gap: 1rem;
}

.applicant-storage__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.applicant-storage__head h2 {
  margin: 0;
  color: #1f3a2d;
  font-size: 1rem;
  font-weight: 800;
}

.applicant-storage__head p {
  margin: 0.2rem 0 0;
  color: #6f8578;
  font-size: 0.8rem;
  line-height: 1.5;
}

.applicant-storage__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.32rem 0.78rem;
  border: 1px solid rgba(122, 179, 145, 0.18);
  border-radius: 999px;
  background: #ffffff;
  color: #2b4b3b;
  font-size: 0.75rem;
  font-weight: 700;
}

.applicant-storage__table-shell {
  overflow-x: auto;
}

.applicant-storage__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 60rem;
}

.applicant-storage__table thead th {
  padding: 0 0 0.8rem;
  border-bottom: 1px solid rgba(122, 179, 145, 0.16);
  color: #6f8578;
  font-size: 0.73rem;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.applicant-storage__table tbody td {
  padding: 0.9rem 0;
  border-bottom: 1px solid rgba(122, 179, 145, 0.12);
  color: #274234;
  font-size: 0.82rem;
  vertical-align: top;
}

.applicant-storage__applicant {
  display: grid;
  gap: 0.16rem;
}

.applicant-storage__applicant strong {
  color: #1f3a2d;
  font-size: 0.88rem;
  font-weight: 700;
}

.applicant-storage__applicant span {
  color: #70877a;
  font-size: 0.76rem;
}

.applicant-storage__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.8rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.18);
  color: #516173;
  font-size: 0.72rem;
  font-weight: 700;
}

.applicant-storage__status.is-approved {
  background: rgba(52, 211, 153, 0.16);
  color: #0f8a5d;
}

.applicant-storage__status.is-rejected,
.applicant-storage__status.is-banned {
  background: rgba(248, 113, 113, 0.14);
  color: #b54545;
}

.applicant-storage__files {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.applicant-storage__file-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.7rem;
  padding: 0 0.62rem;
  border-radius: 999px;
  background: rgba(47, 106, 73, 0.1);
  color: #2f6a49;
  font-size: 0.72rem;
  font-weight: 700;
}

.applicant-storage__empty-copy {
  color: #7b8f83;
  font-size: 0.78rem;
}

.applicant-storage__empty {
  padding: 2rem 1rem;
  border: 1px dashed rgba(122, 179, 145, 0.22);
  border-radius: 1rem;
  background: rgba(247, 251, 248, 0.7);
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  text-align: center;
}

.applicant-storage__empty i {
  color: #7b8f83;
  font-size: 1.5rem;
}

.applicant-storage__empty strong {
  color: #1f3a2d;
  font-size: 0.96rem;
  font-weight: 800;
}

.applicant-storage__empty span {
  color: #70877a;
  font-size: 0.8rem;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .applicant-storage__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .applicant-storage__summary {
    grid-template-columns: 1fr;
  }

  .applicant-storage__panel {
    padding: 0.95rem;
  }

  .applicant-storage__head {
    flex-direction: column;
  }
}
</style>
