/**
 * Custom hook for responsive layout detection and management
 * Handles breakpoint detection and layout mode switching
 */

import { useState, useEffect, useCallback } from 'react';
import { LayoutMode, LayoutState, ViewType, ResponsiveBreakpoints } from '@/types/layout';

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,   // Below this is mobile (Flik-läget)
  tablet: 1024,  // Between mobile and desktop
  desktop: 1024  // Above this is desktop (Arbetsläget)
};

export function useResponsiveLayout(
  defaultView: ViewType = 'samtalet',
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS
) {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    mode: 'arbetslaget', // Default to desktop mode
    activeView: defaultView,
    isTransitioning: false
  });

  const [windowWidth, setWindowWidth] = useState<number>(0);

  // Determine layout mode based on window width
  const determineLayoutMode = useCallback((width: number): LayoutMode => {
    return width < breakpoints.mobile ? 'flik-laget' : 'arbetslaget';
  }, [breakpoints.mobile]);

  // Handle window resize
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    setWindowWidth(width);
    
    const newMode = determineLayoutMode(width);
    
    setLayoutState(prev => {
      if (prev.mode !== newMode) {
        return {
          ...prev,
          mode: newMode,
          isTransitioning: true
        };
      }
      return prev;
    });

    // Clear transition state after animation
    setTimeout(() => {
      setLayoutState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, [determineLayoutMode]);

  // Initialize and set up resize listener
  useEffect(() => {
    // Set initial window width
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      setWindowWidth(width);
      setLayoutState(prev => ({
        ...prev,
        mode: determineLayoutMode(width)
      }));

      // Add resize listener
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize, determineLayoutMode]);

  // Switch active view (for mobile tab navigation)
  const switchView = useCallback((view: ViewType) => {
    setLayoutState(prev => ({
      ...prev,
      activeView: view,
      isTransitioning: true
    }));

    // Clear transition state
    setTimeout(() => {
      setLayoutState(prev => ({ ...prev, isTransitioning: false }));
    }, 200);
  }, []);

  // Check if a specific view is active
  const isViewActive = useCallback((view: ViewType): boolean => {
    // In Arbetsläget mode, both views are always "active" (visible)
    if (layoutState.mode === 'arbetslaget') {
      return true;
    }
    // In Flik-läget mode, only the active view is visible
    return layoutState.activeView === view;
  }, [layoutState.mode, layoutState.activeView]);

  return {
    layoutState,
    windowWidth,
    switchView,
    isViewActive,
    isMobile: layoutState.mode === 'flik-laget',
    isDesktop: layoutState.mode === 'arbetslaget'
  };
}