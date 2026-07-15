import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import {
  Users, Clock, CheckCircle, Bell, TrendingUp, ArrowRight,
  UserPlus, BarChart3, ShieldCheck, User, X, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import StatusBadge from '../../components/common/StatusBadge'

/* ── Status metadata ── */
const STATUS_META = {
  'Not Started':    { apiValue: 'not_started',        color: '#374151', textColor: 'text-brand-gray' },
  'In Progress':    { apiValue: 'in_progress',         color: '#3B82F6', textColor: 'text-blue-400' },
  'Pending Review': { apiValue: 'pending_review',      color: '#F59E0B', textColor: 'text-brand-yellow' },
  'Awaiting':       { apiValue: 'awaiting_confirmation', color: '#F97316', textColor: 'text-orange-400' },
  'Archived':       { apiValue: 'archived',            color: '#10B981', textColor: 'text-brand-success' },
}
const BAR_KEYS   = Object.keys(STATUS_META)
const BAR_COLORS = BAR_KEYS.map(k => STATUS_META[k].color)

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  /* drill-down state: { consultantId, consultantName, statusKey } | null */
  const [drill, setDrill] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => api.get('/clients/super-admin/stats/').then(r => r.data),
  })

  const overall     = data?.overall     || {}
  const consultants = data?.consultants || []

  /* ── Drill-down client list ── */
  const { data: drillClients = [], isFetching: drillLoading } = useQuery({
    queryKey: ['drill-clients', drill?.consultantId, drill?.statusKey],
    queryFn: () =>
      api.get('/clients/', {
        params: {
          consultant_id: drill.consultantId,
          status: STATUS_META[drill.statusKey].apiValue,
        },
      }).then(r => r.data),
    enabled: !!drill,
  })

  /* ── Chart data ── */
  const chartData = consultants.map(c => ({
    id:       c.id,
    name:     c.name.split(' ')[0],
    fullName: c.name,
    'Not Started':    c.not_started,
    'In Progress':    c.in_progress,
    'Pending Review': c.pending_review,
    'Awaiting':       c.awaiting_confirmation,
    'Archived':       c.archived,
  }))

  function handleBarClick(barData, statusKey) {
    if (!barData || barData[statusKey] === 0) return
    const isSame = drill?.consultantId === barData.id && drill?.statusKey === statusKey
    if (isSame) { setDrill(null); return }
    setDrill({ consultantId: barData.id, consultantName: barData.fullName, statusKey })
  }

  /* ── Overall stat cards ── */
  const overallCards = [
    { label: 'Total Consultants', value: overall.total_consultants || 0, icon: ShieldCheck, color: 'text-brand-yellow',  bg: 'bg-brand-yellow/10' },
    { label: 'Total Clients',     value: overall.total_clients     || 0, icon: Users,       color: 'text-blue-400',     bg: 'bg-blue-400/10' },
    { label: 'Pending Review',    value: overall.pending_review    || 0, icon: Clock,       color: 'text-orange-400',   bg: 'bg-orange-400/10' },
    { label: 'Archived',          value: overall.archived          || 0, icon: CheckCircle, color: 'text-brand-success', bg: 'bg-brand-success/10' },
  ]

  /* ── Custom tooltip ── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const item = chartData.find(d => d.name === label)
    return (
      <div className="bg-brand-black-light border border-brand-gray-border rounded-xl p-3 shadow-card min-w-[160px]">
        <p className="text-xs font-semibold text-white mb-2">{item?.fullName || label}</p>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
              <span className="text-brand-gray">{p.dataKey}</span>
            </div>
            <span className="font-semibold text-white">{p.value}</span>
          </div>
        ))}
        <p className="text-xs text-brand-yellow mt-2 border-t border-brand-gray-border pt-1.5">Click a segment to drill down</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Admin'}`}
        subtitle="Super Admin Dashboard — Y/A 2025/2026"
        actions={
          <button onClick={() => navigate('/super-admin/clients/register')} className="btn-primary">
            <UserPlus size={15} /> Register Client
          </button>
        }
      />

      {/* Overall stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overallCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card hover:border-brand-yellow/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-black text-white">{isLoading ? '—' : value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stacked bar chart ── */}
      {consultants.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="section-header">
              <BarChart3 size={16} className="text-brand-yellow" />
              Client Distribution by Consultant
            </h3>
            {drill && (
              <button onClick={() => setDrill(null)} className="text-xs text-brand-gray hover:text-white flex items-center gap-1">
                <X size={13} /> Clear selection
              </button>
            )}
          </div>
          <p className="text-xs text-brand-gray mb-3">Click any coloured segment to see the clients in that group.</p>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,197,24,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              {BAR_KEYS.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={BAR_COLORS[i]}
                  radius={i === BAR_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(barData) => handleBarClick(barData, key)}
                  /* Dim bars that are not the active selection */
                  fillOpacity={
                    !drill
                      ? 1
                      : drill.statusKey === key
                        ? 1
                        : 0.25
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Drill-down panel ── */}
      {drill && (
        <div className="card mb-6 border-brand-yellow/30 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-8 rounded-full flex-shrink-0"
                style={{ background: STATUS_META[drill.statusKey].color }}
              />
              <div>
                <p className="text-sm font-bold text-white">
                  {drill.statusKey} — {drill.consultantName}
                </p>
                <p className="text-xs text-brand-gray">
                  {drillLoading ? 'Loading…' : `${drillClients.length} client(s)`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/super-admin/clients?consultant_id=${drill.consultantId}`)}
                className="text-xs text-brand-yellow hover:opacity-80 flex items-center gap-1"
              >
                View all clients <ArrowRight size={12} />
              </button>
              <button onClick={() => setDrill(null)} className="text-brand-gray hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Client list */}
          {drillLoading ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          ) : drillClients.length === 0 ? (
            <p className="text-sm text-brand-gray text-center py-6">No clients in this group.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left rounded-tl-lg">Client</th>
                    <th className="table-header text-left">TIN</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-center rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {drillClients.map(c => (
                    <tr
                      key={c.id}
                      className="table-row cursor-pointer group"
                      onClick={() => navigate(`/super-admin/clients?consultant_id=${drill.consultantId}`)}
                    >
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-white">{c.full_name}</p>
                          <p className="text-xs text-brand-gray">{c.email}</p>
                        </div>
                      </td>
                      <td className="table-cell text-brand-gray text-xs font-mono">
                        {c.tin || '—'}
                      </td>
                      <td className="table-cell text-center">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="table-cell text-center">
                        <ChevronRight size={14} className="text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Per-consultant breakdown table ── */}
      <div className="card">
        <h3 className="section-header mb-4">
          <Users size={16} className="text-brand-yellow" />
          Consultant Breakdown
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : consultants.length === 0 ? (
          <p className="text-sm text-brand-gray text-center py-8">No consultants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-border">
                  <th className="text-left text-xs text-brand-gray uppercase tracking-wider pb-3 pr-4">Consultant</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">Total</th>
                  {BAR_KEYS.map((key, i) => (
                    <th key={key} className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">
                      <span style={{ color: BAR_COLORS[i] }}>{key}</span>
                    </th>
                  ))}
                  <th className="pb-3 pl-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-border">
                {consultants.map(c => (
                  <tr key={c.id} className="hover:bg-brand-black-soft transition-colors group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-brand-yellow" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{c.name}</p>
                          <p className="text-xs text-brand-gray">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-white font-bold">{c.total_clients}</span>
                    </td>
                    {BAR_KEYS.map((key, i) => {
                      const count = [c.not_started, c.in_progress, c.pending_review, c.awaiting_confirmation, c.archived][i]
                      const isActive = drill?.consultantId === c.id && drill?.statusKey === key
                      return (
                        <td key={key} className="py-3 px-3 text-center">
                          <button
                            onClick={() => count > 0 && handleBarClick({ id: c.id, fullName: c.name, ...chartData.find(d => d.id === c.id) }, key)}
                            disabled={count === 0}
                            className={`font-semibold px-2 py-0.5 rounded-lg transition-all text-sm ${
                              count === 0
                                ? 'text-brand-gray cursor-default'
                                : isActive
                                  ? 'ring-1 ring-offset-1 ring-offset-brand-black-light'
                                  : 'hover:bg-brand-black cursor-pointer'
                            }`}
                            style={{ color: count === 0 ? undefined : BAR_COLORS[i], ...(isActive ? { ringColor: BAR_COLORS[i] } : {}) }}
                          >
                            {count}
                          </button>
                        </td>
                      )
                    })}
                    <td className="py-3 pl-4">
                      <button
                        onClick={() => navigate(`/super-admin/clients?consultant_id=${c.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-yellow hover:opacity-80 flex items-center gap-1"
                      >
                        View <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
