/**
 * Production Monitoring and Logging System
 * 
 * Provides comprehensive monitoring, logging, and alerting capabilities
 * for production deployment of the Community Outreach System.
 */

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  component: string;
  metadata?: Record<string, any>;
  traceId?: string;
  userId?: string;
  sessionId?: string;
}

export interface MetricEntry {
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

class ProductionMonitoring {
  private logs: LogEntry[] = [];
  private metrics: MetricEntry[] = [];
  private alerts: AlertNotification[] = [];
  private alertRules: AlertRule[] = [];
  private maxLogHistory = 10000;
  private maxMetricHistory = 50000;
  private maxAlertHistory = 1000;

  constructor() {
    this.initializeDefaultAlertRules();
    this.startPeriodicCleanup();
  }

  /**
   * Log a message with specified level and metadata
   */
  log(
    level: LogEntry['level'],
    message: string,
    component: string,
    metadata?: Record<string, any>,
    traceId?: string,
    userId?: string,
    sessionId?: string
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      component,
      metadata,
      traceId,
      userId,
      sessionId
    };

    this.logs.push(logEntry);
    this.trimLogHistory();

    // Output to console in production format
    this.outputLog(logEntry);

    // Check for alert conditions
    if (level === 'error' || level === 'critical') {
      this.checkAlertConditions('error_rate', 1);
    }
  }

  /**
   * Record a metric value
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const metricEntry: MetricEntry = {
      timestamp: new Date(),
      name,
      value,
      unit,
      tags
    };

    this.metrics.push(metricEntry);
    this.trimMetricHistory();

    // Check for alert conditions based on metrics
    this.checkAlertConditions(name, value);
  }

  /**
   * Add or update an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    const existingIndex = this.alertRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule;
    } else {
      this.alertRules.push(rule);
    }
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics(): {
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    activeConnections: number;
    uptime: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Calculate error rate from recent logs
    const recentLogs = this.logs.filter(log => log.timestamp.getTime() > oneHourAgo);
    const errorLogs = recentLogs.filter(log => log.level === 'error' || log.level === 'critical');
    const errorRate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;

    // Calculate average response time from metrics
    const responseTimeMetrics = this.metrics.filter(
      m => m.name === 'response_time' && m.timestamp.getTime() > oneHourAgo
    );
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    // Get memory usage
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    // Mock active connections (would be real in production)
    const activeConnections = 0;

    // Calculate uptime
    const uptime = Math.floor(process.uptime());

    return {
      errorRate,
      averageResponseTime,
      memoryUsage,
      activeConnections,
      uptime
    };
  }

  /**
   * Get recent logs with optional filtering
   */
  getLogs(
    level?: LogEntry['level'],
    component?: string,
    limit: number = 100
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    return filteredLogs.slice(-limit);
  }

