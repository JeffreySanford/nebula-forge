import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MetricsService, SystemStatus } from '../../services/metrics.service';
import { Observable, Subscription, interval } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { LoggerService } from '../../services/logger.service';

interface BrowserData {
  name: string;
  share: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        query('.dashboard-card, .stat-card, .action-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(80, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Real-time system status data
  systemStatus$: Observable<SystemStatus | null>;
  
  // Initialize frontendStatus with default values
  frontendStatus = {
    loadTime: '1.8s',
    renderTime: '0.6s',
    interactions: 4862,
    errors: 12,
    users: 187,
    browserShare: {
      chrome: 68,
      firefox: 17,
      safari: 13,
      edge: 2
    }
  };
  
  // Health metrics for different systems
  healthMetrics = {
    servers: [
      { name: 'API Server', status: 'healthy', uptime: '14d 7h', load: 42 },
      { name: 'Worker Node 1', status: 'healthy', uptime: '7d 12h', load: 38 },
      { name: 'Worker Node 2', status: 'warning', uptime: '3d 9h', load: 78 }
    ],
    databases: [
      { name: 'Primary DB', status: 'healthy', connections: 24, latency: '5ms' },
      { name: 'Analytics DB', status: 'healthy', connections: 7, latency: '12ms' }
    ],
    services: [
      { name: 'Authentication', status: 'healthy', requests: 1452, errorRate: 0.01 },
      { name: 'Storage', status: 'healthy', requests: 8723, errorRate: 0 },
      { name: 'Messaging', status: 'error', requests: 752, errorRate: 4.2 }
    ]
  };
  
  // WebSocket connection status
  wsConnected$: Observable<boolean>;
  
  private subscriptions: Subscription[] = [];
  
  quickActions = [
    { 
      title: 'Performance Monitoring', 
      description: 'Analyze application speed and resource usage',
      icon: 'speed',
      color: '#E91E63',
      route: '/performance'
    },
    { 
      title: 'System Metrics', 
      description: 'View detailed system health indicators',
      icon: 'insert_chart',
      color: '#2196F3',
      route: '/metrics'
    },
    { 
      title: 'Log Analysis', 
      description: 'Review system logs and error reports',
      icon: 'article',
      color: '#FF9800',
      route: '/logs'
    },
    { 
      title: 'Database Status', 
      description: 'Monitor database connections and queries',
      icon: 'storage',
      color: '#4CAF50',
      route: '/database'
    }
  ];

  constructor(
    private router: Router,
    private metricsService: MetricsService,
    public wsService: WebSocketService, 
    private logger: LoggerService
  ) {
    // Initialize with hot observables for real-time data
    this.systemStatus$ = this.metricsService.getSystemStatus();
    this.wsConnected$ = this.wsService.connectionStatus$; // Use the public observable
    
    // Set up reconnection handler for dashboard data
    this.wsService.onReconnected(() => {
      this.metricsService.requestMetricsByType('frontend');
      console.log('WebSocket reconnected, dashboard data streams re-initialized');
    });
  }

  // Add properties to track mock data status
  systemStatusIsMock = true;
  healthMetricsIsMock = true;
  frontendMetricsIsMock = true;
  
  // Track data refresh
  lastDataRefresh = new Date();
  refreshInterval: Subscription | null = null;

  // Add property to store health section color
  healthSectionColor = '#00BCD4'; // Default cyan color

  // Add properties to track registration status
  streamRegistrations = new Map<string, boolean>();
  allStreamsRegistered = false;

  ngOnInit(): void {
    // Request initial data
    this.metricsService.requestMetricsByType('frontend');
    
    // Frontend metrics subscription
    this.subscriptions.push(
      this.wsService.subscribe<any>('frontend-metrics').subscribe(
        data => {
          if (data) {
            this.frontendStatus = {
              ...this.frontendStatus,
              loadTime: data.loadTime || this.frontendStatus.loadTime,
              renderTime: data.renderTime || this.frontendStatus.renderTime,
              interactions: data.interactions || this.frontendStatus.interactions,
              errors: data.errors || this.frontendStatus.errors,
              users: data.activeUsers || this.frontendStatus.users,
              browserShare: data.browserShare || this.frontendStatus.browserShare
            };
            
            // Check if this is mock data
            this.frontendMetricsIsMock = data.isMock === true;
          }
        }
      )
    );

    // Health metrics subscription
    this.subscriptions.push(
      this.wsService.subscribe<any>('health-metrics').subscribe(
        data => {
          if (data) {
            this.logger.debug('Dashboard', 'Received health metrics', { data });
            this.healthMetrics = {
              servers: data.servers || this.healthMetrics.servers,
              databases: data.databases || this.healthMetrics.databases,
              services: data.services || this.healthMetrics.services
            };
            
            // Update the health section color if provided
            if (data.sectionColor) {
              this.healthSectionColor = data.sectionColor;
            }
            
            // Check if this is mock data
            this.healthMetricsIsMock = data.isMock === true;
          }
        },
        error => this.logger.error('Dashboard', 'Error receiving health metrics', { error })
      )
    );

    // Subscribe to section colors to get health color
    this.subscriptions.push(
      this.wsService.subscribe<Record<string, string>>('section-colors').subscribe(
        colors => {
          if (colors && colors['health']) {
            this.healthSectionColor = colors['health'];
            this.logger.debug('Dashboard', 'Received health section color', { color: colors['health'] });
          }
        }
      )
    );
    
    // Track system status mock data
    this.subscriptions.push(
      this.systemStatus$.subscribe(status => {
        // Check if system status data is mock (using type assertion since we know the structure)
        if (status && 'isMock' in status) {
          this.systemStatusIsMock = status['isMock'] === true;
        }
      })
    );
    
    // Setup refresh indicator for live data
    this.refreshInterval = interval(1000).subscribe(() => {
      // Only update if we're not in mock mode
      if (!this.wsService.isMockMode()) {
        this.lastDataRefresh = new Date();
      }
    });
    
    // Log mode changes
    this.wsService.getMockModeChanges().subscribe(isMockMode => {
      this.logger.info('Dashboard', `Data mode changed to ${isMockMode ? 'MOCK' : 'LIVE'}`);
      
      // Force data refresh when switching to live mode
      if (!isMockMode) {
        this.requestLiveData();
      }
    });

    // Track registration acknowledgements more robustly
    this.subscriptions.push(
      this.wsService.getRegisteredStreams().subscribe(streams => {
        // Log registration status
        this.logger.info('Dashboard', 'Stream registrations updated', {
          registered: streams,
          allRegistered: this.checkAllRequiredStreamsRegistered(streams)
        });

        // Update registration status indicators
        this.streamRegistrations = new Map();
        streams.forEach(stream => this.streamRegistrations.set(stream, true));
        
        // Check if all required streams are registered
        this.allStreamsRegistered = this.checkAllRequiredStreamsRegistered(streams);
      })
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Helper method to get status class
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy': return 'status-healthy';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return '';
    }
  }
  
  // Helper for browser data visualization
  getBrowserData(): BrowserData[] {
    return [
      { name: 'Chrome', share: this.frontendStatus.browserShare.chrome, color: '#4caf50' },
      { name: 'Firefox', share: this.frontendStatus.browserShare.firefox, color: '#ff9800' },
      { name: 'Safari', share: this.frontendStatus.browserShare.safari, color: '#2196f3' },
      { name: 'Edge', share: this.frontendStatus.browserShare.edge, color: '#3f51b5' }
    ];
  }
  
  // Add method to manually request live data
  requestLiveData(): void {
    this.logger.info('Dashboard', 'Manually requesting live data');
    this.metricsService.requestMetricsByType('frontend');
    this.metricsService.requestMetricsByType('system');
    this.wsService.sendMessage({
      action: 'request-refresh',
      timestamp: new Date().toISOString()
    });
  }

  // Add method to get status color based on status and health color
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy': return '#4CAF50'; // Green
      case 'warning': return '#FF9800'; // Orange
      case 'error': return '#F44336'; // Red
      default: return this.healthSectionColor; // Use health section color as default
    }
  }

  // Add method to check if a specific stream is registered
  isStreamRegistered(stream: string): boolean {
    return this.streamRegistrations.get(stream) === true;
  }

  // Add a method to check if all required streams are registered
  private checkAllRequiredStreamsRegistered(registeredStreams: string[]): boolean {
    const requiredStreams = ['health-metrics', 'metrics', 'performance-metrics'];
    return requiredStreams.every(stream => registeredStreams.includes(stream));
  }
}
