/**
 * Tests for useProgressiveZooming hook
 * Tests state management and data processing for Progressive Zooming
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressiveZooming } from '@/hooks/use-progressive-zooming';
import { PageItem } from '@/types/progressive-zooming';

const mockPages: PageItem[] = [
  {
    id: '1',
    title: 'Test Page 1',
    content: 'This is the content of test page 1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: ['test', 'sample'],
    emoji: '📝',
    wordCount: 100,
    connections: ['2']
  },
  {
    id: '2',
    title: 'Test Page 2',
    content: 'This is the content of test page 2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    tags: ['test', 'example'],
    emoji: '📄',
    wordCount: 150,
    connections: ['1', '3']
  },
  {
    id: '3',
    title: 'Test Page 3',
    content: 'This is the content of test page 3',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    tags: ['example'],
    emoji: '📋',
    wordCount: 200,
    connections: ['2']
  }
];

describe('useProgressiveZooming', () => {
  describe('Initial State', () => {
    it('should initialize with Level 1 active', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      expect(result.current.state.currentLevel).toBe(1);
      expect(result.current.state.isTransitioning).toBe(false);
      expect(result.current.isLevel1).toBe(true);
      expect(result.current.isLevel2).toBe(false);
      expect(result.current.isLevel3).toBe(false);
    });

    it('should initialize with empty filters', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      expect(result.current.state.filterQuery).toBe('');
      expect(result.current.state.selectedFilters).toEqual([]);
    });
  });

  describe('Level Switching', () => {
    it('should switch to Level 2', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.switchLevel(2);
      });

      expect(result.current.state.currentLevel).toBe(2);
      expect(result.current.isLevel2).toBe(true);
      expect(result.current.state.isTransitioning).toBe(true);
    });

    it('should switch to Level 3', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.switchLevel(3);
      });

      expect(result.current.state.currentLevel).toBe(3);
      expect(result.current.isLevel3).toBe(true);
    });

    it('should clear transition state after timeout', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.switchLevel(2);
      });

      expect(result.current.state.isTransitioning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.state.isTransitioning).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('Filter Management', () => {
    it('should update filter query', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.updateFilter('test query');
      });

      expect(result.current.state.filterQuery).toBe('test query');
    });

    it('should toggle filter selection', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.toggleFilter('tag:test');
      });

      expect(result.current.state.selectedFilters).toContain('tag:test');

      act(() => {
        result.current.toggleFilter('tag:test');
      });

      expect(result.current.state.selectedFilters).not.toContain('tag:test');
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.updateFilter('test query');
        result.current.toggleFilter('tag:test');
      });

      expect(result.current.state.filterQuery).toBe('test query');
      expect(result.current.state.selectedFilters).toContain('tag:test');

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.state.filterQuery).toBe('');
      expect(result.current.state.selectedFilters).toEqual([]);
    });
  });

  describe('Filter Options Generation', () => {
    it('should generate tag filter options with counts', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const tagFilters = result.current.filterOptions.filter(f => f.type === 'tag');
      
      expect(tagFilters).toHaveLength(3);
      expect(tagFilters.find(f => f.label === 'test')?.count).toBe(2);
      expect(tagFilters.find(f => f.label === 'example')?.count).toBe(2);
      expect(tagFilters.find(f => f.label === 'sample')?.count).toBe(1);
    });

    it('should generate date filter options', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const dateFilters = result.current.filterOptions.filter(f => f.type === 'date');
      
      expect(dateFilters.length).toBeGreaterThan(0);
      expect(dateFilters[0].id).toMatch(/^date:/);
    });

    it('should sort filter options by count', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const tagFilters = result.current.filterOptions.filter(f => f.type === 'tag');
      
      // Should be sorted by count (descending)
      for (let i = 0; i < tagFilters.length - 1; i++) {
        expect(tagFilters[i].count).toBeGreaterThanOrEqual(tagFilters[i + 1].count);
      }
    });
  });

  describe('Page Filtering', () => {
    it('should filter pages by text query', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.updateFilter('page 1');
      });

      expect(result.current.filteredPages).toHaveLength(1);
      expect(result.current.filteredPages[0].title).toBe('Test Page 1');
    });

    it('should filter pages by tag', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.toggleFilter('tag:sample');
      });

      expect(result.current.filteredPages).toHaveLength(1);
      expect(result.current.filteredPages[0].title).toBe('Test Page 1');
    });

    it('should filter pages by date', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.toggleFilter('date:2024-01');
      });

      expect(result.current.filteredPages).toHaveLength(3); // All pages are from January 2024
    });

    it('should combine text and filter queries', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.updateFilter('page');
        result.current.toggleFilter('tag:test');
      });

      expect(result.current.filteredPages).toHaveLength(2); // Pages 1 and 2 have 'test' tag
    });

    it('should return all pages when no filters applied', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      expect(result.current.filteredPages).toHaveLength(3);
    });
  });

  describe('Graph Data Generation', () => {
    it('should generate nodes from pages', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      expect(result.current.graphData.nodes).toHaveLength(3);
      expect(result.current.graphData.nodes[0].id).toBe('1');
      expect(result.current.graphData.nodes[0].title).toBe('Test Page 1');
      expect(result.current.graphData.nodes[0].emoji).toBe('📝');
    });

    it('should generate edges from connections', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      expect(result.current.graphData.edges.length).toBeGreaterThan(0);
      
      // Should have edge between pages 1 and 2
      const edge12 = result.current.graphData.edges.find(e => 
        (e.source === '1' && e.target === '2') || 
        (e.source === '2' && e.target === '1')
      );
      expect(edge12).toBeDefined();
    });

    it('should calculate node weights', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const node2 = result.current.graphData.nodes.find(n => n.id === '2');
      expect(node2?.weight).toBeGreaterThan(0);
      
      // Node 2 has most connections, should have highest weight
      const weights = result.current.graphData.nodes.map(n => n.weight);
      expect(node2?.weight).toBe(Math.max(...weights));
    });

    it('should avoid duplicate edges', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const edges = result.current.graphData.edges;
      const edgeKeys = edges.map(e => `${e.source}-${e.target}`);
      const reverseKeys = edges.map(e => `${e.target}-${e.source}`);
      
      // No edge should exist in both directions
      edgeKeys.forEach(key => {
        expect(reverseKeys).not.toContain(key);
      });
    });
  });

  describe('Current Level Pages', () => {
    it('should return chronologically sorted pages for Level 1', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      const pages = result.current.getCurrentLevelPages();
      
      expect(pages).toHaveLength(3);
      // Should be sorted by creation date (newest first)
      expect(pages[0].title).toBe('Test Page 1'); // 2024-01-15
      expect(pages[1].title).toBe('Test Page 2'); // 2024-01-10
      expect(pages[2].title).toBe('Test Page 3'); // 2024-01-05
    });

    it('should return filtered pages for Level 2', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.switchLevel(2);
        result.current.toggleFilter('tag:sample');
      });

      const pages = result.current.getCurrentLevelPages();
      
      expect(pages).toHaveLength(1);
      expect(pages[0].title).toBe('Test Page 1');
    });

    it('should return all pages for Level 3', () => {
      const { result } = renderHook(() => useProgressiveZooming(mockPages));

      act(() => {
        result.current.switchLevel(3);
      });

      const pages = result.current.getCurrentLevelPages();
      
      expect(pages).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pages array', () => {
      const { result } = renderHook(() => useProgressiveZooming([]));

      expect(result.current.filterOptions).toHaveLength(0);
      expect(result.current.filteredPages).toHaveLength(0);
      expect(result.current.graphData.nodes).toHaveLength(0);
      expect(result.current.graphData.edges).toHaveLength(0);
    });

    it('should handle pages without connections', () => {
      const pagesWithoutConnections = mockPages.map(page => ({
        ...page,
        connections: undefined
      }));

      const { result } = renderHook(() => useProgressiveZooming(pagesWithoutConnections));

      expect(result.current.graphData.nodes).toHaveLength(3);
      expect(result.current.graphData.edges).toHaveLength(0);
    });

    it('should handle pages without tags', () => {
      const pagesWithoutTags = mockPages.map(page => ({
        ...page,
        tags: []
      }));

      const { result } = renderHook(() => useProgressiveZooming(pagesWithoutTags));

      const tagFilters = result.current.filterOptions.filter(f => f.type === 'tag');
      expect(tagFilters).toHaveLength(0);
    });
  });
});