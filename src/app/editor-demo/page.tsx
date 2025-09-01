'use client';

import React, { useState } from 'react';
import { WYSIWYGEditor } from '@/components/editor';
import { UIStateTree, EditorState } from '@/types/editor';

/**
 * WYSIWYG Editor Demo Page
 * 
 * Demonstrates the block-based editor with Creative Flow and Suggestion modes.
 */
export default function EditorDemoPage() {
  const [document, setDocument] = useState<UIStateTree | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [showJson, setShowJson] = useState(false);
  
  const handleDocumentChange = (newDocument: UIStateTree) => {
    setDocument(newDocument);
  };
  
  const handleStateChange = (newState: EditorState) => {
    setEditorState(newState);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WYSIWYG-JSON Editor Demo
          </h1>
          <p className="text-gray-600">
            A block-based editor that outputs JSON conforming to UIStateTree structure.
            Supports Creative Flow mode (default) and Suggestion mode (on-demand).
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Editor
              </h2>
              
              <WYSIWYGEditor
                onChange={handleDocumentChange}
                onStateChange={handleStateChange}
                collaborationEnabled={true}
                userId="demo-user"
                suggestionModeEnabled={true}
                className="min-h-96"
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Editor State */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Editor State
              </h3>
              
              {editorState && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Mode:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs ${
                      editorState.mode === 'creative-flow' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {editorState.mode}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Selected Block:</span>{' '}
                    <span className="text-gray-600">
                      {editorState.selectedBlockId || 'None'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Total Blocks:</span>{' '}
                    <span className="text-gray-600">
                      {editorState.document.blocks.length}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Can Undo:</span>{' '}
                    <span className="text-gray-600">
                      {editorState.history.past.length > 0 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Can Redo:</span>{' '}
                    <span className="text-gray-600">
                      {editorState.history.future.length > 0 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {Object.keys(editorState.collaboration.lockedBlocks).length > 0 && (
                    <div>
                      <span className="font-medium">Locked Blocks:</span>{' '}
                      <span className="text-red-600">
                        {Object.keys(editorState.collaboration.lockedBlocks).length}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Document Info */}
            {document && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Document Info
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>{' '}
                    <span className="text-gray-600">{document.metadata.title}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Version:</span>{' '}
                    <span className="text-gray-600">{document.metadata.version}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Author:</span>{' '}
                    <span className="text-gray-600">{document.metadata.author}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    <span className="text-gray-600">
                      {document.metadata.created_at.toLocaleString()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Updated:</span>{' '}
                    <span className="text-gray-600">
                      {document.metadata.updated_at.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* JSON Output Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  JSON Output
                </h3>
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  {showJson ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showJson && document && (
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                  <pre>{JSON.stringify(document, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Editor Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Block Types</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Text blocks with formatting</li>
                <li>• Headings (H1-H6)</li>
                <li>• Lists (ordered/unordered)</li>
                <li>• Images with captions</li>
                <li>• Quotes with attribution</li>
                <li>• Code blocks with syntax</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Editing Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Double-click to edit</li>
                <li>• Enter to create new blocks</li>
                <li>• Escape to cancel editing</li>
                <li>• Undo/Redo support</li>
                <li>• Auto-resize text areas</li>
                <li>• Block selection and deletion</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Modes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Creative Flow (default)</li>
                <li>• Suggestion Mode (on-demand)</li>
                <li>• Real-time collaboration</li>
                <li>• Block-level locking</li>
                <li>• Read-only mode</li>
                <li>• JSON output conformance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}