"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { notificationsApi } from "@/lib/api"
import type { Notification } from "@/types"
import { formatDistanceToNow } from "date-fns"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifications() {
    try {
      const { data } = await notificationsApi.list()
      setNotifications(data.notifications)
      setUnread(data.unread_count)
    } catch {}
  }

  async function markAllRead() {
    await notificationsApi.markAllRead()
    setUnread(0)
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-all"
        style={{ background: open ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)" }}
      >
        🔔
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 z-20 rounded-xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-medium">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs"
                    style={{ color: "var(--accent)" }}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id}
                      className="px-4 py-3 transition-colors"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: n.is_read ? "transparent" : "var(--accent-glow)",
                      }}>
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">
                          {n.type === "new_job" ? "💼" : n.type === "match_alert" ? "🎯" : "🔔"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                            {n.message}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
