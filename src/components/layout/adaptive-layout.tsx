/**
 * Adaptive Layout Component
 * Implements Arbetsläget (desktop/tablet) and Flik-läget (mobile) layouts
 * Provides responsive breakpoint detection and smooth transitions
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AdaptiveLayoutProps, ViewType } from '@/types/layout';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { SamtaletView } from './samtalet-view';
import { SidornaView } from './sidorna-view';
import { MobileTabBar } from './mobile-tab-bar';

export function AdaptiveLayout({
  children,
  defaultView = 'samtalet',
  onViewChange,
  onLayoutModeChange
}: AdaptiveLayoutProps) {
  const {
    layoutState,
    switchView,
    isViewActive,
    isMobile,
    isDesktop
  } = useResponsiveLayout(defaultView);

  // Notify parent components of layout changes
  React.useEffect(() => {
    onLayoutModeChange?.(layoutState.mode);
  }, [layoutState.mode, onLayoutModeChange]);

  React.useEffect(() => {
    onViewChange?.(layoutState.activeView);
  }, [layoutState.activeView, onViewChange]);

  const handleViewSwitch = (view: ViewType) => {
    switchView(view);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isDesktop ? (
          // Arbetsläget: Side-by-side layout for desktop/tablet
          <div className="flex w-full h-full">
            {/* Samtalet View - Left Side */}
            <div className={cn(
              "flex-1 border-r border-border transition-all duration-300",
              layoutState.isTransitioning && "opacity-75"
            )}>
              <SamtaletView
                isActive={isViewActive('samtalet')}
                layoutMode={layoutState.mode}
                className="h-full"
              />
            </div>

            {/* Sidorna View - Right Side */}
            <div className={cn(
              "flex-1 transition-all duration-300",
              layoutState.isTransitioning && "opacity-75"
            )}>
              <SidornaView
                isActive={isViewActive('sidorna')}
                layoutMode={layoutState.mode}
                className="h-full"
              />
            </div>
          </div>
        ) : (
          // Flik-läget: Single view with tab navigation for mobile
          <div className="flex-1 relative">
            {/* Samtalet View */}
            <div className={cn(
              "absolute inset-0 transition-all duration-200",
              isViewActive('samtalet') 
                ? "opacity-100 translate-x-0 z-10" 
                : "opacity-0 -translate-x-full z-0"
            )}>
              <SamtaletView
                isActive={isViewActive('samtalet')}
                layoutMode={layoutState.mode}
                className="h-full"
              />
            </div>

            {/* Sidorna View */}
            <div className={cn(
              "absolute inset-0 transition-all duration-200",
              isViewActive('sidorna') 
                ? "opacity-100 translate-x-0 z-10" 
                : "opacity-0 translate-x-full z-0"
            )}>
              <SidornaView
                isActive={isViewActive('sidorna')}
                layoutMode={layoutState.mode}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tab Bar - Only shown in Flik-läget */}
      {isMobile && (
        <MobileTabBar
          activeView={layoutState.activeView}
          onViewChange={handleViewSwitch}
          isTransitioning={layoutState.isTransitioning}
        />
      )}

      {/* Additional content from children */}
      {children}
    </div>
  );
}