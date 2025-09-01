'use client';

import React from 'react';
import { ContentBlock, EditorSuggestion } from '@/types/editor';
import { TextBlockComponent } from './blocks/text-block';
import { HeadingBlockComponent } from './blocks/heading-block';
import { ListBlockComponent } from './blocks/list-block';
import { ImageBlockComponent } from './blocks/image-block';
import { QuoteBlockComponent } from './blocks/quote-block';
import { CodeBlockComponent } from './blocks/code-block';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  /** The block to render */
  block: ContentBlock;
  
  /** Whether this block is currently selected */
  isSelected: boolean;
  
  /** Whether this block is locked by another user */
  isLocked: boolean;
  
  /** User ID who has locked this block (if locked) */
  lockedBy?: string;
  
  /** Whether the editor is in read-only mode */
  readOnly: boolean;
  
  /** Current editor mode */
  mode: 'creative-flow' | 'suggestion';
  
  /** Suggestions for this block (if any) */
  suggestions?: EditorSuggestion[];
  
  /** Whether suggestions are being loaded */
  isLoadingSuggestions?: boolean;
  
  /** Callback when block content changes */
  onChange: (updates: Partial<ContentBlock>) => void;
  
  /** Callback when block is selected */
  onSelect: () => void;
  
  /** Callback when block should be deleted */
  onDelete: () => void;
  
  /** Callback when a new block should be added after this one */
  onAddBlock: (blockType: string) => void;
  
  /** Callback when a suggestion is accepted */
  onAcceptSuggestion?: (suggestionId: string) => void;
  
  /** Callback when a suggestion is dismissed */
  onDismissSuggestion?: (suggestionId: string) => void;
}

/**
 * Block Renderer Component
 * 
 * Renders different types of content blocks based on their type.
 * Handles selection, locking, and collaboration states.
 */
export function BlockRenderer({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  mode,
  suggestions,
  isLoadingSuggestions,
  onChange,
  onSelect,
  onDelete,
  onAddBlock,
  onAcceptSuggestion,
  onDismissSuggestion
}: BlockRendererProps) {
  const blockProps = {
    block,
    isSelected,
    isLocked,
    lockedBy,
    readOnly: readOnly || isLocked,
    onChange,
    onSelect,
    onDelete,
    onAddBlock,
    onAcceptSuggestion,
    onDismissSuggestion
  };
  
  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlockComponent 
            {...blockProps} 
            block={block}
            mode={mode}
            suggestions={suggestions}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        );
      
      case 'heading':
        return (
          <HeadingBlockComponent 
            {...blockProps} 
            block={block}
          />
        );
      
      case 'list':
        return (
          <ListBlockComponent 
            {...blockProps} 
            block={block}
          />
        );
      
      case 'image':
        return (
          <ImageBlockComponent 
            {...blockProps} 
            block={block}
          />
        );
      
      case 'quote':
        return (
          <QuoteBlockComponent 
            {...blockProps} 
            block={block}
          />
        );
      
      case 'code':
        return (
          <CodeBlockComponent 
            {...blockProps} 
            block={block}
          />
        );
      
      default:
        return (
          <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded">
            Unknown block type: {(block as any).type}
          </div>
        );
    }
  };
  
  return (
    <div
      className={cn(
        'block-wrapper relative group mb-2',
        {
          'ring-2 ring-blue-500 ring-opacity-50': isSelected,
          'ring-2 ring-red-500 ring-opacity-50': isLocked,
          'cursor-not-allowed opacity-60': isLocked
        }
      )}
      onClick={onSelect}
    >
      {/* Lock indicator */}
      {isLocked && lockedBy && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Locked by {lockedBy}
          </div>
        </div>
      )}
      
      {/* Block content */}
      {renderBlock()}
      
      {/* Block controls (shown on hover when selected) */}
      {isSelected && !readOnly && !isLocked && (
        <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
              title="Delete block"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}