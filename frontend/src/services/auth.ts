import { request } from '@/utils/request'

export interface LoginRequest {
  username: string
  password: string
  captchaCode?: string
  captchaToken?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: {
    id: string
    username: string
    fullName: string
    email: string
    avatar?: string
    roles: string[]
    permissions: string[]
  }
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return request.post('/api/v1/auth/login', data)
  },

  logout: async (): Promise<void> => {
    return request.post('/api/v1/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return request.post('/api/v1/auth/refresh', { refreshToken })
  },

  getCurrentUser: async () => {
    return request.get('/api/v1/auth/me')
  },
}