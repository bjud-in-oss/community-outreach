/**
 * Metaphor generator for explaining technical concepts
 * Requirement 1.1: Use human-like metaphors for technical explanations
 */

/**
 * Metaphor template for technical concepts
 */
export interface MetaphorTemplate {
  /** Technical concept being explained */
  concept: string;
  
  /** Metaphor category */
  category: 'household' | 'nature' | 'transportation' | 'cooking' | 'gardening' | 'building';
  
  /** Base metaphor */
  metaphor: string;
  
  /** Detailed explanation using the metaphor */
  explanation: string;
  
  /** Example usage */
  example?: string;
  
  /** Difficulty level (1-5, where 1 is simplest) */
  difficulty: number;
}

/**
 * Default metaphor templates (Swedish-focused)
 */
const DEFAULT_METAPHORS: MetaphorTemplate[] = [
  // Data and storage metaphors
  {
    concept: 'database',
    category: 'household',
    metaphor: 'ett stort arkivskåp',
    explanation: 'Precis som ett arkivskåp har många lådor med mappar, så har en databas många "lådor" där information sorteras och förvaras på ett organiserat sätt.',
    example: 'Dina kontakter förvaras i en "låda", dina foton i en annan.',
    difficulty: 2
  },
  {
    concept: 'backup',
    category: 'household',
    metaphor: 'en säkerhetskopia av viktiga papper',
    explanation: 'Precis som du kanske har kopior av viktiga dokument i ett bankfack, så gör datorn kopior av dina filer för säkerhets skull.',
    example: 'Om originalet försvinner, finns kopian kvar.',
    difficulty: 1
  },
  {
    concept: 'cloud storage',
    category: 'household',
    metaphor: 'ett säkert förråd som du hyr',
    explanation: 'Molnlagring är som att hyra ett förråd där du kan förvara dina saker. Du kan komma åt dem när som helst, men de förvaras på en säker plats.',
    example: 'Du kan lägga foton i "förrådet" och hämta dem från vilken dator som helst.',
    difficulty: 2
  },
  
  // Network and connectivity metaphors
  {
    concept: 'internet connection',
    category: 'transportation',
    metaphor: 'en väg mellan ditt hem och världen',
    explanation: 'Internetanslutningen är som en väg som förbinder ditt hem med resten av världen. Ju bredare väg, desto mer trafik kan passera.',
    example: 'När vägen är blockerad (ingen internet), kan du inte ta dig någonstans.',
    difficulty: 1
  },
  {
    concept: 'server',
    category: 'building',
    metaphor: 'ett bibliotek med en bibliotekarie',
    explanation: 'En server är som ett stort bibliotek där information förvaras, och bibliotekarie som hjälper dig hitta det du söker.',
    example: 'När du ber om en webbsida, frågar din dator "bibliotekarien" som hittar och skickar sidan till dig.',
    difficulty: 2
  },
  {
    concept: 'bandwidth',
    category: 'transportation',
    metaphor: 'bredden på en väg',
    explanation: 'Bandbredd är som bredden på en väg - ju bredare väg, desto fler bilar kan köra samtidigt utan att det blir trångt.',
    example: 'Med bred "väg" kan du ladda ner stora filer snabbt.',
    difficulty: 3
  },
  
  // Security metaphors
  {
    concept: 'encryption',
    category: 'household',
    metaphor: 'att låsa något i ett kassaskåp',
    explanation: 'Kryptering är som att låsa dina viktiga saker i ett kassaskåp. Bara du har nyckeln och kan öppna det.',
    example: 'Dina meddelanden "låses" innan de skickas, så bara mottagaren kan "låsa upp" dem.',
    difficulty: 2
  },
  {
    concept: 'password',
    category: 'household',
    metaphor: 'nyckeln till ditt hem',
    explanation: 'Ett lösenord är som nyckeln till ditt hem - det bevisar att du är den rätta personen som får komma in.',
    example: 'Precis som du inte ger bort husnyckeln till vem som helst, ska du hålla lösenord hemliga.',
    difficulty: 1
  },
  {
    concept: 'firewall',
    category: 'household',
    metaphor: 'en säkerhetsvakt vid porten',
    explanation: 'En brandvägg är som en säkerhetsvakt som står vid porten till ditt hem och kontrollerar vem som får komma in.',
    example: 'Säkerhetsvakten släpper in vänner men stoppar okända personer.',
    difficulty: 2
  },
  
  // Processing and performance metaphors
  {
    concept: 'CPU',
    category: 'cooking',
    metaphor: 'kökschefen i ett restaurangkök',
    explanation: 'Processorn är som en kökschef som tar emot beställningar och ser till att alla uppgifter utförs i rätt ordning.',
    example: 'Ju skickligare "kökschef", desto snabbare blir maten (programmen) klar.',
    difficulty: 3
  },
  {
    concept: 'RAM memory',
    category: 'cooking',
    metaphor: 'arbetsbänken i köket',
    explanation: 'Arbetsminnet är som arbetsbänken i köket - ju större yta, desto fler ingredienser (program) kan du ha framme samtidigt.',
    example: 'Med liten arbetsbänk måste du ständigt plocka fram och undan saker.',
    difficulty: 3
  },
  {
    concept: 'loading',
    category: 'transportation',
    metaphor: 'att vänta på bussen',
    explanation: 'När något laddar är det som att vänta på bussen - den kommer snart, men du måste ha tålamod.',
    example: 'Stora filer är som tunga väskor - de tar längre tid att lasta.',
    difficulty: 1
  },
  
  // Software and applications metaphors
  {
    concept: 'application',
    category: 'household',
    metaphor: 'ett verktyg i verktygslådan',
    explanation: 'Ett program är som ett verktyg i din verktygslåda - varje verktyg har sitt speciella syfte.',
    example: 'Ordbehandlaren är som en penna, webbläsaren som en karta.',
    difficulty: 1
  },
  {
    concept: 'operating system',
    category: 'building',
    metaphor: 'grunden och väggarna i ditt hus',
    explanation: 'Operativsystemet är som grunden och väggarna i ditt hus - det håller allt på plats och gör att andra saker kan fungera.',
    example: 'Utan en stabil grund kan du inte möblera rummen (installera program).',
    difficulty: 2
  },
  {
    concept: 'update',
    category: 'household',
    metaphor: 'att renovera rummet',
    explanation: 'En uppdatering är som att renovera ett rum - du får nya funktioner och allt blir lite bättre.',
    example: 'Ibland flyttas saker runt (nya menyer), men rummet blir finare.',
    difficulty: 1
  },
  
  // Cognitive agent specific metaphors
  {
    concept: 'cognitive agent',
    category: 'household',
    metaphor: 'en klok och hjälpsam hushållerska',
    explanation: 'Den digitala assistenten är som en mycket klok hushållerska som lär känna dina vanor och hjälper dig med dagliga uppgifter.',
    example: 'Precis som en bra hushållerska kommer ihåg vad du gillar och förbereder saker i förväg.',
    difficulty: 2
  },
  {
    concept: 'memory system',
    category: 'household',
    metaphor: 'ett välorganiserat fotoalbum och dagbok',
    explanation: 'Minnessystemet är som att ha både ett fotoalbum och en dagbok där viktiga minnen och information sparas på ett smart sätt.',
    example: 'Precis som du kan bläddra i albumet för att hitta ett specifikt foto, kan systemet hitta gamla samtal.',
    difficulty: 2
  },
  {
    concept: 'consent management',
    category: 'household',
    metaphor: 'att be om lov innan man lånar något',
    explanation: 'Samtyckehantering är som att alltid fråga om lov innan man lånar eller använder någon annans saker.',
    example: 'Precis som du frågar innan du lånar grannes verktyg, frågar systemet innan det delar din information.',
    difficulty: 1
  }
];

