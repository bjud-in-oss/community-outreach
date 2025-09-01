/**
 * Custom hook for Progressive Zooming navigation
 * Manages state transitions between the three zoom levels
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  ZoomLevel, 
  ProgressiveZoomingState, 
  PageItem, 
  FilterOption,
  GraphNode,
  GraphEdge 
} from '@/types/progressive-zooming';

export function useProgressiveZooming(pages: PageItem[]) {
  const [state, setState] = useState<ProgressiveZoomingState>({
    currentLevel: 1,
    isTransitioning: false,
    filterQuery: '',
    selectedFilters: []
  });

  // Switch between zoom levels
  const switchLevel = useCallback((level: ZoomLevel) => {
    setState(prev => ({
      ...prev,
      currentLevel: level,
      isTransitioning: true
    }));

    // Clear transition state after animation
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  // Update filter query for Level 2
  const updateFilter = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      filterQuery: query
    }));
  }, []);

  // Toggle filter selection for Level 2
  const toggleFilter = useCallback((filterId: string) => {
    setState(prev => ({
      ...prev,
      selectedFilters: prev.selectedFilters?.includes(filterId)
        ? prev.selectedFilters.filter(id => id !== filterId)
        : [...(prev.selectedFilters || []), filterId]
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filterQuery: '',
      selectedFilters: []
    }));
  }, []);

  // Generate filter options for Level 2
  const filterOptions = useMemo((): FilterOption[] => {
    const tagCounts = new Map<string, number>();
    const dateCounts = new Map<string, number>();

    pages.forEach(page => {
      // Count tags
      page.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Count by month
      const monthKey = page.createdAt.toISOString().substring(0, 7); // YYYY-MM
      dateCounts.set(monthKey, (dateCounts.get(monthKey) || 0) + 1);
    });

    const options: FilterOption[] = [];

    // Add tag filters
    tagCounts.forEach((count, tag) => {
      options.push({
        id: `tag:${tag}`,
        label: tag,
        count,
        type: 'tag'
      });
    });

    // Add date filters
    dateCounts.forEach((count, month) => {
      const date = new Date(month + '-01');
      const label = date.toLocaleDateString('sv-SE', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({
        id: `date:${month}`,
        label,
        count,
        type: 'date'
      });
    });

    return options.sort((a, b) => b.count - a.count);
  }, [pages]);

  // Filter pages based on current filters (Level 2)
  const filteredPages = useMemo((): PageItem[] => {
    if (!state.selectedFilters?.length && !state.filterQuery) {
      return pages;
    }

    return pages.filter(page => {
      // Text search filter
      if (state.filterQuery) {
        const query = state.filterQuery.toLowerCase();
        const matchesText = 
          page.title.toLowerCase().includes(query) ||
          page.content.toLowerCase().includes(query) ||
          page.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesText) return false;
      }

      // Selected filters
      if (state.selectedFilters?.length) {
        return state.selectedFilters.some(filterId => {
          const [type, value] = filterId.split(':');
          
          if (type === 'tag') {
            return page.tags.includes(value);
          }
          
          if (type === 'date') {
            const pageMonth = page.createdAt.toISOString().substring(0, 7);
            return pageMonth === value;
          }
          
          return false;
        });
      }

      return true;
    });
  }, [pages, state.selectedFilters, state.filterQuery]);

  // Generate graph data for Level 3
  const graphData = useMemo((): { nodes: GraphNode[], edges: GraphEdge[] } => {
    const nodes: GraphNode[] = pages.map(page => ({
      id: page.id,
      title: page.title,
      emoji: page.emoji,
      connections: page.connections || [],
      weight: (page.connections?.length || 0) + page.wordCount / 100
    }));

    const edges: GraphEdge[] = [];
    
    pages.forEach(page => {
      page.connections?.forEach(connectionId => {
        // Avoid duplicate edges
        const existingEdge = edges.find(edge => 
          (edge.source === page.id && edge.target === connectionId) ||
          (edge.source === connectionId && edge.target === page.id)
        );
        
        if (!existingEdge) {
          edges.push({
            source: page.id,
            target: connectionId,
            strength: 1 // Could be calculated based on content similarity
          });
        }
      });
    });

    return { nodes, edges };
  }, [pages]);

  // Get pages for current level
  const getCurrentLevelPages = useCallback((): PageItem[] => {
    switch (state.currentLevel) {
      case 1:
        return pages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 2:
        return filteredPages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 3:
        return pages; // Graph view shows all pages
      default:
        return pages;
    }
  }, [pages, filteredPages, state.currentLevel]);

  return {
    state,
    switchLevel,
    updateFilter,
    toggleFilter,
    clearFilters,
    filterOptions,
    filteredPages,
    graphData,
    getCurrentLevelPages,
    isLevel1: state.currentLevel === 1,
    isLevel2: state.currentLevel === 2,
    isLevel3: state.currentLevel === 3
  };
}