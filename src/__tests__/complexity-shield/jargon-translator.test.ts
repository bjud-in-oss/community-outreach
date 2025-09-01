/**
 * Tests for jargon translator
 * Requirement 1.1: Write usability tests for technical jargon hiding
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  JargonTranslator,
  jargonTranslator
} from '../../lib/complexity-shield/jargon-translator';

describe('JargonTranslator', () => {
  let translator: JargonTranslator;
  
  beforeEach(() => {
    translator = new JargonTranslator();
  });
  
  const createSeniorContext = () => ({
    user_role: 'senior' as const,
    app_context: 'general',
    technical_comfort: 3,
    language: 'sv'
  });
  
  const createArchitectContext = () => ({
    user_role: 'architect' as const,
    app_context: 'general',
    technical_comfort: 8,
    language: 'sv'
  });
  
  describe('Text Translation', () => {
    it('should translate technical terms for senior users', () => {
      const text = 'Please authenticate to access the database';
      const context = createSeniorContext();
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toContain('logga in');
      expect(translated).toContain('minnesbank');
      expect(translated).not.toContain('authenticate');
      expect(translated).not.toContain('database');
    });
    
    it('should not translate for architect users', () => {
      const text = 'Please authenticate to access the database';
      const context = createArchitectContext();
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toBe(text);
    });
    
    it('should not translate for high technical comfort users', () => {
      const text = 'Please authenticate to access the database';
      const context = { ...createSeniorContext(), technical_comfort: 9 };
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toBe(text);
    });
    
    it('should handle multiple technical terms in one text', () => {
      const text = 'The server will sync your data to the cloud backup';
      const context = createSeniorContext();
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toContain('dator');
      expect(translated).toContain('synkronisera');
      expect(translated).toContain('molnet');
      expect(translated).toContain('säkerhetskopia');
    });
    
    it('should preserve word boundaries', () => {
      const text = 'The API server will authenticate users';
      const context = createSeniorContext();
      
      const translated = translator.translateText(text, context);
      
      // Should translate 'API', 'server', and 'authenticate' but preserve word boundaries
      expect(translated).toContain('anslutning');
      expect(translated).toContain('dator');
      expect(translated).toContain('logga in');
    });
  });
  
  describe('Explanations', () => {
    it('should provide explanations for technical terms', () => {
      const context = createSeniorContext();
      
      const explanation = translator.getExplanation('backup', context);
      
      expect(explanation).toBeDefined();
      expect(explanation).toContain('kopia');
    });
    
    it('should return friendly term for medium technical comfort', () => {
      const context = { ...createSeniorContext(), technical_comfort: 5 };
      
      const explanation = translator.getExplanation('backup', context);
      
      expect(explanation).toBe('säkerhetskopia');
    });
    
    it('should return detailed explanation for low technical comfort', () => {
      const context = { ...createSeniorContext(), technical_comfort: 2 };
      
      const explanation = translator.getExplanation('backup', context);
      
      expect(explanation).toContain('extra kopia');
    });
    
    it('should return undefined for unknown terms', () => {
      const context = createSeniorContext();
      
      const explanation = translator.getExplanation('unknownterm', context);
      
      expect(explanation).toBeUndefined();
    });
  });
  
  describe('Contextual Translations', () => {
    it('should add contextual translations', () => {
      const contextTranslations = [
        {
          technical: 'customterm',
          friendly: 'specialterm',
          explanation: 'en speciell term för detta sammanhang',
          category: 'feature' as const
        }
      ];
      
      translator.addContextualTranslations('dashboard', contextTranslations);
      
      const text = 'Add a new customterm to your dashboard';
      const context = { ...createSeniorContext(), app_context: 'dashboard' };
      
      const translated = translator.translateText(text, context);
      
      // Should translate both the contextual 'customterm' and the default 'dashboard'
      expect(translated).toContain('specialterm');
      expect(translated).toContain('översikt');
    });
  });
  
  describe('Category Filtering', () => {
    it('should get translations by category', () => {
      const systemTranslations = translator.getTranslationsByCategory('system');
      
      expect(systemTranslations.length).toBeGreaterThan(0);
      expect(systemTranslations.every(t => t.category === 'system')).toBe(true);
    });
    
    it('should get action translations', () => {
      const actionTranslations = translator.getTranslationsByCategory('action');
      
      expect(actionTranslations.length).toBeGreaterThan(0);
      expect(actionTranslations.some(t => t.technical === 'encrypt')).toBe(true);
    });
  });
  
  describe('Suggestions', () => {
    it('should suggest alternatives for partial matches', () => {
      const suggestions = translator.suggestAlternatives('auth');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.technical.includes('auth'))).toBe(true);
    });
    
    it('should suggest alternatives for friendly terms', () => {
      const suggestions = translator.suggestAlternatives('logga');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.friendly.includes('logga'))).toBe(true);
    });
  });
  
  describe('Jargon Detection', () => {
    it('should detect technical jargon', () => {
      expect(translator.isTechnicalJargon('API')).toBe(true);
      expect(translator.isTechnicalJargon('database')).toBe(true);
      expect(translator.isTechnicalJargon('hello')).toBe(false);
    });
    
    it('should be case insensitive', () => {
      expect(translator.isTechnicalJargon('api')).toBe(true);
      expect(translator.isTechnicalJargon('API')).toBe(true);
      expect(translator.isTechnicalJargon('Database')).toBe(true);
    });
  });
  
  describe('Translation Management', () => {
    it('should add new translations', () => {
      const newTranslation = {
        technical: 'blockchain',
        friendly: 'kedja',
        explanation: 'säker informationskedja',
        category: 'system' as const
      };
      
      translator.addTranslation(newTranslation);
      
      expect(translator.isTechnicalJargon('blockchain')).toBe(true);
      
      const text = 'The blockchain is secure';
      const context = createSeniorContext();
      const translated = translator.translateText(text, context);
      
      expect(translated).toContain('kedja');
    });
    
    it('should remove translations', () => {
      const removed = translator.removeTranslation('API');
      
      expect(removed).toBe(true);
      expect(translator.isTechnicalJargon('API')).toBe(false);
    });
    
    it('should get all translations', () => {
      const allTranslations = translator.getAllTranslations();
      
      expect(allTranslations.length).toBeGreaterThan(0);
      expect(allTranslations.every(t => t.technical && t.friendly)).toBe(true);
    });
    
    it('should clear all translations', () => {
      translator.clearTranslations();
      
      const allTranslations = translator.getAllTranslations();
      expect(allTranslations.length).toBe(0);
    });
  });
  
  describe('Swedish Language Support', () => {
    it('should provide Swedish translations', () => {
      const text = 'Upload your file to the server';
      const context = createSeniorContext();
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toContain('ladda upp');
      expect(translated).toContain('dator');
    });
    
    it('should handle cognitive agent terms', () => {
      const text = 'The cognitive agent uses RAG for memory';
      const context = createSeniorContext();
      
      const translated = translator.translateText(text, context);
      
      expect(translated).toContain('digital assistent');
      expect(translated).toContain('minnesystem');
    });
  });
  
  describe('Global Instance', () => {
    it('should provide global jargon translator instance', () => {
      const text = 'Please authenticate';
      const context = createSeniorContext();
      
      const translated = jargonTranslator.translateText(text, context);
      
      expect(translated).toContain('logga in');
    });
  });
});