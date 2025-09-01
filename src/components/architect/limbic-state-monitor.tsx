'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserState, AgentState, RelationalDelta } from '@/types';

/**
 * Limbic state data point for visualization
 */
export interface LimbicStatePoint {
  timestamp: Date;
  userState: UserState;
  agentState: AgentState;
  relationalDelta: RelationalDelta;
}

/**
 * Props for the Limbic State Monitor
 */
export interface LimbicStateMonitorProps {
  /** Whether to auto-refresh the data */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Maximum number of data points to keep */
  maxDataPoints?: number;
}

/**
 * Limbic State Monitor Component
 * Shows real-time graph of User_State, Agent_State, and Relational_Delta
 */
export function LimbicStateMonitor({
  autoRefresh = true,
  refreshInterval = 1000,
  maxDataPoints = 50
}: LimbicStateMonitorProps) {
  const [dataPoints, setDataPoints] = useState<LimbicStatePoint[]>([]);
  const [currentState, setCurrentState] = useState<LimbicStatePoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'fight' | 'flight' | 'fixes' | 'resonance' | 'confidence' | 'delta'>('fight');

  // Generate mock data for demonstration
  const generateMockDataPoint = (): LimbicStatePoint => {
    const now = new Date();
    
    // Generate realistic fluctuating values
    const baseTime = now.getTime();
    const variation = Math.sin(baseTime / 10000) * 0.3 + Math.random() * 0.2 - 0.1;
    
    const userState: UserState = {
      fight: Math.max(0, Math.min(1, 0.3 + variation)),
      flight: Math.max(0, Math.min(1, 0.2 + variation * 0.5)),
      fixes: Math.max(0, Math.min(1, 0.7 + variation * 0.8)),
      timestamp: now,
      confidence: Math.max(0, Math.min(1, 0.8 + variation * 0.3))
    };

    const agentState: AgentState = {
      cognitive_phase: ['EMERGE', 'ADAPT', 'INTEGRATE'][Math.floor(Math.random() * 3)] as any,
      resonance: Math.max(0, Math.min(1, 0.6 + variation * 0.4)),
      confidence: Math.max(0, Math.min(1, 0.75 + variation * 0.25)),
      timestamp: now
    };

    const relationalDelta: RelationalDelta = {
      asynchronous_delta: Math.abs(userState.fixes - agentState.confidence) * 0.8,
      synchronous_delta: Math.min(userState.confidence, agentState.resonance),
      magnitude: Math.sqrt(Math.pow(userState.fight - 0.5, 2) + Math.pow(userState.flight - 0.5, 2)),
      strategy: userState.fight > 0.6 ? 'listen' : userState.fixes > 0.6 ? 'harmonize' : 'mirror'
    };

    return {
      timestamp: now,
      userState,
      agentState,
      relationalDelta
    };
  };

  // Fetch new data point
  const fetchNewDataPoint = async () => {
    const newPoint = generateMockDataPoint();
    
    setDataPoints(prev => {
      const updated = [...prev, newPoint];
      return updated.slice(-maxDataPoints); // Keep only recent points
    });
    
    setCurrentState(newPoint);
    setIsLoading(false);
  };

  useEffect(() => {
    // Initial load
    fetchNewDataPoint();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchNewDataPoint, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getValueColor = (value: number, type: 'positive' | 'negative' | 'neutral' = 'neutral'): string => {
    if (type === 'positive') {
      return value > 0.7 ? 'text-green-600' : value > 0.4 ? 'text-yellow-600' : 'text-red-600';
    } else if (type === 'negative') {
      return value > 0.7 ? 'text-red-600' : value > 0.4 ? 'text-yellow-600' : 'text-green-600';
    }
    return 'text-gray-600';
  };

  const getStrategyColor = (strategy: string): string => {
    switch (strategy) {
      case 'mirror': return 'bg-blue-100 text-blue-800';
      case 'harmonize': return 'bg-green-100 text-green-800';
      case 'listen': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  const renderMiniGraph = (values: number[], color: string) => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    return (
      <div className="flex items-end h-12 space-x-1">
        {values.slice(-20).map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className={`w-1 ${color} opacity-70`}
              style={{ height: `${Math.max(2, height)}%` }}
            />
          );
        })}
      </div>
    );
  };

  if (!currentState) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading limbic state data...</p>
        </CardContent>
      </Card>
    );
  }

  const userValues = dataPoints.map(p => p.userState[selectedMetric as keyof UserState] as number);
  const agentValues = dataPoints.map(p => {
    if (selectedMetric === 'resonance' || selectedMetric === 'confidence') {
      return p.agentState[selectedMetric];
    }
    return 0;
  });
  const deltaValues = dataPoints.map(p => p.relationalDelta.magnitude);

  return (
    <div className="space-y-6">
      {/* Current State Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              🧑 User State
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FIGHT</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.userState.fight, 'negative')}`}>
                  {formatValue(currentState.userState.fight)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FLIGHT</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.userState.flight, 'negative')}`}>
                  {formatValue(currentState.userState.flight)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FIXES</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.userState.fixes, 'positive')}`}>
                  {formatValue(currentState.userState.fixes)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Confidence</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.userState.confidence, 'positive')}`}>
                  {formatValue(currentState.userState.confidence)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              🤖 Agent State
              <Badge className="ml-2 bg-green-100 text-green-800">
                {currentState.agentState.cognitive_phase}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Phase</span>
                <Badge className="bg-gray-100 text-gray-800">
                  {currentState.agentState.cognitive_phase}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resonance</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.agentState.resonance, 'positive')}`}>
                  {formatValue(currentState.agentState.resonance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Confidence</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.agentState.confidence, 'positive')}`}>
                  {formatValue(currentState.agentState.confidence)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relational Delta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              🔗 Relational Delta
              <Badge className={`ml-2 ${getStrategyColor(currentState.relationalDelta.strategy)}`}>
                {currentState.relationalDelta.strategy}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Async Δ</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.relationalDelta.asynchronous_delta, 'negative')}`}>
                  {formatValue(currentState.relationalDelta.asynchronous_delta)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sync Δ</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.relationalDelta.synchronous_delta, 'positive')}`}>
                  {formatValue(currentState.relationalDelta.synchronous_delta)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Magnitude</span>
                <span className={`text-lg font-bold ${getValueColor(currentState.relationalDelta.magnitude, 'neutral')}`}>
                  {formatValue(currentState.relationalDelta.magnitude)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Strategy</span>
                <Badge className={getStrategyColor(currentState.relationalDelta.strategy)}>
                  {currentState.relationalDelta.strategy.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Historical Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="fight">FIGHT</option>
                <option value="flight">FLIGHT</option>
                <option value="fixes">FIXES</option>
                <option value="resonance">Resonance</option>
                <option value="confidence">Confidence</option>
                <option value="delta">Delta Magnitude</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNewDataPoint}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User metric trend */}
            {(selectedMetric === 'fight' || selectedMetric === 'flight' || selectedMetric === 'fixes' || selectedMetric === 'confidence') && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  User {selectedMetric.toUpperCase()}
                </h4>
                {renderMiniGraph(userValues, 'bg-blue-500')}
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatValue(currentState.userState[selectedMetric as keyof UserState] as number)}
                </p>
              </div>
            )}

            {/* Agent metric trend */}
            {(selectedMetric === 'resonance' || selectedMetric === 'confidence') && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Agent {selectedMetric.toUpperCase()}
                </h4>
                {renderMiniGraph(agentValues, 'bg-green-500')}
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatValue(currentState.agentState[selectedMetric])}
                </p>
              </div>
            )}

            {/* Delta magnitude trend */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Delta Magnitude
              </h4>
              {renderMiniGraph(deltaValues, 'bg-purple-500')}
              <p className="text-xs text-gray-500 mt-1">
                Current: {formatValue(currentState.relationalDelta.magnitude)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {dataPoints.length}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {autoRefresh ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-gray-600">Auto Refresh</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {refreshInterval}ms
              </div>
              <div className="text-sm text-gray-600">Refresh Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {currentState.timestamp.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">Last Update</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LimbicStateMonitor;