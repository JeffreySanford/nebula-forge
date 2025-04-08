import { Resolver, Query, Args, Int, Subscription } from '@nestjs/graphql';
import { MetricsService, SystemMetric } from '../services/metrics.service';
import { MetricType } from './dto/metric.dto';
import { interval } from 'rxjs';

// Create a typed PubSub implementation
class SimplePubSub {
  private listeners: Record<string, Array<(payload: unknown) => void>> = {};
  
  publish(triggerName: string, payload: unknown): boolean {
    const listeners = this.listeners[triggerName] || [];
    listeners.forEach(listener => listener(payload));
    return true;
  }
  
  subscribe(triggerName: string, onMessage: (payload: unknown) => void): () => void {
    if (!this.listeners[triggerName]) {
      this.listeners[triggerName] = [];
    }
    this.listeners[triggerName].push(onMessage);
    return () => {
      this.listeners[triggerName] = this.listeners[triggerName].filter(
        listener => listener !== onMessage
      );
    };
  }
}

const pubSub = new SimplePubSub();

@Resolver(() => MetricType)
export class MetricsResolver {
  constructor(private readonly metricsService: MetricsService) {
    // Publish metrics every 5 seconds
    interval(5000).subscribe(() => {
      const latestMetrics = this.metricsService.getLatestMetrics();
      pubSub.publish('metricsUpdated', { metricsUpdated: latestMetrics });
    });
  }

  @Query(() => [MetricType])
  async getMetrics(
    @Args('type', { nullable: true }) type?: string, 
    @Args('timespan', { type: () => Int, nullable: true }) timespan?: number
  ): Promise<MetricType[]> {
    if (type) {
      const historicalMetrics = await this.metricsService.getHistoricalMetrics(type, timespan);
      return historicalMetrics.map((metric: SystemMetric) => ({
        id: metric.id?.toString() || 'mock-id',
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp,
        source: metric.source,
        type: metric.type,
        color: metric.color || '#757575'
      }));
    }
    return this.metricsService.getLatestMetrics();
  }

  @Subscription(() => [MetricType])
  metricsUpdated() {
    return {
      subscribe: () => pubSub.subscribe('metricsUpdated', (payload: unknown) => payload),
    };
  }
}
