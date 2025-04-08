import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { LoggerService } from './logger.service';
import { HttpServer } from '@nestjs/common/interfaces/http/http-server.interface';

@Injectable()
export class WebSocketService {
  private server: Server | null = null;
  private io: Server;

  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.info(
      'WebSocketService',
      'WebSocket service initialized'
    );
  }

  setServer(server: Server): void {
    this.server = server;
    this.loggerService.info('WebSocketService', 'WebSocket server registered');
  }

  initialize(server: HttpServer): void {
    const httpServer = require('http').createServer(server as HttpServer);
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  broadcastToAll(event: string, data: unknown): void {
    if (!this.server) {
      this.loggerService.warning(
        'WebSocketService',
        'Attempted to broadcast before server was set'
      );
      return;
    }

    this.server.emit(event, data);
    this.loggerService.debug(
      'WebSocketService',
      `Broadcasting ${event} event to all clients`
    );
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    if (!this.server) {
      this.loggerService.warning(
        'WebSocketService',
        'Attempted to broadcast before server was set'
      );
      return;
    }

    this.server.to(room).emit(event, data);
    this.loggerService.debug(
      'WebSocketService',
      `Broadcasting ${event} event to room ${room}`
    );
  }

  emit(event: string, data: unknown): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
