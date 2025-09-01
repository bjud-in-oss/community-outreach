'use client';

import React, { useReducer, useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  UIStateTree, 
  EditorState, 
  EditorAction, 
  ContentBlock, 
  WYSIWYGEditorProps,
  TextBlock 
} from '@/types/editor';
import { BlockRenderer } from './block-renderer';
import { EditorToolbar } from './editor-toolbar';
import { CollaborationStatus } from './collaboration-status';
import { SemanticDiff } from './semantic-diff';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useSuggestions } from '@/hooks/use-suggestions';
import { cn } from '@/lib/utils';

/**
 * Creates an empty UIStateTree document
 */
function createEmptyDocument(): UIStateTree {
  const now = new Date();
  return {
    metadata: {
      title: 'Untitled Document',
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      author: 'current-user', // TODO: Get from user context
      version: 1,
      tags: []
    },
    blocks: [
      {
        id: uuidv4(),
        type: 'text',
        created_at: now,
        updated_at: now,
        content: {
          text: '',
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
}

/**
 * Initial editor state
 */
function createInitialState(initialDocument?: UIStateTree): EditorState {
  const document = initialDocument || createEmptyDocument();
  
  return {
    document,
    selectedBlockId: document.blocks[0]?.id,
    mode: 'creative-flow',
    collaboration: {
      lockedBlocks: {},
      currentUserLock: undefined
    },
    history: {
      past: [],
      future: []
    }
  };
}

/**
 * Editor state reducer
 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'ADD_BLOCK': {
      const { block, position } = action.payload;
      const newBlocks = [...state.document.blocks];
      
      if (position !== undefined) {
        newBlocks.splice(position, 0, block);
      } else {
        newBlocks.push(block);
      }
      
      const newDocument = {
        ...state.document,
        blocks: newBlocks,
        metadata: {
          ...state.document.metadata,
          updated_at: new Date(),
          version: state.document.metadata.version + 1
        }
      };
      
      return {
        ...state,
        document: newDocument,
        selectedBlockId: block.id,
        history: {
          past: [...state.history.past, state.document],
          future: []
        }
      };
    }
    
    case 'UPDATE_BLOCK': {
      const { blockId, updates } = action.payload;
      const blockIndex = state.document.blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex === -1) return state;
      
      const updatedBlock = {
        ...state.document.blocks[blockIndex],
        ...updates,
        updated_at: new Date()
      } as ContentBlock;
      
      const newBlocks = [...state.document.blocks];
      newBlocks[blockIndex] = updatedBlock;
      
      const newDocument = {
        ...state.document,
        blocks: newBlocks,
        metadata: {
          ...state.document.metadata,
          updated_at: new Date(),
          version: state.document.metadata.version + 1
        }
      };
      
      return {
        ...state,
        document: newDocument,
        history: {
          past: [...state.history.past, state.document],
          future: []
        }
      };
    }
    
    case 'DELETE_BLOCK': {
      const { blockId } = action.payload;
      const newBlocks = state.document.blocks.filter(b => b.id !== blockId);
      
      // Don't allow deleting the last block
      if (newBlocks.length === 0) {
        return state;
      }
      
      const newDocument = {
        ...state.document,
        blocks: newBlocks,
        metadata: {
          ...state.document.metadata,
          updated_at: new Date(),
          version: state.document.metadata.version + 1
        }
      };
      
      // Update selected block if the deleted block was selected
      let newSelectedBlockId = state.selectedBlockId;
      if (state.selectedBlockId === blockId) {
        newSelectedBlockId = newBlocks[0]?.id;
      }
      
      return {
        ...state,
        document: newDocument,
        selectedBlockId: newSelectedBlockId,
        history: {
          past: [...state.history.past, state.document],
          future: []
        }
      };
    }
    
    case 'MOVE_BLOCK': {
      const { blockId, newPosition } = action.payload;
      const blockIndex = state.document.blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex === -1 || newPosition < 0 || newPosition >= state.document.blocks.length) {
        return state;
      }
      
      const newBlocks = [...state.document.blocks];
      const [movedBlock] = newBlocks.splice(blockIndex, 1);
      newBlocks.splice(newPosition, 0, movedBlock);
      
      const newDocument = {
        ...state.document,
        blocks: newBlocks,
        metadata: {
          ...state.document.metadata,
          updated_at: new Date(),
          version: state.document.metadata.version + 1
        }
      };
      
      return {
        ...state,
        document: newDocument,
        history: {
          past: [...state.history.past, state.document],
          future: []
        }
      };
    }
    
    case 'SELECT_BLOCK': {
      return {
        ...state,
        selectedBlockId: action.payload.blockId
      };
    }
    
    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload.mode
      };
    }
    
    case 'LOCK_BLOCK': {
      const { blockId, userId } = action.payload;
      return {
        ...state,
        collaboration: {
          ...state.collaboration,
          lockedBlocks: {
            ...state.collaboration.lockedBlocks,
            [blockId]: userId
          }
        }
      };
    }
    
    case 'UNLOCK_BLOCK': {
      const { blockId } = action.payload;
      const newLockedBlocks = { ...state.collaboration.lockedBlocks };
      delete newLockedBlocks[blockId];
      
      return {
        ...state,
        collaboration: {
          ...state.collaboration,
          lockedBlocks: newLockedBlocks
        }
      };
    }
    
    case 'ADD_SUGGESTIONS': {
      const { blockId, suggestions } = action.payload;
      return {
        ...state,
        suggestions: {
          blockId,
          suggestions
        }
      };
    }
    
    case 'ACCEPT_SUGGESTION': {
      // TODO: Implement suggestion acceptance logic
      return state;
    }
    
    case 'REJECT_SUGGESTION': {
      // TODO: Implement suggestion rejection logic
      return state;
    }
    
    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      
      return {
        ...state,
        document: previous,
        history: {
          past: newPast,
          future: [state.document, ...state.history.future]
        }
      };
    }
    
    case 'REDO': {
      if (state.history.future.length === 0) return state;
      
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      return {
        ...state,
        document: next,
        history: {
          past: [...state.history.past, state.document],
          future: newFuture
        }
      };
    }
    
    default:
      return state;
  }
}

/**
 * WYSIWYG Editor Component
 * 
 * A block-based editor that outputs JSON conforming to UIStateTree structure.
 * Supports Creative Flow mode (default) and Suggestion mode (on-demand).
 */
export function WYSIWYGEditor({
  initialDocument,
  onChange,
  onStateChange,
  collaborationEnabled = false,
  userId = 'current-user',
  suggestionModeEnabled = true,
  className,
  readOnly = false
}: WYSIWYGEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, createInitialState(initialDocument));
  const [showConflicts, setShowConflicts] = useState(false);
  
  // Initialize collaboration if enabled
  const collaboration = useCollaboration({
    documentId: state.document.metadata.id,
    userId,
    userName: `User ${userId}`, // In production, get from user context
    enabled: collaborationEnabled,
    autoConnect: true
  });
  
  // Initialize suggestions if enabled
  const suggestions = useSuggestions({
    enabled: suggestionModeEnabled,
    autoSuggest: false, // Only generate suggestions on demand
    debounceMs: 500,
    maxSuggestions: 5,
    minConfidence: 0.7,
    enabledTypes: ['grammar', 'style', 'clarity', 'tone']
  });
  
  // Notify parent of document changes
  useEffect(() => {
    onChange?.(state.document);
  }, [state.document, onChange]);
  
  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);
  
  // Collaboration event handlers
  useEffect(() => {
    if (!collaborationEnabled) return;
    
    const handleBlockLocked = (event: any) => {
      dispatch({ 
        type: 'LOCK_BLOCK', 
        payload: { blockId: event.data.blockId, userId: event.data.userId } 
      });
    };
    
    const handleBlockUnlocked = (event: any) => {
      dispatch({ 
        type: 'UNLOCK_BLOCK', 
        payload: { blockId: event.data.blockId } 
      });
    };
    
    const handleBlockUpdated = (event: any) => {
      // Handle remote block updates
      if (event.userId !== userId) {
        dispatch({ 
          type: 'UPDATE_BLOCK', 
          payload: { blockId: event.data.blockId, updates: event.data.block } 
        });
      }
    };
    
    collaboration.onCollaborationEvent('block_locked', handleBlockLocked);
    collaboration.onCollaborationEvent('block_unlocked', handleBlockUnlocked);
    collaboration.onCollaborationEvent('block_updated', handleBlockUpdated);
    
    return () => {
      collaboration.offCollaborationEvent('block_locked', handleBlockLocked);
      collaboration.offCollaborationEvent('block_unlocked', handleBlockUnlocked);
      collaboration.offCollaborationEvent('block_updated', handleBlockUpdated);
    };
  }, [collaborationEnabled, collaboration, userId]);
  
  // Sync collaboration locks with editor state
  useEffect(() => {
    if (!collaborationEnabled) return;
    
    // Update editor state with collaboration locks
    const newLockedBlocks = collaboration.lockedBlocks;
    const currentLocks = state.collaboration.lockedBlocks;
    
    // Check if locks have changed
    const locksChanged = JSON.stringify(newLockedBlocks) !== JSON.stringify(currentLocks);
    
    if (locksChanged) {
      // Update state with new locks
      Object.entries(newLockedBlocks).forEach(([blockId, userId]) => {
        if (!currentLocks[blockId]) {
          dispatch({ type: 'LOCK_BLOCK', payload: { blockId, userId } });
        }
      });
      
      // Remove locks that are no longer active
      Object.keys(currentLocks).forEach(blockId => {
        if (!newLockedBlocks[blockId]) {
          dispatch({ type: 'UNLOCK_BLOCK', payload: { blockId } });
        }
      });
    }
  }, [collaborationEnabled, collaboration.lockedBlocks, state.collaboration.lockedBlocks]);

  // Block manipulation handlers
  const handleAddBlock = useCallback((blockType: string, position?: number) => {
    const now = new Date();
    let newBlock: ContentBlock;
    
    switch (blockType) {
      case 'text':
        newBlock = {
          id: uuidv4(),
          type: 'text',
          created_at: now,
          updated_at: now,
          content: { text: '', formatting: {} }
        } as TextBlock;
        break;
      case 'heading':
        newBlock = {
          id: uuidv4(),
          type: 'heading',
          created_at: now,
          updated_at: now,
          content: { text: '', level: 1 }
        };
        break;
      default:
        return;
    }
    
    dispatch({ type: 'ADD_BLOCK', payload: { block: newBlock, position } });
  }, []);
  
  const handleUpdateBlock = useCallback(async (blockId: string, updates: Partial<ContentBlock>) => {
    // Check if block is locked by another user
    if (collaborationEnabled && collaboration.isBlockLocked(blockId)) {
      return; // Don't allow updates to locked blocks
    }
    
    // Request lock if collaboration is enabled
    if (collaborationEnabled && !collaboration.lockedBlocks[blockId]) {
      const lockAcquired = await collaboration.requestBlockLock(blockId);
      if (!lockAcquired) {
        return; // Couldn't acquire lock
      }
    }
    
    // Find the current block
    const currentBlock = state.document.blocks.find(b => b.id === blockId);
    if (!currentBlock) return;
    
    // Apply updates
    dispatch({ type: 'UPDATE_BLOCK', payload: { blockId, updates } });
    
    // Send update to collaborators
    if (collaborationEnabled) {
      const updatedBlock = { ...currentBlock, ...updates };
      await collaboration.sendBlockUpdate(blockId, updatedBlock);
    }
  }, [collaborationEnabled, collaboration, state.document.blocks]);
  
  const handleDeleteBlock = useCallback((blockId: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { blockId } });
  }, []);
  
  const handleSelectBlock = useCallback(async (blockId?: string) => {
    // Release previous lock if collaboration is enabled
    if (collaborationEnabled && state.selectedBlockId && state.selectedBlockId !== blockId) {
      await collaboration.releaseBlockLock(state.selectedBlockId);
    }
    
    dispatch({ type: 'SELECT_BLOCK', payload: { blockId } });
    
    // Request lock for new block if collaboration is enabled
    if (collaborationEnabled && blockId && !collaboration.isBlockLocked(blockId)) {
      await collaboration.requestBlockLock(blockId);
    }
  }, [collaborationEnabled, collaboration, state.selectedBlockId]);
  
  const handleModeToggle = useCallback(() => {
    const newMode = state.mode === 'creative-flow' ? 'suggestion' : 'creative-flow';
    dispatch({ type: 'SET_MODE', payload: { mode: newMode } });
  }, [state.mode]);
  
  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);
  
  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);
  
  // Conflict resolution handler
  const handleResolveConflict = useCallback(async (diffId: string, resolution: 'accept' | 'reject' | 'merge') => {
    await collaboration.resolveConflict(diffId, resolution);
  }, [collaboration]);
  
  // Toggle conflicts view
  const handleToggleConflicts = useCallback(() => {
    setShowConflicts(!showConflicts);
  }, [showConflicts]);
  
  // Suggestion handlers
  const handleGenerateSuggestions = useCallback(async (blockId: string, block: ContentBlock) => {
    if (state.mode === 'suggestion' && suggestionModeEnabled) {
      const context = {
        documentTitle: state.document.metadata.title,
        writingStyle: 'casual' as const, // Could be configurable
        previousBlocks: state.document.blocks.slice(0, state.document.blocks.findIndex(b => b.id === blockId)),
        nextBlocks: state.document.blocks.slice(state.document.blocks.findIndex(b => b.id === blockId) + 1)
      };
      
      await suggestions.generateSuggestions(blockId, block, context);
    }
  }, [state.mode, state.document, suggestionModeEnabled, suggestions]);
  
  const handleAcceptSuggestion = useCallback(async (blockId: string, suggestionId: string) => {
    const block = state.document.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const updatedBlock = suggestions.applySuggestion(blockId, suggestionId, block);
    if (updatedBlock) {
      dispatch({ type: 'UPDATE_BLOCK', payload: { blockId, updates: updatedBlock } });
    }
  }, [state.document.blocks, suggestions]);
  
  const handleDismissSuggestion = useCallback((blockId: string, suggestionId: string) => {
    suggestions.dismissSuggestion(blockId, suggestionId);
  }, [suggestions]);
  
  // Generate suggestions when switching to suggestion mode
  useEffect(() => {
    if (state.mode === 'suggestion' && state.selectedBlockId) {
      const selectedBlock = state.document.blocks.find(b => b.id === state.selectedBlockId);
      if (selectedBlock && selectedBlock.type === 'text') {
        handleGenerateSuggestions(state.selectedBlockId, selectedBlock);
      }
    }
  }, [state.mode, state.selectedBlockId, state.document.blocks, handleGenerateSuggestions]);
  
  return (
    <div className={cn('wysiwyg-editor', className)}>
      {/* Collaboration Status */}
      {collaborationEnabled && (
        <CollaborationStatus
          isConnected={collaboration.isConnected}
          connectionStatus={collaboration.connectionStatus}
          activeUsers={collaboration.activeUsers}
          lockedBlocks={collaboration.lockedBlocks}
          className="mb-4"
        />
      )}
      
      {/* Conflict Resolution */}
      {collaborationEnabled && collaboration.pendingDiffs.length > 0 && (
        <div className="mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Conflicts Detected ({collaboration.pendingDiffs.length})
            </h3>
            <button
              onClick={handleToggleConflicts}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showConflicts ? 'Hide' : 'Show'} Conflicts
            </button>
          </div>
          
          {showConflicts && (
            <div className="space-y-4">
              {collaboration.pendingDiffs.map(diff => (
                <SemanticDiff
                  key={diff.id}
                  diff={diff}
                  onResolve={handleResolveConflict}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {!readOnly && (
        <EditorToolbar
          mode={state.mode}
          canUndo={state.history.past.length > 0}
          canRedo={state.history.future.length > 0}
          suggestionModeEnabled={suggestionModeEnabled}
          onModeToggle={handleModeToggle}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAddBlock={handleAddBlock}
        />
      )}
      
      <div className="editor-content min-h-96 p-4 border border-gray-200 rounded-lg bg-white">
        {state.document.blocks.map((block, index) => (
          <BlockRenderer
            key={block.id}
            block={block}
            isSelected={state.selectedBlockId === block.id}
            isLocked={collaborationEnabled && block.id in state.collaboration.lockedBlocks}
            lockedBy={state.collaboration.lockedBlocks[block.id]}
            readOnly={readOnly}
            mode={state.mode}
            suggestions={suggestions.suggestions[block.id] || []}
            isLoadingSuggestions={suggestions.isLoading[block.id] || false}
            onChange={(updates) => handleUpdateBlock(block.id, updates)}
            onSelect={() => handleSelectBlock(block.id)}
            onDelete={() => handleDeleteBlock(block.id)}
            onAddBlock={(blockType) => handleAddBlock(blockType, index + 1)}
            onAcceptSuggestion={(suggestionId) => handleAcceptSuggestion(block.id, suggestionId)}
            onDismissSuggestion={(suggestionId) => handleDismissSuggestion(block.id, suggestionId)}
          />
        ))}
        
        {state.document.blocks.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            Start writing your thoughts...
          </div>
        )}
      </div>
    </div>
  );
}