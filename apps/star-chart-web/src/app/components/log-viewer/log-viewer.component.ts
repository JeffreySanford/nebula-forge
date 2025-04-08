import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LoggerService, LogEntry } from '../../services/logger.service';
import { Observable, Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface GroupedLogs {
  title: string;
  date?: Date;
  logs: LogEntry[];
}

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(30, [
            animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class LogViewerComponent implements OnInit, OnDestroy {
  @Input() maxLogs: number = 200;
  @Input() filter: string = '';
  @Input() level: 'all' | 'info' | 'warning' | 'error' | 'debug' = 'all';
  @Input() sourceFilter: 'all' | 'api' | 'ui' | 'metrics' | 'websocket' = 'all';
  
  logs: LogEntry[] = [];
  groupedLogs: GroupedLogs[] = [];
  connectionStatus$: Observable<boolean>;
  private subscription: Subscription | null = null;
  
  constructor(private loggerService: LoggerService) {
    this.connectionStatus$ = this.loggerService.connectionStatus$;
  }
  
  ngOnInit(): void {
    this.subscription = this.loggerService.logs$.subscribe(
      logs => {
        // Apply filters
        this.logs = this.filterLogs(logs);
        // Group logs by time period
        this.groupedLogs = this.groupLogsByTime(this.logs);
      },
      error => {
        console.error('Error in log stream', error);
      }
    );
    
    // Log component initialization
    this.loggerService.info('LogViewerComponent', 'Log viewer initialized', { maxLogs: this.maxLogs });
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private filterLogs(logs: LogEntry[]): LogEntry[] {
    let filteredLogs = logs;
    
    // Filter by level if specified
    if (this.level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === this.level);
    }
    
    // Filter by source if specified
    if (this.sourceFilter !== 'all') {
      filteredLogs = filteredLogs.filter(log => {
        const source = log.source.toLowerCase();
        switch (this.sourceFilter) {
          case 'api':
            return source.includes('api:');
          case 'ui':
            return source.includes('ui:');
          case 'metrics':
            return source.includes('metrics') || source.includes('gateway');
          case 'websocket':
            return source.includes('websocket') || source.includes('socket');
          default:
            return true;
        }
      });
    }
    
    // Filter by search term if provided
    if (this.filter) {
      const searchTerm = this.filter.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) || 
        log.source.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }
    
    // Sort newest first
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limit to max logs
    return filteredLogs.slice(0, this.maxLogs);
  }
  
  private groupLogsByTime(logs: LogEntry[]): GroupedLogs[] {
    const now = new Date();
    const groups: GroupedLogs[] = [];
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    
    // Helper function to find or create group
    const getGroup = (title: string, date?: Date): GroupedLogs => {
      let group = groups.find(g => g.title === title);
      if (!group) {
        group = { title, date, logs: [] };
        groups.push(group);
      }
      return group;
    };
    
    logs.forEach(log => {
      const logTime = log.timestamp.getTime();
      const diffMs = now.getTime() - logTime;
      
      if (diffMs < hourMs) {
        getGroup('Last Hour', log.timestamp).logs.push(log);
      } else if (diffMs < dayMs) {
        getGroup('Today', log.timestamp).logs.push(log);
      } else if (diffMs < weekMs) {
        getGroup('This Week', log.timestamp).logs.push(log);
      } else if (diffMs < monthMs) {
        getGroup('This Month', log.timestamp).logs.push(log);
      } else {
        getGroup('Older', log.timestamp).logs.push(log);
      }
    });
    
    return groups;
  }
  
  getLevelClass(level: string): string {
    switch (level) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      case 'info': return 'log-info';
      case 'debug': return 'log-debug';
      default: return '';
    }
  }
  
  getSourceClass(source: string): string {
    if (source.startsWith('API:')) {
      return 'source-api';
    } else if (source.startsWith('UI:')) {
      return 'source-ui';
    }
    return '';
  }
  
  clearFilters(): void {
    this.level = 'all';
    this.sourceFilter = 'all';
    this.filter = '';
  }
}
