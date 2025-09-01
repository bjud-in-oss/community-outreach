import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HeadingBlockComponent } from '@/components/editor/blocks/heading-block';
import { HeadingBlock } from '@/types/editor';

describe('HeadingBlockComponent', () => {
  const mockBlock: HeadingBlock = {
    id: 'heading-block-1',
    type: 'heading',
    created_at: new Date(),
    updated_at: new Date(),
    content: {
      text: 'Sample Heading',
      level: 1
    }
  };
  
  const defaultProps = {
    block: mockBlock,
    isSelected: false,
    isLocked: false,
    readOnly: false,
    onChange: vi.fn(),
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onAddBlock: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render heading content with correct level', () => {
      render(<HeadingBlockComponent {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Sample Heading');
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });
    
    it('should render different heading levels with appropriate styling', () => {
      const levels = [
        { level: 1, class: 'text-3xl' },
        { level: 2, class: 'text-2xl' },
        { level: 3, class: 'text-xl' },
        { level: 4, class: 'text-lg' },
        { level: 5, class: 'text-base' },
        { level: 6, class: 'text-sm' }
      ] as const;
      
      levels.forEach(({ level, class: expectedClass }) => {
        const block = { ...mockBlock, content: { ...mockBlock.content, level } };
        const { unmount } = render(<HeadingBlockComponent {...defaultProps} block={block} />);
        
        const heading = screen.getByRole('heading', { level });
        expect(heading).toHaveClass(expectedClass, 'font-bold');
        
        unmount();
      });
    });
    
    it('should show placeholder when text is empty', () => {
      const emptyBlock = {
        ...mockBlock,
        content: { text: '', level: 1 as const }
      };
      
      render(<HeadingBlockComponent {...defaultProps} block={emptyBlock} />);
      
      expect(screen.getByText('Click to add heading...')).toBeInTheDocument();
    });
    
    it('should show level selector when selected', () => {
      render(<HeadingBlockComponent {...defaultProps} isSelected={true} />);
      
      expect(screen.getByText('Level:')).toBeInTheDocument();
      
      // Should show buttons for levels 1-6
      for (let i = 1; i <= 6; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });
    
    it('should highlight current level in selector', () => {
      render(<HeadingBlockComponent {...defaultProps} isSelected={true} />);
      
      const level1Button = screen.getByText('1');
      expect(level1Button).toHaveClass('bg-blue-500', 'text-white');
      
      const level2Button = screen.getByText('2');
      expect(level2Button).toHaveClass('bg-white', 'text-gray-600');
    });
  });
  
  describe('Editing', () => {
    it('should enter edit mode on double click', async () => {
      const user = userEvent.setup();
      render(<HeadingBlockComponent {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sample Heading')).toBeInTheDocument();
    });
    
    it('should not enter edit mode when read-only', async () => {
      const user = userEvent.setup();
      render(<HeadingBlockComponent {...defaultProps} readOnly={true} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    
    it('should not enter edit mode when locked', async () => {
      const user = userEvent.setup();
      render(<HeadingBlockComponent {...defaultProps} isLocked={true} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    
    it('should save changes on blur', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(<HeadingBlockComponent {...defaultProps} onChange={mockOnChange} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Updated Heading');
      
      // Blur the input
      await user.click(document.body);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          content: {
            text: 'Updated Heading',
            level: 1
          }
        });
      });
    });
    
    it('should create new text block on Enter key', async () => {
      const user = userEvent.setup();
      const mockOnAddBlock = vi.fn();
      
      render(<HeadingBlockComponent {...defaultProps} onAddBlock={mockOnAddBlock} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '{Enter}');
      
      expect(mockOnAddBlock).toHaveBeenCalledWith('text');
    });
    
    it('should cancel editing on Escape key', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(<HeadingBlockComponent {...defaultProps} onChange={mockOnChange} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      await user.dblClick(heading);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Changed text');
      await user.keyboard('{Escape}');
      
      // Should not save changes
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Should exit edit mode
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Sample Heading')).toBeInTheDocument();
    });
  });
  
  describe('Level Selection', () => {
    it('should change heading level when level button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <HeadingBlockComponent 
          {...defaultProps} 
          isSelected={true} 
          onChange={mockOnChange} 
        />
      );
      
      const level3Button = screen.getByText('3');
      await user.click(level3Button);
      
      expect(mockOnChange).toHaveBeenCalledWith({
        content: {
          text: 'Sample Heading',
          level: 3
        }
      });
    });
    
    it('should not show level selector when not selected', () => {
      render(<HeadingBlockComponent {...defaultProps} isSelected={false} />);
      
      expect(screen.queryByText('Level:')).not.toBeInTheDocument();
    });
    
    it('should not show level selector when read-only', () => {
      render(
        <HeadingBlockComponent 
          {...defaultProps} 
          isSelected={true} 
          readOnly={true} 
        />
      );
      
      expect(screen.queryByText('Level:')).not.toBeInTheDocument();
    });
    
    it('should not show level selector when locked', () => {
      render(
        <HeadingBlockComponent 
          {...defaultProps} 
          isSelected={true} 
          isLocked={true} 
        />
      );
      
      expect(screen.queryByText('Level:')).not.toBeInTheDocument();
    });
  });
  
  describe('Styling', () => {
    it('should apply selected styling when selected', () => {
      render(<HeadingBlockComponent {...defaultProps} isSelected={true} />);
      
      const blockElement = screen.getByRole('heading', { level: 1 }).closest('.heading-block');
      expect(blockElement).toHaveClass('bg-blue-50', 'border-blue-200');
    });
    
    it('should apply default styling when not selected', () => {
      render(<HeadingBlockComponent {...defaultProps} isSelected={false} />);
      
      const blockElement = screen.getByRole('heading', { level: 1 }).closest('.heading-block');
      expect(blockElement).toHaveClass('bg-white', 'border-gray-200');
    });
    
    it('should show cursor-text when not read-only and not locked', () => {
      render(<HeadingBlockComponent {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('cursor-text');
    });
    
    it('should not show cursor-text when read-only', () => {
      render(<HeadingBlockComponent {...defaultProps} readOnly={true} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).not.toHaveClass('cursor-text');
    });
    
    it('should not show cursor-text when locked', () => {
      render(<HeadingBlockComponent {...defaultProps} isLocked={true} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).not.toHaveClass('cursor-text');
    });
  });
  
  describe('Event Handling', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();
      
      render(<HeadingBlockComponent {...defaultProps} onSelect={mockOnSelect} />);
      
      const blockElement = screen.getByRole('heading', { level: 1 }).closest('.heading-block');
      await user.click(blockElement!);
      
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });
});