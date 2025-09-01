/**
 * Collaboration Service
 * 
 * Handles real-time collaboration features including:
 * - WebSocket connections for real-time updates
 * - Block-level locking management
 * - Conflict resolution with semantic diff
 * - User presence tracking
 */

import { UIStateTree, ContentBlock, EditorState } from '@/types/editor';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface BlockLock {
  blockId: string;
  userId: string;
  userName: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface CollaborationEvent {
  type: 'block_locked' | 'block_unlocked' | 'block_updated' | 'user_joined' | 'user_left' | 'document_updated';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface SemanticDiff {
  id: string;
  blockId: string;
  before: ContentBlock;
  after: ContentBlock;
  changes: {
    type: 'addition' | 'deletion' | 'modification';
    path: string;
    oldValue?: any;
    newValue?: any;
    description: string;
  }[];
  conflictResolution?: 'accept' | 'reject' | 'merge';
}

export interface CollaborationState {
  documentId: string;
  users: Map<string, CollaborationUser>;
  locks: Map<string, BlockLock>;
  pendingDiffs: Map<string, SemanticDiff>;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSyncAt?: Date;
}

export type CollaborationEventHandler = (event: CollaborationEvent) => void;

/**
 * Mock WebSocket implementation for development
 * In production, this would connect to a real WebSocket server
 */
class MockWebSocket {
  private handlers: Map<string, Function[]> = new Map();
  private isOpen = false;
  
  constructor(private url: string) {
    // Simulate connection delay
    setTimeout(() => {
      this.isOpen = true;
      this.emit('open', {});
    }, 100);
  }
  
  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
  
  off(event: string, handler: Function) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  send(data: string) {
    if (!this.isOpen) {
      throw new Error('WebSocket is not open');
    }
    
    // Simulate server response for testing
    const message = JSON.parse(data);
    setTimeout(() => {
      this.emit('message', { data: JSON.stringify({ ...message, status: 'success' }) });
    }, 50);
  }
  
  close() {
    this.isOpen = false;
    this.emit('close', {});
  }
  
  private emit(event: string, data: any) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

export class CollaborationService {
  private ws: MockWebSocket | null = null;
  private state: CollaborationState;
  private eventHandlers: Map<string, CollaborationEventHandler[]> = new Map();
  private lockTimeout = 30000; // 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private documentId: string,
    private userId: string,
    private userName: string
  ) {
    this.state = {
      documentId,
      users: new Map(),
      locks: new Map(),
      pendingDiffs: new Map(),
      isConnected: false,
      connectionStatus: 'disconnected'
    };
  }
  
  /**
   * Connect to the collaboration server
   */
  async connect(): Promise<void> {
    if (this.ws) {
      return;
    }
    
    this.state.connectionStatus = 'connecting';
    
    try {
      // In production, this would be a real WebSocket URL
      this.ws = new MockWebSocket(`ws://localhost:3001/collaboration/${this.documentId}`);
      
      this.ws.on('open', this.handleOpen.bind(this));
      this.ws.on('message', this.handleMessage.bind(this));
      this.ws.on('close', this.handleClose.bind(this));
      this.ws.on('error', this.handleError.bind(this));
      
      // Start heartbeat
      this.startHeartbeat();
      
    } catch (error) {
      this.state.connectionStatus = 'error';
      throw error;
    }
  }
  
  /**
   * Disconnect from the collaboration server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.state.isConnected = false;
    this.state.connectionStatus = 'disconnected';
  }
  
  /**
   * Request a lock on a specific block
   */
  async requestBlockLock(blockId: string): Promise<boolean> {
    if (!this.ws || !this.state.isConnected) {
      return false;
    }
    
    // Check if block is already locked
    const existingLock = this.state.locks.get(blockId);
    if (existingLock && existingLock.userId !== this.userId) {
      return false;
    }
    
    const lockRequest = {
      type: 'request_lock',
      blockId,
      userId: this.userId,
      userName: this.userName,
      timestamp: new Date().toISOString()
    };
    
    try {
      this.ws.send(JSON.stringify(lockRequest));
      
      // Create optimistic lock
      const lock: BlockLock = {
        blockId,
        userId: this.userId,
        userName: this.userName,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + this.lockTimeout)
      };
      
      this.state.locks.set(blockId, lock);
      
      // Emit lock event
      this.emitEvent({
        type: 'block_locked',
        userId: this.userId,
        timestamp: new Date(),
        data: { blockId, lock }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to request block lock:', error);
      return false;
    }
  }
  
  /**
   * Release a lock on a specific block
   */
  async releaseBlockLock(blockId: string): Promise<void> {
    if (!this.ws || !this.state.isConnected) {
      return;
    }
    
    const lock = this.state.locks.get(blockId);
    if (!lock || lock.userId !== this.userId) {
      return;
    }
    
    const unlockRequest = {
      type: 'release_lock',
      blockId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    
    try {
      this.ws.send(JSON.stringify(unlockRequest));
      this.state.locks.delete(blockId);
      
      // Emit unlock event
      this.emitEvent({
        type: 'block_unlocked',
        userId: this.userId,
        timestamp: new Date(),
        data: { blockId }
      });
    } catch (error) {
      console.error('Failed to release block lock:', error);
    }
  }
  
  /**
   * Send block update to other collaborators
   */
  async sendBlockUpdate(blockId: string, block: ContentBlock): Promise<void> {
    if (!this.ws || !this.state.isConnected) {
      return;
    }
    
    const updateMessage = {
      type: 'block_update',
      blockId,
      block,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    
    try {
      this.ws.send(JSON.stringify(updateMessage));
    } catch (error) {
      console.error('Failed to send block update:', error);
    }
  }
  
  /**
   * Create a semantic diff for conflict resolution
   */
  createSemanticDiff(blockId: string, before: ContentBlock, after: ContentBlock): SemanticDiff {
    const changes: SemanticDiff['changes'] = [];
    
    // Compare content
    if (JSON.stringify(before.content) !== JSON.stringify(after.content)) {
      changes.push({
        type: 'modification',
        path: 'content',
        oldValue: before.content,
        newValue: after.content,
        description: 'Content was modified'
      });
    }
    
    // Compare metadata
    if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)) {
      changes.push({
        type: 'modification',
        path: 'metadata',
        oldValue: before.metadata,
        newValue: after.metadata,
        description: 'Metadata was updated'
      });
    }
    
    return {
      id: `diff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId,
      before,
      after,
      changes
    };
  }
  
  /**
   * Resolve a semantic diff conflict
   */
  async resolveConflict(diffId: string, resolution: 'accept' | 'reject' | 'merge'): Promise<void> {
    const diff = this.state.pendingDiffs.get(diffId);
    if (!diff) {
      return;
    }
    
    diff.conflictResolution = resolution;
    
    const resolutionMessage = {
      type: 'resolve_conflict',
      diffId,
      resolution,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (this.ws && this.state.isConnected) {
        this.ws.send(JSON.stringify(resolutionMessage));
      }
      
      // Remove from pending diffs
      this.state.pendingDiffs.delete(diffId);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }
  
  /**
   * Get current collaboration state
   */
  getState(): CollaborationState {
    return { ...this.state };
  }
  
  /**
   * Get active users
   */
  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.state.users.values()).filter(user => user.isOnline);
  }
  
  /**
   * Get locked blocks
   */
  getLockedBlocks(): BlockLock[] {
    return Array.from(this.state.locks.values());
  }
  
  /**
   * Check if a block is locked by another user
   */
  isBlockLocked(blockId: string): boolean {
    const lock = this.state.locks.get(blockId);
    return lock !== undefined && lock.userId !== this.userId;
  }
  
  /**
   * Get the user who has locked a block
   */
  getBlockLocker(blockId: string): string | undefined {
    const lock = this.state.locks.get(blockId);
    return lock?.userId;
  }
  
  /**
   * Add event handler
   */
  on(eventType: string, handler: CollaborationEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  /**
   * Remove event handler
   */
  off(eventType: string, handler: CollaborationEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  private handleOpen(): void {
    this.state.isConnected = true;
    this.state.connectionStatus = 'connected';
    this.state.lastSyncAt = new Date();
    
    // Send join message
    const joinMessage = {
      type: 'user_join',
      userId: this.userId,
      userName: this.userName,
      timestamp: new Date().toISOString()
    };
    
    if (this.ws) {
      this.ws.send(JSON.stringify(joinMessage));
    }
  }
  
  private handleMessage(event: { data: string }): void {
    try {
      const message = JSON.parse(event.data);
      this.processCollaborationMessage(message);
    } catch (error) {
      console.error('Failed to parse collaboration message:', error);
    }
  }
  
  private handleClose(): void {
    this.state.isConnected = false;
    this.state.connectionStatus = 'disconnected';
    
    // Clear all locks
    this.state.locks.clear();
    
    // Mark all users as offline
    this.state.users.forEach(user => {
      user.isOnline = false;
      user.lastSeen = new Date();
    });
  }
  
  private handleError(error: any): void {
    console.error('Collaboration WebSocket error:', error);
    this.state.connectionStatus = 'error';
  }
  
  private processCollaborationMessage(message: any): void {
    const event: CollaborationEvent = {
      type: message.type,
      userId: message.userId,
      timestamp: new Date(message.timestamp),
      data: message
    };
    
    switch (message.type) {
      case 'block_locked':
        this.handleBlockLocked(message);
        break;
      case 'block_unlocked':
        this.handleBlockUnlocked(message);
        break;
      case 'block_updated':
        this.handleBlockUpdated(message);
        break;
      case 'user_joined':
        this.handleUserJoined(message);
        break;
      case 'user_left':
        this.handleUserLeft(message);
        break;
      case 'conflict_detected':
        this.handleConflictDetected(message);
        break;
    }
    
    this.emitEvent(event);
  }
  
  private handleBlockLocked(message: any): void {
    if (message.userId === this.userId) {
      return; // Ignore our own lock messages
    }
    
    const lock: BlockLock = {
      blockId: message.blockId,
      userId: message.userId,
      userName: message.userName,
      lockedAt: new Date(message.timestamp),
      expiresAt: new Date(Date.now() + this.lockTimeout)
    };
    
    this.state.locks.set(message.blockId, lock);
  }
  
  private handleBlockUnlocked(message: any): void {
    if (message.userId === this.userId) {
      return; // Ignore our own unlock messages
    }
    
    this.state.locks.delete(message.blockId);
  }
  
  private handleBlockUpdated(message: any): void {
    if (message.userId === this.userId) {
      return; // Ignore our own updates
    }
    
    // This would trigger a re-render in the editor
    // The editor component should listen for these events
  }
  
  private handleUserJoined(message: any): void {
    const user: CollaborationUser = {
      id: message.userId,
      name: message.userName,
      avatar: message.avatar,
      color: this.generateUserColor(message.userId),
      isOnline: true,
      lastSeen: new Date()
    };
    
    this.state.users.set(message.userId, user);
  }
  
  private handleUserLeft(message: any): void {
    const user = this.state.users.get(message.userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
    }
    
    // Remove all locks by this user
    for (const [blockId, lock] of this.state.locks.entries()) {
      if (lock.userId === message.userId) {
        this.state.locks.delete(blockId);
      }
    }
  }
  
  private handleConflictDetected(message: any): void {
    const diff: SemanticDiff = {
      id: message.diffId,
      blockId: message.blockId,
      before: message.before,
      after: message.after,
      changes: message.changes
    };
    
    this.state.pendingDiffs.set(message.diffId, diff);
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.state.isConnected) {
        const heartbeat = {
          type: 'heartbeat',
          userId: this.userId,
          timestamp: new Date().toISOString()
        };
        
        try {
          this.ws.send(JSON.stringify(heartbeat));
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }
  
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  private emitEvent(event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
    
    // Also emit to 'all' handlers
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(event));
    }
  }
}