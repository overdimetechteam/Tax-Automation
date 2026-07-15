import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { formatDateTime } from '../../utils/format'
import clsx from 'clsx'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: countData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.get('/notifications/unread-count/').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?unread=true').then(r => r.data),
    enabled: open,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-read/'),
    onSuccess: () => {
      qc.invalidateQueries(['unread-count'])
      qc.invalidateQueries(['notifications'])
    },
  })

  const markOneRead = useMutation({
    mutationFn: (id) => api.post(`/notifications/${id}/mark-read/`),
    onSuccess: () => {
      qc.invalidateQueries(['unread-count'])
      qc.invalidateQueries(['notifications'])
    },
  })

  function handleNotificationClick(n) {
    markOneRead.mutate(n.id)
    setOpen(false)
    if (n.related_client_id) {
      navigate(`/consultant/clients/${n.related_client_id}`)
    } else if (n.related_submission_id) {
      navigate(`/client/tax-form/${n.related_submission_id}`)
    }
  }

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = countData?.count || 0
  const typeColors = {
    action_required: 'text-brand-red',
    reminder: 'text-brand-yellow',
    info: 'text-brand-info',
    warning: 'text-orange-400',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-brand-gray hover:text-white hover:bg-brand-black-soft transition-all"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-red text-white text-xs rounded-full flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-brand-black-light border border-brand-gray-border rounded-xl shadow-card z-50 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-gray-border">
            <h4 className="text-sm font-semibold text-white">Notifications</h4>
            {count > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-brand-yellow flex items-center gap-1 hover:opacity-80"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!notifications?.length ? (
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto text-brand-gray mb-2 opacity-40" />
                <p className="text-sm text-brand-gray">No new notifications</p>
              </div>
            ) : (
              notifications.map(n => {
                const isClickable = !!(n.related_client_id || n.related_submission_id)
                return (
                  <div
                    key={n.id}
                    onClick={() => isClickable && handleNotificationClick(n)}
                    className={clsx(
                      'px-4 py-3 border-b border-brand-gray-border/50 hover:bg-brand-black-soft transition-colors',
                      isClickable && 'cursor-pointer'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', typeColors[n.notification_type]?.replace('text-', 'bg-') || 'bg-brand-gray')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{n.title}</p>
                        <p className="text-xs text-brand-gray mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-brand-gray/50">{formatDateTime(n.created_at)}</p>
                          {isClickable && (
                            <p className="text-xs text-brand-yellow">View →</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
