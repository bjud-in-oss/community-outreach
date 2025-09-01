/**
 * System Process API Endpoint
 * 
 * Provides REST API access to the integrated system processing pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { systemIntegrationService } from '@/services/system-integration-service';
import { UserInput, AgentResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input structure
    if (!body.text || !body.type) {
      return NextResponse.json(
        { error: 'Invalid input: text and type are required' },
        { status: 400 }
      );
    }

    // Create UserInput object
    const userInput: UserInput = {
      text: body.text,
      type: body.type,
      context: body.context || {},
      timestamp: new Date()
    };

    // Process through integrated system
    const response = await systemIntegrationService.processUserInput(userInput);

    return NextResponse.json({
      success: true,
      response,
      processing_time: Date.now() - userInput.timestamp.getTime()
    });

  } catch (error) {
    console.error('System process API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process user input',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return system processing capabilities and status
    const health = await systemIntegrationService.getSystemHealth();
    const metrics = systemIntegrationService.getSystemMetrics();

    return NextResponse.json({
      status: 'operational',
      capabilities: {
        cognitive_agents: true,
        memory_management: true,
        chronicler_service: true,
        collaboration_service: true,
        empatibryggan_service: true,
        legacy_system_service: true,
        minnenas_bok_service: true,
        suggestion_service: true
      },
      system_health: health.overall_status,
      active_agents: metrics.active_agents,
      average_response_time: metrics.average_response_time_ms,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('System process API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system status' },
      { status: 500 }
    );
  }
}