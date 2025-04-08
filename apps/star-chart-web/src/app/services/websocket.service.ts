import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, Subscription, timer, of, interval } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { tap, filter, catchError, delay, map, retryWhen, take, concat } from 'rxjs/operators';
import { LoggerService } from './logger.service';

// Define interface for stats
export interface WebSocketStats {
  open: number;
  closed: number;
  errors: number;
  attempting: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<any> | null = null;
  private mainSubscription: Subscription | null = null;
  private reconnectionAttempt: number = 0;
  private maxReconnectionAttempts: number = environment.webSocket?.reconnectionAttempts || 5;
  private maxReconnectionDelay: number = environment.webSocket?.maxReconnectDelay || 60000;
  private initialReconnectionDelay: number = environment.webSocket?.initialReconnectDelay || 5000;
  private reconnectEnabled: boolean = environment.webSocket?.reconnectEnabled !== false;
  private mockDataSubscription: Subscription | null = null;

  private messagesSubject = new Subject<any>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private connectionState = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private sentMessages: { [key: string]: Date } = {};

  // Stats Tracking
  private openedCount: number = 0;
  private closedCount: number = 0;
  private errorCount: number = 0;
  private webSocketStatsSubject = new BehaviorSubject<WebSocketStats>({ open: 0, closed: 0, errors: 0, attempting: 0 });
  public webSocketStats$ = this.webSocketStatsSubject.asObservable();

  public messages$ = this.messagesSubject.asObservable();
  public connectionStatus$ = this.connectionStatus.asObservable();
  public connectionState$ = this.connectionState.asObservable();

  // Track registered channels for mock mode
  private registeredChannels: Set<string> = new Set();
  private useMockMode: boolean = environment.useMockWebSocket;

