/**
 * Suggestion Mode Tests
 * 
 * Tests the on-demand writing assistance functionality including:
 * - Suggestion generation
 * - Non-destructive suggestion presentation
 * - Individual suggestion accept/ignore functionality
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WYSIWYGEditor } from '@/components/editor/wysiwyg-editor';
import { SuggestionsPanel } from '@/components/editor/suggestions-panel';
import { UIStateTree, TextBlock, EditorSuggestion } from '@/types/editor';

// Mock UUID generation for consistent testing
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}));

describe('Suggestion Mode', () => {
  const mockOnChange = vi.fn();
  const mockOnStateChange = vi.fn();
  
  const initialDocument: UIStateTree = {
    metadata: {
      title: 'Test Document',
      id: 'test-doc-id',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      author: 'test-user',
      version: 1,
      tags: []
    },
    blocks: [
      {
        id: 'block-1',
        type: 'text',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        content: {
          text: 'i recieve your message',
          formatting: {}
        }
      } as TextBlock
    ],
    settings: {
      theme: 'default',
      font: 'inter',
      layout: 'standard'
    }
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });
  
  describe('Mode Toggle', () => {
    it('should start in creative-flow mode by default', () => {
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      expect(screen.getByText('Creative Flow')).toBeInTheDocument();
    });
    
    it('should switch to suggestion mode when toggled', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      await waitFor(() => {
        expect(screen.getByText('Suggestion Mode')).toBeInTheDocument();
      });
    });
    
    it('should not show mode toggle when suggestion mode is disabled', () => {
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={false}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      expect(screen.queryByText('Creative Flow')).not.toBeInTheDocument();
      expect(screen.queryByText('Suggestion Mode')).not.toBeInTheDocument();
    });
  });
  
  describe('Suggestion Generation', () => {
    it('should generate suggestions when switching to suggestion mode', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select the block first
      const blockElement = screen.getByText('i recieve your message');
      await user.click(blockElement);
      
      // Switch to suggestion mode
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Wait for suggestions to be generated
      await waitFor(() => {
        expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
    
    it('should show loading state while generating suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select the block and switch to suggestion mode
      const blockElement = screen.getByText('i recieve your message');
      await user.click(blockElement);
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Should show loading state briefly
      expect(screen.getByText('Analyzing your writing...')).toBeInTheDocument();
    });
    
    it('should not generate suggestions in creative-flow mode', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select the block (should remain in creative-flow mode)
      const blockElement = screen.getByText('i recieve your message');
      await user.click(blockElement);
      
      // Wait a bit to ensure no suggestions are generated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(screen.queryByText('Writing Suggestions')).not.toBeInTheDocument();
    });
  });
  
  describe('Suggestion Display', () => {
    const mockSuggestions: EditorSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'grammar',
        original: 'i',
        suggested: 'I',
        explanation: 'Capitalize the pronoun "I"',
        confidence: 0.95
      },
      {
        id: 'suggestion-2',
        type: 'grammar',
        original: 'recieve',
        suggested: 'receive',
        explanation: 'Correct spelling: "i before e except after c"',
        confidence: 0.97
      }
    ];
    
    it('should display suggestions in a non-destructive way', () => {
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={mockSuggestions}
          onAccept={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      
      expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
      expect(screen.getByText('2 suggestions')).toBeInTheDocument();
      expect(screen.getByText('Capitalize the pronoun "I"')).toBeInTheDocument();
      expect(screen.getByText('Correct spelling: "i before e except after c"')).toBeInTheDocument();
    });
    
    it('should show confidence scores for suggestions', () => {
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={mockSuggestions}
          onAccept={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      
      expect(screen.getByText('95% confident')).toBeInTheDocument();
      expect(screen.getByText('97% confident')).toBeInTheDocument();
    });
    
    it('should categorize suggestions by type', () => {
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={mockSuggestions}
          onAccept={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      
      const grammarBadges = screen.getAllByText('grammar');
      expect(grammarBadges).toHaveLength(2);
    });
    
    it('should show empty state when no suggestions are available', () => {
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={[]}
          onAccept={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      
      expect(screen.getByText('No suggestions available.')).toBeInTheDocument();
      expect(screen.getByText('Your writing looks great!')).toBeInTheDocument();
    });
  });
  
  describe('Suggestion Actions', () => {
    const mockSuggestions: EditorSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'grammar',
        original: 'i',
        suggested: 'I',
        explanation: 'Capitalize the pronoun "I"',
        confidence: 0.95
      }
    ];
    
    it('should call onAccept when accept button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnAccept = vi.fn();
      
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={mockSuggestions}
          onAccept={mockOnAccept}
          onDismiss={vi.fn()}
        />
      );
      
      const acceptButton = screen.getByTitle('Accept suggestion');
      await user.click(acceptButton);
      
      expect(mockOnAccept).toHaveBeenCalledWith('suggestion-1');
    });
    
    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnDismiss = vi.fn();
      
      render(
        <SuggestionsPanel
          blockId="block-1"
          suggestions={mockSuggestions}
          onAccept={vi.fn()}
          onDismiss={mockOnDismiss}
        />
      );
      
      const dismissButton = screen.getByTitle('Dismiss suggestion');
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledWith('suggestion-1');
    });
    
    it('should update document when suggestion is accepted', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select block and switch to suggestion mode
      const blockElement = screen.getByText('i recieve your message');
      await user.click(blockElement);
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Accept the first suggestion (should be "i" -> "I")
      const acceptButtons = screen.getAllByTitle('Accept suggestion');
      if (acceptButtons.length > 0) {
        await user.click(acceptButtons[0]);
        
        // Check that the document was updated
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              blocks: expect.arrayContaining([
                expect.objectContaining({
                  content: expect.objectContaining({
                    text: expect.stringContaining('I') // Should contain capitalized "I"
                  })
                })
              ])
            })
          );
        });
      }
    });
    
    it('should remove suggestion from list when dismissed', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select block and switch to suggestion mode
      const blockElement = screen.getByText('i recieve your message');
      await user.click(blockElement);
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Count initial suggestions
      const initialDismissButtons = screen.getAllByTitle('Dismiss suggestion');
      const initialCount = initialDismissButtons.length;
      
      if (initialCount > 0) {
        // Dismiss the first suggestion
        await user.click(initialDismissButtons[0]);
        
        // Check that suggestion count decreased
        await waitFor(() => {
          const remainingDismissButtons = screen.queryAllByTitle('Dismiss suggestion');
          expect(remainingDismissButtons).toHaveLength(initialCount - 1);
        });
      }
    });
  });
  
  describe('Suggestion Types', () => {
    it('should generate grammar suggestions', async () => {
      const documentWithGrammarIssues: UIStateTree = {
        ...initialDocument,
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
            content: {
              text: 'i dont recieve teh message',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={documentWithGrammarIssues}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select block and switch to suggestion mode
      const blockElement = screen.getByText('i dont recieve teh message');
      await user.click(blockElement);
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Wait for suggestions and check for grammar suggestions
      await waitFor(() => {
        expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
        // Should have grammar suggestions
        const grammarBadges = screen.queryAllByText('grammar');
        expect(grammarBadges.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
    
    it('should generate style suggestions', async () => {
      const documentWithStyleIssues: UIStateTree = {
        ...initialDocument,
        blocks: [
          {
            id: 'block-1',
            type: 'text',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
            content: {
              text: 'This is very good and very important',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={documentWithStyleIssues}
          suggestionModeEnabled={true}
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select block and switch to suggestion mode
      const blockElement = screen.getByText('This is very good and very important');
      await user.click(blockElement);
      
      const modeToggle = screen.getByText('Creative Flow');
      await user.click(modeToggle);
      
      // Wait for suggestions and check for style suggestions
      await waitFor(() => {
        expect(screen.getByText('Writing Suggestions')).toBeInTheDocument();
        // Should have style suggestions for "very + adjective"
        const styleBadges = screen.queryAllByText('style');
        expect(styleBadges.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});