import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService, private logger: LoggerService) {}

  async getUrlAnalytics(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
      include: { events: { orderBy: { clickedAt: 'desc' }, take: 100 } },
    });
    if (!url) throw new NotFoundException(`URL "${shortCode}" not found`);

    const events = url.events;

    // Group by browser
    const byBrowser = this.groupBy(events, 'browser');
    // Group by OS
    const byOs = this.groupBy(events, 'os');
    // Group by device
    const byDevice = this.groupBy(events, 'device');
    // Clicks per day (last 14 days)
    const clicksByDay = this.clicksByDay(events);

    this.logger.log('Analytics fetched', { shortCode, totalClicks: events.length });

    return {
      shortCode,
      originalUrl: url.originalUrl,
      title: url.title,
      totalClicks: url.clicks,
      createdAt: url.createdAt,
      byBrowser,
      byOs,
      byDevice,
      clicksByDay,
      recentClicks: events.slice(0, 10),
    };
  }

  async getOverview() {
    const [totalUrls, totalClicks, topUrls] = await Promise.all([
      this.prisma.url.count(),
      this.prisma.clickEvent.count(),
      this.prisma.url.findMany({
        orderBy: { clicks: 'desc' },
        take: 5,
        select: { shortCode: true, originalUrl: true, title: true, clicks: true },
      }),
    ]);

    return { totalUrls, totalClicks, topUrls };
  }

  private groupBy(events: any[], field: string) {
    const map: Record<string, number> = {};
    for (const e of events) {
      const key = e[field] || 'unknown';
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private clicksByDay(events: any[]) {
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toISOString().split('T')[0]] = 0;
    }
    for (const e of events) {
      const day = new Date(e.clickedAt).toISOString().split('T')[0];
      if (map[day] !== undefined) map[day]++;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }
}
