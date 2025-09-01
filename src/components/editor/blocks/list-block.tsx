'use client';

import React, { useState } from 'react';
import { ListBlock } from '@/types/editor';
import { cn } from '@/lib/utils';

interface ListBlockComponentProps {
  block: ListBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  onChange: (updates: Partial<ListBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
}

/**
 * List Block Component
 * 
 * Renders a list block with ordered/unordered toggle and item editing.
 */
export function ListBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  onChange,
  onSelect,
  onDelete,
  onAddBlock
}: ListBlockComponentProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState(block.content.items);
  
  const handleToggleOrdered = () => {
    if (!readOnly && !isLocked) {
      onChange({
        content: {
          ...block.content,
          ordered: !block.content.ordered
        }
      });
    }
  };
  
  const handleItemEdit = (index: number, value: string) => {
    const newItems = [...localItems];
    newItems[index] = value;
    setLocalItems(newItems);
  };
  
  const handleItemBlur = (index: number) => {
    setEditingIndex(null);
    onChange({
      content: {
        ...block.content,
        items: localItems
      }
    });
  };
  
  const handleAddItem = () => {
    const newItems = [...localItems, ''];
    setLocalItems(newItems);
    onChange({
      content: {
        ...block.content,
        items: newItems
      }
    });
    setEditingIndex(newItems.length - 1);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
    onChange({
      content: {
        ...block.content,
        items: newItems
      }
    });
  };
  
  const ListTag = block.content.ordered ? 'ol' : 'ul';
  
  return (
    <div
      className={cn(
        'list-block p-3 rounded-lg transition-all duration-200',
        {
          'bg-blue-50 border border-blue-200': isSelected,
          'bg-white border border-gray-200': !isSelected
        }
      )}
      onClick={onSelect}
    >
      {/* List type toggle */}
      {isSelected && !readOnly && !isLocked && (
        <div className="mb-2 flex gap-2 items-center">
          <button
            onClick={handleToggleOrdered}
            className={cn(
              'px-3 py-1 text-xs rounded border transition-colors',
              {
                'bg-blue-500 text-white border-blue-500': block.content.ordered,
                'bg-white text-gray-600 border-gray-300 hover:bg-gray-50': !block.content.ordered
              }
            )}
          >
            Ordered
          </button>
          <button
            onClick={handleToggleOrdered}
            className={cn(
              'px-3 py-1 text-xs rounded border transition-colors',
              {
                'bg-blue-500 text-white border-blue-500': !block.content.ordered,
                'bg-white text-gray-600 border-gray-300 hover:bg-gray-50': block.content.ordered
              }
            )}
          >
            Unordered
          </button>
        </div>
      )}
      
      <ListTag className={cn(
        block.content.ordered ? 'list-decimal' : 'list-disc',
        'ml-6 space-y-1'
      )}>
        {localItems.map((item, index) => (
          <li key={index} className="group flex items-center gap-2">
            {editingIndex === index ? (
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemEdit(index, e.target.value)}
                onBlur={() => handleItemBlur(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleItemBlur(index);
                    handleAddItem();
                  } else if (e.key === 'Escape') {
                    setEditingIndex(null);
                  }
                }}
                className="flex-1 border-none outline-none bg-transparent"
                placeholder="List item..."
                autoFocus
              />
            ) : (
              <span
                className={cn(
                  'flex-1 cursor-text',
                  {
                    'text-gray-400': !item
                  }
                )}
                onClick={() => !readOnly && !isLocked && setEditingIndex(index)}
              >
                {item || 'Click to edit...'}
              </span>
            )}
            
            {isSelected && !readOnly && !isLocked && (
              <button
                onClick={() => handleRemoveItem(index)}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 text-red-500 hover:text-red-700 transition-all"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ListTag>
      
      {/* Add item button */}
      {isSelected && !readOnly && !isLocked && (
        <button
          onClick={handleAddItem}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          + Add item
        </button>
      )}
    </div>
  );
}