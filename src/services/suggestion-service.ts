/**
 * Suggestion Service
 * 
 * Provides on-demand writing assistance including:
 * - Grammar and spelling corrections
 * - Style improvements
 * - Clarity enhancements
 * - Tone adjustments
 */

import { ContentBlock, TextBlock, EditorSuggestion } from '@/types/editor';

export interface SuggestionRequest {
  blockId: string;
  content: ContentBlock;
  context?: {
    previousBlocks?: ContentBlock[];
    nextBlocks?: ContentBlock[];
    documentTitle?: string;
    targetAudience?: string;
    writingStyle?: 'formal' | 'casual' | 'academic' | 'creative';
  };
}

export interface SuggestionResponse {
  blockId: string;
  suggestions: EditorSuggestion[];
  processingTime: number;
  confidence: number;
}

export interface SuggestionServiceOptions {
  apiKey?: string;
  endpoint?: string;
  maxSuggestions?: number;
  minConfidence?: number;
  enabledTypes?: ('grammar' | 'style' | 'clarity' | 'tone')[];
}

/**
 * Mock suggestion patterns for development
 * In production, this would connect to a real AI service
 */
const MOCK_SUGGESTIONS = {
  grammar: [
    {
      pattern: /\bi\b/g,
      replacement: 'I',
      explanation: 'Capitalize the pronoun "I"',
      confidence: 0.95
    },
    {
      pattern: /\bteh\b/g,
      replacement: 'the',
      explanation: 'Correct spelling of "the"',
      confidence: 0.98
    },
    {
      pattern: /\brecieve\b/g,
      replacement: 'receive',
      explanation: 'Correct spelling: "i before e except after c"',
      confidence: 0.97
    },
    {
      pattern: /\byour\s+welcome\b/g,
      replacement: "you're welcome",
      explanation: 'Use "you\'re" (you are) instead of "your"',
      confidence: 0.92
    }
  ],
  style: [
    {
      pattern: /\bvery\s+(\w+)/g,
      replacement: (match: string, adjective: string) => {
        const intensifiers: Record<string, string> = {
          'good': 'excellent',
          'bad': 'terrible',
          'big': 'enormous',
          'small': 'tiny',
          'happy': 'delighted',
          'sad': 'devastated'
        };
        return intensifiers[adjective] || match;
      },
      explanation: 'Use more specific adjectives instead of "very + adjective"',
      confidence: 0.75
    },
    {
      pattern: /\bthat\s+that\b/g,
      replacement: 'that',
      explanation: 'Remove redundant "that"',
      confidence: 0.85
    }
  ],
  clarity: [
    {
      pattern: /\bin\s+order\s+to\b/g,
      replacement: 'to',
      explanation: 'Simplify "in order to" to just "to"',
      confidence: 0.80
    },
    {
      pattern: /\bdue\s+to\s+the\s+fact\s+that\b/g,
      replacement: 'because',
      explanation: 'Use "because" instead of the wordy phrase',
      confidence: 0.88
    }
  ],
  tone: [
    {
      pattern: /\bkinda\b/g,
      replacement: 'somewhat',
      explanation: 'Use "somewhat" for a more formal tone',
      confidence: 0.70
    },
    {
      pattern: /\bgonna\b/g,
      replacement: 'going to',
      explanation: 'Use "going to" for a more formal tone',
      confidence: 0.75
    }
  ]
};

export class SuggestionService {
  private options: Required<SuggestionServiceOptions>;
  
  constructor(options: SuggestionServiceOptions = {}) {
    this.options = {
      apiKey: options.apiKey || '',
      endpoint: options.endpoint || 'mock://suggestions',
      maxSuggestions: options.maxSuggestions || 10,
      minConfidence: options.minConfidence || 0.6,
      enabledTypes: options.enabledTypes || ['grammar', 'style', 'clarity', 'tone']
    };
  }
  
  /**
   * Generate suggestions for a content block
   */
  async generateSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    const startTime = Date.now();
    
