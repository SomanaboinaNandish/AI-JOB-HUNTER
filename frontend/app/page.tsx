"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import JobFeed from "@/components/jobs/JobFeed"

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) router.push("/login")
  }, [token, router])

  if (!user) return null

  return (
    <DashboardLayout>
      <JobFeed />
    </DashboardLayout>
  )
}
