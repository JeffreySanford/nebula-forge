import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { share } from 'rxjs/operators';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
  success?: boolean;
  // Style properties
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  highlightComponent?: string;
  formattedMessage?: string;
  isMock?: boolean; // Flag for mock data indicators
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logStream = new BehaviorSubject<LogEntry[]>([]);
  private logHistory: LogEntry[] = [];
  private connectionStatus = new BehaviorSubject<boolean>(false);

  public logs$ = this.logStream.asObservable().pipe(share());
  public connectionStatus$ = this.connectionStatus.asObservable();
  
  // Color mappings for different log levels
  private colorMap: Record<'info' | 'warning' | 'error' | 'debug' | 'websocket' | 'http' | 'router' | 'auth' | 'database' | 'user' | 'metrics' | 'api', string> = {
    info: '#2196F3', // Blue
    warning: '#FF9800', // Orange
    error: '#F44336', // Red
    debug: '#757575', // Gray
    // Component categories
    websocket: '#6a1b9a', // Purple
    http: '#00897b', // Teal
    router: '#ff5722', // Deep Orange
    auth: '#ffc107', // Amber
    database: '#3f51b5', // Indigo
    user: '#795548', // Brown
    metrics: '#009688', // Teal
    api: '#e91e63' // Pink
  };
  
  constructor() {
    // Initialize with a startup log
    this.info('LoggerService', 'Logger service initialized');
    
    // Simulate connection for now until socket.io-client is available
    setTimeout(() => this.connectionStatus.next(true), 1000);
  }
  
  // Frontend logging methods
  log(level: 'info' | 'warning' | 'error' | 'debug', source: string, message: string, data?: any): void {
    const timestamp = new Date();
    const formattedDate = this.formatTimestamp(timestamp);
    
    // Extract component name from source for highlighting
    const componentCategory = this.extractComponentCategory(source) as keyof typeof this.colorMap;
    const color = this.getColorForLevel(level);
    const categoryColor = this.getColorForComponent(componentCategory);
    
    // Create formatted message with requested format
    const formattedMessage = `[${formattedDate}][${level.toUpperCase()}][${source}] - ${message}`;
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      source: `UI:${source}`,
      message,
      data,
      // Style properties
      color,
      backgroundColor: this.getLightColorForLevel(level),
      borderColor: color,
      highlightComponent: componentCategory,
      formattedMessage,
      // Set isMock flag if data contains mockData flag
      isMock: data?.mockData === true || data?.isMock === true
    };
    
    // Add to local history
    this.logHistory = [...this.logHistory, logEntry].slice(-1000);
    this.logStream.next(this.logHistory);
    
    // Also log to console for debugging
    const consoleMethod = level === 'error' 
      ? console.error 
      : level === 'warning' 
      ? console.warn 
      : level === 'debug' 
      ? console.debug 
      : console.info;   
    
    consoleMethod(`[${logEntry.source}] ${message}`, data || '');
  }
  
  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').substr(0, 19);
  }
  
  private extractComponentCategory(source: string): string {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('websocket') || lowerSource.includes('ws')) {
      return 'websocket';
    } else if (lowerSource.includes('http') || lowerSource.includes('api')) {
      return 'http';
    } else if (lowerSource.includes('router') || lowerSource.includes('route')) {
      return 'router';
    } else if (lowerSource.includes('auth')) {
      return 'auth';
    } else if (lowerSource.includes('database') || lowerSource.includes('db')) {
      return 'database';
    } else if (lowerSource.includes('user')) {
      return 'user';
    } else if (lowerSource.includes('metric')) {
      return 'metrics';
    }
    
    return '';
  }
  
  private getColorForLevel(level: keyof typeof this.colorMap): string {
    return this.colorMap[level] || '#757575';
  }
  
  private getColorForComponent(component: keyof typeof this.colorMap): string {
    return this.colorMap[component] || '#757575';
  }
  
  private getLightColorForLevel(level: string): string {
    switch(level) {
      case 'info': return 'rgba(33, 150, 243, 0.1)';
      case 'warning': return 'rgba(255, 152, 0, 0.1)';
      case 'error': return 'rgba(244, 67, 54, 0.1)';
      case 'debug': return 'rgba(117, 117, 117, 0.1)';
      default: return 'transparent';
    }
  }
  
  info(source: string, message: string, data?: any): void {
    this.log('info', source, message, data);
  }
  
  warning(source: string, message: string, data?: any): void {
    this.log('warning', source, message, data);
  }
  
  error(source: string, message: string, data?: any): void {
    this.log('error', source, message, data);
  }
  
  debug(source: string, message: string, data?: any): void {
    this.log('debug', source, message, data);
  }
  
  getRecentLogs(count = 100): LogEntry[] {
    return this.logHistory.slice(-Math.min(count, 1000));
  }
  
  // Placeholder for websocket functionality
  subscribe(channel: string): Observable<any> {
    // This is a stub until we can import socket.io-client
    console.warn(`WebSocket subscription to ${channel} requested but not yet implemented`);
    return new Observable();
  }
}
