export type PerformanceMetrics = {
  fcp?: number;
  lcp?: number;
  tti?: number;
  cls?: number;
  fid?: number;
  [key: string]: unknown;
};

export function measurePerformance(): PerformanceMetrics {
  return {};
}

export function checkPerformanceThresholds(_metrics: PerformanceMetrics): {
  passed: boolean;
  details: Array<{ metric: string; value: number; passed: boolean }>;
} {
  return { passed: true, details: [] };
}