/**
 * Metaphor generation context
 */
export interface MetaphorContext {
  /** User's preferred metaphor categories */
  preferred_categories: MetaphorTemplate['category'][];
  
  /** User's technical comfort level (1-10) */
  technical_comfort: number;
  
  /** Current situation or task */
  situation: string;
  
  /** User's age group for age-appropriate metaphors */
  age_group: 'senior' | 'adult' | 'young_adult';
  
  /** Cultural context */
  cultural_context: 'swedish' | 'international';
}

/**
 * Metaphor generator service
 */
export class MetaphorGenerator {
  private metaphors: Map<string, MetaphorTemplate[]> = new Map();
  
  constructor(customMetaphors: MetaphorTemplate[] = []) {
    // Load default metaphors
    this.loadMetaphors([...DEFAULT_METAPHORS, ...customMetaphors]);
  }
  
  /**
   * Generates a metaphor for a technical concept
   */
  generateMetaphor(
    concept: string,
    context: MetaphorContext
  ): MetaphorTemplate | null {
    const conceptMetaphors = this.metaphors.get(concept.toLowerCase());
    
    if (!conceptMetaphors || conceptMetaphors.length === 0) {
      return null;
    }
    
    // Filter metaphors based on context
    let suitableMetaphors = conceptMetaphors.filter(metaphor => {
      // Check difficulty level
      const maxDifficulty = Math.min(5, Math.max(1, Math.ceil(context.technical_comfort / 2)));
      if (metaphor.difficulty > maxDifficulty) {
        return false;
      }
      
      // Check preferred categories
      if (context.preferred_categories.length > 0 && 
          !context.preferred_categories.includes(metaphor.category)) {
        return false;
      }
      
      return true;
    });
    
    // If no suitable metaphors found, relax constraints
    if (suitableMetaphors.length === 0) {
      suitableMetaphors = conceptMetaphors.filter(metaphor => 
        metaphor.difficulty <= 3 // Use simpler metaphors as fallback
      );
    }
    
    // If still no metaphors, use any available
    if (suitableMetaphors.length === 0) {
      suitableMetaphors = conceptMetaphors;
    }
    
    // Select the most appropriate metaphor
    return this.selectBestMetaphor(suitableMetaphors, context);
  }
  
