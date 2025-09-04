/**
 * UI simplifier for senior users
 * Requirement 16.1.5: Create role-based UI filtering for senior vs architect users
 */

import { User } from '../../types/data-models';

/**
 * UI element visibility rules
 */
export interface UIVisibilityRule {
  /** Element selector or identifier */
  element: string;
  
  /** Visibility for different user roles */
  visibility: {
    senior: boolean;
    architect: boolean;
  };
  
  /** Reason for hiding (for documentation) */
  reason?: string;
  
  /** Alternative element to show for senior users */
  alternative?: string;
}

/**
 * UI simplification configuration
 */
export interface UISimplificationConfig {
  /** Hide technical details */
  hide_technical_details: boolean;
  
  /** Use larger fonts and buttons */
  use_large_elements: boolean;
  
  /** Reduce visual clutter */
  reduce_clutter: boolean;
  
  /** Show helpful hints */
  show_hints: boolean;
  
  /** Use high contrast colors */
  high_contrast: boolean;
  
  /** Simplified navigation */
  simplified_navigation: boolean;
}

/**
 * Default UI visibility rules
 */
const DEFAULT_VISIBILITY_RULES: UIVisibilityRule[] = [
  // Technical controls
  {
    element: '.debug-panel',
    visibility: { senior: false, architect: true },
    reason: 'Debug information is too technical for senior users'
  },
  {
    element: '.advanced-settings',
    visibility: { senior: false, architect: true },
    reason: 'Advanced settings can be overwhelming',
    alternative: '.basic-settings'
  },
  {
    element: '.api-configuration',
    visibility: { senior: false, architect: true },
    reason: 'API configuration is technical'
  },
  {
    element: '.system-logs',
    visibility: { senior: false, architect: true },
    reason: 'System logs contain technical jargon'
  },
  {
    element: '.performance-metrics',
    visibility: { senior: false, architect: true },
    reason: 'Performance metrics are technical'
  },
  
  // Navigation elements
  {
    element: '.developer-tools',
    visibility: { senior: false, architect: true },
    reason: 'Developer tools are not needed by senior users'
  },
  {
    element: '.admin-panel',
    visibility: { senior: false, architect: true },
    reason: 'Administrative functions are technical'
  },
  {
    element: '.raw-data-view',
    visibility: { senior: false, architect: true },
    reason: 'Raw data is not user-friendly',
    alternative: '.formatted-data-view'
  },
  
  // Cognitive agent specific elements
  {
    element: '.agent-hierarchy-visualizer',
    visibility: { senior: false, architect: true },
    reason: 'Agent hierarchy is a technical concept'
  },
  {
    element: '.roundabout-loop-monitor',
    visibility: { senior: false, architect: true },
    reason: 'Cognitive loop details are technical'
  },
  {
    element: '.memory-rag-controls',
    visibility: { senior: false, architect: true },
    reason: 'RAG system controls are technical',
    alternative: '.memory-simple-controls'
  },
  {
    element: '.consent-verification-details',
    visibility: { senior: false, architect: true },
    reason: 'Consent verification internals are technical',
    alternative: '.consent-simple-status'
  },
  
  // Error and status displays
  {
    element: '.stack-trace',
    visibility: { senior: false, architect: true },
    reason: 'Stack traces are technical',
    alternative: '.friendly-error-message'
  },
  {
    element: '.technical-error-details',
    visibility: { senior: false, architect: true },
    reason: 'Technical error details are confusing',
    alternative: '.simple-error-explanation'
  },
  
  // Always visible for senior users (helpful elements)
  {
    element: '.help-button',
    visibility: { senior: true, architect: true },
    reason: 'Help is always useful'
  },
  {
    element: '.simple-navigation',
    visibility: { senior: true, architect: false },
    reason: 'Simplified navigation for senior users',
    alternative: '.full-navigation'
  },
  {
    element: '.large-text-mode',
    visibility: { senior: true, architect: false },
    reason: 'Large text option for better readability'
  }
];

/**
 * UI element transformation
 */
export interface UITransformation {
  /** Original element */
  original: string;
  
