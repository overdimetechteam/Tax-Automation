import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import { formatDateTime } from '../../utils/format'
import {
  UserPlus, Search, Filter, ArrowRight, Bell, RefreshCw, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Clients' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
  { value: 'archived', label: 'Archived' },
]

export default function ClientList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reminderModal, setReminderModal] = useState(null)
  const [reminderMsg, setReminderMsg] = useState('')

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      return api.get(`/clients/?${params}`).then(r => r.data)
    },
  })

  const sendReminder = useMutation({
    mutationFn: ({ clientId, message }) => api.post('/notifications/send-reminder/', { client_id: clientId, message }),
    onSuccess: () => {
      toast.success('Reminder sent')
      setReminderModal(null)
      setReminderMsg('')
    },
    onError: () => toast.error('Failed to send reminder'),
  })

  const filtered = clients.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.tin?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients"
        subtitle={`Managing ${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => navigate('/consultant/clients/register')} className="btn-primary">
            <UserPlus size={15} /> Register Client
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, TIN..."
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-9 pr-8 appearance-none bg-brand-black-soft min-w-[180px]"
          >
            {STATUS_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-brand-black">{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Client</th>
                <th className="table-header text-left">TIN</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Registered</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="table-cell text-center py-8 text-brand-gray">Loading clients...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center py-12 text-brand-gray">No clients found</td></tr>
              ) : (
                filtered.map(client => (
                  <tr key={client.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-yellow/10 rounded-full flex items-center justify-center text-sm font-bold text-brand-yellow flex-shrink-0">
                          {client.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.full_name}</p>
                          <p className="text-xs text-brand-gray">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm">{client.tin || '—'}</td>
                    <td className="table-cell"><StatusBadge status={client.status} /></td>
                    <td className="table-cell text-brand-gray text-xs">{formatDateTime(client.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/consultant/clients/${client.id}`)}
                          className="btn-ghost text-xs px-2 py-1.5"
                          title="View details"
                        >
                          <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={() => { setReminderModal(client); setReminderMsg('') }}
                          className="btn-ghost text-xs px-2 py-1.5 text-brand-yellow"
                          title="Send reminder"
                        >
                          <Bell size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Modal */}
      <Modal
        isOpen={!!reminderModal}
        onClose={() => setReminderModal(null)}
        title={`Send Reminder to ${reminderModal?.full_name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Send a notification reminder to <span className="text-white">{reminderModal?.email}</span>
          </p>
          <div>
            <label className="input-label">Message (optional)</label>
            <textarea
              value={reminderMsg}
              onChange={(e) => setReminderMsg(e.target.value)}
              rows={3}
              placeholder="Leave blank for default reminder message..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReminderModal(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => sendReminder.mutate({ clientId: reminderModal.id, message: reminderMsg })}
              disabled={sendReminder.isPending}
              className="btn-primary"
            >
              <Bell size={14} /> Send Reminder
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
