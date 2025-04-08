import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { SystemMetric } from './interfaces/metric.interface';

interface HistoricalMetricsResponse {
  [key: string]: SystemMetric[];
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Query('type') type: string, @Query('timespan') timespan?: string) {
    if (type) {
      return this.metricsService.getHistoricalMetrics(type, timespan ? parseInt(timespan) : undefined);
    }
    return this.metricsService.getLatestMetrics();
  }

  @Post()
  async create(@Body() createMetricDto: CreateMetricDto) {
    return this.metricsService.createMetric(
      createMetricDto.type,
      createMetricDto.name,
      createMetricDto.unit,
      createMetricDto.value
    );
  }

  @Delete()
  async clearMetrics() {
    return this.metricsService.clearMetrics();
  }
}
