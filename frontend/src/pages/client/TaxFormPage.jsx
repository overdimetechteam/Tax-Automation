import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import IncomeSection from './form-sections/IncomeSection'
import AssetsSection from './form-sections/AssetsSection'
import LiabilitiesSection from './form-sections/LiabilitiesSection'
import CashFlowSection from './form-sections/CashFlowSection'
import DeclarantSection from './form-sections/DeclarantSection'
import ReviewSection from './form-sections/ReviewSection'
import {
  Building2, CreditCard, User, FileCheck, CheckCircle, BarChart2
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

function RsIcon({ size = 16, className = '' }) {
  return (
    <span
      style={{ fontSize: Math.round(size * 0.75), lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
      className={`font-bold font-mono ${className}`}
    >
      Rs
    </span>
  )
}

const STEPS = [
  { id: 'income',      label: 'Income & Expenses',         icon: RsIcon,      shortLabel: 'Income' },
  { id: 'assets',      label: 'Assets',                    icon: Building2,   shortLabel: 'Assets' },
  { id: 'liabilities', label: 'Liabilities',               icon: CreditCard,  shortLabel: 'Liabilities' },
  { id: 'cashflow',    label: 'Receipts & Payments',       icon: BarChart2,   shortLabel: 'Cash Flow' },
  { id: 'declarant',   label: 'Declarant Details',         icon: User,        shortLabel: 'Declarant' },
  { id: 'review',      label: 'Review & Submit',           icon: FileCheck,   shortLabel: 'Review' },
]

export default function TaxFormPage() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/`).then(r => r.data),
    enabled: !!submissionId,
  })

  const { data: documents = [], refetch: refetchDocs } = useQuery({
    queryKey: ['documents', submissionId],
    queryFn: () => api.get(`/documents/submission/${submissionId}/`).then(r => r.data),
    enabled: !!submissionId,
  })

  useEffect(() => {
    if (!submissionId) {
      navigate('/client/dashboard')
    }
  }, [submissionId, navigate])

  async function handleUpload(_, formData) {
    try {
      await api.post(`/documents/submission/${submissionId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      refetchDocs()
      toast.success('Document uploaded')
    } catch (err) {
      toast.error(err.response?.data?.file?.[0] || 'Upload failed')
      throw err
    }
  }

  async function handleDeleteDoc(docId) {
    try {
      await api.delete(`/documents/${docId}/`)
      refetchDocs()
      toast.success('Document removed')
    } catch {
      toast.error('Failed to remove document')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isReadOnly = submission && !['draft', 'info_requested'].includes(submission.status)

  const sharedProps = {
    submissionId,
    submission,
    documents,
    onUpload: handleUpload,
    onDeleteDoc: handleDeleteDoc,
    isReadOnly,
    onNext: () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1)),
    onPrev: () => setCurrentStep(s => Math.max(s - 1, 0)),
    onGoToStep: (idx) => setCurrentStep(idx),
    onRefresh: () => qc.invalidateQueries(['submission', submissionId]),
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Personal Income Tax Form"
        subtitle={`${submission?.tax_year_label || ''} — ${isReadOnly ? 'View Only' : 'Complete all sections and submit'}`}
      />

      {isReadOnly && (
        <div className="mb-6 bg-brand-info/10 border border-brand-info/30 rounded-xl p-3 flex items-center gap-2 text-sm text-brand-gray">
          <CheckCircle size={15} className="text-brand-info" />
          Form is in <span className="text-white font-medium capitalize mx-1">{submission?.status?.replace('_', ' ')}</span> status — read only view
        </div>
      )}

      {/* Stepper */}
      <div className="card mb-6 p-4">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-brand-gray-border" style={{ marginLeft: '2rem', marginRight: '2rem' }} />
          <div
            className="absolute top-4 h-0.5 bg-brand-yellow transition-all duration-500"
            style={{
              left: '2rem',
              right: '2rem',
              clipPath: `inset(0 ${100 - (currentStep / (STEPS.length - 1)) * 100}% 0 0)`
            }}
          />

          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const done = idx < currentStep
            const active = idx === currentStep

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className="relative flex flex-col items-center gap-1.5 z-10"
              >
                <div className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                  done
                    ? 'bg-brand-yellow border-brand-yellow'
                    : active
                    ? 'bg-brand-black border-brand-yellow shadow-glow-yellow'
                    : 'bg-brand-black-soft border-brand-gray-border'
                )}>
                  {done
                    ? <CheckCircle size={16} className="text-brand-black" />
                    : <Icon size={15} className={active ? 'text-brand-yellow' : 'text-brand-gray'} />
                  }
                </div>
                <span className={clsx(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-brand-yellow' : done ? 'text-white' : 'text-brand-gray'
                )}>
                  {step.shortLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div>
        {currentStep === 0 && <IncomeSection {...sharedProps} />}
        {currentStep === 1 && <AssetsSection {...sharedProps} />}
        {currentStep === 2 && <LiabilitiesSection {...sharedProps} />}
        {currentStep === 3 && <CashFlowSection {...sharedProps} />}
        {currentStep === 4 && <DeclarantSection {...sharedProps} />}
        {currentStep === 5 && <ReviewSection {...sharedProps} />}
      </div>
    </div>
  )
}
