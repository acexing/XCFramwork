export interface MemoryInfo {
  used: number;
  total: number;
}

export interface PerformanceStats {
  fps: number;
  fpsAvg: number;
  fpsMin: number;
  drawCalls: number;
  memory: MemoryInfo | null;
  assetCount: number;
}

export interface PerformanceReport {
  duration: number;
  statsHistory: PerformanceStats[];
  warnings: string[];
}

export interface IPerformanceMonitor {
  getFPS(): number;
  getMemoryUsage(): MemoryInfo | null;
  getDrawCallCount(): number;
  getStats(): PerformanceStats;
  startRecording(duration: number): void;
  stopRecording(): PerformanceReport;
}
