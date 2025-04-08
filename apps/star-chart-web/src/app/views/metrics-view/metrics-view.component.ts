import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { MetricsService } from '../../services/metrics.service';
import { PerformanceService } from '../../services/performance.service';
import { LoggerService } from '../../services/logger.service';
import { Observable, Subscription, combineLatest, map, timer } from 'rxjs';

export interface StreamStatus {
  name: string;
  displayName: string;
  registered: boolean;
  lastUpdated: Date | null;
  lastValue: any;
  isMock: boolean;
  description: string;
}

@Component({
  selector: 'app-metrics-view',
  templateUrl: './metrics-view.component.html',
  styleUrls: ['./metrics-view.component.scss']
})
export class MetricsViewComponent implements OnInit, OnDestroy {
  // Stream statuses
  streams: StreamStatus[] = [];
  wsConnected$: Observable<boolean>;
  isMockMode = false;
  
  // Performance metrics
  performanceMetrics: any[] = [];
  
  // System metrics
  systemMetrics: any[] = [];
  
  // Health metrics
  healthMetrics: any = {};
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private wsService: WebSocketService,
    private metricsService: MetricsService,
    private performanceService: PerformanceService,
    private logger: LoggerService
  ) {
    this.wsConnected$ = this.wsService.connectionStatus$;
  }
  
  ngOnInit(): void {
    // Initialize list of all possible stream types
    this.streams = [
      { 
        name: 'metrics', 
        displayName: 'System Metrics', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'Core system metrics including CPU, memory, and disk'
      },
      { 
        name: 'performance-metrics', 
        displayName: 'Performance', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'Application performance metrics like response time and throughput'
      },
      { 
        name: 'health-metrics', 
        displayName: 'Health', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'Health status of servers, databases and services'
      },
      { 
        name: 'database', 
        displayName: 'Database', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'Database connection stats and query performance'
      },
      { 
        name: 'graphql', 
        displayName: 'GraphQL', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'GraphQL query metrics and performance'
      },
      { 
        name: 'section-colors', 
        displayName: 'Theming', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'UI section colors and theme settings'
      },
      { 
        name: 'metric-legend', 
        displayName: 'Legend', 
        registered: false, 
        lastUpdated: null, 
        lastValue: null, 
        isMock: true,
        description: 'Metric visualization legends and descriptions'
      }
    ];
    
    // Track mock mode status
    this.subscriptions.push(
      this.wsService.getMockModeChanges().subscribe(isMockMode => {
        this.isMockMode = isMockMode;
      })
    );
    
    // Track registered streams
    this.subscriptions.push(
      this.wsService.getRegisteredStreams().subscribe(registeredStreams => {
        this.updateStreamRegistrations(registeredStreams);
      })
    );
    
    // Subscribe to system metrics
    this.subscriptions.push(
      this.metricsService.getMetrics().subscribe(metrics => {
        this.systemMetrics = metrics;
        this.updateStreamLastValue('metrics', metrics, this.determineIfMock(metrics));
      })
    );
    
    // Subscribe to performance metrics
    this.subscriptions.push(
      this.performanceService.performanceMetrics$.subscribe(metrics => {
        this.performanceMetrics = metrics;
        this.updateStreamLastValue('performance-metrics', metrics, this.determineIfMock(metrics));
      })
    );
    
    // Subscribe to health metrics
    this.subscriptions.push(
      this.wsService.subscribe<any>('health-metrics').subscribe(metrics => {
        this.healthMetrics = metrics;
        this.updateStreamLastValue('health-metrics', metrics, this.determineIfMock(metrics));
      })
    );
    
    // Subscribe to other streams for last value tracking
    this.subscriptions.push(
      this.wsService.subscribe<any>('database').subscribe(data => {
        this.updateStreamLastValue('database', data, this.determineIfMock(data));
      })
    );
    
    this.subscriptions.push(
      this.wsService.subscribe<any>('graphql').subscribe(data => {
        this.updateStreamLastValue('graphql', data, this.determineIfMock(data));
      })
    );
    
    this.subscriptions.push(
      this.wsService.subscribe<any>('section-colors').subscribe(data => {
        this.updateStreamLastValue('section-colors', data, this.determineIfMock(data));
      })
    );
    
    this.subscriptions.push(
      this.wsService.subscribe<any>('metric-legend').subscribe(data => {
        this.updateStreamLastValue('metric-legend', data, this.determineIfMock(data));
      })
    );
    
    // Log component initialization
    this.logger.info('MetricsViewComponent', 'Metrics view initialized');
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private updateStreamRegistrations(registeredStreams: string[]): void {
    this.streams.forEach(stream => {
      stream.registered = registeredStreams.includes(stream.name);
    });
    
    this.logger.debug('MetricsViewComponent', 'Stream registrations updated', { 
      registered: registeredStreams 
    });
  }
  
  private updateStreamLastValue(streamName: string, value: any, isMock: boolean): void {
    const stream = this.streams.find(s => s.name === streamName);
    if (stream) {
      stream.lastUpdated = new Date();
      stream.lastValue = value;
      stream.isMock = isMock;
    }
  }
  
  private determineIfMock(data: any): boolean {
    if (!data) return true;
    
    // Check if single object with isMock flag
    if (data.isMock) {
      return true;
    }
    
    // Check if array with isMock flag on at least one item
    if (Array.isArray(data) && data.some(item => item.isMock)) {
      return true;
    }
    
    // Use global mock mode status as fallback
    return this.isMockMode;
  }
  
  getStreamStatusClass(stream: StreamStatus): string {
    if (!stream.registered) {
      return 'status-unregistered';
    }
    
    if (stream.isMock) {
      return 'status-mock';
    }
    
    return 'status-live';
  }
  
  toggleMockMode(): void {
    this.wsService.setMockMode(!this.isMockMode);
  }
  
  refreshRegistrations(): void {
    // Force re-register all streams
    this.wsService.forceReconnect();
  }
}
