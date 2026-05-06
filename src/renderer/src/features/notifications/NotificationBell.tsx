import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '../../types'
import { getNotifications, getUnreadCount, markAllRead, subscribeNotifications } from '../../lib/services/notifications'

export default function NotificationBell(): React.JSX.Element {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  function refresh(): void {
    getNotifications().then(setNotifications)
    setUnread(getUnreadCount())
  }

  useEffect(() => {
    refresh()
    const unsub = subscribeNotifications(refresh)
    return unsub
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleOpen(): Promise<void> {
    setOpen((v) => !v)
    if (!open && unread > 0) {
      await markAllRead()
      refresh()
    }
  }

  function handleNotificationClick(n: Notification): void {
    setOpen(false)
    if (n.contactId) navigate(`/contatti/${n.contactId}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notifiche</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Nessuna notifica</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs font-semibold text-gray-800">{n.title}</span>
                  <span className="text-xs text-gray-500 leading-snug">{n.message}</span>
                  <span className="text-xs text-gray-300">
                    {new Date(n.createdAt).toLocaleString('it-IT', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
