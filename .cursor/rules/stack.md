# URL Shortener — Cursor Rules

## Stack Constraints
- Frontend: Next.js 14 App Router, Tailwind CSS, TanStack Query, React Hook Form + Zod
- Backend: NestJS, Prisma, PostgreSQL, Redis (ioredis), prom-client
- NO console.log — use LoggerService
- NO raw SQL — use Prisma
- NO useEffect for data fetching — use TanStack Query
- NO inline styles — use Tailwind only

## Redis Caching Rules
- ALL URL lookups MUST check Redis first (cache-first pattern)
- Cache key format: `url:<shortCode>`
- Default TTL: 3600 seconds (1 hour)
- On URL delete: ALWAYS invalidate Redis cache entry

## Redirect Performance Rule
- Redirect endpoint MUST respond in < 10ms for cached URLs
- ALWAYS record redirect duration via MetricsService

## Observability (mandatory on every new endpoint)
- Log entry and exit via LoggerService
- Record metric via MetricsService
- Catch errors with logger.error()
