import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  FileText, Plus, Clock, CheckCircle, AlertCircle, ArrowRight,
  TrendingUp, Calendar, Bell, ChevronRight, Lock, Unlock, Download, Eye,
  Paperclip, X
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [docsSubmission, setDocsSubmission] = useState(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data),
  })

  const { data: taxYears = [] } = useQuery({
    queryKey: ['tax-years'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?unread=true').then(r => r.data),
  })

  const createSubmission = useMutation({
    mutationFn: (taxYearId) => api.post('/tax/submissions/', { tax_year: taxYearId }),
    onSuccess: (data) => {
      qc.invalidateQueries(['my-submissions'])
      navigate(`/client/tax-form/${data.data.id}`)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create submission'),
  })

  // Previous year access requests (Change 13)
  const { data: accessRequests = [] } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.get('/tax/access-requests/').then(r => r.data).catch(() => []),
  })

  const requestAccess = useMutation({
    mutationFn: (taxYearId) => api.post('/tax/access-requests/', { tax_year: taxYearId }),
    onSuccess: () => {
      toast.success('Access request submitted. Awaiting admin approval.')
      qc.invalidateQueries(['access-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit request'),
  })

  const getAccessInfo = (yearId) => {
    const req = accessRequests.find(r => r.tax_year === yearId)
    return req || null
  }

  const getAccessStatus = (yearId) => getAccessInfo(yearId)?.status || null

  const activeYear = taxYears.find(y => y.is_active)
  const currentSubmission = submissions.find(s => s.tax_year === activeYear?.id)

  async function downloadPdf(sub) {
    try {
      const res = await api.get(`/tax/submissions/${sub.id}/pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Tax_Return_${sub.tax_year_label?.replace(/\//g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF not available yet. Please wait for payment confirmation.')
    }
  }

  async function downloadFinalDocument(sub) {
    if (!sub.final_document_url) {
      toast.error('Final return document is not available yet.')
      return
    }
    try {
      const res = await api.get(sub.final_document_url, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Final_Tax_Return_${sub.tax_year_label?.replace(/\//g, '-')}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(sub.final_document_url, '_blank')
    }
  }

  // Documents attached to the form while it was being filled in (supporting
  // documents like salary slips, WHT certs, etc.) — fetched on demand when the
  // client opens the "View Documents" modal for a past submission.
  const { data: submissionDocuments = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', docsSubmission?.id],
    queryFn: () => api.get(`/documents/submission/${docsSubmission.id}/`).then(r => r.data),
    enabled: !!docsSubmission,
  })

  async function downloadDocument(doc) {
    try {
      const res = await api.get(doc.file_url, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(doc.file_url, '_blank')
    }
  }

  const statusIcon = (status) => {
    const icons = {
      draft: <FileText size={16} className="text-brand-gray" />,
      submitted: <Clock size={16} className="text-brand-info" />,
      info_requested: <AlertCircle size={16} className="text-brand-red" />,
      awaiting_confirmation: <Bell size={16} className="text-brand-yellow" />,
      confirmed: <CheckCircle size={16} className="text-brand-success" />,
      archived: <CheckCircle size={16} className="text-brand-success" />,
    }
    return icons[status] || <FileText size={16} className="text-brand-gray" />
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Client'}`}
        subtitle="Manage your personal income tax submissions"
      />

      {/* Info request alert */}
      {currentSubmission?.status === 'info_requested' && (
        <div className="mb-6 bg-brand-red/10 border border-brand-red/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle size={18} className="text-brand-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Action Required</p>
            <p className="text-sm text-brand-gray mt-0.5">{currentSubmission.info_request_message}</p>
            <button
              onClick={() => navigate(`/client/tax-form/${currentSubmission.id}`)}
              className="btn-danger mt-3 text-xs"
            >
              Update Submission <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Awaiting confirmation — payment notice only, no tax figures */}
      {currentSubmission?.status === 'awaiting_confirmation' && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <Bell size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Payment Required</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your tax return for <span className="text-white">{currentSubmission.tax_year_label}</span> has been processed.
              Please contact the office to arrange payment.
            </p>
            <button
              onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
              className="btn-primary mt-3 text-xs"
            >
              View Payment Notice <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmed — awaiting accounts payment confirmation */}
      {currentSubmission?.status === 'confirmed' && (
        <div className="mb-6 bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <Clock size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Awaiting Payment Confirmation</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your payment notice has been acknowledged. Accounts Division is confirming your payment. Your consultant will notify you once finalised.
            </p>
          </div>
        </div>
      )}

      {/* Awaiting client review — full tax computation ready */}
      {currentSubmission?.status === 'awaiting_client_review' && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <FileText size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Action Required — Review Your Tax Return</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your tax computation for <span className="text-white">{currentSubmission.tax_year_label}</span> is ready. Please review and confirm.
            </p>
            <button
              onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
              className="btn-primary mt-3 text-xs"
            >
              Review &amp; Confirm <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Client confirmed — waiting for consultant to archive */}
      {currentSubmission?.status === 'client_confirmed' && (
        <div className="mb-6 bg-brand-success/10 border border-brand-success/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <CheckCircle size={18} className="text-brand-success flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Tax Return Confirmed</p>
            <p className="text-sm text-brand-gray mt-0.5">
              You have confirmed your tax return. Your consultant will finalise and archive it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-yellow/15 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-brand-yellow" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-bold text-white">{submissions.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-success/15 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-brand-success" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Archived</p>
            <p className="text-2xl font-bold text-white">
              {submissions.filter(s => s.status === 'archived').length}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-red/15 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-brand-red" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Notifications</p>
            <p className="text-2xl font-bold text-white">{notifications.length}</p>
          </div>
        </div>
      </div>

      {/* Current Year */}
      <div className="card mb-6">
        <div className="section-header">
          <Calendar size={18} className="text-brand-yellow" />
          Current Year of Assessment
        </div>

        {activeYear && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">{activeYear.label}</p>
                <p className="text-sm text-brand-gray">{activeYear.assessment_year_start} — {activeYear.assessment_year_end}</p>
              </div>
              <div>
                {currentSubmission ? (
                  <div className="flex items-center gap-3">
                    <StatusBadge status={currentSubmission.status} />
                    {['draft', 'info_requested'].includes(currentSubmission.status) && (
                      <button
                        onClick={() => navigate(`/client/tax-form/${currentSubmission.id}`)}
                        className="btn-primary"
                      >
                        Continue Form <ArrowRight size={14} />
                      </button>
                    )}
                    {currentSubmission.status === 'awaiting_client_review' && (
                      <button
                        onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
                        className="btn-primary"
                      >
                        Review &amp; Confirm <ChevronRight size={14} />
                      </button>
                    )}
                    {['client_confirmed', 'archived'].includes(currentSubmission.status) && (
                      <button
                        onClick={() => downloadPdf(currentSubmission)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    )}
                    {currentSubmission.status === 'archived' && currentSubmission.final_document_url && (
                      <button
                        onClick={() => downloadFinalDocument(currentSubmission)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Download size={14} /> Download Final Return
                      </button>
                    )}
                    {['client_confirmed', 'archived'].includes(currentSubmission.status) && (
                      <button
                        onClick={() => setDocsSubmission(currentSubmission)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Paperclip size={14} /> View Documents
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => createSubmission.mutate(activeYear.id)}
                    disabled={createSubmission.isPending}
                    className="btn-primary"
                  >
                    <Plus size={15} /> Start Tax Form
                  </button>
                )}
              </div>
            </div>

            {currentSubmission && !['awaiting_confirmation', 'confirmed'].includes(currentSubmission.status) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-brand-black-soft rounded-lg p-3">
                  <p className="text-xs text-brand-gray">Total Assessable Income</p>
                  <p className="text-base font-semibold text-white font-mono">
                    {formatCurrency(currentSubmission.total_assessable_income)}
                  </p>
                </div>
                <div className="bg-brand-black-soft rounded-lg p-3">
                  <p className="text-xs text-brand-gray">Net Tax Payable</p>
                  <p className="text-base font-semibold text-brand-yellow font-mono">
                    {formatCurrency(currentSubmission.net_tax_payable)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <TrendingUp size={18} className="text-brand-yellow" />
            Submission History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg text-left">Year</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-right">Income</th>
                  <th className="table-header text-right">Tax Payable</th>
                  <th className="table-header text-right">Submitted</th>
                  <th className="table-header text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const paymentPending = ['awaiting_confirmation', 'confirmed'].includes(sub.status)
                  const isPast = ['archived', 'client_confirmed'].includes(sub.status)
                  const accessInfo = isPast ? getAccessInfo(sub.tax_year) : null
                  const accessStatus = accessInfo?.status || null

                  return (
                    <tr
                      key={sub.id}
                      className={`table-row ${!isPast || accessStatus === 'approved' ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (['draft', 'info_requested'].includes(sub.status)) navigate(`/client/tax-form/${sub.id}`)
                        else if (['awaiting_confirmation', 'awaiting_client_review'].includes(sub.status)) navigate(`/client/confirm/${sub.id}`)
                        else if (isPast && accessStatus === 'approved') navigate(`/client/tax-form/${sub.id}`)
                      }}
                    >
                      <td className="table-cell font-medium">{sub.tax_year_label}</td>
                      <td className="table-cell"><StatusBadge status={sub.status} /></td>
                      <td className="table-cell text-right font-mono text-brand-gray">
                        {paymentPending ? '—' : formatCurrency(sub.total_assessable_income)}
                      </td>
                      <td className="table-cell text-right font-mono text-brand-yellow">
                        {paymentPending ? '—' : formatCurrency(sub.net_tax_payable)}
                      </td>
                      <td className="table-cell text-right text-brand-gray text-xs">{formatDateTime(sub.submitted_at)}</td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* PDF download — always shown for paid */}
                          {sub.payment_status === 'paid' && (
                            <button
                              onClick={e => { e.stopPropagation(); downloadPdf(sub) }}
                              className="text-brand-yellow hover:opacity-80 transition-opacity"
                              title="Download PDF"
                            >
                              <Download size={15} />
                            </button>
                          )}

                          {/* Final return document — uploaded by consultant when archiving */}
                          {sub.status === 'archived' && sub.final_document_url && (
                            <button
                              onClick={e => { e.stopPropagation(); downloadFinalDocument(sub) }}
                              className="text-brand-success hover:opacity-80 transition-opacity"
                              title="Download Final Return"
                            >
                              <FileText size={15} />
                            </button>
                          )}

                          {/* Documents attached to the form before archiving */}
                          {isPast && (
                            <button
                              onClick={e => { e.stopPropagation(); setDocsSubmission(sub) }}
                              className="text-brand-gray hover:text-brand-yellow transition-opacity"
                              title="View Attached Documents"
                            >
                              <Paperclip size={15} />
                            </button>
                          )}

                          {/* View access control for past submissions */}
                          {isPast && !accessStatus && (
                            <button
                              onClick={e => { e.stopPropagation(); requestAccess.mutate(sub.tax_year) }}
                              disabled={requestAccess.isPending}
                              className="text-xs text-brand-gray hover:text-brand-yellow transition-colors flex items-center gap-1"
                              title="Request consultant approval to view"
                            >
                              <Lock size={12} /> Request View
                            </button>
                          )}
                          {isPast && accessStatus === 'pending' && (
                            <span className="text-xs text-brand-yellow flex items-center gap-1">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                          {isPast && accessStatus === 'denied' && (
                            <button
                              onClick={e => { e.stopPropagation(); requestAccess.mutate(sub.tax_year) }}
                              disabled={requestAccess.isPending}
                              className="text-xs text-brand-red hover:opacity-80 transition-opacity"
                              title="Request again"
                            >
                              Denied — Retry
                            </button>
                          )}
                          {isPast && accessStatus === 'approved' && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/client/tax-form/${sub.id}`) }}
                              className="text-xs text-brand-success hover:opacity-80 transition-opacity flex items-center gap-1"
                              title="View submission"
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Assessment Years — only for years with no existing submission */}
      {taxYears.filter(y => !y.is_active && !submissions.find(s => s.tax_year === y.id)).length > 0 && (
        <div className="mt-6">
          <h2 className="section-header mb-3"><Lock size={15} className="text-brand-gray" />Previous Assessment Years</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {taxYears.filter(y => !y.is_active && !submissions.find(s => s.tax_year === y.id)).map(ty => {
              const existing = null
              const accessStatus = getAccessStatus(ty.id)
              const isApproved = accessStatus === 'approved'

              return (
                <div key={ty.id} className="card border border-brand-gray-border relative overflow-hidden">

                  {/* Locked — no request yet */}
                  {!existing && !accessStatus && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <Lock size={20} className="text-brand-gray mb-2" />
                      <p className="text-xs text-brand-gray text-center mb-3 px-4">You don't have access to this year's data</p>
                      <button
                        onClick={() => requestAccess.mutate(ty.id)}
                        disabled={requestAccess.isPending}
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        Request Access
                      </button>
                    </div>
                  )}

                  {/* Pending approval */}
                  {!existing && accessStatus === 'pending' && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <Clock size={20} className="text-brand-yellow mb-2" />
                      <p className="text-xs text-brand-yellow font-semibold">Pending Approval</p>
                      <p className="text-xs text-brand-gray mt-1 text-center px-4">Your access request is being reviewed</p>
                    </div>
                  )}

                  {/* Denied */}
                  {!existing && accessStatus === 'denied' && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <AlertCircle size={20} className="text-brand-red mb-2" />
                      <p className="text-xs text-brand-red font-semibold">Access Denied</p>
                      <button
                        onClick={() => requestAccess.mutate(ty.id)}
                        className="mt-2 btn-ghost text-xs py-1 px-3"
                      >
                        Request Again
                      </button>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{ty.label}</p>
                    {(existing || isApproved)
                      ? <Unlock size={14} className="text-brand-success" />
                      : <Lock size={14} className="text-brand-gray" />
                    }
                  </div>

                  {isApproved ? (
                    /* Approved but no submission yet — let client start */
                    <div className="mt-1">
                      <p className="text-xs text-brand-success mb-2">Access approved — start your submission</p>
                      <button
                        onClick={() => createSubmission.mutate(ty.id)}
                        disabled={createSubmission.isPending}
                        className="btn-primary text-xs py-1.5 w-full justify-center"
                      >
                        <Plus size={12} /> Start Tax Form
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-gray">No submission for this year</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Attached Documents Modal ── */}
      {docsSubmission && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDocsSubmission(null) }}
        >
          <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border flex-shrink-0">
              <div>
                <p className="font-semibold text-white">Attached Documents</p>
                <p className="text-xs text-brand-gray mt-0.5">{docsSubmission.tax_year_label}</p>
              </div>
              <button onClick={() => setDocsSubmission(null)} className="text-brand-gray hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                </div>
              ) : submissionDocuments.length === 0 ? (
                <p className="text-sm text-brand-gray text-center py-8">No documents were attached to this submission.</p>
              ) : (
                <div className="space-y-2">
                  {submissionDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 bg-brand-black-soft rounded-lg px-3 py-2">
                      <FileText size={13} className="text-brand-yellow flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate">{doc.original_filename}</p>
                        <p className="text-xs text-brand-gray">{doc.document_type_display}</p>
                      </div>
                      <div className="flex gap-1 items-center flex-shrink-0">
                        <a href={doc.file_url} target="_blank" rel="noreferrer"
                          className="p-1 text-brand-gray hover:text-brand-yellow rounded" title="View">
                          <Eye size={13} />
                        </a>
                        <button type="button" onClick={() => downloadDocument(doc)}
                          className="p-1 text-brand-gray hover:text-brand-yellow rounded" title="Download">
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
