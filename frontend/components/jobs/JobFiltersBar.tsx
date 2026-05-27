"use client"

import { useState } from "react"
import type { JobFilters, Platform, JobType } from "@/types"

interface Props {
  filters: JobFilters
  onChange: (filters: JobFilters) => void
}

const PLATFORMS: { value: Platform | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "wellfound", label: "Wellfound" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "naukri", label: "Naukri" },
]

const JOB_TYPES: { value: JobType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "full_time", label: "Full Time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
]

const SORT_OPTIONS = [
  { value: "scraped_at", label: "Latest" },
  { value: "salary", label: "Salary ↑" },
  { value: "match_score", label: "Best Match" },
]

const SALARY_OPTIONS = [
  { value: undefined, label: "Any Salary" },
  { value: 8, label: "₹8+ LPA" },
  { value: 10, label: "₹10+ LPA" },
  { value: 15, label: "₹15+ LPA" },
  { value: 20, label: "₹20+ LPA" },
]

export default function JobFiltersBar({ filters, onChange }: Props) {
  const update = (key: keyof JobFilters, value: unknown) => {
    onChange({ ...filters, [key]: value === "" ? undefined : value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Platform filter */}
      <FilterSelect
        value={filters.platform || ""}
        options={PLATFORMS}
        onChange={v => update("platform", v)}
        placeholder="Platform"
      />

      {/* Job type */}
      <FilterSelect
        value={filters.job_type || ""}
        options={JOB_TYPES}
        onChange={v => update("job_type", v)}
        placeholder="Type"
      />

      {/* Min salary */}
      <FilterSelect
        value={filters.min_salary?.toString() || ""}
        options={SALARY_OPTIONS.map(o => ({ value: o.value?.toString() || "", label: o.label }))}
        onChange={v => update("min_salary", v ? Number(v) : undefined)}
        placeholder="Salary"
      />

      {/* Sort */}
      <FilterSelect
        value={filters.sort_by || "scraped_at"}
        options={SORT_OPTIONS}
        onChange={v => update("sort_by", v as JobFilters["sort_by"])}
        placeholder="Sort by"
      />

      {/* Remote toggle */}
      <button
        onClick={() => update("remote", filters.remote ? undefined : true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: filters.remote ? "rgba(34,197,94,0.12)" : "var(--bg-card)",
          color: filters.remote ? "#4ade80" : "var(--text-secondary)",
          border: `1px solid ${filters.remote ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
        }}
      >
        🌐 Remote Only
      </button>

      {/* Clear filters */}
      {Object.values(filters).some(v => v !== undefined) && (
        <button
          onClick={() => onChange({})}
          className="px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          Clear ✕
        </button>
      )}
    </div>
  )
}

function FilterSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: value ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: "#16161f" }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
