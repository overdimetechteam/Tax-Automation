/**
 * Format a number as Sri Lankan Rupees, no decimal places.
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Rs. 0'
  const num = Math.round(parseFloat(value))
  if (isNaN(num)) return 'Rs. 0'
  return `Rs. ${num.toLocaleString('en-LK')}`
}

/**
 * Format a number with comma-separated thousands, NO decimal places.
 * Use this for all currency display fields (Change 3).
 * e.g. formatNumber(200000.50) → "200,001"
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0'
  const num = Math.round(parseFloat(value))
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-LK')
}

/**
 * Format a number as Rs. X,XXX (no decimals) — for compact display (Change 3).
 */
export function formatCurrencyInt(value) {
  if (value === null || value === undefined || value === '') return 'Rs. 0'
  const num = Math.round(parseFloat(value))
  if (isNaN(num)) return 'Rs. 0'
  return `Rs. ${num.toLocaleString('en-LK')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  awaiting_confirmation: 'Awaiting Confirmation',
  archived: 'Archived',
  draft: 'Draft',
  submitted: 'Submitted',
  info_requested: 'Info Requested',
  under_review: 'Under Review',
  calculation_done: 'Calculation Done',
  confirmed: 'Confirmed',
  awaiting_client_review: 'Review Required',
  client_confirmed: 'Client Confirmed',
}

export const STATUS_COLORS = {
  not_started: 'bg-brand-black-soft text-brand-gray',
  in_progress: 'bg-brand-info-pale text-brand-info',
  pending_review: 'bg-yellow-900/30 text-brand-yellow',
  awaiting_confirmation: 'bg-orange-900/30 text-orange-400',
  archived: 'bg-brand-success-pale text-brand-success',
  draft: 'bg-brand-black-soft text-brand-gray',
  submitted: 'bg-brand-info-pale text-brand-info',
  info_requested: 'bg-brand-red-pale text-brand-red',
  under_review: 'bg-yellow-900/30 text-brand-yellow',
  calculation_done: 'bg-purple-900/30 text-purple-400',
  confirmed: 'bg-brand-success-pale text-brand-success',
  awaiting_client_review: 'bg-blue-900/30 text-blue-400',
  client_confirmed: 'bg-brand-success-pale text-brand-success',
}

export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  paid: 'bg-brand-success-pale text-brand-success',
  overdue: 'bg-brand-red-pale text-brand-red',
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
}
