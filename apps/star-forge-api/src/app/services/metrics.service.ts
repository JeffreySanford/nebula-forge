import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  type: string;
  color?: string;
}

@Injectable()
export class MetricsService {
  private metricsSubject: BehaviorSubject<SystemMetric[]> = new BehaviorSubject<
    SystemMetric[]
  >([]);
  public metrics$: Observable<SystemMetric[]> =
    this.metricsSubject.asObservable();

  constructor() {
    // Initialize with some example metrics
    this.generateInitialMetrics();

    // Set up periodic metrics updates
    setInterval(() => this.updateMetrics(), 5000);
  }

  private generateInitialMetrics(): void {
    const initialMetrics: SystemMetric[] = [
      this.createMetric('cpu', 'CPU Usage', '%', 45),
      this.createMetric('memory', 'Memory Usage', 'MB', 2450),
      this.createMetric('disk', 'Disk IO', 'IOPS', 120),
      this.createMetric('network', 'Network Traffic', 'Mbps', 75),
    ];

    this.metricsSubject.next(initialMetrics);
  }

  private updateMetrics(): void {
    const updatedMetrics = this.metricsSubject.getValue().map((metric) => ({
      ...metric,
      value: this.getRandomValue(metric.type, metric.value),
      timestamp: new Date(),
    }));

    this.metricsSubject.next(updatedMetrics);
  }

  createMetric(
    type: string,
    name: string,
    unit: string,
    value: number
  ): SystemMetric {
    return {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      source: 'API Server',
      type,
      color: this.getColorForType(type),
    };
  }

  private getRandomValue(type: string, currentValue: number): number {
    // Add some random variation to current value
    const randomFactor = 0.2; // 20% random variation
    const randomChange = currentValue * randomFactor * (Math.random() * 2 - 1);

    switch (type) {
      case 'cpu':
        return Math.min(
          Math.max(Math.round(currentValue + randomChange), 0),
          100
        );
      case 'memory':
        return Math.max(Math.round(currentValue + randomChange), 0);
      case 'disk':
        return Math.max(Math.round(currentValue + randomChange), 0);
      case 'network':
        return Math.max(Math.round(currentValue + randomChange), 0);
      default:
        return Math.max(Math.round(currentValue + randomChange), 0);
    }
  }

  private getColorForType(type: string): string {
    const colorMap: Record<string, string> = {
      cpu: '#FF5722', // Deep Orange
      memory: '#2196F3', // Blue
      disk: '#4CAF50', // Green
      network: '#9C27B0', // Purple
    };

    return colorMap[type] || '#757575'; // Grey default
  }

  getHistoricalMetrics(type: string, timespan?: number): SystemMetric[] {
    if (timespan) {
      // Filter metrics based on timespan
      const now = Date.now();
      const filteredMetrics = this.metricsSubject
        .getValue()
        .filter(
          (metric) =>
            metric.type === type && now - metric.timestamp.getTime() <= timespan
        );
      return filteredMetrics;
    } else {
      // Return all metrics of the specified type
      const metrics = this.metricsSubject
        .getValue()
        .filter((metric) => metric.type === type);

      return metrics;
    }
  }

  getLatestMetrics(): SystemMetric[] {
    // Return the latest metrics for each type
    const metrics = this.metricsSubject.getValue();
    const latestByType = new Map<string, SystemMetric>();

    metrics.forEach((metric) => {
      const current = latestByType.get(metric.type);
      if (!current || metric.timestamp > current.timestamp) {
        latestByType.set(metric.type, metric);
      }
    });

    return Array.from(latestByType.values());
  }

  // Renamed to addCustomMetric to avoid conflict
  addCustomMetric(metric: SystemMetric): SystemMetric {
    const existingMetrics = this.metricsSubject.getValue();
    const newMetricsArray = [...existingMetrics, metric];
    this.metricsSubject.next(newMetricsArray);
    return metric;
  }

  clearMetrics(): void {
    this.metricsSubject.next([]);
  }
}
