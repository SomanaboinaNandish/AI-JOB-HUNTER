"use client"

import useSWR from "swr"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts"
import { analyticsApi } from "@/lib/api"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import type { AnalyticsDashboard } from "@/types"

const fetcher = () => analyticsApi.dashboard().then(r => r.data)

const FUNNEL_COLORS: Record<string, string> = {
  saved: "#818cf8",
  applied: "#6366f1",
  interviewing: "#fbbf24",
  offered: "#4ade80",
  rejected: "#f87171",
  withdrawn: "#94a3b8",
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  )
}

function AnalyticsContent() {
  const { data, isLoading } = useSWR<AnalyticsDashboard>("/analytics/dashboard", fetcher)

  if (isLoading || !data) {
    return (
      <div className="px-6 py-6 space-y-4">
        <div className="h-6 w-40 rounded animate-pulse" style={{ background: "var(--bg-card)" }} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const { summary, application_funnel, recent_searches } = data

  const statCards = [
    { label: "Jobs Saved", value: summary.jobs_saved, icon: "🔖", color: "#818cf8" },
    { label: "Applied", value: summary.jobs_applied, icon: "📤", color: "#6366f1" },
    { label: "Interviewing", value: summary.interviewing, icon: "🎤", color: "#fbbf24" },
    { label: "Offers", value: summary.offers, icon: "🎉", color: "#4ade80" },
    { label: "Avg Match", value: `${summary.avg_match_score}%`, icon: "🎯", color: "#14b8a6" },
  ]

  const funnelData = Object.entries(application_funnel).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    fill: FUNNEL_COLORS[status] || "#818cf8",
  }))

  const pieData = funnelData.filter(d => d.count > 0)

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Your job search performance at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold tracking-tight" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Application funnel bar chart */}
        <div className="card p-5">
          <h3 className="text-sm font-medium mb-4">Application Funnel</h3>
          {funnelData.length === 0 ? (
            <EmptyChart message="No applications yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-medium mb-4">Status Distribution</h3>
          {pieData.length === 0 ? (
            <EmptyChart message="Start applying to see your stats" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="count" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map(d => (
                  <div key={d.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.status}</span>
                    </div>
                    <span className="text-xs font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent searches */}
      {recent_searches.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {recent_searches.map((query, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                🔍 {query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  )
}
