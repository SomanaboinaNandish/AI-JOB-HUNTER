"use client"

import useSWR from "swr"
import { motion } from "framer-motion"
import { jobsApi } from "@/lib/api"
import JobCard from "@/components/jobs/JobCard"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import type { Job } from "@/types"

const fetcher = () => jobsApi.saved().then(r => r.data)

export default function SavedPage() {
  return (
    <DashboardLayout>
      <SavedContent />
    </DashboardLayout>
  )
}

function SavedContent() {
  const { data, mutate, isLoading } = useSWR("/jobs/saved/list", fetcher)
  const jobs: Job[] = data?.jobs || []

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Saved Jobs</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {isLoading ? "Loading..." : `${jobs.length} saved ${jobs.length === 1 ? "job" : "jobs"}`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🔖</div>
          <p className="text-sm font-medium mb-1">No saved jobs yet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Bookmark jobs from your feed to review them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <JobCard job={{ ...job, is_saved: true }} onUpdate={mutate} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
