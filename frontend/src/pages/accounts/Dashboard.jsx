import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { formatDate } from '../../utils/format'
import {
  Banknote, CheckCircle, Clock, AlertCircle, User, Paperclip, X,
  ExternalLink, History,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Status badge for confirmed tab ── */
function StatusBadge({ status }) {
  const map = {
    confirmed:             { label: 'Awaiting Final Submit', cls: 'bg-brand-yellow/10 text-brand-yellow' },
    awaiting_client_review:{ label: 'Sent to Client',        cls: 'bg-blue-400/10 text-blue-400' },
    client_confirmed:      { label: 'Client Confirmed',      cls: 'bg-brand-success/10 text-brand-success' },
    archived:              { label: 'Archived',              cls: 'bg-brand-gray/10 text-brand-gray' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'bg-brand-gray/10 text-brand-gray' }
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  )
}

/* ── Confirmation modal (no slip upload — client attaches their own slip) ── */
function ConfirmPaymentModal({ submission, onClose, onConfirm, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-brand-success" />
            Confirm Payment Received
          </h3>
          <button onClick={onClose} className="text-brand-gray hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-brand-black rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-white">{submission.client_name}</p>
            <p className="text-xs text-brand-gray">{submission.client_email}</p>
            <p className="text-xs text-brand-gray mt-0.5">{submission.tax_year_label}</p>
          </div>

          {submission.payment_slip_url ? (
            <div className="flex items-center gap-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
              <Paperclip size={12} />
              <span>Bank slip attached by client.</span>
              <a href={submission.payment_slip_url} target="_blank" rel="noreferrer"
                className="underline ml-auto flex items-center gap-1 hover:text-white transition-colors">
                View <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <p className="text-xs text-brand-gray italic">No bank slip attached by the client.</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button onClick={onConfirm} disabled={isPending} className="btn-primary flex-1 text-sm">
              {isPending ? 'Confirming…' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountsDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalSub, setModalSub] = useState(null)
  const [activeTab, setActiveTab] = useState('queue')

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['accounts-queue'],
    queryFn: () => api.get('/tax/submissions/accounts-queue/').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: confirmedList = [], isLoading: confirmedLoading } = useQuery({
    queryKey: ['accounts-confirmed'],
    queryFn: () => api.get('/tax/submissions/accounts-queue/?confirmed=1').then(r => r.data),
    refetchInterval: 30000,
  })

  const confirmPayment = useMutation({
    mutationFn: ({ submissionId }) =>
      api.patch(`/tax/submissions/${submissionId}/payment-status/`, { payment_status: 'paid' }),
    onSuccess: () => {
      toast.success('Payment confirmed! Consultant has been notified.')
      qc.invalidateQueries(['accounts-queue'])
      qc.invalidateQueries(['accounts-confirmed'])
      setModalSub(null)
    },
    onError: () => toast.error('Failed to confirm payment'),
  })

  const awaitingConfirmation = queue.filter(s => s.status === 'awaiting_confirmation')
  const clientConfirmed      = queue.filter(s => s.status === 'confirmed')

  return (
    <div className="animate-fade-in">
      {modalSub && (
        <ConfirmPaymentModal
          submission={modalSub}
          onClose={() => setModalSub(null)}
          isPending={confirmPayment.isPending}
          onConfirm={() => confirmPayment.mutate({ submissionId: modalSub.id })}
        />
      )}

      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Officer'}`}
        subtitle="Accounts Division — Payment Queue"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card hover:border-brand-yellow/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Total Pending</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : queue.length}</p>
            </div>
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
              <Banknote size={18} className="text-brand-yellow" />
            </div>
          </div>
        </div>
        <div className="card hover:border-blue-400/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Sent to Client</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : awaitingConfirmation.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-blue-400" />
            </div>
          </div>
        </div>
        <div className="card hover:border-brand-success/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Client Confirmed</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : clientConfirmed.length}</p>
            </div>
            <div className="w-10 h-10 bg-brand-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-brand-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-gray-border mb-4">
        {[
          { key: 'queue',     icon: Banknote,  label: 'Payment Queue',     count: queue.length,         countCls: 'bg-brand-yellow/20 text-brand-yellow', activeCls: 'border-brand-yellow text-brand-yellow'  },
          { key: 'confirmed', icon: History,   label: 'Payment Confirmed', count: confirmedList.length, countCls: 'bg-brand-success/20 text-brand-success', activeCls: 'border-brand-success text-brand-success' },
        ].map(({ key, icon: Icon, label, count, countCls, activeCls }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key ? activeCls : 'border-transparent text-brand-gray hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${countCls}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Payment Queue tab ── */}
      {activeTab === 'queue' && (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-gray-border">
              <h3 className="section-header mb-0">
                <Banknote size={16} className="text-brand-yellow" />
                Payment Confirmation Queue
              </h3>
              <p className="text-xs text-brand-gray mt-1">Confirm payment received for each submission to allow the consultant to submit the final return.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={40} className="mx-auto text-brand-success mb-3 opacity-50" />
                <p className="text-sm text-brand-gray">No pending payments — all confirmed!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-gray-border">
                    <tr>
                      <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-6 py-3">Client</th>
                      <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Tax Year</th>
                      <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Stage</th>
                      <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Bank Slip</th>
                      <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Sent</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gray-border">
                    {queue.map(sub => (
                      <tr key={sub.id} className="hover:bg-brand-black-soft transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-brand-yellow" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{sub.client_name}</p>
                              <p className="text-xs text-brand-gray">{sub.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-brand-gray">{sub.tax_year_label}</td>
                        <td className="px-4 py-4">
                          {sub.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> Client Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full">
                              <Clock size={10} /> Awaiting Client
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {sub.payment_slip_url ? (
                            <a href={sub.payment_slip_url} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-success hover:underline">
                              <Paperclip size={11} /> View
                            </a>
                          ) : (
                            <span className="text-xs text-brand-gray/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-brand-gray">
                          {sub.submitted_at ? formatDate(sub.submitted_at) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setModalSub(sub)}
                            disabled={confirmPayment.isPending}
                            className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                          >
                            <CheckCircle size={13} /> Confirm Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {queue.length > 0 && (
            <div className="mt-4 p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-brand-yellow flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-gray">
                  Once you confirm payment, the assigned consultant will be notified and can proceed to submit the final tax return to the client. Check if the client has attached a bank slip before confirming.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Payment Confirmed tab ── */}
      {activeTab === 'confirmed' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-gray-border">
            <h3 className="section-header mb-0">
              <CheckCircle size={16} className="text-brand-success" />
              Payment Confirmed Records
            </h3>
            <p className="text-xs text-brand-gray mt-1">All submissions where payment has been confirmed by Accounts Division.</p>
          </div>

          {confirmedLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          ) : confirmedList.length === 0 ? (
            <div className="text-center py-16">
              <History size={40} className="mx-auto text-brand-gray mb-3 opacity-30" />
              <p className="text-sm text-brand-gray">No confirmed payments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-brand-gray-border">
                  <tr>
                    <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-6 py-3">Client</th>
                    <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Tax Year</th>
                    <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Bank Slip</th>
                    <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Payment Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-border">
                  {confirmedList.map(sub => (
                    <tr key={sub.id} className="hover:bg-brand-black-soft transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-brand-success" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{sub.client_name}</p>
                            <p className="text-xs text-brand-gray">{sub.client_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-brand-gray">{sub.tax_year_label}</td>
                      <td className="px-4 py-4"><StatusBadge status={sub.status} /></td>
                      <td className="px-4 py-4">
                        {sub.payment_slip_url ? (
                          <a href={sub.payment_slip_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-success hover:underline">
                            <Paperclip size={11} /> View
                          </a>
                        ) : (
                          <span className="text-xs text-brand-gray/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-gray">
                        {sub.payment_updated_at ? formatDate(sub.payment_updated_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
