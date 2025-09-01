/**
 * Progressive Zooming Navigation Component
 * Implements three-level navigation: Linear → Filtered → Graph
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ProgressiveZoomingProps } from '@/types/progressive-zooming';
import { useProgressiveZooming } from '@/hooks/use-progressive-zooming';
import { ZoomLevelControls } from './zoom-level-controls';
import { LinearView } from './linear-view';
import { FilteredView } from './filtered-view';
import { GraphView } from './graph-view';

export function ProgressiveZooming({
  pages,
  onPageSelect,
  onLevelChange,
  className
}: ProgressiveZoomingProps) {
  const {
    state,
    switchLevel,
    updateFilter,
    toggleFilter,
    clearFilters,
    filterOptions,
    filteredPages,
    graphData,
    getCurrentLevelPages,
    isLevel1,
    isLevel2,
    isLevel3
  } = useProgressiveZooming(pages);

  // Notify parent of level changes
  React.useEffect(() => {
    onLevelChange?.(state.currentLevel);
  }, [state.currentLevel, onLevelChange]);

  const handlePageSelect = (pageId: string) => {
    onPageSelect?.(pageId);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Level Controls */}
      <ZoomLevelControls
        currentLevel={state.currentLevel}
        onLevelChange={switchLevel}
        isTransitioning={state.isTransitioning}
        hasFilters={(state.selectedFilters?.length ?? 0) > 0 || !!state.filterQuery}
        onClearFilters={clearFilters}
      />

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Level 1: Linear Chronological View */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300",
          isLevel1 
            ? "opacity-100 translate-x-0 z-10" 
            : "opacity-0 -translate-x-full z-0"
        )}>
          <LinearView
            pages={getCurrentLevelPages()}
            onPageSelect={handlePageSelect}
            isActive={isLevel1}
          />
        </div>

        {/* Level 2: Filtered View */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300",
          isLevel2 
            ? "opacity-100 translate-x-0 z-10" 
            : "opacity-0 translate-x-full z-0"
        )}>
          <FilteredView
            pages={filteredPages}
            filterOptions={filterOptions}
            selectedFilters={state.selectedFilters || []}
            filterQuery={state.filterQuery || ''}
            onPageSelect={handlePageSelect}
            onFilterToggle={toggleFilter}
            onFilterQueryChange={updateFilter}
            isActive={isLevel2}
          />
        </div>

        {/* Level 3: Graph View */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300",
          isLevel3 
            ? "opacity-100 translate-y-0 z-10" 
            : "opacity-0 translate-y-full z-0"
        )}>
          <GraphView
            graphData={graphData}
            onNodeSelect={handlePageSelect}
            isActive={isLevel3}
          />
        </div>
      </div>
    </div>
  );
}