import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { Users, Search, ArrowRight, Filter } from 'lucide-react'

export default function SuperAdminClientList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const consultantId = searchParams.get('consultant_id') || ''

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultant-list'],
    queryFn: () => api.get('/clients/consultants/').then(r => r.data),
  })

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['all-clients', consultantId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (consultantId) params.set('consultant_id', consultantId)
      return api.get(`/clients/?${params}`).then(r => r.data)
    },
  })

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tin?.toLowerCase().includes(q)
    )
  })

  const selectedConsultant = consultants.find(c => String(c.id) === consultantId)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Clients"
        subtitle={selectedConsultant ? `Showing clients for ${selectedConsultant.name}` : 'All clients across all consultants'}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or TIN…"
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <select
            value={consultantId}
            onChange={e => {
              const val = e.target.value
              if (val) setSearchParams({ consultant_id: val })
              else setSearchParams({})
            }}
            className="input-field pl-9 pr-8 appearance-none min-w-48"
          >
            <option value="">All Consultants</option>
            {consultants.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="mx-auto text-brand-gray mb-3 opacity-40" />
            <p className="text-sm text-brand-gray">No clients found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-gray-border">
              <tr>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-6 py-3">Client</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">TIN</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Consultant</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-border">
              {filtered.map(client => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/consultant/clients/${client.id}`)}
                  className="hover:bg-brand-black-soft transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-3">
                    <p className="font-medium text-white">{client.full_name}</p>
                    <p className="text-xs text-brand-gray">{client.email}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-gray font-mono text-xs">{client.tin || '—'}</td>
                  <td className="px-4 py-3 text-brand-gray text-xs">{client.consultant_name || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ArrowRight size={14} className="text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
