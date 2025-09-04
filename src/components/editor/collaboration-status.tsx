/**
 * Collaboration Status Component
 * 
 * Shows real-time collaboration status including:
 * - Connection status
 * - Active users with presence indicators
 * - Visual lock indicators for blocks being edited
 */

'use client';

import React from 'react';
// Temporary type definition until collaboration service is fully implemented
interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  color?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  WifiIcon, 
  WifiOffIcon, 
  LoaderIcon, 
  AlertCircleIcon,
  UsersIcon,
  LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationStatusProps {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  activeUsers: CollaborationUser[];
  lockedBlocks: Record<string, string>; // blockId -> userId
  className?: string;
}

/**
 * Connection status indicator
 */
function ConnectionStatus({ 
  isConnected, 
  connectionStatus 
}: { 
  isConnected: boolean; 
  connectionStatus: CollaborationStatusProps['connectionStatus'];
}) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: WifiIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Connected',
          description: 'Real-time collaboration is active'
        };
      case 'connecting':
        return {
          icon: LoaderIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Connecting...',
          description: 'Establishing connection for collaboration'
        };
      case 'disconnected':
        return {
          icon: WifiOffIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Disconnected',
          description: 'Collaboration features are not available'
        };
      case 'error':
        return {
          icon: AlertCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Connection Error',
          description: 'Failed to connect to collaboration server'
        };
      default:
        return {
          icon: WifiOffIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Connection status unknown'
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium',
            config.bgColor,
            config.color
          )}>
            <Icon className={cn(
              'w-3 h-3',
              connectionStatus === 'connecting' && 'animate-spin'
            )} />
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * User avatar with presence indicator
 */
function UserAvatar({ 
  user, 
  size = 'sm' 
}: { 
  user: CollaborationUser; 
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback 
                className="text-xs font-medium"
                style={{ backgroundColor: user.color, color: 'white' }}
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Online status indicator */}
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            )} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.isOnline ? 'Online' : `Last seen ${user.lastSeen?.toLocaleTimeString() || 'Unknown'}`}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Active users list
 */
function ActiveUsersList({ 
  users, 
  maxVisible = 5 
}: { 
  users: CollaborationUser[]; 
  maxVisible?: number;
}) {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);
  
  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <UsersIcon className="w-3 h-3" />
        <span>No other users online</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <UsersIcon className="w-3 h-3 text-gray-600" />
        <span className="text-xs text-gray-600">{users.length}</span>
      </div>
      
      <div className="flex items-center -space-x-1">
        {visibleUsers.map(user => (
          <UserAvatar key={user.id} user={user} size="sm" />
        ))}
        
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                  +{hiddenCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hiddenCount} more user{hiddenCount > 1 ? 's' : ''} online</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

/**
 * Locked blocks indicator
 */
function LockedBlocksIndicator({ 
  lockedBlocks, 
  activeUsers 
}: { 
  lockedBlocks: Record<string, string>;
  activeUsers: CollaborationUser[];
}) {
  const lockedCount = Object.keys(lockedBlocks).length;
  
  if (lockedCount === 0) {
    return null;
  }
  
  const getUserName = (userId: string) => {
    const user = activeUsers.find(u => u.id === userId);
    return user?.name || userId;
  };
  
  const lockEntries = Object.entries(lockedBlocks);
  const firstLock = lockEntries[0];
  const remainingCount = lockedCount - 1;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
            <LockIcon className="w-3 h-3" />
            <span>
              {lockedCount} block{lockedCount > 1 ? 's' : ''} locked
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Locked blocks:</p>
            {lockEntries.slice(0, 3).map(([blockId, userId]) => (
              <p key={blockId} className="text-xs">
                Block {blockId.slice(-8)} by {getUserName(userId)}
              </p>
            ))}
            {lockedCount > 3 && (
              <p className="text-xs text-gray-500">
                ...and {lockedCount - 3} more
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CollaborationStatus({
  isConnected,
  connectionStatus,
  activeUsers,
  lockedBlocks,
  className
}: CollaborationStatusProps) {
  return (
    <div className={cn(
      'collaboration-status flex items-center gap-3 p-2 bg-gray-50 border rounded-lg',
      className
    )}>
      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={isConnected} 
        connectionStatus={connectionStatus} 
      />
      
      {/* Active Users */}
      {isConnected && (
        <ActiveUsersList users={activeUsers} />
      )}
      
      {/* Locked Blocks */}
      {isConnected && (
        <LockedBlocksIndicator 
          lockedBlocks={lockedBlocks} 
          activeUsers={activeUsers} 
        />
      )}
      
      {/* Separator for visual clarity */}
      {!isConnected && (
        <div className="text-xs text-gray-500">
          Collaboration unavailable
        </div>
      )}
    </div>
  );
}