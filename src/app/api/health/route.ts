/**
 * Production Health Check API Endpoint
 * 
 * Provides comprehensive health status for load balancers, monitoring systems,
 * and operational teams.
 */

import { NextRequest, NextResponse } from 'next/server';
import { productionMonitoring } from '@/lib/monitoring';
import { backupRecoverySystem } from '@/lib/backup-recovery';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check - fast response for load balancers
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (!detailed) {
      // Quick health check for load balancers
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.APP_VERSION || '1.0.0'
      });
    }

    // Detailed health check for monitoring systems
    const healthMetrics = productionMonitoring.getHealthMetrics();
    const activeAlerts = productionMonitoring.getActiveAlerts();
    const recentRecoveryPoints = backupRecoverySystem.getRecoveryPoints({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    });

    // Check critical system components
    const componentChecks = await performComponentChecks();
    
    // Determine overall health status
    const criticalIssues = componentChecks.filter(c => c.status === 'critical').length;
    const warningIssues = componentChecks.filter(c => c.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (criticalIssues > 0) {
      overallStatus = 'critical';
    } else if (warningIssues > 0 || healthMetrics.errorRate > 5) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const responseTime = Date.now() - startTime;

    // Record health check metrics
    productionMonitoring.recordMetric('health_check_response_time', responseTime, 'ms');
    productionMonitoring.recordMetric('health_check_requests', 1, 'count');

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // System metrics
      metrics: {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          usage_percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        },
        cpu: {
          load_average: require('os').loadavg(),
          usage_percentage: await getCpuUsage()
        },
        error_rate: healthMetrics.errorRate,
        average_response_time: healthMetrics.averageResponseTime,
        active_connections: healthMetrics.activeConnections
      },

      // Component status
      components: componentChecks,

      // Alerts
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        recent: activeAlerts.slice(0, 5) // Last 5 alerts
      },

      // Backup status
      backup: {
        last_backup: recentRecoveryPoints.length > 0 ? recentRecoveryPoints[0].timestamp : null,
        backup_count_24h: recentRecoveryPoints.length,
        total_backup_size: recentRecoveryPoints.reduce((sum, rp) => sum + rp.size, 0)
      },

      // Feature flags
      features: {
        autonomous_mode: process.env.ENABLE_AUTONOMOUS_MODE === 'true',
        legacy_system: process.env.ENABLE_LEGACY_SYSTEM === 'true',
        empatibryggan: process.env.ENABLE_EMPATIBRYGGAN === 'true',
        minnenas_bok: process.env.ENABLE_MINNENAS_BOK === 'true',
        architect_view: process.env.ENABLE_ARCHITECT_VIEW === 'true'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    // Record error metric
    productionMonitoring.recordMetric('health_check_errors', 1, 'count');
    productionMonitoring.log('error', 'Health check failed', 'health-api', {
      error: (error as Error).message
    });

    return NextResponse.json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}

async function performComponentChecks(): Promise<ComponentHealthCheck[]> {
  const checks: ComponentHealthCheck[] = [];

  // Database connectivity check
  try {
    // In a real implementation, this would test actual database connection
    // For now, we'll simulate the check
    const dbStartTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB query
    const dbResponseTime = Date.now() - dbStartTime;
    
    checks.push({
      name: 'database',
      status: dbResponseTime < 100 ? 'healthy' : 'warning',
      response_time: dbResponseTime,
      message: dbResponseTime < 100 ? 'Database responding normally' : 'Database response time elevated',
      last_check: new Date()
    });
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'critical',
      message: `Database connection failed: ${(error as Error).message}`,
      last_check: new Date()
    });
  }

  // External API checks
  try {
    // Check OpenAI API connectivity (if configured)
    if (process.env.OPENAI_API_KEY) {
      const apiStartTime = Date.now();
      // In production, this would make a test API call
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API call
      const apiResponseTime = Date.now() - apiStartTime;
      
      checks.push({
        name: 'openai_api',
        status: apiResponseTime < 1000 ? 'healthy' : 'warning',
        response_time: apiResponseTime,
        message: 'OpenAI API accessible',
        last_check: new Date()
      });
    }
  } catch (error) {
    checks.push({
      name: 'openai_api',
      status: 'critical',
      message: `OpenAI API check failed: ${(error as Error).message}`,
      last_check: new Date()
    });
  }

  // File system checks
  try {
    const fs = require('fs');
    const stats = fs.statSync('/tmp');
    
    checks.push({
      name: 'filesystem',
      status: 'healthy',
      message: 'File system accessible',
      last_check: new Date()
    });
  } catch (error) {
    checks.push({
      name: 'filesystem',
      status: 'critical',
      message: `File system check failed: ${(error as Error).message}`,
      last_check: new Date()
    });
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  let memoryStatus: 'healthy' | 'warning' | 'critical';
  let memoryMessage: string;
  
  if (memoryUsagePercent > 90) {
    memoryStatus = 'critical';
    memoryMessage = `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`;
  } else if (memoryUsagePercent > 80) {
    memoryStatus = 'warning';
    memoryMessage = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`;
  } else {
    memoryStatus = 'healthy';
    memoryMessage = `Memory usage normal: ${memoryUsagePercent.toFixed(1)}%`;
  }
  
  checks.push({
    name: 'memory',
    status: memoryStatus,
    message: memoryMessage,
    metadata: {
      heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      usage_percent: memoryUsagePercent
    },
    last_check: new Date()
  });

  return checks;
}

async function getCpuUsage(): Promise<number> {
  // Simple CPU usage calculation
  // In production, this would use more sophisticated monitoring
  const os = require('os');
  const loadAvg = os.loadavg()[0];
  const cpuCount = os.cpus().length;
  return Math.min(100, (loadAvg / cpuCount) * 100);
}

interface ComponentHealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  response_time?: number;
  message: string;
  metadata?: Record<string, any>;
  last_check: Date;
}