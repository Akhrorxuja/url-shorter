import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerService } from '../logger/logger.service';
import { CreateUrlDto } from './urls.dto';
import { Request } from 'express';

// nanoid v3 compatible require
const { nanoid } = require('nanoid');

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'url:';

@Injectable()
export class UrlsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private metrics: MetricsService,
    private logger: LoggerService,
  ) {}

  async create(dto: CreateUrlDto) {
    this.logger.log('Creating short URL', { originalUrl: dto.originalUrl });

    const shortCode = dto.customCode || nanoid(7);

    // Check custom code not already taken
    if (dto.customCode) {
      const existing = await this.prisma.url.findUnique({ where: { shortCode } });
      if (existing) throw new ConflictException(`Short code "${shortCode}" is already taken`);
    }

    const url = await this.prisma.url.create({
      data: {
        shortCode,
        originalUrl: dto.originalUrl,
        title: dto.title,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Cache it immediately
    await this.redis.set(`${CACHE_PREFIX}${shortCode}`, dto.originalUrl, CACHE_TTL);

    this.metrics.recordUrlCreated();
    this.logger.log('Short URL created', { shortCode, originalUrl: dto.originalUrl });

    return {
      ...url,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${shortCode}`,
    };
  }

  async resolve(shortCode: string, req: Request): Promise<string> {
    const start = Date.now();

    // 1. Check Redis cache first (fast path)
    const cached = await this.redis.get(`${CACHE_PREFIX}${shortCode}`);
    if (cached) {
      this.metrics.recordCacheHit();
      this.metrics.recordRedirect(shortCode);
      this.metrics.recordRedirectDuration(Date.now() - start);
      this.logger.log('Cache HIT — redirect', { shortCode, duration: Date.now() - start });

      // Record click async
      this.recordClick(shortCode, req).catch(() => {});
      return cached;
    }

    // 2. Cache miss — go to DB
    this.metrics.recordCacheMiss();
    const url = await this.prisma.url.findUnique({ where: { shortCode } });

    if (!url || !url.isActive) {
      this.logger.warn('Short code not found', { shortCode });
      throw new NotFoundException(`Short URL "${shortCode}" not found`);
    }

    if (url.expiresAt && new Date() > url.expiresAt) {
      this.logger.warn('Short URL expired', { shortCode });
      throw new BadRequestException(`Short URL "${shortCode}" has expired`);
    }

    // Cache for next time
    await this.redis.set(`${CACHE_PREFIX}${shortCode}`, url.originalUrl, CACHE_TTL);

    this.metrics.recordRedirect(shortCode);
    this.metrics.recordRedirectDuration(Date.now() - start);
    this.logger.log('Cache MISS — redirect from DB', { shortCode, duration: Date.now() - start });

    // Record click async
    this.recordClick(shortCode, req).catch(() => {});

    return url.originalUrl;
  }

  async findAll() {
    const urls = await this.prisma.url.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } } },
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return urls.map(url => ({
      ...url,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clickCount: url._count.events,
    }));
  }

  async findOne(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
      include: { _count: { select: { events: true } } },
    });
    if (!url) throw new NotFoundException(`URL with code "${shortCode}" not found`);

    return {
      ...url,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${shortCode}`,
      clickCount: url._count.events,
    };
  }

  async delete(shortCode: string) {
    const url = await this.prisma.url.findUnique({ where: { shortCode } });
    if (!url) throw new NotFoundException(`URL "${shortCode}" not found`);

    await this.prisma.url.update({ where: { shortCode }, data: { isActive: false } });
    await this.redis.del(`${CACHE_PREFIX}${shortCode}`);

    this.logger.log('URL deactivated', { shortCode });
    return { message: 'URL deactivated successfully' };
  }

  private async recordClick(shortCode: string, req: Request) {
    try {
      const url = await this.prisma.url.findUnique({ where: { shortCode } });
      if (!url) return;

      const UAParser = require('ua-parser-js');
      const parser = new UAParser(req.headers['user-agent'] || '');
      const ua = parser.getResult();

      await this.prisma.url.update({
        where: { shortCode },
        data: { clicks: { increment: 1 } },
      });

      await this.prisma.clickEvent.create({
        data: {
          urlId: url.id,
          ip: req.ip || req.connection?.remoteAddress,
          device: ua.device?.type || 'desktop',
          browser: ua.browser?.name || 'unknown',
          os: ua.os?.name || 'unknown',
          referer: req.headers.referer || null,
        },
      });
    } catch (err) {
      this.logger.error('Failed to record click', { shortCode, error: err.message });
    }
  }
}
