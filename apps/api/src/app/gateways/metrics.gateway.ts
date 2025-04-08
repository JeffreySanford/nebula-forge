import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../services/logger.service';
import { Injectable } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';
import { Subscription, interval } from 'rxjs';

interface RegistrationPayload {
  stream: string;
  options?: {
    interval?: string;
    details?: string[];
    requestId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class MetricsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  private registeredClients: Map<string, Set<string>> = new Map<string, Set<string>>();
  private metricsSubscription: Subscription | null = null;
  private activeClients: number;
  private metricsIntervals: Map<string, Subscription> = new Map();
  
  constructor(
    private readonly loggerService: LoggerService,
    private readonly metricsService: MetricsService
  ) {
    this.activeClients = 0;
    this.setupRegularDataStreams();
  }

  private setupRegularDataStreams(): void {
    // Set up regular data broadcasts for various metrics streams
    this.metricsSubscription = this.metricsService.metrics$.subscribe(metrics => {
      if (this.server && this.activeClients > 0) {
        this.server.emit('metrics', metrics);
        this.loggerService.debug('MetricsGateway', 'Broadcasting metrics to all clients', { count: metrics.length });
      }
    });
    
    // Health metrics broadcast every 10 seconds
    this.metricsIntervals.set('health-metrics', interval(10000).subscribe(() => {
      if (this.server && this.activeClients > 0) {
        const healthData = this.metricsService.generateHealthMetrics();
        this.server.emit('health-metrics', healthData);
        this.loggerService.debug('MetricsGateway', 'Broadcasting health metrics');
      }
    }));
    
    // Performance metrics broadcast every 5 seconds
    this.metricsIntervals.set('performance-metrics', interval(5000).subscribe(() => {
      if (this.server && this.activeClients > 0) {
        const perfData = this.metricsService.generatePerformanceMetrics();
        this.server.emit('performance-metrics', perfData.metrics);
        this.loggerService.debug('MetricsGateway', 'Broadcasting performance metrics');
      }
    }));
  }
  
  handleConnection(client: Socket): void {
    this.activeClients++;
    this.loggerService.info('MetricsGateway', `Client connected: ${client.id}, total clients: ${this.activeClients}`);
    this.registeredClients.set(client.id, new Set<string>());
    
    // Send legend data and section colors
    client.emit('metric-legend', this.metricsService.getLegend());
    client.emit('section-colors', this.metricsService.getSectionColors());
    
    // Send initial health metrics right away
    client.emit('health-metrics', this.metricsService.generateHealthMetrics());
    
    // Send initial performance metrics right away
    client.emit('performance-metrics', this.metricsService.generatePerformanceMetrics().metrics);
    
    this.loggerService.info('MetricsGateway', 'Sent initial data to client', { clientId: client.id });
  }
  
  handleDisconnect(client: Socket): void {
    this.activeClients = Math.max(0, this.activeClients - 1);
    this.loggerService.info('MetricsGateway', `Client disconnected: ${client.id}, remaining clients: ${this.activeClients}`);
    this.registeredClients.delete(client.id);
  }
  
  @SubscribeMessage('subscribe')
  handleSubscribeChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channel: string }
  ): void {
    this.loggerService.info('MetricsGateway', `Client ${client.id} subscribed to channel: ${payload.channel}`);
    
    // Send immediate data based on the subscribed channel
    switch (payload.channel) {
      case 'performance-metrics':
        client.emit('performance-metrics', this.metricsService.generatePerformanceMetrics().metrics);
        break;
      case 'health-metrics':
        client.emit('health-metrics', this.metricsService.generateHealthMetrics());
        break;
    }
  }
  
  @SubscribeMessage('register')
  handleRegisterStream(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: RegistrationPayload
  ): void {
    const streamType = payload.stream;
    const options = payload.options || {};
    const clientStreams = this.registeredClients.get(client.id) || new Set<string>();
    
    clientStreams.add(streamType);
    this.registeredClients.set(client.id, clientStreams);
    
    this.loggerService.info('MetricsGateway', `Client ${client.id} registered for ${streamType} stream`, { 
      options,
      clientId: client.id
    });
    
    // Send acknowledgment with same requestId if provided
    if (options.requestId) {
      client.emit('registration-ack', {
        success: true,
        stream: streamType,
        requestId: options.requestId,
        message: `Successfully registered for ${streamType} stream`
      });
      
      this.loggerService.debug('MetricsGateway', `Sent registration acknowledgment for ${streamType}`, {
        requestId: options.requestId,
        clientId: client.id
      });
    }
    
    // Start sending data immediately
    this.sendInitialData(client, streamType);

    // If registering for metrics, send the legend right away
    if (streamType === 'metrics' || streamType === 'metric-legend') {
      client.emit('metric-legend', this.metricsService.getLegend());
    }

    // Send appropriate data based on stream type
    switch(streamType) {
      case 'health-metrics':
        client.emit('health-metrics', this.metricsService.generateHealthMetrics());
        break;
        
      case 'dashboard-metrics':
        client.emit('dashboard-metrics', this.metricsService.generateDashboardMetrics());
        break;
        
      case 'database-metrics':
        client.emit('database-metrics', this.metricsService.generateDatabaseMetrics());
        break;
        
      case 'graphql-metrics':
        client.emit('graphql-metrics', this.metricsService.generateGraphQLMetrics());
        break;
        
      case 'performance-metrics': 
        client.emit('performance-metrics', this.metricsService.generatePerformanceMetrics().metrics);
        break;
    }
  }
  
  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): void {
    // Handle ping requests, useful for testing
    const responsePayload = {
      action: 'pong',
      timestamp: new Date().toISOString(),
      requestId: payload?.options?.requestId || undefined,
      serverTime: new Date().toISOString()
    };
    
    // Respond to the client
    client.emit('pong', responsePayload);
    this.loggerService.debug('MetricsGateway', 'Ping received, sent pong', { clientId: client.id });
  }
  
  private sendInitialData(client: Socket, streamType: string): void {
    switch(streamType) {
      case 'metrics':
        // Send mock metrics data
        client.emit('metrics', this.metricsService.generateDatabaseMetrics().metrics);
        break;
        
      case 'performance-metrics':
        client.emit('performance-metrics', this.metricsService.generatePerformanceMetrics().metrics);
        break;
        
      case 'health-metrics':
        client.emit('health-metrics', this.metricsService.generateHealthMetrics());
        break;
    }
  }

  onModuleDestroy(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
    
    // Clean up all interval subscriptions
    this.metricsIntervals.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }
}
