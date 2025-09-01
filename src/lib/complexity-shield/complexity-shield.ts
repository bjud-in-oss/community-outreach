/**
 * Main Complexity Shield service
 * Coordinates all complexity reduction features for senior users
 * Requirements: 1.1, 16.1.5, 2.4.1
 */

import { User } from '../../types/data-models';
import { JargonTranslator, TranslationContext } from './jargon-translator';
import { MetaphorGenerator, MetaphorContext } from './metaphor-generator';
import { UISimplifier, UISimplificationConfig } from './ui-simplifier';
import { InteractionPatternManager } from './interaction-patterns';

/**
 * Complexity Shield configuration
 */
export interface ComplexityShieldConfig {
  /** Enable jargon translation */
  enable_jargon_translation: boolean;
  
  /** Enable metaphor generation */
  enable_metaphors: boolean;
  
  /** Enable UI simplification */
  enable_ui_simplification: boolean;
  
  /** Enable simplified interaction patterns */
  enable_interaction_patterns: boolean;
  
  /** User's technical comfort level (1-10) */
  technical_comfort_level: number;
  
  /** Preferred metaphor categories */
  preferred_metaphor_categories: string[];
  
  /** UI simplification settings */
  ui_config: Partial<UISimplificationConfig>;
  
  /** Language preference */
  language: string;
}

/**
 * Shield activation result
 */
export interface ShieldActivationResult {
  /** Whether shield was activated */
  activated: boolean;
  
  /** Applied transformations */
  transformations: {
    text_translations: number;
    ui_simplifications: number;
    metaphors_generated: number;
    patterns_activated: number;
  };
  
  /** CSS classes to apply */
  css_classes: string[];
  
  /** Hidden elements */
  hidden_elements: string[];
  
  /** Alternative elements */
  alternative_elements: Record<string, string>;
  
  /** Generated metaphors */
  metaphors: Array<{
    concept: string;
    metaphor: string;
    explanation: string;
  }>;
}

/**
 * Content transformation request
 */
export interface ContentTransformationRequest {
  /** Original content */
  content: string;
  
  /** Content type */
  type: 'text' | 'button' | 'menu' | 'error' | 'help';
  
  /** Context information */
  context: string;
  
  /** Technical concepts to explain */
  concepts?: string[];
}

/**
 * Main Complexity Shield service
 */
export class ComplexityShieldService {
  private jargonTranslator: JargonTranslator;
  private metaphorGenerator: MetaphorGenerator;
  private uiSimplifier: UISimplifier;
  private interactionPatterns: InteractionPatternManager;
  private config: ComplexityShieldConfig;
  
  constructor(
    jargonTranslator: JargonTranslator,
    metaphorGenerator: MetaphorGenerator,
    uiSimplifier: UISimplifier,
    interactionPatterns: InteractionPatternManager,
    config: Partial<ComplexityShieldConfig> = {}
  ) {
    this.jargonTranslator = jargonTranslator;
    this.metaphorGenerator = metaphorGenerator;
    this.uiSimplifier = uiSimplifier;
    this.interactionPatterns = interactionPatterns;
    
    this.config = {
      enable_jargon_translation: true,
      enable_metaphors: true,
      enable_ui_simplification: true,
      enable_interaction_patterns: true,
      technical_comfort_level: 3,
      preferred_metaphor_categories: ['household', 'cooking', 'nature'],
      ui_config: {},
      language: 'sv',
      ...config
    };
  }
  
  /**
   * Activates the complexity shield for a user
   */
  activateShield(user: User, context: string = 'general'): ShieldActivationResult {
    const result: ShieldActivationResult = {
      activated: false,
      transformations: {
        text_translations: 0,
        ui_simplifications: 0,
        metaphors_generated: 0,
        patterns_activated: 0
      },
      css_classes: [],
      hidden_elements: [],
      alternative_elements: {},
      metaphors: []
    };
    
    // Only activate for senior users
    if (user.user_role !== 'senior') {
      return result;
    }
    
    result.activated = true;
    
    // Apply UI simplifications
    if (this.config.enable_ui_simplification) {
      result.css_classes = this.uiSimplifier.getCSSClasses(user);
      result.hidden_elements = this.uiSimplifier.getHiddenElements(user.user_role);
      result.alternative_elements = this.uiSimplifier.getAlternativeElements(user.user_role);
      result.transformations.ui_simplifications = result.hidden_elements.length;
    }
    
    // Activate appropriate interaction patterns
    if (this.config.enable_interaction_patterns) {
      const patterns = this.interactionPatterns.getPatternsForRole(user.user_role);
      result.transformations.patterns_activated = patterns.length;
    }
    
    return result;
  }
  
