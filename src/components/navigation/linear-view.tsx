/**
 * Linear View Component (Level 1)
 * Simple chronological list of pages
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PageItem } from '@/types/progressive-zooming';
import { Card } from '@/components/ui/card';

interface LinearViewProps {
  pages: PageItem[];
  onPageSelect: (pageId: string) => void;
  isActive: boolean;
}

export function LinearView({ pages, onPageSelect, isActive }: LinearViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Idag';
    if (diffInDays === 1) return 'Igår';
    if (diffInDays < 7) return `${diffInDays} dagar sedan`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} veckor sedan`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} månader sedan`;
    return `${Math.floor(diffInDays / 365)} år sedan`;
  };

  return (
    <div className={cn(
      "h-full overflow-y-auto p-4",
      !isActive && "pointer-events-none"
    )}>
      {pages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">Inga sidor än</h3>
            <p className="text-muted-foreground">
              Skapa din första sida för att komma igång
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page, index) => (
            <Card
              key={page.id}
              className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => onPageSelect(page.id)}
            >
              <div className="flex items-start gap-3">
                {/* Emoji Icon */}
                <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {page.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                      {page.title}
                    </h3>
                    <div className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                      {formatTimeAgo(page.createdAt)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {page.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{formatDate(page.createdAt)}</span>
                      <span>{page.wordCount} ord</span>
                      {page.connections && page.connections.length > 0 && (
                        <span>{page.connections.length} kopplingar</span>
                      )}
                    </div>

                    {/* Tags */}
                    {page.tags.length > 0 && (
                      <div className="flex gap-1">
                        {page.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-secondary rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {page.tags.length > 3 && (
                          <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                            +{page.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline connector for visual continuity */}
              {index < pages.length - 1 && (
                <div className="ml-6 mt-4 h-4 border-l-2 border-dashed border-border opacity-30" />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}