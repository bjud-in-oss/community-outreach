/**
 * Collaboration Features Integration Tests
 * 
 * Tests real-time collaboration functionality including:
 * - Block-level locking
 * - Visual lock indicators
 * - Conflict resolution with semantic diff
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WYSIWYGEditor } from '@/components/editor/wysiwyg-editor';
import { UIStateTree, TextBlock } from '@/types/editor';

// Mock UUID generation for consistent testing
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}));

// Mock collaboration service
const mockCollaborationService = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  requestBlockLock: vi.fn().mockResolvedValue(true),
  releaseBlockLock: vi.fn().mockResolvedValue(undefined),
  sendBlockUpdate: vi.fn().mockResolvedValue(undefined),
  isBlockLocked: vi.fn().mockReturnValue(false),
  getBlockLocker: vi.fn().mockReturnValue(undefined),
  resolveConflict: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  getState: vi.fn().mockReturnValue({
    documentId: 'test-doc',
    users: new Map(),
    locks: new Map(),
    pendingDiffs: new Map(),
    isConnected: true,
    connectionStatus: 'connected'
  }),
  getActiveUsers: vi.fn().mockReturnValue([]),
  getLockedBlocks: vi.fn().mockReturnValue([])
};

vi.mock('@/services/collaboration-service', () => ({
  CollaborationService: vi.fn().mockImplementation(() => mockCollaborationService)
}));

describe('Collaboration Features', () => {
  const mockOnChange = vi.fn();
  const mockOnStateChange = vi.fn();
  
  const initialDocument: UIStateTree = {
    metadata: {
      title: 'Test Document',
      id: 'test-doc-id',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      author: 'test-user',
      version: 1,
      tags: []
    },
    blocks: [
      {
        id: 'block-1',
        type: 'text',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        content: {
          text: 'Test content',
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
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllTimers();
  });
  
  describe('Connection Status', () => {
    it('should show collaboration status when enabled', async () => {
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
    
    it('should not show collaboration status when disabled', () => {
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={false}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });
  });
  
  describe('Block Locking', () => {
    it('should request lock when selecting a block', async () => {
      const user = userEvent.setup();
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      const blockElement = screen.getByText('Test content');
      await user.click(blockElement);
      
      await waitFor(() => {
        expect(mockCollaborationService.requestBlockLock).toHaveBeenCalledWith('block-1');
      });
    });
    
    it('should release lock when selecting a different block', async () => {
      const user = userEvent.setup();
      
      const documentWithTwoBlocks: UIStateTree = {
        ...initialDocument,
        blocks: [
          ...initialDocument.blocks,
          {
            id: 'block-2',
            type: 'text',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
            content: {
              text: 'Second block',
              formatting: {}
            }
          } as TextBlock
        ]
      };
      
      render(
        <WYSIWYGEditor
          initialDocument={documentWithTwoBlocks}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select first block
      const firstBlock = screen.getByText('Test content');
      await user.click(firstBlock);
      
      await waitFor(() => {
        expect(mockCollaborationService.requestBlockLock).toHaveBeenCalledWith('block-1');
      });
      
      // Select second block
      const secondBlock = screen.getByText('Second block');
      await user.click(secondBlock);
      
      await waitFor(() => {
        expect(mockCollaborationService.releaseBlockLock).toHaveBeenCalledWith('block-1');
        expect(mockCollaborationService.requestBlockLock).toHaveBeenCalledWith('block-2');
      });
    });
    
    it('should show visual lock indicator for locked blocks', async () => {
      // Mock a locked block
      mockCollaborationService.isBlockLocked.mockReturnValue(true);
      mockCollaborationService.getBlockLocker.mockReturnValue('other-user');
      
      const { rerender } = render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Simulate receiving a lock event
      act(() => {
        const lockHandler = mockCollaborationService.on.mock.calls.find(
          call => call[0] === 'block_locked'
        )?.[1];
        
        if (lockHandler) {
          lockHandler({
            type: 'block_locked',
            userId: 'other-user',
            timestamp: new Date(),
            data: { blockId: 'block-1', userId: 'other-user' }
          });
        }
      });
      
      rerender(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Locked by other-user')).toBeInTheDocument();
      });
    });
    
    it('should prevent editing locked blocks', async () => {
      const user = userEvent.setup();
      
      // Mock a locked block
      mockCollaborationService.isBlockLocked.mockReturnValue(true);
      mockCollaborationService.requestBlockLock.mockResolvedValue(false);
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      const blockElement = screen.getByText('Test content');
      await user.click(blockElement);
      
      // Try to edit the block (this should be prevented)
      await user.type(blockElement, ' additional text');
      
      // The block update should not be called since it's locked
      expect(mockCollaborationService.sendBlockUpdate).not.toHaveBeenCalled();
    });
  });
  
  describe('Real-time Updates', () => {
    it('should handle remote block updates', async () => {
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Simulate receiving a block update from another user
      act(() => {
        const updateHandler = mockCollaborationService.on.mock.calls.find(
          call => call[0] === 'block_updated'
        )?.[1];
        
        if (updateHandler) {
          updateHandler({
            type: 'block_updated',
            userId: 'other-user',
            timestamp: new Date(),
            data: {
              blockId: 'block-1',
              block: {
                id: 'block-1',
                type: 'text',
                created_at: new Date('2023-01-01'),
                updated_at: new Date(),
                content: {
                  text: 'Updated by other user',
                  formatting: {}
                }
              }
            }
          });
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('Updated by other user')).toBeInTheDocument();
      });
    });
    
    it('should send updates to other collaborators', async () => {
      const user = userEvent.setup();
      
      mockCollaborationService.isBlockLocked.mockReturnValue(false);
      mockCollaborationService.requestBlockLock.mockResolvedValue(true);
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Select and edit a block
      const blockElement = screen.getByText('Test content');
      await user.click(blockElement);
      
      // Wait for lock to be acquired
      await waitFor(() => {
        expect(mockCollaborationService.requestBlockLock).toHaveBeenCalledWith('block-1');
      });
      
      // Simulate editing the block
      await user.clear(blockElement);
      await user.type(blockElement, 'Modified content');
      
      await waitFor(() => {
        expect(mockCollaborationService.sendBlockUpdate).toHaveBeenCalledWith(
          'block-1',
          expect.objectContaining({
            content: expect.objectContaining({
              text: 'Modified content'
            })
          })
        );
      });
    });
  });
  
  describe('Conflict Resolution', () => {
    it('should show semantic diff when conflicts are detected', async () => {
      const mockDiff = {
        id: 'diff-1',
        blockId: 'block-1',
        before: {
          id: 'block-1',
          type: 'text',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          content: {
            text: 'Original text',
            formatting: {}
          }
        },
        after: {
          id: 'block-1',
          type: 'text',
          created_at: new Date('2023-01-01'),
          updated_at: new Date(),
          content: {
            text: 'Modified text',
            formatting: {}
          }
        },
        changes: [
          {
            type: 'modification' as const,
            path: 'content.text',
            oldValue: 'Original text',
            newValue: 'Modified text',
            description: 'Text content was changed'
          }
        ]
      };
      
      // Mock pending diffs
      const mockUseCollaboration = {
        isConnected: true,
        connectionStatus: 'connected' as const,
        activeUsers: [],
        lockedBlocks: {},
        pendingDiffs: [mockDiff],
        requestBlockLock: vi.fn().mockResolvedValue(true),
        releaseBlockLock: vi.fn().mockResolvedValue(undefined),
        isBlockLocked: vi.fn().mockReturnValue(false),
        getBlockLocker: vi.fn().mockReturnValue(undefined),
        sendBlockUpdate: vi.fn().mockResolvedValue(undefined),
        resolveConflict: vi.fn().mockResolvedValue(undefined),
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        onCollaborationEvent: vi.fn(),
        offCollaborationEvent: vi.fn()
      };
      
      vi.doMock('@/hooks/use-collaboration', () => ({
        useCollaboration: vi.fn().mockReturnValue(mockUseCollaboration)
      }));
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Conflicts Detected (1)')).toBeInTheDocument();
      });
      
      // Show conflicts
      const showButton = screen.getByText('Show Conflicts');
      await userEvent.setup().click(showButton);
      
      await waitFor(() => {
        expect(screen.getByText('Conflict Detected')).toBeInTheDocument();
        expect(screen.getByText('Original text')).toBeInTheDocument();
        expect(screen.getByText('Modified text')).toBeInTheDocument();
      });
    });
    
    it('should handle conflict resolution actions', async () => {
      const user = userEvent.setup();
      
      const mockDiff = {
        id: 'diff-1',
        blockId: 'block-1',
        before: {
          id: 'block-1',
          type: 'text',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          content: {
            text: 'Original text',
            formatting: {}
          }
        },
        after: {
          id: 'block-1',
          type: 'text',
          created_at: new Date('2023-01-01'),
          updated_at: new Date(),
          content: {
            text: 'Modified text',
            formatting: {}
          }
        },
        changes: [
          {
            type: 'modification' as const,
            path: 'content.text',
            oldValue: 'Original text',
            newValue: 'Modified text',
            description: 'Text content was changed'
          }
        ]
      };
      
      const mockResolveConflict = vi.fn().mockResolvedValue(undefined);
      
      const mockUseCollaboration = {
        isConnected: true,
        connectionStatus: 'connected' as const,
        activeUsers: [],
        lockedBlocks: {},
        pendingDiffs: [mockDiff],
        requestBlockLock: vi.fn().mockResolvedValue(true),
        releaseBlockLock: vi.fn().mockResolvedValue(undefined),
        isBlockLocked: vi.fn().mockReturnValue(false),
        getBlockLocker: vi.fn().mockReturnValue(undefined),
        sendBlockUpdate: vi.fn().mockResolvedValue(undefined),
        resolveConflict: mockResolveConflict,
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        onCollaborationEvent: vi.fn(),
        offCollaborationEvent: vi.fn()
      };
      
      vi.doMock('@/hooks/use-collaboration', () => ({
        useCollaboration: vi.fn().mockReturnValue(mockUseCollaboration)
      }));
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      // Show conflicts
      const showButton = screen.getByText('Show Conflicts');
      await user.click(showButton);
      
      // Accept their version
      const acceptButton = screen.getByText('Accept Their Version');
      await user.click(acceptButton);
      
      expect(mockResolveConflict).toHaveBeenCalledWith('diff-1', 'accept');
    });
  });
  
  describe('User Presence', () => {
    it('should display active users when connected', async () => {
      const mockActiveUsers = [
        {
          id: 'user-2',
          name: 'John Doe',
          color: '#FF6B6B',
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'user-3',
          name: 'Jane Smith',
          color: '#4ECDC4',
          isOnline: true,
          lastSeen: new Date()
        }
      ];
      
      const mockUseCollaboration = {
        isConnected: true,
        connectionStatus: 'connected' as const,
        activeUsers: mockActiveUsers,
        lockedBlocks: {},
        pendingDiffs: [],
        requestBlockLock: vi.fn().mockResolvedValue(true),
        releaseBlockLock: vi.fn().mockResolvedValue(undefined),
        isBlockLocked: vi.fn().mockReturnValue(false),
        getBlockLocker: vi.fn().mockReturnValue(undefined),
        sendBlockUpdate: vi.fn().mockResolvedValue(undefined),
        resolveConflict: vi.fn().mockResolvedValue(undefined),
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        onCollaborationEvent: vi.fn(),
        offCollaborationEvent: vi.fn()
      };
      
      vi.doMock('@/hooks/use-collaboration', () => ({
        useCollaboration: vi.fn().mockReturnValue(mockUseCollaboration)
      }));
      
      render(
        <WYSIWYGEditor
          initialDocument={initialDocument}
          collaborationEnabled={true}
          userId="user-1"
          onChange={mockOnChange}
          onStateChange={mockOnStateChange}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // User count
      });
    });
  });
});