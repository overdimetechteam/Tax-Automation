import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import {
  UserPlus, Trash2, Eye, EyeOff, AlertCircle, CheckCircle,
  X, Banknote, UserCheck, UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-card w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border">
          <p className="font-semibold text-white">{title}</p>
          <button onClick={onClose} className="text-brand-gray hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="input-label">{label}{required && <span className="text-brand-red ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-brand-red mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

export default function AccountsManagement() {
  const qc = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts-division-manage'],
    queryFn: () => api.get('/clients/accounts-division/').then(r => r.data),
  })

  /* ── Create modal ── */
  const [showCreate, setShowCreate] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [createForm, setCreateForm] = useState({
    first_name: '', last_name: '', email: '', username: '', password: generatePassword(), phone: '',
  })
  const [createErrors, setCreateErrors] = useState({})
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/clients/accounts-division/create/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['accounts-division-manage'])
      setCreatedCredentials({ ...createForm, name: `${createForm.first_name} ${createForm.last_name}` })
      setCreateForm({ first_name: '', last_name: '', email: '', username: '', password: generatePassword(), phone: '' })
      setCreateErrors({})
      toast.success('Accounts Division user created successfully!')
    },
    onError: (err) => setCreateErrors(err.response?.data || {}),
  })

  /* ── Remove modal ── */
  const [deleteTarget, setDeleteTarget] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: (pk) => api.delete(`/clients/accounts-division/${pk}/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['accounts-division-manage'])
      setDeleteTarget(null)
      toast.success('Account deactivated successfully.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to deactivate account'),
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Accounts Division"
        subtitle="Manage accounts division user accounts and payment permissions"
      />

      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setShowCreate(true); setCreatedCredentials(null) }}
          className="btn-primary"
        >
          <UserPlus size={15} /> Create Accounts User
        </button>
      </div>

      {/* ── User table ── */}
      <div className="card">
        <div className="section-header mb-4">
          <Banknote size={18} className="text-brand-yellow" />
          Accounts Division Users
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <Banknote size={36} className="mx-auto text-brand-gray mb-3 opacity-30" />
            <p className="text-brand-gray text-sm">No accounts division users yet.</p>
            <p className="text-xs text-brand-gray/60 mt-1">Create one above to grant payment management access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-lg">Name</th>
                  <th className="table-header text-left">Email</th>
                  <th className="table-header text-left">Username</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCheck size={13} className="text-brand-yellow" />
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="table-cell text-brand-gray text-sm">{u.email}</td>
                    <td className="table-cell text-brand-gray text-sm font-mono">{u.username}</td>
                    <td className="table-cell text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/10 text-brand-success">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-red/10 text-brand-red">
                          <UserX size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      {u.is_active && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-red/10 text-brand-red hover:bg-brand-red/20 flex items-center gap-1 transition-colors mx-auto"
                        >
                          <Trash2 size={12} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-gray">
            Accounts Division users can log in to confirm client payments and manage the payment queue. They do not have access to tax data, client records, or consultant tools.
          </p>
        </div>
      </div>

      {/* ══════════ CREATE MODAL ══════════ */}
      {showCreate && (
        <Modal title="Create Accounts Division User" onClose={() => setShowCreate(false)}>
          {createdCredentials ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-brand-success" />
                <p className="font-semibold text-white">User Created Successfully!</p>
              </div>
              <div className="bg-brand-black rounded-lg p-4 font-mono text-sm space-y-1.5 mb-5">
                <p><span className="text-brand-gray">Name: </span><span className="text-white">{createdCredentials.name}</span></p>
                <p><span className="text-brand-gray">Email: </span><span className="text-brand-yellow">{createdCredentials.email}</span></p>
                <p><span className="text-brand-gray">Username: </span><span className="text-white">{createdCredentials.username}</span></p>
                <p><span className="text-brand-gray">Password: </span><span className="text-brand-red">{createdCredentials.password}</span></p>
              </div>
              <p className="text-xs text-brand-gray mb-4">The user must change their password on first login.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setCreatedCredentials(null)} className="btn-secondary text-xs">Create Another</button>
                <button onClick={() => setShowCreate(false)} className="btn-primary text-xs">Done</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required error={createErrors.first_name?.[0]}>
                  <input
                    className={clsx('input-field', createErrors.first_name && 'border-brand-red')}
                    value={createForm.first_name}
                    onChange={e => setCreateForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                </Field>
                <Field label="Last Name" required error={createErrors.last_name?.[0]}>
                  <input
                    className={clsx('input-field', createErrors.last_name && 'border-brand-red')}
                    value={createForm.last_name}
                    onChange={e => setCreateForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </Field>
              </div>
              <Field label="Email Address" required error={createErrors.email?.[0]}>
                <input
                  type="email"
                  className={clsx('input-field', createErrors.email && 'border-brand-red')}
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="accounts@example.com"
                />
              </Field>
              <Field label="Username" required error={createErrors.username?.[0]}>
                <input
                  className={clsx('input-field', createErrors.username && 'border-brand-red')}
                  value={createForm.username}
                  onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="username"
                />
              </Field>
              <Field label="Phone" error={createErrors.phone?.[0]}>
                <input
                  className="input-field"
                  value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone number (optional)"
                />
              </Field>
              <Field label="Temporary Password" required error={createErrors.password?.[0]}>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={clsx('input-field pr-20', createErrors.password && 'border-brand-red')}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={() => setShowPass(v => !v)} className="text-brand-gray hover:text-white p-1">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm(f => ({ ...f, password: generatePassword() }))}
                      className="text-xs text-brand-yellow hover:opacity-80 px-1"
                    >
                      Gen
                    </button>
                  </div>
                </div>
                <p className="text-xs text-brand-gray mt-1">User must change on first login.</p>
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
                    : <><UserPlus size={14} /> Create User</>}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ══════════ DEACTIVATE MODAL ══════════ */}
      {deleteTarget && (
        <Modal title="Deactivate User" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-brand-gray mb-2">
            Are you sure you want to deactivate{' '}
            <span className="text-white font-semibold">{deleteTarget.name}</span>?
          </p>
          <p className="text-xs text-brand-gray mb-5">
            They will lose access to the Accounts Division portal immediately. This action can be reversed by creating a new account.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-brand-red text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2"
            >
              {deleteMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deactivating…</>
                : <><Trash2 size={14} /> Confirm Deactivate</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
