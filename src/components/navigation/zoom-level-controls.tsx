/**
 * Zoom Level Controls Component
 * Navigation controls for switching between the three zoom levels
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ZoomLevel } from '@/types/progressive-zooming';
import { Button } from '@/components/ui/button';

interface ZoomLevelControlsProps {
  currentLevel: ZoomLevel;
  onLevelChange: (level: ZoomLevel) => void;
  isTransitioning: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ZoomLevelControls({
  currentLevel,
  onLevelChange,
  isTransitioning,
  hasFilters,
  onClearFilters
}: ZoomLevelControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      {/* Level Selection Buttons */}
      <div className="flex gap-2">
        <Button
          variant={currentLevel === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onLevelChange(1)}
          disabled={isTransitioning}
          className={cn(
            "transition-all duration-200",
            isTransitioning && "opacity-50"
          )}
        >
          <span className="mr-2">📋</span>
          Nivå 1: Kronologisk
        </Button>

        <Button
          variant={currentLevel === 2 ? "default" : "outline"}
          size="sm"
          onClick={() => onLevelChange(2)}
          disabled={isTransitioning}
          className={cn(
            "transition-all duration-200",
            isTransitioning && "opacity-50"
          )}
        >
          <span className="mr-2">🔍</span>
          Filter
        </Button>

        <Button
          variant={currentLevel === 3 ? "default" : "outline"}
          size="sm"
          onClick={() => onLevelChange(3)}
          disabled={isTransitioning}
          className={cn(
            "transition-all duration-200",
            isTransitioning && "opacity-50"
          )}
        >
          <span className="mr-2">🗺️</span>
          Visa Karta
        </Button>
      </div>

      {/* Filter Status and Clear Button */}
      {hasFilters && currentLevel === 2 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filter aktiva
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Rensa alla
          </Button>
        </div>
      )}

      {/* Level Description */}
      <div className="text-sm text-muted-foreground">
        {currentLevel === 1 && "Linjär kronologisk vy"}
        {currentLevel === 2 && "Filtrerad vy med index"}
        {currentLevel === 3 && "Visuell kartvy"}
      </div>
    </div>
  );
}