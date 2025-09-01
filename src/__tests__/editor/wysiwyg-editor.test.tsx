import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WYSIWYGEditor } from '@/components/editor/wysiwyg-editor';
import { UIStateTree, TextBlock } from '@/types/editor';

// Mock UUID generation for consistent testing
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234')
}));

describe('WYSIWYGEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnStateChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should render with empty document when no initial document provided', () => {
      render(<WYSIWYGEditor />);
      
      expect(screen.getByText('Start writing your thoughts...')).toBeInTheDocument();
    });
    
    it('should render with provided initial document', () => {
      const initialDocument: UIStateTree = {
        metadata: {
          title: 'Test Document',
          id: 'test-doc-1',
          created_at: new Date(),
          updated_at: new Date(),
          author: 'test-user',
          version: 1
        },
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date(),
            updated_at: new Date(),
            content: {
              text: 'Hello, world!',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      render(<WYSIWYGEditor initialDocument={initialDocument} />);
      
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });
    
    it('should start in creative-flow mode by default', () => {
      render(<WYSIWYGEditor />);
      
      expect(screen.getByText('Creative Flow')).toBeInTheDocument();
    });
  });
  
  describe('Block Management', () => {
    it('should add a new text block when toolbar button is clicked', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      const addTextButton = screen.getByTitle('Add Text Block');
      await user.click(addTextButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                id: 'mock-uuid-1234'
              })
            ])
          })
        );
      });
    });
    
    it('should add a new heading block when toolbar button is clicked', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      const addHeadingButton = screen.getByTitle('Add Heading');
      await user.click(addHeadingButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                type: 'heading',
                id: 'mock-uuid-1234'
              })
            ])
          })
        );
      });
    });
    
    it('should not allow deleting the last block', async () => {
      const user = userEvent.setup();
      const initialDocument: UIStateTree = {
        metadata: {
          title: 'Test Document',
          id: 'test-doc-1',
          created_at: new Date(),
          updated_at: new Date(),
          author: 'test-user',
          version: 1
        },
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date(),
            updated_at: new Date(),
            content: {
              text: 'Only block',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      render(<WYSIWYGEditor initialDocument={initialDocument} onChange={mockOnChange} />);
      
      // Select the block first
      const blockElement = screen.getByText('Only block');
      await user.click(blockElement);
      
      // Try to delete it
      const deleteButton = screen.getByTitle('Delete block');
      await user.click(deleteButton);
      
      // Block should still be there
      expect(screen.getByText('Only block')).toBeInTheDocument();
    });
  });
  
  describe('Mode Switching', () => {
    it('should switch between creative-flow and suggestion modes', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor suggestionModeEnabled={true} />);
      
      // Should start in creative-flow mode
      expect(screen.getByText('Creative Flow')).toBeInTheDocument();
      
      // Click to switch to suggestion mode
      const modeButton = screen.getByText('Creative Flow');
      await user.click(modeButton);
      
      expect(screen.getByText('Suggestion Mode')).toBeInTheDocument();
      expect(screen.getByText('Writing assistance active')).toBeInTheDocument();
    });
    
    it('should not show mode toggle when suggestion mode is disabled', () => {
      render(<WYSIWYGEditor suggestionModeEnabled={false} />);
      
      expect(screen.queryByText('Creative Flow')).not.toBeInTheDocument();
      expect(screen.queryByText('Suggestion Mode')).not.toBeInTheDocument();
    });
  });
  
  describe('History Management', () => {
    it('should support undo functionality', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      // Add a block to create history
      const addTextButton = screen.getByTitle('Add Text Block');
      await user.click(addTextButton);
      
      // Undo should now be enabled
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      expect(undoButton).not.toBeDisabled();
      
      await user.click(undoButton);
      
      // Should call onChange with the previous state
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                type: 'text'
              })
            ])
          })
        );
      });
    });
    
    it('should support redo functionality', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      // Add a block, then undo, then redo
      const addTextButton = screen.getByTitle('Add Text Block');
      await user.click(addTextButton);
      
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      await user.click(undoButton);
      
      const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
      expect(redoButton).not.toBeDisabled();
      
      await user.click(redoButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                id: 'mock-uuid-1234'
              })
            ])
          })
        );
      });
    });
  });
  
  describe('Read-only Mode', () => {
    it('should not show toolbar in read-only mode', () => {
      render(<WYSIWYGEditor readOnly={true} />);
      
      expect(screen.queryByTitle('Add Text Block')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Undo (Ctrl+Z)')).not.toBeInTheDocument();
    });
    
    it('should not allow editing in read-only mode', () => {
      const initialDocument: UIStateTree = {
        metadata: {
          title: 'Test Document',
          id: 'test-doc-1',
          created_at: new Date(),
          updated_at: new Date(),
          author: 'test-user',
          version: 1
        },
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date(),
            updated_at: new Date(),
            content: {
              text: 'Read-only text',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      render(<WYSIWYGEditor initialDocument={initialDocument} readOnly={true} />);
      
      const textElement = screen.getByText('Read-only text');
      
      // Double-click should not make it editable
      fireEvent.doubleClick(textElement);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
  
  describe('Collaboration Features', () => {
    it('should show locked blocks when collaboration is enabled', () => {
      const initialDocument: UIStateTree = {
        metadata: {
          title: 'Test Document',
          id: 'test-doc-1',
          created_at: new Date(),
          updated_at: new Date(),
          author: 'test-user',
          version: 1
        },
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date(),
            updated_at: new Date(),
            content: {
              text: 'Locked text',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      render(
        <WYSIWYGEditor 
          initialDocument={initialDocument}
          collaborationEnabled={true}
          onStateChange={(state) => {
            // Simulate a locked block
            state.collaboration.lockedBlocks['block-1'] = 'other-user';
          }}
        />
      );
      
      // The block should be marked as locked
      expect(screen.getByText('Locked text')).toBeInTheDocument();
    });
  });
  
  describe('Document Structure Validation', () => {
    it('should maintain UIStateTree structure in output', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      const addTextButton = screen.getByTitle('Add Text Block');
      await user.click(addTextButton);
      
      await waitFor(() => {
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
        const document = lastCall[0];
        
        // Validate UIStateTree structure
        expect(document).toHaveProperty('metadata');
        expect(document).toHaveProperty('blocks');
        expect(document).toHaveProperty('settings');
        
        expect(document.metadata).toHaveProperty('title');
        expect(document.metadata).toHaveProperty('id');
        expect(document.metadata).toHaveProperty('created_at');
        expect(document.metadata).toHaveProperty('updated_at');
        expect(document.metadata).toHaveProperty('author');
        expect(document.metadata).toHaveProperty('version');
        
        expect(Array.isArray(document.blocks)).toBe(true);
        
        document.blocks.forEach((block: any) => {
          expect(block).toHaveProperty('id');
          expect(block).toHaveProperty('type');
          expect(block).toHaveProperty('created_at');
          expect(block).toHaveProperty('updated_at');
          expect(block).toHaveProperty('content');
        });
      });
    });
    
    it('should increment version number on changes', async () => {
      const user = userEvent.setup();
      render(<WYSIWYGEditor onChange={mockOnChange} />);
      
      const addTextButton = screen.getByTitle('Add Text Block');
      await user.click(addTextButton);
      
      await waitFor(() => {
        const document = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        expect(document.metadata.version).toBeGreaterThan(1);
      });
    });
  });
});