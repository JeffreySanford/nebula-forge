import { Controller, Get, Post, Body, Delete, HttpStatus, HttpException } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Query('type') type: string, @Query('timespan') timespan?: number) {
    if (type) {
      return this.metricsService.getHistoricalMetrics(type, timespan ? parseInt(timespan as any) : undefined);
    }
    return this.metricsService.generatePerformanceMetrics().metrics;
  }

  @Get('legend')
  getLegend() {
    return this.metricsService.getLegend();
  }

  @Get('system-status')
  getSystemStatus() {
    return {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100),
      uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
      activeConnections: Math.floor(Math.random() * 500)
    };
  }

  @Post('register')
  registerForMetrics(@Body() registrationData: { stream: string, options?: any }) {
    // This endpoint is primarily for documentation - the actual registration
    // happens through WebSockets in the MetricsGateway
    return {
      success: true,
      message: `Registration for ${registrationData.stream} received. Please connect via WebSocket.`,
      stream: registrationData.stream,
      options: registrationData.options
    };
  }

  @Post()
  async create(@Body() createMetricDto: CreateMetricDto): Promise<SystemMetric> {
    return this.metricsService.create(createMetricDto);
  }

  @Get()
  async findAll(): Promise<SystemMetric[]> {
    return this.metricsService.findAll();
  }

  @Get('latest')
  async getLatest(): Promise<SystemMetric[]> {
    return this.metricsService.getLatest();
  }

  @Get('types')
  async getMetricTypes(): Promise<string[]> {
    return this.metricsService.getMetricTypes();
  }

  @Get('historical')
  async getHistorical(): Promise<Record<string, SystemMetric[]>> {
    return this.metricsService.getHistoricalData();
  }

  @Delete()
  async deleteAll(): Promise<{ deleted: number }> {
    return this.metricsService.deleteAll();
  }
}
