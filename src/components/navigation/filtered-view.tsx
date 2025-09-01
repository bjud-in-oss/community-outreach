/**
 * Filtered View Component (Level 2)
 * Filtered view with clickable index and search
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PageItem, FilterOption } from '@/types/progressive-zooming';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FilteredViewProps {
  pages: PageItem[];
  filterOptions: FilterOption[];
  selectedFilters: string[];
  filterQuery: string;
  onPageSelect: (pageId: string) => void;
  onFilterToggle: (filterId: string) => void;
  onFilterQueryChange: (query: string) => void;
  isActive: boolean;
}

export function FilteredView({
  pages,
  filterOptions,
  selectedFilters,
  filterQuery,
  onPageSelect,
  onFilterToggle,
  onFilterQueryChange,
  isActive
}: FilteredViewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Group filter options by type
  const groupedFilters = React.useMemo(() => {
    const groups = {
      tag: filterOptions.filter(f => f.type === 'tag'),
      date: filterOptions.filter(f => f.type === 'date')
    };
    return groups;
  }, [filterOptions]);

  return (
    <div className={cn(
      "h-full flex",
      !isActive && "pointer-events-none"
    )}>
      {/* Filter Sidebar */}
      <div className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sök i innehåll
            </label>
            <input
              type="text"
              placeholder="Sök efter ord eller fraser..."
              value={filterQuery}
              onChange={(e) => onFilterQueryChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tag Filters */}
          {groupedFilters.tag.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Ämnen</h3>
              <div className="space-y-2">
                {groupedFilters.tag.map(filter => (
                  <Button
                    key={filter.id}
                    variant={selectedFilters.includes(filter.id) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onFilterToggle(filter.id)}
                    className="w-full justify-between text-left h-auto py-2"
                  >
                    <span className="truncate">{filter.label}</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full ml-2">
                      {filter.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Date Filters */}
          {groupedFilters.date.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Tidsperiod</h3>
              <div className="space-y-2">
                {groupedFilters.date.map(filter => (
                  <Button
                    key={filter.id}
                    variant={selectedFilters.includes(filter.id) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onFilterToggle(filter.id)}
                    className="w-full justify-between text-left h-auto py-2"
                  >
                    <span className="truncate">{filter.label}</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full ml-2">
                      {filter.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {pages.length} sidor visas
              {(selectedFilters.length > 0 || filterQuery) && (
                <span> (filtrerade)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {pages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Inga resultat</h3>
              <p className="text-muted-foreground">
                Prova att ändra dina filter eller sökord
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Clickable Index */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Snabbindex ({pages.length} sidor)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {pages.map(page => (
                  <button
                    key={`index-${page.id}`}
                    onClick={() => onPageSelect(page.id)}
                    className="flex items-center gap-2 p-2 text-left hover:bg-accent rounded-md transition-colors text-sm"
                  >
                    <span className="text-lg">{page.emoji}</span>
                    <span className="truncate flex-1">{page.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(page.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-2">
                Detaljerad vy
              </h3>
              {pages.map(page => (
                <Card
                  key={page.id}
                  className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => onPageSelect(page.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {page.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {page.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {page.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(page.createdAt)}</span>
                        <div className="flex gap-1">
                          {page.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-secondary rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}