"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import { jobsApi, agentsApi } from "@/lib/api"
import type { Job, JobFilters } from "@/types"
import JobCard from "./JobCard"
import JobFiltersBar from "./JobFiltersBar"
import toast from "react-hot-toast"

const PLATFORM_OPTIONS = [
  { value: "", label: "All Platforms" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "wellfound", label: "Wellfound" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "naukri", label: "Naukri" },
]

const fetcher = ([url, params]: [string, Record<string, unknown>]) =>
  jobsApi.list(params).then(r => r.data)

export default function JobFeed() {
  const [filters, setFilters] = useState<JobFilters>({})
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const params = {
    page,
    per_page: 20,
    ...(filters.platform && { platform: filters.platform }),
    ...(filters.remote !== undefined && { remote: filters.remote }),
    ...(filters.min_salary && { min_salary: filters.min_salary }),
    ...(filters.max_experience !== undefined && { max_experience: filters.max_experience }),
    ...(filters.job_type && { job_type: filters.job_type }),
    ...(filters.sort_by && { sort_by: filters.sort_by }),
  }

  const { data, mutate, isLoading } = useSWR(["/jobs", params], fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const handleFilterChange = useCallback((newFilters: JobFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  async function triggerRefresh() {
    setRefreshing(true)
    try {
      await agentsApi.triggerSearch()
      toast.success("Job search agents triggered! New jobs will appear shortly.")
      setTimeout(() => mutate(), 5000)
    } catch {
      toast.error("Failed to trigger search")
    } finally {
      setRefreshing(false)
    }
  }

  const jobs: Job[] = data?.jobs || []
  const total: number = data?.total || 0
  const pages: number = data?.pages || 1

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Job Feed</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {isLoading ? "Loading..." : `${total.toLocaleString()} fresher opportunities found`}
            </p>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <span className={refreshing ? "animate-spin" : ""}>⟳</span>
            {refreshing ? "Searching..." : "Search Now"}
          </button>
        </div>

        <JobFiltersBar filters={filters} onChange={handleFilterChange} />
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <JobSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState onRefresh={triggerRefresh} />
        ) : (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <JobCard job={job} onUpdate={() => mutate()} />
              </motion.div>
            ))}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-30"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  ← Previous
                </button>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {page} / {pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all disabled:opacity-30"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function JobSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: "var(--bg-hover)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded w-2/3" style={{ background: "var(--bg-hover)" }} />
              <div className="h-3 rounded w-1/3" style={{ background: "var(--bg-hover)" }} />
              <div className="h-3 rounded w-1/2 mt-2" style={{ background: "var(--bg-hover)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold mb-2">No jobs found yet</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-secondary)" }}>
        Trigger the AI agents to search for fresh opportunities across all platforms.
      </p>
      <button
        onClick={onRefresh}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Search for Jobs
      </button>
    </div>
  )
}