  /** Transformed element for senior users */
  transformed: string;
  
  /** Transformation type */
  type: 'simplify' | 'enlarge' | 'clarify' | 'hide' | 'replace';
  
  /** Description of the transformation */
  description: string;
}

/**
 * UI simplifier service
 */
export class UISimplifier {
  private visibilityRules: Map<string, UIVisibilityRule> = new Map();
  private transformations: Map<string, UITransformation> = new Map();
  private config: UISimplificationConfig;
  
  constructor(
    customRules: UIVisibilityRule[] = [],
    config: Partial<UISimplificationConfig> = {}
  ) {
    // Load default visibility rules
    DEFAULT_VISIBILITY_RULES.forEach(rule => {
      this.visibilityRules.set(rule.element, rule);
    });
    
    // Add custom rules
    customRules.forEach(rule => {
      this.visibilityRules.set(rule.element, rule);
    });
    
    // Set configuration
    this.config = {
      hide_technical_details: true,
      use_large_elements: true,
      reduce_clutter: true,
      show_hints: true,
      high_contrast: false,
      simplified_navigation: true,
      ...config
    };
  }
  
  /**
   * Gets CSS classes to apply based on user role
   */
  getCSSClasses(user: User): string[] {
    const classes: string[] = [];
    
    if (user.user_role === 'senior') {
      classes.push('senior-user-mode');
      
      if (this.config.use_large_elements) {
        classes.push('large-elements');
      }
      
      if (this.config.reduce_clutter) {
        classes.push('reduced-clutter');
      }
      
      if (this.config.show_hints) {
        classes.push('show-hints');
      }
      
      if (this.config.high_contrast) {
        classes.push('high-contrast');
      }
      
      if (this.config.simplified_navigation) {
        classes.push('simplified-nav');
      }
    } else {
      classes.push('architect-user-mode');
      classes.push('full-features');
    }
    
    return classes;
  }
  
  /**
   * Gets visibility rules for elements based on user role
   */
  getElementVisibility(user: User): Record<string, boolean> {
    const visibility: Record<string, boolean> = {};
    
    Array.from(this.visibilityRules.entries()).forEach(([element, rule]) => {
      visibility[element] = rule.visibility[user.user_role];
    });
    
    return visibility;
  }
  
  /**
   * Gets elements that should be hidden for a user role
   */
  getHiddenElements(userRole: 'senior' | 'architect'): string[] {
    const hidden: string[] = [];
    
    Array.from(this.visibilityRules.entries()).forEach(([element, rule]) => {
      if (!rule.visibility[userRole]) {
        hidden.push(element);
      }
    });
    
    return hidden;
  }
  
  /**
   * Gets alternative elements to show instead of hidden ones
   */
  getAlternativeElements(userRole: 'senior' | 'architect'): Record<string, string> {
    const alternatives: Record<string, string> = {};
    
    Array.from(this.visibilityRules.entries()).forEach(([element, rule]) => {
      if (!rule.visibility[userRole] && rule.alternative) {
        alternatives[element] = rule.alternative;
      }
    });
    
    return alternatives;
  }
  
