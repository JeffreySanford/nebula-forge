import { Component, OnInit, OnDestroy } from '@angular/core';
import { PerformanceService, PerformanceMetric } from '../../services/performance.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-performance-tile',
  templateUrl: './performance-tile.component.html',
  styleUrls: ['./performance-tile.component.scss']
})
export class PerformanceTileComponent implements OnInit, OnDestroy {
  metrics: PerformanceMetric[] = [];
  private subscription: Subscription | null = null;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    // Change from metrics$ to performanceMetrics$
    this.subscription = this.performanceService.performanceMetrics$.subscribe(
      data => {
        this.metrics = data;
      },
      error => {
        console.error('Error fetching performance metrics', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  formatValue(metric: PerformanceMetric): string {
    return `${metric.value} ${metric.unit}`;
  }
}
