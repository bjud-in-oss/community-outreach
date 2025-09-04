/**
 * Technical jargon translator for senior users
 * Requirement 1.1: Hide technical jargon and use human-like metaphors
 */

/**
 * Technical term translation mapping
 */
export interface TechnicalTranslation {
  /** Original technical term */
  technical: string;
  
  /** Human-friendly translation */
  friendly: string;
  
  /** Optional explanation */
  explanation?: string;
  
  /** Category of the term */
  category: 'system' | 'action' | 'status' | 'error' | 'feature';
}

/**
 * Translation context for better accuracy
 */
export interface TranslationContext {
  /** User role */
  user_role: 'senior' | 'architect';
  
  /** Current application context */
  app_context: string;
  
  /** User's technical comfort level (1-10) */
  technical_comfort: number;
  
  /** Preferred language */
  language: string;
}

/**
 * Default technical translations (Swedish-focused)
 */
const DEFAULT_TRANSLATIONS: TechnicalTranslation[] = [
  // System terms
  { technical: 'API', friendly: 'anslutning', explanation: 'sätt för program att prata med varandra', category: 'system' },
  { technical: 'database', friendly: 'minnesbank', explanation: 'där all information sparas', category: 'system' },
  { technical: 'server', friendly: 'dator', explanation: 'en kraftfull dator som hjälper dig', category: 'system' },
  { technical: 'cloud', friendly: 'molnet', explanation: 'säker förvaring på internet', category: 'system' },
  { technical: 'backup', friendly: 'säkerhetskopia', explanation: 'extra kopia av dina saker', category: 'system' },
  { technical: 'sync', friendly: 'synkronisera', explanation: 'se till att allt är uppdaterat överallt', category: 'system' },
  { technical: 'cache', friendly: 'snabbminne', explanation: 'temporär förvaring för snabbare åtkomst', category: 'system' },
  
  // Actions
  { technical: 'authenticate', friendly: 'logga in', explanation: 'bevisa vem du är', category: 'action' },
  { technical: 'authorize', friendly: 'ge tillåtelse', explanation: 'bestämma vad som är okej att göra', category: 'action' },
  { technical: 'encrypt', friendly: 'låsa', explanation: 'göra information säker och hemlig', category: 'action' },
  { technical: 'decrypt', friendly: 'låsa upp', explanation: 'göra låst information läsbar igen', category: 'action' },
  { technical: 'upload', friendly: 'ladda upp', explanation: 'skicka filer till molnet', category: 'action' },
  { technical: 'download', friendly: 'ladda ner', explanation: 'hämta filer från molnet', category: 'action' },
  { technical: 'deploy', friendly: 'publicera', explanation: 'göra tillgängligt för alla', category: 'action' },
  { technical: 'compile', friendly: 'bygga', explanation: 'förbereda programmet för användning', category: 'action' },
  
  // Status terms
  { technical: 'online', friendly: 'ansluten', explanation: 'kopplad till internet', category: 'status' },
  { technical: 'offline', friendly: 'frånkopplad', explanation: 'inte kopplad till internet', category: 'status' },
  { technical: 'pending', friendly: 'väntar', explanation: 'håller på att behandlas', category: 'status' },
  { technical: 'processing', friendly: 'arbetar', explanation: 'systemet jobbar med din begäran', category: 'status' },
  { technical: 'completed', friendly: 'klart', explanation: 'uppgiften är färdig', category: 'status' },
  { technical: 'failed', friendly: 'misslyckades', explanation: 'något gick fel', category: 'status' },
  { technical: 'timeout', friendly: 'tog för lång tid', explanation: 'systemet gav upp efter att ha väntat för länge', category: 'status' },
  
  // Error terms
  { technical: 'error', friendly: 'problem', explanation: 'något gick fel', category: 'error' },
  { technical: 'exception', friendly: 'oväntat problem', explanation: 'något som systemet inte förväntade sig', category: 'error' },
  { technical: 'bug', friendly: 'fel i programmet', explanation: 'ett misstag i koden', category: 'error' },
  { technical: 'crash', friendly: 'krasch', explanation: 'programmet slutade fungera plötsligt', category: 'error' },
  { technical: 'connection lost', friendly: 'tappade kontakten', explanation: 'internetanslutningen försvann', category: 'error' },
  
  // Feature terms
  { technical: 'dashboard', friendly: 'översikt', explanation: 'huvudsidan där du ser allt viktigt', category: 'feature' },
  { technical: 'widget', friendly: 'liten hjälpare', explanation: 'en liten del som gör något specifikt', category: 'feature' },
  { technical: 'plugin', friendly: 'tillägg', explanation: 'extra funktioner du kan lägga till', category: 'feature' },
  { technical: 'settings', friendly: 'inställningar', explanation: 'där du ändrar hur saker fungerar', category: 'feature' },
  { technical: 'preferences', friendly: 'önskemål', explanation: 'hur du vill att saker ska vara', category: 'feature' },
  { technical: 'notification', friendly: 'påminnelse', explanation: 'meddelande om något viktigt', category: 'feature' },
  
  // Cognitive agent terms (system-specific)
  { technical: 'cognitive agent', friendly: 'digital assistent', explanation: 'en hjälpsam datorpartner som tänker', category: 'system' },
  { technical: 'RAG', friendly: 'minnesystem', explanation: 'hur assistenten kommer ihåg saker', category: 'system' },
  { technical: 'LLM', friendly: 'språkhjärna', explanation: 'den del som förstår och skapar text', category: 'system' },
  { technical: 'roundabout loop', friendly: 'tänkprocess', explanation: 'hur assistenten löser problem steg för steg', category: 'system' },
  { technical: 'consent verification', friendly: 'tillståndskontroll', explanation: 'kontrollera att det är okej att göra något', category: 'system' },
  { technical: 'data retention', friendly: 'minneshantering', explanation: 'hur länge information sparas', category: 'system' },
  
  // UI/UX terms
  { technical: 'UI', friendly: 'gränssnitt', explanation: 'det du ser och klickar på', category: 'feature' },
  { technical: 'UX', friendly: 'användarupplevelse', explanation: 'hur det känns att använda programmet', category: 'feature' },
  { technical: 'responsive', friendly: 'anpassningsbar', explanation: 'fungerar på alla skärmstorlekar', category: 'feature' },
  { technical: 'layout', friendly: 'utseende', explanation: 'hur saker är arrangerade på skärmen', category: 'feature' },
  { technical: 'navigation', friendly: 'navigering', explanation: 'hur du rör dig mellan olika delar', category: 'feature' }
];

