"use client"

import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown> | null
}

interface NotificationPanelProps {
  notifications: Notification[]
  onMarkAllRead: () => void
  onClose: () => void
}

const typeIcons: Record<string, string> = {
  BID_RECEIVED: "\u{1F4E9}",
  BID_ACCEPTED: "\u{1F389}",
  PAYMENT_RECEIVED: "\u{1F4B0}",
  DELIVERY_CONFIRMED: "\u2705",
  REVIEW_RECEIVED: "\u2B50",
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function NotificationPanel({ notifications, onMarkAllRead, onClose }: NotificationPanelProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-warm-200 bg-white shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-warm-100 px-4 py-3">
        <h3 className="font-semibold text-warm-800 text-sm">Notifications</h3>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-warm-300">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-surface transition-colors",
                !n.isRead && "bg-indigo-600-50/50"
              )}
            >
              <span className="text-lg flex-shrink-0">{typeIcons[n.type] ?? "\u{1F4CC}"}</span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.isRead ? "font-semibold text-warm-800" : "text-warm-600")}>
                  {n.title}
                </p>
                <p className="text-xs text-warm-400 mt-0.5 truncate">{n.body}</p>
                <p className="text-[10px] text-warm-300 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="flex-shrink-0 mt-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-600" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
