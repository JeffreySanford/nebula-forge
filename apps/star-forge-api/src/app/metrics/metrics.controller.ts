import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { SystemMetric } from './interfaces/metric.interface';
import { HistoricalMetricsRequestDto, HistoricalMetricsResponseDto } from './dto/historical-metrics.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Query('type') type: string,
    @Query('timespan') timespan?: string,
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<HistoricalMetricsResponseDto | SystemMetric[]> {
    if (type) {
      const request: HistoricalMetricsRequestDto = {
        type,
        timespan: timespan ? parseInt(timespan) : undefined,
        range: range as 'hour' | 'day' | 'week' | 'month' | 'year',
        startDate,
        endDate
      };
      return this.metricsService.getHistoricalMetrics(request);
    }
    return this.metricsService.getLatestMetrics();
  }

  @Post()
  async create(@Body() createMetricDto: CreateMetricDto): Promise<SystemMetric> {
    return this.metricsService.createMetric(createMetricDto);
  }

  @Delete()
  async clearMetrics(): Promise<{ deleted: number }> {
    return this.metricsService.clearMetrics();
  }
}
