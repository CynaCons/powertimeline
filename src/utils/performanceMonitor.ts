interface PerformanceMetrics {
  renderTime: number;
  layoutTime: number;
  memoryUsage: number;
  bundleLoadTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private renderStartTime: number = 0;
  private layoutStartTime: number = 0;

  startRenderMeasurement(): void {
    this.renderStartTime = performance.now();
  }

  endRenderMeasurement(): void {
    if (this.renderStartTime > 0) {
      const renderTime = performance.now() - this.renderStartTime;
      this.recordMetric('renderTime', renderTime);
      this.renderStartTime = 0;
    }
  }

  startLayoutMeasurement(): void {
    this.layoutStartTime = performance.now();
  }

  endLayoutMeasurement(): void {
    if (this.layoutStartTime > 0) {
      const layoutTime = performance.now() - this.layoutStartTime;
      this.recordMetric('layoutTime', layoutTime);
      this.layoutStartTime = 0;
    }
  }

  recordBundleLoadTime(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const bundleLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
        this.recordMetric('bundleLoadTime', bundleLoadTime);
      }
    }
  }

  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  private recordMetric(type: keyof PerformanceMetrics, value: number): void {
    const metric: PerformanceMetrics = {
      renderTime: type === 'renderTime' ? value : 0,
      layoutTime: type === 'layoutTime' ? value : 0,
      memoryUsage: this.getMemoryUsage(),
      bundleLoadTime: type === 'bundleLoadTime' ? value : 0,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance warnings
    if (type === 'renderTime' && value > 16.67) { // 60fps threshold
      console.warn(`Slow render detected: ${value.toFixed(2)}ms`);
    }
    if (type === 'layoutTime' && value > 100) {
      console.warn(`Slow layout detected: ${value.toFixed(2)}ms`);
    }
  }

  getAverageRenderTime(): number {
    const renderTimes = this.metrics.filter(m => m.renderTime > 0).map(m => m.renderTime);
    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length || 0;
  }

  getAverageLayoutTime(): number {
    const layoutTimes = this.metrics.filter(m => m.layoutTime > 0).map(m => m.layoutTime);
    return layoutTimes.reduce((sum, time) => sum + time, 0) / layoutTimes.length || 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  generateReport(): string {
    const avgRender = this.getAverageRenderTime();
    const avgLayout = this.getAverageLayoutTime();
    const currentMemory = this.getMemoryUsage();

    return `Performance Report:
- Average Render Time: ${avgRender.toFixed(2)}ms
- Average Layout Time: ${avgLayout.toFixed(2)}ms
- Current Memory Usage: ${currentMemory.toFixed(2)}MB
- Total Metrics Collected: ${this.metrics.length}`;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export type { PerformanceMetrics };