/**
 * Real-time Collaboration Service
 * Handles real-time collaborative editing features
 */

import { ContentBlock } from '@/types/editor';
import { 
  CollaborationState, 
  CollaborationUser, 
  BlockLock, 
  SemanticDiff, 
  CollaborationEvent 
} from '@/types/collaboration';

export class RealTimeCollaborationService {
  private documentId: string;
  private userId: string;
  private userName: string;
  private state: CollaborationState;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(documentId: string, userId: string, userName: string) {
    this.documentId = documentId;
    this.userId = userId;
    this.userName = userName;
    
    this.state = {
      documentId,
      users: new Map(),
      locks: new Map(),
      pendingDiffs: new Map(),
      isConnected: false,
      connectionStatus: 'disconnected',
      lastSync: new Date()
    };
  }

  /**
   * Connect to collaboration session
   */
  async connect(): Promise<void> {
    // Simulate connection
    this.state.isConnected = true;
    this.state.connectionStatus = 'connected';
    
    // Add current user
    const currentUser: CollaborationUser = {
      id: this.userId,
      name: this.userName,
      isOnline: true,
      status: 'online',
      color: '#3B82F6',
      permission: 'editor'
    };
    
    this.state.users.set(this.userId, currentUser);
    this.emitEvent('user_joined', { user: currentUser });
  }

  /**
   * Disconnect from collaboration session
   */
  disconnect(): void {
    this.state.isConnected = false;
    this.state.connectionStatus = 'disconnected';
    this.state.users.clear();
    this.state.locks.clear();
  }

  /**
   * Get current collaboration state
   */
  getState(): CollaborationState {
    return { ...this.state };
  }

  /**
   * Request lock on a block
   */
  async requestBlockLock(blockId: string): Promise<boolean> {
    // Check if block is already locked
    if (this.state.locks.has(blockId)) {
      return false;
    }

    // Create lock
    const lock: BlockLock = {
      block_id: blockId,
      user_id: this.userId,
      type: 'editing',
      acquired_at: new Date(),
      expires_at: new Date(Date.now() + 30000) // 30 seconds
    };

    this.state.locks.set(blockId, lock);
    this.emitEvent('block_locked', { blockId, userId: this.userId });
    
    return true;
  }

  /**
   * Release lock on a block
   */
  async releaseBlockLock(blockId: string): Promise<void> {
    if (this.state.locks.has(blockId)) {
      this.state.locks.delete(blockId);
      this.emitEvent('block_unlocked', { blockId, userId: this.userId });
    }
  }

  /**
   * Check if a block is locked
   */
  isBlockLocked(blockId: string): boolean {
    return this.state.locks.has(blockId);
  }

  /**
   * Get who has locked a block
   */
  getBlockLocker(blockId: string): string | undefined {
    const lock = this.state.locks.get(blockId);
    return lock?.user_id;
  }

  /**
   * Send block update to other collaborators
   */
  async sendBlockUpdate(blockId: string, block: ContentBlock): Promise<void> {
    // In a real implementation, this would send the update to other users
    // For now, just emit an event
    this.emitEvent('content_changed', { blockId, block, userId: this.userId });
  }

  /**
   * Resolve a semantic diff conflict
   */
  async resolveConflict(diffId: string, resolution: 'accept' | 'reject' | 'merge'): Promise<void> {
    if (this.state.pendingDiffs.has(diffId)) {
      const diff = this.state.pendingDiffs.get(diffId)!;
      diff.status = 'resolved';
      
      if (resolution === 'reject') {
        // Keep original
      } else if (resolution === 'accept') {
        // Accept changes
      } else {
        // Merge changes
      }
      
      this.state.pendingDiffs.delete(diffId);
      this.emitEvent('conflict_resolved', { diffId, resolution });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Add event listener (alias for addEventListener)
   */
  on(eventType: string, handler: Function): void {
    this.addEventListener(eventType, handler);
  }

  /**
   * Remove event listener (alias for removeEventListener)
   */
  off(eventType: string, handler: Function): void {
    this.removeEventListener(eventType, handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const event: CollaborationEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType as any,
      userId: this.userId,
      data,
      timestamp: new Date()
    };

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in collaboration event handler:', error);
        }
      });
    }
  }
}