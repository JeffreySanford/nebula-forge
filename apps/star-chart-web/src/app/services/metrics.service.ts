import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { map, share, tap } from 'rxjs/operators';

export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  type: string;
  color: string; // Added color property
}

export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  activeConnections: number;
}

export interface MetricLegendItem {
  name: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private metricsCache = new BehaviorSubject<SystemMetric[]>([]);
  private systemStatusCache = new BehaviorSubject<SystemStatus | null>(null);
  private legendItems = new BehaviorSubject<MetricLegendItem[]>([]);
  
  // Hot observables for real-time data
  public metrics$: Observable<SystemMetric[]>;
  public systemStatus$: Observable<SystemStatus>;
  public legendItems$ = this.legendItems.asObservable();
  
  // Color mapping
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
  
  constructor(private webSocketService: WebSocketService) {
    // Subscribe to system metrics WebSocket stream
    this.metrics$ = this.webSocketService.subscribe<SystemMetric[]>('system-metrics').pipe(
      map(data => {
        if (Array.isArray(data)) {
          return data.map(metric => ({
            ...metric,
            timestamp: new Date(metric.timestamp)
          }));
        }
        return [];
      }),
      tap(metrics => {
        const currentCache = this.metricsCache.getValue();
        // Keep the last 1000 metrics
        this.metricsCache.next([...metrics, ...currentCache].slice(0, 1000));
      }),
      share()
    );
    
    // Subscribe to system status WebSocket stream
    this.systemStatus$ = this.webSocketService.subscribe<SystemStatus>('system-status').pipe(
      tap(status => {
        this.systemStatusCache.next(status);
      }),
      share()
    );

    // Set up reconnection handler
    this.webSocketService.onReconnected(() => {
      // Re-request metrics data types upon reconnection
      this.requestMetricsByType('frontend');
      this.requestMetricsByType('system');
      this.requestMetricsByType('application');
    });

    // Subscribe to metric legend data
    this.webSocketService.subscribe<MetricLegendItem[]>('metric-legend').pipe(
      tap(items => console.log('Received metric legend', items))
    ).subscribe(items => {
      if (items && items.length > 0) {
        this.legendItems.next(items);
      } else {
        // Default legend if not provided by server
        this.createDefaultLegend();
      }
    });
  }
  
  private createDefaultLegend(): void {
    const defaultLegend: MetricLegendItem[] = [
      { name: 'CPU Usage', color: this.colorMap['cpu'], description: 'Processor utilization' }, // Changed to bracket notation
      { name: 'Memory', color: this.colorMap['memory'], description: 'RAM usage' }, // Changed to bracket notation
      { name: 'Disk IO', color: this.colorMap['disk'], description: 'Disk read/write operations' }, // Changed to bracket notation
      { name: 'Network', color: this.colorMap['network'], description: 'Network traffic' }, // Changed to bracket notation
      { name: 'Requests', color: this.colorMap['requests'], description: 'HTTP/API requests' }, // Changed to bracket notation
      { name: 'Latency', color: this.colorMap['latency'], description: 'Response time' }, // Changed to bracket notation
      { name: 'Errors', color: this.colorMap['errors'], description: 'Error count' }, // Changed to bracket notation
      { name: 'Throughput', color: this.colorMap['throughput'], description: 'Requests per second' }, // Changed to bracket notation
      { name: 'Connections', color: this.colorMap['connections'], description: 'Active connections' }, // Changed to bracket notation
    ];
    
    this.legendItems.next(defaultLegend);
  }
  
  getColorForMetric(metricType: string): string {
    return this.colorMap[metricType.toLowerCase()] || '#888888'; // Already using bracket notation here, which is correct
  }
  
  // Get cached data
  getMetrics(): Observable<SystemMetric[]> {
    return this.metricsCache.asObservable();
  }
  
  getSystemStatus(): Observable<SystemStatus | null> {
    return this.systemStatusCache.asObservable();
  }
  
  // Request specific metric data
  requestMetricsByType(type: string): void {
    this.webSocketService.sendMessage({
      action: 'getMetricsByType',
      type: type
    });
  }
  
  // Combined real-time data for dashboard
  getDashboardData(): Observable<{metrics: SystemMetric[], status: SystemStatus | null}> {
    return combineLatest([
      this.getMetrics(),
      this.getSystemStatus()
    ]).pipe(
      map(([metrics, status]) => ({ metrics, status }))
    );
  }

  getLegend(): Observable<MetricLegendItem[]> {
    return this.legendItems$;
  }
}
