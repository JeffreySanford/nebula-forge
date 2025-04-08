export class MetricDto {
  id!: string;
  name!: string;
  value!: number;
  unit!: string;
  timestamp!: string;
  source!: string;
  type!: string;
  color?: string;
}

export class HistoricalMetricsRequestDto {
  type!: string;
  timespan?: number;
  startDate?: string;
  endDate?: string;
  range?: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export class HistoricalMetricsResponseDto {
  type!: string;
  metrics!: MetricDto[];
  startDate!: string;
  endDate!: string;
  range?: string;
  timespan?: number;
}
