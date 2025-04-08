import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketRegistrationService {
  private readonly useMockMode = environment.useMockWebSocket;
  
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
      const status = isConnected ? 'Connected' : (this.useMockMode ? 'Using Mock Mode' : 'Connecting...');
      this.logger.info('WebSocketRegistrationService', `WebSocket connection status: ${status}`);
      
      // Register for data streams regardless of connection status - if using mock mode, this helps set up the channels
      this.registerForMetricsData();
      this.registerForPerformanceData();
      this.registerForDatabaseData();
      this.registerForGraphQLData();
      this.registerForHealthData();
      
      this.logger.info('WebSocketRegistrationService', 'All data stream registrations sent');
    }, 1000);
    
    // Add reconnection handler for re-registering if not in mock mode
    if (!this.useMockMode) {
      this.wsService.onReconnected(() => {
        this.logger.info('WebSocketRegistrationService', 'WebSocket reconnected, re-registering data streams');
        this.registerForMetricsData();
        this.registerForPerformanceData();
        this.registerForDatabaseData();
        this.registerForGraphQLData();
        this.registerForHealthData();
      });
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
}
