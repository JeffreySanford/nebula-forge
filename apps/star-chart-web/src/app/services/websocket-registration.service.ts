import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';
import { filter, take, timeout, map } from 'rxjs/operators';
import { BehaviorSubject, Observable, merge } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketRegistrationService {
  private readonly useMockMode = environment.useMockWebSocket;
  private registeredStreamsSubject = new BehaviorSubject<string[]>([]);
  private pendingRegistrations = new Set<string>();

  constructor(
    private wsService: WebSocketService,
    private logger: LoggerService
  ) {}

  /**
   * Initialize all WebSocket data stream registrations
   */
  initializeDataStreams(): void {
    this.logger.info('WebSocketRegistrationService', 'Starting WebSocket data stream registrations');
    
    // Add delay to ensure connection is established before sending registration requests
    setTimeout(() => {
      // Check connection status first
      const isConnected = this.wsService.ensureConnection();
      const isMockMode = this.wsService.isMockMode();
      const status = isConnected ? 
        (isMockMode ? 'Using Mock Mode' : 'Connected') : 'Connecting...';
      
      this.logger.info('WebSocketRegistrationService', `WebSocket connection status: ${status}`);
      
      // Register for data streams with proper acknowledgement tracking
      this.registerWithAcknowledgement('metrics');
      this.registerWithAcknowledgement('performance-metrics');
      this.registerWithAcknowledgement('database');
      this.registerWithAcknowledgement('graphql');
      this.registerWithAcknowledgement('health-metrics');
      
      // Also register for section colors and legend which were missing
      this.registerWithAcknowledgement('section-colors');
      this.registerWithAcknowledgement('metric-legend');
      
      this.logger.info('WebSocketRegistrationService', 'All data stream registrations sent');
    }, 1000);
    
    // Add reconnection handler for re-registering
    this.wsService.onReconnected(() => {
      this.logger.info('WebSocketRegistrationService', 'WebSocket reconnected, re-registering data streams');
      
      // Register all streams again
      this.registerWithAcknowledgement('metrics');
      this.registerWithAcknowledgement('performance-metrics');
      this.registerWithAcknowledgement('database');
      this.registerWithAcknowledgement('graphql');
      this.registerWithAcknowledgement('health-metrics');
      this.registerWithAcknowledgement('section-colors');
      this.registerWithAcknowledgement('metric-legend');
    });
  }

  // New method to register with acknowledgement tracking
  private registerWithAcknowledgement(streamType: string): void {
    this.logger.debug('WebSocketRegistrationService', `Sending ${streamType} registration request`);
    
    const requestId = this.wsService.registerForStream(streamType, {
      interval: 'real-time',
      requestId: this.generateRequestId(streamType)
    });
    
    // Monitor for acknowledgement with more generous timeout
    const registration$ = this.wsService.isStreamRegistered(streamType);
    
    // Create a composite stream that also includes any message with a matching requestId
    const ackStream$ = this.wsService.messages$.pipe(
      filter(msg => 
        // Check for both possible formats
        ((msg.type === 'registration-ack' || msg.action === 'registration-ack') && 
        msg.stream === streamType && 
        msg.success === true)
      ),
      map(() => true),
      take(1)
    );
    
    // Fix the pipe() error by creating a proper Observable
    // Don't call pipe() on the merged$ result, but create a proper subscription
    const merged$ = merge(
      registration$, 
      ackStream$ as Observable<boolean>
    );
    
    merged$.pipe(
      filter(registered => registered === true),
      take(1),
      timeout(20000)
    ).subscribe({
      next: () => {
        this.logger.info('WebSocketRegistrationService', `Stream ${streamType} successfully registered`);
      },
      error: (err: unknown) => {
        // Fix the type checking for unknown error
        if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'TimeoutError') {
          this.logger.warning('WebSocketRegistrationService', `Registration timeout for ${streamType}, will retry...`);
          
          // Retry registration with exponential backoff
          setTimeout(() => {
            this.registerWithAcknowledgement(streamType);
          }, 3000 + Math.random() * 2000); // Add random jitter to prevent all retries happening at once
        } else {
          if (err instanceof Error) {
            this.logger.error('WebSocketRegistrationService', 'Error occurred', { message: err.message });
          } else {
            this.logger.error('WebSocketRegistrationService', 'Unknown error occurred', { error: err });
          }
        }
      }
    });
  }

  private handleRegistrationAcknowledgement(message: any): void {
    // Handle both message formats
    const stream = message.stream;
    const requestId = message.requestId;
    const success = message.success === true;
    
    if (stream && success) {
      // Add the stream to the list of registered streams
      const currentStreams = this.registeredStreamsSubject.getValue();
      if (!currentStreams.includes(stream)) {
        this.registeredStreamsSubject.next([...currentStreams, stream]);
        this.logger.info('WebSocketRegistrationService', `Stream ${stream} successfully registered`);
      }
      
      // Handle any pending registration requests
      if (this.pendingRegistrations.has(stream)) {
        this.pendingRegistrations.delete(stream);
      }
    }
  }

  private registerForMetricsData(): void {
    this.logger.debug('WebSocketRegistrationService', 'Sending metrics registration request');
    this.wsService.sendMessage({
      action: 'register',
      stream: 'metrics',
      options: {
        interval: 'real-time',
        requestId: this.generateRequestId('metrics')
      }
    });
  }

  private registerForPerformanceData(): void {
    this.logger.debug('WebSocketRegistrationService', 'Sending performance registration request');
    this.wsService.sendMessage({
      action: 'register',
      stream: 'performance-metrics',
      options: {
        interval: 'real-time',
        requestId: this.generateRequestId('performance')
      }
    });
  }

  private registerForDatabaseData(): void {
    this.logger.debug('WebSocketRegistrationService', 'Sending database registration request');
    this.wsService.sendMessage({
      action: 'register',
      stream: 'database',
      options: {
        interval: 'real-time',
        details: ['queries', 'connections', 'performance'],
        requestId: this.generateRequestId('database')
      }
    });
  }

  private registerForGraphQLData(): void {
    this.logger.debug('WebSocketRegistrationService', 'Sending GraphQL registration request');
    this.wsService.sendMessage({
      action: 'register',
      stream: 'graphql',
      options: {
        interval: 'real-time',
        details: ['queries', 'mutations', 'subscriptions'],
        requestId: this.generateRequestId('graphql')
      }
    });
  }
  
  private registerForHealthData(): void {
    this.logger.debug('WebSocketRegistrationService', 'Sending health metrics registration request');
    this.wsService.sendMessage({
      action: 'register',
      stream: 'health-metrics',
      options: {
        interval: 'real-time',
        requestId: this.generateRequestId('health')
      }
    });
  }
  
  private generateRequestId(streamType: string): string {
    return `${streamType}-reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  public getRegisteredStreams(): Observable<string[]> {
    return this.registeredStreamsSubject.asObservable();
  }
}
