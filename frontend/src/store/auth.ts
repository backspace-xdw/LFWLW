import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  fullName: string
  email: string
  avatar?: string
  roles: string[]
  permissions: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        // 设置axios默认请求头
        if (window.axios) {
          window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        // 清除axios请求头
        if (window.axios) {
          delete window.axios.defaults.headers.common['Authorization']
        }
      },
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)