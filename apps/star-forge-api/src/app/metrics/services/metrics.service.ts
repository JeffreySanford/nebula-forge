import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Metric } from '../../schemas/metric.schema';
import { CreateMetricDto } from '../dto/create-metric.dto';
import { SystemMetric } from '../interfaces/metric.interface';
import { HistoricalMetricsRequestDto, HistoricalMetricsResponseDto } from '../dto/historical-metrics.dto';
import { LoggerService } from '../../services/logger.service';

@Injectable()
export class MetricsService {
  private colorMap: { [key: string]: string } = {
    cpu: '#FF5722',
    memory: '#2196F3',
    disk: '#4CAF50',
    network: '#9C27B0',
    requests: '#FFC107',
    latency: '#795548',
    errors: '#F44336',
    throughput: '#009688',
    connections: '#3F51B5'
  };

  constructor(
    @InjectModel(Metric.name) private metricModel: Model<Metric>,
    private logger: LoggerService
  ) {
    this.logger.info('MetricsService', 'Metrics service initialized with MongoDB connection');
  }

  async createMetric(createMetricDto: CreateMetricDto): Promise<SystemMetric> {
    const newMetric = new this.metricModel(createMetricDto);
    
    // Set color if not provided
    if (!newMetric.color && createMetricDto.type) {
      newMetric.color = this.colorMap[createMetricDto.type.toLowerCase()] || '#888888';
    }
    
    // Set timestamp if not provided
    if (!newMetric.timestamp) {
      newMetric.timestamp = new Date();
    }
    
    const savedMetric = await newMetric.save();
    this.logger.info('MetricsService', 'Created new metric', { 
      id: savedMetric._id?.toString() || 'unknown-id', // Add optional chaining and fallback
      type: savedMetric.type 
    });
    
    return this.mapToSystemMetric(savedMetric);
  }

  async getHistoricalMetrics(request: HistoricalMetricsRequestDto): Promise<HistoricalMetricsResponseDto> {
    const { type, timespan, range, startDate, endDate } = request;
    
    // Calculate date range
    const end = new Date();
    let start: Date;
    
    // Priority 1: Explicit timespan in minutes
    if (timespan) {
      start = new Date(end.getTime() - (timespan * 60 * 1000));
      this.logger.info('MetricsService', `Using timespan filter: ${timespan} minutes`, {
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
    } 
    // Priority 2: Explicit date range
    else if (startDate && endDate) {
      start = new Date(startDate);
    } 
    // Priority 3: Named range
    else if (range) {
      start = this.calculateStartDateFromRange(range);
    } 
    // Default to 24 hours
    else {
      // Default to last 24 hours
      start = new Date(end.getTime() - (24 * 60 * 60 * 1000));
    }
    
    this.logger.info('MetricsService', 'Fetching historical metrics', {
      type,
      start: start.toISOString(),
      end: end.toISOString(),
      range
    });
    
    // Query the database
    const metrics = await this.metricModel.find({
      type,
      timestamp: {
        $gte: start,
        $lte: end
      }
    }).sort({ timestamp: 1 }).exec();
    
    // Map to DTOs without using class-transformer
    const metricDtos = metrics.map(metric => ({
      id: metric._id?.toString() || 'unknown-id',
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp.toISOString(),
      source: metric.source,
      type: metric.type,
      color: metric.color
    }));
    
    // Create response object manually
    const response: HistoricalMetricsResponseDto = {
      type,
      metrics: metricDtos,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      range,
      timespan
    };
    
    return response;
  }

  async getLatestMetrics(): Promise<SystemMetric[]> {
    // Find the latest metric of each type
    const latestMetrics = await this.metricModel.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: "$type",
          doc: { $first: "$$ROOT" }
      }},
      { $replaceRoot: { newRoot: "$doc" } }
    ]).exec();
    
    return latestMetrics.map(metric => this.mapToSystemMetric(metric));
  }

  async clearMetrics(): Promise<{ deleted: number }> {
    const result = await this.metricModel.deleteMany({}).exec();
    this.logger.info('MetricsService', `Cleared metrics collection`, { count: result.deletedCount });
    return { deleted: result.deletedCount || 0 };
  }

  private mapToSystemMetric(metric: Metric): SystemMetric {
    return {
      id: metric._id?.toString() || 'unknown-id', // Add optional chaining and fallback
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp,
      source: metric.source,
      type: metric.type,
      color: metric.color || this.colorMap[metric.type.toLowerCase()] || '#888888'
    };
  }

  private calculateStartDateFromRange(range: string): Date {
    const now = new Date();
    switch (range) {
      case 'hour':
        return new Date(now.getTime() - (60 * 60 * 1000));
      case 'day':
        return new Date(now.getTime() - (24 * 60 * 60 * 1000));
      case 'week':
        return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      case 'month':
        return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      case 'year':
        return new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      default:
        return new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Default to day
    }
  }
}
