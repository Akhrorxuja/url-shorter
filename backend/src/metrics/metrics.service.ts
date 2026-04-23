import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new client.Registry();
  private readonly urlsCreated: client.Counter;
  private readonly redirectsTotal: client.Counter;
  private readonly cacheHits: client.Counter;
  private readonly cacheMisses: client.Counter;
  private readonly redirectDuration: client.Histogram;

  constructor() {
    client.collectDefaultMetrics({ register: this.registry });

    this.urlsCreated = new client.Counter({
      name: 'url_shortener_urls_created_total',
      help: 'Total URLs created',
      registers: [this.registry],
    });

    this.redirectsTotal = new client.Counter({
      name: 'url_shortener_redirects_total',
      help: 'Total redirects',
      labelNames: ['short_code'],
      registers: [this.registry],
    });

    this.cacheHits = new client.Counter({
      name: 'url_shortener_cache_hits_total',
      help: 'Redis cache hits',
      registers: [this.registry],
    });

    this.cacheMisses = new client.Counter({
      name: 'url_shortener_cache_misses_total',
      help: 'Redis cache misses',
      registers: [this.registry],
    });

    this.redirectDuration = new client.Histogram({
      name: 'url_shortener_redirect_duration_ms',
      help: 'Redirect lookup duration in ms',
      buckets: [1, 5, 10, 25, 50, 100, 250],
      registers: [this.registry],
    });
  }

  recordUrlCreated() { this.urlsCreated.inc(); }
  recordRedirect(shortCode: string) { this.redirectsTotal.inc({ short_code: shortCode }); }
  recordCacheHit() { this.cacheHits.inc(); }
  recordCacheMiss() { this.cacheMisses.inc(); }
  recordRedirectDuration(ms: number) { this.redirectDuration.observe(ms); }

  async getMetrics() { return this.registry.metrics(); }
  getContentType() { return this.registry.contentType; }
}
