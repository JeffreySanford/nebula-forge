export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  source: string;
  type: string;
  color?: string;
}
