'use client';

/**
 * System Health Monitor Component
 * 
 * Provides real-time system health monitoring and diagnostics
 * for the Architect View control interface.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { systemIntegrationService } from '@/services/system-integration-service';
import { systemDiagnostics } from '@/lib/system-diagnostics';
import type { 
  SystemHealthStatus, 
  SystemMetrics
} from '@/services/system-integration-service';
import type {
  DiagnosticReport,
  SystemAlert
} from '@/lib/system-diagnostics';

interface SystemHealthMonitorProps {
  refreshInterval?: number;
  showDetailedMetrics?: boolean;
}

export function SystemHealthMonitor({ 
  refreshInterval = 30000, 
  showDetailedMetrics = true 
}: SystemHealthMonitorProps) {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [statusSummary, setStatusSummary] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refresh system data
  const refreshSystemData = async () => {
    try {
      setIsLoading(true);
      
      // Get current system health and metrics
      const [health, currentMetrics] = await Promise.all([
        systemIntegrationService.getSystemHealth(),
        Promise.resolve(systemIntegrationService.getSystemMetrics())
      ]);

      setHealthStatus(health);
      setMetrics(currentMetrics);

      // Generate diagnostic report
      const dataFlowValidations = await systemIntegrationService.validateDataFlow();
      const report = await systemDiagnostics.generateDiagnosticReport(
        health,
        currentMetrics,
        dataFlowValidations
      );
      setDiagnosticReport(report);

      // Get status summary
      const summary = systemDiagnostics.getStatusSummary(health, currentMetrics);
      setStatusSummary(summary);

      // Check for new alerts
      const newAlerts = systemDiagnostics.checkAlertConditions(health, currentMetrics);
      setActiveAlerts(systemDiagnostics.getActiveAlerts());

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    refreshSystemData();
    
    const interval = setInterval(refreshSystemData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Alert severity color helper
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading && !healthStatus) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">System Health Overview</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshSystemData}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {statusSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(statusSummary.overall_status)}`}>
                {statusSummary.overall_status.toUpperCase()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Overall Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {statusSummary.active_components}/{statusSummary.total_components}
              </div>
              <p className="text-sm text-gray-600">Active Components</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {statusSummary.current_response_time}ms
              </div>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {statusSummary.active_agents}
              </div>
              <p className="text-sm text-gray-600">Active Agents</p>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Active Alerts</h4>
            <div className="space-y-2">
              {activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getAlertColor(alert.severity)} text-white`}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{alert.component}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {activeAlerts.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{activeAlerts.length - 5} more alerts
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Component Health Details */}
      {healthStatus && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Component Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthStatus.components.map((component) => (
              <div key={component.component} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{component.component}</h4>
                  <Badge className={`${getStatusColor(component.status)} text-white`}>
                    {component.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {component.response_time_ms && (
                    <p>Response: {component.response_time_ms}ms</p>
                  )}
                  <p>Errors: {component.error_count}</p>
                  <p>Last Check: {component.last_check.toLocaleTimeString()}</p>
                  {component.last_error && (
                    <p className="text-red-600 text-xs">
                      Last Error: {component.last_error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      {showDetailedMetrics && metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {metrics.memory_usage_mb}MB
              </div>
              <p className="text-sm text-gray-600">Memory Usage</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {metrics.request_count_per_minute}
              </div>
              <p className="text-sm text-gray-600">Requests/Min</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {metrics.average_response_time_ms}ms
              </div>
              <p className="text-sm text-gray-600">Avg Response</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {metrics.error_rate_percentage}%
              </div>
              <p className="text-sm text-gray-600">Error Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {metrics.active_agents}
              </div>
              <p className="text-sm text-gray-600">Active Agents</p>
            </div>
          </div>
        </Card>
      )}

      {/* Diagnostic Recommendations */}
      {diagnosticReport && diagnosticReport.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Recommendations</h3>
          <div className="space-y-3">
            {diagnosticReport.recommendations.map((rec, index) => (
              <div key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{rec.type}</h4>
                  <Badge variant={rec.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {rec.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Action Required: {rec.action_required}
                </p>
                <p className="text-sm text-gray-600">
                  Expected Impact: {rec.estimated_impact}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}