export interface Metric {
  metricId?: number;
  metricName: string;
  threshold: number;
  unit: string;
  alert?: boolean;
}
