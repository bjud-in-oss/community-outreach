import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectView, useArchitectAccess } from '@/components/architect/architect-view';
import { UserRole } from '@/types';

// Mock the child components
vi.mock('@/components/architect/agent-hierarchy-visualizer', () => ({
  AgentHierarchyVisualizer: () => <div data-testid="agent-hierarchy-visualizer">Agent Hierarchy Visualizer</div>
}));

vi.mock('@/components/architect/limbic-state-monitor', () => ({
  LimbicStateMonitor: () => <div data-testid="limbic-state-monitor">Limbic State Monitor</div>
}));

vi.mock('@/components/architect/operational-log-explorer', () => ({
  OperationalLogExplorer: () => <div data-testid="operational-log-explorer">Operational Log Explorer</div>
}));

vi.mock('@/components/architect/devops-pull-request-queue', () => ({
  DevOpsPullRequestQueue: () => <div data-testid="devops-pull-request-queue">DevOps Pull Request Queue</div>
}));

describe('ArchitectView', () => {
  const mockOnAccessDenied = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control', () => {
    it('should render access denied for senior users', () => {
      render(
        <ArchitectView 
          userRole="senior" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('This view is only accessible to users with architect privileges.')).toBeInTheDocument();
      expect(screen.getByText('Current Role: senior')).toBeInTheDocument();
      expect(mockOnAccessDenied).toHaveBeenCalledTimes(1);
    });

    it('should render architect interface for architect users', () => {
      render(
        <ArchitectView 
          userRole="architect" 
          onAccessDenied={mockOnAccessDenied}
        />
      );

      expect(screen.getByText('Architect Control Room')).toBeInTheDocument();
      expect(screen.getByText('System monitoring and control interface')).toBeInTheDocument();
      expect(screen.getByText('Role: Architect')).toBeInTheDocument();
      expect(mockOnAccessDenied).not.toHaveBeenCalled();
    });

    it('should not call onAccessDenied if not provided', () => {
      render(<ArchitectView userRole="senior" />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      // Should not throw error when onAccessDenied is not provided
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      render(<ArchitectView userRole="architect" />);
    });

    it('should render all navigation tabs', () => {
      expect(screen.getByText('Agent Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Limbic Monitor')).toBeInTheDocument();
      expect(screen.getByText('Operation Logs')).toBeInTheDocument();
      expect(screen.getByText('DevOps Queue')).toBeInTheDocument();
    });

    it('should start with hierarchy tab active', () => {
      expect(screen.getByTestId('agent-hierarchy-visualizer')).toBeInTheDocument();
      expect(screen.queryByTestId('limbic-state-monitor')).not.toBeInTheDocument();
    });

    it('should switch to limbic monitor tab when clicked', () => {
      fireEvent.click(screen.getByText('Limbic Monitor'));
      
      expect(screen.getByTestId('limbic-state-monitor')).toBeInTheDocument();
      expect(screen.queryByTestId('agent-hierarchy-visualizer')).not.toBeInTheDocument();
    });

    it('should switch to operation logs tab when clicked', () => {
      fireEvent.click(screen.getByText('Operation Logs'));
      
      expect(screen.getByTestId('operational-log-explorer')).toBeInTheDocument();
      expect(screen.queryByTestId('agent-hierarchy-visualizer')).not.toBeInTheDocument();
    });

    it('should switch to devops queue tab when clicked', () => {
      fireEvent.click(screen.getByText('DevOps Queue'));
      
      expect(screen.getByTestId('devops-pull-request-queue')).toBeInTheDocument();
      expect(screen.queryByTestId('agent-hierarchy-visualizer')).not.toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      const hierarchyTab = screen.getByText('Agent Hierarchy').closest('button');
      const limbicTab = screen.getByText('Limbic Monitor').closest('button');
      
      // Initially hierarchy should be active
      expect(hierarchyTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(limbicTab).toHaveClass('border-transparent', 'text-gray-500');
      
      // Switch to limbic tab
      fireEvent.click(screen.getByText('Limbic Monitor'));
      
      expect(hierarchyTab).toHaveClass('border-transparent', 'text-gray-500');
      expect(limbicTab).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  describe('Layout and Styling', () => {
    it('should apply full screen layout when fullScreen is true', () => {
      const { container } = render(
        <ArchitectView userRole="architect" fullScreen={true} />
      );
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should apply normal layout when fullScreen is false', () => {
      const { container } = render(
        <ArchitectView userRole="architect" fullScreen={false} />
      );
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('h-full');
      expect(mainDiv).not.toHaveClass('min-h-screen');
    });

    it('should show system active indicator', () => {
      render(<ArchitectView userRole="architect" />);
      
      const indicator = screen.getByTitle('System Active');
      expect(indicator).toHaveClass('bg-green-500', 'animate-pulse');
    });
  });

  describe('Role Change Handling', () => {
    it('should update access when role changes from senior to architect', () => {
      const { rerender } = render(
        <ArchitectView userRole="senior" onAccessDenied={mockOnAccessDenied} />
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(mockOnAccessDenied).toHaveBeenCalledTimes(1);
      
      rerender(
        <ArchitectView userRole="architect" onAccessDenied={mockOnAccessDenied} />
      );
      
      expect(screen.getByText('Architect Control Room')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should update access when role changes from architect to senior', () => {
      const { rerender } = render(
        <ArchitectView userRole="architect" onAccessDenied={mockOnAccessDenied} />
      );
      
      expect(screen.getByText('Architect Control Room')).toBeInTheDocument();
      expect(mockOnAccessDenied).not.toHaveBeenCalled();
      
      rerender(
        <ArchitectView userRole="senior" onAccessDenied={mockOnAccessDenied} />
      );
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(mockOnAccessDenied).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useArchitectAccess', () => {
  // Test component to use the hook
  const TestComponent = ({ userRole }: { userRole: UserRole }) => {
    const { hasAccess, isLoading } = useArchitectAccess(userRole);
    
    return (
      <div>
        <div data-testid="has-access">{hasAccess.toString()}</div>
        <div data-testid="is-loading">{isLoading.toString()}</div>
      </div>
    );
  };

  it('should return false access for senior users', async () => {
    render(<TestComponent userRole="senior" />);
    
    // Initially loading
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    
    // Wait for access check to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('has-access')).toHaveTextContent('false');
  });

  it('should return true access for architect users', async () => {
    render(<TestComponent userRole="architect" />);
    
    // Initially loading
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    
    // Wait for access check to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('has-access')).toHaveTextContent('true');
  });

  it('should re-check access when role changes', async () => {
    const { rerender } = render(<TestComponent userRole="senior" />);
    
    // Wait for initial check
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('has-access')).toHaveTextContent('false');
    
    // Change role
    rerender(<TestComponent userRole="architect" />);
    
    // Should start loading again
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    
    // Wait for new check to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('has-access')).toHaveTextContent('true');
  });
});