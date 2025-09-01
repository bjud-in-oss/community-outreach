'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CodeBlock } from '@/types/editor';
import { cn } from '@/lib/utils';
import { Code, Copy, Check } from 'lucide-react';

interface CodeBlockComponentProps {
  block: CodeBlock;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy?: string;
  readOnly: boolean;
  onChange: (updates: Partial<CodeBlock>) => void;
  onSelect: () => void;
  onDelete: () => void;
  onAddBlock: (blockType: string) => void;
}

/**
 * Code Block Component
 * 
 * Renders a code block with syntax highlighting and language selection.
 */
export function CodeBlockComponent({
  block,
  isSelected,
  isLocked,
  lockedBy,
  readOnly,
  onChange,
  onSelect,
  onDelete,
  onAddBlock
}: CodeBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localCode, setLocalCode] = useState(block.content.code);
  const [localLanguage, setLocalLanguage] = useState(block.content.language || '');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update local values when block content changes
  useEffect(() => {
    setLocalCode(block.content.code);
    setLocalLanguage(block.content.language || '');
  }, [block.content]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localCode, isEditing]);
  
  const handleDoubleClick = () => {
    if (!readOnly && !isLocked) {
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    
    const updates: Partial<CodeBlock> = {
      content: {
        ...block.content,
        code: localCode,
        language: localLanguage || undefined
      }
    };
    
    onChange(updates);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalCode(block.content.code);
      setLocalLanguage(block.content.language || '');
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = localCode.substring(0, start) + '  ' + localCode.substring(end);
      setLocalCode(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalLanguage(e.target.value);
  };
  
  const commonLanguages = [
    { value: '', label: 'Plain text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' }
  ];
  
  return (
    <div
      className={cn(
        'code-block rounded-lg transition-all duration-200 bg-gray-900 text-gray-100',
        {
          'ring-2 ring-blue-500': isSelected
        }
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-gray-400" />
          
          {isSelected && !readOnly && !isLocked ? (
            <select
              value={localLanguage}
              onChange={handleLanguageChange}
              onBlur={handleBlur}
              className="bg-gray-700 text-gray-200 text-sm border border-gray-600 rounded px-2 py-1"
            >
              {commonLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-400">
              {localLanguage || 'Plain text'}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <div className="p-4" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-none outline-none bg-transparent font-mono text-sm text-gray-100"
            placeholder="Enter your code..."
            rows={Math.max(3, localCode.split('\n').length)}
            spellCheck={false}
            autoFocus
          />
        ) : (
          <pre
            className={cn(
              'font-mono text-sm whitespace-pre-wrap cursor-text',
              {
                'text-gray-500': !block.content.code
              }
            )}
          >
            {block.content.code || 'Click to add code...'}
          </pre>
        )}
      </div>
    </div>
  );
}