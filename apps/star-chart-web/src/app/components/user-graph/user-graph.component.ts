import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { UserStateService } from '../../services/user-state.service';
import { Subscription } from 'rxjs';
import { UserState } from '../../interfaces/user-state.interface';

// Register all Chart.js components
Chart.register(...registerables);

// Define chart data type
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

@Component({
  selector: 'app-user-graph',
  templateUrl: './user-graph.component.html',
  styleUrls: ['./user-graph.component.scss']
})
export class UserGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userStatsCanvas') private userStatsCanvas?: ElementRef;
  
  private chart?: Chart;
  private subscription?: Subscription;

  constructor(private userStateService: UserStateService) {}

  ngOnInit(): void {
    // Empty init - chart created in afterViewInit
  }

  ngAfterViewInit(): void {
    this.subscription = this.userStateService.userState$.subscribe(
      (user: UserState | null) => {
        if (user) {
          this.updateChart(user);
        }
      }
    );
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart(): void {
    if (!this.userStatsCanvas) return;

    const ctx = this.userStatsCanvas.nativeElement.getContext('2d');
    
    const data: ChartData = {
      labels: ['Active Users', 'CPU Usage', 'Memory Usage', 'Disk Space', 'Network'],
      datasets: [{
        label: 'System Metrics',
        data: [65, 59, 80, 81, 56],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    this.chart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private updateChart(user: UserState): void {
    if (!this.chart || !user) return;

    // Update chart based on user data
    // This is just a placeholder implementation
    const newData = [
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100
    ];

    this.chart.data.datasets[0].data = newData;
    this.chart.update();
  }
}
