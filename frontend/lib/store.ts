import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"
import { authApi } from "@/lib/api"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, fullName: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        const { data } = await authApi.login({ email, password })
        localStorage.setItem("auth_token", data.access_token)
        set({ token: data.access_token, user: data.user, isLoading: false })
      },

      register: async (email, fullName, password) => {
        set({ isLoading: true })
        const { data } = await authApi.register({ email, full_name: fullName, password })
        localStorage.setItem("auth_token", data.access_token)
        set({ token: data.access_token, user: data.user, isLoading: false })
      },

      logout: () => {
        localStorage.removeItem("auth_token")
        set({ user: null, token: null })
      },

      fetchMe: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
