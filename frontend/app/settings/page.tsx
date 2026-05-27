"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/store"
import { authApi, agentsApi } from "@/lib/api"
import toast from "react-hot-toast"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  )
}

function SettingsContent() {
  const { user, fetchMe } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)

  const [prefs, setPrefs] = useState({
    min_salary_lpa: user?.min_salary_lpa || 8,
    remote_only: false,
    telegram_chat_id: user?.telegram_chat_id || "",
    telegram_notifications: user?.telegram_notifications || false,
    email_notifications: user?.email_notifications !== false,
    preferred_roles: (user?.preferred_roles || []).join(", "),
    preferred_locations: (user?.preferred_locations || []).join(", "),
  })

  const update = (k: string, v: unknown) => setPrefs(p => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      await authApi.updatePreferences({
        ...prefs,
        preferred_roles: prefs.preferred_roles.split(",").map(s => s.trim()).filter(Boolean),
        preferred_locations: prefs.preferred_locations.split(",").map(s => s.trim()).filter(Boolean),
      })
      await fetchMe()
      toast.success("Preferences saved!")
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  async function triggerSearch() {
    setAgentRunning(true)
    try {
      await agentsApi.triggerSearch()
      toast.success("Job search agents are running! Check back in a few minutes.")
    } catch {
      toast.error("Failed to trigger agents")
    } finally {
      setTimeout(() => setAgentRunning(false), 3000)
    }
  }

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Configure your job search preferences
        </p>
      </div>

      {/* Job preferences */}
      <SettingsCard title="🎯 Job Preferences">
        <SettingsRow label="Minimum Salary (LPA)" description="Filter out jobs below this threshold">
          <div className="flex items-center gap-2">
            <span className="text-sm">₹</span>
            <input
              type="number"
              value={prefs.min_salary_lpa}
              onChange={e => update("min_salary_lpa", Number(e.target.value))}
              min={0} max={100} step={1}
              className="w-20 px-2.5 py-1.5 rounded-lg text-sm outline-none text-right"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>LPA</span>
          </div>
        </SettingsRow>

        <SettingsRow label="Preferred Roles" description="Comma-separated (e.g. SDE 1, AI Engineer)">
          <input
            type="text"
            value={prefs.preferred_roles}
            onChange={e => update("preferred_roles", e.target.value)}
            placeholder="SDE 1, AI Engineer, Backend Developer"
            className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </SettingsRow>

        <SettingsRow label="Preferred Locations" description="Comma-separated cities">
          <input
            type="text"
            value={prefs.preferred_locations}
            onChange={e => update("preferred_locations", e.target.value)}
            placeholder="Bangalore, Mumbai, Remote"
            className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </SettingsRow>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard title="🔔 Notifications">
        <SettingsRow label="Email Notifications" description="Receive job alerts via email">
          <Toggle value={prefs.email_notifications} onChange={v => update("email_notifications", v)} />
        </SettingsRow>

        <SettingsRow label="Telegram Notifications" description="Get instant alerts on Telegram">
          <Toggle value={prefs.telegram_notifications} onChange={v => update("telegram_notifications", v)} />
        </SettingsRow>

        {prefs.telegram_notifications && (
          <SettingsRow label="Telegram Chat ID" description="Your Telegram chat ID for alerts">
            <input
              type="text"
              value={prefs.telegram_chat_id}
              onChange={e => update("telegram_chat_id", e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </SettingsRow>
        )}
      </SettingsCard>

      {/* AI Agents */}
      <SettingsCard title="🤖 AI Agents">
        <SettingsRow label="Auto-Search Interval" description="Agents search for new jobs automatically">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Every 2 hours</span>
        </SettingsRow>

        <div className="pt-2">
          <button
            onClick={triggerSearch}
            disabled={agentRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <span className={agentRunning ? "animate-spin" : ""}>⚡</span>
            {agentRunning ? "Running agents..." : "Run Agents Now"}
          </button>
        </div>
      </SettingsCard>

      {/* Account info */}
      <SettingsCard title="👤 Account">
        <SettingsRow label="Name">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.full_name}</span>
        </SettingsRow>
        <SettingsRow label="Email">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
        </SettingsRow>
      </SettingsCard>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>
    </div>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-10 h-6 rounded-full transition-colors focus:outline-none"
      style={{ background: value ? "var(--accent)" : "var(--bg-hover)" }}
    >
      <motion.span
        animate={{ x: value ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full"
        style={{ background: "#fff" }}
      />
    </button>
  )
}