  /**
   * Explains a technical process using metaphors
   */
  explainProcess(
    steps: string[],
    context: MetaphorContext,
    processName: string = 'process'
  ): string {
    const metaphorCategory = this.selectMetaphorCategory(context);
    
    switch (metaphorCategory) {
      case 'cooking':
        return this.explainAsCookingProcess(steps, processName);
      case 'gardening':
        return this.explainAsGardeningProcess(steps, processName);
      case 'building':
        return this.explainAsBuildingProcess(steps, processName);
      case 'transportation':
        return this.explainAsJourneyProcess(steps, processName);
      default:
        return this.explainAsHouseholdProcess(steps, processName);
    }
  }
  
  /**
   * Gets all available metaphors for a concept
   */
  getMetaphorsForConcept(concept: string): MetaphorTemplate[] {
    return this.metaphors.get(concept.toLowerCase()) || [];
  }
  
  /**
   * Adds new metaphors
   */
  addMetaphors(metaphors: MetaphorTemplate[]): void {
    this.loadMetaphors(metaphors);
  }
  
  /**
   * Gets metaphors by category
   */
  getMetaphorsByCategory(category: MetaphorTemplate['category']): MetaphorTemplate[] {
    const result: MetaphorTemplate[] = [];
    
    Array.from(this.metaphors.values()).forEach(metaphorList => {
      result.push(...metaphorList.filter(m => m.category === category));
    });
    
    return result;
  }
  
  /**
   * Loads metaphors into the system
   */
  private loadMetaphors(metaphors: MetaphorTemplate[]): void {
    metaphors.forEach(metaphor => {
      const concept = metaphor.concept.toLowerCase();
      
      if (!this.metaphors.has(concept)) {
        this.metaphors.set(concept, []);
      }
      
      this.metaphors.get(concept)!.push(metaphor);
    });
  }
  
  /**
   * Selects the best metaphor from available options
   */
  private selectBestMetaphor(
    metaphors: MetaphorTemplate[],
    context: MetaphorContext
  ): MetaphorTemplate {
    // Sort by preference: preferred category first, then by difficulty
    metaphors.sort((a, b) => {
      const aPreferred = context.preferred_categories.includes(a.category) ? 1 : 0;
      const bPreferred = context.preferred_categories.includes(b.category) ? 1 : 0;
      
      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred; // Preferred first
      }
      
      return a.difficulty - b.difficulty; // Simpler first
    });
    
