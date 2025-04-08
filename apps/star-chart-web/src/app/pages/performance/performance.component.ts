import { Component, OnInit, OnDestroy } from '@angular/core';
import { PerformanceService, PerformanceMetric } from '../../services/performance.service';
import { WebSocketService, WebSocketStats } from '../../services/websocket.service'; // Import WebSocketService and WebSocketStats
import { LoggerService } from '../../services/logger.service'; // Import LoggerService
import { Observable, Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations'; // Import animations

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html', // Link the HTML template
  styleUrls: ['./performance.component.scss'], // Link the SCSS file
  animations: [ // Add animations
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PerformanceComponent implements OnInit, OnDestroy {
  performanceMetrics$: Observable<PerformanceMetric[]>;
  webSocketStats$: Observable<WebSocketStats>; // Add observable for WebSocket stats
  private subscriptions: Subscription[] = [];

  // Add property for section color
  sectionColor = '#FF5722'; // Default performance color (Deep Orange)

  // Inject services
  constructor(
    private performanceService: PerformanceService,
    private webSocketService: WebSocketService, // Inject WebSocketService
    private logger: LoggerService
  ) {
    this.performanceMetrics$ = this.performanceService.performanceMetrics$;
    this.webSocketStats$ = this.webSocketService.webSocketStats$; // Assign the observable
  }

  ngOnInit(): void {
    this.logger.info('PerformanceComponent', 'Performance page initialized.');
    // Subscription is handled by async pipe in template, but log received data
    this.subscriptions.push(
      this.performanceMetrics$.subscribe(metrics => {
        if (metrics.length > 0) {
          this.logger.debug('PerformanceComponent', 'Received performance metrics update', { count: metrics.length });
        }
      })
    );
    // Optionally request historical data if needed on init
    // this.performanceService.requestMetricsHistory(60);

    // Subscribe to section colors to get the performance section color
    this.subscriptions.push(
      this.webSocketService.subscribe<Record<string, string>>('section-colors').subscribe(
        colors => {
          if (colors && colors['performance']) {
            this.sectionColor = colors['performance'];
            this.logger.debug('Performance', 'Received performance section color', { color: colors['performance'] });
            
            // Apply section color to the component's styles
            this.applyThemeColor(this.sectionColor);
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.logger.info('PerformanceComponent', 'Performance page destroyed.');
  }

  // Method to apply theme color to component styles
  private applyThemeColor(color: string): void {
    document.documentElement.style.setProperty('--performance-primary-color', color);
    document.documentElement.style.setProperty('--performance-light-color', `${color}20`);
  }

  // Helper to get color based on metric name or value (example)
  getMetricColor(metric: PerformanceMetric): string {
    if (metric.name.toLowerCase().includes('latency') || metric.name.toLowerCase().includes('time')) {
      return metric.value > 100 ? '#f44336' : metric.value > 50 ? '#ff9800' : '#4caf50';
    }
    if (metric.name.toLowerCase().includes('cpu')) {
      return metric.value > 80 ? '#f44336' : metric.value > 50 ? '#ff9800' : '#4caf50';
    }
    return '#2196f3'; // Default blue
  }

  // Method to handle click on WebSocket stats card
  showWebSocketDetails(stats: WebSocketStats | null): void {
    if (stats) {
      console.log('WebSocket Connection Details:', stats);
      // TODO: Implement overlay/dialog display logic here
      alert(`WebSocket Stats:\nOpen: ${stats.open}\nClosed: ${stats.closed}\nErrors: ${stats.errors}\nAttempting: ${stats.attempting}`);
    }
  }

  // Helper to create tooltip text
  getWebSocketTooltip(stats: WebSocketStats | null): string {
    if (!stats) return 'Loading stats...';
    return `Open: ${stats.open} | Closed: ${stats.closed} | Errors: ${stats.errors} | Attempting: ${stats.attempting}`;
  }
}
