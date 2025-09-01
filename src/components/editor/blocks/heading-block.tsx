'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HeadingBlock } from '@/types/editor';
import { cn } from '@/lib/utils';

interface HeadingBlockComponentProps {
  block: HeadingBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  onChange: (updates: Partial<HeadingBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
}

/**
 * Heading Block Component
 * 
 * Renders a heading block with level selection and inline editing.
 */
export function HeadingBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  onChange,
  onSelect,
  onDelete,
  onAddBlock
}: HeadingBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(block.content.text);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update local text when block content changes
  useEffect(() => {
    setLocalText(block.content.text);
  }, [block.content.text]);
  
  const handleDoubleClick = () => {
    if (!readOnly && !isLocked) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      // Add a new text block after this heading
      onAddBlock('text');
    } else if (e.key === 'Escape') {
      setLocalText(block.content.text);
      setIsEditing(false);
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  };
  
  const handleLevelChange = (newLevel: 1 | 2 | 3 | 4 | 5 | 6) => {
    onChange({
      content: {
        ...block.content,
        level: newLevel
      }
    });
  };
  
  const getHeadingClasses = (level: number) => {
    const baseClasses = 'font-bold text-gray-900';
    
    switch (level) {
      case 1:
        return `${baseClasses} text-3xl`;
      case 2:
        return `${baseClasses} text-2xl`;
      case 3:
        return `${baseClasses} text-xl`;
      case 4:
        return `${baseClasses} text-lg`;
      case 5:
        return `${baseClasses} text-base`;
      case 6:
        return `${baseClasses} text-sm`;
      default:
        return `${baseClasses} text-xl`;
    }
  };
  
  const HeadingTag = `h${block.content.level}` as keyof JSX.IntrinsicElements;
  
  return (
    <div
      className={cn(
        'heading-block p-3 rounded-lg transition-all duration-200',
        {
          'bg-blue-50 border border-blue-200': isSelected && !isEditing,
          'bg-white border border-gray-200': !isSelected
        }
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {/* Level selector */}
      {isSelected && !readOnly && !isLocked && (
        <div className="mb-2 flex gap-1">
          <span className="text-xs text-gray-600 mr-2">Level:</span>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level as 1 | 2 | 3 | 4 | 5 | 6)}
              className={cn(
                'w-6 h-6 text-xs rounded border transition-colors',
                {
                  'bg-blue-500 text-white border-blue-500': block.content.level === level,
                  'bg-white text-gray-600 border-gray-300 hover:bg-gray-50': block.content.level !== level
                }
              )}
            >
              {level}
            </button>
          ))}
        </div>
      )}
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full border-none outline-none bg-transparent',
            getHeadingClasses(block.content.level)
          )}
          placeholder="Enter heading..."
        />
      ) : (
        <HeadingTag
          className={cn(
            getHeadingClasses(block.content.level),
            {
              'text-gray-400': !block.content.text,
              'cursor-text': !readOnly && !isLocked
            }
          )}
        >
          {block.content.text || 'Click to add heading...'}
        </HeadingTag>
      )}
    </div>
  );
}