  /**
   * Get metrics with optional filtering
   */
  getMetrics(
    name?: string,
    timeRange?: { start: Date; end: Date },
    limit: number = 1000
  ): MetricEntry[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === name);
    }

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    return filteredMetrics.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertNotification[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Export logs and metrics for external monitoring systems
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      logs: this.logs.slice(-1000), // Last 1000 logs
      metrics: this.metrics.slice(-5000), // Last 5000 metrics
      alerts: this.alerts.slice(-100), // Last 100 alerts
      timestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for logs
      const csvLines = ['timestamp,level,component,message'];
      data.logs.forEach(log => {
        csvLines.push(`${log.timestamp.toISOString()},${log.level},${log.component},"${log.message}"`);
      });
      return csvLines.join('\n');
    }
  }

  // Private helper methods

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate > threshold',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldownMs: 300000 // 5 minutes
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: 'response_time > threshold',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        cooldownMs: 300000
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: 'memory_usage > threshold',
        threshold: 1500, // MB
        severity: 'medium',
        enabled: true,
        cooldownMs: 600000 // 10 minutes
      },
      {
        id: 'system-critical-error',
        name: 'System Critical Error',
        condition: 'critical_error_count > threshold',
        threshold: 1,
        severity: 'critical',
        enabled: true,
        cooldownMs: 0 // No cooldown for critical errors
      }
    ];
  }

  private checkAlertConditions(metricName: string, value: number): void {
    const now = new Date();

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown
      if (rule.lastTriggered && 
          (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldownMs) {
        return;
      }

      let shouldTrigger = false;

      // Simple threshold-based alerting
      switch (rule.condition) {
        case 'error_rate > threshold':
          if (metricName === 'error_rate' && value > rule.threshold) {
            shouldTrigger = true;
          }
          break;
        case 'response_time > threshold':
          if (metricName === 'response_time' && value > rule.threshold) {
            shouldTrigger = true;
          }
          break;
        case 'memory_usage > threshold':
          if (metricName === 'memory_usage' && value > rule.threshold) {
            shouldTrigger = true;
          }
          break;
        case 'critical_error_count > threshold':
          if (metricName === 'error_rate' && value >= rule.threshold) {
            shouldTrigger = true;
          }
          break;
      }

      if (shouldTrigger) {
        this.triggerAlert(rule, value);
      }
    });
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    const alert: AlertNotification = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${rule.condition.replace('threshold', rule.threshold.toString())} (current: ${value})`,
      timestamp: new Date(),
      resolved: false,
      metadata: { value, threshold: rule.threshold }
    };

    this.alerts.push(alert);
    this.trimAlertHistory();

    rule.lastTriggered = new Date();

    // Log the alert
    this.log('error', `Alert triggered: ${alert.message}`, 'monitoring', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity
    });

    // In production, this would send notifications via email, Slack, etc.
    console.error(`🚨 ALERT [${rule.severity.toUpperCase()}]: ${alert.message}`);
  }

  private outputLog(logEntry: LogEntry): void {
    const logObject = {
      timestamp: logEntry.timestamp.toISOString(),
      level: logEntry.level,
      component: logEntry.component,
      message: logEntry.message,
      ...(logEntry.metadata && { metadata: logEntry.metadata }),
      ...(logEntry.traceId && { traceId: logEntry.traceId }),
      ...(logEntry.userId && { userId: logEntry.userId }),
      ...(logEntry.sessionId && { sessionId: logEntry.sessionId })
    };

    // In production, this would go to a proper logging service
    if (logEntry.level === 'error' || logEntry.level === 'critical') {
      console.error(JSON.stringify(logObject));
    } else if (logEntry.level === 'warn') {
      console.warn(JSON.stringify(logObject));
    } else {
      console.log(JSON.stringify(logObject));
    }
  }

  private trimLogHistory(): void {
    if (this.logs.length > this.maxLogHistory) {
      this.logs = this.logs.slice(-this.maxLogHistory);
    }
  }

  private trimMetricHistory(): void {
    if (this.metrics.length > this.maxMetricHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricHistory);
    }
  }

  private trimAlertHistory(): void {
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertHistory);
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up old data every hour
    setInterval(() => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Remove old logs
      this.logs = this.logs.filter(log => log.timestamp > oneWeekAgo);
      
      // Remove old metrics
      this.metrics = this.metrics.filter(metric => metric.timestamp > oneWeekAgo);
      
      // Remove old resolved alerts
      this.alerts = this.alerts.filter(alert => 
        !alert.resolved || (alert.resolvedAt && alert.resolvedAt > oneWeekAgo)
      );
    }, 60 * 60 * 1000); // Every hour
  }
}

// Export singleton instance
export const productionMonitoring = new ProductionMonitoring();

// Convenience logging functions
export const logger = {
  debug: (message: string, component: string, metadata?: Record<string, any>) => 
    productionMonitoring.log('debug', message, component, metadata),
  
  info: (message: string, component: string, metadata?: Record<string, any>) => 
    productionMonitoring.log('info', message, component, metadata),
  
  warn: (message: string, component: string, metadata?: Record<string, any>) => 
    productionMonitoring.log('warn', message, component, metadata),
  
  error: (message: string, component: string, metadata?: Record<string, any>) => 
    productionMonitoring.log('error', message, component, metadata),
  
  critical: (message: string, component: string, metadata?: Record<string, any>) => 
    productionMonitoring.log('critical', message, component, metadata)
};