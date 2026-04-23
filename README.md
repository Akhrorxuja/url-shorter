# URL Shortener 🔗

A full-stack URL shortener with Redis caching, click analytics, and full observability.

## Architecture

```
Next.js UI  →  NestJS API  →  PostgreSQL (Prisma)
                    │
                    ├──► Redis (cache — fast redirects < 1ms)
                    ├──► Prometheus (metrics)
                    ├──► Loki (logs)
                    └──► Grafana (dashboard)
```

## Quick Start

```bash
git clone <repo> && cd url-shortener
cp .env.example .env
docker compose up --build
open http://localhost:3000
```

## Service URLs

| Service     | URL                              |
|-------------|----------------------------------|
| App UI      | http://localhost:3000            |
| API         | http://localhost:3001/api        |
| Swagger     | http://localhost:3001/api/docs   |
| Grafana     | http://localhost:3100 (admin/admin) |
| Prometheus  | http://localhost:9090            |
| Redis       | localhost:6380                   |
| PostgreSQL  | localhost:5433                   |

## How it Works

### Shorten a URL
1. Enter a long URL in the UI
2. Optionally add a custom code and title
3. Get a short URL like `http://localhost:3001/abc1234`

### Redirect Flow (cache-first)
```
User visits localhost:3001/abc1234
        ↓
Check Redis cache for "url:abc1234"
        ↓ (HIT — < 1ms)         ↓ (MISS — ~10ms)
Redirect immediately         Fetch from PostgreSQL
                             Cache in Redis
                             Redirect
        ↓
Record click (async — device, browser, OS)
Record Prometheus metric
Write log to Loki
```

### Analytics
- Click each URL's 📊 Analytics button
- See clicks by day (14-day chart), browser, OS, device
- Total clicks tracked in real time

## Key Concepts

### Why Redis?
PostgreSQL lookup = 5-20ms. Redis lookup = 0.1-1ms.
For a URL shortener handling millions of requests, Redis is essential.
Cache hit rate is tracked in Grafana.

### Why nanoid?
Generates 7-character random codes like `abc1234`.
Collision-resistant — 1 trillion combinations.

## Project Structure
```
url-shortener/
├── backend/src/
│   ├── urls/          # Create, resolve, delete URLs
│   ├── analytics/     # Click tracking & stats
│   ├── metrics/       # Prometheus instrumentation
│   ├── logger/        # Winston + Loki logging
│   ├── redis/         # Redis caching service
│   ├── prisma/        # Database client
│   └── health/        # Health check
├── frontend/src/
│   └── app/page.tsx   # Main dashboard + analytics modal
├── infra/
│   ├── prometheus/
│   ├── grafana/       # Auto-provisioned dashboard
│   └── loki/
├── .cursor/
│   ├── rules/stack.md
│   ├── skills/redis-caching.md
│   └── commands/pre-commit
└── docker-compose.yml
```
