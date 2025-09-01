/**
 * Tests for main complexity shield service
 * Requirement 2.4.1: Write usability tests with senior user personas
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ComplexityShieldService,
  createComplexityShield,
  complexityShield
} from '../../lib/complexity-shield/complexity-shield';
import { User } from '../../types/data-models';

describe('ComplexityShieldService', () => {
  let shield: ComplexityShieldService;
  
  beforeEach(() => {
    shield = createComplexityShield();
  });
  
  const createSeniorUser = (): User => ({
    id: 'senior_user_123',
    user_role: 'senior',
    profile: {
      display_name: 'Anna Andersson',
      email: 'anna@example.com',
      language: 'sv',
      timezone: 'Europe/Stockholm',
      preferences: {
        theme: 'light',
        layout: 'auto',
        notifications: {
          email_enabled: true,
          push_enabled: false,
          collaboration_enabled: true,
          memory_discovery_enabled: false
        },
        privacy: {
          allow_memory_discovery: false,
          allow_contact_suggestions: true,
          data_retention_days: 60
        }
      }
    },
    contacts: [],
    consents: [],
    created_at: new Date(),
    updated_at: new Date(),
    status: 'active'
  });
  
  const createArchitectUser = (): User => ({
    id: 'architect_user_123',
    user_role: 'architect',
    profile: {
      display_name: 'Erik Utvecklare',
      email: 'erik@example.com',
      language: 'sv',
      timezone: 'Europe/Stockholm',
      preferences: {
        theme: 'dark',
        layout: 'arbetsläget',
        notifications: {
          email_enabled: true,
          push_enabled: true,
          collaboration_enabled: true,
          memory_discovery_enabled: true
        },
        privacy: {
          allow_memory_discovery: true,
          allow_contact_suggestions: true,
          data_retention_days: 365
        }
      }
    },
    contacts: [],
    consents: [],
    created_at: new Date(),
    updated_at: new Date(),
    status: 'active'
  });
  
  describe('Shield Activation', () => {
    it('should activate shield for senior users', () => {
      const user = createSeniorUser();
      
      const result = shield.activateShield(user, 'general');
      
      expect(result.activated).toBe(true);
      expect(result.css_classes.length).toBeGreaterThan(0);
      expect(result.css_classes).toContain('senior-user-mode');
      expect(result.hidden_elements.length).toBeGreaterThan(0);
      expect(result.transformations.ui_simplifications).toBeGreaterThan(0);
    });
    
    it('should not activate shield for architect users', () => {
      const user = createArchitectUser();
      
      const result = shield.activateShield(user, 'general');
      
      expect(result.activated).toBe(false);
      expect(result.transformations.ui_simplifications).toBe(0);
      expect(result.transformations.text_translations).toBe(0);
    });
    
    it('should provide alternative elements for hidden ones', () => {
      const user = createSeniorUser();
      
      const result = shield.activateShield(user, 'general');
      
      expect(Object.keys(result.alternative_elements).length).toBeGreaterThan(0);
      expect(result.alternative_elements['.advanced-settings']).toBe('.basic-settings');
    });
  });
  
  describe('Content Transformation', () => {
    it('should transform technical content for senior users', () => {
      const user = createSeniorUser();
      const request = {
        content: 'Please authenticate to access the database server',
        type: 'text' as const,
        context: 'login'
      };
      
      const transformed = shield.transformContent(request, user);
      
      expect(transformed).toContain('logga in');
      expect(transformed).toContain('minnesbank');
      expect(transformed).toContain('dator');
      expect(transformed).not.toContain('authenticate');
      expect(transformed).not.toContain('database');
    });
    
    it('should not transform content for architect users', () => {
      const user = createArchitectUser();
      const request = {
        content: 'Please authenticate to access the database server',
        type: 'text' as const,
        context: 'login'
      };
      
      const transformed = shield.transformContent(request, user);
      
      expect(transformed).toBe(request.content);
    });
    
    it('should transform button text appropriately', () => {
      const user = createSeniorUser();
      const request = {
        content: 'Configure',
        type: 'button' as const,
        context: 'settings'
      };
      
      const transformed = shield.transformContent(request, user);
      
      expect(transformed).toBe('Ändra inställningar');
    });
    
    it('should simplify error messages', () => {
      const user = createSeniorUser();
      const request = {
        content: 'Authentication failed (API error 401) - please try again',
        type: 'error' as const,
        context: 'login'
      };
      
      const transformed = shield.transformContent(request, user);
      
      expect(transformed).not.toContain('(API error 401)');
      expect(transformed).toContain('logga in');
    });
  });
  
  describe('Metaphor Generation', () => {
    it('should generate metaphors for technical concepts', () => {
      const user = createSeniorUser();
      const concepts = ['database', 'backup', 'encryption'];
      
      const metaphors = shield.generateMetaphorsForConcepts(concepts, user, 'general');
      
      expect(metaphors.length).toBeGreaterThan(0);
      expect(metaphors.some(m => m.concept === 'database')).toBe(true);
      expect(metaphors.some(m => m.metaphor.includes('arkivskåp'))).toBe(true);
    });
    
    it('should not generate metaphors for architect users', () => {
      const user = createArchitectUser();
      const concepts = ['database', 'backup', 'encryption'];
      
      const metaphors = shield.generateMetaphorsForConcepts(concepts, user, 'general');
      
      expect(metaphors.length).toBe(0);
    });
    
    it('should explain processes using metaphors', () => {
      const user = createSeniorUser();
      const steps = ['Prepare data', 'Validate input', 'Save to database', 'Send confirmation'];
      
      const explanation = shield.explainProcess('saving', steps, user, 'general');
      
      expect(explanation).toContain('som att');
      expect(explanation.length).toBeGreaterThan(steps.join('\n').length);
    });
  });
  
  describe('Interaction Patterns', () => {
    it('should start interaction patterns for senior users', () => {
      const user = createSeniorUser();
      
      const started = shield.startInteractionPattern('simple_login', user);
      
      expect(started).toBe(true);
    });
    
    it('should get current interaction step', () => {
      const user = createSeniorUser();
      shield.startInteractionPattern('simple_login', user);
      
      const step = shield.getCurrentInteractionStep();
      
      expect(step).toBeDefined();
      expect(step?.id).toBe('welcome');
      expect(step?.description).toContain('welcome');
    });
    
    it('should advance through interaction steps', () => {
      const user = createSeniorUser();
      shield.startInteractionPattern('simple_login', user);
      
      const firstStep = shield.getCurrentInteractionStep();
      const secondStep = shield.nextInteractionStep();
      
      expect(firstStep?.id).toBe('welcome');
      expect(secondStep?.id).toBe('username_input');
    });
  });
  
  describe('Help System', () => {
    it('should provide help for technical terms', () => {
      const user = createSeniorUser();
      
      const help = shield.getHelpForTerm('database', user, 'general');
      
      expect(help).toBeDefined();
      // Should contain either the friendly term or explanation
      expect(help).toMatch(/minnesbank|information/);
    });
    
    it('should not provide help for architect users', () => {
      const user = createArchitectUser();
      
      const help = shield.getHelpForTerm('database', user, 'general');
      
      expect(help).toBeNull();
    });
    
    it('should provide metaphor-based help for unknown terms', () => {
      const user = createSeniorUser();
      
      const help = shield.getHelpForTerm('cloud storage', user, 'general');
      
      expect(help).toBeDefined();
      expect(help).toContain('förråd');
    });
  });
  
  describe('Shield Detection', () => {
    it('should detect when shield should be active', () => {
      const seniorUser = createSeniorUser();
      const architectUser = createArchitectUser();
      
      expect(shield.shouldActivateShield(seniorUser)).toBe(true);
      expect(shield.shouldActivateShield(architectUser)).toBe(false);
    });
  });
  
  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        technical_comfort_level: 5,
        preferred_metaphor_categories: ['cooking', 'gardening']
      };
      
      shield.updateConfig(newConfig);
      
      const config = shield.getConfig();
      expect(config.technical_comfort_level).toBe(5);
      expect(config.preferred_metaphor_categories).toEqual(['cooking', 'gardening']);
    });
    
    it('should get current configuration', () => {
      const config = shield.getConfig();
      
      expect(config.enable_jargon_translation).toBeDefined();
      expect(config.enable_metaphors).toBeDefined();
      expect(config.enable_ui_simplification).toBeDefined();
      expect(config.technical_comfort_level).toBeDefined();
    });
  });
  
  describe('CSS Generation', () => {
    it('should generate CSS for complexity shield', () => {
      const css = shield.generateCSS();
      
      expect(css).toContain('.senior-user-mode');
      expect(css).toContain('font-size');
      expect(css).toContain('padding');
    });
  });
  
  describe('Statistics', () => {
    it('should provide shield usage statistics', () => {
      const stats = shield.getShieldStatistics();
      
      expect(stats.total_translations).toBeGreaterThan(0);
      expect(stats.total_metaphors).toBeGreaterThan(0);
      expect(stats.total_ui_simplifications).toBeGreaterThan(0);
      expect(stats.active_patterns).toBeGreaterThan(0);
    });
  });
  
  describe('Content Validation', () => {
    it('should validate content appropriateness for seniors', () => {
      const technicalContent = 'Initialize the API configuration and authenticate the database connection';
      
      const validation = shield.validateContentForSeniors(technicalContent);
      
      expect(validation.appropriate).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.includes('tekniska termer'))).toBe(true);
    });
    
    it('should approve simple content', () => {
      const simpleContent = 'Klicka på knappen för att spara ditt arbete';
      
      const validation = shield.validateContentForSeniors(simpleContent);
      
      expect(validation.appropriate).toBe(true);
      expect(validation.issues.length).toBe(0);
    });
    
    it('should detect long sentences', () => {
      const longSentence = 'Detta är en mycket lång mening som innehåller många ord och komplicerade begrepp som kan vara svåra att förstå för äldre användare som kanske inte är vana vid teknisk terminologi och komplexa instruktioner.';
      
      const validation = shield.validateContentForSeniors(longSentence);
      
      expect(validation.appropriate).toBe(false);
      expect(validation.issues.some(issue => issue.includes('långa meningar'))).toBe(true);
    });
    
    it('should detect passive voice', () => {
      const passiveContent = 'Filen blev sparad och konfigurationen gjordes automatiskt';
      
      const validation = shield.validateContentForSeniors(passiveContent);
      
      expect(validation.appropriate).toBe(false);
      expect(validation.issues.some(issue => issue.includes('passiv form'))).toBe(true);
    });
  });
  
  describe('Senior User Personas', () => {
    it('should handle Anna (tech-anxious senior) appropriately', () => {
      const anna = createSeniorUser();
      anna.profile.display_name = 'Anna Svensson';
      
      // Anna is anxious about technology
      const shieldConfig = {
        technical_comfort_level: 2,
        preferred_metaphor_categories: ['household', 'cooking'],
        ui_config: {
          use_large_elements: true,
          show_hints: true,
          high_contrast: true
        }
      };
      
      shield.updateConfig(shieldConfig);
      
      const result = shield.activateShield(anna, 'general');
      expect(result.activated).toBe(true);
      expect(result.css_classes).toContain('high-contrast');
      
      const help = shield.getHelpForTerm('backup', anna, 'general');
      expect(help).toContain('extra kopia'); // Detailed explanation for low comfort
    });
    
    it('should handle Gunnar (curious senior) appropriately', () => {
      const gunnar = createSeniorUser();
      gunnar.profile.display_name = 'Gunnar Nilsson';
      
      // Gunnar is more comfortable with technology
      const shieldConfig = {
        technical_comfort_level: 6,
        preferred_metaphor_categories: ['building', 'transportation'],
        ui_config: {
          use_large_elements: true,
          show_hints: false,
          reduce_clutter: false
        }
      };
      
      shield.updateConfig(shieldConfig);
      
      const help = shield.getHelpForTerm('backup', gunnar, 'general');
      expect(help).toBe('säkerhetskopia'); // Simple translation for higher comfort
    });
    
    it('should handle Margareta (social senior) appropriately', () => {
      const margareta = createSeniorUser();
      margareta.profile.display_name = 'Margareta Johansson';
      
      // Margareta likes social metaphors
      const shieldConfig = {
        technical_comfort_level: 4,
        preferred_metaphor_categories: ['household', 'nature'],
        ui_config: {
          simplified_navigation: true,
          show_hints: true
        }
      };
      
      shield.updateConfig(shieldConfig);
      
      const metaphors = shield.generateMetaphorsForConcepts(['server'], margareta, 'general');
      expect(metaphors.some(m => m.metaphor.includes('bibliotek'))).toBe(true);
    });
  });
  
  describe('Global Instance', () => {
    it('should provide global complexity shield instance', () => {
      const user = createSeniorUser();
      
      const result = complexityShield.activateShield(user, 'general');
      
      expect(result.activated).toBe(true);
    });
  });
});