import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentHierarchyVisualizer } from '@/components/architect/agent-hierarchy-visualizer';
import type { AgentNode } from '@/components/architect/agent-hierarchy-visualizer';

describe('AgentHierarchyVisualizer', () => {
  const mockOnAgentSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<AgentHierarchyVisualizer />);
    
    expect(screen.getByText('Loading agent hierarchy...')).toBeInTheDocument();
  });

  it('should render agent hierarchy after loading', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading agent hierarchy...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Active Agents \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    expect(screen.getByText('conscious-001')).toBeInTheDocument();
  });

  it('should display agent information correctly', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for role badges
    expect(screen.getByText('Coordinator')).toBeInTheDocument();
    expect(screen.getByText('Conscious')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
    
    // Check for phase badges
    expect(screen.getByText('EMERGE')).toBeInTheDocument();
    expect(screen.getByText('INTEGRATE')).toBeInTheDocument();
    expect(screen.getByText('ADAPT')).toBeInTheDocument();
  });

  it('should show resource usage information', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for resource usage display
    expect(screen.getByText(/LLM: \d+/)).toBeInTheDocument();
    expect(screen.getByText(/CPU: \d+/)).toBeInTheDocument();
    expect(screen.getByText(/Storage: \d+KB/)).toBeInTheDocument();
    expect(screen.getByText(/Time: \d+/)).toBeInTheDocument();
  });

  it('should handle agent selection', async () => {
    render(<AgentHierarchyVisualizer onAgentSelect={mockOnAgentSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Click on an agent
    const agentCard = screen.getByText('coordinator-001').closest('.cursor-pointer');
    fireEvent.click(agentCard!);
    
    expect(mockOnAgentSelect).toHaveBeenCalledTimes(1);
    expect(mockOnAgentSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'coordinator-001',
        role: 'Coordinator'
      })
    );
  });

  it('should show selected agent details', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Click on an agent to select it
    const agentCard = screen.getByText('coordinator-001').closest('.cursor-pointer');
    fireEvent.click(agentCard!);
    
    // Check for agent details panel
    expect(screen.getByText('Agent Details')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Resource Usage')).toBeInTheDocument();
  });

  it('should handle refresh functionality', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(refreshButton).toHaveTextContent('Refreshing...');
    
    await waitFor(() => {
      expect(refreshButton).toHaveTextContent('Refresh');
    });
  });

  it('should show auto-refresh status', async () => {
    render(<AgentHierarchyVisualizer autoRefresh={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Auto-refresh: ON')).toBeInTheDocument();
    });
  });

  it('should disable auto-refresh when specified', async () => {
    render(<AgentHierarchyVisualizer autoRefresh={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Auto-refresh: OFF')).toBeInTheDocument();
    });
  });

  it('should show last update time', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated: \d+:\d+:\d+/)).toBeInTheDocument();
    });
  });

  it('should display agent hierarchy with proper indentation', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check that child agents have proper indentation classes
    const childAgents = screen.getAllByText(/core-\d+|conscious-\d+/);
    expect(childAgents.length).toBeGreaterThan(0);
  });

  it('should show active status indicators', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for active status indicators (green dots)
    const statusIndicators = screen.getAllByRole('generic').filter(
      el => el.className.includes('bg-green-500')
    );
    expect(statusIndicators.length).toBeGreaterThan(0);
  });

  it('should handle empty agent list', async () => {
    // Mock empty response
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([])
    });
    
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('No active agents found')).toBeInTheDocument();
    });
    
    global.fetch = originalFetch;
  });

  it('should format time durations correctly', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for formatted time displays
    const timeElements = screen.getAllByText(/\d+[hms]/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should show child count for parent agents', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for child count display
    expect(screen.getByText(/Children: \d+/)).toBeInTheDocument();
  });

  it('should display task definitions when available', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    // Check for task definitions
    expect(screen.getByText('Main system coordination')).toBeInTheDocument();
    expect(screen.getByText('User interaction handling')).toBeInTheDocument();
  });

  it('should handle agent selection highlighting', async () => {
    render(<AgentHierarchyVisualizer />);
    
    await waitFor(() => {
      expect(screen.getByText('coordinator-001')).toBeInTheDocument();
    });
    
    const agentCard = screen.getByText('coordinator-001').closest('.cursor-pointer');
    fireEvent.click(agentCard!);
    
    // Check for selection highlighting
    expect(agentCard).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
  });
});