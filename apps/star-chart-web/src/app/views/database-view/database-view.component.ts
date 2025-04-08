import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MetricsApiService, HistoricalMetricsResponse, MetricDto } from '../../services/metrics-api.service';
import { LoggerService } from '../../services/logger.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-database-view',
  templateUrl: './database-view.component.html',
  styleUrls: ['./database-view.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(30, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulseAnimation', [
      transition('* => *', [
        style({ backgroundColor: 'rgba(255, 193, 7, 0.2)' }),
        animate('1s ease-out', style({ backgroundColor: 'transparent' }))
      ])
    ])
  ]
})
export class DatabaseViewComponent implements OnInit, OnDestroy {
  // Available metric types
  metricTypes = [
    { value: 'cpu', label: 'CPU Usage' },
    { value: 'memory', label: 'Memory Usage' },
    { value: 'disk', label: 'Disk IO' },
    { value: 'network', label: 'Network Traffic' },
    { value: 'requests', label: 'Request Count' },
    { value: 'latency', label: 'API Latency' },
    { value: 'throughput', label: 'Throughput' },
    { value: 'connections', label: 'Connections' }
  ];

  // Range options
  timeRanges = [
    { value: 'hour', label: 'Last Hour' },
    { value: 'day', label: 'Last Day' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' }
  ];

  // Form controls
  selectedMetricType = new FormControl(this.metricTypes[0].value);
  selectedTimeRange = new FormControl(this.timeRanges[1].value); // Default to 'day'
  customTimespan = new FormControl(30); // Default to 30 minutes
  showCustomTimespan = false;
  
  // Data
  historicalMetrics$: Observable<HistoricalMetricsResponse> | null = null;
  isLoading = false;
  error: string | null = null;
  animations = true;
  
  // Track new data
  newDataReceived = false;
  lastUpdated: Date | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private metricsApiService: MetricsApiService,
    private logger: LoggerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to changes in metric type
    this.subscriptions.push(
      this.selectedMetricType.valueChanges.subscribe(() => {
        this.loadHistoricalMetrics();
      })
    );
    
    // Subscribe to changes in time range
    this.subscriptions.push(
      this.selectedTimeRange.valueChanges.subscribe(() => {
        this.loadHistoricalMetrics();
      })
    );

    // Add listener for custom timespan changes
    this.subscriptions.push(
      this.customTimespan.valueChanges.subscribe(() => {
        if (this.showCustomTimespan) {
          this.loadHistoricalMetrics();
        }
      })
    );
    
    // Load initial data
    this.loadHistoricalMetrics();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadHistoricalMetrics(): void {
    this.isLoading = true;
    this.error = null;
    
    let timespan: number | undefined;
    
    // Only use custom timespan if option is selected
    if (this.showCustomTimespan && this.customTimespan.value) {
      timespan = this.customTimespan.value;
    }
    
    this.historicalMetrics$ = this.metricsApiService.getHistoricalMetrics(
      this.selectedMetricType.value!,
      this.showCustomTimespan ? undefined : this.selectedTimeRange.value as 'hour' | 'day' | 'week' | 'month' | 'year',
      timespan
    ).pipe(
      catchError(err => {
        this.error = `Failed to load metrics: ${err.message}`;
        this.logger.error('DatabaseView', 'Error loading metrics', { error: err });
        this.snackBar.open('Failed to load metrics', 'Dismiss', { duration: 5000 });
        return of({
          type: this.selectedMetricType.value!,
          metrics: [],
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          range: this.selectedTimeRange.value || undefined // Changed from null to undefined
        } as HistoricalMetricsResponse); // Type assertion to ensure compatibility
      }),
      finalize(() => {
        this.isLoading = false;
        this.lastUpdated = new Date();
        this.triggerAnimation();
      })
    );
  }

  // Trigger animation when new data arrives
  triggerAnimation(): void {
    this.newDataReceived = true;
    setTimeout(() => {
      this.newDataReceived = false;
    }, 1000);
  }

  // Format metric data for display
  formatMetricValue(metric: MetricDto): string {
    return `${metric.value} ${metric.unit}`;
  }

  // Format timestamp for display
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  // Get chart color for a metric
  getChartColor(metric: MetricDto): string {
    return metric.color || '#2196F3';
  }
  
  // Generate gradient style for a chart
  getGradientStyle(color: string): string {
    return `linear-gradient(to right, ${color}20, ${color}80)`;
  }
  
  // Get random color for demo purposes
  getRandomColor(): string {
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FFC107', '#795548'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Refresh data
  refreshData(): void {
    this.loadHistoricalMetrics();
    this.snackBar.open('Refreshing metrics data...', '', { duration: 1000 });
  }

  // Toggle custom timespan mode
  toggleCustomTimespan(event: MatSlideToggleChange): void {
    this.showCustomTimespan = event.checked;
    this.loadHistoricalMetrics();
  }
}
