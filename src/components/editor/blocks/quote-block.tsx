'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QuoteBlock } from '@/types/editor';
import { cn } from '@/lib/utils';
import { Quote } from 'lucide-react';

interface QuoteBlockComponentProps {
  block: QuoteBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  onChange: (updates: Partial<QuoteBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
}

/**
 * Quote Block Component
 * 
 * Renders a quote block with text, author, and source editing.
 */
export function QuoteBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  onChange,
  onSelect,
  onDelete,
  onAddBlock
}: QuoteBlockComponentProps) {
  const [editingField, setEditingField] = useState<'text' | 'author' | 'source' | null>(null);
  const [localText, setLocalText] = useState(block.content.text);
  const [localAuthor, setLocalAuthor] = useState(block.content.author || '');
  const [localSource, setLocalSource] = useState(block.content.source || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update local values when block content changes
  useEffect(() => {
    setLocalText(block.content.text);
    setLocalAuthor(block.content.author || '');
    setLocalSource(block.content.source || '');
  }, [block.content]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && editingField === 'text') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localText, editingField]);
  
  const handleFieldEdit = (field: 'text' | 'author' | 'source') => {
    if (!readOnly && !isLocked) {
      setEditingField(field);
    }
  };
  
  const handleFieldBlur = () => {
    setEditingField(null);
    
    const updates: Partial<QuoteBlock> = {
      content: {
        ...block.content,
        text: localText,
        author: localAuthor || undefined,
        source: localSource || undefined
      }
    };
    
    onChange(updates);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, field: 'text' | 'author' | 'source') => {
    if (e.key === 'Enter' && field !== 'text') {
      e.preventDefault();
      handleFieldBlur();
    } else if (e.key === 'Escape') {
      setLocalText(block.content.text);
      setLocalAuthor(block.content.author || '');
      setLocalSource(block.content.source || '');
      setEditingField(null);
    }
  };
  
  return (
    <div
      className={cn(
        'quote-block p-4 rounded-lg transition-all duration-200 border-l-4 border-blue-500 bg-blue-50',
        {
          'ring-2 ring-blue-300': isSelected,
          'bg-blue-25': !isSelected
        }
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Quote className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
        
        <div className="flex-1 space-y-2">
          {/* Quote text */}
          <div>
            {editingField === 'text' ? (
              <textarea
                ref={textareaRef}
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleFieldBlur}
                onKeyDown={(e) => handleKeyDown(e, 'text')}
                className="w-full resize-none border-none outline-none bg-transparent text-lg italic text-gray-800"
                placeholder="Enter quote text..."
                rows={1}
                autoFocus
              />
            ) : (
              <blockquote
                className={cn(
                  'text-lg italic text-gray-800 cursor-text',
                  {
                    'text-gray-400': !block.content.text
                  }
                )}
                onClick={() => handleFieldEdit('text')}
              >
                {block.content.text || 'Click to add quote...'}
              </blockquote>
            )}
          </div>
          
          {/* Author */}
          <div>
            {editingField === 'author' ? (
              <input
                type="text"
                value={localAuthor}
                onChange={(e) => setLocalAuthor(e.target.value)}
                onBlur={handleFieldBlur}
                onKeyDown={(e) => handleKeyDown(e, 'author')}
                className="w-full border-none outline-none bg-transparent text-sm font-medium text-gray-700"
                placeholder="Author name..."
                autoFocus
              />
            ) : (
              <div
                className={cn(
                  'text-sm font-medium text-gray-700 cursor-text',
                  {
                    'text-gray-400': !block.content.author
                  }
                )}
                onClick={() => handleFieldEdit('author')}
              >
                {block.content.author ? `— ${block.content.author}` : 'Click to add author...'}
              </div>
            )}
          </div>
          
          {/* Source */}
          <div>
            {editingField === 'source' ? (
              <input
                type="text"
                value={localSource}
                onChange={(e) => setLocalSource(e.target.value)}
                onBlur={handleFieldBlur}
                onKeyDown={(e) => handleKeyDown(e, 'source')}
                className="w-full border-none outline-none bg-transparent text-xs text-gray-600"
                placeholder="Source..."
                autoFocus
              />
            ) : (
              <div
                className={cn(
                  'text-xs text-gray-600 cursor-text',
                  {
                    'text-gray-400': !block.content.source
                  }
                )}
                onClick={() => handleFieldEdit('source')}
              >
                {block.content.source || 'Click to add source...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}