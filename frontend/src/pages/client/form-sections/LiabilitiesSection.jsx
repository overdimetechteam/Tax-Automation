import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, X, Save, CreditCard } from 'lucide-react'
import api from '../../../services/api'
import FileUpload from '../../../components/common/FileUpload'
import NumberInput from '../../../components/common/NumberInput'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'description',               label: 'Description of Liability',              type: 'text' },
  { key: 'security_on_liability',     label: 'Security on Liability',                 type: 'text' },
  { key: 'date_of_commencement',      label: 'Date of Commencement of the Liability', type: 'date' },
  { key: 'original_amount',           label: 'Original Amount of Liability (Rs.)',    type: 'number' },
  { key: 'amount_as_at_date',         label: 'Amount of Liability as at 31.03.2026 (Rs.)', type: 'number' },
  { key: 'amount_repaid_during_year', label: 'Amount Repaid During the Y/A (Rs.)',   type: 'number' },
]

const DEFAULTS = { description: '', security_on_liability: '', date_of_commencement: '', original_amount: '', amount_as_at_date: '', amount_repaid_during_year: '' }

function fmt(v) {
  const n = Math.round(parseFloat(v || 0))
  return isNaN(n) ? '—' : n.toLocaleString('en-LK')
}

function loanObtainedDuringYear(lib, yearStart, yearEnd) {
  const d = lib.date_of_commencement
  if (!d || !yearStart || !yearEnd) return 0
  return (d >= yearStart && d <= yearEnd) ? parseFloat(lib.original_amount || 0) : 0
}

