/**
 * Semantic Diff Component
 * 
 * Displays conflicts between different versions of content blocks
 * with a user-friendly "Before and After" comparison interface
 */

'use client';

import React from 'react';
// Temporary type definition until collaboration service is fully implemented
interface SemanticDiff {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  position: number;
  author: string;
  timestamp: Date;
  before: ContentBlock;
  after: ContentBlock;
  changes: Array<{
    type: 'addition' | 'deletion' | 'modification';
    path: string;
    description: string;
  }>;
}
import { ContentBlock, TextBlock, HeadingBlock } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon, GitMergeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SemanticDiffProps {
  diff: SemanticDiff;
  onResolve: (diffId: string, resolution: 'accept' | 'reject' | 'merge') => void;
  className?: string;
}

/**
 * Renders content block in a readable format for comparison
 */
function renderBlockContent(block: ContentBlock): React.ReactNode {
  switch (block.type) {
    case 'text':
      const textBlock = block as TextBlock;
      return (
        <div className="prose prose-sm max-w-none">
          <p className={cn({
            'font-bold': textBlock.content.formatting?.bold,
            'italic': textBlock.content.formatting?.italic,
            'underline': textBlock.content.formatting?.underline
          })}>
            {textBlock.content.text || <em className="text-gray-400">Empty text</em>}
          </p>
        </div>
      );
    
    case 'heading':
      const headingBlock = block as HeadingBlock;
      const HeadingTag = `h${headingBlock.content.level}` as keyof JSX.IntrinsicElements;
      return (
        <div className="prose prose-sm max-w-none">
          <HeadingTag className="mt-0 mb-2">
            {headingBlock.content.text || <em className="text-gray-400">Empty heading</em>}
          </HeadingTag>
        </div>
      );
    
    case 'list':
      const listBlock = block as any;
      const ListTag = listBlock.content.ordered ? 'ol' : 'ul';
      return (
        <div className="prose prose-sm max-w-none">
          <ListTag>
            {listBlock.content.items.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ListTag>
        </div>
      );
    
    case 'quote':
      const quoteBlock = block as any;
      return (
        <div className="prose prose-sm max-w-none">
          <blockquote className="border-l-4 border-gray-300 pl-4 italic">
            {quoteBlock.content.text}
            {quoteBlock.content.author && (
              <footer className="text-sm text-gray-600 mt-2">
                — {quoteBlock.content.author}
                {quoteBlock.content.source && `, ${quoteBlock.content.source}`}
              </footer>
            )}
          </blockquote>
        </div>
      );
    
    case 'code':
      const codeBlock = block as any;
      return (
        <div className="prose prose-sm max-w-none">
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code className={codeBlock.content.language ? `language-${codeBlock.content.language}` : ''}>
              {codeBlock.content.code}
            </code>
          </pre>
        </div>
      );
    
    case 'image':
      const imageBlock = block as any;
      return (
        <div className="prose prose-sm max-w-none">
          <figure>
            <img 
              src={imageBlock.content.src} 
              alt={imageBlock.content.alt}
              className="max-w-full h-auto rounded"
              style={{
                width: imageBlock.content.width ? `${imageBlock.content.width}px` : 'auto',
                height: imageBlock.content.height ? `${imageBlock.content.height}px` : 'auto'
              }}
            />
            {imageBlock.content.caption && (
              <figcaption className="text-sm text-gray-600 mt-2">
                {imageBlock.content.caption}
              </figcaption>
            )}
          </figure>
        </div>
      );
    
    default:
      return (
        <div className="text-gray-500 italic">
          Unknown block type: {(block as any).type}
        </div>
      );
  }
}

/**
 * Renders a change description with appropriate styling
 */
function renderChangeDescription(change: SemanticDiff['changes'][0]): React.ReactNode {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <span className="text-green-600">+</span>;
      case 'deletion':
        return <span className="text-red-600">-</span>;
      case 'modification':
        return <span className="text-blue-600">~</span>;
      default:
        return <span className="text-gray-600">?</span>;
    }
  };
  
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'deletion':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'modification':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  return (
    <div className={cn('p-2 rounded border text-sm', getChangeColor(change.type))}>
      <div className="flex items-center gap-2 mb-1">
        {getChangeIcon(change.type)}
        <span className="font-medium capitalize">{change.type}</span>
        <Badge variant="outline" className="text-xs">
          {change.path}
        </Badge>
      </div>
      <p className="text-sm">{change.description}</p>
    </div>
  );
}

export function SemanticDiff({ diff, onResolve, className }: SemanticDiffProps) {
  const handleResolve = (resolution: 'accept' | 'reject' | 'merge') => {
    onResolve(diff.id, resolution);
  };
  
  return (
    <Card className={cn('semantic-diff', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitMergeIcon className="w-5 h-5 text-orange-500" />
          Conflict Detected
        </CardTitle>
        <p className="text-sm text-gray-600">
          Another user has made changes to this block. Please review the differences and choose how to resolve the conflict.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Changes Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Changes Made:</h4>
          <div className="space-y-2">
            {diff.changes.map((change, index) => (
              <div key={index}>
                {renderChangeDescription(change)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Before and After Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-gray-700">Before (Your Version)</h4>
              <Badge variant="outline" className="text-xs">Original</Badge>
            </div>
            <div className="border rounded-lg p-3 bg-red-50 border-red-200">
              {renderBlockContent(diff.before)}
            </div>
          </div>
          
          {/* After */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-gray-700">After (Their Version)</h4>
              <Badge variant="outline" className="text-xs">Modified</Badge>
            </div>
            <div className="border rounded-lg p-3 bg-green-50 border-green-200">
              {renderBlockContent(diff.after)}
            </div>
          </div>
        </div>
        
        {/* Resolution Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            onClick={() => handleResolve('reject')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <XIcon className="w-4 h-4" />
            Keep My Version
          </Button>
          
          <Button
            onClick={() => handleResolve('accept')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            Accept Their Version
          </Button>
          
          <Button
            onClick={() => handleResolve('merge')}
            variant="default"
            className="flex items-center gap-2"
          >
            <GitMergeIcon className="w-4 h-4" />
            Merge Changes
          </Button>
        </div>
        
        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Keep My Version:</strong> Discard their changes and keep your original content.</p>
          <p><strong>Accept Their Version:</strong> Replace your content with their changes.</p>
          <p><strong>Merge Changes:</strong> Combine both versions intelligently (recommended).</p>
        </div>
      </CardContent>
    </Card>
  );
}