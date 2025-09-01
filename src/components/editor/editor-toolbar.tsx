'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Undo, 
  Redo, 
  Type, 
  Heading1, 
  List, 
  Image, 
  Quote,
  Code,
  Lightbulb,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  /** Current editor mode */
  mode: 'creative-flow' | 'suggestion';
  
  /** Whether undo is available */
  canUndo: boolean;
  
  /** Whether redo is available */
  canRedo: boolean;
  
  /** Whether suggestion mode is enabled */
  suggestionModeEnabled: boolean;
  
  /** Callback to toggle between modes */
  onModeToggle: () => void;
  
  /** Callback for undo action */
  onUndo: () => void;
  
  /** Callback for redo action */
  onRedo: () => void;
  
  /** Callback to add a new block */
  onAddBlock: (blockType: string) => void;
}

/**
 * Editor Toolbar Component
 * 
 * Provides controls for editor actions including mode switching,
 * undo/redo, and block creation.
 */
export function EditorToolbar({
  mode,
  canUndo,
  canRedo,
  suggestionModeEnabled,
  onModeToggle,
  onUndo,
  onRedo,
  onAddBlock
}: EditorToolbarProps) {
  const isCreativeFlow = mode === 'creative-flow';
  
  return (
    <div className="editor-toolbar flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
      {/* Mode Toggle */}
      {suggestionModeEnabled && (
        <div className="flex items-center gap-2 mr-4">
          <Button
            variant={isCreativeFlow ? "default" : "outline"}
            size="sm"
            onClick={onModeToggle}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {isCreativeFlow ? 'Creative Flow' : 'Suggestion Mode'}
          </Button>
          
          {!isCreativeFlow && (
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <Lightbulb className="h-4 w-4" />
              <span>Writing assistance active</span>
            </div>
          )}
        </div>
      )}
      
      {/* History Controls */}
      <div className="flex items-center gap-1 mr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Block Creation Controls */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600 mr-2">Add:</span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('text')}
          title="Add Text Block"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('heading')}
          title="Add Heading"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('list')}
          title="Add List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('quote')}
          title="Add Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('image')}
          title="Add Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock('code')}
          title="Add Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}