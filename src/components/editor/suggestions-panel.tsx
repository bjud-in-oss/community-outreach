/**
 * Suggestions Panel Component
 * 
 * Displays writing suggestions in a non-destructive way
 * Allows users to accept or ignore individual suggestions
 */

'use client';

import React from 'react';
import { EditorSuggestion } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckIcon, 
  XIcon, 
  LightbulbIcon,
  LoaderIcon,
  SparklesIcon,
  BookOpenIcon,
  EyeIcon,
  MessageCircleIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionsPanelProps {
  blockId: string;
  suggestions: EditorSuggestion[];
  isLoading?: boolean;
  onAccept: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  className?: string;
}

/**
 * Get icon for suggestion type
 */
function getSuggestionIcon(type: EditorSuggestion['type']) {
  switch (type) {
    case 'grammar':
      return BookOpenIcon;
    case 'style':
      return SparklesIcon;
    case 'clarity':
      return EyeIcon;
    case 'tone':
      return MessageCircleIcon;
    default:
      return LightbulbIcon;
  }
}

/**
 * Get color scheme for suggestion type
 */
function getSuggestionColors(type: EditorSuggestion['type']) {
  switch (type) {
    case 'grammar':
      return {
        badge: 'bg-red-100 text-red-800 border-red-200',
        icon: 'text-red-600',
        border: 'border-red-200'
      };
    case 'style':
      return {
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: 'text-purple-600',
        border: 'border-purple-200'
      };
    case 'clarity':
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: 'text-blue-600',
        border: 'border-blue-200'
      };
    case 'tone':
      return {
        badge: 'bg-green-100 text-green-800 border-green-200',
        icon: 'text-green-600',
        border: 'border-green-200'
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'text-gray-600',
        border: 'border-gray-200'
      };
  }
}

/**
 * Individual suggestion item
 */
function SuggestionItem({ 
  suggestion, 
  onAccept, 
  onDismiss 
}: { 
  suggestion: EditorSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const Icon = getSuggestionIcon(suggestion.type);
  const colors = getSuggestionColors(suggestion.type);
  
  return (
    <div className={cn('p-3 border rounded-lg bg-white', colors.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', colors.icon)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn('text-xs', colors.badge)}>
              {suggestion.type}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{Math.round(suggestion.confidence * 100)}% confident</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Change </span>
              <span className="bg-red-100 text-red-800 px-1 rounded font-mono text-xs">
                "{suggestion.original}"
              </span>
              <span className="text-gray-600"> to </span>
              <span className="bg-green-100 text-green-800 px-1 rounded font-mono text-xs">
                "{suggestion.suggested}"
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              {suggestion.explanation}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onAccept}
            className="h-7 px-2 text-xs"
            title="Accept suggestion"
          >
            <CheckIcon className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDismiss}
            className="h-7 px-2 text-xs"
            title="Dismiss suggestion"
          >
            <XIcon className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center p-6 text-gray-500">
      <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Analyzing your writing...</span>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-gray-500">
      <SparklesIcon className="w-8 h-8 mb-2" />
      <p className="text-sm text-center">
        No suggestions available.<br />
        Your writing looks great!
      </p>
    </div>
  );
}

/**
 * Suggestions summary
 */
function SuggestionsSummary({ suggestions }: { suggestions: EditorSuggestion[] }) {
  const typeCounts = suggestions.reduce((acc, suggestion) => {
    acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const averageConfidence = suggestions.length > 0
    ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
    : 0;
  
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
      <span>{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>
      {suggestions.length > 0 && (
        <>
          <span>•</span>
          <span>{Math.round(averageConfidence * 100)}% avg confidence</span>
          {Object.entries(typeCounts).length > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs px-1 py-0">
                    {count} {type}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function SuggestionsPanel({
  blockId,
  suggestions,
  isLoading = false,
  onAccept,
  onDismiss,
  className
}: SuggestionsPanelProps) {
  const handleAccept = (suggestionId: string) => {
    onAccept(suggestionId);
  };
  
  const handleDismiss = (suggestionId: string) => {
    onDismiss(suggestionId);
  };
  
  return (
    <Card className={cn('suggestions-panel', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <LightbulbIcon className="w-4 h-4 text-yellow-600" />
          Writing Suggestions
        </CardTitle>
        <SuggestionsSummary suggestions={suggestions} />
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <LoadingState />
        ) : suggestions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onDismiss={() => handleDismiss(suggestion.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}