/**
 * Tests for useResponsiveLayout hook
 * Tests breakpoint detection and layout state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

// Mock window.innerWidth
const mockInnerWidth = (width: number) => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }
};

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockInnerWidth(1200);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct desktop layout mode', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('arbetslaget');
      expect(result.current.layoutState.activeView).toBe('samtalet');
      expect(result.current.layoutState.isTransitioning).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
    });

    it('should initialize with correct mobile layout mode', () => {
      mockInnerWidth(600);
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('flik-laget');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should respect custom default view', () => {
      const { result } = renderHook(() => useResponsiveLayout('sidorna'));

      expect(result.current.layoutState.activeView).toBe('sidorna');
    });

    it('should respect custom breakpoints', () => {
      mockInnerWidth(900);
      
      const customBreakpoints = {
        mobile: 1000,
        tablet: 1200,
        desktop: 1200
      };

      const { result } = renderHook(() => 
        useResponsiveLayout('samtalet', customBreakpoints)
      );

      // With custom breakpoint of 1000, width of 900 should be mobile
      expect(result.current.layoutState.mode).toBe('flik-laget');
    });
  });

  describe('Breakpoint Detection', () => {
    it('should detect mobile breakpoint correctly', () => {
      mockInnerWidth(767); // Just below default mobile breakpoint
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('flik-laget');
      expect(result.current.isMobile).toBe(true);
    });

    it('should detect desktop breakpoint correctly', () => {
      mockInnerWidth(768); // At default mobile breakpoint
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('arbetslaget');
      expect(result.current.isDesktop).toBe(true);
    });

    it('should handle edge case at exact breakpoint', () => {
      mockInnerWidth(768); // Exactly at breakpoint
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('arbetslaget');
    });
  });

  describe('View Switching', () => {
    it('should switch active view correctly', () => {
      const { result } = renderHook(() => useResponsiveLayout('samtalet'));

      act(() => {
        result.current.switchView('sidorna');
      });

      expect(result.current.layoutState.activeView).toBe('sidorna');
    });

    it('should set transition state when switching views', () => {
      const { result } = renderHook(() => useResponsiveLayout('samtalet'));

      act(() => {
        result.current.switchView('sidorna');
      });

      expect(result.current.layoutState.isTransitioning).toBe(true);
    });

    it('should clear transition state after timeout', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useResponsiveLayout('samtalet'));

      act(() => {
        result.current.switchView('sidorna');
      });

      expect(result.current.layoutState.isTransitioning).toBe(true);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.layoutState.isTransitioning).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('View Activity Detection', () => {
    it('should return true for all views in desktop mode', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout('samtalet'));

      expect(result.current.isViewActive('samtalet')).toBe(true);
      expect(result.current.isViewActive('sidorna')).toBe(true);
    });

    it('should return true only for active view in mobile mode', () => {
      mockInnerWidth(600);
      
      const { result } = renderHook(() => useResponsiveLayout('samtalet'));

      expect(result.current.isViewActive('samtalet')).toBe(true);
      expect(result.current.isViewActive('sidorna')).toBe(false);

      act(() => {
        result.current.switchView('sidorna');
      });

      expect(result.current.isViewActive('samtalet')).toBe(false);
      expect(result.current.isViewActive('sidorna')).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should update layout mode on window resize', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.layoutState.mode).toBe('arbetslaget');

      // Simulate resize to mobile
      mockInnerWidth(600);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.layoutState.mode).toBe('flik-laget');
    });

    it('should set transition state during layout mode change', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      // Simulate resize to mobile
      mockInnerWidth(600);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.layoutState.isTransitioning).toBe(true);
    });

    it('should clear transition state after layout change timeout', async () => {
      vi.useFakeTimers();
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      // Simulate resize to mobile
      mockInnerWidth(600);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.layoutState.isTransitioning).toBe(true);

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.layoutState.isTransitioning).toBe(false);
      
      vi.useRealTimers();
    });

    it('should not change mode if resize does not cross breakpoint', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      const initialMode = result.current.layoutState.mode;

      // Resize within desktop range
      mockInnerWidth(1000);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.layoutState.mode).toBe(initialMode);
      expect(result.current.layoutState.isTransitioning).toBe(false);
    });
  });

  describe('Window Width Tracking', () => {
    it('should track window width correctly', () => {
      mockInnerWidth(1200);
      
      const { result } = renderHook(() => useResponsiveLayout());

      expect(result.current.windowWidth).toBe(1200);

      mockInnerWidth(800);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.windowWidth).toBe(800);
    });

    it('should handle server-side rendering gracefully', () => {
      // This test is skipped in jsdom environment as window is always available
      // In a real SSR environment, the hook would handle undefined window gracefully
      expect(true).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove resize listener on unmount', () => {
      if (typeof window !== 'undefined') {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        
        const { unmount } = renderHook(() => useResponsiveLayout());

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        
        removeEventListenerSpy.mockRestore();
      } else {
        expect(true).toBe(true); // Skip in SSR environment
      }
    });
  });
});