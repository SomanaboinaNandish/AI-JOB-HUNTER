"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/lib/store"
import NotificationBell from "@/components/dashboard/NotificationBell"

const NAV_ITEMS = [
  { href: "/", icon: "⚡", label: "Job Feed" },
  { href: "/saved", icon: "🔖", label: "Saved Jobs" },
  { href: "/applications", icon: "📋", label: "Applications" },
  { href: "/resume", icon: "📄", label: "Resume" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/search", icon: "🔍", label: "AI Search" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              ⚡
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">AI Job Hunter</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Fresher Edition</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: active ? "var(--accent-glow)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                  fontWeight: active ? 500 : 400,
                }}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: "var(--bg-hover)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user?.full_name}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-xs shrink-0 transition-opacity hover:opacity-100 opacity-50"
              title="Sign out">⤴</button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-md"
            style={{ color: "var(--text-secondary)" }}
          >
            ☰
          </button>
          <AgentStatusBadge />
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function AgentStatusBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
      style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#4ade80" }} />
      Agents Active
    </div>
  )
}
