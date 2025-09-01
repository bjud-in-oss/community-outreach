/**
 * System Diagnostics Utility
 * 
 * Provides comprehensive system monitoring, diagnostics, and health checking
 * capabilities for the Community Outreach System.
 */

import { SystemHealthStatus, ComponentHealthStatus, SystemMetrics, DataFlowValidation } from '@/services/system-integration-service';

export interface DiagnosticReport {
  report_id: string;
  timestamp: Date;
  system_health: SystemHealthStatus;
  performance_metrics: SystemMetrics;
  data_flow_validations: DataFlowValidation[];
  recommendations: DiagnosticRecommendation[];
  severity: 'info' | 'warning' | 'critical';
}

export interface DiagnosticRecommendation {
  type: 'performance' | 'reliability' | 'security' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action_required: string;
  estimated_impact: string;
}

export interface SystemAlert {
  alert_id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolution_time?: Date;
}

class SystemDiagnostics {
  private alerts: SystemAlert[] = [];
  private maxAlertHistory = 1000;
  private alertThresholds = {
    response_time_ms: 2000,
    error_rate_percentage: 5,
    memory_usage_mb: 512,
    component_failure_count: 3
  };

  /**
   * Generate comprehensive diagnostic report
   */
  async generateDiagnosticReport(
    systemHealth: SystemHealthStatus,
    metrics: SystemMetrics,
    dataFlowValidations: DataFlowValidation[]
  ): Promise<DiagnosticReport> {
    const reportId = `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const recommendations = this.generateRecommendations(systemHealth, metrics, dataFlowValidations);
    const severity = this.calculateOverallSeverity(systemHealth, recommendations);

    return {
      report_id: reportId,
      timestamp: new Date(),
      system_health: systemHealth,
      performance_metrics: metrics,
      data_flow_validations: dataFlowValidations,
      recommendations,
      severity
    };
  }

  /**
   * Check system against alert thresholds and generate alerts
   */
  checkAlertConditions(health: SystemHealthStatus, metrics: SystemMetrics): SystemAlert[] {
    const newAlerts: SystemAlert[] = [];

    // Check response time threshold
    if (metrics.average_response_time_ms > this.alertThresholds.response_time_ms) {
      newAlerts.push(this.createAlert(
        'warning',
        'SystemPerformance',
        `Average response time (${metrics.average_response_time_ms}ms) exceeds threshold (${this.alertThresholds.response_time_ms}ms)`,
        { current_value: metrics.average_response_time_ms, threshold: this.alertThresholds.response_time_ms }
      ));
    }

    // Check error rate threshold
    if (metrics.error_rate_percentage > this.alertThresholds.error_rate_percentage) {
      newAlerts.push(this.createAlert(
        'error',
        'SystemReliability',
        `Error rate (${metrics.error_rate_percentage}%) exceeds threshold (${this.alertThresholds.error_rate_percentage}%)`,
        { current_value: metrics.error_rate_percentage, threshold: this.alertThresholds.error_rate_percentage }
      ));
    }

    // Check memory usage threshold
    if (metrics.memory_usage_mb > this.alertThresholds.memory_usage_mb) {
      newAlerts.push(this.createAlert(
        'warning',
        'SystemResources',
        `Memory usage (${metrics.memory_usage_mb}MB) exceeds threshold (${this.alertThresholds.memory_usage_mb}MB)`,
        { current_value: metrics.memory_usage_mb, threshold: this.alertThresholds.memory_usage_mb }
      ));
    }

    // Check component health
    const criticalComponents = health.components.filter(c => c.status === 'critical');
    if (criticalComponents.length > 0) {
      newAlerts.push(this.createAlert(
        'critical',
        'ComponentFailure',
        `${criticalComponents.length} component(s) in critical state: ${criticalComponents.map(c => c.component).join(', ')}`,
        { failed_components: criticalComponents.map(c => c.component) }
      ));
    }

    // Check overall system health
    if (health.overall_status === 'critical') {
      newAlerts.push(this.createAlert(
        'critical',
        'SystemHealth',
        'Overall system status is critical',
        { component_count: health.components.length, critical_count: criticalComponents.length }
      ));
    }

    // Add new alerts to history
    this.alerts.push(...newAlerts);
    this.trimAlertHistory();

    return newAlerts;
  }

  /**
   * Get system performance analysis
   */
  analyzePerformance(metrics: SystemMetrics[]): PerformanceAnalysis {
    if (metrics.length === 0) {
      return {
        trend: 'stable',
        average_response_time: 0,
        peak_memory_usage: 0,
        error_rate_trend: 'stable',
        recommendations: []
      };
    }

    const recent = metrics.slice(-10); // Last 10 data points
    const older = metrics.slice(-20, -10); // Previous 10 data points

    const recentAvgResponseTime = recent.reduce((sum, m) => sum + m.average_response_time_ms, 0) / recent.length;
    const olderAvgResponseTime = older.length > 0 ? older.reduce((sum, m) => sum + m.average_response_time_ms, 0) / older.length : recentAvgResponseTime;

    const recentAvgErrorRate = recent.reduce((sum, m) => sum + m.error_rate_percentage, 0) / recent.length;
    const olderAvgErrorRate = older.length > 0 ? older.reduce((sum, m) => sum + m.error_rate_percentage, 0) / older.length : recentAvgErrorRate;

    const peakMemoryUsage = Math.max(...metrics.map(m => m.memory_usage_mb));

    let trend: 'improving' | 'stable' | 'degrading';
    if (recentAvgResponseTime < olderAvgResponseTime * 0.9) {
      trend = 'improving';
    } else if (recentAvgResponseTime > olderAvgResponseTime * 1.1) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    let errorRateTrend: 'improving' | 'stable' | 'degrading';
    if (recentAvgErrorRate < olderAvgErrorRate * 0.9) {
      errorRateTrend = 'improving';
    } else if (recentAvgErrorRate > olderAvgErrorRate * 1.1) {
      errorRateTrend = 'degrading';
    } else {
      errorRateTrend = 'stable';
    }

    const recommendations: string[] = [];
    if (trend === 'degrading') {
      recommendations.push('Consider optimizing slow operations or scaling resources');
    }
    if (errorRateTrend === 'degrading') {
      recommendations.push('Investigate increasing error rates and implement fixes');
    }
    if (peakMemoryUsage > this.alertThresholds.memory_usage_mb) {
      recommendations.push('Monitor memory usage and consider memory optimization');
    }

    return {
      trend,
      average_response_time: recentAvgResponseTime,
      peak_memory_usage: peakMemoryUsage,
      error_rate_trend: errorRateTrend,
      recommendations
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): SystemAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.alert_id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolution_time = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get system status summary
   */
  getStatusSummary(health: SystemHealthStatus, metrics: SystemMetrics): SystemStatusSummary {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

    return {
      overall_status: health.overall_status,
      uptime_seconds: health.uptime_seconds,
      active_components: health.components.filter(c => c.status === 'healthy').length,
      total_components: health.components.length,
      current_response_time: metrics.average_response_time_ms,
      current_error_rate: metrics.error_rate_percentage,
      memory_usage_mb: metrics.memory_usage_mb,
      active_agents: metrics.active_agents,
      critical_alerts: criticalAlerts.length,
      warning_alerts: warningAlerts.length,
      last_updated: new Date()
    };
  }

  // Private helper methods

  private generateRecommendations(
    health: SystemHealthStatus,
    metrics: SystemMetrics,
    validations: DataFlowValidation[]
  ): DiagnosticRecommendation[] {
    const recommendations: DiagnosticRecommendation[] = [];

    // Performance recommendations
    if (metrics.average_response_time_ms > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        description: 'System response time is elevated',
        action_required: 'Investigate slow operations and optimize performance bottlenecks',
        estimated_impact: 'Improved user experience and system responsiveness'
      });
    }

    // Reliability recommendations
    const degradedComponents = health.components.filter(c => c.status === 'degraded');
    if (degradedComponents.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        description: `${degradedComponents.length} component(s) in degraded state`,
        action_required: `Investigate and fix issues in: ${degradedComponents.map(c => c.component).join(', ')}`,
        estimated_impact: 'Improved system stability and reduced error rates'
      });
    }

    // Security recommendations
    if (metrics.error_rate_percentage > 2) {
      recommendations.push({
        type: 'security',
        priority: 'medium',
        description: 'Elevated error rate may indicate security issues',
        action_required: 'Review error logs for potential security threats or attacks',
        estimated_impact: 'Enhanced system security and data protection'
      });
    }

    // Maintenance recommendations
    if (health.uptime_seconds > 86400 * 7) { // 7 days
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        description: 'System has been running for an extended period',
        action_required: 'Consider scheduled maintenance window for updates and cleanup',
        estimated_impact: 'Preventive maintenance and system optimization'
      });
    }

    // Data flow recommendations
    const failedValidations = validations.filter(v => v.validation_status === 'failed');
    if (failedValidations.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        description: `${failedValidations.length} data flow validation(s) failed`,
        action_required: 'Investigate and fix data flow issues between components',
        estimated_impact: 'Restored system functionality and data integrity'
      });
    }

    return recommendations;
  }

  private calculateOverallSeverity(
    health: SystemHealthStatus,
    recommendations: DiagnosticRecommendation[]
  ): 'info' | 'warning' | 'critical' {
    if (health.overall_status === 'critical') {
      return 'critical';
    }

    const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
    if (criticalRecommendations.length > 0) {
      return 'critical';
    }

    const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecommendations.length > 0 || health.overall_status === 'degraded') {
      return 'warning';
    }

    return 'info';
  }

  private createAlert(
    severity: 'info' | 'warning' | 'error' | 'critical',
    component: string,
    message: string,
    details?: Record<string, any>
  ): SystemAlert {
    return {
      alert_id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      component,
      message,
      details,
      resolved: false
    };
  }

  private trimAlertHistory(): void {
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertHistory);
    }
  }
}

export interface PerformanceAnalysis {
  trend: 'improving' | 'stable' | 'degrading';
  average_response_time: number;
  peak_memory_usage: number;
  error_rate_trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
}

export interface SystemStatusSummary {
  overall_status: 'healthy' | 'degraded' | 'critical';
  uptime_seconds: number;
  active_components: number;
  total_components: number;
  current_response_time: number;
  current_error_rate: number;
  memory_usage_mb: number;
  active_agents: number;
  critical_alerts: number;
  warning_alerts: number;
  last_updated: Date;
}

export const systemDiagnostics = new SystemDiagnostics();