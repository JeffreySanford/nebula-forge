import { Injectable } from '@nestjs/common';
import { Subject, interval, Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  type: string;
  color: string;
  section?: string;
  sectionColor?: string;
  isMock?: boolean;
  borderColor?: string;
}

export interface MetricLegendItem {
  name: string;
  color: string;
  description: string;
}

export interface HealthMetricsData {
  sectionColor: string;
  servers: Array<{
    name: string;
    status: string;
    uptime: string;
    load: number;
    color: string;
  }>;
  databases: Array<{
    name: string;
    status: string;
    connections: number;
    latency: string;
    color: string;
  }>;
  services: Array<{
    name: string;
    status: string;
    requests: number;
    errorRate: number;
    color: string;
  }>;
}

export interface SectionMetricsData {
  sectionColor: string;
  metrics: SystemMetric[];
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MetricsService {
  // @ts-expect-error Definite assignment assertion
  // This is a workaround for the issue with WebSocketServer not being initialized
  // before the constructor is called. The server will be set in the WebSocketGateway.
  // This is a known issue with the NestJS WebSocketGateway decorator.
  @WebSocketServer()
  server!: Server; // Add definite assignment assertion to ensure proper type handling
  
  private metricsSubject: Subject<SystemMetric[]> = new Subject<
    SystemMetric[]
  >();
  private metricLegend: MetricLegendItem[] = [];

  // Section colors - define all section colors here
  private sectionColors: Record<string, string> = {
    dashboard: '#3F51B5', // Indigo
    health: '#00BCD4', // Cyan
    metrics: '#4CAF50', // Green
    performance: '#FF5722', // Deep Orange
    database: '#9C27B0', // Purple
    graphql: '#FF9800', // Orange
  };

  // Color mapping matches the frontend
  private colorMap: { [key: string]: string } = {
    cpu: '#FF5722',
    memory: '#2196F3',
    disk: '#4CAF50',
    network: '#9C27B0',
    requests: '#FFC107',
    latency: '#795548',
    errors: '#F44336',
    throughput: '#009688',
    connections: '#3F51B5',
  };

  public metrics$: Observable<SystemMetric[]> = this.metricsSubject.asObservable();

  private metrics: Record<string, number> = {};

  constructor(private logger: LoggerService) {
    this.initializeMetricLegend();
    this.startMetricsGeneration();
    this.startExtendedMetrics();

    this.logger.info(
      'MetricsService',
      'API Metrics service initialized with color-coded metrics'
    );

    // Log the color scheme
    this.logger.info(
      'MetricsService',
      'API Metrics service initialized with section colors',
      {
        sectionColors: this.sectionColors,
      }
    );
  }

  private initializeMetricLegend(): void {
    this.metricLegend = [
      {
        name: 'CPU Usage',
        color: this.colorMap.cpu,
        description: 'Processor utilization',
      },
      { name: 'Memory', color: this.colorMap.memory, description: 'RAM usage' },
      {
        name: 'Disk IO',
        color: this.colorMap.disk,
        description: 'Disk read/write operations',
      },
      {
        name: 'Network',
        color: this.colorMap.network,
        description: 'Network traffic',
      },
      {
        name: 'Requests',
        color: this.colorMap.requests,
        description: 'HTTP/API requests',
      },
      {
        name: 'Latency',
        color: this.colorMap.latency,
        description: 'Response time',
      },
      {
        name: 'Errors',
        color: this.colorMap.errors,
        description: 'Error count',
      },
      {
        name: 'Throughput',
        color: this.colorMap.throughput,
        description: 'Requests per second',
      },
      {
        name: 'Connections',
        color: this.colorMap.connections,
        description: 'Active connections',
      },
    ];
  }

  private startMetricsGeneration(): void {
    interval(5000).subscribe(() => {
      const metrics: SystemMetric[] = [
        this.generateMetric('cpu', 'CPU Usage', '%'),
        this.generateMetric('memory', 'Memory Usage', 'MB'),
        this.generateMetric('disk', 'Disk IO', 'IOPS'),
        this.generateMetric('network', 'Network Traffic', 'Mbps'),
        this.generateMetric('requests', 'Request Count', 'req/s'),
        this.generateMetric('latency', 'API Latency', 'ms'),
      ];

      this.metricsSubject.next(metrics);
      
      // Emit metrics via WebSockets
      if (this.server) {
        this.server.emit('metrics-update', metrics);
      }
      
      this.logger.info('MetricsService', 'Generated new metrics data', {
        count: metrics.length,
        isMock: true
      });
    });
  }

  startExtendedMetrics(): void { // Rename or repurpose if needed, e.g., startPerformanceMetricsBroadcasting
    interval(10000).subscribe(() => { // Adjust interval as needed
      const performanceMetrics = this.generatePerformanceMetrics(); // Generate performance data
      if (this.server) {
        // Emit specifically for performance metrics subscribers
        this.server.emit('performance-metrics', performanceMetrics.metrics); // Emit the metrics array
        this.logger.debug('MetricsService', 'Broadcasting performance metrics', { count: performanceMetrics.metrics.length });
      }
    });
  }

  private generateMetric(
    type: string,
    name: string,
    unit: string,
    section = 'metrics'
  ): SystemMetric {
    const isMock = true; // All generated data is mock data
    return {
      id: `${type}-${Date.now()}`,
      name,
      value: this.getRandomValue(type),
      unit,
      timestamp: new Date(),
      source: 'API Server',
      type,
      color: isMock ? '#FF0000' : this.colorMap[type] || '#888888', // Red color for mock data
      section: section,
      sectionColor: this.sectionColors[section] || this.sectionColors.metrics,
      isMock: isMock,
      borderColor: isMock ? '#FF0000' : undefined // Red border for mock data
    };
  }

  private getRandomValue(type: string): number {
    switch (type) {
      case 'cpu':
        return Math.floor(Math.random() * 100);
      case 'memory':
        return Math.floor(Math.random() * 1000) + 500;
      case 'disk':
        return Math.floor(Math.random() * 500) + 100;
      case 'network':
        return Math.floor(Math.random() * 1000);
      case 'requests':
        return Math.floor(Math.random() * 200) + 50;
      case 'latency':
        return Math.floor(Math.random() * 100) + 5;
      default:
        return Math.floor(Math.random() * 100);
    }
  }

  getLegend(): MetricLegendItem[] {
    return this.metricLegend;
  }

  // Add method to get section colors
  getSectionColors(): { [key: string]: string } {
    return this.sectionColors;
  }

  // Generate health metrics with section color
  generateHealthMetrics(): HealthMetricsData {
    // Removed unused serverStatuses variable
    const healthSection = 'health';
    const healthColor = this.sectionColors[healthSection];

    return {
      sectionColor: healthColor,
      servers: [
        {
          name: 'API Server',
          status: 'healthy',
          uptime: '14d 7h',
          load: 42,
          color: healthColor,
        },
        {
          name: 'Worker Node 1',
          status: 'healthy',
          uptime: '7d 12h',
          load: 38,
          color: healthColor,
        },
        {
          name: 'Worker Node 2',
          status: 'warning',
          uptime: '3d 9h',
          load: 78,
          color: healthColor,
        },
      ],
      databases: [
        {
          name: 'Primary DB',
          status: 'healthy',
          connections: 24,
          latency: '5ms',
          color: healthColor,
        },
        {
          name: 'Analytics DB',
          status: 'healthy',
          connections: 7,
          latency: '12ms',
          color: healthColor,
        },
      ],
      services: [
        {
          name: 'Authentication',
          status: 'healthy',
          requests: 1452,
          errorRate: 0.01,
          color: healthColor,
        },
        {
          name: 'Storage',
          status: 'healthy',
          requests: 8723,
          errorRate: 0,
          color: healthColor,
        },
        {
          name: 'Messaging',
          status: 'error',
          requests: 752,
          errorRate: 4.2,
          color: healthColor,
        },
      ],
    };
  }

  // Method to get dashboard metrics with section color
  generateDashboardMetrics(): SectionMetricsData {
    const dashboardSection = 'dashboard';
    const dashboardColor = this.sectionColors[dashboardSection];
    const isMock = true;

    return {
      sectionColor: dashboardColor,
      metrics: [
        this.generateMetric('cpu', 'Dashboard CPU', '%', dashboardSection),
        this.generateMetric(
          'memory',
          'Dashboard Memory',
          'MB',
          dashboardSection
        ),
        this.generateMetric(
          'requests',
          'Dashboard Requests',
          'req/s',
          dashboardSection
        ),
      ].map(metric => ({
        ...metric,
        color: isMock ? '#FF0000' : metric.color,
        borderColor: isMock ? '#FF0000' : undefined,
        isMock: true
      })),
    };
  }

  // Method to get database metrics with section color
  generateDatabaseMetrics(): SectionMetricsData {
    const dbSection = 'database';
    const dbColor = this.sectionColors[dbSection];

    return {
      sectionColor: dbColor,
      metrics: [
        this.generateMetric('connections', 'DB Connections', '', dbSection),
        this.generateMetric('latency', 'Query Latency', 'ms', dbSection),
        this.generateMetric('throughput', 'DB Throughput', 'qps', dbSection),
      ],
    };
  }

  // Method to get GraphQL metrics with section color
  generateGraphQLMetrics(): SectionMetricsData {
    const graphqlSection = 'graphql';
    const graphqlColor = this.sectionColors[graphqlSection];

    return {
      sectionColor: graphqlColor,
      metrics: [
        this.generateMetric(
          'requests',
          'GraphQL Queries',
          'req/s',
          graphqlSection
        ),
        this.generateMetric('latency', 'GraphQL Latency', 'ms', graphqlSection),
        this.generateMetric('errors', 'GraphQL Errors', '', graphqlSection),
      ],
    };
  }

  // Method to get performance metrics with section color
  generatePerformanceMetrics(): SectionMetricsData {
    const perfSection = 'performance';
    const perfColor = this.sectionColors[perfSection];

    return {
      sectionColor: perfColor,
      metrics: [
        this.generateMetric('cpu', 'CPU Load', '%', perfSection),
        this.generateMetric('memory', 'Memory Usage', 'MB', perfSection),
        this.generateMetric('latency', 'Response Time', 'ms', perfSection),
        this.generateMetric(
          'throughput',
          'Request Throughput',
          'rps',
          perfSection
        ),
      ],
    };
  }

  recordMetric(name: string, value = 1): void {
    if (!this.metrics[name]) {
      this.metrics[name] = 0;
    }
    this.metrics[name] += value;
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {};
  }
}
