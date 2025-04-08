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
import { Subscription } from 'rxjs';

@WebSocketGateway({
  namespace: 'logs',
  cors: {
    origin: '*',
  },
})
@Injectable()
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  
  private connectedClients: number;
  private logSubscription: Subscription | null = null;
  
  constructor(private readonly loggerService: LoggerService) {
    this.connectedClients = 0;
    this.loggerService.info('LogsGateway', 'Initializing Logs Gateway');    this.logSubscription = this.loggerService.logs$.subscribe(log => {
      if (this.server) {
        this.loggerService.debug('LogsGateway', 'Broadcasting log entry to all clients', { log });
        this.connectedClients = this.server.engine.clientsCount;
        this.loggerService.info('LogsGateway', `Connected clients: ${this.connectedClients}`);
        this.server.emit('log-entry', log);
      }
    });
  }
  
  handleConnection(client: Socket): void {
    this.connectedClients++;
    this.loggerService.info('LogsGateway', `Client connected: ${client.id}`, { clientCount: this.connectedClients });
    
    // Send recent logs to the newly connected client
    client.emit('log-history', this.loggerService.getRecentLogs());
  }
  
  handleDisconnect(client: Socket): void {
    this.connectedClients--;
    this.loggerService.info('LogsGateway', `Client disconnected: ${client.id}`, { clientCount: this.connectedClients });
  }
  
  @SubscribeMessage('request-logs')
  handleRequestLogs(
    @ConnectedSocket() client: Socket, 
    @MessageBody() count: number
  ): void {
    client.emit('log-history', this.loggerService.getRecentLogs(count));
  }
  
  onModuleDestroy(): void {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }
}
