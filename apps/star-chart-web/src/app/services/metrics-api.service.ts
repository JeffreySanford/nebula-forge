import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

export interface MetricDto {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  type: string;
  color?: string;
}

export interface HistoricalMetricsResponse {
  type: string;
  metrics: MetricDto[];
  startDate: string;
  endDate: string;
  range?: string;
}

export interface CreateMetricRequest {
  name: string;
  value: number;
  unit: string;
  timestamp?: Date;
  source: string;
  type: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsApiService {
  private apiUrl = `${environment.apiUrl}/metrics`;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  getHistoricalMetrics(
    type: string,
    range?: 'hour' | 'day' | 'week' | 'month' | 'year',
    timespan?: number,
    startDate?: string,
    endDate?: string
  ): Observable<HistoricalMetricsResponse> {
    let params = new HttpParams().set('type', type);

    // Add timespan parameter with priority if provided
    if (timespan) {
      params = params.set('timespan', timespan.toString());
      this.logger.info('MetricsApiService', `Filtering metrics by timespan: ${timespan} minutes`);
    } 
    // Otherwise use range or date range
    else if (range) {
      params = params.set('range', range);
    } else if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }

    this.logger.info('MetricsApiService', 'Requesting historical metrics', {
      type,
      range,
      timespan,
      startDate,
      endDate
    });

    return this.http.get<HistoricalMetricsResponse>(this.apiUrl, { params });
  }

  getLatestMetrics(): Observable<MetricDto[]> {
    return this.http.get<MetricDto[]>(this.apiUrl);
  }

  createMetric(metric: CreateMetricRequest): Observable<MetricDto> {
    return this.http.post<MetricDto>(this.apiUrl, metric);
  }

  clearMetrics(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(this.apiUrl);
  }
}
