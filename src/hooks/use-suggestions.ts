/**
 * Suggestions Hook
 * 
 * React hook for managing writing assistance and suggestions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  SuggestionService, 
  SuggestionRequest, 
  SuggestionResponse,
  SuggestionServiceOptions 
} from '@/services/suggestion-service';
import { ContentBlock, EditorSuggestion } from '@/types/editor';

export interface UseSuggestionsOptions extends SuggestionServiceOptions {
  enabled?: boolean;
  autoSuggest?: boolean;
  debounceMs?: number;
}

export interface UseSuggestionsReturn {
  // Suggestion state
  suggestions: Record<string, EditorSuggestion[]>; // blockId -> suggestions
  isLoading: Record<string, boolean>; // blockId -> loading state
  
  // Actions
  generateSuggestions: (blockId: string, content: ContentBlock, context?: SuggestionRequest['context']) => Promise<void>;
  applySuggestion: (blockId: string, suggestionId: string, content: ContentBlock) => ContentBlock | null;
  dismissSuggestion: (blockId: string, suggestionId: string) => void;
  clearSuggestions: (blockId?: string) => void;
  
  // Service management
  updateOptions: (options: Partial<SuggestionServiceOptions>) => void;
  getOptions: () => SuggestionServiceOptions;
  
  // Statistics
  getStats: () => {
    totalSuggestions: number;
    appliedSuggestions: number;
    dismissedSuggestions: number;
    averageConfidence: number;
  };
}

export function useSuggestions({
  enabled = true,
  autoSuggest = false,
  debounceMs = 1000,
  ...serviceOptions
}: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Record<string, EditorSuggestion[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalSuggestions: 0,
    appliedSuggestions: 0,
    dismissedSuggestions: 0
  });
  
  const serviceRef = useRef<SuggestionService | null>(null);
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Initialize suggestion service
  useEffect(() => {
    if (enabled) {
      serviceRef.current = new SuggestionService(serviceOptions);
    } else {
      serviceRef.current = null;
    }
  }, [enabled, JSON.stringify(serviceOptions)]);
  
  // Generate suggestions for a block
  const generateSuggestions = useCallback(async (
    blockId: string, 
    content: ContentBlock, 
    context?: SuggestionRequest['context']
  ) => {
    if (!enabled || !serviceRef.current) {
      return;
    }
    
    // Clear existing debounce timer
    if (debounceTimersRef.current[blockId]) {
      clearTimeout(debounceTimersRef.current[blockId]);
    }
    
    // Set up debounced suggestion generation
    debounceTimersRef.current[blockId] = setTimeout(async () => {
      setIsLoading(prev => ({ ...prev, [blockId]: true }));
      
      try {
        const request: SuggestionRequest = {
          blockId,
          content,
          context
        };
        
        const response = await serviceRef.current!.generateSuggestions(request);
        
        setSuggestions(prev => ({
          ...prev,
          [blockId]: response.suggestions
        }));
        
        setStats(prev => ({
          ...prev,
          totalSuggestions: prev.totalSuggestions + response.suggestions.length
        }));
        
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
        setSuggestions(prev => ({
          ...prev,
          [blockId]: []
        }));
      } finally {
        setIsLoading(prev => ({ ...prev, [blockId]: false }));
        delete debounceTimersRef.current[blockId];
      }
    }, debounceMs);
  }, [enabled, debounceMs]);
  
  // Apply a suggestion to content
  const applySuggestion = useCallback((
    blockId: string, 
    suggestionId: string, 
    content: ContentBlock
  ): ContentBlock | null => {
    if (!serviceRef.current) {
      return null;
    }
    
    const blockSuggestions = suggestions[blockId] || [];
    const suggestion = blockSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) {
      return null;
    }
    
    try {
      const updatedContent = serviceRef.current.applySuggestion(content, suggestion);
      
      // Remove the applied suggestion
      setSuggestions(prev => ({
        ...prev,
        [blockId]: blockSuggestions.filter(s => s.id !== suggestionId)
      }));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        appliedSuggestions: prev.appliedSuggestions + 1
      }));
      
      return updatedContent;
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      return null;
    }
  }, [suggestions]);
  
  // Dismiss a suggestion
  const dismissSuggestion = useCallback((blockId: string, suggestionId: string) => {
    setSuggestions(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(s => s.id !== suggestionId)
    }));
    
    setStats(prev => ({
      ...prev,
      dismissedSuggestions: prev.dismissedSuggestions + 1
    }));
  }, []);
  
  // Clear suggestions
  const clearSuggestions = useCallback((blockId?: string) => {
    if (blockId) {
      setSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[blockId];
        return newSuggestions;
      });
      
      setIsLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[blockId];
        return newLoading;
      });
      
      // Clear debounce timer
      if (debounceTimersRef.current[blockId]) {
        clearTimeout(debounceTimersRef.current[blockId]);
        delete debounceTimersRef.current[blockId];
      }
    } else {
      setSuggestions({});
      setIsLoading({});
      
      // Clear all debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
      debounceTimersRef.current = {};
    }
  }, []);
  
  // Update service options
  const updateOptions = useCallback((options: Partial<SuggestionServiceOptions>) => {
    if (serviceRef.current) {
      serviceRef.current.updateOptions(options);
    }
  }, []);
  
  // Get service options
  const getOptions = useCallback((): SuggestionServiceOptions => {
    if (serviceRef.current) {
      return serviceRef.current.getOptions();
    }
    return {};
  }, []);
  
  // Get statistics
  const getStats = useCallback(() => {
    const allSuggestions = Object.values(suggestions).flat();
    const averageConfidence = allSuggestions.length > 0 
      ? allSuggestions.reduce((sum, s) => sum + s.confidence, 0) / allSuggestions.length
      : 0;
    
    return {
      ...stats,
      averageConfidence
    };
  }, [suggestions, stats]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  return {
    suggestions,
    isLoading,
    generateSuggestions,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
    updateOptions,
    getOptions,
    getStats
  };
}