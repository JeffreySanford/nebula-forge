import { Injectable } from '@nestjs/common';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  data?: string | number | boolean | object | null;
}

@Injectable()
export class LoggerService {
  info(source: string, message: string, data?: string | number | boolean | object | null): void {
    this.log('info', source, message, data);
  }
  
  warning(source: string, message: string, data?: string | number | boolean | object | null): void {
    this.log('warning', source, message, data);
  }
  
  error(source: string, message: string, data?: string | number | boolean | object | null): void {
    this.log('error', source, message, data);
  }
  
  debug(source: string, message: string, data?: string | number | boolean | object | null): void {
    this.log('debug', source, message, data);
  }
  
  private log(level: 'info' | 'warning' | 'error' | 'debug', source: string, message: string, data?: string | number | boolean | object | null): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      source: `API:${source}`,
      message,
      data
    };
    
    // Log to console for development
    const consoleMethod = level === 'error' 
      ? console.error 
      : level === 'warning' 
      ? console.warn 
      : level === 'debug' 
      ? console.debug 
      : console.info;
      
    consoleMethod(`[${logEntry.source}][${level.toUpperCase()}] ${message}`, data || '');
  }
}
