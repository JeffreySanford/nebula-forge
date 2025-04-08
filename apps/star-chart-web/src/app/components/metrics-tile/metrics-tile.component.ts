import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { MetricsSocketService } from '../../services/metrics-socket.service';

interface MetricEvent {
  name: string;
  value: number;
  timestamp: Date;
  unit: string;
  isMock?: boolean;
}

@Component({
  selector: 'app-metrics-tile',
  templateUrl: './metrics-tile.component.html',
  styleUrls: ['./metrics-tile.component.scss']
})
export class MetricsTileComponent implements OnInit {
  metrics$ = new BehaviorSubject<MetricEvent[]>([
    { name: 'CPU Usage', value: 45, timestamp: new Date(), unit: '%', isMock: true },
    { name: 'Memory', value: 2.7, timestamp: new Date(), unit: 'GB', isMock: true },
    { name: 'API Calls', value: 124, timestamp: new Date(), unit: 'req/min', isMock: true }
  ]);
  
  // Add a property to track if any metrics are mock data
  hasMockData = true;

  constructor(private metricsSocketService: MetricsSocketService) {}

  ngOnInit(): void {
    // Add some initial metrics upon component initialization
    const initialMetrics = this.metrics$.getValue();
    initialMetrics.push({
      name: 'Network', 
      value: 1.2, 
      timestamp: new Date(), 
      unit: 'MB/s',
      isMock: true
    });
    this.metrics$.next(initialMetrics);

    this.metricsSocketService.listenForExtendedMetrics().subscribe(data => {
      // Tag all socket data with isMock flag based on source or existing flag
      const metricsWithMockFlag = data.map((metric: any) => ({
        ...metric,
        isMock: metric.isMock || data.isMock || false
      }));
      
      this.metrics$.next(metricsWithMockFlag);
      
      // Check if any metrics have mock data
      this.hasMockData = metricsWithMockFlag.some((metric: MetricEvent) => metric.isMock);
    });
  }
  
  clearMetrics(): void {
    this.metrics$.next([]);
    this.hasMockData = false;
  }
}
