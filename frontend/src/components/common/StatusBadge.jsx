import { STATUS_LABELS, STATUS_COLORS } from '../../utils/format'

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  const color = STATUS_COLORS[status] || 'bg-brand-black-soft text-brand-gray'

  return (
    <span className={`status-badge ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}
