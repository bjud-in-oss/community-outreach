/**
 * Reflection Editor Component
 * WYSIWYG editor for creating and editing personal reflections
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ReflectionEntry, 
  ReflectionContent, 
  ReflectionBlock, 
  PrivacyLevel,
  ReflectionBlockType 
} from '../../types/chronicler';
import { UserState, Asset } from '../../types';
import { Heart, Lock, Share2, Image, MapPin, Tag, Save, Plus } from 'lucide-react';

interface ReflectionEditorProps {
  /** Existing reflection to edit (optional) */
  reflection?: ReflectionEntry;
  
  /** Current user's emotional state */
  emotionalContext: UserState;
  
  /** Callback when reflection is saved */
  onSave: (reflection: Partial<ReflectionEntry>) => Promise<void>;
  
  /** Callback when reflection is cancelled */
  onCancel: () => void;
  
  /** Whether the editor is in read-only mode */
  readOnly?: boolean;
}

export function ReflectionEditor({
  reflection,
  emotionalContext,
  onSave,
  onCancel,
  readOnly = false
}: ReflectionEditorProps) {
  const [title, setTitle] = useState(reflection?.title || '');
  const [content, setContent] = useState<ReflectionContent>(
    reflection?.content || {
      text: '',
      blocks: [],
      metadata: {
        word_count: 0,
        reading_time_minutes: 0,
        dominant_emotions: [],
        themes: [],
        language: 'sv'
      }
    }
  );
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(
    reflection?.privacy_level || 'private'
  );
  const [tags, setTags] = useState<string[]>(reflection?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [assets, setAssets] = useState<Asset[]>(reflection?.assets || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmotionalContext, setShowEmotionalContext] = useState(false);

  // Update word count and reading time
  useEffect(() => {
    const wordCount = content.text.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    setContent(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        word_count: wordCount,
        reading_time_minutes: readingTime
      }
    }));
  }, [content.text]);

  const handleContentChange = useCallback((newText: string) => {
    setContent(prev => ({
      ...prev,
      text: newText
    }));
  }, []);

  const handleAddBlock = useCallback((blockType: ReflectionBlockType) => {
    const newBlock: ReflectionBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      content: getDefaultBlockContent(blockType),
      metadata: {
        created_at: new Date().toISOString()
      }
    };

    setContent(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  }, []);

  const handleBlockUpdate = useCallback((blockId: string, newContent: any) => {
    setContent(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    }));
  }, []);

  const handleRemoveBlock = useCallback((blockId: string) => {
    setContent(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags(prev => [...prev, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const reflectionData: Partial<ReflectionEntry> = {
        title: title || 'Untitled Reflection',
        content,
        privacy_level: privacyLevel,
        tags,
        assets,
        emotional_context: emotionalContext,
        shareable: privacyLevel !== 'private',
        updated_at: new Date()
      };

      if (!reflection) {
        reflectionData.created_at = new Date();
        reflectionData.status = 'saved';
      }

      await onSave(reflectionData);
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPrivacyIcon = (level: PrivacyLevel) => {
    switch (level) {
      case 'private': return <Lock className="h-4 w-4" />;
      case 'protected': return <Heart className="h-4 w-4" />;
      case 'shareable': return <Share2 className="h-4 w-4" />;
    }
  };

  const getPrivacyLabel = (level: PrivacyLevel) => {
    switch (level) {
      case 'private': return 'Privat';
      case 'protected': return 'Skyddad';
      case 'shareable': return 'Delbar';
    }
  };

  const getEmotionalStateDescription = (state: UserState) => {
    const dominant = Math.max(state.fight, state.flight, state.fixes);
    if (dominant === state.fight) return 'Energisk och handlingskraftig';
    if (dominant === state.flight) return 'Reflekterande och försiktig';
    return 'Fokuserad på lösningar';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {reflection ? 'Redigera reflektion' : 'Ny reflektion'}
          </h1>
          <p className="text-muted-foreground">
            Fånga dina tankar och känslor i ett säkert utrymme
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmotionalContext(!showEmotionalContext)}
          >
            <Heart className="h-4 w-4 mr-2" />
            Känslomässigt sammanhang
          </Button>
        </div>
      </div>

      {/* Emotional Context Card */}
      {showEmotionalContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Ditt känslomässiga tillstånd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {getEmotionalStateDescription(emotionalContext)}
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {Math.round(emotionalContext.fight * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Handlingskraft</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {Math.round(emotionalContext.flight * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Reflektion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {Math.round(emotionalContext.fixes * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Lösningsfokus</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Input
              placeholder="Titel för din reflektion..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none p-0 focus-visible:ring-0"
              disabled={readOnly}
            />
            
            <div className="flex items-center gap-2">
              {/* Privacy Level Selector */}
              <select
                value={privacyLevel}
                onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}
                className="flex items-center gap-2 px-3 py-1 rounded-md border text-sm"
                disabled={readOnly}
              >
                <option value="private">🔒 Privat</option>
                <option value="protected">💝 Skyddad</option>
                <option value="shareable">🔗 Delbar</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Main Content Area */}
          <Textarea
            placeholder="Skriv dina tankar här..."
            value={content.text}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[300px] resize-none border-none p-0 focus-visible:ring-0"
            disabled={readOnly}
          />

          {/* Content Blocks */}
          {content.blocks.map((block) => (
            <ReflectionBlockComponent
              key={block.id}
              block={block}
              onUpdate={(newContent) => handleBlockUpdate(block.id, newContent)}
              onRemove={() => handleRemoveBlock(block.id)}
              readOnly={readOnly}
            />
          ))}

          {/* Add Block Buttons */}
          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('image')}
              >
                <Image className="h-4 w-4 mr-2" />
                Bild
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('location')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Plats
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('mood')}
              >
                <Heart className="h-4 w-4 mr-2" />
                Känsla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Taggar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => !readOnly && handleRemoveTag(tag)}
                >
                  {tag}
                  {!readOnly && <span className="ml-1">×</span>}
                </Badge>
              ))}
            </div>
            
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Lägg till tagg..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1"
                />
                <Button onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{content.metadata.word_count} ord</span>
              <span>{content.metadata.reading_time_minutes} min läsning</span>
              {reflection && (
                <span>
                  Skapad {reflection.created_at.toLocaleDateString('sv-SE')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getPrivacyIcon(privacyLevel)}
              <span>{getPrivacyLabel(privacyLevel)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara reflektion'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component for rendering different block types
function ReflectionBlockComponent({
  block,
  onUpdate,
  onRemove,
  readOnly
}: {
  block: ReflectionBlock;
  onUpdate: (content: any) => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  switch (block.type) {
    case 'image':
      return (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Bild</span>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={onRemove}>
                ×
              </Button>
            )}
          </div>
          <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      );
      
    case 'location':
      return (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Plats</span>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={onRemove}>
                ×
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Ange plats..."
              value={block.content?.name || ''}
              onChange={(e) => onUpdate({ ...block.content, name: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
      );
      
    case 'mood':
      return (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Känsla</span>
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={onRemove}>
                ×
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <Input
              placeholder="Beskriv din känsla..."
              value={block.content?.description || ''}
              onChange={(e) => onUpdate({ ...block.content, description: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
      );
      
    default:
      return null;
  }
}

// Helper function to get default content for new blocks
function getDefaultBlockContent(blockType: ReflectionBlockType): any {
  switch (blockType) {
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'location':
      return { name: '', latitude: null, longitude: null };
    case 'mood':
      return { description: '', intensity: 5 };
    default:
      return {};
  }
}