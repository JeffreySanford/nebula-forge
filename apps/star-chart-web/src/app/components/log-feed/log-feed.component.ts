import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LoggerService, LogEntry } from '../../services/logger.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-log-feed',
  templateUrl: './log-feed.component.html',
  styleUrls: ['./log-feed.component.scss']
})
export class LogFeedComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  private subscription: Subscription | null = null;
  hasMockData = false;

  constructor(private logger: LoggerService) {}

  ngOnInit(): void {
    this.subscription = this.logger.logs$.subscribe((logEntries: LogEntry[]) => {
      // Get only the most recent logs (last 10)
      this.logs = logEntries.slice(-10);
      this.hasMockData = this.logs.some(log => log.isMock || (log.data && log.data.mockData));
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getLogClass(level: string): string {
    switch (level) {
      case 'error': return 'fail';
      case 'info': return 'ok';
      default: return '';
    }
  }
  
  // Helper to check if source contains a component category for highlighting
  hasCategory(source: string, category: string): boolean {
    return source.toLowerCase().includes(category.toLowerCase());
  }
}
