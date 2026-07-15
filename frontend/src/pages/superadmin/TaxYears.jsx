import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { CalendarPlus, CalendarDays, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

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

// Sri Lanka Y/A period runs April 1 → March 31 of the following year.
function defaultsForYear(year) {
  const y = parseInt(year, 10)
  if (!y || Number.isNaN(y)) return { label: '', assessment_year_start: '', assessment_year_end: '' }
  return {
    label: `Y/A ${y}/${y + 1}`,
    assessment_year_start: `${y}-04-01`,
    assessment_year_end: `${y + 1}-03-31`,
  }
}

const EMPTY_FORM = { year: '', label: '', assessment_year_start: '', assessment_year_end: '', personal_relief: '1800000', is_active: true }

export default function TaxYears() {
  const qc = useQueryClient()

  const { data: years = [], isLoading } = useQuery({
    queryKey: ['tax-years-all'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  function handleYearChange(value) {
    setForm(f => ({ ...f, year: value, ...defaultsForYear(value) }))
  }

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/tax/years/', {
      ...data,
      year: parseInt(data.year, 10),
      personal_relief: data.personal_relief || '0',
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['tax-years-all'])
      qc.invalidateQueries(['tax-years'])
      toast.success('Year of Assessment created successfully!')
      setShowCreate(false)
      setForm(EMPTY_FORM)
      setErrors({})
    },
    onError: (err) => setErrors(err.response?.data || {}),
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Years of Assessment"
        subtitle="Create and manage the tax years available across the portal"
      />

      <div className="flex justify-end mb-6">
        <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setErrors({}) }} className="btn-primary">
          <CalendarPlus size={15} /> New Year of Assessment
        </button>
      </div>

      <div className="card">
        <div className="section-header mb-4">
          <CalendarDays size={18} className="text-brand-yellow" />
          All Years of Assessment
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : years.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={36} className="mx-auto text-brand-gray mb-3 opacity-30" />
            <p className="text-brand-gray text-sm">No years of assessment yet.</p>
            <p className="text-xs text-brand-gray/60 mt-1">Create one above to make it available across the portal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left rounded-tl-lg">Label</th>
                  <th className="table-header text-left">Period</th>
                  <th className="table-header text-right">Personal Relief (Rs.)</th>
                  <th className="table-header text-center rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.id} className="table-row">
                    <td className="table-cell font-medium text-white">{y.label}</td>
                    <td className="table-cell text-brand-gray text-sm">{y.assessment_year_start} → {y.assessment_year_end}</td>
                    <td className="table-cell text-right font-mono text-sm text-white">
                      {parseFloat(y.personal_relief).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="table-cell text-center">
                      {y.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/10 text-brand-success">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gray/10 text-brand-gray">
                          <XCircle size={10} /> Inactive
                        </span>
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
            Active years are visible to clients for registration and new submissions. Inactive years remain accessible to consultants and to clients with an approved previous-year request.
          </p>
        </div>
      </div>

      {/* ══════════ CREATE MODAL ══════════ */}
      {showCreate && (
        <Modal title="New Year of Assessment" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Field label="Year (starting)" required error={errors.year?.[0]}>
              <input
                type="number"
                className={clsx('input-field', errors.year && 'border-brand-red')}
                value={form.year}
                onChange={e => handleYearChange(e.target.value)}
                placeholder="e.g. 2026"
              />
              <p className="text-xs text-brand-gray mt-1">The Y/A period runs April 1 of this year to March 31 of the next.</p>
            </Field>
            <Field label="Label" required error={errors.label?.[0]}>
              <input
                className={clsx('input-field', errors.label && 'border-brand-red')}
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Y/A 2026/2027"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" required error={errors.assessment_year_start?.[0]}>
                <input
                  type="date"
                  className={clsx('input-field', errors.assessment_year_start && 'border-brand-red')}
                  value={form.assessment_year_start}
                  onChange={e => setForm(f => ({ ...f, assessment_year_start: e.target.value }))}
                />
              </Field>
              <Field label="End Date" required error={errors.assessment_year_end?.[0]}>
                <input
                  type="date"
                  className={clsx('input-field', errors.assessment_year_end && 'border-brand-red')}
                  value={form.assessment_year_end}
                  onChange={e => setForm(f => ({ ...f, assessment_year_end: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Personal Relief (Rs.)" required error={errors.personal_relief?.[0]}>
              <input
                type="number"
                className={clsx('input-field', errors.personal_relief && 'border-brand-red')}
                value={form.personal_relief}
                onChange={e => setForm(f => ({ ...f, personal_relief: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-brand-gray">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-brand-yellow"
              />
              Active (visible to clients immediately)
            </label>
            {errors.non_field_errors && (
              <p className="text-xs text-brand-red flex items-center gap-1"><AlertCircle size={11} />{errors.non_field_errors[0]}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.year || !form.label || !form.assessment_year_start || !form.assessment_year_end}
                className="btn-primary"
              >
                {createMutation.isPending
                  ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" /> Creating…</>
                  : <><CalendarPlus size={14} /> Create Year</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
