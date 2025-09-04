/**
 * Collaborative Editor Component
 * Implements soft block-level locking and real-time collaboration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { 
  CollaborativeSession,
  SessionParticipant,
  BlockLock,
  PermissionLevel
} from '../../types/collaboration';
import { CollaborationService } from '../../services/collaboration-service';
import { 
  Users, 
  Lock, 
  Unlock,
  Eye,
  Edit,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  UserX
} from 'lucide-react';

interface CollaborativeEditorProps {
  /** Collaborative session */
  session: CollaborativeSession;
  
  /** Current user ID */
  userId: string;
  
  /** Content blocks */
  contentBlocks: any[];
  
  /** Callback when content is updated */
  onContentUpdate: (blockId: string, content: any) => void;
  
  /** Collaboration service instance */
  collaborationService: CollaborationService;
}

export function CollaborativeEditor({
  session,
  userId,
  contentBlocks,
  onContentUpdate,
  collaborationService
}: CollaborativeEditorProps) {
  const [participants, setParticipants] = useState<SessionParticipant[]>(session.participants);
  const [blockLocks, setBlockLocks] = useState<BlockLock[]>(session.block_locks);
  const [editingBlocks, setEditingBlocks] = useState<Set<string>>(new Set());
  const [showParticipants, setShowParticipants] = useState(false);

  const currentUser = participants.find(p => p.user_id === userId);
  const canEdit = currentUser?.permission_level === 'editor' || currentUser?.permission_level === 'admin';

  // Update session data when props change
  useEffect(() => {
    setParticipants(session.participants);
    setBlockLocks(session.block_locks);
  }, [session]);

  // Clean up expired locks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setBlockLocks(prev => prev.filter(lock => lock.expires_at > now));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBlockEdit = useCallback(async (blockId: string) => {
    if (!canEdit) return;

    try {
      // Check if block is already locked by another user
      const existingLock = blockLocks.find(lock => 
        lock.block_id === blockId && 
        lock.user_id !== userId && 
        lock.expires_at > new Date()
      );

      if (existingLock) {
        alert(`Detta block redigeras redan av ${getParticipantName(existingLock.user_id)}`);
        return;
      }

      // Acquire lock
      const lock = await collaborationService.acquireBlockLock(
        session.id,
        userId,
        blockId,
        'editing'
      );

      setBlockLocks(prev => [...prev.filter(l => !(l.block_id === blockId && l.user_id === userId)), lock]);
      setEditingBlocks(prev => new Set(Array.from(prev).concat([blockId])));

    } catch (error) {
      console.error('Failed to acquire block lock:', error);
    }
  }, [session.id, userId, blockLocks, canEdit, collaborationService]);

  const handleBlockSave = useCallback(async (blockId: string, content: any) => {
    try {
      // Release lock
      await collaborationService.releaseBlockLock(session.id, userId, blockId);
      
      setBlockLocks(prev => prev.filter(lock => 
        !(lock.block_id === blockId && lock.user_id === userId)
      ));
      setEditingBlocks(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(blockId);
        return newSet;
      });

      // Update content
      onContentUpdate(blockId, content);

    } catch (error) {
      console.error('Failed to save block:', error);
    }
  }, [session.id, userId, onContentUpdate, collaborationService]);

  const handleBlockCancel = useCallback(async (blockId: string) => {
    try {
      // Release lock without saving
      await collaborationService.releaseBlockLock(session.id, userId, blockId);
      
      setBlockLocks(prev => prev.filter(lock => 
        !(lock.block_id === blockId && lock.user_id === userId)
      ));
      setEditingBlocks(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(blockId);
        return newSet;
      });

    } catch (error) {
      console.error('Failed to cancel block edit:', error);
    }
  }, [session.id, userId, collaborationService]);

  const getBlockLock = (blockId: string): BlockLock | undefined => {
    return blockLocks.find(lock => 
      lock.block_id === blockId && lock.expires_at > new Date()
    );
  };

  const getParticipantName = (participantId: string): string => {
    const participant = participants.find(p => p.user_id === participantId);
    return participant?.display_name || 'Okänd användare';
  };

  const getParticipantColor = (participantId: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = participants.findIndex(p => p.user_id === participantId);
    return colors[index % colors.length] || 'bg-gray-500';
  };

  const getPermissionIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'viewer': return <Eye className="h-3 w-3" />;
      case 'commenter': return <Users className="h-3 w-3" />;
      case 'editor': return <Edit className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getPermissionLabel = (level: PermissionLevel) => {
    switch (level) {
      case 'viewer': return 'Tittare';
      case 'commenter': return 'Kommentator';
      case 'editor': return 'Redigerare';
      case 'admin': return 'Admin';
      default: return 'Okänd';
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Collaboration Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Samarbetsläge
              <Badge variant="outline" className="ml-2">
                {participants.length} deltagare
              </Badge>
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              {showParticipants ? 'Dölj' : 'Visa'} deltagare
            </Button>
          </div>
        </CardHeader>
        
        {showParticipants && (
          <CardContent>
            <div className="space-y-3">
              <h4 className="font-medium">Aktiva deltagare</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {participants.map((participant) => (
                  <div key={participant.user_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className={`h-8 w-8 ${getParticipantColor(participant.user_id)}`}>
                      <span className="text-white text-sm font-medium">
                        {participant.display_name.charAt(0).toUpperCase()}
                      </span>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{participant.display_name}</span>
                        {participant.user_id === userId && (
                          <Badge variant="secondary" className="text-xs">Du</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getPermissionIcon(participant.permission_level)}
                        <span>{getPermissionLabel(participant.permission_level)}</span>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <div className={`w-2 h-2 rounded-full ${
                            participant.status === 'active' ? 'bg-green-500' :
                            participant.status === 'idle' ? 'bg-yellow-500' :
                            participant.status === 'away' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`} />
                          <span className="capitalize">{participant.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content Blocks with Collaboration Features */}
      <div className="space-y-4">
        {contentBlocks.map((block) => {
          const lock = getBlockLock(block.id);
          const isLockedByOther = lock && lock.user_id !== userId;
          const isLockedByMe = lock && lock.user_id === userId;
          const isEditing = editingBlocks.has(block.id);

          return (
            <Card key={block.id} className={`relative ${
              isLockedByOther ? 'border-red-200 bg-red-50' :
              isLockedByMe ? 'border-blue-200 bg-blue-50' :
              'border-gray-200'
            }`}>
              {/* Lock Indicator */}
              {lock && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${
                    isLockedByOther ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    <Lock className="h-3 w-3" />
                    <span>
                      {isLockedByOther ? 
                        `Låst av ${getParticipantName(lock.user_id)}` :
                        'Du redigerar'
                      }
                    </span>
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeRemaining(lock.expires_at)}</span>
                  </div>
                </div>
              )}

              <CardContent className="pt-6">
                {/* Block Content */}
                <div className="space-y-3">
                  {isEditing ? (
                    <EditableBlockContent
                      block={block}
                      onSave={(content) => handleBlockSave(block.id, content)}
                      onCancel={() => handleBlockCancel(block.id)}
                    />
                  ) : (
                    <ReadOnlyBlockContent
                      block={block}
                      canEdit={canEdit && !isLockedByOther}
                      onEdit={() => handleBlockEdit(block.id)}
                    />
                  )}
                </div>

                {/* Collaboration Status */}
                {lock && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {isLockedByOther ? (
                          <>
                            <UserX className="h-4 w-4" />
                            <span>Blockerat för redigering</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Du har redigeringslås</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Avatar className={`h-6 w-6 ${getParticipantColor(lock.user_id)}`}>
                          <span className="text-white text-xs font-medium">
                            {getParticipantName(lock.user_id).charAt(0).toUpperCase()}
                          </span>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Session Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Session: {session.id}</span>
              <span>Startad: {session.started_at.toLocaleTimeString('sv-SE')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Aktiv session</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for editable block content
function EditableBlockContent({
  block,
  onSave,
  onCancel
}: {
  block: any;
  onSave: (content: any) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(block.content);

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 border rounded-md resize-none"
        rows={4}
        placeholder="Redigera innehåll..."
      />
      
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onSave(content)}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Spara
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

// Helper component for read-only block content
function ReadOnlyBlockContent({
  block,
  canEdit,
  onEdit
}: {
  block: any;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-white border rounded-md">
        <p className="whitespace-pre-wrap">{block.content}</p>
      </div>
      
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Redigera
        </Button>
      )}
    </div>
  );
}