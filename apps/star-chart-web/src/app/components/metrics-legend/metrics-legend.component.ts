import { Component, OnInit } from '@angular/core';
import { MetricsService, MetricLegendItem } from '../../services/metrics.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-metrics-legend',
  templateUrl: './metrics-legend.component.html',
  styleUrls: ['./metrics-legend.component.scss']
})
export class MetricsLegendComponent implements OnInit {
  legendItems$: Observable<MetricLegendItem[]>;
  
  constructor(private metricsService: MetricsService) {
    this.legendItems$ = this.metricsService.getLegend();
  }
  
  ngOnInit(): void {
    // No additional initialization needed
  }
}
