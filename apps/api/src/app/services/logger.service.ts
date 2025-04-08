import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class LoggerService {
  private logStream: Subject<LogEntry> = new Subject<LogEntry>();
  private logHistory: LogEntry[] = [];
  private readonly MAX_HISTORY: number = 1000; // Keep last 1000 logs in memory
  
  public logs$: Observable<LogEntry> = this.logStream.asObservable();
  
  constructor() {
    // Initialize with a startup log entry
    this.info('LoggerService', 'Logger service initialized');
  }
  
  info(source: string, message: string, data?: Record<string, unknown>): void {
    this.addLogEntry('info', source, message, data);
  }
  
  warning(source: string, message: string, data?: Record<string, unknown>): void {
    this.addLogEntry('warning', source, message, data);
  }
  
  error(source: string, message: string, data?: Record<string, unknown>): void {
    this.addLogEntry('error', source, message, data);
  }
  
  debug(source: string, message: string, data?: Record<string, unknown>): void {
    this.addLogEntry('debug', source, message, data);
  }
  
  private addLogEntry(level: 'info' | 'warning' | 'error' | 'debug', source: string, message: string, data?: Record<string, unknown>): void {
    // Add API indicator to source
    const apiSource = `API:${source}`;
    
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      source: apiSource,
      message,
      data
    };
    
    // Add to history
    this.logHistory.push(logEntry);
    
    // Trim history if needed
    if (this.logHistory.length > this.MAX_HISTORY) {
      this.logHistory = this.logHistory.slice(-this.MAX_HISTORY);
    }
    
    // Broadcast to subscribers
    this.logStream.next(logEntry);
    
    // Also log to console for debugging
    const consoleMethod = level === 'error' 
      ? console.error 
      : level === 'warning' 
      ? console.warn 
      : level === 'debug' 
      ? console.debug 
      : console.info;
      
    consoleMethod(`[${apiSource}] ${message}`, data || '');
  }
  
  getRecentLogs(count = 100): LogEntry[] {
    return this.logHistory.slice(-Math.min(count, this.MAX_HISTORY));
  }
}
