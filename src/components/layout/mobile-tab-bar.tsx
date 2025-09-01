/**
 * Mobile Tab Bar Component
 * Fixed bottom navigation for Flik-läget (mobile layout)
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ViewType } from '@/types/layout';

interface MobileTabBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isTransitioning?: boolean;
}

export function MobileTabBar({
  activeView,
  onViewChange,
  isTransitioning = false
}: MobileTabBarProps) {
  return (
    <div className="border-t border-border bg-card">
      <div className="flex">
        {/* Samtalet Tab */}
        <button
          onClick={() => onViewChange('samtalet')}
          disabled={isTransitioning}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200",
            activeView === 'samtalet'
              ? "text-primary bg-primary/10 border-t-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            isTransitioning && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-lg">💬</span>
          <span>Samtal</span>
        </button>

        {/* Sidorna Tab */}
        <button
          onClick={() => onViewChange('sidorna')}
          disabled={isTransitioning}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200",
            activeView === 'sidorna'
              ? "text-primary bg-primary/10 border-t-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            isTransitioning && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-lg">📖</span>
          <span>Sidor</span>
        </button>
      </div>
    </div>
  );
}