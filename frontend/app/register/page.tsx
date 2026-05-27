"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/store"
import toast from "react-hot-toast"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ email: "", full_name: "", password: "" })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    try {
      await register(form.email, form.full_name, form.password)
      toast.success("Account created! Let's find you a job 🚀")
      router.push("/")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              ⚡
            </div>
            <span className="text-xl font-semibold tracking-tight">AI Job Hunter</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Create your free account
          </p>
        </div>

        <div className="card p-6">
          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["AI Resume Matching", "Auto Job Search", "Salary Estimates"].map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)" }}>
                ✓ {f}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full name", key: "full_name", type: "text", placeholder: "Arjun Sharma" },
              { label: "Email address", key: "email", type: "email", placeholder: "arjun@example.com" },
              { label: "Password", key: "password", type: "password", placeholder: "Min. 8 characters" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={e => update(key, e.target.value)}
                  placeholder={placeholder}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {isLoading ? "Creating account..." : "Get started — it's free"}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent)" }} className="font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
