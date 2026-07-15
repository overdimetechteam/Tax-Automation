import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import {
  ArrowLeft, Calculator, MessageSquare, FileText, Download,
  CheckCircle, Eye, Send, Archive, Calendar, Plus, X, Pencil, Save
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [infoModal, setInfoModal] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [assignYearsModal, setAssignYearsModal] = useState(false)
  const [selectedYears, setSelectedYears] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [editDraft, setEditDraft] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.get(`/clients/${clientId}/`).then(r => r.data),
  })

  const { data: submissions = [] } = useQuery({
    queryKey: ['client-submissions', clientId, client?.user_id],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data.filter(s => s.client === client?.user_id)),
    enabled: !!client?.user_id,
  })

  const { data: assessmentYears = [] } = useQuery({
    queryKey: ['assessment-years', clientId],
    queryFn: () => api.get(`/clients/${clientId}/assessment-years/`).then(r => r.data),
    enabled: !!clientId,
  })

  const { data: taxYears = [] } = useQuery({
    queryKey: ['tax-years-all'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
    enabled: assignYearsModal,
  })

  const latestSubmission = submissions[0]

  const requestInfo = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${latestSubmission.id}/request-info/`, { message: infoMessage }),
    onSuccess: () => {
      toast.success('Information request sent to client')
      setInfoModal(false)
      setInfoMessage('')
      qc.invalidateQueries(['client-submissions', clientId])
    },
    onError: () => toast.error('Failed to send request'),
  })

  const sendForm = useMutation({
    mutationFn: ({ yearId }) => api.post('/tax/send-form/', {
      client_profile_id: Number(clientId),
      tax_year_id: yearId,
    }),
    onSuccess: (data, { yearLabel }) => {
      toast.success(`Form sent for ${yearLabel}`)
      qc.invalidateQueries(['assessment-years', clientId])
      qc.invalidateQueries(['client-submissions', clientId, client?.user_id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send form'),
  })

  const sendAllForms = useMutation({
    mutationFn: (yearIds) => api.post('/tax/send-forms-bulk/', {
      client_profile_id: Number(clientId),
      tax_year_ids: yearIds,
    }),
    onSuccess: (data) => {
      const { sent = [], skipped = [] } = data.data
      if (sent.length > 0) {
        toast.success(`${sent.length} form(s) sent successfully`)
      }
      if (skipped.length > 0) {
        toast(`${skipped.length} year(s) skipped (already sent)`, { icon: 'ℹ️' })
      }
      qc.invalidateQueries(['assessment-years', clientId])
      qc.invalidateQueries(['client-submissions', clientId, client?.user_id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send forms'),
  })

  const assignYears = useMutation({
    mutationFn: () => api.post(`/clients/${clientId}/assessment-years/`, { year_ids: selectedYears }),
    onSuccess: () => {
      toast.success('Assessment years assigned')
      setAssignYearsModal(false)
      setSelectedYears([])
      qc.invalidateQueries(['assessment-years', clientId])
    },
    onError: () => toast.error('Failed to assign years'),
  })

  function openEditProfile() {
    setEditDraft({
      full_name: client?.full_name || '',
      tin: client?.tin || '',
      pin: client?.pin || '',
      nic_passport: client?.nic_passport || '',
      telephone: client?.telephone || '',
      mobile: client?.mobile || '',
      address: client?.address || '',
    })
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!editDraft.full_name?.trim()) {
      toast.error('Full name is required')
      return
    }
    setEditSaving(true)
    try {
      await api.patch(`/clients/${clientId}/`, editDraft)
      toast.success('Client profile updated')
      qc.invalidateQueries(['client', clientId])
      setEditingProfile(false)
    } catch (err) {
      const errs = err.response?.data
      if (errs) Object.values(errs).flat().forEach(msg => toast.error(msg))
      else toast.error('Failed to save changes')
    }
    setEditSaving(false)
  }

  async function downloadPDF(submissionId) {
    try {
      const response = await api.get(`/tax/submissions/${submissionId}/pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Tax_Return_${latestSubmission?.tax_year_label}.pdf`
      a.click()
    } catch { toast.error('Failed to download PDF') }
  }

  function toggleYear(id) {
    setSelectedYears(prev =>
      prev.includes(id) ? prev.filter(y => y !== id) : [...prev, id]
    )
  }

  const assignedYearIds = assessmentYears.map(a => a.year_id)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button onClick={() => navigate('/consultant/clients')} className="btn-ghost text-sm mb-4">
          <ArrowLeft size={15} /> Back to Clients
        </button>
        <PageHeader
          title={client?.full_name || 'Client'}
          subtitle={client?.email}
          actions={
            latestSubmission && ['submitted', 'under_review'].includes(latestSubmission.status) ? (
              <button onClick={() => setInfoModal(true)} className="btn-secondary">
                <MessageSquare size={15} /> Request Info
              </button>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile + Assessment Years */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-header mb-0">Client Profile</h3>
              {!editingProfile && (
                <button onClick={openEditProfile} className="btn-ghost text-xs px-2.5 py-1.5">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-3">
                {[
                  ['full_name', 'Full Name', 'text', true],
                  ['tin', 'TIN', 'text', false],
                  ['pin', 'PIN', 'text', false],
                  ['nic_passport', 'NIC / Passport', 'text', false],
                  ['telephone', 'Telephone', 'text', false],
                  ['mobile', 'Mobile', 'text', false],
                ].map(([key, label, type, required]) => (
                  <div key={key}>
                    <label className="text-xs text-brand-gray block mb-1">
                      {label}{required && <span className="text-brand-red ml-0.5">*</span>}
                    </label>
                    <input
                      type={type}
                      value={editDraft[key] || ''}
                      onChange={e => setEditDraft(d => ({ ...d, [key]: e.target.value }))}
                      className="input-field text-sm py-1.5"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-brand-gray block mb-1">Address</label>
                  <textarea
                    value={editDraft.address || ''}
                    onChange={e => setEditDraft(d => ({ ...d, address: e.target.value }))}
                    rows={2}
                    className="input-field text-sm py-1.5 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveProfile}
                    disabled={editSaving}
                    className="btn-primary text-xs flex-1"
                  >
                    <Save size={12} /> {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ['Status', <StatusBadge status={client?.status} />],
                  ['TIN', client?.tin || '—'],
                  ['PIN', client?.pin || '—'],
                  ['NIC/Passport', client?.nic_passport || '—'],
                  ['Telephone', client?.telephone || '—'],
                  ['Mobile', client?.mobile || '—'],
                  ['Address', client?.address || '—'],
                  ['Registered', formatDateTime(client?.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start">
                    <span className="text-xs text-brand-gray">{label}</span>
                    <span className="text-sm text-white font-medium text-right max-w-[60%] break-words">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Years card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header mb-0">
                <Calendar size={16} className="text-brand-yellow" />
                Assessment Years
              </h3>
              <button
                onClick={() => setAssignYearsModal(true)}
                className="btn-secondary text-xs px-2.5 py-1.5"
              >
                <Plus size={12} /> Assign
              </button>
            </div>

            {/* Send All Pending button */}
            {(() => {
              const pendingYears = assessmentYears.filter(ay => !ay.form_sent)
              if (pendingYears.length === 0) return null
              return (
                <button
                  onClick={() => sendAllForms.mutate(pendingYears.map(ay => ay.year_id))}
                  disabled={sendAllForms.isPending}
                  className="btn-primary w-full text-sm mb-4"
                >
                  <Send size={14} />
                  {sendAllForms.isPending
                    ? 'Sending…'
                    : `Send All Pending Forms (${pendingYears.length})`}
                </button>
              )
            })()}

            {assessmentYears.length === 0 ? (
              <p className="text-xs text-brand-gray text-center py-4">
                No assessment years assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {assessmentYears.map(ay => (
                  <div
                    key={ay.id}
                    className={clsx(
                      'rounded-lg p-3 border',
                      ay.form_sent
                        ? 'bg-brand-success/5 border-brand-success/20'
                        : 'bg-brand-black-soft border-brand-gray-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{ay.year_label}</p>
                        <p className="text-xs text-brand-gray mt-0.5">Starts {ay.assessment_year_start}</p>
                        {ay.submission_status && (
                          <div className="mt-1">
                            <StatusBadge status={ay.submission_status} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {ay.form_sent ? (
                          <span className="text-xs text-brand-success flex items-center gap-1">
                            <CheckCircle size={11} /> Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => sendForm.mutate({ yearId: ay.year_id, yearLabel: ay.year_label })}
                            disabled={sendForm.isPending}
                            className="btn-primary text-xs px-2.5 py-1.5"
                          >
                            <Send size={11} /> Send Form
                          </button>
                        )}
                        {ay.submission_id && (
                          <button
                            onClick={() => navigate(`/consultant/submissions/${ay.submission_id}/calculate`)}
                            className="btn-ghost text-xs px-2 py-1"
                          >
                            <Eye size={11} /> View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Submissions */}
        <div className="lg:col-span-2 space-y-4">
          {submissions.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={32} className="mx-auto text-brand-gray mb-3 opacity-40" />
              <p className="text-brand-gray">No submissions yet</p>
              <p className="text-xs text-brand-gray mt-1">Assign an assessment year and send the form to begin.</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-white">{sub.tax_year_label}</h4>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {['calculation_done', 'awaiting_confirmation', 'confirmed', 'archived',
                      'awaiting_client_review', 'client_confirmed'].includes(sub.status) && (
                      <button onClick={() => downloadPDF(sub.id)} className="btn-secondary text-xs px-3 py-1.5">
                        <Download size={13} /> PDF
                      </button>
                    )}
                    {['submitted', 'under_review', 'info_requested'].includes(sub.status) && (
                      <button
                        onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Calculator size={13} /> Calculate Tax
                      </button>
                    )}
                    {sub.status === 'confirmed' && sub.payment_status === 'paid' && (
                      <button
                        onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                        className="btn-primary text-xs px-3 py-1.5 bg-brand-success border-brand-success"
                      >
                        <Send size={13} /> Send to Client
                      </button>
                    )}
                    {sub.status === 'client_confirmed' && (
                      <button
                        onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                        className="btn-primary text-xs px-3 py-1.5 bg-brand-success border-brand-success"
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                      className="btn-ghost text-xs"
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Assessable Income', formatCurrency(sub.total_assessable_income)],
                    ['Net Taxable', formatCurrency(sub.net_taxable_income)],
                    ['Tax Credits', formatCurrency(sub.total_tax_credits)],
                    ['Net Tax Payable', formatCurrency(sub.net_tax_payable)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-brand-black-soft rounded-lg p-3">
                      <p className="text-xs text-brand-gray">{label}</p>
                      <p className="text-sm font-semibold text-white font-mono mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {sub.info_request_message && (
                  <div className="mt-3 bg-brand-red/10 border border-brand-red/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-red font-medium">Info Requested:</p>
                    <p className="text-xs text-brand-gray mt-0.5">{sub.info_request_message}</p>
                  </div>
                )}
                {sub.status === 'confirmed' && sub.payment_status !== 'paid' && (
                  <div className="mt-3 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-orange-400 font-medium">⏳ Awaiting payment confirmation from Accounts Division</p>
                  </div>
                )}
                {sub.status === 'confirmed' && sub.payment_status === 'paid' && (
                  <div className="mt-3 bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-success font-medium">✓ Payment confirmed — Send the tax form to client for review</p>
                  </div>
                )}
                {sub.status === 'awaiting_client_review' && (
                  <div className="mt-3 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-400 font-medium">⏳ Tax form sent — Awaiting client review and confirmation</p>
                  </div>
                )}
                {sub.status === 'client_confirmed' && (
                  <div className="mt-3 bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-success font-medium">✓ Client confirmed — Ready to mark complete and archive</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Info Modal */}
      <Modal isOpen={infoModal} onClose={() => setInfoModal(false)} title="Request Additional Information">
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Specify what information or documents you need from{' '}
            <span className="text-white">{client?.full_name}</span>.
          </p>
          <div>
            <label className="input-label">Message to Client <span className="text-brand-red">*</span></label>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              rows={4}
              placeholder="e.g., Please provide the T10 certificate from your employer..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setInfoModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => requestInfo.mutate()}
              disabled={!infoMessage.trim() || requestInfo.isPending}
              className="btn-primary"
            >
              <MessageSquare size={14} /> Send Request
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Assessment Years Modal */}
      {assignYearsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-brand-gray-border">
              <div>
                <h3 className="text-white font-semibold">Assign Assessment Years</h3>
                <p className="text-xs text-brand-gray mt-0.5">Select the years for {client?.full_name}</p>
              </div>
              <button onClick={() => setAssignYearsModal(false)} className="text-brand-gray hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {taxYears.length === 0 ? (
                <p className="text-sm text-brand-gray text-center py-4">No tax years available.</p>
              ) : (
                taxYears.map(year => {
                  const alreadyAssigned = assignedYearIds.includes(year.id)
                  return (
                    <button
                      key={year.id}
                      type="button"
                      disabled={alreadyAssigned}
                      onClick={() => !alreadyAssigned && toggleYear(year.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        alreadyAssigned
                          ? 'bg-brand-black opacity-50 border-brand-gray-border cursor-not-allowed'
                          : selectedYears.includes(year.id)
                          ? 'bg-brand-yellow/10 border-brand-yellow text-white'
                          : 'bg-brand-black-soft border-brand-gray-border text-brand-gray hover:border-brand-gray'
                      )}
                    >
                      <div className={clsx(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                        alreadyAssigned ? 'bg-brand-success border-brand-success' :
                        selectedYears.includes(year.id) ? 'bg-brand-yellow border-brand-yellow' : 'border-brand-gray'
                      )}>
                        {(alreadyAssigned || selectedYears.includes(year.id)) && (
                          <CheckCircle size={10} className="text-brand-black" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{year.label}</p>
                        <p className="text-xs text-brand-gray">
                          {alreadyAssigned ? 'Already assigned' : `Starts ${year.assessment_year_start}`}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-brand-gray-border">
              <button onClick={() => setAssignYearsModal(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => assignYears.mutate()}
                disabled={selectedYears.length === 0 || assignYears.isPending}
                className="btn-primary"
              >
                <Calendar size={14} /> {assignYears.isPending ? 'Assigning…' : `Assign ${selectedYears.length > 0 ? `(${selectedYears.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
