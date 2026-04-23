import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// ── Types ──────────────────────────────────────────────────────────
export interface ShortUrl {
  id: string
  shortCode: string
  originalUrl: string
  title?: string
  clicks: number
  isActive: boolean
  shortUrl: string
  clickCount: number
  createdAt: string
  expiresAt?: string
}

export interface CreateUrlDto {
  originalUrl: string
  customCode?: string
  title?: string
  expiresAt?: string
}

export interface ClickEvent {
  id: string
  device: string
  browser: string
  os: string
  referer?: string
  clickedAt: string
}

export interface UrlAnalytics {
  shortCode: string
  originalUrl: string
  title?: string
  totalClicks: number
  createdAt: string
  byBrowser: { name: string; count: number }[]
  byOs: { name: string; count: number }[]
  byDevice: { name: string; count: number }[]
  clicksByDay: { date: string; count: number }[]
  recentClicks: ClickEvent[]
}

export interface Overview {
  totalUrls: number
  totalClicks: number
  topUrls: { shortCode: string; originalUrl: string; title?: string; clicks: number }[]
}

// ── API functions ──────────────────────────────────────────────────
export const urlsApi = {
  list: () => api.get<ShortUrl[]>('/urls').then(r => r.data),
  create: (dto: CreateUrlDto) => api.post<ShortUrl>('/urls', dto).then(r => r.data),
  delete: (shortCode: string) => api.delete(`/urls/${shortCode}`).then(r => r.data),
}

export const analyticsApi = {
  overview: () => api.get<Overview>('/analytics/overview').then(r => r.data),
  getUrl: (shortCode: string) => api.get<UrlAnalytics>(`/analytics/${shortCode}`).then(r => r.data),
}
