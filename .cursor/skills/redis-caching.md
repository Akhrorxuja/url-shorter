# Skill: Redis Caching Pattern

## Cache-First Lookup (use for ALL URL resolves)
```typescript
async resolve(key: string): Promise<string> {
  // 1. Check cache first
  const cached = await this.redis.get(`url:${key}`);
  if (cached) {
    this.metrics.recordCacheHit();
    return cached; // fast path — no DB call
  }

  // 2. Cache miss — go to DB
  this.metrics.recordCacheMiss();
  const record = await this.prisma.url.findUnique({ where: { shortCode: key } });
  if (!record) throw new NotFoundException();

  // 3. Populate cache for next time
  await this.redis.set(`url:${key}`, record.originalUrl, 3600);
  return record.originalUrl;
}
```

## Cache Invalidation (on update/delete)
```typescript
async delete(key: string) {
  await this.prisma.url.update({ where: { shortCode: key }, data: { isActive: false } });
  await this.redis.del(`url:${key}`); // always invalidate
}
```

## Why Redis?
- PostgreSQL lookup: ~5-20ms
- Redis lookup: ~0.1-1ms
- For a URL shortener, every millisecond matters — users expect instant redirects
