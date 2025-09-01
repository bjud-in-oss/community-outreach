'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentRole, CognitivePhase, AgentStatus } from '@/types';

/**
 * Agent node data for visualization
 */
export interface AgentNode {
  id: string;
  role: AgentRole;
  phase: CognitivePhase;
  active: boolean;
  childCount: number;
  parentId?: string;
  taskDefinition?: string;
  resourceUsage: {
    llmCalls: number;
    computeUnits: number;
    storageBytes: number;
    executionTime: number;
  };
  lastActivity: Date;
  depth: number;
}

/**
 * Props for the Agent Hierarchy Visualizer
 */
export interface AgentHierarchyVisualizerProps {
  /** Whether to auto-refresh the hierarchy */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Callback when an agent is selected */
  onAgentSelect?: (agent: AgentNode) => void;
}

/**
 * Agent Hierarchy Visualizer Component
 * Shows a real-time tree of all active agents, their roles, and current phases
 */
export function AgentHierarchyVisualizer({
  autoRefresh = true,
  refreshInterval = 2000,
  onAgentSelect
}: AgentHierarchyVisualizerProps) {
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data for demonstration
  const mockAgents: AgentNode[] = [
    {
      id: 'coordinator-001',
      role: 'Coordinator',
      phase: 'EMERGE',
      active: true,
      childCount: 2,
      taskDefinition: 'Main system coordination',
      resourceUsage: {
        llmCalls: 45,
        computeUnits: 230,
        storageBytes: 5120,
        executionTime: 125000
      },
      lastActivity: new Date(Date.now() - 30000),
      depth: 0
    },
    {
      id: 'conscious-001',
      role: 'Conscious',
      phase: 'INTEGRATE',
      active: true,
      childCount: 0,
      parentId: 'coordinator-001',
      taskDefinition: 'User interaction handling',
      resourceUsage: {
        llmCalls: 12,
        computeUnits: 67,
        storageBytes: 2048,
        executionTime: 45000
      },
      lastActivity: new Date(Date.now() - 5000),
      depth: 1
    },
    {
      id: 'core-001',
      role: 'Core',
      phase: 'ADAPT',
      active: true,
      childCount: 1,
      parentId: 'coordinator-001',
      taskDefinition: 'Memory processing task',
      resourceUsage: {
        llmCalls: 8,
        computeUnits: 34,
        storageBytes: 1024,
        executionTime: 22000
      },
      lastActivity: new Date(Date.now() - 15000),
      depth: 1
    },
    {
      id: 'core-002',
      role: 'Core',
      phase: 'EMERGE',
      active: true,
      childCount: 0,
      parentId: 'core-001',
      taskDefinition: 'Data validation subtask',
      resourceUsage: {
        llmCalls: 3,
        computeUnits: 12,
        storageBytes: 512,
        executionTime: 8000
      },
      lastActivity: new Date(Date.now() - 2000),
      depth: 2
    }
  ];

  // Simulate fetching agent data
  const fetchAgentData = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would fetch from the agent system
    setAgents(mockAgents);
    setLastUpdate(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAgentData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleAgentClick = (agent: AgentNode) => {
    setSelectedAgent(agent);
    onAgentSelect?.(agent);
  };

  const getPhaseColor = (phase: CognitivePhase): string => {
    switch (phase) {
      case 'EMERGE': return 'bg-green-100 text-green-800';
      case 'ADAPT': return 'bg-yellow-100 text-yellow-800';
      case 'INTEGRATE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: AgentRole): string => {
    switch (role) {
      case 'Coordinator': return 'bg-purple-100 text-purple-800';
      case 'Conscious': return 'bg-indigo-100 text-indigo-800';
      case 'Core': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatLastActivity = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const renderAgentNode = (agent: AgentNode) => {
    const isSelected = selectedAgent?.id === agent.id;
    const indentClass = `ml-${agent.depth * 6}`;
    
    return (
      <div key={agent.id} className={`${indentClass} mb-2`}>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleAgentClick(agent)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Connection line for child agents */}
                {agent.depth > 0 && (
                  <div className="w-4 h-px bg-gray-300 mr-2" />
                )}
                
                {/* Agent status indicator */}
                <div className={`w-3 h-3 rounded-full ${
                  agent.active ? 'bg-green-500' : 'bg-red-500'
                }`} />
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {agent.id}
                    </span>
                    <Badge className={getRoleColor(agent.role)}>
                      {agent.role}
                    </Badge>
                    <Badge className={getPhaseColor(agent.phase)}>
                      {agent.phase}
                    </Badge>
                  </div>
                  
                  {agent.taskDefinition && (
                    <p className="text-sm text-gray-600 mt-1">
                      {agent.taskDefinition}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-500">
                <div>Children: {agent.childCount}</div>
                <div>Last: {formatLastActivity(agent.lastActivity)}</div>
              </div>
            </div>
            
            {/* Resource usage summary */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-600">
              <div>LLM: {agent.resourceUsage.llmCalls}</div>
              <div>CPU: {agent.resourceUsage.computeUnits}</div>
              <div>Storage: {Math.round(agent.resourceUsage.storageBytes / 1024)}KB</div>
              <div>Time: {formatDuration(agent.resourceUsage.executionTime)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Active Agents ({agents.length})
          </h3>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgentData}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      {/* Agent hierarchy tree */}
      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading agent hierarchy...</p>
            </CardContent>
          </Card>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No active agents found</p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {agents.map(renderAgentNode)}
          </div>
        )}
      </div>

      {/* Selected agent details */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Info</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">ID:</span> {selectedAgent.id}</div>
                  <div><span className="font-medium">Role:</span> {selectedAgent.role}</div>
                  <div><span className="font-medium">Phase:</span> {selectedAgent.phase}</div>
                  <div><span className="font-medium">Status:</span> {selectedAgent.active ? 'Active' : 'Inactive'}</div>
                  <div><span className="font-medium">Children:</span> {selectedAgent.childCount}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Resource Usage</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">LLM Calls:</span> {selectedAgent.resourceUsage.llmCalls}</div>
                  <div><span className="font-medium">Compute Units:</span> {selectedAgent.resourceUsage.computeUnits}</div>
                  <div><span className="font-medium">Storage:</span> {Math.round(selectedAgent.resourceUsage.storageBytes / 1024)}KB</div>
                  <div><span className="font-medium">Execution Time:</span> {formatDuration(selectedAgent.resourceUsage.executionTime)}</div>
                </div>
              </div>
            </div>
            
            {selectedAgent.taskDefinition && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Task Definition</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedAgent.taskDefinition}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AgentHierarchyVisualizer;