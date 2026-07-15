import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { UserPlus, Eye, EyeOff, AlertCircle, Copy, CheckCircle, ChevronDown, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function RegisterClient() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)
  const [selectedYears, setSelectedYears] = useState([])

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { password: generatePassword() }
  })

  const { data: consultants = [], isLoading: consultantsLoading } = useQuery({
    queryKey: ['consultant-list'],
    queryFn: () => api.get('/clients/consultants/').then(r => r.data),
  })

  const { data: taxYears = [] } = useQuery({
    queryKey: ['tax-years-all'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
  })

  function toggleYear(id) {
    setSelectedYears(prev =>
      prev.includes(id) ? prev.filter(y => y !== id) : [...prev, id]
    )
  }

  async function onSubmit(data) {
    setLoading(true)
    try {
      const payload = { ...data, assessment_year_ids: selectedYears }
      if (data.consultant_id) {
        payload.consultant_id = Number(data.consultant_id)
      }
      const res = await api.post('/clients/register/', payload)
      const assignedConsultant = consultants.find(c => String(c.id) === String(data.consultant_id))?.name
      setSuccess({
        email: data.email,
        username: data.username,
        password: data.password,
        name: `${data.first_name} ${data.last_name}`,
        consultant: assignedConsultant,
        smsSent: res.data.sms_sent,
      })
      reset({ password: generatePassword() })
      toast.success('Client registered successfully!')
      if (res.data.sms_sent === true) {
        toast.success('Welcome SMS sent to client.')
      } else if (res.data.sms_sent === false) {
        toast.error('Client registered, but the welcome SMS failed to send.')
      } else {
        toast('No mobile number on file — welcome SMS not sent.', { icon: 'ℹ️' })
      }
    } catch (err) {
      const errs = err.response?.data
      if (errs) {
        Object.values(errs).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Registration failed')
      }
    }
    setLoading(false)
  }

  function copyCredentials() {
    if (!success) return
    const text = `OVERDIME - TMS Login Credentials\n\nEmail: ${success.email}\nUsername: ${success.username}\nPassword: ${success.password}\n\nPlease log in to OVERDIME Tax Management System and change your password immediately.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Credentials copied to clipboard')
  }

  const backPath = isSuperAdmin ? '/super-admin/clients' : '/consultant/clients'

  function Field({ name, label, required, type = 'text', registerProps, error, children }) {
    return (
      <div>
        <label className="input-label">{label}{required && <span className="text-brand-red ml-0.5">*</span>}</label>
        {children || (
          <input
            {...register(name, registerProps)}
            type={type}
            className={clsx('input-field', error && 'border-brand-red focus:border-brand-red')}
            placeholder={label}
          />
        )}
        {error && (
          <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
            <AlertCircle size={11} />{error.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        title="Register New Client"
        subtitle="Create a new client account and assign a handler"
      />

      {success && (
        <div className="mb-6 bg-brand-success/10 border border-brand-success/30 rounded-xl p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-brand-success" />
            <p className="font-semibold text-white">Client Registered Successfully!</p>
          </div>
          <div className="bg-brand-black rounded-lg p-4 font-mono text-sm space-y-1.5">
            <p><span className="text-brand-gray">Name: </span><span className="text-white">{success.name}</span></p>
            <p><span className="text-brand-gray">Email: </span><span className="text-brand-yellow">{success.email}</span></p>
            <p><span className="text-brand-gray">Username: </span><span className="text-white">{success.username}</span></p>
            <p><span className="text-brand-gray">Password: </span><span className="text-brand-red">{success.password}</span></p>
            {success.consultant && (
              <p><span className="text-brand-gray">Assigned to: </span><span className="text-blue-400">{success.consultant}</span></p>
            )}
            <p>
              <span className="text-brand-gray">Welcome SMS: </span>
              {success.smsSent === true && <span className="text-brand-success">Sent</span>}
              {success.smsSent === false && <span className="text-brand-red">Failed to send</span>}
              {(success.smsSent === null || success.smsSent === undefined) && (
                <span className="text-brand-gray">Not sent (no mobile number on file)</span>
              )}
            </p>
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={copyCredentials} className="btn-secondary text-xs">
              {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy Credentials</>}
            </button>
            <button onClick={() => navigate(backPath)} className="btn-primary text-xs">
              View Client List
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        {/* Handler / Consultant selector — always visible */}
        <div className="mb-6 p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
          <label className="input-label text-brand-yellow">
            Assign to Handler <span className="text-brand-red">*</span>
          </label>
          <div className="relative mt-1">
            <select
              {...register('consultant_id', { required: 'Please select a handler' })}
              className={clsx(
                'input-field appearance-none pr-8',
                errors.consultant_id && 'border-brand-red focus:border-brand-red'
              )}
              disabled={consultantsLoading}
            >
              <option value="">
                {consultantsLoading ? 'Loading handlers…' : '— Select Handler —'}
              </option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
          </div>
          {errors.consultant_id && (
            <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
              <AlertCircle size={11} />{errors.consultant_id.message}
            </p>
          )}
          <p className="text-xs text-brand-gray mt-1">This handler will be responsible for managing this client.</p>
        </div>

        <h3 className="section-header">
          <UserPlus size={18} className="text-brand-yellow" />
          Account Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <Field name="first_name" label="First Name" required registerProps={{ required: 'Required' }} error={errors.first_name} />
          <Field name="last_name" label="Last Name" required registerProps={{ required: 'Required' }} error={errors.last_name} />
          <Field name="email" label="Email Address" required type="email" registerProps={{ required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }} error={errors.email} />
          <Field name="username" label="Username" required registerProps={{ required: 'Required', pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' } }} error={errors.username} />
          <Field name="phone" label="Phone Number" registerProps={{}} error={errors.phone} />

          {/* Password */}
          <div>
            <label className="input-label">Password <span className="text-brand-red">*</span></label>
            <div className="relative">
              <input
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                type={showPass ? 'text' : 'password'}
                className={clsx('input-field pr-20', errors.password && 'border-brand-red')}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-brand-gray hover:text-white p-1">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button type="button" onClick={() => reset({ password: generatePassword() })} className="text-xs text-brand-yellow hover:opacity-80 px-1">
                  Gen
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.password.message}
              </p>
            )}
            <p className="text-xs text-brand-gray mt-1">Client must change this on first login</p>
          </div>
        </div>

        <hr className="border-brand-gray-border mb-5" />

        <h3 className="section-header">
          Tax Profile Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field name="tin" label="TIN (Taxpayer Identification Number)" required registerProps={{ required: 'TIN is required', validate: v => v.trim() !== '' || 'TIN is required' }} error={errors.tin} />
          <Field name="pin" label="PIN" registerProps={{}} />
          <Field name="nic_passport" label="NIC / Passport Number" registerProps={{}} />
          <Field name="telephone" label="Telephone Number" registerProps={{}} />
          <Field name="mobile" label="Mobile Number" registerProps={{}} />
          <div className="md:col-span-2">
            <label className="input-label">Address</label>
            <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="Full address" />
          </div>
        </div>

        <hr className="border-brand-gray-border mb-5" />

        <h3 className="section-header">
          <Calendar size={18} className="text-brand-yellow" />
          Assessment Years
        </h3>
        <p className="text-sm text-brand-gray mb-4">
          Select one or more assessment years. Showing current year and up to 5 previous years.
          You can assign additional years from the client profile at any time.
        </p>

        {/* Select All / Clear shortcuts */}
        {taxYears.slice(0, 6).length > 1 && (
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => setSelectedYears(taxYears.slice(0, 6).map(y => y.id))}
              className="text-xs text-brand-yellow hover:opacity-80"
            >
              Select all
            </button>
            <span className="text-brand-gray-border">|</span>
            <button
              type="button"
              onClick={() => setSelectedYears([])}
              className="text-xs text-brand-gray hover:text-white"
            >
              Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          {taxYears.slice(0, 6).map((year, idx) => (
            <button
              key={year.id}
              type="button"
              onClick={() => toggleYear(year.id)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                selectedYears.includes(year.id)
                  ? 'bg-brand-yellow/10 border-brand-yellow text-white'
                  : 'bg-brand-black-soft border-brand-gray-border text-brand-gray hover:border-brand-gray'
              )}
            >
              <div className={clsx(
                'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                selectedYears.includes(year.id) ? 'bg-brand-yellow border-brand-yellow' : 'border-brand-gray'
              )}>
                {selectedYears.includes(year.id) && <CheckCircle size={10} className="text-brand-black" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{year.label}</p>
                  {idx === 0 && (
                    <span className="text-xs bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded font-medium">Current</span>
                  )}
                </div>
                <p className="text-xs text-brand-gray">Starts {year.assessment_year_start}</p>
              </div>
            </button>
          ))}
        </div>

        {selectedYears.length === 0 ? (
          <p className="text-xs text-brand-gray italic mb-4">No year selected — you can assign years from the client profile later.</p>
        ) : (
          <p className="text-xs text-brand-yellow mb-4">{selectedYears.length} year(s) selected — forms will be ready to send after registration.</p>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-gray-border">
          <button type="button" onClick={() => navigate(backPath)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" /> Registering...</>
            ) : (
              <><UserPlus size={15} /> Register Client</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