  /**
   * Transforms content for senior users
   */
  transformContent(
    request: ContentTransformationRequest,
    user: User
  ): string {
    let transformedContent = request.content;
    
    // Skip transformation for architect users
    if (user.user_role === 'architect') {
      return transformedContent;
    }
    
    // Apply jargon translation
    if (this.config.enable_jargon_translation) {
      const translationContext: TranslationContext = {
        user_role: user.user_role,
        app_context: request.context,
        technical_comfort: this.config.technical_comfort_level,
        language: this.config.language
      };
      
      transformedContent = this.jargonTranslator.translateText(
        transformedContent,
        translationContext
      );
    }
    
    // Apply UI-specific transformations
    switch (request.type) {
      case 'button':
        transformedContent = this.uiSimplifier.getSimplifiedButtonText(
          transformedContent,
          user.user_role
        );
        break;
      
      case 'text':
      case 'error':
      case 'help':
        transformedContent = this.uiSimplifier.simplifyText(
          transformedContent,
          user.user_role
        );
        break;
    }
    
    return transformedContent;
  }
  
  /**
   * Generates metaphors for technical concepts
   */
  generateMetaphorsForConcepts(
    concepts: string[],
    user: User,
    context: string = 'general'
  ): Array<{ concept: string; metaphor: string; explanation: string }> {
    if (user.user_role === 'architect' || !this.config.enable_metaphors) {
      return [];
    }
    
    const metaphorContext: MetaphorContext = {
      preferred_categories: this.config.preferred_metaphor_categories as any[],
      technical_comfort: this.config.technical_comfort_level,
      situation: context,
      age_group: 'senior',
      cultural_context: this.config.language === 'sv' ? 'swedish' : 'international'
    };
    
    const metaphors: Array<{ concept: string; metaphor: string; explanation: string }> = [];
    
    for (const concept of concepts) {
      const metaphor = this.metaphorGenerator.generateMetaphor(concept, metaphorContext);
      
      if (metaphor) {
        metaphors.push({
          concept,
          metaphor: metaphor.metaphor,
          explanation: metaphor.explanation
        });
      }
    }
    
    return metaphors;
  }
  
  /**
   * Explains a technical process using metaphors
   */
  explainProcess(
    processName: string,
    steps: string[],
    user: User,
    context: string = 'general'
  ): string {
    if (user.user_role === 'architect' || !this.config.enable_metaphors) {
      return steps.join('\n');
    }
    
    const metaphorContext: MetaphorContext = {
      preferred_categories: this.config.preferred_metaphor_categories as any[],
      technical_comfort: this.config.technical_comfort_level,
      situation: context,
      age_group: 'senior',
      cultural_context: this.config.language === 'sv' ? 'swedish' : 'international'
    };
    
    return this.metaphorGenerator.explainProcess(steps, metaphorContext, processName);
  }
  
  /**
   * Starts an interaction pattern
   */
  startInteractionPattern(
    patternName: string,
    user: User
  ): boolean {
    if (!this.config.enable_interaction_patterns) {
      return false;
    }
    
    return this.interactionPatterns.startPattern(patternName, user.user_role);
  }
  
  /**
   * Gets the current interaction step
   */
  getCurrentInteractionStep() {
    return this.interactionPatterns.getCurrentStep();
  }
  
  /**
   * Advances to the next interaction step
   */
  nextInteractionStep() {
    return this.interactionPatterns.nextStep();
  }
  
