/**
 * Tests for UI simplifier
 * Requirement 16.1.5: Write usability tests for role-based UI filtering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  UISimplifier,
  uiSimplifier
} from '../../lib/complexity-shield/ui-simplifier';
import { User } from '../../types/data-models';

describe('UISimplifier', () => {
  let simplifier: UISimplifier;
  
  beforeEach(() => {
    simplifier = new UISimplifier();
  });
  
  const createSeniorUser = (): User => ({
    id: 'senior_user_123',
    user_role: 'senior',
    profile: {
      display_name: 'Senior User',
      email: 'senior@example.com',
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
      display_name: 'Architect User',
      email: 'architect@example.com',
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
  
  describe('CSS Classes', () => {
    it('should generate senior user CSS classes', () => {
      const user = createSeniorUser();
      
      const classes = simplifier.getCSSClasses(user);
      
      expect(classes).toContain('senior-user-mode');
      expect(classes).toContain('large-elements');
      expect(classes).toContain('reduced-clutter');
      expect(classes).toContain('show-hints');
      expect(classes).toContain('simplified-nav');
    });
    
    it('should generate architect user CSS classes', () => {
      const user = createArchitectUser();
      
      const classes = simplifier.getCSSClasses(user);
      
      expect(classes).toContain('architect-user-mode');
      expect(classes).toContain('full-features');
      expect(classes).not.toContain('senior-user-mode');
    });
    
    it('should respect configuration settings', () => {
      const customSimplifier = new UISimplifier([], {
        use_large_elements: false,
        show_hints: false,
        high_contrast: true
      });
      
      const user = createSeniorUser();
      const classes = customSimplifier.getCSSClasses(user);
      
      expect(classes).toContain('senior-user-mode');
      expect(classes).not.toContain('large-elements');
      expect(classes).not.toContain('show-hints');
      expect(classes).toContain('high-contrast');
    });
  });
  
  describe('Element Visibility', () => {
    it('should hide technical elements for senior users', () => {
      const user = createSeniorUser();
      
      const visibility = simplifier.getElementVisibility(user);
      
      expect(visibility['.debug-panel']).toBe(false);
      expect(visibility['.advanced-settings']).toBe(false);
      expect(visibility['.api-configuration']).toBe(false);
      expect(visibility['.system-logs']).toBe(false);
    });
    
    it('should show technical elements for architect users', () => {
      const user = createArchitectUser();
      
      const visibility = simplifier.getElementVisibility(user);
      
      expect(visibility['.debug-panel']).toBe(true);
      expect(visibility['.advanced-settings']).toBe(true);
      expect(visibility['.api-configuration']).toBe(true);
      expect(visibility['.system-logs']).toBe(true);
    });
    
    it('should show helpful elements for senior users', () => {
      const user = createSeniorUser();
      
      const visibility = simplifier.getElementVisibility(user);
      
      expect(visibility['.help-button']).toBe(true);
      expect(visibility['.simple-navigation']).toBe(true);
      expect(visibility['.large-text-mode']).toBe(true);
    });
  });
  
  describe('Hidden Elements', () => {
    it('should get list of hidden elements for senior users', () => {
      const hiddenElements = simplifier.getHiddenElements('senior');
      
      expect(hiddenElements).toContain('.debug-panel');
      expect(hiddenElements).toContain('.advanced-settings');
      expect(hiddenElements).toContain('.agent-hierarchy-visualizer');
      expect(hiddenElements).toContain('.stack-trace');
    });
    
    it('should get fewer hidden elements for architect users', () => {
      const seniorHidden = simplifier.getHiddenElements('senior');
      const architectHidden = simplifier.getHiddenElements('architect');
      
      expect(seniorHidden.length).toBeGreaterThan(architectHidden.length);
    });
  });
  
  describe('Alternative Elements', () => {
    it('should provide alternatives for hidden elements', () => {
      const alternatives = simplifier.getAlternativeElements('senior');
      
      expect(alternatives['.advanced-settings']).toBe('.basic-settings');
      expect(alternatives['.raw-data-view']).toBe('.formatted-data-view');
      expect(alternatives['.stack-trace']).toBe('.friendly-error-message');
    });
    
    it('should not provide alternatives for architect users where not needed', () => {
      const alternatives = simplifier.getAlternativeElements('architect');
      
      // Architect users should see original elements, not alternatives
      expect(Object.keys(alternatives).length).toBeLessThan(
        Object.keys(simplifier.getAlternativeElements('senior')).length
      );
    });
  });
  
  describe('Text Simplification', () => {
    it('should simplify text for senior users', () => {
      const text = 'Initialize the configuration (technical details) and authenticate the API connection';
      
      const simplified = simplifier.simplifyText(text, 'senior');
      
      expect(simplified).not.toContain('(technical details)');
      expect(simplified).not.toContain('(API');
      expect(simplified).toContain('förbereder');
      expect(simplified).toContain('inställning');
      expect(simplified).toContain('logga in');
    });
    
    it('should not simplify text for architect users', () => {
      const text = 'Initialize the configuration (technical details) and authenticate the API connection';
      
      const simplified = simplifier.simplifyText(text, 'architect');
      
      expect(simplified).toBe(text);
    });
    
    it('should remove technical parenthetical information', () => {
      const text = 'Save your work (API call in progress) to continue';
      
      const simplified = simplifier.simplifyText(text, 'senior');
      
      expect(simplified).not.toContain('(API call in progress)');
      expect(simplified).toContain('Save your work');
    });
  });
  
  describe('Button Text Simplification', () => {
    it('should simplify button text for senior users', () => {
      expect(simplifier.getSimplifiedButtonText('Configure', 'senior')).toBe('Ändra inställningar');
      expect(simplifier.getSimplifiedButtonText('Deploy', 'senior')).toBe('Publicera');
      expect(simplifier.getSimplifiedButtonText('Authenticate', 'senior')).toBe('Logga in');
      expect(simplifier.getSimplifiedButtonText('Initialize', 'senior')).toBe('Starta');
    });
    
    it('should not simplify button text for architect users', () => {
      expect(simplifier.getSimplifiedButtonText('Configure', 'architect')).toBe('Configure');
      expect(simplifier.getSimplifiedButtonText('Deploy', 'architect')).toBe('Deploy');
      expect(simplifier.getSimplifiedButtonText('Authenticate', 'architect')).toBe('Authenticate');
    });
    
    it('should return original text for unknown buttons', () => {
      expect(simplifier.getSimplifiedButtonText('CustomButton', 'senior')).toBe('CustomButton');
    });
  });
  
  describe('Menu Simplification', () => {
    it('should provide simplified menu for senior users', () => {
      const menu = simplifier.getSimplifiedMenu('senior');
      
      expect(menu.simple).toBe(true);
      expect(menu.main).toEqual(['Hem', 'Mina sidor', 'Kontakter', 'Hjälp']);
      expect(menu.developer).toBeUndefined();
    });
    
    it('should provide full menu for architect users', () => {
      const menu = simplifier.getSimplifiedMenu('architect');
      
      expect(menu.simple).toBeUndefined();
      expect(menu.main).toContain('Utvecklarverktyg');
      expect(menu.main).toContain('System');
      expect(menu.developer).toBeDefined();
    });
  });
  
  describe('Visibility Rule Management', () => {
    it('should add custom visibility rules', () => {
      const customRule = {
        element: '.custom-element',
        visibility: { senior: false, architect: true },
        reason: 'Custom technical element'
      };
      
      simplifier.addVisibilityRule(customRule);
      
      const hiddenElements = simplifier.getHiddenElements('senior');
      expect(hiddenElements).toContain('.custom-element');
    });
    
    it('should remove visibility rules', () => {
      const removed = simplifier.removeVisibilityRule('.debug-panel');
      
      expect(removed).toBe(true);
      
      const hiddenElements = simplifier.getHiddenElements('senior');
      expect(hiddenElements).not.toContain('.debug-panel');
    });
    
    it('should get all visibility rules', () => {
      const rules = simplifier.getAllVisibilityRules();
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every(rule => rule.element && rule.visibility)).toBe(true);
    });
  });
  
  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        use_large_elements: false,
        high_contrast: true
      };
      
      simplifier.updateConfig(newConfig);
      
      const config = simplifier.getConfig();
      expect(config.use_large_elements).toBe(false);
      expect(config.high_contrast).toBe(true);
    });
    
    it('should get current configuration', () => {
      const config = simplifier.getConfig();
      
      expect(config.hide_technical_details).toBeDefined();
      expect(config.use_large_elements).toBeDefined();
      expect(config.reduce_clutter).toBeDefined();
    });
  });
  
  describe('CSS Generation', () => {
    it('should generate senior mode CSS', () => {
      const css = simplifier.generateSeniorModeCSS();
      
      expect(css).toContain('.senior-user-mode');
      expect(css).toContain('.large-elements');
      expect(css).toContain('.reduced-clutter');
      expect(css).toContain('.show-hints');
      expect(css).toContain('.high-contrast');
      expect(css).toContain('font-size');
      expect(css).toContain('padding');
    });
    
    it('should include accessibility features in CSS', () => {
      const css = simplifier.generateSeniorModeCSS();
      
      expect(css).toContain('min-height: 44px'); // Touch target size
      expect(css).toContain('line-height: 1.6'); // Readable line height
      expect(css).toContain('font-size: 1.1em'); // Larger text
    });
  });
  
  describe('Cognitive Agent Specific Elements', () => {
    it('should hide cognitive agent technical elements for senior users', () => {
      const hiddenElements = simplifier.getHiddenElements('senior');
      
      expect(hiddenElements).toContain('.agent-hierarchy-visualizer');
      expect(hiddenElements).toContain('.roundabout-loop-monitor');
      expect(hiddenElements).toContain('.memory-rag-controls');
      expect(hiddenElements).toContain('.consent-verification-details');
    });
    
    it('should provide simplified alternatives for cognitive agent elements', () => {
      const alternatives = simplifier.getAlternativeElements('senior');
      
      expect(alternatives['.memory-rag-controls']).toBe('.memory-simple-controls');
      expect(alternatives['.consent-verification-details']).toBe('.consent-simple-status');
      expect(alternatives['.technical-error-details']).toBe('.simple-error-explanation');
    });
  });
  
  describe('Global Instance', () => {
    it('should provide global UI simplifier instance', () => {
      const user = createSeniorUser();
      
      const classes = uiSimplifier.getCSSClasses(user);
      
      expect(classes).toContain('senior-user-mode');
    });
  });
});