import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TextBlockComponent } from '@/components/editor/blocks/text-block';
import { TextBlock, EditorSuggestion } from '@/types/editor';

describe('TextBlockComponent', () => {
  const mockBlock: TextBlock = {
    id: 'text-block-1',
    type: 'text',
    created_at: new Date(),
    updated_at: new Date(),
    content: {
      text: 'Sample text content',
      formatting: {}
    }
  };
  
  const defaultProps = {
    block: mockBlock,
    isSelected: false,
    isLocked: false,
    readOnly: false,
    mode: 'creative-flow' as const,
    onChange: vi.fn(),
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onAddBlock: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render text content', () => {
      render(<TextBlockComponent {...defaultProps} />);
      
      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });
    
    it('should show placeholder when text is empty', () => {
      const emptyBlock = {
        ...mockBlock,
        content: { text: '', formatting: {} }
      };
      
      render(<TextBlockComponent {...defaultProps} block={emptyBlock} />);
      
      expect(screen.getByText('Click to start writing...')).toBeInTheDocument();
    });
    
    it('should apply selected styling when selected', () => {
      render(<TextBlockComponent {...defaultProps} isSelected={true} />);
      
      const blockElement = screen.getByText('Sample text content').closest('.text-block');
      expect(blockElement).toHaveClass('bg-blue-50', 'border-blue-200');
    });
    
    it('should show locked indicator when locked', () => {
      render(
        <TextBlockComponent 
          {...defaultProps} 
          isLocked={true} 
          lockedBy="other-user" 
        />
      );
      
      expect(screen.getByText('Locked by other-user')).toBeInTheDocument();
    });
  });
  
  describe('Editing', () => {
    it('should enter edit mode on double click', async () => {
      const user = userEvent.setup();
      render(<TextBlockComponent {...defaultProps} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sample text content')).toBeInTheDocument();
    });
    
    it('should not enter edit mode when read-only', async () => {
      const user = userEvent.setup();
      render(<TextBlockComponent {...defaultProps} readOnly={true} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    
    it('should not enter edit mode when locked', async () => {
      const user = userEvent.setup();
      render(<TextBlockComponent {...defaultProps} isLocked={true} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    
    it('should save changes on blur', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(<TextBlockComponent {...defaultProps} onChange={mockOnChange} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated text content');
      
      // Blur the textarea
      await user.click(document.body);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          content: {
            text: 'Updated text content',
            formatting: {}
          }
        });
      });
    });
    
    it('should create new block on Enter key', async () => {
      const user = userEvent.setup();
      const mockOnAddBlock = vi.fn();
      
      render(<TextBlockComponent {...defaultProps} onAddBlock={mockOnAddBlock} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '{Enter}');
      
      expect(mockOnAddBlock).toHaveBeenCalledWith('text');
    });
    
    it('should cancel editing on Escape key', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(<TextBlockComponent {...defaultProps} onChange={mockOnChange} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Changed text');
      await user.keyboard('{Escape}');
      
      // Should not save changes
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Should exit edit mode
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });
  });
  
  describe('Suggestion Mode', () => {
    const mockSuggestions: EditorSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'grammar',
        original: 'Sample text',
        suggested: 'Example text',
        explanation: 'More precise word choice',
        confidence: 0.8
      },
      {
        id: 'suggestion-2',
        type: 'style',
        original: 'content',
        suggested: 'material',
        explanation: 'Better style',
        confidence: 0.6
      }
    ];
    
    it('should show suggestions in suggestion mode', () => {
      render(
        <TextBlockComponent 
          {...defaultProps} 
          mode="suggestion"
          suggestions={mockSuggestions}
        />
      );
      
      expect(screen.getByText('Writing suggestions:')).toBeInTheDocument();
      expect(screen.getByText('grammar: More precise word choice')).toBeInTheDocument();
      expect(screen.getByText('style: Better style')).toBeInTheDocument();
    });
    
    it('should not show suggestions in creative-flow mode', () => {
      render(
        <TextBlockComponent 
          {...defaultProps} 
          mode="creative-flow"
          suggestions={mockSuggestions}
        />
      );
      
      expect(screen.queryByText('Writing suggestions:')).not.toBeInTheDocument();
    });
    
    it('should show accept and ignore buttons for suggestions', () => {
      render(
        <TextBlockComponent 
          {...defaultProps} 
          mode="suggestion"
          suggestions={mockSuggestions}
        />
      );
      
      const acceptButtons = screen.getAllByText('Accept');
      const ignoreButtons = screen.getAllByText('Ignore');
      
      expect(acceptButtons).toHaveLength(2);
      expect(ignoreButtons).toHaveLength(2);
    });
    
    it('should apply suggestion styling when suggestions are present', () => {
      render(
        <TextBlockComponent 
          {...defaultProps} 
          mode="suggestion"
          suggestions={mockSuggestions}
        />
      );
      
      const blockElement = screen.getByText('Sample text content').closest('.text-block');
      expect(blockElement).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });
  });
  
  describe('Formatting', () => {
    it('should apply bold formatting', () => {
      const boldBlock = {
        ...mockBlock,
        content: {
          text: 'Bold text',
          formatting: { bold: true }
        }
      };
      
      render(<TextBlockComponent {...defaultProps} block={boldBlock} />);
      
      const textElement = screen.getByText('Bold text');
      expect(textElement).toHaveClass('font-bold');
    });
    
    it('should apply italic formatting', () => {
      const italicBlock = {
        ...mockBlock,
        content: {
          text: 'Italic text',
          formatting: { italic: true }
        }
      };
      
      render(<TextBlockComponent {...defaultProps} block={italicBlock} />);
      
      const textElement = screen.getByText('Italic text');
      expect(textElement).toHaveClass('italic');
    });
    
    it('should apply underline formatting', () => {
      const underlineBlock = {
        ...mockBlock,
        content: {
          text: 'Underlined text',
          formatting: { underline: true }
        }
      };
      
      render(<TextBlockComponent {...defaultProps} block={underlineBlock} />);
      
      const textElement = screen.getByText('Underlined text');
      expect(textElement).toHaveClass('underline');
    });
    
    it('should apply multiple formatting options', () => {
      const formattedBlock = {
        ...mockBlock,
        content: {
          text: 'Formatted text',
          formatting: { 
            bold: true, 
            italic: true, 
            underline: true 
          }
        }
      };
      
      render(<TextBlockComponent {...defaultProps} block={formattedBlock} />);
      
      const textElement = screen.getByText('Formatted text');
      expect(textElement).toHaveClass('font-bold', 'italic', 'underline');
    });
  });
  
  describe('Event Handling', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();
      
      render(<TextBlockComponent {...defaultProps} onSelect={mockOnSelect} />);
      
      const blockElement = screen.getByText('Sample text content').closest('.text-block');
      await user.click(blockElement!);
      
      expect(mockOnSelect).toHaveBeenCalled();
    });
    
    it('should auto-resize textarea based on content', async () => {
      const user = userEvent.setup();
      
      render(<TextBlockComponent {...defaultProps} />);
      
      const textElement = screen.getByText('Sample text content');
      await user.dblClick(textElement);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // Add multiple lines of text
      await user.clear(textarea);
      await user.type(textarea, 'Line 1{shift}{enter}Line 2{shift}{enter}Line 3');
      
      // Textarea should adjust its height
      expect(textarea.style.height).not.toBe('');
    });
  });
});