  /**
   * Gets help text for technical terms
   */
  getHelpForTerm(term: string, user: User, context: string = 'general'): string | null {
    if (user.user_role === 'architect') {
      return null;
    }
    
    const translationContext: TranslationContext = {
      user_role: user.user_role,
      app_context: context,
      technical_comfort: this.config.technical_comfort_level,
      language: this.config.language
    };
    
    // First try to get explanation from jargon translator
    const explanation = this.jargonTranslator.getExplanation(term, translationContext);
    
    if (explanation) {
      return explanation;
    }
    
    // If no explanation found, try to generate a metaphor
    const metaphorContext: MetaphorContext = {
      preferred_categories: this.config.preferred_metaphor_categories as any[],
      technical_comfort: this.config.technical_comfort_level,
      situation: context,
      age_group: 'senior',
      cultural_context: this.config.language === 'sv' ? 'swedish' : 'international'
    };
    
    const metaphor = this.metaphorGenerator.generateMetaphor(term, metaphorContext);
    
    if (metaphor) {
      return `${metaphor.metaphor} - ${metaphor.explanation}`;
    }
    
    return null;
  }
  
  /**
   * Checks if the shield should be active for a user
   */
  shouldActivateShield(user: User): boolean {
    return user.user_role === 'senior';
  }
  
  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<ComplexityShieldConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update UI simplifier config if provided
    if (newConfig.ui_config) {
      this.uiSimplifier.updateConfig(newConfig.ui_config);
    }
  }
  
  /**
   * Gets the current configuration
   */
  getConfig(): ComplexityShieldConfig {
    return { ...this.config };
  }
  
  /**
   * Generates CSS for the complexity shield
   */
  generateCSS(): string {
    return this.uiSimplifier.generateSeniorModeCSS();
  }
  
  /**
   * Gets statistics about shield usage
   */
  getShieldStatistics(): {
    total_translations: number;
    total_metaphors: number;
    total_ui_simplifications: number;
    active_patterns: number;
  } {
    return {
      total_translations: this.jargonTranslator.getAllTranslations().length,
      total_metaphors: this.metaphorGenerator.getMetaphorsByCategory('household').length +
                      this.metaphorGenerator.getMetaphorsByCategory('cooking').length +
                      this.metaphorGenerator.getMetaphorsByCategory('nature').length,
      total_ui_simplifications: this.uiSimplifier.getAllVisibilityRules().length,
      active_patterns: this.interactionPatterns.getAllPatterns().length
    };
  }
  
  /**
   * Validates technical content for senior user appropriateness
   */
  validateContentForSeniors(content: string): {
    appropriate: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for technical jargon
    const words = content.toLowerCase().split(/\s+/);
    const technicalTerms = words.filter(word => 
      this.jargonTranslator.isTechnicalJargon(word)
    );
    
    if (technicalTerms.length > 0) {
      issues.push(`Innehåller tekniska termer: ${technicalTerms.join(', ')}`);
      suggestions.push('Använd enklare språk eller förklara tekniska termer');
    }
    
    // Check sentence length
    const sentences = content.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 20);
    
    if (longSentences.length > 0) {
      issues.push('Innehåller för långa meningar');
      suggestions.push('Dela upp långa meningar i kortare delar');
    }
    
    // Check for passive voice (simplified check for Swedish)
    const passiveIndicators = ['blev', 'blir', 'blivit', 'gjordes', 'görs', 'gjorts'];
    const hasPassiveVoice = passiveIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    
    if (hasPassiveVoice) {
      issues.push('Använder passiv form');
      suggestions.push('Använd aktiv form för tydligare språk');
    }
    
    return {
      appropriate: issues.length === 0,
      issues,
      suggestions
    };
  }
}

/**
 * Creates a default complexity shield instance
 */
export function createComplexityShield(
  config: Partial<ComplexityShieldConfig> = {}
): ComplexityShieldService {
  const jargonTranslator = new JargonTranslator();
  const metaphorGenerator = new MetaphorGenerator();
  const uiSimplifier = new UISimplifier();
  const interactionPatterns = new InteractionPatternManager();
  
  return new ComplexityShieldService(
    jargonTranslator,
    metaphorGenerator,
    uiSimplifier,
    interactionPatterns,
    config
  );
}

/**
 * Global complexity shield instance
 */
export const complexityShield = createComplexityShield();