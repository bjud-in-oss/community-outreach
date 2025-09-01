/**
 * Personal Chronicler Dashboard
 * Main interface for managing personal reflections and transformations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ReflectionEditor } from './reflection-editor';
import { TransformationDialog } from './transformation-dialog';
import { ExternalIntegrationPanel } from './external-integration-panel';
import { 
  ReflectionEntry, 
  CortexTransformation,
  ExternalAssetIntegration,
  ChroniclerWorkflow 
} from '../../types/chronicler';
import { UserState } from '../../types';
import { ChroniclerService } from '../../services/chronicler-service';
import { 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Lock, 
  Share2, 
  Calendar,
  Tag,
  Image,
  MessageSquare,
  Settings,
  Download
} from 'lucide-react';

interface ChroniclerDashboardProps {
  /** Current user ID */
  userId: string;
  
  /** Current user's emotional state */
  emotionalContext: UserState;
  
  /** Chronicler service instance */
  chroniclerService: ChroniclerService;
}

export function ChroniclerDashboard({
  userId,
  emotionalContext,
  chroniclerService
}: ChroniclerDashboardProps) {
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<ReflectionEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingReflection, setEditingReflection] = useState<ReflectionEntry | undefined>();
  const [showTransformDialog, setShowTransformDialog] = useState(false);
  const [selectedReflectionForTransform, setSelectedReflectionForTransform] = useState<ReflectionEntry | undefined>();
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Load user's reflections on component mount
  useEffect(() => {
    loadReflections();
  }, [userId]);

  // Filter reflections based on search and filters
  useEffect(() => {
    let filtered = reflections;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(reflection =>
        reflection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.content.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(reflection =>
        selectedTags.every(tag => reflection.tags.includes(tag))
      );
    }

    // Privacy filter
    if (privacyFilter !== 'all') {
      filtered = filtered.filter(reflection => reflection.privacy_level === privacyFilter);
    }

    setFilteredReflections(filtered);
  }, [reflections, searchQuery, selectedTags, privacyFilter]);

  const loadReflections = async () => {
    setIsLoading(true);
    try {
      const result = await chroniclerService.getUserReflections(userId);
      setReflections(result.reflections);
      
      // Extract all unique tags
      const tags = new Set<string>();
      result.reflections.forEach(reflection => {
        reflection.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
      
    } catch (error) {
      console.error('Failed to load reflections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReflection = () => {
    setEditingReflection(undefined);
    setShowEditor(true);
  };

  const handleEditReflection = (reflection: ReflectionEntry) => {
    setEditingReflection(reflection);
    setShowEditor(true);
  };

  const handleSaveReflection = async (reflectionData: Partial<ReflectionEntry>) => {
    try {
      if (editingReflection) {
        // Update existing reflection
        await chroniclerService.updateReflection(
          editingReflection.id,
          reflectionData,
          emotionalContext
        );
      } else {
        // Create new reflection
        await chroniclerService.createReflection(
          userId,
          reflectionData.content!,
          emotionalContext,
          reflectionData.assets || []
        );
      }
      
      setShowEditor(false);
      setEditingReflection(undefined);
      await loadReflections();
      
    } catch (error) {
      console.error('Failed to save reflection:', error);
    }
  };

  const handleTransformReflection = (reflection: ReflectionEntry) => {
    setSelectedReflectionForTransform(reflection);
    setShowTransformDialog(true);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'private': return <Lock className="h-4 w-4" />;
      case 'protected': return <Heart className="h-4 w-4" />;
      case 'shareable': return <Share2 className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case 'private': return 'text-gray-500';
      case 'protected': return 'text-yellow-500';
      case 'shareable': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (showEditor) {
    return (
      <ReflectionEditor
        reflection={editingReflection}
        emotionalContext={emotionalContext}
        onSave={handleSaveReflection}
        onCancel={() => {
          setShowEditor(false);
          setEditingReflection(undefined);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personlig Krönikör</h1>
          <p className="text-muted-foreground">
            Fånga dina tankar, känslor och minnen i ett säkert utrymme
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowIntegrationPanel(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Integrationer
          </Button>
          
          <Button onClick={handleCreateReflection}>
            <Plus className="h-4 w-4 mr-2" />
            Ny reflektion
          </Button>
        </div>
      </div>

      {/* Emotional Context Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Ditt nuvarande tillstånd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {Math.round(emotionalContext.fight * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Handlingskraft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(emotionalContext.flight * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Reflektion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Math.round(emotionalContext.fixes * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Lösningsfokus</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök i dina reflektioner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Privacy Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select
                  value={privacyFilter}
                  onChange={(e) => setPrivacyFilter(e.target.value)}
                  className="px-3 py-1 rounded-md border text-sm"
                >
                  <option value="all">Alla nivåer</option>
                  <option value="private">Privata</option>
                  <option value="protected">Skyddade</option>
                  <option value="shareable">Delbara</option>
                </select>
              </div>

              {/* Tag Filters */}
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reflections Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laddar dina reflektioner...</p>
        </div>
      ) : filteredReflections.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inga reflektioner hittades</h3>
            <p className="text-muted-foreground mb-4">
              {reflections.length === 0 
                ? 'Börja din resa genom att skapa din första reflektion.'
                : 'Prova att ändra dina sökkriterier eller filter.'
              }
            </p>
            {reflections.length === 0 && (
              <Button onClick={handleCreateReflection}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa din första reflektion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReflections.map((reflection) => (
            <Card key={reflection.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {reflection.title}
                  </CardTitle>
                  <div className={`${getPrivacyColor(reflection.privacy_level)}`}>
                    {getPrivacyIcon(reflection.privacy_level)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {reflection.content.text}
                </p>

                {/* Tags */}
                {reflection.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {reflection.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {reflection.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{reflection.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(reflection.created_at)}
                    </span>
                    {reflection.assets.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        {reflection.assets.length}
                      </span>
                    )}
                  </div>
                  <span>{reflection.content.metadata.word_count} ord</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReflection(reflection)}
                  >
                    Redigera
                  </Button>
                  
                  {reflection.shareable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransformReflection(reflection)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Dela
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showTransformDialog && selectedReflectionForTransform && (
        <TransformationDialog
          reflection={selectedReflectionForTransform}
          onClose={() => {
            setShowTransformDialog(false);
            setSelectedReflectionForTransform(undefined);
          }}
          chroniclerService={chroniclerService}
        />
      )}

      {showIntegrationPanel && (
        <ExternalIntegrationPanel
          userId={userId}
          onClose={() => setShowIntegrationPanel(false)}
          chroniclerService={chroniclerService}
        />
      )}
    </div>
  );
}