    try {
      // For now, use mock suggestions
      // In production, this would make an API call to an AI service
      const suggestions = await this.generateMockSuggestions(request);
      
      const processingTime = Date.now() - startTime;
      
      return {
        blockId: request.blockId,
        suggestions: suggestions.filter(s => s.confidence >= this.options.minConfidence)
                              .slice(0, this.options.maxSuggestions),
        processingTime,
        confidence: suggestions.length > 0 ? 
          suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length : 0
      };
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return {
        blockId: request.blockId,
        suggestions: [],
        processingTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }
  
  /**
   * Generate suggestions for multiple blocks
   */
  async generateBatchSuggestions(requests: SuggestionRequest[]): Promise<SuggestionResponse[]> {
    const promises = requests.map(request => this.generateSuggestions(request));
    return Promise.all(promises);
  }
  
  /**
   * Apply a suggestion to content
   */
  applySuggestion(content: ContentBlock, suggestion: EditorSuggestion): ContentBlock {
    if (content.type === 'text') {
      const textBlock = content as TextBlock;
      const updatedText = textBlock.content.text.replace(
        new RegExp(this.escapeRegExp(suggestion.original), 'g'),
        suggestion.suggested
      );
      
      return {
        ...textBlock,
        content: {
          ...textBlock.content,
          text: updatedText
        },
        updated_at: new Date()
      };
    }
    
    // For other block types, return unchanged for now
    return content;
  }
  
  /**
   * Generate mock suggestions for development
   */
  private async generateMockSuggestions(request: SuggestionRequest): Promise<EditorSuggestion[]> {
    const suggestions: EditorSuggestion[] = [];
    
    if (request.content.type !== 'text') {
      return suggestions; // Only support text blocks for now
    }
    
    const textBlock = request.content as TextBlock;
    const text = textBlock.content.text;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Check each enabled suggestion type
    for (const type of this.options.enabledTypes) {
      const patterns = MOCK_SUGGESTIONS[type as keyof typeof MOCK_SUGGESTIONS];
      
      for (const pattern of patterns) {
        let matches: RegExpMatchArray | null;
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        
        while ((matches = regex.exec(text)) !== null) {
          const original = matches[0];
          let suggested: string;
          
          if (typeof pattern.replacement === 'function') {
            suggested = pattern.replacement(original, ...matches.slice(1));
          } else {
            suggested = pattern.replacement;
          }
          
          // Skip if no change would be made
          if (original === suggested) {
            continue;
          }
          
          // Check if we already have a suggestion for this text
          const existingSuggestion = suggestions.find(s => s.original === original);
          if (existingSuggestion) {
            continue;
          }
          
          suggestions.push({
            id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type as EditorSuggestion['type'],
            original,
            suggested,
            explanation: pattern.explanation,
            confidence: pattern.confidence + (Math.random() * 0.1 - 0.05) // Add small random variation
          });
        }
      }
    }
    
    // Add some contextual suggestions based on document context
    if (request.context) {
      const contextualSuggestions = this.generateContextualSuggestions(text, request.context);
      suggestions.push(...contextualSuggestions);
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Generate contextual suggestions based on document context
   */
  private generateContextualSuggestions(
    text: string, 
    context: NonNullable<SuggestionRequest['context']>
  ): EditorSuggestion[] {
    const suggestions: EditorSuggestion[] = [];
    
    // Suggest more formal language for academic style
    if (context.writingStyle === 'academic') {
      const informalPatterns = [
        { pattern: /\bcan't\b/g, replacement: 'cannot', explanation: 'Use "cannot" in academic writing' },
        { pattern: /\bdon't\b/g, replacement: 'do not', explanation: 'Avoid contractions in academic writing' },
        { pattern: /\bwon't\b/g, replacement: 'will not', explanation: 'Avoid contractions in academic writing' }
      ];
      
      for (const pattern of informalPatterns) {
        const matches = text.match(pattern.pattern);
        if (matches) {
          for (const match of matches) {
            suggestions.push({
              id: `contextual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'style',
              original: match,
              suggested: pattern.replacement,
              explanation: pattern.explanation,
              confidence: 0.85
            });
          }
        }
      }
    }
    
    // Suggest more casual language for casual style
    if (context.writingStyle === 'casual') {
      const formalPatterns = [
        { pattern: /\bcannot\b/g, replacement: "can't", explanation: 'Use contractions for a more casual tone' },
        { pattern: /\bdo not\b/g, replacement: "don't", explanation: 'Use contractions for a more casual tone' }
      ];
      
      for (const pattern of formalPatterns) {
        const matches = text.match(pattern.pattern);
        if (matches) {
          for (const match of matches) {
            suggestions.push({
              id: `contextual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'tone',
              original: match,
              suggested: pattern.replacement,
              explanation: pattern.explanation,
              confidence: 0.75
            });
          }
        }
      }
    }
    
    return suggestions;
  }
  
  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Update service options
   */
  updateOptions(options: Partial<SuggestionServiceOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Get current service options
   */
  getOptions(): SuggestionServiceOptions {
    return { ...this.options };
  }
}