    return metaphors[0];
  }
  
  /**
   * Selects appropriate metaphor category based on context
   */
  private selectMetaphorCategory(context: MetaphorContext): MetaphorTemplate['category'] {
    if (context.preferred_categories.length > 0) {
      return context.preferred_categories[0];
    }
    
    // Default categories for senior users
    const seniorFriendlyCategories: MetaphorTemplate['category'][] = [
      'household', 'cooking', 'gardening', 'nature'
    ];
    
    return seniorFriendlyCategories[0];
  }
  
  /**
   * Explains process as cooking
   */
  private explainAsCookingProcess(steps: string[], processName: string): string {
    const cookingTerms = ['förbereda ingredienserna', 'blanda', 'koka', 'krydda', 'servera'];
    
    let explanation = `Att ${processName} är som att laga mat:\n\n`;
    
    steps.forEach((step, index) => {
      const cookingTerm = cookingTerms[index % cookingTerms.length];
      explanation += `${index + 1}. ${cookingTerm}: ${step}\n`;
    });
    
    explanation += '\nPrecis som matlagning tar det tid, men resultatet blir värt väntan!';
    
    return explanation;
  }
  
  /**
   * Explains process as gardening
   */
  private explainAsGardeningProcess(steps: string[], processName: string): string {
    const gardeningTerms = ['förbereda jorden', 'så fröna', 'vattna', 'rensa ogräs', 'skörda'];
    
    let explanation = `Att ${processName} är som att odla i trädgården:\n\n`;
    
    steps.forEach((step, index) => {
      const gardeningTerm = gardeningTerms[index % gardeningTerms.length];
      explanation += `${index + 1}. ${gardeningTerm}: ${step}\n`;
    });
    
    explanation += '\nPrecis som trädgårdsarbete kräver det tålamod, men resultatet blir vackert!';
    
    return explanation;
  }
  
  /**
   * Explains process as building
   */
  private explainAsBuildingProcess(steps: string[], processName: string): string {
    const buildingTerms = ['lägga grunden', 'resa väggarna', 'sätta taket', 'måla', 'flytta in'];
    
    let explanation = `Att ${processName} är som att bygga ett hus:\n\n`;
    
    steps.forEach((step, index) => {
      const buildingTerm = buildingTerms[index % buildingTerms.length];
      explanation += `${index + 1}. ${buildingTerm}: ${step}\n`;
    });
    
    explanation += '\nPrecis som husbygge måste varje steg göras i rätt ordning för bästa resultat!';
    
    return explanation;
  }
  
  /**
   * Explains process as a journey
   */
  private explainAsJourneyProcess(steps: string[], processName: string): string {
    const journeyTerms = ['packa väskan', 'ta sig till stationen', 'resa', 'byta tåg', 'komma fram'];
    
    let explanation = `Att ${processName} är som att göra en resa:\n\n`;
    
    steps.forEach((step, index) => {
      const journeyTerm = journeyTerms[index % journeyTerms.length];
      explanation += `${index + 1}. ${journeyTerm}: ${step}\n`;
    });
    
    explanation += '\nPrecis som en resa tar det tid att komma fram, men vägen dit kan vara intressant!';
    
    return explanation;
  }
  
  /**
   * Explains process as household tasks
   */
  private explainAsHouseholdProcess(steps: string[], processName: string): string {
    const householdTerms = ['förbereda', 'organisera', 'utföra', 'kontrollera', 'avsluta'];
    
    let explanation = `Att ${processName} är som att sköta hushållsarbete:\n\n`;
    
    steps.forEach((step, index) => {
      const householdTerm = householdTerms[index % householdTerms.length];
      explanation += `${index + 1}. ${householdTerm}: ${step}\n`;
    });
    
    explanation += '\nPrecis som hushållsarbete blir det lättare när man gör det steg för steg!';
    
    return explanation;
  }
}

/**
 * Global metaphor generator instance
 */
export const metaphorGenerator = new MetaphorGenerator();