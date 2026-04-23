import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { UrlsModule } from './urls/urls.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    MetricsModule,
    RedisModule,
    UrlsModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
