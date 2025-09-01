/**
 * System Health API Endpoint
 * 
 * Provides REST API access to system health monitoring and diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { systemIntegrationService } from '@/services/system-integration-service';
import { systemDiagnostics } from '@/lib/system-diagnostics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeDiagnostics = searchParams.get('diagnostics') === 'true';
    const includeAlerts = searchParams.get('alerts') === 'true';

    // Get system health
    const health = await systemIntegrationService.getSystemHealth();
    
    const response: any = {
      health,
      timestamp: new Date().toISOString()
    };

    // Include metrics if requested
    if (includeMetrics) {
      response.metrics = systemIntegrationService.getSystemMetrics();
    }

    // Include diagnostics if requested
    if (includeDiagnostics) {
      const dataFlowValidations = await systemIntegrationService.validateDataFlow();
      response.diagnostics = await systemDiagnostics.generateDiagnosticReport(
        health,
        systemIntegrationService.getSystemMetrics(),
        dataFlowValidations
      );
    }

    // Include alerts if requested
    if (includeAlerts) {
      response.alerts = {
        active: systemDiagnostics.getActiveAlerts(),
        recent: systemDiagnostics.getAlertHistory(10)
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('System health API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system health' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'refresh':
        // Force refresh of system health data
        const health = await systemIntegrationService.getSystemHealth();
        return NextResponse.json({ health, refreshed: true });

      case 'validate_dataflow':
        // Validate data flow between components
        const validations = await systemIntegrationService.validateDataFlow();
        return NextResponse.json({ validations });

      case 'resolve_alert':
        // Resolve a specific alert
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }
        const resolved = systemDiagnostics.resolveAlert(alertId);
        return NextResponse.json({ resolved, alertId });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('System health API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}