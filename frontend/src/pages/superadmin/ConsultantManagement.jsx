import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import {
  UserPlus, Trash2, ArrowRightLeft, Users, Eye, EyeOff,
  AlertCircle, CheckCircle, X, ChevronDown, Search, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* ── Modal wrapper ── */
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={clsx('bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-card w-full animate-slide-up', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border">
          <p className="font-semibold text-white">{title}</p>
          <button onClick={onClose} className="text-brand-gray hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ── Field row ── */
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="input-label">{label}{required && <span className="text-brand-red ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-brand-red mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

export default function ConsultantManagement() {
  const qc = useQueryClient()

  /* ── Data ── */
  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['consultants-manage'],
    queryFn: () => api.get('/clients/consultants/').then(r => r.data),
  })

  /* ── Create modal ── */
  const [showCreate, setShowCreate] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [createForm, setCreateForm] = useState({
    first_name: '', last_name: '', email: '', username: '', password: generatePassword(), phone: ''
  })
  const [createErrors, setCreateErrors] = useState({})
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/clients/consultants/create/', data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['consultants-manage'])
      setCreatedCredentials({ ...createForm, name: `${createForm.first_name} ${createForm.last_name}` })
      setCreateForm({ first_name: '', last_name: '', email: '', username: '', password: generatePassword(), phone: '' })
      setCreateErrors({})
      toast.success('Consultant created successfully!')
    },
    onError: (err) => {
      const errs = err.response?.data || {}
      setCreateErrors(errs)
    },
  })

  /* ── Delete modal ── */
  const [deleteTarget, setDeleteTarget] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: (pk) => api.delete(`/clients/consultants/${pk}/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['consultants-manage'])
      setDeleteTarget(null)
      toast.success('Consultant removed from system.')
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to remove consultant'
      toast.error(msg)
    },
  })

  /* ── Transfer modal ── */
  const [transferSource, setTransferSource] = useState(null)   // consultant object
  const [transferTarget, setTransferTarget] = useState('')      // to_consultant_id
  const [selectedClients, setSelectedClients] = useState([])   // [] = all if transferAll
  const [transferAll, setTransferAll] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [sourceClients, setSourceClients] = useState([])
  const [loadingSourceClients, setLoadingSourceClients] = useState(false)

  async function openTransfer(consultant) {
    setTransferSource(consultant)
    setTransferTarget('')
    setSelectedClients([])
    setTransferAll(false)
    setClientSearch('')
    setLoadingSourceClients(true)
    try {
      const res = await api.get(`/clients/consultants/${consultant.id}/`)
      setSourceClients(res.data.clients || [])
    } catch {
      setSourceClients([])
    }
    setLoadingSourceClients(false)
  }

  const transferMutation = useMutation({
    mutationFn: (payload) => api.post('/clients/consultants/transfer/', payload).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['consultants-manage'])
      setTransferSource(null)
      toast.success(`${data.transferred} client(s) transferred to ${data.to_consultant}.`)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Transfer failed'),
  })

  function handleTransfer() {
    if (!transferTarget) { toast.error('Please select a target consultant.'); return }
    const payload = {
      from_consultant_id: transferSource.id,
      to_consultant_id: parseInt(transferTarget),
      transfer_all: transferAll,
      client_ids: transferAll ? [] : selectedClients,
    }
    transferMutation.mutate(payload)
  }

  const filteredSourceClients = sourceClients.filter(c =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  )

  function toggleClient(id) {
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setTransferAll(false)
  }

  const otherConsultants = consultants.filter(c => c.id !== transferSource?.id)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Consultant Management"
        subtitle="Create, manage and transfer consultants"
      />

      <div className="flex justify-end mb-6">
        <button onClick={() => { setShowCreate(true); setCreatedCredentials(null) }} className="btn-primary">
          <UserPlus size={15} /> Create Consultant
        </button>
      </div>

      {/* ── Consultant table ── */}
      <div className="card">
        <div className="section-header mb-4">
          <Users size={18} className="text-brand-yellow" />
          All Consultants
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><span className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : consultants.length === 0 ? (
          <p className="text-brand-gray text-sm text-center py-8">No consultants yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-lg">Name</th>
                  <th className="table-header text-left">Email</th>
                  <th className="table-header text-center">Clients</th>
                  <th className="table-header text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultants.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-medium">{c.name}</td>
                    <td className="table-cell text-brand-gray text-sm">{c.email}</td>
                    <td className="table-cell text-center">
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        c.client_count > 0 ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-gray/10 text-brand-gray'
                      )}>
                        <Users size={11} /> {c.client_count}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openTransfer(c)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20 flex items-center gap-1 transition-colors"
                          title="Transfer clients"
                        >
                          <ArrowRightLeft size={12} /> Transfer
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red/20 flex items-center gap-1 transition-colors"
                          title="Remove consultant"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════ CREATE MODAL ══════════ */}
      {showCreate && (
        <Modal title="Create New Consultant" onClose={() => setShowCreate(false)}>
          {createdCredentials ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-brand-success" />
                <p className="font-semibold text-white">Consultant Created Successfully!</p>
              </div>
              <div className="bg-brand-black rounded-lg p-4 font-mono text-sm space-y-1.5 mb-5">
                <p><span className="text-brand-gray">Name: </span><span className="text-white">{createdCredentials.name}</span></p>
                <p><span className="text-brand-gray">Email: </span><span className="text-brand-yellow">{createdCredentials.email}</span></p>
                <p><span className="text-brand-gray">Username: </span><span className="text-white">{createdCredentials.username}</span></p>
                <p><span className="text-brand-gray">Password: </span><span className="text-brand-red">{createdCredentials.password}</span></p>
              </div>
              <p className="text-xs text-brand-gray mb-4">The consultant must change their password on first login.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setCreatedCredentials(null) }} className="btn-secondary text-xs">Create Another</button>
                <button onClick={() => setShowCreate(false)} className="btn-primary text-xs">Done</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required error={createErrors.first_name?.[0]}>
                  <input className={clsx('input-field', createErrors.first_name && 'border-brand-red')}
                    value={createForm.first_name} onChange={e => setCreateForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
                </Field>
                <Field label="Last Name" required error={createErrors.last_name?.[0]}>
                  <input className={clsx('input-field', createErrors.last_name && 'border-brand-red')}
                    value={createForm.last_name} onChange={e => setCreateForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
                </Field>
              </div>
              <Field label="Email Address" required error={createErrors.email?.[0]}>
                <input type="email" className={clsx('input-field', createErrors.email && 'border-brand-red')}
                  value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="consultant@example.com" />
              </Field>
              <Field label="Username" required error={createErrors.username?.[0]}>
                <input className={clsx('input-field', createErrors.username && 'border-brand-red')}
                  value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
              </Field>
              <Field label="Phone" error={createErrors.phone?.[0]}>
                <input className="input-field" value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
              </Field>
              <Field label="Temporary Password" required error={createErrors.password?.[0]}>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'}
                    className={clsx('input-field pr-20', createErrors.password && 'border-brand-red')}
                    value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={() => setShowPass(v => !v)} className="text-brand-gray hover:text-white p-1">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))} className="text-xs text-brand-yellow hover:opacity-80 px-1">
                      Gen
                    </button>
                  </div>
                </div>
                <p className="text-xs text-brand-gray mt-1">Consultant must change on first login.</p>
              </Field>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => createMutation.mutate(createForm)}
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" /> Creating…</>
                    : <><UserPlus size={14} /> Create Consultant</>}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ══════════ DELETE MODAL ══════════ */}
      {deleteTarget && (
        <Modal title="Remove Consultant" onClose={() => setDeleteTarget(null)}>
          {deleteTarget.client_count > 0 ? (
            <div>
              <div className="flex items-start gap-3 mb-4 p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl">
                <AlertCircle size={20} className="text-brand-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">Cannot Remove Consultant</p>
                  <p className="text-sm text-brand-gray">
                    <span className="text-white font-medium">{deleteTarget.name}</span> currently has{' '}
                    <span className="text-brand-yellow font-semibold">{deleteTarget.client_count} client(s)</span> assigned.
                    Please transfer all clients to another consultant before removing.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Close</button>
                <button onClick={() => { setDeleteTarget(null); openTransfer(deleteTarget) }} className="btn-primary">
                  <ArrowRightLeft size={14} /> Transfer Clients Now
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-brand-gray mb-5">
                Are you sure you want to remove <span className="text-white font-semibold">{deleteTarget.name}</span>?
                They have no clients assigned. Their account will be deactivated.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="bg-brand-red text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2"
                >
                  {deleteMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Removing…</>
                    : <><Trash2 size={14} /> Confirm Remove</>}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ══════════ TRANSFER MODAL ══════════ */}
      {transferSource && (
        <Modal title={`Transfer Clients — ${transferSource.name}`} onClose={() => setTransferSource(null)} wide>
          <div className="space-y-4">
            {/* Target consultant selector */}
            <div>
              <label className="input-label">Transfer To <span className="text-brand-red">*</span></label>
              <div className="relative">
                <select
                  value={transferTarget}
                  onChange={e => setTransferTarget(e.target.value)}
                  className="input-field appearance-none pr-8"
                >
                  <option value="">— Select Target Consultant —</option>
                  {otherConsultants.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
              </div>
            </div>

            {/* Bulk selector */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-gray">
                {transferSource.client_count} client(s) assigned
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setTransferAll(true); setSelectedClients([]) }}
                  className={clsx('text-xs px-3 py-1.5 rounded-lg border transition-all',
                    transferAll ? 'bg-brand-yellow/10 border-brand-yellow text-brand-yellow' : 'border-brand-gray-border text-brand-gray hover:border-brand-gray'
                  )}
                >
                  <UserCheck size={12} className="inline mr-1" /> Transfer All
                </button>
                <button
                  type="button"
                  onClick={() => { setTransferAll(false); setSelectedClients([]) }}
                  className="text-xs text-brand-gray hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Client list with search */}
            {loadingSourceClients ? (
              <div className="flex justify-center py-6"><span className="w-5 h-5 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
            ) : sourceClients.length === 0 ? (
              <p className="text-sm text-brand-gray text-center py-4">This consultant has no clients.</p>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
                  <input
                    className="input-field pl-8 text-sm py-2"
                    placeholder="Search clients…"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {filteredSourceClients.map(c => {
                    const selected = transferAll || selectedClients.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        className={clsx(
                          'w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all',
                          selected
                            ? 'bg-brand-yellow/10 border-brand-yellow'
                            : 'bg-brand-black-soft border-brand-gray-border hover:border-brand-gray'
                        )}
                      >
                        <div className={clsx(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                          selected ? 'bg-brand-yellow border-brand-yellow' : 'border-brand-gray'
                        )}>
                          {selected && <CheckCircle size={10} className="text-brand-black" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{c.full_name}</p>
                          <p className="text-xs text-brand-gray truncate">{c.email}</p>
                        </div>
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                          c.status === 'archived' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-yellow/10 text-brand-yellow'
                        )}>
                          {c.status?.replace('_', ' ')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selection summary */}
            {(transferAll || selectedClients.length > 0) && (
              <p className="text-xs text-brand-yellow">
                {transferAll ? `All ${transferSource.client_count}` : selectedClients.length} client(s) selected for transfer
              </p>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-brand-gray-border">
              <button onClick={() => setTransferSource(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleTransfer}
                disabled={transferMutation.isPending || (!transferAll && selectedClients.length === 0)}
                className="btn-primary"
              >
                {transferMutation.isPending
                  ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" /> Transferring…</>
                  : <><ArrowRightLeft size={14} /> Confirm Transfer</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
