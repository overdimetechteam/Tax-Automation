import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  Users, FileText, Clock, CheckCircle, AlertCircle, TrendingUp,
  ArrowRight, UserPlus, Bell, BarChart3, Send, Eye, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function ConsultantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/clients/dashboard/stats/').then(r => r.data),
  })

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data),
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?unread=true').then(r => r.data),
  })

  const { data: accessRequests = [] } = useQuery({
    queryKey: ['access-requests-consultant'],
    queryFn: () => api.get('/tax/access-requests/').then(r => r.data).catch(() => []),
  })

  const pendingAccessRequests = accessRequests.filter(r => r.status === 'pending')

  const reviewAccessRequest = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tax/access-requests/${id}/`, { status }),
    onSuccess: (_, { status }) => {
      toast.success(`Access request ${status === 'approved' ? 'approved' : 'denied'}.`)
      qc.invalidateQueries(['access-requests-consultant'])
      qc.invalidateQueries(['notifications'])
    },
    onError: () => toast.error('Failed to update access request'),
  })

  // statCards carry a statusKey so clicking drills down to a filtered list
  const ACTIONABLE_STATUSES = [
    'submitted', 'under_review', 'info_requested',
    'awaiting_confirmation', 'confirmed', 'awaiting_client_review', 'client_confirmed',
  ]
  const pendingSubmissions = submissions.filter(s => ACTIONABLE_STATUSES.includes(s.status)).slice(0, 10)
  const paymentStageSubs = submissions.filter(s =>
    ['confirmed', 'client_confirmed'].includes(s.status)
  )

  const statCards = [
    { label: 'Total Clients', value: stats?.total_clients || 0, icon: Users, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', statusKey: null },
    { label: 'Pending Review', value: stats?.pending_review || 0, icon: Clock, color: 'text-brand-yellow-muted', bg: 'bg-brand-yellow/10', statusKey: 'submitted' },
    { label: 'Awaiting Confirmation', value: stats?.awaiting_confirmation || 0, icon: Bell, color: 'text-orange-400', bg: 'bg-orange-400/10', statusKey: 'awaiting_confirmation' },
    { label: 'Action Required', value: paymentStageSubs.length, icon: Send, color: 'text-blue-400', bg: 'bg-blue-400/10', statusKey: null },
    { label: 'Archived', value: stats?.archived || 0, icon: CheckCircle, color: 'text-brand-success', bg: 'bg-brand-success/10', statusKey: 'archived' },
  ]

  const chartData = [
    { name: 'Not Started', value: stats?.not_started || 0, fill: '#374151' },
    { name: 'In Progress', value: stats?.in_progress || 0, fill: '#3B82F6' },
    { name: 'Pending Review', value: stats?.pending_review || 0, fill: '#F59E0B' },
    { name: 'Awaiting', value: stats?.awaiting_confirmation || 0, fill: '#F97316' },
    { name: 'Archived', value: stats?.archived || 0, fill: '#10B981' },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'Consultant'}`}
        subtitle="Tax Consultant Dashboard — Y/A 2025/2026"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/consultant/portfolio')} className="btn-ghost text-sm">
              <BarChart3 size={15} /> Portfolio
            </button>
            <button onClick={() => navigate('/consultant/clients/register')} className="btn-primary">
              <UserPlus size={15} /> Register Client
            </button>
          </div>
        }
      />

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3">
          <Bell size={16} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">{notifications.length} unread notification{notifications.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-brand-gray mt-0.5">{notifications[0]?.message}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, statusKey }) => (
          <div
            key={label}
            className={`card transition-colors ${statusKey ? 'hover:border-brand-yellow/50 cursor-pointer active:scale-[0.98]' : 'hover:border-brand-yellow/30'}`}
            onClick={() => statusKey && navigate(`/consultant/status/${statusKey}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            {statusKey && (
              <p className="text-xs text-brand-gray mt-2 flex items-center gap-1">
                <ArrowRight size={10} /> Click to view clients
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Post-payment action items */}
      {paymentStageSubs.length > 0 && (
        <div className="mb-6 card border-blue-400/30">
          <h3 className="section-header mb-3">
            <Send size={15} className="text-blue-400" />
            Action Required — Post-Payment Submissions
          </h3>
          <div className="space-y-2">
            {paymentStageSubs.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between bg-brand-black-soft hover:bg-brand-black-mid rounded-lg px-4 py-3 cursor-pointer transition-colors"
                onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-400/10 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{sub.client_name}</p>
                    <p className="text-xs text-brand-gray">{sub.tax_year_label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'client_confirmed' ? 'bg-brand-success/15 text-brand-success' : 'bg-blue-400/10 text-blue-400'}`}>
                    {sub.status === 'client_confirmed' ? '✓ Client Confirmed — Archive Now' : '⏳ Payment Confirmed — Send to Client'}
                  </span>
                  <ArrowRight size={14} className="text-brand-gray" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Requests */}
      {pendingAccessRequests.length > 0 && (
        <div className="mb-6 card border-brand-yellow/30">
          <h3 className="section-header mb-3">
            <Eye size={15} className="text-brand-yellow" />
            Submission View Requests
            <span className="ml-auto bg-brand-yellow text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingAccessRequests.length}
            </span>
          </h3>
          <div className="space-y-2">
            {pendingAccessRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-brand-black-soft rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{req.client_name || req.client_email}</p>
                  <p className="text-xs text-brand-gray mt-0.5">
                    Requesting to view <span className="text-brand-yellow">{req.tax_year_label}</span> submission
                    &nbsp;·&nbsp;{formatDateTime(req.requested_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reviewAccessRequest.mutate({ id: req.id, status: 'approved' })}
                    disabled={reviewAccessRequest.isPending}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button
                    onClick={() => reviewAccessRequest.mutate({ id: req.id, status: 'denied' })}
                    disabled={reviewAccessRequest.isPending}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-brand-red border-brand-red/30 hover:bg-brand-red/10"
                  >
                    <X size={12} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <h3 className="section-header">
            <BarChart3 size={16} className="text-brand-yellow" />
            Client Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                cursor={{ fill: 'rgba(245,197,24,0.05)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending actions */}
        <div className="card lg:col-span-3">
          <h3 className="section-header flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle size={16} className="text-brand-yellow" />Pending Actions</span>
            <button onClick={() => navigate('/consultant/clients')} className="text-xs text-brand-yellow hover:opacity-80">
              View All <ArrowRight size={12} className="inline" />
            </button>
          </h3>

          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="mx-auto text-brand-success mb-2 opacity-60" />
              <p className="text-sm text-brand-gray">No pending actions — all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between bg-brand-black-soft hover:bg-brand-black-mid rounded-lg px-4 py-3 cursor-pointer transition-colors"
                  onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{sub.client_name}</p>
                      <p className="text-xs text-brand-gray">{sub.tax_year_label} · {formatDateTime(sub.submitted_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sub.status} />
                    <ArrowRight size={14} className="text-brand-gray" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
