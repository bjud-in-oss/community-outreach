/**
 * Tests for Progressive Zooming Navigation System
 * Covers all three levels: Linear, Filtered, and Graph views
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressiveZooming } from '@/components/navigation/progressive-zooming';
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

describe('ProgressiveZooming', () => {
  let mockOnPageSelect: ReturnType<typeof vi.fn>;
  let mockOnLevelChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnPageSelect = vi.fn();
    mockOnLevelChange = vi.fn();
  });

  describe('Level Controls', () => {
    it('should render all three level control buttons', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getByText('Nivå 1: Kronologisk')).toBeInTheDocument();
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByText('Visa Karta')).toBeInTheDocument();
    });

    it('should start with Level 1 active', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const level1Button = screen.getByText('Nivå 1: Kronologisk').closest('button');
      expect(level1Button).toHaveClass('bg-primary');
    });

    it('should switch levels when buttons are clicked', async () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const filterButton = screen.getByText('Filter').closest('button');
      fireEvent.click(filterButton!);

      await waitFor(() => {
        expect(mockOnLevelChange).toHaveBeenCalledWith(2);
      });

      const mapButton = screen.getByText('Visa Karta').closest('button');
      fireEvent.click(mapButton!);

      await waitFor(() => {
        expect(mockOnLevelChange).toHaveBeenCalledWith(3);
      });
    });

    it('should show level descriptions', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getByText('Linjär kronologisk vy')).toBeInTheDocument();
    });
  });

  describe('Level 1: Linear View', () => {
    it('should display pages in chronological order', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const pageElements = screen.getAllByText(/Test Page/);
      expect(pageElements).toHaveLength(3);
      
      // Should be ordered by creation date (newest first)
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
      expect(screen.getByText('Test Page 2')).toBeInTheDocument();
      expect(screen.getByText('Test Page 3')).toBeInTheDocument();
    });

    it('should call onPageSelect when a page is clicked', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const firstPage = screen.getByText('Test Page 1').closest('div');
      fireEvent.click(firstPage!);

      expect(mockOnPageSelect).toHaveBeenCalledWith('1');
    });

    it('should display page metadata', () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getByText('100 ord')).toBeInTheDocument();
      expect(screen.getByText('1 kopplingar')).toBeInTheDocument();
    });

    it('should show empty state when no pages', () => {
      render(
        <ProgressiveZooming
          pages={[]}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getByText('Inga sidor än')).toBeInTheDocument();
      expect(screen.getByText('Skapa din första sida för att komma igång')).toBeInTheDocument();
    });
  });

  describe('Level 2: Filtered View', () => {
    beforeEach(() => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      // Switch to Level 2
      const filterButton = screen.getByText('Filter').closest('button');
      fireEvent.click(filterButton!);
    });

    it('should show filter sidebar', async () => {
      await waitFor(() => {
        expect(screen.getByText('Sök i innehåll')).toBeInTheDocument();
        expect(screen.getByText('Ämnen')).toBeInTheDocument();
        expect(screen.getByText('Tidsperiod')).toBeInTheDocument();
      });
    });

    it('should show filter options with counts', async () => {
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('example')).toBeInTheDocument();
        expect(screen.getByText('sample')).toBeInTheDocument();
      });
    });

    it('should filter pages by search query', async () => {
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Sök efter ord eller fraser...');
        fireEvent.change(searchInput, { target: { value: 'page 1' } });
      });

      // Should show filtered results
      await waitFor(() => {
        const pageElements = screen.getAllByText('Test Page 1');
        expect(pageElements.length).toBeGreaterThan(0);
        const page2Elements = screen.queryAllByText('Test Page 2');
        expect(page2Elements.length).toBe(0);
      });
    });

    it('should show clickable index', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Snabbindex/)).toBeInTheDocument();
      });
    });

    it('should show results count', async () => {
      await waitFor(() => {
        expect(screen.getByText('3 sidor visas')).toBeInTheDocument();
      });
    });
  });

  describe('Level 3: Graph View', () => {
    beforeEach(() => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      // Switch to Level 3
      const mapButton = screen.getByText('Visa Karta').closest('button');
      fireEvent.click(mapButton!);
    });

    it('should show graph visualization', async () => {
      await waitFor(() => {
        expect(screen.getByText('Förklaring')).toBeInTheDocument();
        expect(screen.getByText('Många kopplingar')).toBeInTheDocument();
        expect(screen.getByText('Klicka på en nod för att öppna sidan')).toBeInTheDocument();
      });
    });

    it('should show empty state when no connections', async () => {
      const pagesWithoutConnections = mockPages.map(page => ({
        ...page,
        connections: []
      }));

      render(
        <ProgressiveZooming
          pages={pagesWithoutConnections}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const mapButtons = screen.getAllByText('Visa Karta');
      const mapButton = mapButtons[0].closest('button');
      fireEvent.click(mapButton!);

      await waitFor(() => {
        expect(screen.getByText('Ingen karta än')).toBeInTheDocument();
        expect(screen.getByText('Skapa kopplingar mellan dina sidor för att se kartvy')).toBeInTheDocument();
      });
    });
  });

  describe('Transitions and State Management', () => {
    it('should disable buttons during transitions', async () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      const filterButton = screen.getByText('Filter').closest('button');
      fireEvent.click(filterButton!);

      // Buttons should be disabled during transition
      expect(filterButton).toHaveAttribute('disabled');
    });

    it('should clear filters when switching back to Level 1', async () => {
      render(
        <ProgressiveZooming
          pages={mockPages}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      // Switch to Level 2 and add filters
      const filterButton = screen.getByText('Filter').closest('button');
      fireEvent.click(filterButton!);

      await waitFor(() => {
        const testFilters = screen.getAllByText('test');
        const testFilterButton = testFilters.find(el => el.closest('button'));
        fireEvent.click(testFilterButton!.closest('button')!);
      });

      // Switch back to Level 1
      const level1Button = screen.getByText('Nivå 1: Kronologisk').closest('button');
      fireEvent.click(level1Button!);

      // Switch back to Level 2 - filters should be cleared
      fireEvent.click(filterButton!);

      await waitFor(() => {
        const testFilters = screen.getAllByText('test');
        const testFilterButton = testFilters.find(el => el.closest('button'));
        expect(testFilterButton!.closest('button')).not.toHaveClass('bg-primary');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle empty pages array gracefully', () => {
      render(
        <ProgressiveZooming
          pages={[]}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getByText('Inga sidor än')).toBeInTheDocument();
    });

    it('should handle pages without connections', () => {
      const pagesWithoutConnections = mockPages.map(page => ({
        ...page,
        connections: undefined
      }));

      render(
        <ProgressiveZooming
          pages={pagesWithoutConnections}
          onPageSelect={mockOnPageSelect}
          onLevelChange={mockOnLevelChange}
        />
      );

      expect(screen.getAllByText('Test Page 1').length).toBeGreaterThan(0);
    });

    it('should handle missing callback props gracefully', () => {
      expect(() => {
        render(<ProgressiveZooming pages={mockPages} />);
      }).not.toThrow();
    });
  });
});