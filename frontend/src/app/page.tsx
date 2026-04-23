'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { urlsApi, analyticsApi, ShortUrl, CreateUrlDto } from '@/lib/api'

const schema = z.object({
  originalUrl: z.string().url('Must be a valid URL (include https://)'),
  customCode: z.string().min(3).max(20).regex(/^[a-zA-Z0-9-_]+$/, 'Letters, numbers, - and _ only').optional().or(z.literal('')),
  title: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">{label}</p>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function UrlCard({ url, onDelete, onAnalytics }: { url: ShortUrl; onDelete: () => void; onAnalytics: () => void }) {
  const shortUrl = `${BASE}/${url.shortCode}`
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {url.title && <p className="font-medium text-white text-sm mb-0.5">{url.title}</p>}
          <p className="text-gray-400 text-xs truncate">{url.originalUrl}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-500">{url.clicks} clicks</span>
          {!url.isActive && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">Inactive</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 mb-3">
        <a href={shortUrl} target="_blank" rel="noreferrer"
          className="text-violet-400 hover:text-violet-300 text-sm font-mono flex-1 truncate transition-colors">
          {shortUrl}
        </a>
        <CopyButton text={shortUrl} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
        </span>
        <div className="flex gap-2">
          <button onClick={onAnalytics}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 transition-colors">
            📊 Analytics
          </button>
          <button onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function AnalyticsModal({ shortCode, onClose }: { shortCode: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', shortCode],
    queryFn: () => analyticsApi.getUrl(shortCode),
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">Analytics — /{shortCode}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl" />)}
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total Clicks" value={data.totalClicks} />
              <StatCard label="Browsers" value={data.byBrowser.length} />
              <StatCard label="Devices" value={data.byDevice.length} />
            </div>

            {/* Clicks by day */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Clicks — Last 14 Days</h3>
              <div className="flex items-end gap-1 h-20">
                {data.clicksByDay.map(d => {
                  const max = Math.max(...data.clicksByDay.map(x => x.count), 1)
                  const pct = (d.count / max) * 100
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                      <div className="w-full bg-violet-500 rounded-sm transition-all" style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{data.clicksByDay[0]?.date}</span>
                <span>{data.clicksByDay[data.clicksByDay.length - 1]?.date}</span>
              </div>
            </div>

            {/* Breakdown tables */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: 'Browsers', data: data.byBrowser },
                { title: 'OS', data: data.byOs },
                { title: 'Devices', data: data.byDevice },
              ].map(section => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{section.title}</h3>
                  <div className="space-y-1">
                    {section.data.slice(0, 4).map(item => (
                      <div key={item.name} className="flex justify-between text-xs">
                        <span className="text-gray-300 truncate">{item.name}</span>
                        <span className="text-gray-500 ml-2">{item.count}</span>
                      </div>
                    ))}
                    {section.data.length === 0 && <p className="text-xs text-gray-600">No data yet</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Original URL */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Original URL</p>
              <a href={data.originalUrl} target="_blank" rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs break-all transition-colors">
                {data.originalUrl}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function HomePage() {
  const qc = useQueryClient()
  const [analyticsCode, setAnalyticsCode] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const { data: urls = [], isLoading } = useQuery({
    queryKey: ['urls'],
    queryFn: urlsApi.list,
    refetchInterval: 10000,
  })

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: analyticsApi.overview,
    refetchInterval: 10000,
  })

  const createMutation = useMutation({
    mutationFn: urlsApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['urls'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      reset()
      showToast(`Created! → ${data.shortUrl}`, 'success')
    },
    onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: urlsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['urls'] })
      showToast('URL deactivated', 'success')
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const onSubmit = (data: FormData) => {
    const dto: CreateUrlDto = {
      originalUrl: data.originalUrl,
      title: data.title || undefined,
      customCode: data.customCode || undefined,
    }
    createMutation.mutate(dto)
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm border
          ${toast.type === 'success' ? 'bg-gray-800 border-green-500/30 text-green-300' : 'bg-gray-800 border-red-500/30 text-red-300'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {analyticsCode && (
        <AnalyticsModal shortCode={analyticsCode} onClose={() => setAnalyticsCode(null)} />
      )}

      {/* Hero */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-white mb-2">Shorten any URL</h1>
        <p className="text-gray-400">Create short links and track clicks with full analytics</p>
      </div>

      {/* Create form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('originalUrl')}
              placeholder="https://your-very-long-url.com/with/a/long/path"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {errors.originalUrl && <p className="text-red-400 text-xs mt-1">{errors.originalUrl.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                {...register('customCode')}
                placeholder="Custom code (optional — e.g. my-link)"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
              {errors.customCode && <p className="text-red-400 text-xs mt-1">{errors.customCode.message}</p>}
            </div>
            <div>
              <input
                {...register('title')}
                placeholder="Title (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {createMutation.isPending ? 'Creating…' : '⚡ Shorten URL'}
          </button>
        </form>
      </div>

      {/* Stats */}
      {overview && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total URLs" value={overview.totalUrls} />
          <StatCard label="Total Clicks" value={overview.totalClicks} />
          <StatCard label="Top URL Clicks" value={overview.topUrls[0]?.clicks ?? 0} />
        </div>
      )}

      {/* URL list */}
      <div>
        <h2 className="font-semibold text-white text-lg mb-3">Your Links</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500">No URLs yet — create your first short link above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map(url => (
              <UrlCard
                key={url.id}
                url={url}
                onDelete={() => deleteMutation.mutate(url.shortCode)}
                onAnalytics={() => setAnalyticsCode(url.shortCode)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
