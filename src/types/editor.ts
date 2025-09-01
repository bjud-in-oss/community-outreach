/**
 * Types for the WYSIWYG-JSON Editor
 * Defines the UIStateTree structure and editor interfaces
 */

/**
 * Base block interface for all content blocks
 */
export interface BaseBlock {
  /** Unique identifier for this block */
  id: string;
  
  /** Block type identifier */
  type: string;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last modified timestamp */
  updated_at: Date;
  
  /** Block metadata */
  metadata?: Record<string, any>;
}

/**
 * Text block for paragraphs and formatted text
 */
export interface TextBlock extends BaseBlock {
  type: 'text';
  content: {
    text: string;
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      color?: string;
    };
  };
}

/**
 * Heading block for titles and sections
 */
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

/**
 * List block for ordered and unordered lists
 */
export interface ListBlock extends BaseBlock {
  type: 'list';
  content: {
    items: string[];
    ordered: boolean;
  };
}

/**
 * Image block for visual content
 */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  content: {
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
  };
}

/**
 * Quote block for highlighted text
 */
export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: {
    text: string;
    author?: string;
    source?: string;
  };
}

/**
 * Code block for technical content
 */
export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: {
    code: string;
    language?: string;
  };
}

/**
 * Union type for all block types
 */
export type ContentBlock = 
  | TextBlock 
  | HeadingBlock 
  | ListBlock 
  | ImageBlock 
  | QuoteBlock 
  | CodeBlock;

/**
 * UIStateTree structure representing the complete document state
 */
export interface UIStateTree {
  /** Document metadata */
  metadata: {
    /** Document title */
    title: string;
    
    /** Document ID */
    id: string;
    
    /** Creation timestamp */
    created_at: Date;
    
    /** Last modified timestamp */
    updated_at: Date;
    
    /** Document author */
    author: string;
    
    /** Document version */
    version: number;
    
    /** Document tags */
    tags?: string[];
  };
  
  /** Array of content blocks */
  blocks: ContentBlock[];
  
  /** Document-level settings */
  settings?: {
    /** Theme/styling preferences */
    theme?: string;
    
    /** Font preferences */
    font?: string;
    
    /** Layout preferences */
    layout?: string;
  };
}

/**
 * Editor state interface
 */
export interface EditorState {
  /** Current document */
  document: UIStateTree;
  
  /** Currently selected block ID */
  selectedBlockId?: string;
  
  /** Editor mode */
  mode: 'creative-flow' | 'suggestion';
  
  /** Collaboration state */
  collaboration: {
    /** Blocks currently being edited by others */
    lockedBlocks: Record<string, string>; // blockId -> userId
    
    /** Current user's locked block */
    currentUserLock?: string;
  };
  
  /** Undo/redo history */
  history: {
    /** Past states for undo */
    past: UIStateTree[];
    
    /** Future states for redo */
    future: UIStateTree[];
  };
  
  /** Suggestion state */
  suggestions?: {
    /** Block ID with suggestions */
    blockId: string;
    
    /** Array of suggestions */
    suggestions: EditorSuggestion[];
  };
}

/**
 * Editor suggestion interface
 */
export interface EditorSuggestion {
  /** Suggestion ID */
  id: string;
  
  /** Suggestion type */
  type: 'grammar' | 'style' | 'clarity' | 'tone';
  
  /** Original text */
  original: string;
  
  /** Suggested replacement */
  suggested: string;
  
  /** Explanation of the suggestion */
  explanation: string;
  
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Editor action types
 */
export type EditorAction = 
  | { type: 'ADD_BLOCK'; payload: { block: ContentBlock; position?: number } }
  | { type: 'UPDATE_BLOCK'; payload: { blockId: string; updates: Partial<ContentBlock> } }
  | { type: 'DELETE_BLOCK'; payload: { blockId: string } }
  | { type: 'MOVE_BLOCK'; payload: { blockId: string; newPosition: number } }
  | { type: 'SELECT_BLOCK'; payload: { blockId?: string } }
  | { type: 'SET_MODE'; payload: { mode: 'creative-flow' | 'suggestion' } }
  | { type: 'LOCK_BLOCK'; payload: { blockId: string; userId: string } }
  | { type: 'UNLOCK_BLOCK'; payload: { blockId: string } }
  | { type: 'ADD_SUGGESTIONS'; payload: { blockId: string; suggestions: EditorSuggestion[] } }
  | { type: 'ACCEPT_SUGGESTION'; payload: { suggestionId: string } }
  | { type: 'REJECT_SUGGESTION'; payload: { suggestionId: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

/**
 * Editor component props
 */
export interface WYSIWYGEditorProps {
  /** Initial document state */
  initialDocument?: UIStateTree;
  
  /** Callback when document changes */
  onChange?: (document: UIStateTree) => void;
  
  /** Callback when editor state changes */
  onStateChange?: (state: EditorState) => void;
  
  /** Whether collaboration features are enabled */
  collaborationEnabled?: boolean;
  
  /** Current user ID for collaboration */
  userId?: string;
  
  /** Whether suggestion mode is available */
  suggestionModeEnabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

/**
 * Block component props
 */
export interface BlockComponentProps<T extends ContentBlock = ContentBlock> {
  /** The block data */
  block: T;
  
  /** Whether this block is selected */
  isSelected: boolean;
  
  /** Whether this block is locked by another user */
  isLocked: boolean;
  
  /** User ID who has locked this block (if locked) */
  lockedBy?: string;
  
  /** Whether the editor is in read-only mode */
  readOnly: boolean;
  
  /** Callback when block content changes */
  onChange: (updates: Partial<T>) => void;
  
  /** Callback when block is selected */
  onSelect: () => void;
  
  /** Callback when block should be deleted */
  onDelete: () => void;
  
  /** Callback when a new block should be added after this one */
  onAddBlock: (blockType: string) => void;
}