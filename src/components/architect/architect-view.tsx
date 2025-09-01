'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentHierarchyVisualizer } from './agent-hierarchy-visualizer';
import { LimbicStateMonitor } from './limbic-state-monitor';
import { OperationalLogExplorer } from './operational-log-explorer';
import { DevOpsPullRequestQueue } from './devops-pull-request-queue';
import { UserRole } from '@/types';

/**
 * Props for the Architect View component
 */
export interface ArchitectViewProps {
  /** Current user role */
  userRole: UserRole;
  
  /** Whether to show the view in full screen mode */
  fullScreen?: boolean;
  
  /** Callback when user role is insufficient */
  onAccessDenied?: () => void;
}

/**
 * Main Architect View component
 * Only accessible to users with 'architect' role
 * Provides monitoring and control interface for the cognitive agent system
 */
export function ArchitectView({ 
  userRole, 
  fullScreen = false, 
  onAccessDenied 
}: ArchitectViewProps) {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'limbic' | 'logs' | 'devops'>('hierarchy');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user has architect role
    if (userRole !== 'architect') {
      setIsAuthorized(false);
      onAccessDenied?.();
    } else {
      setIsAuthorized(true);
    }
  }, [userRole, onAccessDenied]);

  // Render access denied message for non-architect users
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              This view is only accessible to users with architect privileges.
            </p>
            <div className="mt-4 text-center">
              <Badge variant="destructive">
                Current Role: {userRole}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'hierarchy' as const, label: 'Agent Hierarchy', icon: '🌳' },
    { id: 'limbic' as const, label: 'Limbic Monitor', icon: '🧠' },
    { id: 'logs' as const, label: 'Operation Logs', icon: '📋' },
    { id: 'devops' as const, label: 'DevOps Queue', icon: '🚀' }
  ];

  const containerClass = fullScreen 
    ? "min-h-screen bg-gray-50 p-4"
    : "h-full bg-gray-50 p-4";

  return (
    <div className={containerClass}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Architect Control Room</h1>
              <p className="text-gray-600 mt-1">
                System monitoring and control interface
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                Role: Architect
              </Badge>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" 
                   title="System Active" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'hierarchy' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Agent Hierarchy Visualizer
              </h2>
              <AgentHierarchyVisualizer />
            </div>
          )}

          {activeTab === 'limbic' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Limbic State Monitor
              </h2>
              <LimbicStateMonitor />
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Operational Log Explorer
              </h2>
              <OperationalLogExplorer />
            </div>
          )}

          {activeTab === 'devops' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                DevOps & Pull Request Queue
              </h2>
              <DevOpsPullRequestQueue />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for checking architect access
 */
export function useArchitectAccess(userRole: UserRole) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate access check (in real implementation, this might involve API calls)
    const checkAccess = async () => {
      setIsLoading(true);
      
      // Simple role check
      const access = userRole === 'architect';
      
      // Simulate async check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setHasAccess(access);
      setIsLoading(false);
    };

    checkAccess();
  }, [userRole]);

  return { hasAccess, isLoading };
}

export default ArchitectView;