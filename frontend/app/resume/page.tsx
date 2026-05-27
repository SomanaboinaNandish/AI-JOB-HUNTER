"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import { resumeApi } from "@/lib/api"
import toast from "react-hot-toast"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

const fetcher = () => resumeApi.me().then(r => r.data).catch(() => null)

export default function ResumePage() {
  return (
    <DashboardLayout>
      <ResumeContent />
    </DashboardLayout>
  )
}

function ResumeContent() {
  const { data: resume, mutate, isLoading } = useSWR("/resume/me", fetcher)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "suggestions">("overview")

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF file")
      return
    }
    setUploading(true)
    try {
      await resumeApi.upload(file)
      toast.success("Resume uploaded! Processing in the background...")
      setTimeout(() => mutate(), 3000)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [mutate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "skills", label: "Skills" },
    { key: "suggestions", label: "Suggestions" },
  ] as const

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Resume</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Upload your PDF resume for AI-powered matching and analysis
        </p>
      </div>

      {/* Upload area */}
      <div
        {...getRootProps()}
        className="rounded-xl p-8 text-center cursor-pointer transition-all mb-6"
        style={{
          background: isDragActive ? "var(--accent-glow)" : "var(--bg-card)",
          border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
        }}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">{uploading ? "⟳" : "📄"}</div>
        <p className="text-sm font-medium mb-1">
          {uploading ? "Uploading..." : isDragActive ? "Drop your PDF here" : "Upload your resume"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Drag & drop or click to select · PDF only · Max 5MB
        </p>
      </div>

      {/* Resume analysis */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-3 animate-pulse">⟳</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading resume...</p>
        </div>
      ) : resume ? (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sm font-medium">{resume.filename}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Uploaded & analysed by AI
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                ✓ Processed
              </span>
            </div>

            {/* Summary */}
            {resume.summary && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {resume.summary}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-5 py-2.5 text-sm font-medium transition-all relative"
                style={{ color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)" }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="resume-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Education */}
                  {resume.education?.length > 0 && (
                    <Section title="🎓 Education">
                      {resume.education.map((e: any, i: number) => (
                        <div key={i} className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{e.degree}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{e.institution}</p>
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{e.year}</span>
                        </div>
                      ))}
                    </Section>
                  )}

                  {/* Projects */}
                  {resume.projects?.length > 0 && (
                    <Section title="🛠 Projects">
                      {resume.projects.map((p: any, i: number) => (
                        <div key={i}>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(p.technologies || []).map((t: string) => (
                              <span key={t} className="text-xs px-2 py-0.5 rounded"
                                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </Section>
                  )}

                  {/* Suggested roles */}
                  {resume.suggested_roles?.length > 0 && (
                    <Section title="🎯 Best Matching Roles">
                      <div className="flex flex-wrap gap-2">
                        {resume.suggested_roles.map((role: string) => (
                          <span key={role} className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}
                </motion.div>
              )}

              {activeTab === "skills" && (
                <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {resume.strengths?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-2" style={{ color: "#4ade80" }}>✓ Strengths</p>
                      <ul className="space-y-1.5">
                        {resume.strengths.map((s: string) => (
                          <li key={s} className="text-sm flex items-start gap-2">
                            <span style={{ color: "#4ade80" }}>•</span>
                            <span style={{ color: "var(--text-secondary)" }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Technical Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(resume.skills || []).map((skill: string) => (
                        <span key={skill} className="text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "suggestions" && (
                <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                    AI recommendations to improve your resume's job match rate
                  </p>
                  <ul className="space-y-3">
                    {(resume.improvement_areas || ["No suggestions — your resume looks great!"]).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                        <span className="text-base mt-0.5">💡</span>
                        <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm font-medium mb-1">No resume uploaded yet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Upload your PDF above to enable AI matching
          </p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
