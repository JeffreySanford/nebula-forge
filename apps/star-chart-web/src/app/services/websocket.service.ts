import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, BehaviorSubject, Subscription, timer, of } from 'rxjs';
import { catchError, tap, delay, retryWhen, switchMap, takeUntil, map, filter } from 'rxjs/operators'; // Add missing operators
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

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
  private connectionTimeout: number = environment.webSocket?.connectionTimeout || 10000; // 10 seconds timeout
  private wsUrl: string = environment.wsUrl;
  
  // Connection management
  private connectionState = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  // Make connectionStatus public so it can be accessed from dashboard
  public connectionStatus = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatus.asObservable(); // Add public observable
  private reconnectSubject = new Subject<void>();
  private reconnectionCallbacks: (() => void)[] = [];
  
  // Stats tracking
  private webSocketStatsSubject = new BehaviorSubject<WebSocketStats>({
    open: 0,
    closed: 0,
    errors: 0,
    attempting: 0
  });
  public webSocketStats$ = this.webSocketStatsSubject.asObservable();
  
  // Message handling
  private messagesSubject = new BehaviorSubject<any>({});
  public messages$ = this.messagesSubject.asObservable();
  
  // Track registered channels for mock mode
  private registeredChannels = new Set<string>();
  
  // Track mock mode status
  private mockModeSubject = new BehaviorSubject<boolean>(false);
  public mockMode$ = this.mockModeSubject.asObservable();
  
  // Add subject to track registration acknowledgements
  private registrationAcks = new BehaviorSubject<Map<string, boolean>>(new Map());
  public registrationAcks$ = this.registrationAcks.asObservable();
  
  // Track connection attempts
  private connectionAttemptTimeout: any;
  private forceDisconnected = false;

  constructor(private logger: LoggerService) {
    // Check for stored mock mode preference
    const storedMockMode = localStorage.getItem('useMockWebSocket');
    const useMock = storedMockMode !== null ? storedMockMode === 'true' : environment.useMockWebSocket;
    
    this.logger.info('WebSocketService', 'WebSocket service initialized', {
      mockMode: useMock ? 'enabled' : 'disabled',
      wsUrl: this.wsUrl
    });

    // Start in mock mode initially for better user experience
    this.mockModeSubject.next(true);
    this.initializeMockMode();

    // Then try to establish a real connection
    if (!useMock) {
      // Add short delay before attempting connection
      setTimeout(() => {
        this.logger.info('WebSocketService', 'Attempting real WebSocket connection');
        this.mockModeSubject.next(false);
        this.connect();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
    }
    
    if (this.mainSubscription) {
      this.mainSubscription.unsubscribe();
    }
    
    this.disconnect();
    this.reconnectSubject.complete();
  }

  private connect(): void {
    if (this.socket$ || this.forceDisconnected) {
      return;
    }

    // Don't attempt connection if in mock mode
    if (this.mockModeSubject.getValue()) {
      this.logger.info('WebSocketService', 'Not connecting: in mock mode');
      return;
    }

    this.connectionState.next('connecting');
    this.updateStats({ attempting: 1 });
    this.logger.info('WebSocketService', 'Attempting WebSocket connection', { url: this.wsUrl });

    try {
      this.socket$ = webSocket({
        url: this.wsUrl,
        openObserver: {
          next: () => {
            this.connectionState.next('connected');
            this.connectionStatus.next(true);
            this.reconnectionAttempt = 0;
            this.updateStats({ open: 1, attempting: -1 });
            this.logger.info('WebSocketService', 'WebSocket connection established');
            
            // Switch from mock to real mode if necessary
            if (this.mockModeSubject.getValue()) {
              this.logger.info('WebSocketService', 'Switching from mock to real data');
              this.mockModeSubject.next(false);
            }
          }
        },
        closeObserver: {
          next: (event) => {
            this.connectionState.next('disconnected');
            this.connectionStatus.next(false);
            this.updateStats({ closed: 1, open: -1 });
            this.socket$ = null;
            
            if (!this.forceDisconnected) {
              this.handleReconnect();
            }
            
            this.logger.info('WebSocketService', 'WebSocket connection closed', {
              code: event.code,
              reason: event.reason || 'No reason provided'
            });
            
            // Switch to mock mode if real connection is lost
            if (!this.mockModeSubject.getValue()) {
              this.logger.info('WebSocketService', 'Connection lost, switching to mock mode');
              this.initializeMockMode();
            }
          }
        }
      });

      // Subscribe to incoming messages
      this.mainSubscription = this.socket$.pipe(
        catchError(error => {
          this.updateStats({ errors: 1 });
          this.logger.error('WebSocketService', 'WebSocket error', { error });
          
          // Trigger reconnect
          this.connectionState.next('disconnected');
          this.connectionStatus.next(false);
          this.socket$ = null;
          this.handleReconnect();
          
          // Return empty observable to prevent error propagation
          return of();
        })
      ).subscribe(
        message => this.handleIncomingMessage(message),
        error => this.logger.error('WebSocketService', 'WebSocket subscription error', { error })
      );
    } catch (error) {
      this.updateStats({ errors: 1, attempting: -1 });
      this.logger.error('WebSocketService', 'WebSocket connection attempt failed', { error });
      
      // Ensure we're in mock mode if connection fails
      if (!this.mockModeSubject.getValue()) {
        this.initializeMockMode();
      }
      
      // Still try to reconnect
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.forceDisconnected || this.mockModeSubject.getValue()) {
      return;
    }
    
    this.reconnectionAttempt++;
    
    // No max reconnection attempts - keep trying indefinitely
    // We'll use an increasing delay between attempts to avoid hammering the server
    const delay = Math.min(1000 * Math.pow(1.5, Math.min(this.reconnectionAttempt - 1, 10)), 30000);
    
    this.logger.info('WebSocketService', `Reconnecting in ${delay}ms (attempt ${this.reconnectionAttempt})`, {
      wsUrl: this.wsUrl
    });
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  private initializeMockMode(): void {
    // Clean up any existing connection
    this.disconnect();
    
    // Set mock mode flag
    this.mockModeSubject.next(true);
    this.logger.info('WebSocketService', 'Starting in MOCK mode - no actual WebSocket connection will be attempted');
    
    // Initialize mock data generation
    this.connectionStatus.next(true);
    this.connectionState.next('connected');
    
    this.logger.info('WebSocketService', 'Mock mode initialized - mock data generation started');
  }

  // Helper to update stats
  private updateStats(changes: Partial<WebSocketStats>): void {
    const current = this.webSocketStatsSubject.getValue();
    const updated = { ...current };
    
    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const currentValue = updated[key as keyof WebSocketStats] as number;
        updated[key as keyof WebSocketStats] = Math.max(0, currentValue + value) as never;
      }
    });
    
    this.webSocketStatsSubject.next(updated);
  }
  
  private handleIncomingMessage(message: any): void {
    // Log all incoming messages for debugging
    this.logger.debug('WebSocketService', 'Received message', { 
      type: message.type || message.action, 
      stream: message.stream,
      isMock: message.isMock
    });
    
    // Process registration acknowledgments - check for both formats
    if (message.type === 'registration-ack' || message.action === 'registration-ack') {
      this.logger.info('WebSocketService', `Received registration acknowledgement for ${message.stream}`, {
        success: message.success,
        stream: message.stream,
        requestId: message.requestId
      });
      
      this.handleRegistrationAck(message);
    }
    
    // Forward all messages to subscribers
    this.messagesSubject.next(message);
  }
  
  private handleMockMessage(message: any): void {
    this.logger.info('WebSocketService', `Mock mode: Processing message ${JSON.stringify(message)}`);
    
    // Handle subscription requests and registrations
    if (message.action === 'subscribe') {
      // Immediate response for subscriptions...
    }
    
    // Handle registration requests
    if (message.action === 'register') {
      const stream = message.stream;
      this.registeredChannels.add(stream);
      
      // Send registration acknowledgment
      const ackResponse = {
        action: 'registration-ack',
        success: true,
        stream: stream,
        requestId: message.options?.requestId || `auto-${Date.now()}`,
        message: `Successfully registered for ${stream} stream`,
        timestamp: new Date().toISOString()
      };
      
      // Important: emit the acknowledgment to registrationAcks subject
      const currentAcks = this.registrationAcks.getValue();
      currentAcks.set(stream, true);
      this.registrationAcks.next(new Map(currentAcks));
      
      // Emit the acknowledgment through messages subject
      this.messagesSubject.next({
        type: 'registration-ack',
        ...ackResponse
      });
      
      // Generate initial mock data for this stream
      setTimeout(() => this.generateMockDataForChannel(stream), 100);
      
      // Schedule periodic updates for this stream
      this.setupStreamInterval(stream);
      
      this.logger.info('WebSocketService', `Mock mode: Registration acknowledged for ${stream}`);
    }
  }
  
  // Add method to setup periodic updates for registered streams
  private setupStreamInterval(stream: string): void {
    // Setup different intervals based on stream type
    const intervals: { [key: string]: number } = {
      'health-metrics': 10000,
      'performance-metrics': 5000,
      'section-colors': 30000,
      'metric-legend': 30000,
      'metrics': 3000,
      'database': 7000,
      'graphql': 8000
    };
    
    const interval = intervals[stream] || 5000;
    
    // Setup periodic updates
    setInterval(() => {
      this.generateMockDataForChannel(stream);
    }, interval);
  }

  private generateMockDataForChannel(channel: string): any {
    // Add isMock: true flag to all generated data to clearly mark it
    const mockFlag = { isMock: true };
    
    switch(channel) {
      case 'section-colors':
        const sectionColors = {
          dashboard: '#3F51B5', // Indigo
          health: '#00BCD4',    // Cyan
          metrics: '#4CAF50',   // Green
          performance: '#FF5722', // Deep Orange
          database: '#9C27B0',  // Purple
          graphql: '#FF9800'    // Orange
        };
        this.messagesSubject.next({...sectionColors, ...mockFlag});
        return sectionColors;
        
      case 'metric-legend':
        const legendItems = [
          { name: 'CPU Usage', color: '#FF5722', description: 'Processor utilization' },
          { name: 'Memory', color: '#2196F3', description: 'RAM usage' },
          { name: 'Disk IO', color: '#4CAF50', description: 'Disk read/write operations' },
          { name: 'Network', color: '#9C27B0', description: 'Network traffic' },
          { name: 'Requests', color: '#FFC107', description: 'HTTP/API requests' },
          { name: 'Latency', color: '#795548', description: 'Response time' }
        ];
        this.messagesSubject.next({...mockFlag, data: legendItems});
        return legendItems;
        
      case 'health-metrics':
        const healthMetrics = {
          sectionColor: '#00BCD4',
          servers: [
            { name: 'API Server', status: 'healthy', uptime: '14d 7h', load: 42, color: '#00BCD4' },
            { name: 'Worker Node 1', status: 'healthy', uptime: '7d 12h', load: 38, color: '#00BCD4' },
            { name: 'Worker Node 2', status: 'warning', uptime: '3d 9h', load: 78, color: '#00BCD4' }
          ],
          databases: [
            { name: 'Primary DB', status: 'healthy', connections: 24, latency: '5ms', color: '#00BCD4' },
            { name: 'Analytics DB', status: 'healthy', connections: 7, latency: '12ms', color: '#00BCD4' }
          ],
          services: [
            { name: 'Authentication', status: 'healthy', requests: 1452, errorRate: 0.01, color: '#00BCD4' },
            { name: 'Storage', status: 'healthy', requests: 8723, errorRate: 0, color: '#00BCD4' },
            { name: 'Messaging', status: 'error', requests: 752, errorRate: 4.2, color: '#00BCD4' }
          ],
          isMock: true
        };
        this.messagesSubject.next(healthMetrics);
        return healthMetrics;
        
      case 'performance-metrics':
        const perfMetrics = [
          { name: 'CPU Usage', value: Math.floor(Math.random() * 90) + 10, timestamp: new Date(), unit: '%', isMock: true },
          { name: 'Memory', value: (Math.random() * 4 + 1).toFixed(1), timestamp: new Date(), unit: 'GB', isMock: true },
          { name: 'API Calls', value: Math.floor(Math.random() * 200) + 50, timestamp: new Date(), unit: 'req/min', isMock: true },
          { name: 'Network', value: (Math.random() * 10).toFixed(1), timestamp: new Date(), unit: 'MB/s', isMock: true }
        ];
        this.messagesSubject.next({metrics: perfMetrics, isMock: true});
        return perfMetrics;
      
      case 'database':
        const dbMetrics = {
          metrics: [
            { name: 'Query Throughput', value: 142 + Math.floor(Math.random() * 30), unit: 'queries/sec', type: 'throughput', isMock: true },
            { name: 'Read Latency', value: 5.2 + Math.random() * 2, unit: 'ms', type: 'latency', isMock: true },
            { name: 'Write Latency', value: 8.7 + Math.random() * 3, unit: 'ms', type: 'latency', isMock: true },
            { name: 'Connections', value: 24 + Math.floor(Math.random() * 10), unit: 'conns', type: 'connections', isMock: true }
          ],
          queries: [
            {
              id: Date.now().toString(),
              statement: 'SELECT * FROM users WHERE active = true LIMIT 10',
              type: 'SELECT',
              collection: 'users',
              duration: Math.floor(Math.random() * 100) + 10,
              timestamp: new Date(),
              status: Math.random() > 0.9 ? 'error' : 'completed',
              affectedRows: Math.floor(Math.random() * 50),
              isMock: true
            }
          ],
          stats: {
            connections: 24 + Math.floor(Math.random() * 10),
            activeQueries: 5 + Math.floor(Math.random() * 10),
            avgQueryTime: 45 + Math.floor(Math.random() * 20),
            size: '2.4GB',
            collections: 12,
            uptime: '14d 7h',
            isMock: true
          },
          isMock: true
        };
        this.messagesSubject.next(dbMetrics);
        return dbMetrics;
        
      case 'graphql':
        const graphqlData = {
          queries: [
            {
              name: 'GetUserProfile',
              status: 'success',
              timestamp: new Date(),
              duration: Math.floor(Math.random() * 100) + 20,
              isMock: true
            },
            {
              name: 'UpdateUserPreferences',
              status: Math.random() > 0.8 ? 'error' : 'success',
              timestamp: new Date(Date.now() - 120000),
              duration: Math.floor(Math.random() * 200) + 100,
              isMock: true
            }
          ],
          stats: {
            totalQueries: 1265 + Math.floor(Math.random() * 50),
            avgResponseTime: 67 + Math.floor(Math.random() * 20),
            errorRate: 2.3 + (Math.random() * 1),
            cacheHitRate: 78.5 + (Math.random() * 5),
            isMock: true
          },
          isMock: true
        };
        this.messagesSubject.next(graphqlData);
        return graphqlData;
        
      case 'metrics':
        // Add missing mock data generator for the metrics channel
        const metricsData = [
          this.generateMetric('cpu', 'CPU Usage', '%', 35, 100),
          this.generateMetric('memory', 'Memory Usage', 'MB', 4200, 16384),
          this.generateMetric('disk', 'Disk IO', 'IOPS', 120, 500),
          this.generateMetric('network', 'Network Traffic', 'Mbps', 75, 1000),
          this.generateMetric('requests', 'Request Count', 'req/s', 250, 1000),
          this.generateMetric('latency', 'API Latency', 'ms', 12, 500)
        ];
        this.messagesSubject.next({ type: 'metrics', data: metricsData, ...mockFlag });
        this.logger.info('WebSocketService', 'Generated mock metrics data', { count: metricsData.length });
        return metricsData;
        
      default:
        this.logger.warning('WebSocketService', `No mock data generator for channel: ${channel}`);
        return null;
    }
  }

  // Helper method to generate metric objects with random values
  private generateMetric(
    type: string,
    name: string,
    unit: string, 
    baseValue: number = 50,
    maxValue: number = 100
  ): any {
    const randomFactor = 0.2; // 20% random variation
    const randomValue = baseValue + (Math.random() * randomFactor * 2 - randomFactor) * baseValue;
    const value = Math.min(Math.max(Math.round(randomValue * 10) / 10, 0), maxValue);
    
    return {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      value,
      unit,
      timestamp: new Date(),
      source: 'Mock Data Service',
      type,
      color: this.getMetricColor(type),
      isMock: true
    };
  }

  // Helper to get color for different metric types
  private getMetricColor(type: string): string {
    const colorMap: Record<string, string> = {
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
    
    return colorMap[type] || '#757575';
  }

  // Method to handle registration acknowledgements
  private handleRegistrationAck(message: any): void {
    if (message.stream) {
      const stream = message.stream;
      const success = message.success === true;
      
      // Update the registration status
      const currentAcks = this.registrationAcks.getValue();
      currentAcks.set(stream, success);
      this.registrationAcks.next(new Map(currentAcks));
      
      // Log the registration status
      this.logger.info('WebSocketService', `Registration status updated for ${stream}`, { 
        success,
        registered: Array.from(currentAcks.entries())
          .filter(([_, isRegistered]) => isRegistered)
          .map(([streamName]) => streamName)
      });
    }
  }

  public sendMessage(message: any): void {
    if (this.mockModeSubject.getValue()) {
      this.processMockMessage(message);
      return;
    }
    
    if (!this.socket$ || this.socket$.closed) {
      this.logger.warning('WebSocketService', 'Cannot send message, socket is not open', { message });
      return;
    } else {
      this.socket$?.next(JSON.stringify(message));
    }

    try {
      // Don't modify the original message - send it as-is
      this.socket$.next(JSON.stringify(message));
      this.logger.debug('WebSocketService', 'Message sent', { 
        type: message.type || message.action,
        stream: message.stream
      });
    } catch (error) {
      this.logger.error('WebSocketService', 'Error sending message', { error, message });
    }
  }

  public subscribe<T>(channel: string): Observable<T> {
    if (!channel) {
      this.logger.error('WebSocketService', 'Attempted to subscribe to empty channel');
      return of() as Observable<T>;
    }
    
    return this.messages$.pipe(
      map((message: any) => {
        // For direct messages with type field or messages with just data
        if (message.type === channel || message.action === channel) {
          delete message.type;
          delete message.action;
          return message;
        }
        
        // For messages with a specific channel field
        if (message.channel === channel) {
          return message.data;
        }
        
        // If the message is the channel data itself (e.g., health-metrics object)
        if (channel === 'health-metrics' && message.servers) {
          return message;
        }
        
        // If the message is for a specific stream
        if (message.stream === channel) {
          return message.data || message;
        }
        
        // For section colors which are direct key-values
        if (channel === 'section-colors' && 
            (message.dashboard || message.health || message.metrics)) {
          return message;
        }
        
        // Special case for metric-legend
        if (channel === 'metric-legend' && 
            ((Array.isArray(message.data) && message.data[0]?.name && message.data[0]?.color) ||
             message === 'metric-legend')) {
          return message;
        }
        
        return null;
      }),
      // Only emit when we have data for this channel
      filter((data: any) => data !== null)
    ) as Observable<T>;
  }

  public disconnect(): void {
    this.forceDisconnected = true;
    
    if (this.mainSubscription) {
      this.mainSubscription.unsubscribe();
      this.mainSubscription = null;
    }
    
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    
    this.connectionState.next('disconnected');
    this.connectionStatus.next(false);
    
    this.logger.info('WebSocketService', 'WebSocket disconnected by client request');
  }

  ensureConnection(): boolean {
    if (this.mockModeSubject.getValue()) {
      // In mock mode, we're always "connected"
      return true;
    }
    
    if (!this.socket$ && !this.forceDisconnected) {
      this.connect();
    }
    
    return this.connectionStatus.getValue();
  }

  onReconnected(callback: () => void): void {
    this.reconnectionCallbacks.push(callback);
    
    // If already connected, execute immediately
    if (this.connectionStatus.getValue()) {
      callback();
    }
  }

  // Force a reconnection attempt - useful for testing or manual recovery
  forceReconnect(): void {
    this.logger.info('WebSocketService', 'Manual reconnection requested');
    
    // Reset the force disconnect flag
    this.forceDisconnected = false;
    
    if (this.mockModeSubject.getValue()) {
      this.logger.warning('WebSocketService', 'Cannot force reconnect in mock mode');
      return;
    }
    
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    
    // Reset connection stats and attempt to reconnect
    this.reconnectionAttempt = 0;
    this.connect();
  }

  // Check if currently in mock mode
  isMockMode(): boolean {
    return this.mockModeSubject.getValue();
  }
  
  // Get observable for mock mode changes
  getMockModeChanges(): Observable<boolean> {
    return this.mockMode$;
  }
  
  // Set mock mode at runtime
  setMockMode(useMock: boolean): void {
    const currentMode = this.mockModeSubject.getValue();
    
    if (currentMode === useMock) {
      return;
    }
    
    this.logger.info('WebSocketService', `Switching to ${useMock ? 'mock' : 'live'} data mode`);
    
    if (useMock) {
      // Switching to mock mode
      this.disconnect();
      this.initializeMockMode();
    } else {
      // Switching to live mode
      this.mockModeSubject.next(false);
      this.forceDisconnected = false;
      this.reconnectionAttempt = 0;
      
      // Clear mock registrations
      this.registeredChannels.clear();
      this.registrationAcks.next(new Map());
      
      // Connect to real server
      this.connect();
    }
    
    // Store the preference
    localStorage.setItem('useMockWebSocket', String(useMock));
  }

  // Method to register for a specific stream
  public registerForStream(stream: string, options: any = {}): string {
    const requestId = options.requestId || `${stream}-reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Format message appropriately for both modes
    if (this.mockModeSubject.getValue()) {
      this.sendMessage({
        action: 'register',
        stream: stream,
        options: {
          ...options,
          requestId: requestId
        }
      });
    } else {
      // Send complete registration message with all fields
      const registrationMessage = {
        action: 'register',
        type: 'register',
        stream: stream,
        options: {
          ...options,
          requestId: requestId
        }
      };
      
      this.sendMessage(registrationMessage);
      this.logger.debug('WebSocketService', 'Registration request sent for ' + stream, { requestId });
    }
    
    return requestId;
  }

  // Method to check if a stream is successfully registered
  public isStreamRegistered(stream: string): Observable<boolean> {
    return this.registrationAcks$.pipe(
      map((acks: Map<string, boolean>) => acks.get(stream) === true)
    );
  }
  
  // Helper method to get all registered streams
  public getRegisteredStreams(): Observable<string[]> {
    return this.registrationAcks$.pipe(
      map((acks: Map<string, boolean>) => {
        const streams = Array.from(acks.entries())
          .filter(([_, registered]) => registered)
          .map(([stream]) => stream);
        
        this.logger.debug('WebSocketService', 'Currently registered streams', { streams });
        return streams;
      })
    );
  }

  // Add the missing processMockMessage method
  private processMockMessage(message: any): void {
    this.logger.info('WebSocketService', `Mock mode: Processing message ${JSON.stringify(message)}`);
    
    // Handle subscription requests and registrations
    if (message.action === 'register') {
      const stream = message.stream;
      this.registeredChannels.add(stream);
      
      // Send registration acknowledgment
      const ackResponse = {
        action: 'registration-ack',
        success: true,
        stream: stream,
        requestId: message.options?.requestId || `auto-${Date.now()}`,
        message: `Successfully registered for ${stream} stream`,
        timestamp: new Date().toISOString()
      };
      
      // Emit the acknowledgment through messages subject
      this.messagesSubject.next({
        type: 'registration-ack',
        ...ackResponse
      });
      
      // Generate mock data for this stream
      setTimeout(() => this.generateMockDataForChannel(stream), 100);
      
      this.logger.info('WebSocketService', `Mock mode: Registration acknowledged for ${stream}`);
    }
  }
}
