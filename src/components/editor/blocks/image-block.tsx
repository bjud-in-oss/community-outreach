'use client';

import React, { useState } from 'react';
import { ImageBlock } from '@/types/editor';
import { cn } from '@/lib/utils';
import { Image, Upload } from 'lucide-react';

interface ImageBlockComponentProps {
  block: ImageBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  onChange: (updates: Partial<ImageBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
}

/**
 * Image Block Component
 * 
 * Renders an image block with upload and caption editing capabilities.
 */
export function ImageBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  onChange,
  onSelect,
  onDelete,
  onAddBlock
}: ImageBlockComponentProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [localCaption, setLocalCaption] = useState(block.content.caption || '');
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to cloud storage
      const mockUrl = URL.createObjectURL(file);
      onChange({
        content: {
          ...block.content,
          src: mockUrl,
          alt: file.name
        }
      });
    }
  };
  
  const handleCaptionBlur = () => {
    setIsEditingCaption(false);
    if (localCaption !== (block.content.caption || '')) {
      onChange({
        content: {
          ...block.content,
          caption: localCaption
        }
      });
    }
  };
  
  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCaptionBlur();
    } else if (e.key === 'Escape') {
      setLocalCaption(block.content.caption || '');
      setIsEditingCaption(false);
    }
  };
  
  return (
    <div
      className={cn(
        'image-block p-3 rounded-lg transition-all duration-200',
        {
          'bg-blue-50 border border-blue-200': isSelected,
          'bg-white border border-gray-200': !isSelected
        }
      )}
      onClick={onSelect}
    >
      {block.content.src ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={block.content.src}
              alt={block.content.alt}
              className="max-w-full h-auto rounded"
              style={{
                width: block.content.width ? `${block.content.width}px` : 'auto',
                height: block.content.height ? `${block.content.height}px` : 'auto'
              }}
            />
            
            {/* Replace image button */}
            {isSelected && !readOnly && !isLocked && (
              <div className="absolute top-2 right-2">
                <label className="cursor-pointer bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-70 transition-all">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          
          {/* Caption */}
          <div className="text-center">
            {isEditingCaption ? (
              <input
                type="text"
                value={localCaption}
                onChange={(e) => setLocalCaption(e.target.value)}
                onBlur={handleCaptionBlur}
                onKeyDown={handleCaptionKeyDown}
                className="w-full text-center text-sm text-gray-600 border-none outline-none bg-transparent"
                placeholder="Add a caption..."
                autoFocus
              />
            ) : (
              <div
                className={cn(
                  'text-sm text-gray-600 cursor-text',
                  {
                    'text-gray-400': !block.content.caption
                  }
                )}
                onClick={() => !readOnly && !isLocked && setIsEditingCaption(true)}
              >
                {block.content.caption || 'Click to add caption...'}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Upload placeholder
        <div className="text-center py-8">
          <div className="inline-flex flex-col items-center gap-2">
            <Image className="h-12 w-12 text-gray-400" />
            <div className="text-gray-600">No image selected</div>
            
            {!readOnly && !isLocked && (
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                <Upload className="h-4 w-4 inline mr-2" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}