  constructor(private logger: LoggerService) {
    this.logger.info('WebSocketService', 'WebSocket service initialized', { 
      mockMode: this.useMockMode ? 'enabled' : 'disabled',
      wsUrl: environment.wsUrl
    });

    if (this.useMockMode) {
      this.logger.info('WebSocketService', 'Starting in MOCK mode - no actual WebSocket connection will be attempted');
      this.initMockMode();
    } else if (environment.webSocket?.autoConnect !== false) {
      this.connect();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    if (this.mockDataSubscription) {
      this.mockDataSubscription.unsubscribe();
    }
  }

  private connect(): void {
    if (this.useMockMode) {
      this.logger.info('WebSocketService', 'Connect called but MOCK mode is active - no connection will be attempted');
      return;
    }

    if (!environment.wsUrl) {
      this.logger.error('WebSocketService', 'WebSocket URL is not defined in environment');
      this.connectionState.next('error');
      return;
    }

    this.unsubscribeMainSubscription();
    
    if (!this.socket$ || this.socket$.closed) {
      this.logger.info('WebSocketService', `Attempting WebSocket connection (Attempt: ${this.reconnectionAttempt + 1})`);
      this.connectionState.next('connecting');
      this.updateStats({ attempting: this.reconnectionAttempt + 1 }); // Update attempting count

      const config: WebSocketSubjectConfig<any> = {
        url: environment.wsUrl,
        openObserver: {
          next: () => {
            this.logger.info('WebSocketService', 'WebSocket connection established successfully');
            this.connectionStatus.next(true);
            this.connectionState.next('connected');
            this.reconnectionAttempt = 0;
            this.openedCount++; // Increment open count
            this.updateStats({ open: this.openedCount, attempting: 0 }); // Update stats
          }
        },
        closeObserver: {
          next: (event) => {
            this.logger.warning('WebSocketService', 'WebSocket connection closed', { code: event.code, reason: event.reason });
            this.connectionStatus.next(false);
            this.connectionState.next('disconnected');
            this.closedCount++; // Increment closed count
            this.updateStats({ closed: this.closedCount }); // Update stats
            
            if (this.reconnectEnabled) {
              this.handleReconnectionAttempt();
            }
          }
        }
      };

      try {
        this.socket$ = webSocket(config);

        this.mainSubscription = this.socket$.pipe(
          catchError(error => {
            this.logger.error('WebSocketService', 'WebSocket error caught in stream', { error });
            this.errorCount++; // Increment error count
            this.updateStats({ errors: this.errorCount }); // Update stats
            this.connectionState.next('error');
            
            if (this.reconnectEnabled) {
              this.handleReconnectionAttempt();
            }
            return of([]); // Use 'of' from rxjs
          }),
          tap({
            complete: () => this.logger.info('WebSocketService', 'WebSocket stream completed normally (tap)')
          })
        ).subscribe({
          next: (message: any) => {
            if (message.requestId && this.sentMessages[message.requestId]) {
              const sentTime = this.sentMessages[message.requestId];
              const responseTime = new Date().getTime() - sentTime.getTime();
              this.logger.info('WebSocketService', `Message response received in ${responseTime}ms`,
                              { requestId: message.requestId });
              delete this.sentMessages[message.requestId];
            }
            this.messagesSubject.next(message);
          },
          error: (error: any) => {
            this.logger.error('WebSocketService', 'WebSocket subscription error (post-connection?)', { error });
            this.errorCount++; // Increment error count here too just in case
            this.updateStats({ errors: this.errorCount }); // Update stats
            this.connectionState.next('error');
          },
          complete: () => {
            this.logger.info('WebSocketService', 'WebSocket main subscription completed.');
            if (this.reconnectEnabled) {
              this.handleReconnectionAttempt();
            }
          }
        });
      } catch (err) {
        this.logger.error('WebSocketService', 'Error creating WebSocket connection', { error: err });
        this.errorCount++;
        this.updateStats({ errors: this.errorCount });
        this.connectionState.next('error');
        
        if (this.reconnectEnabled) {
          this.handleReconnectionAttempt();
        }
      }
    }
  }

  private handleReconnectionAttempt(): void {
    this.connectionStatus.next(false);
    this.unsubscribeMainSubscription();
    this.socket$?.complete();
    this.socket$ = null;

    if (this.useMockMode) {
      this.logger.info('WebSocketService', 'Reconnection skipped - running in MOCK mode');
      return;
    }

    // Check if we've reached the maximum number of reconnection attempts
    if (this.reconnectionAttempt >= this.maxReconnectionAttempts) {
      this.logger.warning('WebSocketService', `Reached maximum reconnection attempts (${this.maxReconnectionAttempts})`);
      
      // After max attempts, try one more time after a longer delay
      this.reconnectionAttempt = 0;
      setTimeout(() => this.connect(), this.maxReconnectionDelay);
      return;
    }

    this.reconnectionAttempt++;
    const delay = Math.min(this.maxReconnectionDelay, this.initialReconnectionDelay * Math.pow(2, this.reconnectionAttempt - 1));
    this.logger.info('WebSocketService', `Scheduling reconnection attempt ${this.reconnectionAttempt} in ${delay / 1000} seconds.`);
    setTimeout(() => this.connect(), delay);
  }

  private unsubscribeMainSubscription(): void {
    if (this.mainSubscription && !this.mainSubscription.closed) {
      this.logger.debug('WebSocketService', 'Unsubscribing from main WebSocket subscription.');
      this.mainSubscription.unsubscribe();
    }
    this.mainSubscription = null;
  }

  // Helper to update stats
  private updateStats(changes: Partial<WebSocketStats>): void {
    const currentStats = this.webSocketStatsSubject.getValue();
    this.webSocketStatsSubject.next({ ...currentStats, ...changes });
  }

  public sendMessage(message: any): void {
    if (message.options && message.options.requestId) {
      this.sentMessages[message.options.requestId] = new Date();
    }

    if (this.useMockMode) {
      this.handleMockMessage(message);
      return;
    }

    if (this.socket$ && !this.socket$.closed) {
      this.logger.debug('WebSocketService', 'Sending WebSocket message', { message });
      this.socket$.next(message);
    } else {
      this.logger.warning('WebSocketService', 'WebSocket not connected. Message dropped. Reconnection attempt should be in progress.');
      
      // Try to reconnect if not already attempting
      if (this.reconnectEnabled && this.connectionState.getValue() !== 'connecting') {
        this.connect();
      }
    }
  }

  public subscribe<T>(channel: string): Observable<T> {
    // Register this channel for mock mode
    this.registeredChannels.add(channel);
    
    if (this.useMockMode) {
      return this.createMockObservable<T>(channel);
    }

    this.sendMessage({ action: 'subscribe', channel });

    return this.messages$.pipe(
      filter((message: any) => {
        // Handle different message formats
        if (message && message.channel === channel) {
          return true;
        }
        
        // Some backends emit on the channel name directly
        if (channel in message) {
          return true;
        }
        
        // Special case for performance metrics
        if (channel === 'performance-metrics' && Array.isArray(message)) {
          return true;
        }
        
        return false;
      }),
      map((message: any) => {
        // Handle different response formats
        if (message && message.channel === channel && message.data) {
          return message.data as T;
        }
        
        // Handle direct channel data
        if (channel in message) {
          return message[channel] as T;
        }
        
        // Special case for arrays (performance metrics)
        if (Array.isArray(message) && channel === 'performance-metrics') {
          return message as unknown as T;
        }
        
        return message as T;
      })
    );
  }

  public disconnect(): void {
    this.logger.info('WebSocketService', 'Manual disconnect called.');
    this.reconnectionAttempt = -1; // Prevent automatic reconnection
    this.unsubscribeMainSubscription();
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    this.connectionStatus.next(false);
    this.connectionState.next('disconnected');
    this.updateStats({ attempting: 0 }); // Reset attempting count on manual disconnect
  }

  ensureConnection(): boolean {
    if (this.useMockMode) {
      return true; // In mock mode, connection is always "ensured"
    }
    
    if (!this.socket$ || this.socket$.closed) {
      return false;
    }
    return this.connectionStatus.getValue();
  }

  onReconnected(callback: () => void): void {
    this.connectionStatus$.pipe(
      filter(connected => connected),
      tap(() => callback())
    ).subscribe();
  }

  // Force a reconnection attempt - useful for testing or manual recovery
  forceReconnect(): void {
    this.logger.info('WebSocketService', 'Manual reconnection attempt triggered');
    if (this.useMockMode) {
      this.logger.info('WebSocketService', 'In mock mode - no reconnection needed');
      return;
    }
    
    // Reset reconnection count to start fresh
    this.reconnectionAttempt = 0;
    this.disconnect();
    this.connect();
  }

  // Set mock mode at runtime
  setMockMode(useMock: boolean): void {
    if (this.useMockMode === useMock) return;
    
    this.useMockMode = useMock;
    this.logger.info('WebSocketService', `Mock mode ${useMock ? 'enabled' : 'disabled'}`);
    
    if (useMock) {
      // Switch to mock mode
      this.disconnect();
      this.initMockMode();
    } else {
      // Switch to real connection mode
      if (this.mockDataSubscription) {
        this.mockDataSubscription.unsubscribe();
        this.mockDataSubscription = null;
      }
      this.connect();
    }
  }

  // --- Mock Mode Implementation ---

  private initMockMode(): void {
    // Set mock connection status to true
    this.connectionStatus.next(true);
    this.connectionState.next('connected');
    this.openedCount = 1;
    this.updateStats({ open: 1, attempting: 0 });
    
    // Set up interval for mock data generation
    this.mockDataSubscription = interval(5000).subscribe(() => {
      this.generateMockDataForRegisteredChannels();
    });
    
    this.logger.info('WebSocketService', 'Mock mode initialized - mock data generation started');
  }

  private generateMockDataForRegisteredChannels(): void {
    this.registeredChannels.forEach(channel => {
      const mockData = this.generateMockDataForChannel(channel);
      if (mockData) {
        this.messagesSubject.next(mockData);
      }
    });
  }

  private generateMockDataForChannel(channel: string): any {
    // Add isMock: true flag to all generated data to clearly mark it
    const mockFlag = { isMock: true };
    
    switch(channel) {
      case 'performance-metrics':
        return [
          {
            id: `cpu-${Date.now()}`,
            name: 'CPU Usage',
            value: Math.floor(Math.random() * 100),
            unit: '%',
            timestamp: new Date(),
            source: 'Mock Server',
            type: 'cpu',
            color: '#FF5722',
            ...mockFlag
          },
          {
            id: `memory-${Date.now()}`,
            name: 'Memory Usage',
            value: Math.floor(Math.random() * 16000),
            unit: 'MB',
            timestamp: new Date(),
            source: 'Mock Server',
            type: 'memory',
            color: '#2196F3',
            ...mockFlag
          },
          {
            id: `latency-${Date.now()}`,
            name: 'Response Time',
            value: Math.floor(Math.random() * 200),
            unit: 'ms',
            timestamp: new Date(),
            source: 'Mock Server',
            type: 'latency',
            color: '#795548',
            ...mockFlag
          },
          {
            id: `throughput-${Date.now()}`,
            name: 'Request Throughput',
            value: Math.floor(Math.random() * 150),
            unit: 'rps',
            timestamp: new Date(),
            source: 'Mock Server',
            type: 'throughput',
            color: '#009688',
            ...mockFlag
          }
        ];
        
      case 'health-metrics':
        return {
          ...mockFlag,
          servers: [
            { name: 'API Server', status: 'healthy', uptime: '14d 7h', load: Math.floor(Math.random() * 100) },
            { name: 'Worker Node 1', status: 'healthy', uptime: '7d 12h', load: Math.floor(Math.random() * 100) },
            { name: 'Worker Node 2', status: Math.random() > 0.7 ? 'warning' : 'healthy', uptime: '3d 9h', load: Math.floor(Math.random() * 100) }
          ],
          databases: [
            { name: 'Primary DB', status: 'healthy', connections: Math.floor(Math.random() * 50), latency: `${Math.floor(Math.random() * 20)}ms` },
            { name: 'Analytics DB', status: 'healthy', connections: Math.floor(Math.random() * 20), latency: `${Math.floor(Math.random() * 30)}ms` }
          ],
          services: [
            { name: 'Authentication', status: 'healthy', requests: Math.floor(Math.random() * 2000), errorRate: Math.random() * 0.1 },
            { name: 'Storage', status: 'healthy', requests: Math.floor(Math.random() * 10000), errorRate: 0 },
            { name: 'Messaging', status: Math.random() > 0.8 ? 'error' : 'healthy', requests: Math.floor(Math.random() * 1000), errorRate: Math.random() * 5 }
          ]
        };
        
      case 'system-metrics':
        return {
          ...mockFlag,
          data: [
            {
              name: 'CPU',
              value: Math.floor(Math.random() * 100),
              timestamp: new Date(),
              unit: '%',
              source: 'Mock System',
              type: 'resource',
              color: '#FF5722' 
            },
            {
              name: 'Memory',
              value: Math.floor(Math.random() * 32000),
              timestamp: new Date(),
              unit: 'MB',
              source: 'Mock System',
              type: 'resource',
              color: '#2196F3'
            }
          ]
        };
        
      case 'system-status':
        return {
          ...mockFlag, // Ensure mock flag is included
          cpu: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 100),
          disk: Math.floor(Math.random() * 100),
          network: Math.floor(Math.random() * 100),
          uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
          activeConnections: Math.floor(Math.random() * 500)
        };
        
      case 'frontend-metrics':
        return {
          ...mockFlag,
          loadTime: `${(Math.random() * 2).toFixed(1)}s`,
          renderTime: `${(Math.random() * 1).toFixed(1)}s`,
          interactions: Math.floor(Math.random() * 10000),
          errors: Math.floor(Math.random() * 50),
          activeUsers: Math.floor(Math.random() * 500),
          browserShare: {
            chrome: Math.floor(Math.random() * 70) + 30,
            firefox: Math.floor(Math.random() * 20),
            safari: Math.floor(Math.random() * 15),
            edge: Math.floor(Math.random() * 10)
          }
        };
        
      case 'metrics':
        return [
          {
            id: `api-${Date.now()}`,
            name: 'API Calls',
            value: Math.floor(Math.random() * 1000),
            unit: 'calls/min',
            timestamp: new Date(),
            source: 'Mock API',
            type: 'api',
            ...mockFlag
          },
          {
            id: `err-${Date.now()}`,
            name: 'Error Rate',
            value: Math.random() * 5,
            unit: '%',
            timestamp: new Date(),
            source: 'Mock Error Tracking',
            type: 'errors',
            ...mockFlag
          }
        ];
        
      case 'database':
        return {
          ...mockFlag,
          connections: Math.floor(Math.random() * 100),
          activeQueries: Math.floor(Math.random() * 50),
          queryHistory: [
            {
              type: 'query',
              message: `SELECT * FROM users LIMIT ${Math.floor(Math.random() * 20)}`,
              timestamp: new Date(),
              operation: 'SELECT',
              collection: 'users'
            },
            {
              type: Math.random() > 0.8 ? 'error' : 'query',
              message: Math.random() > 0.8 ? 'Failed to connect to database' : 'INSERT INTO logs',
              timestamp: new Date(Date.now() - 60000),
              operation: Math.random() > 0.8 ? 'ERROR' : 'INSERT',
              collection: Math.random() > 0.8 ? null : 'logs'
            }
          ]
        };
        
      case 'graphql':
        return {
          ...mockFlag,
          queries: [
            {
              name: 'GetUserProfile',
              status: 'success',
              timestamp: new Date(),
              duration: Math.floor(Math.random() * 100)
            },
            {
              name: 'UpdateUserPreferences',
              status: Math.random() > 0.8 ? 'error' : 'success',
              timestamp: new Date(Date.now() - 120000),
              duration: Math.floor(Math.random() * 200) + 100
            }
          ],
          performance: {
            averageResponseTime: Math.floor(Math.random() * 100) + 20,
            maxResponseTime: Math.floor(Math.random() * 500) + 100,
            requestsPerMinute: Math.floor(Math.random() * 60)
          }
        };
        
      case 'metric-legend':
        return [
          { name: 'CPU Usage', color: '#FF5722', description: 'Processor utilization', ...mockFlag },
          { name: 'Memory', color: '#2196F3', description: 'RAM usage', ...mockFlag },
          { name: 'Disk IO', color: '#4CAF50', description: 'Disk read/write operations', ...mockFlag },
          { name: 'Network', color: '#9C27B0', description: 'Network traffic', ...mockFlag },
          { name: 'Requests', color: '#FFC107', description: 'HTTP/API requests', ...mockFlag },
          { name: 'Latency', color: '#795548', description: 'Response time', ...mockFlag },
          { name: 'Errors', color: '#F44336', description: 'Error count', ...mockFlag },
          { name: 'Throughput', color: '#009688', description: 'Requests per second', ...mockFlag },
          { name: 'Connections', color: '#3F51B5', description: 'Active connections', ...mockFlag }
        ];
        
      case 'logs':
        // Generate a random log entry
        const logTypes = ['info', 'warning', 'error', 'debug'];
        const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const sources = ['API:SystemMonitor', 'API:Database', 'API:Authentication', 'API:WebServer'];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const messages = [
          'Request processed successfully',
          'Database query completed',
          'Authentication attempt',
          'File not found',
          'Permission denied',
          'User session expired',
          'Configuration loaded'
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        return {
          timestamp: new Date(),
          level: logType,
          source,
          message,
          data: { mockData: true },
          ...mockFlag
        };
        
      default:
        this.logger.debug('WebSocketService', `No mock data generator for channel: ${channel}`);
        return null;
    }
  }

  private handleMockMessage(message: any): void {
    this.logger.info('WebSocketService', `Mock mode: Processing message ${JSON.stringify(message)}`);
    
    // Handle subscription requests and registrations
    if (message.action === 'subscribe') {
      this.registeredChannels.add(message.channel);
      // Generate initial mock data for this channel with delay
      setTimeout(() => {
        const mockData = this.generateMockDataForChannel(message.channel);
        if (mockData) {
          this.messagesSubject.next(mockData);
        }
      }, 500);
    }
    
    // Handle registration requests
    if (message.action === 'register') {
      this.registeredChannels.add(message.stream);
      // Generate immediate acknowledgment
      if (message.options && message.options.requestId) {
        setTimeout(() => {
          this.messagesSubject.next({
            success: true,
            stream: message.stream,
            requestId: message.options.requestId,
            message: `Successfully registered for ${message.stream} stream (MOCK MODE)`
          });
        }, 100);
        
        // Generate initial mock data for this stream
        setTimeout(() => {
          const mockData = this.generateMockDataForChannel(message.stream);
          if (mockData) {
            this.messagesSubject.next(mockData);
          }
        }, 500);
      }
    }
    
    // Handle ping action for WebSocket test
    if (message.action === 'ping') {
      setTimeout(() => {
        this.messagesSubject.next({
          action: 'pong',
          timestamp: new Date().toISOString(),
          requestId: message.options?.requestId,
          message: 'WebSocket connection is working (MOCK MODE)'
        });
      }, 100);
    }
    
    // Handle slow response simulation
    if (message.action === 'simulate-slow-response') {
      const delayMs = message.options?.delayMs || 3000;
      
      setTimeout(() => {
        this.messagesSubject.next({
          action: 'slow-response-result',
          requestId: message.options?.requestId,
          message: `Slow response completed after ${delayMs}ms (MOCK MODE)`,
          timestamp: new Date().toISOString()
        });
      }, delayMs);
    }
  }

  private createMockObservable<T>(channel: string): Observable<T> {
    return this.messages$.pipe(
      filter((message: any) => {
        return message.channel === channel || 
               (message.stream === channel) ||
               (message.data && Array.isArray(message.data));
      }),
      map(message => {
        // If the message has channel and data structure, return just the data with mock flag
        if (message.channel === channel && message.data) {
          // Add mock flag to data if it's an object or array
          if (Array.isArray(message.data)) {
            return message.data.map((item: any) => ({ ...item, isMock: true })) as unknown as T;
          } else if (typeof message.data === 'object' && message.data !== null) {
            return { ...message.data, isMock: true } as unknown as T;
          }
          return message.data as T;
        }
        // Otherwise return the whole message with mock flag
        if (typeof message === 'object' && message !== null) {
          return { ...message, isMock: true } as unknown as T;
        }
        return message as T;
      })
    );
  }
}
