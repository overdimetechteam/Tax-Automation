import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Login() {
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useUsername, setUseUsername] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      const data = err.response?.data
      if (data?.use_username) {
        setUseUsername(true)
        toast.error(data.detail)
      } else {
        const msg = data?.detail || 'Invalid credentials.'
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Card */}
        <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-card overflow-hidden">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-brand-black to-brand-black-mid px-8 py-8 text-center border-b border-brand-gray-border">
            <img src="/logo.png" alt="OVERDIME - TMS" className="h-16 w-auto object-contain mx-auto mb-4" />
            <p className="text-brand-gray text-sm mt-1">Y/A 2025/2026 · Secure Client Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

            {useUsername && (
              <div className="flex items-start gap-2 p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg text-xs text-brand-yellow">
                <Info size={13} className="mt-0.5 flex-shrink-0" />
                <span>Multiple accounts share that email. Please enter your <strong>username</strong> below instead.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email or Username */}
              <div>
                <label className="input-label">{useUsername ? 'Username' : 'Email or Username'}</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" />
                  <input
                    {...register('email', { required: 'Email or username is required' })}
                    type="text"
                    placeholder={useUsername ? 'your_username' : 'you@example.com or username'}
                    autoComplete="email"
                    className={clsx('input-field pl-10', errors.email && 'border-brand-red focus:border-brand-red focus:ring-brand-red')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />{errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={clsx('input-field pl-10 pr-10', errors.password && 'border-brand-red focus:border-brand-red focus:ring-brand-red')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />{errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-brand-gray mt-6">
          Secured portal for authorized users only. <br />
          Contact your tax consultant for access.
        </p>
      </div>
    </div>
  )
}