  /**
   * Simplifies text content for senior users
   */
  simplifyText(text: string, userRole: 'senior' | 'architect'): string {
    if (userRole === 'architect') {
      return text;
    }
    
    // Apply text simplifications for senior users
    let simplified = text;
    
    // Remove technical parenthetical information
    simplified = simplified.replace(/\s*\([^)]*technical[^)]*\)/gi, '');
    simplified = simplified.replace(/\s*\([^)]*API[^)]*\)/gi, '');
    simplified = simplified.replace(/\s*\([^)]*debug[^)]*\)/gi, '');
    
    // Simplify common technical phrases
    simplified = simplified.replace(/\b(initialize|initializing)\b/gi, 'förbereder');
    simplified = simplified.replace(/\b(configure|configuration)\b/gi, 'inställning');
    simplified = simplified.replace(/\b(authenticate|authentication)\b/gi, 'logga in');
    simplified = simplified.replace(/\b(synchronize|synchronizing)\b/gi, 'uppdaterar');
    
    return simplified;
  }
  
  /**
   * Gets simplified button text
   */
  getSimplifiedButtonText(originalText: string, userRole: 'senior' | 'architect'): string {
    if (userRole === 'architect') {
      return originalText;
    }
    
    const buttonTranslations: Record<string, string> = {
      'Configure': 'Ändra inställningar',
      'Deploy': 'Publicera',
      'Debug': 'Felsök',
      'Authenticate': 'Logga in',
      'Authorize': 'Ge tillåtelse',
      'Initialize': 'Starta',
      'Synchronize': 'Uppdatera',
      'Optimize': 'Förbättra',
      'Validate': 'Kontrollera',
      'Execute': 'Kör',
      'Terminate': 'Stoppa',
      'Refresh': 'Uppdatera',
      'Reset': 'Återställ',
      'Submit': 'Skicka',
      'Cancel': 'Avbryt',
      'OK': 'OK',
      'Apply': 'Använd',
      'Save': 'Spara',
      'Delete': 'Ta bort',
      'Edit': 'Redigera',
      'View': 'Visa',
      'Download': 'Ladda ner',
      'Upload': 'Ladda upp'
    };
    
    return buttonTranslations[originalText] || originalText;
  }
  
  /**
   * Gets simplified menu structure
   */
  getSimplifiedMenu(userRole: 'senior' | 'architect'): any {
    if (userRole === 'architect') {
      return {
        main: ['Översikt', 'Projekt', 'Kontakter', 'Inställningar', 'Utvecklarverktyg', 'System'],
        developer: ['API', 'Databas', 'Loggar', 'Prestanda', 'Säkerhet']
      };
    }
    
    return {
      main: ['Hem', 'Mina sidor', 'Kontakter', 'Hjälp'],
      simple: true
    };
  }
  
  /**
   * Adds a visibility rule
   */
  addVisibilityRule(rule: UIVisibilityRule): void {
    this.visibilityRules.set(rule.element, rule);
  }
  
  /**
   * Removes a visibility rule
   */
  removeVisibilityRule(element: string): boolean {
    return this.visibilityRules.delete(element);
  }
  
  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<UISimplificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Gets current configuration
   */
  getConfig(): UISimplificationConfig {
    return { ...this.config };
  }
  
  /**
   * Generates CSS for senior user mode
   */
  generateSeniorModeCSS(): string {
    return `
      .senior-user-mode {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .senior-user-mode.large-elements {
        font-size: 1.2em;
        line-height: 1.6;
      }
      
      .senior-user-mode.large-elements button {
        padding: 12px 24px;
        font-size: 1.1em;
        min-height: 44px;
      }
      
      .senior-user-mode.large-elements input {
        padding: 12px;
        font-size: 1.1em;
        min-height: 44px;
      }
      
      .senior-user-mode.reduced-clutter .secondary-actions {
        display: none;
      }
      
      .senior-user-mode.reduced-clutter .advanced-options {
        display: none;
      }
      
      .senior-user-mode.show-hints .tooltip {
        display: block;
        background: #f0f8ff;
        border: 1px solid #ccc;
        padding: 8px;
        border-radius: 4px;
        margin-top: 4px;
        font-size: 0.9em;
        color: #666;
      }
      
      .senior-user-mode.high-contrast {
        background: #ffffff;
        color: #000000;
      }
      
      .senior-user-mode.high-contrast button {
        background: #0066cc;
        color: #ffffff;
        border: 2px solid #004499;
      }
      
      .senior-user-mode.simplified-nav .nav-item.advanced {
        display: none;
      }
      
      .senior-user-mode .technical-term {
        display: none;
      }
      
      .senior-user-mode .friendly-term {
        display: inline;
      }
      
      .architect-user-mode .technical-term {
        display: inline;
      }
      
      .architect-user-mode .friendly-term {
        display: none;
      }
    `;
  }
  
  /**
   * Gets all visibility rules
   */
  getAllVisibilityRules(): UIVisibilityRule[] {
    return Array.from(this.visibilityRules.values());
  }
}

/**
 * Global UI simplifier instance
 */
export const uiSimplifier = new UISimplifier();