/**
 * Jargon translator service
 */
export class JargonTranslator {
  private translations: Map<string, TechnicalTranslation> = new Map();
  private contextualTranslations: Map<string, Map<string, TechnicalTranslation>> = new Map();
  
  constructor(customTranslations: TechnicalTranslation[] = []) {
    // Load default translations
    DEFAULT_TRANSLATIONS.forEach(translation => {
      this.translations.set(translation.technical.toLowerCase(), translation);
    });
    
    // Add custom translations
    customTranslations.forEach(translation => {
      this.translations.set(translation.technical.toLowerCase(), translation);
    });
  }
  
  /**
   * Translates technical text to user-friendly language
   */
  translateText(
    text: string, 
    context: TranslationContext
  ): string {
    // Skip translation for architect users or high technical comfort
    if (context.user_role === 'architect' || context.technical_comfort >= 8) {
      return text;
    }
    
    let translatedText = text;
    
    // Apply translations based on context
    Array.from(this.translations.entries()).forEach(([technical, translation]) => {
      const regex = new RegExp(`\\b${this.escapeRegex(technical)}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation.friendly);
    });
    
    // Apply contextual translations if available
    const contextTranslations = this.contextualTranslations.get(context.app_context);
    if (contextTranslations) {
      Array.from(contextTranslations.entries()).forEach(([technical, translation]) => {
        const regex = new RegExp(`\\b${this.escapeRegex(technical)}\\b`, 'gi');
        translatedText = translatedText.replace(regex, translation.friendly);
      });
    }
    
    return translatedText;
  }
  
  /**
   * Gets explanation for a technical term
   */
  getExplanation(
    term: string, 
    context: TranslationContext
  ): string | undefined {
    const translation = this.translations.get(term.toLowerCase());
    
    if (!translation) {
      return undefined;
    }
    
    // Return explanation based on technical comfort level
    if (context.technical_comfort <= 3 && translation.explanation) {
      return translation.explanation;
    }
    
    return translation.friendly;
  }
  
  /**
   * Adds contextual translations for specific app contexts
   */
  addContextualTranslations(
    context: string, 
    translations: TechnicalTranslation[]
  ): void {
    if (!this.contextualTranslations.has(context)) {
      this.contextualTranslations.set(context, new Map());
    }
    
    const contextMap = this.contextualTranslations.get(context)!;
    translations.forEach(translation => {
      contextMap.set(translation.technical.toLowerCase(), translation);
    });
  }
  
  /**
   * Gets all translations for a category
   */
  getTranslationsByCategory(category: TechnicalTranslation['category']): TechnicalTranslation[] {
    return Array.from(this.translations.values())
      .filter(translation => translation.category === category);
  }
  
  /**
   * Suggests friendly alternatives for technical terms
   */
  suggestAlternatives(term: string): TechnicalTranslation[] {
    const lowerTerm = term.toLowerCase();
    return Array.from(this.translations.values())
      .filter(translation => 
        translation.technical.toLowerCase().includes(lowerTerm) ||
        translation.friendly.toLowerCase().includes(lowerTerm)
      );
  }
  
  /**
   * Checks if a term is considered technical jargon
   */
  isTechnicalJargon(term: string): boolean {
    return this.translations.has(term.toLowerCase());
  }
  
  /**
   * Escapes special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Adds a new translation
   */
  addTranslation(translation: TechnicalTranslation): void {
    this.translations.set(translation.technical.toLowerCase(), translation);
  }
  
  /**
   * Removes a translation
   */
  removeTranslation(technical: string): boolean {
    return this.translations.delete(technical.toLowerCase());
  }
  
  /**
   * Gets all available translations
   */
  getAllTranslations(): TechnicalTranslation[] {
    return Array.from(this.translations.values());
  }
  
  /**
   * Clears all translations
   */
  clearTranslations(): void {
    this.translations.clear();
    this.contextualTranslations.clear();
  }
}

/**
 * Global jargon translator instance
 */
export const jargonTranslator = new JargonTranslator();