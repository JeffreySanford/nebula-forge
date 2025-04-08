import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, of, BehaviorSubject, interval } from 'rxjs';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MetricsSocketService {
  private socket: Socket | null = null;
  private useMockMode: boolean;
  
  // Subjects for mock data
  private healthMetricsSubject = new BehaviorSubject<any>([]);
  private extendedMetricsSubject = new BehaviorSubject<any[]>([]);

  constructor(private logger: LoggerService) {
    this.useMockMode = environment.useMockWebSocket;
    
    if (this.useMockMode) {
      this.logger.info('MetricsSocketService', 'Initializing in MOCK mode - no actual Socket.IO connections will be attempted', { mockData: true });
      this.initializeMockData();
    } else {
      try {
        this.socket = io('http://localhost:3000');
        this.logger.info('MetricsSocketService', 'Socket.IO client initialized', { endpoint: 'http://localhost:3000' });
      } catch (error) {
        this.logger.error('MetricsSocketService', 'Failed to initialize Socket.IO client', { error });
        // Fall back to mock mode if connection fails
        this.useMockMode = true;
        this.initializeMockData();
      }
    }
  }

  private initializeMockData(): void {
    // Generate initial mock data
    const mockHealthMetrics = {
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
      ],
      isMock: true
    };
    
    const mockExtendedMetrics = [
      { name: 'CPU Usage', value: 45, timestamp: new Date(), unit: '%', isMock: true },
      { name: 'Memory', value: 2.7, timestamp: new Date(), unit: 'GB', isMock: true },
      { name: 'API Calls', value: 124, timestamp: new Date(), unit: 'req/min', isMock: true }
    ];
    
    this.healthMetricsSubject.next(mockHealthMetrics);
    this.extendedMetricsSubject.next(mockExtendedMetrics);
    
    // Set up intervals for data updates
    interval(10000).subscribe(() => {
      // Update health metrics every 10 seconds
      this.healthMetricsSubject.next({
        ...mockHealthMetrics,
        servers: mockHealthMetrics.servers.map(server => ({
          ...server,
          load: Math.floor(Math.random() * 90) + 10
        })),
        timestamp: new Date(),
        isMock: true
      });
    });
    
    interval(5000).subscribe(() => {
      // Update extended metrics every 5 seconds
      this.extendedMetricsSubject.next([
        { name: 'CPU Usage', value: Math.floor(Math.random() * 90) + 10, timestamp: new Date(), unit: '%', isMock: true },
        { name: 'Memory', value: (Math.random() * 4 + 1).toFixed(1), timestamp: new Date(), unit: 'GB', isMock: true },
        { name: 'API Calls', value: Math.floor(Math.random() * 200) + 50, timestamp: new Date(), unit: 'req/min', isMock: true },
        { name: 'Network', value: (Math.random() * 10).toFixed(1), timestamp: new Date(), unit: 'MB/s', isMock: true }
      ]);
    });
  }

  listenForHealthMetrics(): Observable<any> {
    if (this.useMockMode) {
      return this.healthMetricsSubject.asObservable();
    }
    
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }
      
      this.socket.on('health-metrics-update', (data: any) => {
        observer.next(data);
      });
      
      return () => {
        if (this.socket) {
          this.socket.off('health-metrics-update');
        }
      };
    });
  }

  listenForExtendedMetrics(): Observable<any> {
    if (this.useMockMode) {
      return this.extendedMetricsSubject.asObservable();
    }
    
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not initialized');
        return;
      }
      
      this.socket.on('extended-metrics-update', (data: any) => {
        observer.next(data);
      });
      
      return () => {
        if (this.socket) {
          this.socket.off('extended-metrics-update');
        }
      };
    });
  }
  
  // Add method to explicitly set mock mode (useful for testing)
  setMockMode(useMock: boolean): void {
    if (this.useMockMode === useMock) return;
    
    this.useMockMode = useMock;
    if (useMock) {
      // Clean up socket if it exists
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Initialize mock data
      this.initializeMockData();
      this.logger.info('MetricsSocketService', 'Switched to MOCK mode');
    } else {
      // Attempt to create real connection
      try {
        this.socket = io('http://localhost:3000');
        this.logger.info('MetricsSocketService', 'Switched to REAL connection mode');
      } catch (error) {
        this.logger.error('MetricsSocketService', 'Failed to initialize Socket.IO client after disabling mock mode', { error });
        // Fall back to mock mode
        this.useMockMode = true;
      }
    }
  }
}
