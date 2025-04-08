import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { map, share, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

export interface PerformanceMetric {
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  id?: string;
  source?: string;
  type?: string;
  color?: string;
  section?: string;
  sectionColor?: string;
  isMock?: boolean;
  borderColor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsCache = new BehaviorSubject<PerformanceMetric[]>([]);
  private readonly useMockMode = environment.useMockWebSocket;

  // Hot observable for performance metrics
  public performanceMetrics$: Observable<PerformanceMetric[]>;

  constructor(
    private webSocketService: WebSocketService,
    private logger: LoggerService
  ) {
    // Subscribe to performance data from WebSocket
    this.performanceMetrics$ = this.webSocketService.subscribe<PerformanceMetric[] | any>('performance-metrics').pipe(
      map(data => {
        // Transform data if needed
        if (Array.isArray(data)) {
          this.logger.debug('PerformanceService', 'Received performance metrics array', { count: data.length });
          return data.map((metric: PerformanceMetric) => ({
            ...metric,
            timestamp: metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp) // Ensure timestamp is a Date object
          }));
        } else if (data && data.metrics && Array.isArray(data.metrics)) {
          // Handle case where metrics are wrapped in an object with metrics property
          this.logger.debug('PerformanceService', 'Received wrapped performance metrics', { count: data.metrics.length });
          return data.metrics.map((metric: PerformanceMetric) => ({
            ...metric,
            timestamp: metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp)
          }));
        } else if (data && data.data && Array.isArray(data.data)) {
          // Handle case where metrics are wrapped in an object with data property
          this.logger.debug('PerformanceService', 'Received data-wrapped performance metrics', { count: data.data.length });
          return data.data.map((metric: PerformanceMetric) => ({
            ...metric,
            timestamp: metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp)
          }));
        }
        this.logger.warning('PerformanceService', 'Received non-array data for performance metrics', { data });
        return [];
      }),
      // Update cache with latest data
      tap(metrics => {
        if (metrics.length > 0) {
          // Keep the last 100 metrics (or adjust as needed)
          this.metricsCache.next(metrics); // Replace cache with latest snapshot for performance page
          this.logger.debug('PerformanceComponent', 'Received performance metrics update', { count: metrics.length });
        }
      }),
      // Share the subscription
      share()
    );

    // Log initial subscription setup
    const modeMsg = this.useMockMode ? ' (MOCK MODE)' : '';
    this.logger.info('PerformanceService', `Subscribed to performance-metrics WebSocket stream${modeMsg}`);
  }

  // Get cached metrics (or latest value)
  getMetrics(): Observable<PerformanceMetric[]> {
    return this.metricsCache.asObservable();
  }

  // Request specific metrics (if backend supports it)
  requestMetricsHistory(lastMinutes: number = 10): void {
    this.logger.info('PerformanceService', `Requesting performance metrics history for last ${lastMinutes} minutes.`);
    this.webSocketService.sendMessage({
      action: 'getPerformanceMetricsHistory', // Example action name
      minutes: lastMinutes
    });
  }
}
