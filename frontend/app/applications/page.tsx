"use client"

import useSWR from "swr"
import { motion } from "framer-motion"
import { jobsApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import type { ApplicationStatus } from "@/types"

const fetcher = () => jobsApi.applied().then(r => r.data)

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: string }> = {
  saved: { label: "Saved", color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "🔖" },
  applied: { label: "Applied", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: "📤" },
  interviewing: { label: "Interviewing", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", icon: "🎤" },
  offered: { label: "Offer Received", color: "#4ade80", bg: "rgba(74,222,128,0.1)", icon: "🎉" },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: "✗" },
  withdrawn: { label: "Withdrawn", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "↩" },
}

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationsContent />
    </DashboardLayout>
  )
}

function ApplicationsContent() {
  const { data, isLoading } = useSWR("/jobs/applied/list", fetcher)
  const applications = data?.applications || []

  // Group by status
  const grouped = applications.reduce((acc: Record<string, any[]>, app: any) => {
    const status = app.status || "applied"
    if (!acc[status]) acc[status] = []
    acc[status].push(app)
    return acc
  }, {})

  const statusOrder: ApplicationStatus[] = ["offered", "interviewing", "applied", "saved", "rejected", "withdrawn"]

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Track all your job applications in one place
        </p>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOrder.map(status => {
          const config = STATUS_CONFIG[status]
          const count = grouped[status]?.length || 0
          if (count === 0) return null
          return (
            <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}30` }}>
              {config.icon} {config.label}: {count}
            </div>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-medium mb-1">No applications yet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Start applying to jobs from your feed and they'll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map(status => {
            const apps = grouped[status]
            if (!apps?.length) return null
            const config = STATUS_CONFIG[status]
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{config.icon}</span>
                  <span className="text-sm font-medium" style={{ color: config.color }}>{config.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: config.bg, color: config.color }}>
                    {apps.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {apps.map((app: any, i: number) => (
                    <motion.div
                      key={app.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Job ID: {app.job_id?.slice(-8) || "N/A"}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Updated {formatDistanceToNow(new Date(app.last_updated || app.created_at), { addSuffix: true })}
                          </p>
                          {app.notes && (
                            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{app.notes}</p>
                          )}
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: config.bg, color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