export default function LiabilitiesSection({ submissionId, submission, documents, onUpload, onDeleteDoc, isReadOnly, onNext, onPrev }) {
  const yearStart = submission?.assessment_year_start || ''
  const yearEnd   = submission?.assessment_year_end   || ''
  const qc = useQueryClient()

  const { data: liabilities = [] } = useQuery({
    queryKey: ['liabilities', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/liabilities/`).then(r => r.data),
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [formVals, setFormVals] = useState({})
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setFormVals({ ...DEFAULTS })
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(lib) {
    const nv = v => (v == null || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) === 0)) ? '' : v
    setFormVals(Object.fromEntries(Object.entries(lib).map(([k, v]) => [k, typeof v === 'object' ? v : nv(v)])))
    setEditId(lib.id)
    setModalOpen(true)
  }

  function cleanPayload(vals) {
    const payload = { ...vals }
    if (payload.date_of_commencement === '' || payload.date_of_commencement == null) {
      payload.date_of_commencement = null
    }
    ;['original_amount', 'amount_as_at_date', 'amount_repaid_during_year'].forEach(k => {
      if (payload[k] === '' || payload[k] == null) payload[k] = 0
    })
    return payload
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editId) {
        await api.patch(`/tax/liabilities/${editId}/`, cleanPayload(formVals))
        toast.success('Updated')
      } else {
        await api.post(`/tax/submissions/${submissionId}/liabilities/`, cleanPayload(formVals))
        toast.success('Added')
      }
      qc.invalidateQueries(['liabilities', submissionId])
      qc.invalidateQueries(['cashflow-suggested', submissionId])
      setModalOpen(false)
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/tax/liabilities/${id}/`)
      qc.invalidateQueries(['liabilities', submissionId])
      qc.invalidateQueries(['cashflow-suggested', submissionId])
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="form-section">
        <h3 className="section-header">
          <CreditCard size={18} className="text-brand-yellow" />
          Liabilities as at 31st March 2026
        </h3>
        <p className="text-sm text-brand-gray mb-3">
          Bank loans, leasing, credit card balances, and all other outstanding liabilities.
        </p>
        <div className="mb-5 px-3 py-2.5 bg-brand-yellow/5 border border-brand-yellow/20 rounded-lg">
          <p className="text-xs text-brand-gray">
            <span className="text-brand-yellow font-semibold">Note: </span>
            Please enter the total outstanding balance, including both the principal (capital) amount and the accumulated interest.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-4">
          {!isReadOnly && (
            <button type="button" onClick={openAdd} className="btn-primary text-sm px-4 py-2">
              <Plus size={14} /> Add Liability
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-brand-gray-border mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-black">
                <th className="table-header text-left w-8">#</th>
                <th className="table-header text-left">Description of Liability</th>
                <th className="table-header text-left">Security on Liability</th>
                <th className="table-header text-left">Date of Commencement</th>
                <th className="table-header text-right">Original Amount of Liability</th>
                <th className="table-header text-right">Loan Obtained During the Year</th>
                <th className="table-header text-right">Amount of Liability as at 31.03.2026</th>
                <th className="table-header text-right">Amount Repaid During the Y/A</th>
                {!isReadOnly && <th className="table-header w-20 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="table-cell text-center text-brand-gray py-10">
                    No liabilities entered — click &quot;Add Liability&quot; to begin
                  </td>
                </tr>
              ) : (
                liabilities.map((lib, idx) => (
                  <tr key={lib.id} className="table-row">
                    <td className="table-cell text-brand-gray">{idx + 1}</td>
                    <td className="table-cell min-w-[160px] text-white">{lib.description || '—'}</td>
                    <td className="table-cell text-brand-gray">{lib.security_on_liability || '—'}</td>
                    <td className="table-cell text-brand-gray">{lib.date_of_commencement || '—'}</td>
                    <td className="table-cell text-right font-mono text-white">{fmt(lib.original_amount)}</td>
                    <td className="table-cell text-right font-mono text-white">
                      {(() => { const v = loanObtainedDuringYear(lib, yearStart, yearEnd); return v > 0 ? fmt(v) : '—' })()}
                    </td>
                    <td className="table-cell text-right font-mono text-white">{fmt(lib.amount_as_at_date)}</td>
                    <td className="table-cell text-right font-mono text-white">{fmt(lib.amount_repaid_during_year)}</td>
                    {!isReadOnly && (
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(lib)} className="text-brand-yellow hover:opacity-80 transition-opacity" title="Edit"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(lib.id)} className="text-brand-red hover:opacity-80 transition-opacity" title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
              {liabilities.length > 0 && (
                <tr className="border-t border-brand-gray-border bg-brand-black/40">
                  <td className="table-cell font-semibold text-white" colSpan={4}>Total</td>
                  <td className="table-cell text-right font-mono font-semibold text-brand-yellow">
                    {fmt(liabilities.reduce((s, l) => s + parseFloat(l.original_amount || 0), 0))}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold text-brand-yellow">
                    {fmt(liabilities.reduce((s, l) => s + loanObtainedDuringYear(l, yearStart, yearEnd), 0))}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold text-brand-yellow">
                    {fmt(liabilities.reduce((s, l) => s + parseFloat(l.amount_as_at_date || 0), 0))}
                  </td>
                  <td className="table-cell text-right font-mono font-semibold text-brand-yellow">
                    {fmt(liabilities.reduce((s, l) => s + parseFloat(l.amount_repaid_during_year || 0), 0))}
                  </td>
                  {!isReadOnly && <td className="table-cell" />}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-brand-gray">
            <span className="text-brand-yellow font-medium">Note:</span> Please attach Confirmation Letters from Bank or Financial Institute for all listed liabilities.
          </p>
        </div>

        <FileUpload
          label="Bank / Financial Institute Confirmation Letters"
          documentType="bank_confirmation_letter"
          section="liabilities"
          submissionId={submissionId}
          documents={documents}
          onUpload={onUpload}
          onDelete={onDeleteDoc}
          required
          hint="Required for all liabilities"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ChevronLeft size={15} /> Previous
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Receipts & Payments <ChevronRight size={15} />
        </button>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-gray-border sticky top-0 bg-brand-black-light z-10">
              <div>
                <h3 className="text-white font-semibold">
                  {editId ? 'Edit Liability' : 'Add Liability'}
                </h3>
                <p className="text-xs text-brand-gray mt-0.5">
                  {editId ? 'Update the details below' : 'Enter the liability details'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-brand-gray hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-brand-gray mb-1.5 font-medium uppercase tracking-wider">
                    {field.label}
                  </label>
                  {field.type === 'number' ? (
                    <NumberInput
                      value={formVals[field.key] ?? ''}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                      className="input-field w-full text-right font-mono"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formVals[field.key] ?? ''}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                      className="input-field w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-brand-gray-border">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : editId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
