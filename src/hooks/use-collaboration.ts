/**
 * Collaboration Hook
 * 
 * React hook for managing real-time collaboration features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealTimeCollaborationService } from '@/services/real-time-collaboration-service';
import { 
  CollaborationState, 
  CollaborationUser, 
  BlockLock, 
  SemanticDiff,
  CollaborationEvent 
} from '@/types/collaboration';
import { ContentBlock } from '@/types/editor';

export interface UseCollaborationOptions {
  documentId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
  autoConnect?: boolean;
}

export interface UseCollaborationReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Users and presence
  activeUsers: CollaborationUser[];
  
  // Block locking
  lockedBlocks: Record<string, string>; // blockId -> userId
  requestBlockLock: (blockId: string) => Promise<boolean>;
  releaseBlockLock: (blockId: string) => Promise<void>;
  isBlockLocked: (blockId: string) => boolean;
  getBlockLocker: (blockId: string) => string | undefined;
  
  // Conflict resolution
  pendingDiffs: SemanticDiff[];
  resolveConflict: (diffId: string, resolution: 'accept' | 'reject' | 'merge') => Promise<void>;
  
  // Communication
  sendBlockUpdate: (blockId: string, block: ContentBlock) => Promise<void>;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Event handling
  onCollaborationEvent: (eventType: string, handler: (event: CollaborationEvent) => void) => void;
  offCollaborationEvent: (eventType: string, handler: (event: CollaborationEvent) => void) => void;
}

export function useCollaboration({
  documentId,
  userId,
  userName,
  enabled = true,
  autoConnect = true
}: UseCollaborationOptions): UseCollaborationReturn {
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    documentId,
    users: new Map(),
    locks: new Map(),
    pendingDiffs: new Map(),
    isConnected: false,
    connectionStatus: 'disconnected',
    lastSync: new Date()
  });
  
  const serviceRef = useRef<RealTimeCollaborationService | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  
  // Initialize collaboration service
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    serviceRef.current = new RealTimeCollaborationService(documentId, userId, userName);
    
    // Set up event handlers to update state
    const handleStateUpdate = () => {
      if (serviceRef.current) {
        setCollaborationState(serviceRef.current.getState());
      }
    };
    
    // Listen to all collaboration events to update state
    serviceRef.current.on('*', handleStateUpdate);
    
    // Auto-connect if enabled
    if (autoConnect) {
      serviceRef.current.connect().catch(console.error);
    }
    
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
        serviceRef.current = null;
      }
    };
  }, [documentId, userId, userName, enabled, autoConnect]);
  
  // Update state when collaboration service state changes
  useEffect(() => {
    const updateState = () => {
      if (serviceRef.current) {
        setCollaborationState(serviceRef.current.getState());
      }
    };
    
    const interval = setInterval(updateState, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);
  
  // Connection management
  const connect = useCallback(async () => {
    if (serviceRef.current && !collaborationState.isConnected) {
      await serviceRef.current.connect();
    }
  }, [collaborationState.isConnected]);
  
  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);
  
  // Block locking
  const requestBlockLock = useCallback(async (blockId: string): Promise<boolean> => {
    if (!serviceRef.current) {
      return false;
    }
    
    return await serviceRef.current.requestBlockLock(blockId);
  }, []);
  
  const releaseBlockLock = useCallback(async (blockId: string): Promise<void> => {
    if (serviceRef.current) {
      await serviceRef.current.releaseBlockLock(blockId);
    }
  }, []);
  
  const isBlockLocked = useCallback((blockId: string): boolean => {
    if (!serviceRef.current) {
      return false;
    }
    
    return serviceRef.current.isBlockLocked(blockId);
  }, []);
  
  const getBlockLocker = useCallback((blockId: string): string | undefined => {
    if (!serviceRef.current) {
      return undefined;
    }
    
    return serviceRef.current.getBlockLocker(blockId);
  }, []);
  
  // Communication
  const sendBlockUpdate = useCallback(async (blockId: string, block: ContentBlock): Promise<void> => {
    if (serviceRef.current) {
      await serviceRef.current.sendBlockUpdate(blockId, block);
    }
  }, []);
  
  // Conflict resolution
  const resolveConflict = useCallback(async (diffId: string, resolution: 'accept' | 'reject' | 'merge'): Promise<void> => {
    if (serviceRef.current) {
      await serviceRef.current.resolveConflict(diffId, resolution);
    }
  }, []);
  
  // Event handling
  const onCollaborationEvent = useCallback((eventType: string, handler: (event: CollaborationEvent) => void) => {
    if (!serviceRef.current) {
      return;
    }
    
    serviceRef.current.on(eventType, handler);
    
    // Keep track of handlers for cleanup
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler);
  }, []);
  
  const offCollaborationEvent = useCallback((eventType: string, handler: (event: CollaborationEvent) => void) => {
    if (!serviceRef.current) {
      return;
    }
    
    serviceRef.current.off(eventType, handler);
    
    // Remove from tracked handlers
    const handlers = eventHandlersRef.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);
  
  // Cleanup event handlers on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        // Remove all tracked event handlers
        Array.from(eventHandlersRef.current.entries()).forEach(([eventType, handlers]) => {
          Array.from(handlers).forEach(handler => {
            serviceRef.current!.off(eventType, handler as any);
          });
        });
      }
      eventHandlersRef.current.clear();
    };
  }, []);
  
  // Convert Map-based state to plain objects for easier consumption
  const activeUsers = Array.from(collaborationState.users.values()).filter(user => user.isOnline);
  const lockedBlocks = Object.fromEntries(
    Array.from(collaborationState.locks.entries()).map(([blockId, lock]) => [blockId, lock.user_id])
  );
  const pendingDiffs = Array.from(collaborationState.pendingDiffs.values());
  
  return {
    // Connection state
    isConnected: collaborationState.isConnected,
    connectionStatus: collaborationState.connectionStatus,
    
    // Users and presence
    activeUsers,
    
    // Block locking
    lockedBlocks,
    requestBlockLock,
    releaseBlockLock,
    isBlockLocked,
    getBlockLocker,
    
    // Conflict resolution
    pendingDiffs,
    resolveConflict,
    
    // Communication
    sendBlockUpdate,
    
    // Connection management
    connect,
    disconnect,
    
    // Event handling
    onCollaborationEvent,
    offCollaborationEvent
  };
}