"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { searchApi } from "@/lib/api"
import type { Job } from "@/types"
import JobCard from "@/components/jobs/JobCard"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import toast from "react-hot-toast"

const EXAMPLE_QUERIES = [
  "Remote AI engineer jobs above 12 LPA",
  "Python backend developer Bangalore fresher",
  "Full stack React Node internship",
  "GenAI engineer entry level",
  "DevOps fresher remote above 8 LPA",
  "Machine learning intern with stipend",
]

export default function SearchPage() {
  return (
    <DashboardLayout>
      <SearchContent />
    </DashboardLayout>
  )
}

function SearchContent() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [parsedIntent, setParsedIntent] = useState<Record<string, unknown> | null>(null)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(q?: string) {
    const searchQuery = q || query
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setLoading(true)
    setSearched(true)

    try {
      const { data } = await searchApi.semantic(searchQuery)
      setResults(data.jobs || [])
      setTotal(data.total || 0)
      setParsedIntent(data.parsed_intent || null)
    } catch {
      toast.error("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">AI Search</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Search in plain English — the AI understands your intent
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder='Try: "Remote AI jobs above 10 LPA" or "Python backend fresher Bangalore"'
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? "⟳" : "Search"}
          </button>
        </div>
      </div>

      {/* Example queries */}
      {!searched && (
        <div className="mb-8">
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parsed intent */}
      <AnimatePresence>
        {parsedIntent && searched && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 rounded-lg text-xs"
            style={{ background: "var(--accent-glow)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <span style={{ color: "var(--accent)" }}>🤖 AI understood: </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {parsedIntent.keywords && `Keywords: ${(parsedIntent.keywords as string[]).join(", ")}`}
              {parsedIntent.min_salary && ` · Min salary: ₹${parsedIntent.min_salary} LPA`}
              {parsedIntent.remote_only && " · Remote only"}
              {parsedIntent.location && ` · Location: ${parsedIntent.location}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">🕵️</div>
              <p className="text-sm font-medium mb-1">No results found</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Try different keywords or trigger the agents to search for new jobs
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Found <span className="font-semibold text-white">{total}</span> jobs matching your search
              </p>
              <div className="space-y-3">
                {results.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
