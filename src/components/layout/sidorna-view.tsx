/**
 * Sidorna View Component
 * Pages/content view for the adaptive layout system
 * Will later support Progressive Zooming navigation
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ViewComponentProps } from '@/types/layout';
import { ProgressiveZooming } from '@/components/navigation';
import { PageItem } from '@/types/progressive-zooming';

export function SidornaView({ 
  isActive, 
  layoutMode, 
  className 
}: ViewComponentProps) {
  // Sample data for demonstration
  const samplePages: PageItem[] = [
    {
      id: '1',
      title: 'Mina barndomsminnen',
      content: 'Jag minns när vi brukade åka till sommarstugan varje år. Det var alltid så spännande att packa bilen och köra genom skogen...',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['barndom', 'sommar', 'familj'],
      emoji: '📝',
      wordCount: 245,
      connections: ['2', '3']
    },
    {
      id: '2',
      title: 'Hemkänsla',
      content: 'Det finns något speciellt med doften av nybakat bröd som tar mig tillbaka till min barndom...',
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date(Date.now() - 86400000),
      tags: ['hem', 'minnen', 'mat'],
      emoji: '🏠',
      wordCount: 189,
      connections: ['1']
    },
    {
      id: '3',
      title: 'Familjetraditioner',
      content: 'Varje jul brukade vi samlas hos mormor och morfar. Hela huset fylldes med skratt och värme...',
      createdAt: new Date(Date.now() - 604800000), // Last week
      updatedAt: new Date(Date.now() - 604800000),
      tags: ['familj', 'jul', 'traditioner'],
      emoji: '👨‍👩‍👧‍👦',
      wordCount: 312,
      connections: ['1', '4']
    },
    {
      id: '4',
      title: 'Vårkänslor',
      content: 'När de första blommorna börjar slå ut känner jag alltid en sådan glädje och hopp...',
      createdAt: new Date(Date.now() - 1209600000), // Two weeks ago
      updatedAt: new Date(Date.now() - 1209600000),
      tags: ['vår', 'natur', 'känslor'],
      emoji: '🌸',
      wordCount: 156,
      connections: ['3']
    }
  ];

  const handlePageSelect = (pageId: string) => {
    console.log('Selected page:', pageId);
    // Here you would typically navigate to the page or open it in an editor
  };

  const handleLevelChange = (level: number) => {
    console.log('Zoom level changed to:', level);
  };

  return (
    <div className={cn(
      "flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <h2 className="text-xl font-semibold">Sidorna</h2>
          {layoutMode === 'flik-laget' && !isActive && (
            <span className="ml-auto text-sm text-muted-foreground">
              Tryck på fliken nedan
            </span>
          )}
        </div>
      </div>

      {/* Progressive Zooming Navigation */}
      <div className="flex-1">
        <ProgressiveZooming
          pages={samplePages}
          onPageSelect={handlePageSelect}
          onLevelChange={handleLevelChange}
        />
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-border bg-card">
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
          + Skapa ny sida
        </button>
      </div>
    </div>
  );
}