/**
 * Samtalet View Component
 * Conversational interface view for the adaptive layout system
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ViewComponentProps } from '@/types/layout';
import { Card } from '@/components/ui/card';

export function SamtaletView({ 
  isActive, 
  layoutMode, 
  className 
}: ViewComponentProps) {
  return (
    <div className={cn(
      "flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <h2 className="text-xl font-semibold">Samtalet</h2>
          {layoutMode === 'flik-laget' && !isActive && (
            <span className="ml-auto text-sm text-muted-foreground">
              Tryck på fliken nedan
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Chat History Area */}
        <div className="space-y-4 mb-4">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Systemet</p>
                <p>Hej! Jag är här för att hjälpa dig. Vad tänker du på idag?</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 ml-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Du</p>
                <p>Jag funderar på att skriva ner några minnen från förr...</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Dynamic Context Field */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Snabbåtkomst:</div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 text-xs bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
              📖 Senaste sidan
            </button>
            <button className="px-3 py-1 text-xs bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
              👥 Familjen
            </button>
            <button className="px-3 py-1 text-xs bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
              🏠 Hemma bäst
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Skriv ditt meddelande här..."
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
            Skicka
          </button>
        </div>
      </div>
    </div>
  );
}