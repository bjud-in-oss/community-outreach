/**
 * Tests for Adaptive Layout System
 * Covers Arbetsläget (desktop/tablet) and Flik-läget (mobile) layouts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';

// Mock window.innerWidth for responsive testing
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('AdaptiveLayout', () => {
  let mockOnViewChange: ReturnType<typeof vi.fn>;
  let mockOnLayoutModeChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnViewChange = vi.fn();
    mockOnLayoutModeChange = vi.fn();
    
    // Reset window size to desktop default
    mockInnerWidth(1200);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout (Arbetsläget)', () => {
    it('should render side-by-side views on desktop', () => {
      mockInnerWidth(1200);
      
      render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      // Both views should be visible
      expect(screen.getByText('Samtalet')).toBeInTheDocument();
      expect(screen.getByText('Sidorna')).toBeInTheDocument();
      
      // Mobile tab bar should not be visible
      expect(screen.queryByText('Samtal')).not.toBeInTheDocument();
    });

    it('should call onLayoutModeChange with arbetslaget on desktop', async () => {
      mockInnerWidth(1200);
      
      render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      await waitFor(() => {
        expect(mockOnLayoutModeChange).toHaveBeenCalledWith('arbetslaget');
      });
    });

    it('should show both views as active in desktop mode', () => {
      mockInnerWidth(1200);
      
      render(<AdaptiveLayout />);

      // Both views should be rendered and visible
      const samtaletView = screen.getByText('Samtalet').closest('div');
      const sidornaView = screen.getByText('Sidorna').closest('div');
      
      expect(samtaletView).toBeInTheDocument();
      expect(sidornaView).toBeInTheDocument();
    });
  });

  describe('Mobile Layout (Flik-läget)', () => {
    it('should render single view with tab bar on mobile', () => {
      mockInnerWidth(600);
      
      render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      // Mobile tab bar should be visible
      expect(screen.getByText('Samtal')).toBeInTheDocument();
      expect(screen.getByText('Sidor')).toBeInTheDocument();
      
      // Both view headers should still exist but only one should be active
      expect(screen.getByText('Samtalet')).toBeInTheDocument();
      expect(screen.getByText('Sidorna')).toBeInTheDocument();
    });

    it('should call onLayoutModeChange with flik-laget on mobile', async () => {
      mockInnerWidth(600);
      
      render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      await waitFor(() => {
        expect(mockOnLayoutModeChange).toHaveBeenCalledWith('flik-laget');
      });
    });

    it('should switch views when tab is clicked', async () => {
      mockInnerWidth(600);
      
      render(
        <AdaptiveLayout
          defaultView="samtalet"
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      // Click on Sidorna tab
      const sidornaTab = screen.getByText('Sidor');
      fireEvent.click(sidornaTab);

      await waitFor(() => {
        expect(mockOnViewChange).toHaveBeenCalledWith('sidorna');
      });
    });

    it('should show correct active tab styling', async () => {
      mockInnerWidth(600);
      
      render(<AdaptiveLayout defaultView="samtalet" />);

      // Samtalet tab should be active initially
      const samtalTab = screen.getByText('Samtal').closest('button');
      expect(samtalTab).toHaveClass('text-primary');

      // Click Sidorna tab
      const sidornaTab = screen.getByText('Sidor').closest('button');
      fireEvent.click(sidornaTab!);

      await waitFor(() => {
        expect(sidornaTab).toHaveClass('text-primary');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should switch from desktop to mobile layout on resize', async () => {
      // Start with desktop
      mockInnerWidth(1200);
      
      const { rerender } = render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      // Should be in desktop mode initially
      expect(screen.queryByText('Samtal')).not.toBeInTheDocument();

      // Simulate resize to mobile
      mockInnerWidth(600);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText('Samtal')).toBeInTheDocument();
      });
    });

    it('should switch from mobile to desktop layout on resize', async () => {
      // Start with mobile
      mockInnerWidth(600);
      
      render(
        <AdaptiveLayout
          onViewChange={mockOnViewChange}
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      // Should be in mobile mode initially
      expect(screen.getByText('Samtal')).toBeInTheDocument();

      // Simulate resize to desktop
      mockInnerWidth(1200);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockOnLayoutModeChange).toHaveBeenCalledWith('arbetslaget');
      });
    });

    it('should handle breakpoint edge cases correctly', async () => {
      // Test exactly at breakpoint (768px)
      mockInnerWidth(768);
      
      render(
        <AdaptiveLayout
          onLayoutModeChange={mockOnLayoutModeChange}
        />
      );

      await waitFor(() => {
        expect(mockOnLayoutModeChange).toHaveBeenCalledWith('arbetslaget');
      });

      // Test just below breakpoint (767px)
      mockInnerWidth(767);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockOnLayoutModeChange).toHaveBeenCalledWith('flik-laget');
      });
    });
  });

  describe('Default Props and Configuration', () => {
    it('should use default view when not specified', () => {
      mockInnerWidth(600);
      
      render(<AdaptiveLayout />);

      // Default should be 'samtalet'
      const samtalTab = screen.getByText('Samtal').closest('button');
      expect(samtalTab).toHaveClass('text-primary');
    });

    it('should respect custom default view', () => {
      mockInnerWidth(600);
      
      render(<AdaptiveLayout defaultView="sidorna" />);

      // Sidorna should be active
      const sidornaTab = screen.getByText('Sidor').closest('button');
      expect(sidornaTab).toHaveClass('text-primary');
    });

    it('should handle missing callback props gracefully', () => {
      mockInnerWidth(1200);
      
      expect(() => {
        render(<AdaptiveLayout />);
      }).not.toThrow();
    });
  });

  describe('Transition States', () => {
    it('should show transition state during view switching', async () => {
      mockInnerWidth(600);
      
      render(<AdaptiveLayout defaultView="samtalet" />);

      const sidornaTab = screen.getByText('Sidor').closest('button');
      fireEvent.click(sidornaTab!);

      // During transition, button should be disabled
      expect(sidornaTab).toHaveAttribute('disabled');
    });

    it('should clear transition state after animation', async () => {
      mockInnerWidth(600);
      
      render(<AdaptiveLayout defaultView="samtalet" />);

      const sidornaTab = screen.getByText('Sidor').closest('button');
      fireEvent.click(sidornaTab!);

      // Wait for transition to complete
      await waitFor(() => {
        expect(sidornaTab).not.toHaveAttribute('disabled');
      }, { timeout: 500 });
    });
  });
});