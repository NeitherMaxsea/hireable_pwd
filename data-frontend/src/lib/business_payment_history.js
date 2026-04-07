import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'

export const BUSINESS_PAYMENT_HISTORY_COLLECTION = 'business_payment_history'

const paymentHistoryCollectionRef = collection(db, BUSINESS_PAYMENT_HISTORY_COLLECTION)

const text = (value) => String(value || '').trim()
const lowerText = (value) => text(value).toLowerCase()

const timestampText = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (value instanceof Date) return value.toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toISOString()
  return text(value)
}

export const normalizeBusinessPaymentHistoryRecord = (record = {}) => ({
  id: text(record.id),
  plan: text(record.plan),
  amount: text(record.amount),
  method: text(record.method),
  status: text(record.status),
  date: text(record.date),
  time: text(record.time),
  receiptCode: text(record.receiptCode || record.id),
  billingNote: text(record.billingNote),
  accountIdentity: text(record.accountIdentity || record.account_identity),
  ownerEmail: text(record.ownerEmail || record.owner_email),
  ownerName: text(record.ownerName || record.owner_name),
  workspaceOwnerId: text(record.workspaceOwnerId || record.workspace_owner_id),
  workspaceOwnerRole: text(record.workspaceOwnerRole || record.workspace_owner_role),
  createdAt: timestampText(record.createdAt || record.created_at || record.created_at_server),
})

const sortBusinessPaymentHistoryRecords = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0
    const rightTime = Date.parse(right.createdAt || '') || 0
    return rightTime - leftTime
  })

const resolveBusinessPaymentHistoryTarget = (target = '') =>
  typeof target === 'object' && target !== null
    ? {
        accountIdentity: lowerText(target.accountIdentity || target.account_identity),
        workspaceOwnerId: text(target.workspaceOwnerId || target.workspace_owner_id),
        ownerEmail: lowerText(target.ownerEmail || target.owner_email),
      }
    : {
        accountIdentity: lowerText(target),
        workspaceOwnerId: '',
        ownerEmail: '',
      }

export const subscribeToBusinessPaymentHistory = (target, handleNext, handleError) => {
  const {
    accountIdentity,
    workspaceOwnerId,
    ownerEmail,
  } = resolveBusinessPaymentHistoryTarget(target)

  if (!accountIdentity && !workspaceOwnerId && !ownerEmail) {
    if (typeof handleNext === 'function') handleNext([])
    return () => {}
  }

  const snapshotBuckets = new Map()
  const seenErrorCodes = new Set()

  const emitMergedRecords = () => {
    const mergedRecords = new Map()

    snapshotBuckets.forEach((records) => {
      records.forEach((record) => {
        const recordKey = text(record.id || record.receiptCode || record.createdAt)
        if (!recordKey) return
        mergedRecords.set(recordKey, record)
      })
    })

    if (typeof handleNext === 'function') {
      handleNext(sortBusinessPaymentHistoryRecords([...mergedRecords.values()]))
    }
  }

  const subscribeToScopedField = (bucketKey, field, value) =>
    onSnapshot(
      query(paymentHistoryCollectionRef, where(field, '==', value)),
      (snapshot) => {
        snapshotBuckets.set(
          bucketKey,
          snapshot.docs.map((entry) => normalizeBusinessPaymentHistoryRecord({
            id: entry.id,
            ...entry.data(),
          })),
        )
        emitMergedRecords()
      },
      (error) => {
        const errorKey = `${bucketKey}:${text(error?.code || error?.message)}`
        if (!seenErrorCodes.has(errorKey) && typeof handleError === 'function') {
          seenErrorCodes.add(errorKey)
          handleError(error)
        }
      },
    )

  const stops = []
  if (accountIdentity) {
    stops.push(subscribeToScopedField('accountIdentity', 'account_identity', accountIdentity))
  }
  if (workspaceOwnerId) {
    stops.push(subscribeToScopedField('workspaceOwnerId', 'workspace_owner_id', workspaceOwnerId))
  }
  if (ownerEmail) {
    stops.push(subscribeToScopedField('ownerEmail', 'owner_email', ownerEmail))
  }

  return () => {
    stops.forEach((stop) => {
      if (typeof stop === 'function') stop()
    })
  }
}

export const subscribeToAllBusinessPaymentHistory = (handleNext, handleError) =>
  onSnapshot(
    query(paymentHistoryCollectionRef),
    (snapshot) => {
      const records = snapshot.docs
        .map((entry) => normalizeBusinessPaymentHistoryRecord({
          id: entry.id,
          ...entry.data(),
        }))
      const sortedRecords = sortBusinessPaymentHistoryRecords(records)

      if (typeof handleNext === 'function') handleNext(sortedRecords)
    },
    (error) => {
      if (typeof handleError === 'function') handleError(error)
    },
  )

export const saveBusinessPaymentHistoryEntry = async (entry = {}) => {
  const normalizedEntry = normalizeBusinessPaymentHistoryRecord(entry)
  const documentId = normalizedEntry.id || normalizedEntry.receiptCode

  if (!documentId) {
    throw new Error('Payment history entry ID is required.')
  }

  if (!normalizedEntry.accountIdentity) {
    throw new Error('Payment history account identity is required.')
  }

  await setDoc(doc(paymentHistoryCollectionRef, documentId), {
    id: documentId,
    plan: normalizedEntry.plan,
    amount: normalizedEntry.amount,
    method: normalizedEntry.method,
    status: normalizedEntry.status,
    date: normalizedEntry.date,
    time: normalizedEntry.time,
    receiptCode: normalizedEntry.receiptCode || documentId,
    billingNote: normalizedEntry.billingNote,
    account_identity: normalizedEntry.accountIdentity.toLowerCase(),
    owner_email: lowerText(normalizedEntry.ownerEmail),
    owner_name: normalizedEntry.ownerName,
    workspace_owner_id: normalizedEntry.workspaceOwnerId,
    workspace_owner_role: normalizedEntry.workspaceOwnerRole,
    created_at: normalizedEntry.createdAt || new Date().toISOString(),
    created_at_server: serverTimestamp(),
    updated_at: new Date().toISOString(),
    updated_at_server: serverTimestamp(),
    saved_by_uid: text(auth.currentUser?.uid),
  }, { merge: true })

  return documentId
}

export const migrateBusinessPaymentHistoryEntries = async (entries = []) => {
  const normalizedEntries = Array.isArray(entries)
    ? entries
      .map((entry) => normalizeBusinessPaymentHistoryRecord(entry))
      .filter((entry) => entry.id && entry.accountIdentity)
    : []

  await Promise.all(normalizedEntries.map((entry) => saveBusinessPaymentHistoryEntry(entry)))
  return normalizedEntries.length
}
