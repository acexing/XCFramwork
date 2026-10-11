import { director, game, profiler, sys } from 'cc';
import { DEBUG } from 'cc/env';
import {
  IPerformanceMonitor,
  PerformanceStats,
  PerformanceReport,
  MemoryInfo,
} from '../core/interfaces/IPerformanceMonitor';
import { ILogger } from '../core/interfaces/ILogger';

const LOGGER_TAG = 'PerformanceMonitor';
const FPS_HISTORY_SIZE = 60;
const LOW_FPS_WARN_THRESHOLD = 30;
const LOW_FPS_ERROR_THRESHOLD = 15;
const HIGH_DRAWCALL_THRESHOLD = 200;
const SUSTAINED_DURATION_MS = 5000;

export class PerformanceMonitor implements IPerformanceMonitor {
  private logger: ILogger;
  private fpsHistory: number[] = [];
  private currentFPS: number = 60;
  private fpsMin: number = 60;
  private lowFpsStartTime: number = 0;
  private highDrawCallStartTime: number = 0;
  private recording: boolean = false;
  private recordingDuration: number = 0;
  private recordingStartTime: number = 0;
  private statsHistory: PerformanceStats[] = [];
  private recordingWarnings: string[] = [];
  private lastStatsTime: number = 0;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  getFPS(): number {
    return this.currentFPS;
  }

  getMemoryUsage(): MemoryInfo | null {
    if (sys.platform === sys.Platform.WIN32 || sys.platform === sys.Platform.MACOS) {
      const nativeModule = (cc as unknown as Record<string, unknown>).native;
      if (nativeModule) {
        const perf = (nativeModule as Record<string, unknown>).performance;
        if (perf && typeof perf === 'object') {
          const memory = (perf as Record<string, unknown>).memory;
          if (memory && typeof memory === 'object') {
            const memObj = memory as Record<string, number>;
            if (
              typeof memObj.usedJSHeapSize === 'number' &&
              typeof memObj.totalJSHeapSize === 'number'
            ) {
              return {
                used: memObj.usedJSHeapSize,
                total: memObj.totalJSHeapSize,
              };
            }
          }
        }
      }
    }
    return null;
  }

  getDrawCallCount(): number {
    try {
      return profiler ? ((profiler as unknown as Record<string, number>).drawCalls ?? 0) : 0;
    } catch {
      return 0;
    }
  }

  getStats(): PerformanceStats {
    const fpsAvg =
      this.fpsHistory.length > 0
        ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
        : this.currentFPS;

    return {
      fps: this.currentFPS,
      fpsAvg: Math.round(fpsAvg),
      fpsMin: this.fpsMin,
      drawCalls: this.getDrawCallCount(),
      memory: this.getMemoryUsage(),
      assetCount: 0,
    };
  }

  startRecording(duration: number): void {
    this.recording = true;
    this.recordingDuration = duration;
    this.recordingStartTime = Date.now();
    this.statsHistory = [];
    this.recordingWarnings = [];
    this.logger.info(LOGGER_TAG, `开始性能录制: ${duration}ms`);
  }

  stopRecording(): PerformanceReport {
    this.recording = false;
    const actualDuration = Date.now() - this.recordingStartTime;
    this.logger.info(
      LOGGER_TAG,
      `结束性能录制: ${actualDuration}ms 采样数: ${this.statsHistory.length}`
    );
    return {
      duration: actualDuration,
      statsHistory: this.statsHistory,
      warnings: this.recordingWarnings,
    };
  }

  update(dt: number): void {
    if (dt > 0) {
      this.currentFPS = Math.round(1 / dt);
    }

    this.fpsHistory.push(this.currentFPS);
    if (this.fpsHistory.length > FPS_HISTORY_SIZE) {
      this.fpsHistory.shift();
    }

    if (this.currentFPS < this.fpsMin) {
      this.fpsMin = this.currentFPS;
    }

    this.checkThresholds();

    if (this.recording) {
      const now = Date.now();
      if (now - this.lastStatsTime >= 1000) {
        this.lastStatsTime = now;
        this.statsHistory.push(this.getStats());
      }
      if (now - this.recordingStartTime >= this.recordingDuration) {
        this.stopRecording();
      }
    }
  }

  resetFPSMin(): void {
    this.fpsMin = this.currentFPS;
  }

  private checkThresholds(): void {
    const now = Date.now();

    if (this.currentFPS < LOW_FPS_WARN_THRESHOLD) {
      if (this.lowFpsStartTime === 0) {
        this.lowFpsStartTime = now;
      } else if (now - this.lowFpsStartTime >= SUSTAINED_DURATION_MS) {
        if (this.currentFPS < LOW_FPS_ERROR_THRESHOLD) {
          this.logger.error(LOGGER_TAG, `帧率持续过低: ${this.currentFPS} FPS`);
        } else {
          this.logger.warn(LOGGER_TAG, `帧率持续偏低: ${this.currentFPS} FPS`);
        }
        this.lowFpsStartTime = 0;
      }
    } else {
      this.lowFpsStartTime = 0;
    }

    const drawCalls = this.getDrawCallCount();
    if (drawCalls > HIGH_DRAWCALL_THRESHOLD) {
      if (this.highDrawCallStartTime === 0) {
        this.highDrawCallStartTime = now;
      } else if (now - this.highDrawCallStartTime >= SUSTAINED_DURATION_MS) {
        this.logger.warn(LOGGER_TAG, `DrawCall 持续过高: ${drawCalls}`);
        this.highDrawCallStartTime = 0;
      }
    } else {
      this.highDrawCallStartTime = 0;
    }
  }
}
