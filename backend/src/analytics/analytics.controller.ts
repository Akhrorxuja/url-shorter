import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overall stats' })
  getOverview() { return this.analyticsService.getOverview(); }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Get analytics for a specific URL' })
  getUrlAnalytics(@Param('shortCode') shortCode: string) {
    return this.analyticsService.getUrlAnalytics(shortCode);
  }
}
