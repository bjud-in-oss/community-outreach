/**
 * Types for Progressive Zooming navigation system
 * Supports three levels: Linear, Filtered, and Graph views
 */

export type ZoomLevel = 1 | 2 | 3;

export interface ProgressiveZoomingState {
  currentLevel: ZoomLevel;
  isTransitioning: boolean;
  filterQuery?: string;
  selectedFilters?: string[];
}

export interface PageItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  emoji: string;
  wordCount: number;
  connections?: string[]; // IDs of connected pages
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
  type: 'tag' | 'date' | 'content';
}

export interface GraphNode {
  id: string;
  title: string;
  emoji: string;
  x?: number;
  y?: number;
  connections: string[];
  weight: number; // Importance/centrality score
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number; // Connection strength
}

export interface ProgressiveZoomingProps {
  pages: PageItem[];
  onPageSelect?: (pageId: string) => void;
  onLevelChange?: (level: ZoomLevel) => void;
  className?: string;
}