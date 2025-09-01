/**
 * Simplified interaction patterns for senior users
 * Requirement 2.4.1: Code simplified interaction patterns for senior user role
 */

/**
 * Interaction pattern definition
 */
export interface InteractionPattern {
  /** Pattern name */
  name: string;
  
  /** Pattern description */
  description: string;
  
  /** Target user role */
  target_role: 'senior' | 'architect' | 'both';
  
  /** Pattern type */
  type: 'navigation' | 'input' | 'feedback' | 'confirmation' | 'help';
  
  /** Implementation details */
  implementation: {
    /** Steps in the interaction */
    steps: InteractionStep[];
    
    /** Timing considerations */
    timing?: TimingConfig;
    
    /** Visual elements */
    visual?: VisualConfig;
    
    /** Audio cues */
    audio?: AudioConfig;
  };
}

/**
 * Individual interaction step
 */
export interface InteractionStep {
  /** Step identifier */
  id: string;
  
  /** Step description */
  description: string;
  
  /** User action required */
  user_action: 'click' | 'type' | 'wait' | 'read' | 'confirm';
  
  /** System response */
  system_response: string;
  
  /** Help text for this step */
  help_text?: string;
  
  /** Visual cues */
  visual_cues?: string[];
  
  /** Error handling */
  error_handling?: string;
}

/**
 * Timing configuration for interactions
 */
export interface TimingConfig {
  /** Delay before showing help (ms) */
  help_delay: number;
  
  /** Timeout for user action (ms) */
  action_timeout: number;
  
  /** Delay between steps (ms) */
  step_delay: number;
  
  /** Animation duration (ms) */
  animation_duration: number;
}

/**
 * Visual configuration for interactions
 */
export interface VisualConfig {
  /** Highlight color */
  highlight_color: string;
  
  /** Use animations */
  use_animations: boolean;
  
  /** Large buttons */
  large_buttons: boolean;
  
  /** High contrast */
  high_contrast: boolean;
  
  /** Show progress indicators */
  show_progress: boolean;
}

/**
 * Audio configuration for interactions
 */
export interface AudioConfig {
  /** Use sound effects */
  use_sound_effects: boolean;
  
  /** Use voice guidance */
  use_voice_guidance: boolean;
  
  /** Voice language */
  voice_language: string;
  
  /** Sound volume (0-1) */
  volume: number;
}

/**
 * Default interaction patterns for senior users
 */
