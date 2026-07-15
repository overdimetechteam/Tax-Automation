import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import api from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { User, Save, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeclarantSection({ submissionId, isReadOnly, onNext, onPrev, onRefresh }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const { data: existing, refetch } = useQuery({
    queryKey: ['declarant', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/declarant/`).then(r => r.data),
  })

  const { data: clientProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/clients/my-profile/').then(r => r.data),
    enabled: !isReadOnly,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (!existing) return
    reset({
      ...existing,
      mobile: existing.mobile || clientProfile?.mobile || '',
    })
  }, [existing, clientProfile])

  async function onSubmit(data) {
    setSaving(true)
    try {
      await api.post(`/tax/submissions/${submissionId}/declarant/`, data)
      toast.success('Declarant details saved')
      await refetch()
      onRefresh()
      return true
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'Failed to save'
      toast.error(msg)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    if (existing?.id) {
      onNext()
      return
    }
    handleSubmit(async (data) => {
      const saved = await onSubmit(data)
      if (saved) onNext()
    })()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="form-section">
        <h3 className="section-header">
          <User size={18} className="text-brand-yellow" />
          Declarant Details
        </h3>

        <p className="text-sm text-brand-gray mb-6">
          Personal and legal information of the person filing this tax return.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="input-label">
              1. Full Name of the Declarant <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('full_name', { required: 'Full name is required' })}
              className={`input-field ${errors.full_name ? 'border-brand-red' : ''}`}
              placeholder="Enter full legal name"
              disabled={isReadOnly}
            />
            {errors.full_name && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.full_name.message}
              </p>
            )}
          </div>

          {/* Telephone */}
          <div>
            <label className="input-label">
              2. Telephone Number <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('telephone', { required: 'Telephone number is required' })}
              className={`input-field ${errors.telephone ? 'border-brand-red' : ''}`}
              placeholder="+94 11 000 0000"
              disabled={isReadOnly}
            />
            {errors.telephone && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.telephone.message}
              </p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="input-label">
              3. Mobile Number <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('mobile', { required: 'Mobile number is required' })}
              className={`input-field ${errors.mobile ? 'border-brand-red' : ''}`}
              placeholder="+94 77 000 0000"
              disabled={isReadOnly}
            />
            {errors.mobile && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.mobile.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="input-label">
              4. Email Address <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
              })}
              type="email"
              className={`input-field ${errors.email ? 'border-brand-red' : ''}`}
              placeholder="email@example.com"
              disabled={isReadOnly}
            />
            {errors.email && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.email.message}
              </p>
            )}
          </div>

          {/* NIC / Passport */}
          <div>
            <label className="input-label">
              5. National Identity Card No. / Passport No. <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('nic_passport', { required: 'NIC/Passport is required' })}
              className={`input-field ${errors.nic_passport ? 'border-brand-red' : ''}`}
              placeholder="199XXXXXXXXV or Passport No."
              disabled={isReadOnly}
            />
            {errors.nic_passport && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.nic_passport.message}
              </p>
            )}
          </div>

          {/* TIN */}
          <div>
            <label className="input-label">
              6. TIN (Taxpayer Identification Number) <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('tin', { required: 'TIN is required' })}
              className={`input-field ${errors.tin ? 'border-brand-red' : ''}`}
              placeholder="TIN number"
              disabled={isReadOnly}
            />
            {errors.tin && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.tin.message}
              </p>
            )}
          </div>

          {/* PIN */}
          <div>
            <label className="input-label">
              7. PIN <span className="text-brand-red">*</span>
            </label>
            <input
              {...register('pin', { required: 'PIN is required' })}
              className={`input-field ${errors.pin ? 'border-brand-red' : ''}`}
              placeholder="PIN"
              disabled={isReadOnly}
            />
            {errors.pin && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.pin.message}
              </p>
            )}
          </div>
        </div>

        {/* Declaration box */}
        <div className="mt-6 bg-brand-black-soft border border-brand-gray-border rounded-lg p-4">
          <p className="text-xs text-brand-gray leading-relaxed">
            <span className="text-white font-semibold">Declaration: </span>
            I hereby declare that the information provided in this form is true, complete, and accurate to the best of my knowledge
            and belief. I understand that providing false or misleading information may result in penalties under the Inland Revenue Act.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Declarant Details'}
            </button>
          </div>
        )}
      </form>

      <div className="flex justify-between">
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ChevronLeft size={15} /> Previous
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          Next: Review & Submit <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
