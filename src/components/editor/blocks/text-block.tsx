'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TextBlock, EditorSuggestion } from '@/types/editor';
import { SuggestionsPanel } from '../suggestions-panel';
import { cn } from '@/lib/utils';

interface TextBlockComponentProps {
  block: TextBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  mode: 'creative-flow' | 'suggestion';
  suggestions?: EditorSuggestion[];
  isLoadingSuggestions?: boolean;
  onChange: (updates: Partial<TextBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
  onAcceptSuggestion?: (suggestionId: string) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
}

/**
 * Text Block Component
 * 
 * Renders a text block with formatting support and suggestion mode.
 */
export function TextBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  mode,
  suggestions = [],
  isLoadingSuggestions = false,
  onChange,
  onSelect,
  onDelete,
  onAddBlock,
  onAcceptSuggestion,
  onDismissSuggestion
}: TextBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(block.content.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update local text when block content changes
  useEffect(() => {
    setLocalText(block.content.text);
  }, [block.content.text]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localText, isEditing]);
  
  const handleDoubleClick = () => {
    if (!readOnly && !isLocked) {
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    if (localText !== block.content.text) {
      onChange({
        content: {
          ...block.content,
          text: localText
        }
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
      // Add a new text block after this one
      onAddBlock('text');
    } else if (e.key === 'Escape') {
      setLocalText(block.content.text);
      setIsEditing(false);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  };
  
  const formatText = (text: string) => {
    const formatting = block.content.formatting || {};
    
    let className = 'text-gray-900';
    
    if (formatting.bold) className += ' font-bold';
    if (formatting.italic) className += ' italic';
    if (formatting.underline) className += ' underline';
    if (formatting.color) className += ` text-${formatting.color}`;
    
    return className;
  };
  
  const handleAcceptSuggestion = (suggestionId: string) => {
    onAcceptSuggestion?.(suggestionId);
  };
  
  const handleDismissSuggestion = (suggestionId: string) => {
    onDismissSuggestion?.(suggestionId);
  };
  
  const showSuggestionsPanel = mode === 'suggestion' && (suggestions.length > 0 || isLoadingSuggestions);
  
  return (
    <div className="text-block-container">
      <div
        className={cn(
          'text-block p-3 rounded-lg transition-all duration-200',
          {
            'bg-blue-50 border border-blue-200': isSelected && !isEditing,
            'bg-white border border-gray-200': !isSelected,
            'bg-yellow-50 border border-yellow-200': showSuggestionsPanel
          }
        )}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full resize-none border-none outline-none bg-transparent',
              formatText(localText)
            )}
            placeholder="Start writing..."
            rows={1}
          />
        ) : (
          <div
            className={cn(
              'min-h-6 whitespace-pre-wrap',
              formatText(block.content.text),
              {
                'text-gray-400': !block.content.text,
                'cursor-text': !readOnly && !isLocked
              }
            )}
          >
            {block.content.text || 'Click to start writing...'}
          </div>
        )}
      </div>
      
      {/* Suggestions Panel */}
      {showSuggestionsPanel && (
        <div className="mt-3">
          <SuggestionsPanel
            blockId={block.id}
            suggestions={suggestions}
            isLoading={isLoadingSuggestions}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
          />
        </div>
      )}
    </div>
  );
}