const SENIOR_INTERACTION_PATTERNS: InteractionPattern[] = [
  {
    name: 'simple_login',
    description: 'Simplified login process with clear guidance',
    target_role: 'senior',
    type: 'input',
    implementation: {
      steps: [
        {
          id: 'welcome',
          description: 'Show welcome message',
          user_action: 'read',
          system_response: 'Välkommen! Låt oss logga in dig.',
          help_text: 'Du behöver bara fylla i ditt användarnamn och lösenord.'
        },
        {
          id: 'username_input',
          description: 'Enter username with guidance',
          user_action: 'type',
          system_response: 'Bra! Nu behöver vi ditt lösenord.',
          help_text: 'Skriv ditt användarnamn i rutan. Det är samma namn du använder för att logga in.',
          visual_cues: ['highlight_input_field', 'show_example'],
          error_handling: 'Om du glömt ditt användarnamn, klicka på "Glömt användarnamn?"'
        },
        {
          id: 'password_input',
          description: 'Enter password with security explanation',
          user_action: 'type',
          system_response: 'Perfekt! Klicka på "Logga in" för att fortsätta.',
          help_text: 'Skriv ditt lösenord. Det visas som prickar för säkerhets skull.',
          visual_cues: ['highlight_password_field', 'show_security_icon'],
          error_handling: 'Om lösenordet är fel, får du försöka igen. Klicka på "Glömt lösenord?" om du behöver hjälp.'
        },
        {
          id: 'login_button',
          description: 'Click login with confirmation',
          user_action: 'click',
          system_response: 'Loggar in... Detta kan ta några sekunder.',
          help_text: 'Klicka på den stora blå knappen för att logga in.',
          visual_cues: ['highlight_login_button', 'show_loading_indicator']
        }
      ],
      timing: {
        help_delay: 3000,
        action_timeout: 60000,
        step_delay: 1000,
        animation_duration: 500
      },
      visual: {
        highlight_color: '#0066cc',
        use_animations: true,
        large_buttons: true,
        high_contrast: false,
        show_progress: true
      }
    }
  },
  
  {
    name: 'guided_navigation',
    description: 'Step-by-step navigation with breadcrumbs',
    target_role: 'senior',
    type: 'navigation',
    implementation: {
      steps: [
        {
          id: 'show_current_location',
          description: 'Show where user currently is',
          user_action: 'read',
          system_response: 'Du är nu på: [aktuell sida]',
          help_text: 'Överst på sidan ser du var du befinner dig.'
        },
        {
          id: 'show_navigation_options',
          description: 'Present clear navigation choices',
          user_action: 'read',
          system_response: 'Här är dina alternativ:',
          help_text: 'Välj vart du vill gå härnäst från listan nedan.',
          visual_cues: ['highlight_nav_options', 'show_icons']
        },
        {
          id: 'make_selection',
          description: 'User selects destination',
          user_action: 'click',
          system_response: 'Tar dig till [vald destination]...',
          help_text: 'Klicka på det alternativ du vill välja.',
          visual_cues: ['highlight_selected_option']
        }
      ],
      timing: {
        help_delay: 2000,
        action_timeout: 30000,
        step_delay: 500,
        animation_duration: 300
      },
      visual: {
        highlight_color: '#28a745',
        use_animations: true,
        large_buttons: true,
        high_contrast: false,
        show_progress: false
      }
    }
  },
  
  {
    name: 'confirmation_dialog',
    description: 'Clear confirmation with explanation of consequences',
    target_role: 'senior',
    type: 'confirmation',
    implementation: {
      steps: [
        {
          id: 'explain_action',
          description: 'Clearly explain what will happen',
          user_action: 'read',
          system_response: 'Du är på väg att: [åtgärd]',
          help_text: 'Läs noga vad som kommer att hända.'
        },
        {
          id: 'explain_consequences',
          description: 'Explain the consequences',
          user_action: 'read',
          system_response: 'Detta betyder att: [konsekvenser]',
          help_text: 'Här förklaras vad som händer efter att du klickat.'
        },
        {
          id: 'offer_choices',
          description: 'Present clear yes/no options',
          user_action: 'click',
          system_response: 'Vad vill du göra?',
          help_text: 'Välj "Ja, fortsätt" om du är säker, eller "Nej, avbryt" om du ändrat dig.',
          visual_cues: ['highlight_yes_button', 'highlight_no_button'],
          error_handling: 'Du kan alltid ändra dig och klicka "Avbryt".'
        }
      ],
      timing: {
        help_delay: 1000,
        action_timeout: 45000,
        step_delay: 800,
        animation_duration: 400
      },
      visual: {
        highlight_color: '#dc3545',
        use_animations: false,
        large_buttons: true,
        high_contrast: true,
        show_progress: false
      }
    }
  },
  
  {
    name: 'error_recovery',
    description: 'Gentle error handling with clear next steps',
    target_role: 'senior',
    type: 'feedback',
    implementation: {
      steps: [
        {
          id: 'acknowledge_error',
          description: 'Acknowledge that something went wrong',
          user_action: 'read',
          system_response: 'Hoppsan! Något gick inte som planerat.',
          help_text: 'Ingen fara - detta händer ibland och är lätt att fixa.'
        },
        {
          id: 'explain_simply',
          description: 'Explain what happened in simple terms',
          user_action: 'read',
          system_response: 'Vad som hände: [enkel förklaring]',
          help_text: 'Här förklaras vad som gick fel på ett enkelt sätt.'
        },
        {
          id: 'suggest_solution',
          description: 'Offer clear solution steps',
          user_action: 'read',
          system_response: 'Så här fixar vi det: [lösningssteg]',
          help_text: 'Följ dessa steg så löser vi problemet tillsammans.'
        },
        {
          id: 'offer_help',
          description: 'Offer additional help if needed',
          user_action: 'click',
          system_response: 'Behöver du mer hjälp?',
          help_text: 'Om du fortfarande har problem, klicka på "Få hjälp" så hjälper vi dig.',
          visual_cues: ['highlight_help_button']
        }
      ],
      timing: {
        help_delay: 2000,
        action_timeout: 60000,
        step_delay: 1500,
        animation_duration: 600
      },
      visual: {
        highlight_color: '#ffc107',
        use_animations: true,
        large_buttons: true,
        high_contrast: false,
        show_progress: false
      }
    }
  },
  
  {
    name: 'contextual_help',
    description: 'Progressive help system that adapts to user needs',
    target_role: 'senior',
    type: 'help',
    implementation: {
      steps: [
        {
          id: 'detect_confusion',
          description: 'Detect when user might need help',
          user_action: 'wait',
          system_response: 'Ser du efter något specifikt?',
          help_text: 'Om du har varit på samma sida ett tag, kanske du behöver hjälp.'
        },
        {
          id: 'offer_guidance',
          description: 'Offer specific guidance for current context',
          user_action: 'read',
          system_response: 'Här är vad du kan göra på denna sida:',
          help_text: 'Vi visar dig vad som är möjligt att göra just här.',
          visual_cues: ['highlight_available_actions']
        },
        {
          id: 'provide_examples',
          description: 'Show concrete examples',
          user_action: 'read',
          system_response: 'Till exempel kan du: [konkreta exempel]',
          help_text: 'Här är några konkreta saker du kan prova.'
        },
        {
          id: 'offer_tutorial',
          description: 'Offer step-by-step tutorial',
          user_action: 'click',
          system_response: 'Vill du att jag visar dig steg för steg?',
          help_text: 'Klicka "Ja, visa mig" för en guidad genomgång.',
          visual_cues: ['highlight_tutorial_button']
        }
      ],
      timing: {
        help_delay: 10000,
        action_timeout: 30000,
        step_delay: 2000,
        animation_duration: 800
      },
      visual: {
        highlight_color: '#17a2b8',
        use_animations: true,
        large_buttons: true,
        high_contrast: false,
        show_progress: true
      }
    }
  }
];

