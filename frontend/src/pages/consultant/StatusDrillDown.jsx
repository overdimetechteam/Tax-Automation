/**
 * StatusDrillDown — shows all submissions with a given status (Change 4).
 * Reached by clicking a status card on the dashboard.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { formatDate, formatCurrencyInt, STATUS_LABELS, STATUS_COLORS } from '../../utils/format'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { useState } from 'react'

export default function StatusDrillDown() {
  const { statusKey } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['status-drill', statusKey, page],
    queryFn: () =>
      api.get(`/tax/dashboard/status/${statusKey}/?page=${page}`).then(r => r.data),
    keepPreviousData: true,
  })

  const statusLabel = STATUS_LABELS[statusKey] || statusKey

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${statusLabel} — ${data?.count ?? '…'} submissions`}
        subtitle="Dashboard drill-down view"
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
            <ArrowLeft size={15} /> Back
          </button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-brand-gray">Loading…</div>
      ) : !data?.results?.length ? (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-brand-gray mb-3 opacity-40" />
          <p className="text-brand-gray">No submissions in this status</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-black-soft border-b border-brand-gray-border">
                  <th className="text-left px-5 py-3 text-xs text-brand-gray uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-brand-gray uppercase tracking-wider">Year</th>
                  <th className="text-right px-4 py-3 text-xs text-brand-gray uppercase tracking-wider">Tax Payable</th>
                  <th className="text-left px-4 py-3 text-xs text-brand-gray uppercase tracking-wider">Submitted</th>
                  <th className="text-center px-4 py-3 text-xs text-brand-gray uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.results.map((sub, i) => (
                  <tr
                    key={sub.id}
                    className={`border-b border-brand-gray-border hover:bg-brand-black-mid cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-brand-black-soft/40'}`}
                    onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{sub.client_name}</p>
                      <p className="text-xs text-brand-gray">{sub.client_email}</p>
                    </td>
                    <td className="px-4 py-4 text-brand-gray">{sub.tax_year_label}</td>
                    <td className="px-4 py-4 text-right font-mono text-white">
                      {formatCurrencyInt(sub.net_tax_payable)}
                    </td>
                    <td className="px-4 py-4 text-brand-gray text-xs">{formatDate(sub.submitted_at)}</td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ArrowRight size={14} className="text-brand-gray" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.num_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-ghost text-sm disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Prev
              </button>
              <span className="text-xs text-brand-gray">Page {page} of {data.num_pages}</span>
              <button
                disabled={page === data.num_pages}
                onClick={() => setPage(p => p + 1)}
                className="btn-ghost text-sm disabled:opacity-40"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
