/**
 * Portfolio Dashboard (Change 7)
 * Shows per-handling-person stats with progress bars.
 * Admin sees all; Handling Person sees only themselves.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { formatNumber } from '../../utils/format'
import PageHeader from '../../components/common/PageHeader'
import { BarChart3, Users, CheckCircle, TrendingUp } from 'lucide-react'

function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(Math.round((value / (max || 1)) * 100), 100)
  const color = pct >= 75 ? 'bg-brand-success' : pct >= 40 ? 'bg-brand-yellow' : 'bg-brand-info'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-brand-black-soft rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white font-mono w-10 text-right">{value}%</span>
    </div>
  )
}

const STATUS_LABELS = {
  draft: 'Draft', submitted: 'Submitted', info_requested: 'Info Requested',
  under_review: 'Under Review', calculation_done: 'Calc. Done',
  awaiting_confirmation: 'Awaiting', confirmed: 'Confirmed', archived: 'Archived',
}

export default function Portfolio() {
  const [year, setYear] = useState('')

  const { data: taxYears = [] } = useQuery({
    queryKey: ['tax-years'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
  })

  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ['portfolio', year],
    queryFn: () => api.get(`/tax/dashboard/portfolio/${year ? `?year=${year}` : ''}`).then(r => r.data),
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Portfolio Dashboard"
        subtitle="Handling person assignment overview"
        actions={
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="input-field py-1 text-sm"
          >
            <option value="">All Years</option>
            {taxYears.map(ty => (
              <option key={ty.id} value={ty.year}>{ty.label}</option>
            ))}
          </select>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-brand-gray">Loading portfolio data…</div>
      ) : portfolio.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 size={40} className="mx-auto text-brand-gray mb-3 opacity-40" />
          <p className="text-brand-gray">No portfolio data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary totals */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-1">Handling Persons</p>
              <p className="text-2xl font-black text-white">{portfolio.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-1">Total Clients</p>
              <p className="text-2xl font-black text-white">
                {formatNumber(portfolio.reduce((a, hp) => a + hp.total_clients, 0))}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-1">Avg. Completion</p>
              <p className="text-2xl font-black text-brand-yellow">
                {portfolio.length > 0
                  ? Math.round(portfolio.reduce((a, hp) => a + hp.completion_percentage, 0) / portfolio.length)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Per-person rows */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-black-soft border-b border-brand-gray-border">
                  <th className="text-left px-5 py-3 text-xs text-brand-gray uppercase tracking-wider">Handling Person</th>
                  <th className="text-center px-3 py-3 text-xs text-brand-gray uppercase tracking-wider">Clients</th>
                  <th className="text-center px-3 py-3 text-xs text-brand-gray uppercase tracking-wider">Submissions</th>
                  <th className="text-center px-3 py-3 text-xs text-brand-gray uppercase tracking-wider">Submitted</th>
                  <th className="text-center px-3 py-3 text-xs text-brand-gray uppercase tracking-wider">Completed</th>
                  <th className="px-5 py-3 text-xs text-brand-gray uppercase tracking-wider" style={{ minWidth: 160 }}>Completion</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((hp, i) => {
                  const completed = (hp.status_breakdown?.confirmed || 0) + (hp.status_breakdown?.archived || 0)
                  const submitted = hp.status_breakdown?.submitted || 0
                  return (
                    <tr key={hp.handling_person_id} className={`border-b border-brand-gray-border ${i % 2 === 0 ? '' : 'bg-brand-black-soft/40'} hover:bg-brand-black-mid transition-colors`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{hp.handling_person_name}</p>
                        <p className="text-xs text-brand-gray">{hp.handling_person_email}</p>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-white font-mono">{formatNumber(hp.total_clients)}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-white font-mono">{formatNumber(hp.total_submissions)}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-brand-info font-mono">{formatNumber(submitted)}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-brand-success font-mono">{formatNumber(completed)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <ProgressBar value={hp.completion_percentage} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {portfolio.map(hp => (
              <div key={hp.handling_person_id} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-brand-yellow" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{hp.handling_person_name}</p>
                    <p className="text-xs text-brand-gray">{hp.total_submissions} submissions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(hp.status_breakdown || {}).map(([key, count]) => (
                    count > 0 && (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-brand-gray">{STATUS_LABELS[key] || key}</span>
                        <span className="text-xs font-mono text-white">{formatNumber(count)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
