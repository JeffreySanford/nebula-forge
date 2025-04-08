import { Resolver, Query, Args, Int, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { MetricsService, SystemMetric } from '../services/metrics.service';
import { MetricType } from './dto/metric.dto';
import { interval } from 'rxjs';

const pubSub = new PubSub();

@Resolver(() => MetricType)
export class MetricsResolver {
  constructor(private readonly metricsService: MetricsService) {
    // Publish metrics every 5 seconds
    interval(5000).subscribe(() => {
      const performanceMetrics = this.metricsService.generatePerformanceMetrics();
      pubSub.publish('metricsUpdated', { metricsUpdated: performanceMetrics.metrics });
    });
  }

  @Query(() => [MetricType])
  async getMetrics(
    @Args('type', { nullable: true }) type?: string,
    @Args('timespan', { type: () => Int, nullable: true }) timespan?: number
  ): Promise<SystemMetric[]> {
    if (type) {
      const historicalMetrics = await this.metricsService.getHistoricalMetrics(type, timespan);
      return historicalMetrics.map(metric => ({
        id: metric._id.toString(),
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp,
        source: metric.source || 'system',
        type: metric.type,
        color: metric.color || '#000000'
      }));
    }
    
    // Return latest performance metrics if no type specified
    return this.metricsService.generatePerformanceMetrics().metrics;
  }

  @Subscription(() => [MetricType])
  metricsUpdated() {
    return pubSub.asyncIterator('metricsUpdated');
  }
}