/**
 * Interaction pattern manager
 */
export class InteractionPatternManager {
  private patterns: Map<string, InteractionPattern> = new Map();
  private activePattern: InteractionPattern | null = null;
  private currentStep: number = 0;
  
  constructor(customPatterns: InteractionPattern[] = []) {
    // Load default patterns
    SENIOR_INTERACTION_PATTERNS.forEach(pattern => {
      this.patterns.set(pattern.name, pattern);
    });
    
    // Add custom patterns
    customPatterns.forEach(pattern => {
      this.patterns.set(pattern.name, pattern);
    });
  }
  
  /**
   * Starts an interaction pattern
   */
  startPattern(patternName: string, userRole: 'senior' | 'architect'): boolean {
    const pattern = this.patterns.get(patternName);
    
    if (!pattern) {
      return false;
    }
    
    // Check if pattern is appropriate for user role
    if (pattern.target_role !== 'both' && pattern.target_role !== userRole) {
      return false;
    }
    
    this.activePattern = pattern;
    this.currentStep = 0;
    
    return true;
  }
  
  /**
   * Gets the current step in the active pattern
   */
  getCurrentStep(): InteractionStep | null {
    if (!this.activePattern || this.currentStep >= this.activePattern.implementation.steps.length) {
      return null;
    }
    
    return this.activePattern.implementation.steps[this.currentStep];
  }
  
  /**
   * Advances to the next step
   */
  nextStep(): InteractionStep | null {
    if (!this.activePattern) {
      return null;
    }
    
    this.currentStep++;
    return this.getCurrentStep();
  }
  
  /**
   * Goes back to the previous step
   */
  previousStep(): InteractionStep | null {
    if (!this.activePattern || this.currentStep <= 0) {
      return null;
    }
    
    this.currentStep--;
    return this.getCurrentStep();
  }
  
  /**
   * Completes the current pattern
   */
  completePattern(): void {
    this.activePattern = null;
    this.currentStep = 0;
  }
  
  /**
   * Gets patterns suitable for a user role
   */
  getPatternsForRole(userRole: 'senior' | 'architect'): InteractionPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.target_role === 'both' || pattern.target_role === userRole);
  }
  
  /**
   * Gets patterns by type
   */
  getPatternsByType(type: InteractionPattern['type']): InteractionPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.type === type);
  }
  
  /**
   * Adds a new interaction pattern
   */
  addPattern(pattern: InteractionPattern): void {
    this.patterns.set(pattern.name, pattern);
  }
  
  /**
   * Removes an interaction pattern
   */
  removePattern(patternName: string): boolean {
    return this.patterns.delete(patternName);
  }
  
  /**
   * Gets the progress of the current pattern
   */
  getProgress(): { current: number; total: number; percentage: number } | null {
    if (!this.activePattern) {
      return null;
    }
    
    const total = this.activePattern.implementation.steps.length;
    const percentage = Math.round((this.currentStep / total) * 100);
    
    return {
      current: this.currentStep,
      total,
      percentage
    };
  }
  
  /**
   * Checks if a pattern is currently active
   */
  isPatternActive(): boolean {
    return this.activePattern !== null;
  }
  
  /**
   * Gets the name of the active pattern
   */
  getActivePatternName(): string | null {
    return this.activePattern?.name || null;
  }
  
  /**
   * Generates help text for the current step
   */
  getCurrentHelpText(): string | null {
    const step = this.getCurrentStep();
    return step?.help_text || null;
  }
  
  /**
   * Gets visual cues for the current step
   */
  getCurrentVisualCues(): string[] {
    const step = this.getCurrentStep();
    return step?.visual_cues || [];
  }
  
  /**
   * Gets error handling text for the current step
   */
  getCurrentErrorHandling(): string | null {
    const step = this.getCurrentStep();
    return step?.error_handling || null;
  }
  
  /**
   * Gets timing configuration for the active pattern
   */
  getTimingConfig(): TimingConfig | null {
    return this.activePattern?.implementation.timing || null;
  }
  
  /**
   * Gets visual configuration for the active pattern
   */
  getVisualConfig(): VisualConfig | null {
    return this.activePattern?.implementation.visual || null;
  }
  
  /**
   * Gets all available patterns
   */
  getAllPatterns(): InteractionPattern[] {
    return Array.from(this.patterns.values());
  }
}

/**
 * Global interaction pattern manager instance
 */
export const interactionPatterns = new InteractionPatternManager();