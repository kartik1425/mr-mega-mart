class MetricsService {
  constructor() {
    this.counters = {
      totalRequests: 0,
      totalErrors: 0,
      authFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheErrors: 0,
      cacheSets: 0,
      cacheInvalidations: 0,
      paymentAttempts: 0,
      paymentFailures: 0,
    }
  }

  increment(metricName, count = 1) {
    if (this.counters[metricName] !== undefined) {
      this.counters[metricName] += count
    }
  }

  getMetrics() {
    return {
      ...this.counters,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }
}

module.exports = new MetricsService()
