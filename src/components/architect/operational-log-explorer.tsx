'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Log entry data structure
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  agentId?: string;
  message: string;
  metadata?: Record<string, any>;
  category: 'agent' | 'system' | 'user' | 'resource' | 'memory';
}

/**
 * Log filter configuration
 */
export interface LogFilter {
  levels: string[];
  categories: string[];
  agentIds: string[];
  searchTerm: string;
  timeRange: 'last-hour' | 'last-day' | 'last-week' | 'all';
}

/**
 * Props for the Operational Log Explorer
 */
export interface OperationalLogExplorerProps {
  /** Whether to auto-refresh logs */
  autoRefresh?: boolean;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Maximum number of logs to display */
  maxLogs?: number;
}

/**
 * Operational Log Explorer Component
 * Allows architects to search and filter agent-generated logs
 */
export function OperationalLogExplorer({
  autoRefresh = true,
  refreshInterval = 3000,
  maxLogs = 100
}: OperationalLogExplorerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>({
    levels: ['info', 'warn', 'error'],
    categories: ['agent', 'system', 'user', 'resource', 'memory'],
    agentIds: [],
    searchTerm: '',
    timeRange: 'last-hour'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Mock log data generator
  const generateMockLogs = (): LogEntry[] => {
    const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
    const categories: LogEntry['category'][] = ['agent', 'system', 'user', 'resource', 'memory'];
    const agentIds = ['coordinator-001', 'conscious-001', 'core-001', 'core-002'];
    
    const messages = {
      agent: [
        'Agent cloning request approved',
        'Roundabout loop phase transition: EMERGE -> ADAPT',
        'Child agent terminated successfully',
        'Relational delta calculation completed',
        'Strategic decision: PROCEED with new approach'
      ],
      system: [
        'System tempo changed to High-Performance mode',
        'Resource governor circuit breaker activated',
        'Memory consolidation process started',
        'User session initialized',
        'Configuration profile updated'
      ],
      user: [
        'User input detected in Autonomous mode',
        'Mode switch: Autonomous -> Attentive',
        'User consent verification completed',
        'New user contact added',
        'Privacy settings updated'
      ],
      resource: [
        'LLM quota threshold reached (80%)',
        'Storage allocation increased',
        'Compute unit budget exceeded',
        'Resource approval request denied',
        'Performance metrics collected'
      ],
      memory: [
        'Graph RAG query executed',
        'Semantic RAG association created',
        'Memory scope validation passed',
        'STM to LTM consolidation completed',
        'Conflict resolution applied'
      ]
    };

    const mockLogs: LogEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const agentId = Math.random() > 0.3 ? agentIds[Math.floor(Math.random() * agentIds.length)] : undefined;
      const messageList = messages[category];
      const message = messageList[Math.floor(Math.random() * messageList.length)];
      
      mockLogs.push({
        id: `log-${i}`,
        timestamp: new Date(now - Math.random() * 3600000), // Last hour
        level,
        source: category === 'agent' ? 'CognitiveAgent' : 'System',
        agentId,
        message,
        category,
        metadata: {
          executionTime: Math.floor(Math.random() * 1000),
          resourceUsage: Math.floor(Math.random() * 100),
          ...(level === 'error' && { errorCode: `ERR_${Math.floor(Math.random() * 1000)}` })
        }
      });
    }

    return mockLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newLogs = generateMockLogs();
    setLogs(newLogs);
    setIsLoading(false);
  };

  // Apply filters to logs
  const applyFilters = () => {
    let filtered = logs;

    // Filter by levels
    filtered = filtered.filter(log => filter.levels.includes(log.level));

    // Filter by categories
    filtered = filtered.filter(log => filter.categories.includes(log.category));

    // Filter by agent IDs
    if (filter.agentIds.length > 0) {
      filtered = filtered.filter(log => 
        log.agentId && filter.agentIds.includes(log.agentId)
      );
    }

    // Filter by search term
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower) ||
        (log.agentId && log.agentId.toLowerCase().includes(searchLower))
      );
    }

    // Filter by time range
    const now = Date.now();
    const timeRanges = {
      'last-hour': 3600000,
      'last-day': 86400000,
      'last-week': 604800000,
      'all': Infinity
    };
    
    const timeLimit = timeRanges[filter.timeRange];
    if (timeLimit !== Infinity) {
      filtered = filtered.filter(log => 
        now - log.timestamp.getTime() <= timeLimit
      );
    }

    setFilteredLogs(filtered.slice(0, maxLogs));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    applyFilters();
  }, [logs, filter]);

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'debug': return 'bg-gray-100 text-gray-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: LogEntry['category']): string => {
    switch (category) {
      case 'agent': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-indigo-100 text-indigo-800';
      case 'resource': return 'bg-orange-100 text-orange-800';
      case 'memory': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString();
  };

  const updateFilter = (key: keyof LogFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterArray = (key: 'levels' | 'categories' | 'agentIds', value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const uniqueAgentIds = Array.from(new Set(logs.map(log => log.agentId).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filter.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={filter.timeRange}
                onChange={(e) => updateFilter('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="last-hour">Last Hour</option>
                <option value="last-day">Last Day</option>
                <option value="last-week">Last Week</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Levels
              </label>
              <div className="flex flex-wrap gap-1">
                {['debug', 'info', 'warn', 'error'].map(level => (
                  <button
                    key={level}
                    onClick={() => toggleFilterArray('levels', level)}
                    className={`px-2 py-1 text-xs rounded ${
                      filter.levels.includes(level)
                        ? getLevelColor(level as LogEntry['level'])
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <div className="flex flex-wrap gap-1">
                {['agent', 'system', 'user', 'resource', 'memory'].map(category => (
                  <button
                    key={category}
                    onClick={() => toggleFilterArray('categories', category)}
                    className={`px-2 py-1 text-xs rounded ${
                      filter.categories.includes(category)
                        ? getCategoryColor(category as LogEntry['category'])
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agent IDs */}
          {uniqueAgentIds.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent IDs
              </label>
              <div className="flex flex-wrap gap-1">
                {uniqueAgentIds.map(agentId => (
                  <button
                    key={agentId}
                    onClick={() => toggleFilterArray('agentIds', agentId!)}
                    className={`px-2 py-1 text-xs rounded ${
                      filter.agentIds.includes(agentId!)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {agentId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{filteredLogs.length}</div>
            <div className="text-sm text-gray-600">Filtered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.level === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.level === 'warn').length}
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
          </CardContent>
        </Card>
      </div>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Log Entries ({filteredLogs.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No logs match the current filters</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge className={getCategoryColor(log.category)}>
                          {log.category}
                        </Badge>
                        {log.agentId && (
                          <Badge variant="outline">
                            {log.agentId}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Source: {log.source}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Log Details */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">ID:</span> {selectedLog.id}</div>
                  <div><span className="font-medium">Timestamp:</span> {formatTimestamp(selectedLog.timestamp)}</div>
                  <div><span className="font-medium">Level:</span> {selectedLog.level}</div>
                  <div><span className="font-medium">Category:</span> {selectedLog.category}</div>
                  <div><span className="font-medium">Source:</span> {selectedLog.source}</div>
                  {selectedLog.agentId && (
                    <div><span className="font-medium">Agent ID:</span> {selectedLog.agentId}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedLog.message}
                </p>
              </div>
            </div>
            
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OperationalLogExplorer;