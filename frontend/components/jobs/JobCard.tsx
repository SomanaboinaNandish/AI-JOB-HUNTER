"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { jobsApi, resumeApi } from "@/lib/api"
import type { Job } from "@/types"
import toast from "react-hot-toast"
import { formatDistanceToNow } from "date-fns"

interface Props {
  job: Job
  onUpdate?: () => void
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  remoteok: { bg: "rgba(20,184,166,0.1)", color: "#2dd4bf", border: "rgba(20,184,166,0.2)" },
  wellfound: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  greenhouse: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  lever: { bg: "rgba(99,102,241,0.1)", color: "#818cf8", border: "rgba(99,102,241,0.2)" },
  linkedin: { bg: "rgba(10,102,194,0.1)", color: "#60a5fa", border: "rgba(10,102,194,0.2)" },
  naukri: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
}

function getPlatformStyle(platform: string) {
  return PLATFORM_COLORS[platform] || { bg: "var(--bg-hover)", color: "var(--text-muted)", border: "var(--border)" }
}

function getMatchColor(score: number) {
  if (score >= 75) return { color: "#4ade80", bg: "rgba(34,197,94,0.12)" }
  if (score >= 50) return { color: "#fbbf24", bg: "rgba(245,158,11,0.1)" }
  return { color: "#94a3b8", bg: "rgba(148,163,184,0.08)" }
}

export default function JobCard({ job, onUpdate }: Props) {
  const [saved, setSaved] = useState(job.is_saved || false)
  const [applied, setApplied] = useState(job.application_status === "applied")
  const [expanded, setExpanded] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchData, setMatchData] = useState<{
    match_percentage: number
    matched_skills: string[]
    missing_skills: string[]
    improvement_suggestions: string[]
  } | null>(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)

  const platformStyle = getPlatformStyle(job.source_platform)

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await jobsApi.save(job.id)
      setSaved(true)
      toast.success("Job saved!")
      onUpdate?.()
    } catch {
      toast.error("Could not save job")
    }
  }

  async function handleApply(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await jobsApi.apply(job.id)
      setApplied(true)
      toast.success("Application tracked!")
      window.open(job.apply_url, "_blank")
      onUpdate?.()
    } catch {
      window.open(job.apply_url, "_blank")
    }
  }

  async function handleMatch(e: React.MouseEvent) {
    e.stopPropagation()
    setMatchLoading(true)
    try {
      const { data } = await resumeApi.match(job.id)
      setMatchData(data)
      setExpanded(true)
    } catch {
      toast.error("Upload your resume first to get match scores")
    } finally {
      setMatchLoading(false)
    }
  }

  async function handleCoverLetter(e: React.MouseEvent) {
    e.stopPropagation()
    setCoverLetterLoading(true)
    try {
      const { data } = await resumeApi.coverLetter(job.id)
      setCoverLetter(data.cover_letter)
      setExpanded(true)
    } catch {
      toast.error("Upload your resume first to generate cover letters")
    } finally {
      setCoverLetterLoading(false)
    }
  }

  const postedAgo = job.posted_at
    ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })
    : formatDistanceToNow(new Date(job.scraped_at), { addSuffix: true })

  return (
    <div
      className="card p-5 cursor-pointer group hover:border-opacity-100 transition-all"
      onClick={() => setExpanded(e => !e)}
      style={{ borderColor: expanded ? "var(--border-hover)" : undefined }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Company logo / initial */}
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold select-none"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
        >
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company} className="w-10 h-10 rounded-xl object-contain" />
            : job.company.charAt(0).toUpperCase()
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug group-hover:text-indigo-300 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {job.company}
              </p>
            </div>

            {/* Match score badge */}
            {job.match_score !== undefined && job.match_score !== null && (() => {
              const mc = getMatchColor(job.match_score)
              return (
                <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: mc.bg, color: mc.color }}>
                  🎯 {job.match_score}%
                </div>
              )
            })()}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Platform */}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: platformStyle.bg, color: platformStyle.color, border: `1px solid ${platformStyle.border}` }}>
              {job.source_platform}
            </span>

            {/* Location */}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              📍 {job.remote ? "Remote" : job.location}
            </span>

            {/* Salary */}
            <span className="text-xs font-medium" style={{ color: job.salary_estimated ? "var(--text-secondary)" : "#4ade80" }}>
              💰 {job.salary_display}
              {job.salary_estimated && <span className="ml-1 opacity-60">(est.)</span>}
            </span>

            {/* Experience */}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ⏱ {job.experience_min}–{job.experience_max} yrs
            </span>

            {/* Job type */}
            {job.job_type === "internship" && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                Internship
              </span>
            )}

            {/* Posted */}
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              {postedAgo}
            </span>
          </div>

          {/* Skills pills */}
          {job.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {job.skills_required.slice(0, 6).map(skill => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded"
                  style={{ background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {skill}
                </span>
              ))}
              {job.skills_required.length > 6 && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ color: "var(--text-muted)" }}>
                  +{job.skills_required.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>
        <button
          onClick={handleApply}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
          style={{
            background: applied ? "rgba(34,197,94,0.12)" : "var(--accent)",
            color: applied ? "#4ade80" : "#fff",
            border: applied ? "1px solid rgba(34,197,94,0.25)" : "none",
          }}
        >
          {applied ? "✓ Applied" : "Apply Now ↗"}
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: saved ? "rgba(245,158,11,0.1)" : "var(--bg-hover)",
            color: saved ? "#fbbf24" : "var(--text-secondary)",
            border: `1px solid ${saved ? "rgba(245,158,11,0.2)" : "var(--border)"}`,
          }}
        >
          {saved ? "🔖 Saved" : "🔖 Save"}
        </button>

        <button
          onClick={handleMatch}
          disabled={matchLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          {matchLoading ? "⟳ Matching..." : "🎯 Match Me"}
        </button>

        <button
          onClick={handleCoverLetter}
          disabled={coverLetterLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          {coverLetterLoading ? "⟳ Writing..." : "✍️ Cover Letter"}
        </button>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="pt-4 space-y-4">
              {/* Match analysis */}
              {matchData && (
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resume Match Analysis</span>
                    <div className="flex items-center gap-1">
                      <div className="h-2 rounded-full w-24 overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${matchData.match_percentage}%`,
                            background: matchData.match_percentage >= 75 ? "#4ade80" : matchData.match_percentage >= 50 ? "#fbbf24" : "#f87171"
                          }} />
                      </div>
                      <span className="text-sm font-semibold ml-1">{matchData.match_percentage}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {matchData.matched_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: "#4ade80" }}>✓ Matched Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData.matched_skills.slice(0, 6).map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "rgba(34,197,94,0.08)", color: "#86efac", border: "1px solid rgba(34,197,94,0.15)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {matchData.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: "#f87171" }}>✗ Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData.missing_skills.slice(0, 6).map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {matchData.improvement_suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>💡 Suggestions</p>
                      <ul className="space-y-1">
                        {matchData.improvement_suggestions.map((s, i) => (
                          <li key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Cover letter */}
              {coverLetter && (
                <div className="p-4 rounded-xl"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">AI-Generated Cover Letter</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success("Copied!") }}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {coverLetter}
                  </p>
                </div>
              )}

              {/* Job description snippet */}
              {job.description && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>About this role</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {job.description.slice(0, 400)}{job.description.length > 400 ? "..." : ""}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
