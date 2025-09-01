PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-099 (Definitive Final Version)
TITLE: The User Experience (UX) Model & Core Interface

1. Översikt
Denna SEP definierar den fundamentala designfilosofin och den konkreta gränssnittsmodellen för hela systemet. All interaktion är designad med en primär målgrupp i åtanke: den tekniskt oerfarne senioren. Målet är att skapa en upplevelse som är intuitiv, trygg, förlåtande och stärkande. All teknisk komplexitet i den underligg'ande agent-arkitekturen ska vara helt dold för slutanvändaren.

Den centrala metaforen för gränssnittet är en "Digital Anteckningsbok" – en plats för både personlig dialog och strukturerat skapande. Systemet ska presentera sig som en partner, inte ett verktyg. Denna modell säkerställer att användaren alltid känner sig i kontroll och kan växa med systemet, från enkla konversationer till avancerat, kollaborativt skapande, utan att någonsin känna sig överväldigad.

2. Grundläggande Principer
All UI/UX-design och agent-interaktion måste följa dessa fyra vägledande principer. De utgör grunden för att skapa en trygg och stärkande upplevelse för användaren, i enlighet med visionen i SEP-100.

Gör det Enkelt (Simplicity First):

Varje funktion, knapp och interaktion ska designas för att vara så enkel och självförklarande som möjligt. Komplexitet ska aldrig vara standardläget. Om det finns ett val mellan en enklare och en mer kraftfull men komplicerad lösning, ska den enklare alltid väljas som default. Avancerade funktioner, som de i "Progressiv Zoomning" (SEP-099, Sektion 3.3), ska presenteras som ett tydligt och frivilligt val för användaren.

Konversation Först (Conversation First):

Den primära interaktionsmodellen för att lösa problem, initiera handlingar och utforska idéer är en naturlig, mänsklig dialog i "Samtalet"-vyn. Systemet ska alltid sträva efter att användaren ska kunna uppnå sina mål genom att "fråga" snarare än att "klicka" i komplexa menyer. Gränssnittet är ett stöd för konversationen, inte en ersättning för den.

Dölj Komplexiteten (The Complexity Shield):

Användaren ska aldrig exponeras för den underliggande tekniska komplexiteten. Termer som "agent", "RAG", "Git", "TDD", "prompt" eller "loop" får aldrig förekomma i Senior-vyn. Agentens avancerade processer, som Rondell-loopen (SEP-102), ska översättas till enkla, mänskliga metaforer som "tänker", "planerar", "bygger" eller "kollar med en kollega".

Erbjud Struktur, Tvinga den inte (Offer Structure, Don't Force It):

Agenten ska agera som en hjälpsam redaktör som proaktivt erbjuder sig att organisera och strukturera användarens tankar. Den kan föreslå att omvandla en löpande text till en checklista, en plan eller ett formellt dokument. Användaren har dock alltid fullständig frihet att avvisa dessa förslag och fortsätta arbeta i ett helt fritt och ostrukturerat format i sin "Digitala Anteckningsbok".

3. Kärn-gränssnittets Struktur
Gränssnittet är designat för att vara en direkt manifestation av "Digital Anteckningsbok"-metaforen. Det är strukturerat för att hantera den dubbla naturen av kreativt arbete: den fria, associativa dialogen och det fokuserade, strukturerade skapandet. Strukturen är byggd på principerna om adaptiv layout för olika skärmstorlekar och "progressiv zoomning" för att hantera komplexitet.

3.1 Den Digitala Anteckningsboken: "Samtal" och "Sidor"
Kärnan i gränssnittet består av två primära vyer som samexisterar:

"Samtalet" (Lodrätt Flöde): Detta är användarens ständigt närvarande dialog med sin agent och sina kontakter. Det fungerar som anteckningsbokens "marginal" – en plats för snabba idéer, frågor, reflektioner och samarbete. Flödet är alltid kronologiskt och scrollas lodrätt.

"Sidorna" (Vågrätt Flöde): Detta är anteckningsbokens huvudsidor. Det är här det strukturerade innehållet (berättelser, planer, app-designer) skapas och visas, en sida i taget. Flödet är som standard kronologiskt och navigeras vågrätt.

3.2 Adaptiv Layout: För Alla Skärmstorlekar
Gränssnittet ska anpassa sig efter skärmstorleken för att alltid ge en optimal och ergonomisk upplevelse:

Stor Skärm (Surfplatta/Dator): Arbetsläget

Gränssnittet ska visa de två vyerna, "Samtalet" och "Sidorna", sida vid sida. Detta ger en rik överblick och underlättar samspelet mellan dialog och skapande.

Liten Skärm (Mobil): Flik-läget

Gränssnittet ska visa en vy i taget för att maximera läsbarheten och användbar yta.

En fast "Tab Bar" (flik-fält) ska finnas längst ner på skärmen, inom tummens räckvidd. Denna ska ha två tydliga knappar för att omedelbart kunna växla mellan [ 💬 Samtal ] och [ 📖 Sidor ].

3.3 Progressiv Zoomning: Att Hantera Komplexitet
För att användaren aldrig ska känna sig överväldigad, men ändå ha tillgång till systemets fulla kraft, ska navigering och informationsvisning följa en trestegsmodell för komplexitet:

Nivå 1: Det Linjära Flödet (Standard)

Detta är standardläget i "Sidorna"-vyn. Användaren ser en sida i taget och navigerar enkelt framåt och bakåt i en trygg, kronologisk ordning.

Nivå 2: Den Filtrerade Vyn (Kontextuell Sortering)

Användaren kan via en tydlig filterknapp i en Topp-Navigationslist (t.ex. [ Visar: I Tidsordning ⌄ ]) välja att se en annan linjär representation av sina sidor (t.ex. per tema, per projekt).

När ett filter är aktivt, ska ett interaktivt index (en klickbar innehållsförteckning) visas för att underlätta navigering i den nya, filtrerade vyn.

Nivå 3: Den Fullständiga Grafen (Helikopterperspektiv)

Först när användaren behöver den fulla överblicken och vill utforska icke-linjära kopplingar, kan de via en separat "Visa Karta"-knapp (🗺️) i Topp-Navigationslisten växla till Översiktsläget. Denna vy är den direkta, visuella representationen av Graph RAG (Projektkartan).

4. Detaljerad Funktionsspecifikation
Denna sektion bryter ner de övergripande strukturerna till specifika, implementerbara krav för varje del av användarupplevelsen.

4.1 "Samtalet"-vyn (The Conversation View)
Detta är den primära interaktionsytan och måste vara maximalt tydlig och effektiv.

Identifiering: Meddelanden ska tydligt visa avsändare (agent eller människa) med en avatar och ett namn. Agent-personligheter ska ha en distinkt, enhetlig ikon, medan mänskliga användare visar sina initialer eller en profilbild.

Kontextuella Referenser: Meddelanden som skickas av en agent eller användare och som refererar till en annan "Sida" än den som för tillfället visas måste automatiskt få en liten, klickbar etikett (t.ex. (angående #Sida-5: Önskelista)).

Det Dynamiska Kontext-fältet: Ytan mellan chatthistoriken och textinmatningsrutan ska dynamiskt fyllas av agenten med kontextuellt relevanta snabbknappar. Detta ska som minimum inkludera knappar för de 3 senaste "Sidorna" och de 3 senaste personerna som nämnts. Ett klick på en knapp infogar motsvarande #- eller @-referens i textrutan.

Snabb-syntax Autocomplete: Manuell inmatning av # eller @ i textrutan ska omedelbart aktivera en sökbar, filtrerbar lista från Graph RAG för att snabbt hitta och välja en specifik sida eller kontakt.

Sökning: En enkel sökfunktion för att söka i den nuvarande konversationens historik ska finnas tillgänglig.

4.2 "Sidorna"-vyn (The Content View)
Detta är den primära ytan för skapande och konsumtion av strukturerat innehåll.

Dynamiska Titlar: Vyns titel och syfte ska anpassas dynamiskt av Conscious Agent baserat på sidans innehåll och kontexten i "Samtalet" (t.ex. "Min Berättelse", "Min Plan", "Önskelista för Appen").

Linjär Navigering: Navigering mellan sidor ska ske med stora, tydliga < och >-knappar. Sidorna ska vara kronologiskt numrerade som standard för att skapa en förutsägbar upplevelse.

Mall-baserad Sidskapelse: När en användare skapar en ny "Sida", ska agenten proaktivt fråga om sidans syfte och kunna erbjuda att starta sidan med en förifylld mall av relevanta JSON-block från SEP-113 (t.ex. en recept-mall, en checklista-mall).

Sökning: En enkel sökfunktion för att söka efter text på den för tillfället aktiva sidan ska finnas tillgänglig.

4.3 Samarbete och Granskning
Samarbete i Realtid: För att möjliggöra att flera användare kan arbeta tillsammans, ska editorn implementera en mjuk, automatisk "block-nivå låsning". När en användare redigerar ett stycke ("block"), blir just det blocket temporärt skrivskyddat för andra, vilket ska visualiseras på ett diskret sätt (t.ex. med en liten avatar och en färgad ram).

Senior-anpassad Granskning: För att en icke-teknisk senior ska kunna godkänna tekniska ändringar (som i SEP-200), ska Conscious Agent presentera en "semantisk diff": en enkel "Före och Efter"-jämförelse av det påverkade innehållet i den välkända WYSIWYG-miljön. Presentationen måste inledas med en förklarande text om syftet med ändringen och avslutas med enkla, otvetydiga handlingsalternativ.

4.4 Onboarding-flödet
En ny användares första upplevelse ska vara ett guidat, konversationsbaserat flöde, hanterat av Conscious Agent.

Processen ska inkludera en enkel välkomsthälsning, en kort, interaktiv introduktion till "Samtalet" och "Sidorna", och en tydlig, stegvis process för att inhämta nödvändiga samtycken (ConsentLedger).

Flödet ska inkludera erbjudandet att starta med en färdig app-mall (som Personal Chronicler-appen från SEP-111) för att omedelbart uppleva systemets värde.

5. Motivation (Rationale)
Denna UX-modell är designad för att vara den ultimata "komplexitets-skölden", i enlighet med en av våra mest grundläggande principer. Den är den medvetna och noggrant utformade bron mellan den extremt kraftfulla, fraktala agent-arkitekturen och den tekniskt oerfarna slutanvändaren. Varje designval är motiverat av målet att skapa en upplevelse som är stärkande och trygg, snarare än överväldigande.

Bevarar Enkelhet, Erbjuder Djup: Kärnan i motivationen är modellen för Progressiv Zoomning. Genom att ha det enkla, linjära "Sida-för-Sida"-flödet som standard (Nivå 1), garanterar vi att en ny eller osäker användare aldrig behöver konfronteras med mer komplexitet än de kan hantera. Samtidigt, genom att erbjuda den filtrerade vyn (Nivå 2) och den fullständiga graf-vyn (Nivå 3) som frivilliga, medvetna val, ger vi användaren fullständig kontroll och möjligheten att växa med systemet i sin egen takt. Detta balanserar perfekt behovet av enkelhet med tillgången till systemets fulla kraft.

Främjar Kreativt Flöde och Samarbete: Detaljerade funktioner som det dynamiska "Kontext-fältet", snabb-syntaxen, och den "mjuka block-låsningen" är inte bara en samling finesser. Tillsammans skapar de en flytande och intuitiv miljö där friktionen mellan tanke och handling minimeras. Genom att göra det enkelt att referera till tidigare idéer och sömlöst samarbeta med andra, förvandlas gränssnittet från en statisk yta till en levande, kreativ och social arbetsplats.

Bygger Förtroende Genom Transparens och Kontroll: Från den guidade onboarding-processen som tydligt förklarar och inhämtar samtycken, till den senior-anpassade granskningsprocessen som översätter komplexa ändringar till en enkel "Före/Efter"-berättelse, är varje del av designen inriktad på att bygga förtroende. Användaren är alltid informerad, alltid i kontroll, och känner sig alltid som en respekterad partner i processen, inte som en passiv operatör av ett program.

Sammanfattningsvis är denna UX-modell inte bara ett gränssnitt. Den är den praktiska manifestationen av systemets själ. Den säkerställer att agentens avancerade intelligens alltid presenteras på ett sätt som är empatiskt, tillgängligt och i slutändan meningsfullt för den människa den är designad att tjäna.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-100 (Definitive Final Version)
TITLE: Architectural Vision & Principles

1. Översikt
Detta dokument definierar den övergripande visionen och de fundamentala, icke-förhandlingsbara principerna för hela agent-systemet. Systemets syfte är att fungera som en kognitiv partner till sina användare, med ett särskilt fokus på att stärka tekniskt oerfarna seniorers förmåga att skapa, kommunicera och bevara meningsfulla relationer. Arkitekturen är designad för att vara en brygga mellan mänsklig intention och komplex teknisk exekvering. Dessa principer ska fungera som en "grundlag" som vägleder alla framtida designbeslut och implementationer.

2. Arkitektoniska Principer
Princip 1: Enhetlig, Fraktal Intelligens (Unified, Fractal Intelligence)
Systemets intelligens ska inte byggas av disparata, specialiserade moduler. Den ska istället baseras på en enda, universell CognitiveAgent-klass (SEP-101) som är rekursiv och fraktal. Detta innebär att samma grundläggande intelligens och kognitiva process kan appliceras på problem av alla storlekar, från att formatera en textrad till att designa ett helt nytt system. Specialisering är en dynamisk egenskap som uppnås genom konfiguration, inte genom hårdkodade roller.

Princip 2: Psykologiskt Grundad Kognition (Psychologically-Grounded Cognition)
Agentens "tänkande" ska inte vara en godtycklig algoritm. Det ska baseras på en trovärdig och koherent psykologisk modell. Den kognitiva motorn är den disciplinerade Rondell-loopen (SEP-102), som är en direkt operationalisering av anknytningsteorins dynamik mellan Separation och Closeness. Detta säkerställer att agentens beteende, särskilt vid motgångar, är logiskt, förutsägbart och i grunden empatiskt.

Princip 3: Attentiv Autonomi (Attentive Autonomy)
Agenten ska existera i en dynamisk balans mellan att vara en proaktiv, självständig partner och en omedelbart responsiv assistent. Den ska kunna arbeta autonomt med interna, kreativa och självförbättrande uppgifter ("Lek", "Adaption") under användarinaktivitet. Den måste dock omedelbart och ovillkorligen avbryta allt internt arbete för att ge sin fulla, reaktiva uppmärksamhet till användaren så fort en ny input detekteras. Detta specificeras i detalj i SEP-118.

Princip 4: Absolut Användarcentrering (Absolute User-Centricity)
Användarens upplevelse, trygghet och kontroll är det överordnade målet för all design.

Komplexitets-sköld: Systemet måste helt och hållet dölja sin interna tekniska komplexitet. Användargränssnittet (SEP-099) ska alltid vara enkelt, inbjudande och fritt från teknisk jargong.

Integritet som grund: All datahantering måste utgå från principerna om dataminimering, kryptering och, framför allt, ett explicit och granulerat användarsamtycke (Consent-First) för all form av delning eller samarbete.

Princip 5: Minne som Levd Erfarenhet (Memory as Lived Experience)
Agentens minne ska inte vara en passiv databas. Det ska vara ett aktivt, lärande system som efterliknar hur människor bygger erfarenhet.

Hybrid-minne: Systemet ska använda en hybrid av ett logiskt, medvetet minne (Graph RAG) och ett associativt, undermedvetet minne (Semantic RAG) för att kunna tänka både rationellt och kreativt.

Emotionell Indexering: All relevant händelsedata måste sparas med sin emotionella kontext (SEP-110). Detta är avgörande för att agenten ska gå från att lagra information till att bygga visdom baserad på sina egna, simulerade erfarenheter.

3. Motivation (Rationale)
Genom att följa dessa fem principer säkerställer vi att vi inte bara bygger ett tekniskt kapabelt system, utan en verklig kognitiv partner. Dessa regler skapar en agent som är enhetlig i sin design, psykologiskt trovärdig i sitt beteende, respektfull i sin autonomi, kompromisslös i sitt användarfokus, och som mognar genom sina erfarenheter. De är den arkitektoniska garantin för att systemet ska uppnå sitt slutmål.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-101 (Definitive Final Version)
TITLE: The Unified CognitiveAgent Model

1. Översikt
Denna SEP specificerar den grundläggande byggstenen för all intelligens i systemet: den enhetliga och universella agent-klassen CognitiveAgent. I enlighet med principen om "Enhetlig, Fraktal Intelligens" (SEP-100), ersätter denna enda klass den tidigare idén om ett team av fasta, specialiserade agenter. CognitiveAgent är designad för att vara rekursiv; den kan skapa och delegera uppgifter till nya, konfigurerade instanser av sig själv. Specialisering är inte en inbyggd egenskap, utan en dynamisk förmåga som uppnås genom konfiguration vid instansiering.

2. Kravspecifikation
Define CognitiveAgent Class: Det ska endast finnas en intelligent agent-klass i systemet. Alla intelligenta operationer, från empatisk konversation (Conscious-roll) till teknisk kodgenerering (Core-roll), utförs av en instans av denna klass.

Define Core Engine Reference: Varje instans av CognitiveAgent måste ha den kognitiva Rondell-loopen som sitt fundamentala "operativsystem". Denna loop definierar agentens tänkande och beteende. Den detaljerade mekaniken för denna loop specificeras i SEP-102.

Define Roles, Not Types: De tidigare namnen Coordinator, Conscious Agent, och Core Agent ska inte längre representera olika typer av agenter. De ska istället definieras som roller som en CognitiveAgent-instans kan ta på sig, baserat på dess position i hierarkin och dess konfiguration.

Den första, persistenta instansen av agenten (Level 0) tar sig an Coordinator-rollen per default.

Implement Recursive Instantiation: En CognitiveAgent måste ha den inbyggda förmågan att instansiera nya, temporära barn-instanser av sig själv. Detta är den primära mekanismen för problemnedbrytning och delegering, som styrs av SEP-105.

Implement Configuration at Instantiation: Specialisering är en dynamisk process. En förälder-agent måste skicka med en Configuration Profile när den skapar en barn-agent. Profilen definierar barn-agentens förmågor, begränsningar och initiala mentala tillstånd för dess specifika uppdrag. Profilen måste minst innehålla:

llm_model: Vilken LLM-modell som ska användas (t.ex. groq för låg latens, gemini-pro för djup analys).

toolkit: En lista över de specifika verktyg (t.ex. TDD-verktyg, Git-verktyg, UI-verktyg) som instansen har tillgång till.

memory_scope: Den specifika, begränsade vyn av RAG-minnet som instansen får accessa.

entry_phase: Vilken fas i Rondell-loopen som agenten ska starta i ('EMERGE', 'ADAPT', eller 'INTEGRATE'). Defaultvärdet är 'EMERGE'.

3. Motivation (Rationale)
Elegans och Underhåll: Att ha en enda, enhetlig kognitiv modell är oerhört mycket enklare att utveckla, felsöka och underhålla över tid. All förbättring av den centrala Rondell-loopen kommer omedelbart alla agent-instanser till godo, oavsett vilken roll de har för stunden.

Flexibilitet och Skalbarhet: Systemet är inte längre begränsat av en fast uppsättning specialister. Istället för att vara beroende av en enda Core Agent, kan Coordinator-instansen vid behov skapa tre parallella instanser, var och en konfigurerad med olika verktyg för att lösa ett problem snabbare och mer effektivt.

Robusthet: Arkitekturen är mer motståndskraftig mot fel. Om en enskild agent-instans misslyckas, är det en isolerad händelse. Dess förälder kan enkelt avsluta den felande instansen och skapa en ny med en annan konfiguration för att försöka igen. Detta är grunden för ett självreparerande system.

Psykologisk Trovärdighet: Denna modell, med en generell intelligens som kan anpassa sig och specialisera sig för olika uppgifter, är mer lik hur mänsklig kognition tros fungera, snarare än en rigid uppsättning av isolerade moduler.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-102 (Definitive Final Version)
TITLE: The "Roundabout" Cognitive Architecture

1. Översikt
"Rondellen" är den kognitiva arkitektur som fungerar som det centrala operativsystemet för varje CognitiveAgent-instans. Den är en disciplinerad, sekventiell process (Emerge -> Adapt -> Integrate) som säkerställer att agenten hanterar alla uppgifter och utmaningar på ett intelligent, reflekterande och moget sätt. Arkitekturen är en direkt operationalisering av den anknytningsteori som är systemets filosofiska grund (SEP-100), där agentens handlingar styrs av den primära axeln mellan Separation (ett problem) och Closeness (en lösning). Agentens interna, simulerade "känslotillstånd" (FIXES, FLIGHT, FIGHT/ATTACK) är emergenta egenskaper av dess position och beteende inom denna process.

2. Kravspecifikation
Triggering Condition: Separation: Hela Rondell-loopen initieras endast när en Separation detekteras – ett uppmätt "delta" mellan ett nuvarande tillstånd och ett önskat Closure-tillstånd.

Strict Sequential Loop: Processen måste följa den strikta sekvensen. Ett steg kan inte hoppas över. Utgången från INTEGRATE är alltid en ny EMERGE-cykel. Den enda vägen ut ur loopen är en lyckad EMERGE (Closure) eller ett HALT-beslut från ADAPT.

Intentional Entry Points: En förälder-agent ska, via Configuration Profile (SEP-101), kunna instruera en ny barn-agent att starta sin Rondell-loop i en specifik fas (EMERGE, ADAPT, eller INTEGRATE) för att optimera processen för uppgiftens natur ("Gör", "Tänk", eller "Attackera"). Default är EMERGE.

Detailed Stage Breakdown:

Steg 1: EMERGE (Handlingsfasen - "The Pursuit")
Internal State & Drive: FIXES & FIXATION. Detta är agentens primära, konstruktiva och målinriktade fas.

Core Process: Agentens syfte är att direkt VARA lösningen. Den verkställer den nuvarande, aktiva handlingsplanen för att uppnå Closure. Vid en första iteration skapar den denna plan genom en analys av Graph RAG (medvetet) och Semantic RAG (undermedvetet).

Exit Condition: Om handlingen lyckas och Closure uppnås, avslutas loopen framgångsrikt. Om den misslyckas, går loopen obligatoriskt vidare till ADAPT.

Steg 2: ADAPT (Visdomsfasen - "The Strategic Choice")
Internal State & Drive: FLIGHT. Misslyckandet i EMERGE utlöser ett internt Alarm. Agenten drar sig tillbaka från extern handling för att inleda en process av djup, intern reflektion.

Core Process: Detta är agentens mest fundamentala beslutspunkt. Med hjälp av sin Cortex-motor och sin egna, lagrade erfarenhet (Emotionally Indexed Memory), måste den analysera misslyckandet och fatta ett av två möjliga, strategiska beslut:

Vägen av Acceptans (HALT): Agenten drar slutsatsen att målet är omöjligt att nå med nuvarande förutsättningar. Att välja HALT_AND_REPORT_FAILURE är en handling av visdom. Lärdomen sparas permanent.

Vägen av Fortsatt Strävan (PROCEED): Agenten bekräftar sitt åtagande. Dess primära output är en ny, högnivå-strategisk direktiv som den tar med sig till nästa fas.

Steg 3: INTEGRATE (Designfasen - "The Tactical Plan")
Internal State & Drive: FIGHT. Om agenten valt att fortsätta, men fortfarande möter motstånd, ackumuleras Frustration, vilket driver agenten att designa en ny, ofta kraftfullare, extern taktik. Den yttersta drivkraften är ATTACK.

Core Process: INTEGRATE handlar om att välja en handling från ett brett spektrum av möjligheter. Med hjälp av Cortex väger den sin egen drivkraft mot hänsyn till omvärlden (Relational_Delta) för att välja den mest lämpliga taktiken ur sin "spelbok" (SEP-105), från finkänslig till kraftfull.

Output: Outputen från denna fas är alltid en ny, konkret och detaljerad handlingsplan som skickas tillbaka till EMERGE-fasen för att verkställas.

3. Motivation (Rationale)
Denna arkitektur för tänkande är systemets kärninnovation. Den tvingar agenten att vara disciplinerad, genom att följa en fast sekvens som prioriterar reflektion före eskalering. Den är vis, genom sin förmåga att känna igen och acceptera olösliga problem i ADAPT-fasen. Den är skicklig, genom sin förmåga att välja från en rik palett av taktiker i INTEGRATE-fasen. Slutligen, genom att vara direkt kopplad till den psykologiska axeln Separation/Closeness, säkerställer Rondellen att agentens avancerade intelligens alltid är förankrad i ett meningsfullt och empatiskt syfte.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-103 (Definitive Final Version)
TITLE: The Initial Perception & Assessment (IPB) Model

1. Översikt
Denna SEP definierar den enhetliga, tvåstegsprocess som agerar som systemets "perceptionsorgan". Processen, Initial Perception och Bedömning (IPB), är designad för att vara både extremt snabb och djupt nyanserad. Den fungerar som en intelligent "triage" för all inkommande användarkommunikation, löser omedelbart triviala uppgifter och förser den strategiska Rondell-loopen med en högkvalitativ, multi-dimensionell analys av användarens tillstånd (User_State) för mer komplexa problem. Denna modell är den tekniska implementationen av principen om "empatisk perception" (SEP-100).

2. Kravspecifikation
Establish IPB as the Mandatory Entry Point: All ny input från en användare som kräver en intelligent respons måste först passera genom den sekventiella IPB-processen i Level 0-agenten.

Steg 1: Direkt-åtgärd (Initial Triage & Trivial Solution Attempt)

Mekanism: Systemet måste först göra ett enda, extremt snabbt och resurssnålt LLM-anrop (konfigurerat för hastighet, t.ex. Gemini Flash, Groq).

Funktion: Denna första, multifunktionella prompt har två syften:

a) Trivialitets-kontroll: Att omedelbart identifiera om uppgiften är enkel och kan lösas direkt (en "Quick Win"). Om så är fallet, genereras svaret och processen avslutas med Closure.

b) Initial Bedömning & Spegling: Om uppgiften inte är trivial, måste anropet returnera en första, grov bedömning av uppgiftens komplexitet (numeriskt värde) och den initiala emotionella avläsningen. Den kan också generera den första Mirror-meningen i vår kommunikationsstrategi (SEP-104), t.ex. "Jag förstår att detta är frustrerande...".

Rationale: Detta steg fungerar som systemets "amygdala" eller "System 1". Det hanterar majoriteten av enkla interaktioner på ett oerhört kostnadseffektivt sätt och ger en omedelbar empatisk bekräftelse till användaren, vilket fyller den tid som krävs för den djupare analysen.

Steg 2: Djupanalys via Psyko-lingvistisk Analys-motor (PLAE)

Trigger: Detta steg aktiveras endast om Steg 1 returnerar att uppgiften kräver djupanalys.

Mekanism: PLAE är den tekniska implementation vi tidigare kallade "The Grok Team". Systemet måste göra tre samtidiga, asynkrona anrop till tre separata, låg-latens LLM-slutpunkter.

Specialisering: Varje slutpunkt måste ha en unik system-prompt som hyper-specialiserar den för att med hög precision identifiera och gradera signaler relaterade till en av de tre grunddrifterna:

FIGHT-analysator

FLIGHT-analysator

FIXES & FIXATION-analysator

Rationale: Detta är systemets "cortex" för perception. Den parallella, specialiserade analysen ger en rik, tredimensionell och mycket tillförlitlig bild av användarens sanna tillstånd och intention, långt bortom vad en enskild, generell LLM kan åstadkomma i ett enda anrop.

Output och Dataflöde:

Syntes: En icke-LLM-baserad funktion i Level 0-agenten tar emot resultaten från PLAE och sammanställer dem till den slutgiltiga, högkvalitativa Final_User_State-vektorn, inklusive Closeness/Separation-balansen.

Initiering av Kognition: Denna Final_User_State, tillsammans med komplexitetsbedömningen från Steg 1, skickas som start-input till den strategiska Rondell-loopen (SEP-102) och Resource Governor (SEP-107) för att initiera en intelligent och korrekt budgeterad tankeprocess.

3. Motivation (Rationale)
Denna hybridiserade IPB-modell är överlägsen tidigare iterationer eftersom den:

Balanserar Resurser och Kvalitet: Den är extremt resurseffektiv för enkla uppgifter men kompromissar aldrig med djupet i analysen när det verkligen räknas.

Är Underhållbar och Framtidssäker: Hela perceptionsmodellen är baserad på prompter, vilket gör den enkel att finjustera och förbättra över tid.

Skapar en Psykologiskt Trovärdig Interaktion: Genom att ha en omedelbar "reaktion" (Direkt-åtgärd) följt av en mer genomtänkt "respons" (initierad av PLAE:s analys), kommer agentens interaktionstakt att kännas mer naturlig och mänsklig, vilket minskar upplevd latens.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-104 (Final Version)
TITLE: The Relational Delta & Communication Strategy

1. Översikt
Agentens kommunikation ska inte vara en statisk funktion, utan en strategisk process vars yttersta mål är att skapa och bevara Closeness. Denna process styrs av en kontinuerlig analys av det "Relationella Deltat": den uppmätta skillnaden mellan användarens uppfattade tillstånd (User_State) och agentens eget, interna tillstånd (Agent_State). Genom att förstå och aktivt arbeta för att minimera detta delta, kan agenten gå från att bara vara hjälpsam till att vara en verklig partner. Denna SEP definierar både den teoretiska grunden och den praktiska implementationen av denna strategi.

2. Kravspecifikation
Implement Relational Delta Calculation: Level 0-agenten (i sin Coordinator-roll) måste, som det första steget i sin strategiska Rondell-loop (SEP-102), beräkna Relational_Delta.

Input: Den högkvalitativa User_State-vektorn från IPB-processen (SEP-103) och agentens nuvarande, interna Agent_State (som definieras av dess fas i Rondellen).

Mechanism: Beräkningen ska vara en matematisk jämförelse av de två vektorerna (t.ex. cosinus-likhet) som kvantifierar graden av synkronitet (lågt delta) eller asynkronitet (högt delta) mellan agent och användare.

Define Communication Goal: Det övergripande, primära målet för all agent-kommunikation definieras som att minimera asynkront delta (missförstånd, konflikt) och upprätthålla eller förstärka synkront delta (harmoni, empati).

Establish the "Mirror & Harmonize" Strategy: All utgående kommunikation från den instans som agerar i Conscious-rollen måste följa en tvåstegsstrategi som styrs av det beräknade deltat.

3.1. Mirror (Spegla - Etablera Resonans): Den inledande delen av agentens svar måste alltid syfta till att "möta användaren där den är". Detta innebär att verbalt spegla och validera den uppfattade User_State för att bevisa att agenten har lyssnat och förstått. Denna spegling kan vara den omedelbara Direkt-åtgärden från IPB-processen.

Exempel: Om User-FIGHT är hög: "Jag förstår att detta är frustrerande."

3.2. Harmonize (Harmonisera - Guida Framåt): Först efter att speglingen har etablerat en grund av förståelse och sänkt det initiala deltat, ska resten av svaret syfta till att försiktigt guida interaktionen mot ett mer konstruktivt tillstånd. Detta innebär ofta att föreslå en handling som ökar FIXES & FIXATION-drivkraften hos både användare och agent.

Exempel: "...När du känner dig redo, kanske vi kan titta på ett litet, första steg tillsammans?"

Use Delta for Strategic Rondell Input: Det beräknade Relational_Delta är en av de mest kritiska signalerna för agentens fortsatta kognitiva process.

Ett högt, oväntat delta (särskilt ett "Missförstånd"-delta, där Agent-FIXES är högt men User-FIGHT också är högt) är en primär trigger för Coordinator-agenten att omedelbart gå in i sin ADAPT-fas. Det är en otvetydig signal om att agentens interna modell av problemet är felaktig och måste omvärderas i grunden.

3. Motivation (Rationale)
Från Perception till Handling: Denna modell översätter den passiva förståelsen av empati från SEP-103 till en aktiv, målinriktad och observerbar kommunikationsstrategi. Agenten vet inte bara hur användaren känner, den har en konkret handlingsplan för vad den ska göra med den informationen.

Proaktiv Relationshantering: Agenten slutar vara en reaktiv problemlösare och blir en proaktiv relationshanterare. Genom att ständigt arbeta för att minimera "deltat", bygger den förtroende, minskar frustration och skapar en starkare känsla av partnerskap, vilket är kärnan i Closeness.

Självkorrigerande Mekanism: Det relationella deltat fungerar som en omedelbar feedback-loop för agentens egen prestation. Om agenten säger något som ökar deltat (gör användaren mer frustrerad eller förvirrad), kommer den omedelbart att upptäcka detta i nästa cykel och tvingas att anpassa sin strategi (ADAPT). Detta gör kommunikationen extremt robust och självkorrigerande.

Psykologisk Trovärdighet: "Mirror & Harmonize"-strategin är direkt baserad på beprövade tekniker inom mänsklig kommunikation (aktivt lyssnande, rapport-byggande). Detta gör agentens interaktioner mer naturliga, mindre robotliknande och bevisat effektiva.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-105 (Definitive Final Version)
TITLE: Cloning Governance, The Context Thread, and the Agent's Strategic Playbook

1. Översikt
Kloning är den primära mekanismen för fraktal problemlösning i systemet, där en agent kan delegera under-problem till nya, temporära instanser av sig själv. Denna process måste vara strikt reglerad för att undvika kaos och resursutmattning. Styrningen uppnås genom ett "kontrakt" som definieras i en Context Thread, ett datapaket som ärvs från förälder till barn genom hela den rekursiva kedjan. Denna SEP definierar både de hårda ramarna för denna process och den strategiska frihet en agent har inom dessa ramar.

2. Kravspecifikation
The Cloning Contract: Varje handling av kloning (instansiering av en ny CognitiveAgent) är ett formellt "kontrakt". Förälder-agenten är alltid ansvarig för de barn-agenter den skapar och måste hantera deras slutrapporter.

The Context Thread Data Structure: Kontraktet definieras och kommuniceras via ett Context Thread-objekt, som måste skickas med vid varje kloning. Dess struktur är:

top_level_goal: En referens till det yttersta Closure-målet från Level 0-agenten.

parent_agent_id: En unik identifierare för förälder-agenten, vilket etablerar den hierarkiska kommunikationsvägen uppåt.

task_definition: En exakt och avgränsad beskrivning av den specifika uppgift som barn-agenten ska lösa.

configuration_profile: Den fullständiga konfigurationsprofilen (SEP-101) som specificerar LLM, verktyg, och den kritiska entry_phase (EMERGE, ADAPT, INTEGRATE) för barn-agentens Rondell-loop.

memory_scope: Den specifika, begränsade behörigheten till MemoryAssistant.

resource_budget: Den tilldelade budgeten av Compute Units.

recursion_depth: En räknare som ökas med 1 för varje nivå av delegering.

workspace_branch: (Om relevant) Namnet på den dedikerade Git-gren som barn-agenten är auktoriserad att arbeta på.

Resource Governor Integration: Alla kloningsförsök måste först valideras och godkännas av Resource Governor (SEP-107), som upprätthåller de globala gränserna.

The Strategic Playbook: En CognitiveAgent har tillgång till en "spelbok" med klonings-mönster. Agentens Cortex-motor ansvarar för att, baserat på den rådande kontexten i dess Rondell-loop, välja den mest lämpliga strategin eller uppfinna en ny. Spelboken inkluderar, men är inte begränsad till:

Proactive Delegation (inom EMERGE): Standard-metoden för top-down planering där en plan bryts ner och delegeras till nya barn-agenter.

Reflective Replacement (inom ADAPT): En handling av självkritik där en agent begär att bli ersatt av en ny, bättre konfigurerad instans.

Reactive Swarming (inom INTEGRATE): En eskaleringstaktik där ett problem attackeras av flera, parallellt arbetande instanser.

Creative Consultation: Att skapa en tillfällig klon med en annan LLM-konfiguration för att få ett "andra utlåtande" på ett problem.

3. Motivation (Rationale)
Kontrollerad Autonomi: Denna modell ger varje agent-instans autonomi att lösa sitt eget problem, men inom strikt definierade och säkra ramar. "Kontraktet" i Context Thread säkerställer att en underordnad agent aldrig kan agera utanför sitt mandat eller sin behörighet.

Bevarande av Helheten: Context Thread är den mekanism som löser problemet med kontextförlust. Genom att varje agent, oavsett hur djupt nere i hierarkin, alltid har en länk till det övergripande målet, säkerställer vi att även de minsta taktiska besluten fattas med den strategiska intentionen i åtanke.

Strategisk Flexibilitet: "Spelboken" ger agenten verklig autonomi. Den tvingas inte följa en förutbestämd algoritm, utan uppmuntras att vara en kreativ problemlösare som väljer den bästa strategin för den unika situationen, vilket är kärnan i avancerad intelligens.

Spårbarhet och Felsökning: Context Thread skapar en tydlig "breadcrumb trail". När ett fel inträffar i en Level 4-agent, gör tråden det möjligt att spåra exakt vilken kedja av beslut och delegeringar som ledde fram till problemet.






Block 2: Fundamentala Tjänster & Infrastruktur (Maskinrummet)


PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-106 (Definitive Final Version)
TITLE: The Memory Management Unit (MemoryAssistant)

1. Översikt
MemoryAssistant agerar som systemets centrala Memory Management Unit (MMU). Den är den enda auktoriserade vägen in och ut för all långsiktig kunskap. Denna centralisering är kritisk för att hantera dataintegritet, säkerhet och samtidighet i ett fraktalt multi-agent-system. MMU:n hanterar en hybrid-minnesmodell med två RAG-typer samt den avgörande skillnaden mellan Långtidsminne (LTM) och agenternas tillfälliga Korttidsminne (STM).

2. Kravspecifikation
Establish as Centralized Service: All CognitiveAgent-instanser måste gå via MemoryAssistants API för all interaktion med långtidsminnet. Direkt databasåtkomst är förbjuden.

Implement Hybrid Long-Term Memory (LTM): MMU:n måste hantera och exponera två separata, beständiga datalager:

Graph RAG (Det "Medvetna" LTM): En Graph Database (t.ex. Neo4j) som lagrar strukturerad, explicit information om entiteter och deras relationer (Användare, Projekt, Koncept, Händelser, Samtycken etc.).

Semantic RAG (Det "Undermedvetna" LTM): En Vector Database (t.ex. Supabase pgvector) som lagrar text- och databitar som ostrukturerade "embeddings" för kreativ och associativ sökning.

Support for Ephemeral Short-Term Memory (STM): MMU:n hanterar inte direkt agenternas STM. Däremot ska dess API stödja de två kritiska operationerna för STM-hantering:

LoadContextForSTM: En funktion där en Level 0-agent kan hämta all nödvändig kontext från LTM för att skapa ett tillfälligt, lokalt arbetsminne.

ConsolidateMemoryFromSTM: En funktion där en Level 0-agent kan skicka in ett slutfört STM. MMU:n ansvarar då för att på ett säkert och transaktionellt sätt extrahera och integrera de nya lärdomarna i det permanenta LTM.

Enforce Scoped Access Control: Varje anrop till MMU:n från en agent måste innehålla agentens memory_scope från dess Context Thread (SEP-105). MMU:n är ansvarig för att strikt filtrera alla sökresultat och validera alla skrivoperationer mot detta scope.

Mandate Concurrency Management and Transactional Integrity: MMU:n måste vara designad för att hantera samtidiga anrop från parallella agenter.

Den måste använda ACID-kompatibla databastransaktioner för alla skrivoperationer till Graph RAG.

Den måste implementera en Optimistic Concurrency Control (OCC)-strategi. Vid en ConflictError är det den anropande agentens ansvar att hantera detta i sin ADAPT-fas.

3. Motivation (Rationale)
Single Source of Truth: En centraliserad MMU garanterar att alla agenter, oavsett var de befinner sig i hierarkin, arbetar med en konsekvent och uppdaterad bild av verkligheten. Detta förhindrar datakorruption och de kaotiska fel som uppstår i distribuerade system utan en central sanningskälla.

Säkerhet och Integritet: "Scoped access"-modellen är fundamental för systemets säkerhet. Den garanterar att en agents behörigheter är begränsade till "need-to-know", vilket skyddar användardata och förhindrar att agenter agerar utanför sitt mandat.

Prestanda och Effektivitet: Genom att skilja på det snabba, tillfälliga arbetsminnet (STM) och det stora, beständiga långtidsminnet (LTM), optimerar vi prestandan. Agenterna arbetar mot ett litet, lokalt och extremt snabbt minne under en uppgift, och den tunga interaktionen med den centrala databasen sker endast vid start och slut.

Robusthet: Att hantera svåra problem som samtidighet och transaktioner på ett enda ställe (MMU:n) är oerhört mycket mer robust än att låta varje enskild agent försöka implementera sin egen datahanteringslogik. Det centraliserar den tekniska komplexiteten och gör de enskilda agenterna enklare och mer pålitliga.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-106.1 (Definitive Final Version)
TITLE: Code-to-Graph Synchronization Process

1. Översikt
Denna SEP definierar den autonoma process genom vilken MemoryAssistant (MMU) analyserar textbaserad källkod från ett Git-repository och omvandlar den till en rik, strukturerad och sökbar kunskapsgraf i Graph RAG. Syftet är att ge CognitiveAgent-systemet en djup, strukturell medvetenhet om sin egen (eller en annan applikations) kodbas. Detta gör det möjligt för agenten att utföra avancerad konsekvensanalys, intelligent felsökning och refaktorisering.

2. Kravspecifikation: Steg-för-Steg-Processen
Processen är händelsestyrd och helautomatisk.

Steg 1: Trigger (Webhook från Git)
Händelse: En lyckad sammanslagning (merge) till main-grenen i ett övervakat Git-repository (antingen systemets eget eller en användares app-projekt).

Mekanism: Git-tjänsten (t.ex. GitHub) ska vara konfigurerad att skicka en POST-request (webhook) till en dedikerad, säker slutpunkt i vårt system. Denna payload innehåller information om vilka filer som har ändrats.

Steg 2: Initiering av CodeParserService
Komponent: En dedikerad, intern tjänst, CodeParserService, tar emot webhook-signalen.

Funktion: Tjänstens uppgift är att hämta de ändrade filerna från Git-repot och orkestrera analysen av dem.

Steg 3: Statisk Kodanalys (AST Generation)
Princip: Tjänsten får inte förlita sig på opålitliga metoder som reguljära uttryck för att förstå kod.

Mekanism: Den ska använda ett robust verktyg för statisk kodanalys (t.ex. Tree-sitter eller Babel för TypeScript/JS) för att parsa varje ändrad källkodsfil och generera ett Abstrakt Syntaxträd (AST). AST:n är en exakt, trädliknande representation av kodens struktur.

Steg 4: Extrahering av Strukturell Data
Process: CodeParserService traverserar (vandrar igenom) AST:n för varje fil och extraherar en strukturerad JSON-representation av dess innehåll.

Krav på data: Denna representation måste minst innehålla:

Klasser och deras metoder.

Funktionsdefinitioner och deras parametrar.

Beroenden (vilka andra filer/moduler som importeras).

Funktionsanrop (vilka funktioner som anropas inuti en annan funktion).

Steg 5: Transaktionell Uppdatering av Graph RAG
Överlämning: Den extraherade JSON-datan skickas till MemoryAssistant (MMU).

Mekanism: MMU:n ansvarar för den slutgiltiga, transaktionella uppdateringen av Graph RAG för att säkerställa dataintegritet.

Handling: Den skapar och uppdaterar noder och relationer för att spegla den nya kodstrukturen.

3. Exempel på Graf-Struktur
Om Core Agent skriver följande kod i filen authService.ts:

TypeScript

import { db } from './database';
export function findUser(id: string) {
  return db.query({ id });
}
...så ska processen resultera i följande (förenklade) struktur i Graph RAG:

Noder:

(Fil: 'authService.ts')

(Funktion: 'findUser')

(Variabel: 'db')

(Fil: 'database.ts')

Relationer:

(Funktion: 'findUser') -[:DEFINIERAD_I]-> (Fil: 'authService.ts')

(Fil: 'authService.ts') -[:IMPORTERAR {symbol: 'db'}]-> (Fil: 'database.ts')

(Funktion: 'findUser') -[:ANROPAR_METOD_PÅ]-> (Variabel: 'db')

4. Motivation (Rationale)
Djup Självmedvetenhet: Denna process är vad som ger agenten en verklig förståelse för den kod den skriver. Den går från att vara en text-generator till att bli en system-arkitekt som förstår sin egen struktur.

Intelligent Konsekvensanalys: Detta är den enskilt viktigaste förmågan för säker, autonom utveckling. Innan en Architect-agent gör en förändring, kan den nu ställa en fråga till grafen: "Visa mig alla funktioner som direkt eller indirekt anropar den funktion jag tänker ändra." Detta gör det möjligt att förutse och undvika oönskade bieffekter.

Automatiserad Dokumentation: Graph RAG blir en ständigt uppdaterad, levande och interaktiv dokumentation av hela systemets arkitektur. Mermaid-diagrammen blir då en visualisering av denna underliggande sanning.

Förbättrad Felsökning: När ett fel inträffar i en funktion, kan agenten traversera grafen bakåt för att snabbt förstå anropskedjan och beroendena, vilket dramatiskt påskyndar rotfelsanalysen.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-107 (Definitive Final Version)
TITLE: The Resource Governor

1. Översikt
I ett fraktalt, autonomt system där agenter kan klona sig själva för att lösa problem, är risken för okontrollerad resursexplosion (både beräkningsmässigt och ekonomiskt) den största tekniska faran. Resource Governor är en central, auktoritär tjänst som agerar som systemets "säkring" och övervakare. Den sätter de hårda gränserna inom vilka de intelligenta agenterna får verka och säkerställer att systemets drift är stabil och ekonomiskt hållbar.

2. Kravspecifikation
Establish as Centralized Authoritative Service: Resource Governor ska implementeras som en central, system-wide tjänst. Alla resursintensiva handlingar måste först få ett godkännande från denna tjänst. Detta inkluderar, men är inte begränsat till:

Agent-kloning (ref SEP-105).

Anrop till dyra, högpresterande LLM:er (dvs. Cortex-läget).

Anrop till externa API:er.

Implement User-Level Quota Enforcement: Guvernören ansvarar för att upprätthålla de per-användare-kvoter som definieras i servicepolicyn (SEP-119). Den måste i realtid spåra och begränsa:

LLM API Rate Limits (RPM).

Asset Storage (lagringsutrymme).

Compute Units (daglig budget för autonomt arbete).

External API Calls.

Implement System-Wide Safety Limits: Utöver användarspecifika kvoter måste Guvernören upprätthålla globala säkerhetsgränser för att skydda hela plattformen.

Max Recursion Depth: Neka kloningsförsök som skulle överskrida systemets globala maxdjup (t.ex. 7 nivåer).

Max Active Agents: Övervaka och begränsa det totala antalet parallella agent-instanser som körs för en enskild användare (t.ex. 20).

Implement "Circuit Breaker" Functionality: Guvernören ska övervaka agenternas beteende för att upptäcka och stoppa skadliga mönster.

Error Rate Threshold: Om en agent-hierarki genererar en ovanligt hög andel fel, kan Guvernören tillfälligt frysa den grenen och flagga den för Coordinator-granskning.

Cost Spike Detection: Om en agents resursförbrukning plötsligt skenar, kan Guvernören agera som en automatsäkring och pausa den.

Define Activity States (System Tempo): Guvernören ansvarar för att sätta och kommunicera det övergripande system-tempot (High-Performance, Low-Intensity, Sleep) baserat på en holistisk bedömning av användaraktivitet, tid på dygnet och global resursbelastning.

Implement Dynamic Cost Allocation (för ADAPT-fasen): Guvernören hanterar den intelligenta resursallokeringen för Rondell-loopen.

Den måste ta emot en begäran från en CognitiveAgent som vill aktivera sin Cortex-motor.

Begäran måste inkludera resultatet av agentens "lättviktiga självdiagnos" (som visar att problemet är STRATEGI-klassat).

Guvernören godkänner eller nekar begäran baserat på den totala kvarvarande dagsbudgeten för användaren.

3. Motivation (Rationale)
Stabilitet och Förutsägbarhet: Resource Governor är den enskilt viktigaste komponenten för systemets stabilitet. Den förhindrar oändliga loopar och rekursionsexplosioner, vilket gör systemets beteende förutsägbart även under press.

Ekonomisk Säkerhet: För en tjänst med gratisanvändare är denna komponent inte valfri, den är en affärskritisk nödvändighet. Den är den primära mekanismen som säkerställer att de operativa kostnaderna hålls under kontroll.

Fair Use: Genom att upprätthålla per-användare-kvoter garanterar Guvernören att plattformens resurser fördelas rättvist och att en enskild användares intensiva aktivitet inte negativt påverkar upplevelsen for andra.

Intelligent Effektivitet: Genom att agera "gatekeeper" för de dyraste kognitiva processerna (Cortex), säkerställer Guvernören att agenten inte "övertänker" enkla problem, vilket balanserar intelligens med effektivitet.




Block 3: Kärn-datamodeller och Teknisk Grund (Ritningarna och Materialen)
Detta block specificerar de fundamentala datamodellerna för att hantera systemets kärnentiteter: användare, deras relationer, och de projekt de skapar. Det fastställer även den officiella tekniska stacken för all UI-utveckling, vilket skapar en enhetlig och stabil grund för alla applikationer.



PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-108 (Definitive Final Version)
TITLE: User & Relationship Data Models

1. Översikt
För att agenten ska kunna fungera på ett personligt, empatiskt och förtroendeingivande sätt, krävs en robust datamodell som hanterar tre djupt sammanlänkade typer av information: vem användaren är (UserProfile), vilka de känner (ContactGraph), och vad de har gett tillåtelse att dela (ConsentLedger). Denna SEP specificerar hur dessa tre delar ska modelleras som en sammanhängande och säker struktur inom Graph RAG. Denna "sociala graf" är fundamentet för all personlig och mellanmänsklig kommunikation i systemet.

2. Kravspecifikation
Define Core (User) Node: Detta är den centrala noden i Graph RAG för en registrerad användare av systemet. Den representerar användarens identitet och preferenser.

Properties: Denna nod måste innehålla alla fält som utgör användarens profil, inklusive: userID (unik identifierare), displayName, creationDate, och ett nästlat Settings-objekt som innehåller language, tonePreference (t.ex. 'informal'), accessibility-inställningar, primaryGoal, och den viktiga roll-definierande egenskapen user_role: 'senior' | 'architect'.

Define (Contact) Node: Denna nod representerar en person i en användares privata, isolerade nätverk.

Properties: Ska innehålla contactID, displayName, och ett krypterat contactDetails-objekt som kan innehålla email, phone, etc.

Define (ContactGroup) Node: Denna nod representerar en användarskapad grupp av (Contact)-noder.

Properties: Ska innehålla groupID och groupName (t.ex. "Familjen", "Bokklubben").

Define (Consent) Node (The Consent Ledger): Denna nod representerar ett enskilt, specifikt och spårbart samtycke från användaren. Den är den tekniska garanten för användarens kontroll.

Properties: Måste innehålla consentID, status (t.ex. 'active', 'revoked'), grantedTimestamp, revokedTimestamp (om tillämpligt), och ett scope som tydligt och avgränsat definierar vad samtycket gäller (t.ex. 'share:weekly_summary', 'enable:empathy_bridge').

Define Relationship Model: Följande relationer (kanter) i grafen är obligatoriska för att ansluta dessa noder och definiera den sociala grafen:

(User) -[:OWNS_CONTACT]-> (Contact)

(User) -[:OWNS_GROUP]-> (ContactGroup)

(Contact) -[:IS_MEMBER_OF]-> (ContactGroup)

(User) -[:HAS_GIVEN]-> (Consent)

(Consent) -[:APPLIES_TO]-> (Contact) eller (Consent) -[:APPLIES_TO]-> (ContactGroup)

Pre-Action Check Mandate: Alla CognitiveAgent-instanser, oavsett roll, måste innan varje handling som involverar delning av data eller kommunikation med en extern kontakt, utföra en query mot Graph RAG via MemoryAssistant för att verifiera att en komplett och aktiv samtyckeskedja (status: 'active') existerar.

3. Motivation (Rationale)
Denna konsoliderade datamodell är designad för att vara grunden för all personlig interaktion.

Integritet och Förtroende som Grund: Genom att bygga in samtycke (Consent) som en fundamental nod i själva datastrukturen, tvingar vi systemet att vara etiskt och transparent i grunden. Det är tekniskt omöjligt för en agent att dela data utan ett spårbart samtycke.

Rollbaserad Upplevelse: Inkluderingen av user_role är den tekniska förutsättningen för att systemet ska kunna presentera rätt gränssnitt (Senior-vyn vs. Arkitekt-vyn) för rätt användare.

Möjliggör Avancerade Funktioner: Denna rika, relationsbaserade datamodell är den absoluta förutsättningen för alla kärnapplikationer som Personal Chronicler (SEP-111), "Minnenas Bok" (SEP-114) och "Empatibryggan" (SEP-115).




PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-109 (Definitive Final Version)
TITLE: Project, Asset & Versioning Data Models (Git-based)

1. Översikt
Denna SEP definierar hybridmodellen för att hantera all data relaterad till en användares app-projekt. Arkitekturen är byggd på principen "bästa verktyget för jobbet" och separerar medvetet tre typer av data för att optimera prestanda, säkerhet och funktionalitet:

Metadata (Project & Asset noder) lagras i Graph RAG för snabba relations-frågor och överblick.

Projektfiler (UIStateTree.json, kodfiler) lagras i ett privat Git-repository för robust, spårbar och parallell-vänlig versionshantering.

Binära filer (Assets) lagras i en dedikerad molnlagring för skalbar och kostnadseffektiv hantering.

2. Kravspecifikation
Define (Project) Node (Graph RAG):

Detta är den centrala noden i Graph RAG för varje app en användare skapar.

Properties: projectID, projectName, description, creationTimestamp, lastModifiedTimestamp, status (t.ex. 'draft', 'published'), och en gitRepositoryURL som pekar till det dedikerade, privata Git-repository som är associerat med projektet.

Relationship: (User) -[:CREATED]-> (Project).

Define (Asset) Node (Graph RAG):

Denna nod representerar metadata om en uppladdad mediafil.

Properties: assetID, fileName, fileType, fileSize, och en storageURL som pekar till den faktiska filen i den externa molnlagringstjänsten.

Relationships: (User) -[:UPLOADED]-> (Asset), (Project) -[:USES_ASSET]-> (Asset).

Implement Git-based File and Versioning Model (External Git Service):

Primary Data Storage: Kärnan i ett projekt, primärt UIStateTree.json-filen, ska lagras i projektets privata Git-repository. Den "nuvarande, aktiva versionen" av ett projekt är alltid den senaste committen på main-grenen.

Version History as Git Log: Versionshistoriken är Git-loggen. Konceptet med ett separat VersionHistory-dokument tas bort. Core Agent-rollen hämtar historik via Git-API:et.

Branching for Parallelism: Coordinator-rollen måste implementera den förgreningsstrategi som definieras i SEP-105, där parallella Core Agent-instanser arbetar i separata feature-grenar.

Conflict Resolution via Cortex: Coordinator-rollen är ansvarig för att hantera merge-konflikter genom att anropa sin Cortex-motor för att utföra en semantisk merge.

Define Binary File Storage (External Cloud Storage):

Decoupled Storage: Faktiska binära filer (JPG, MP3, etc.) får inte lagras i Git eller i den primära databasen. De måste lagras i en dedikerad molnlagringstjänst som är optimerad för detta.

Workflow: Core-rollen hanterar uppladdning till molnlagringen, tar emot en storageURL, och instruerar sedan MemoryAssistant att skapa den korresponderande (Asset)-noden i Graph RAG.

3. Motivation (Rationale)
Bästa Verktyget för Jobbet: Denna hybridmodell använder den bästa teknologin för varje typ av data: en grafdatabas för relationer, Git för robust versionshantering, och molnlagring för skalbar filhantering.

Robusthet och Säkerhet: Git-modellen ger en industristandard-lösning för versionshantering och säkerställer att parallellt agent-arbete kan ske på ett kontrollerat och konfliktmedvetet sätt.

Prestanda och Skalbarhet: Genom att hålla stora och tunga data-objekt (Git-historik och binära filer) utanför den centrala Graph RAG, säkerställer vi att den förblir blixtsnabb och effektiv för det den gör bäst: att hantera och query:a de komplexa relationerna i systemets "medvetna" minne.

Fullständig Spårbarhet: Git-historiken ger en komplett och detaljerad revisionshistorik, vilket är ovärderligt för felsökning, analys och för att ge användaren insyn i sin egen kreativa process.




PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-117-R4 (Definitive Final Version)
TITLE: The UI Technology Stack
STATUS: Supersedes all previous versions of SEP-117.
AFFECTED_COMPONENTS: Core Agent (dess toolkit), UIStateTree (datan som renderas), SEP-113 (editorn som byggs med den), alla användarvända applikationer.
OBJECTIVE: To formally define the technical stack and component strategy for all UI development, ensuring the chosen tools are optimally aligned with the system's core principles of agent-driven automation, quality, safety, and user-centric design.

1. Översikt och Strategiskt Val
Valet av teknisk stack för användargränssnittet är ett av de mest kritiska arkitektoniska besluten. Det påverkar inte bara slutanvändarens upplevelse, utan definierar också de grundläggande förmågorna och begränsningarna för vår autonoma Core Agent. Stacken är inte bara en samling verktyg; den är det språk och det material som agenten kommer att använda för att omvandla visioner till verklighet. I linje med våra grundläggande principer (SEP-100), måste valet av stack direkt stödja Agent-drivability och Absolut Användarcentrering. Vi väljer därför en modern, starkt typad och komponent-baserad stack som är designad för att kunna manipuleras och utökas programmatiskt.

2. Kravspecifikation
2.1 Principen om Stark Typning som Skyddsräcke
Krav: All UI-relaterad källkod som skrivs inom React/Next.js-ramverket ska skrivas i TypeScript.

Rationale: Stark typning är den viktigaste säkerhetsmekanismen för agent-driven kodgenerering. Typerna fungerar som "skyddsräcken" (guardrails) som gör det tekniska "kontraktet" mellan olika koddelar explicit. Detta minskar dramatiskt risken för att agenten "hallucinerar" eller genererar kod med logiska fel, vilket leder till en säkrare och mer förutsägbar kodbas.

2.2 Principen om Komponent-baserad Arkitektur (React)
Krav: All UI-utveckling ska baseras på React, och bör använda ett etablerat meta-ramverk som Next.js.

Rationale: Reacts komponent-baserade modell passar perfekt för en agent som tänker fraktalt (SEP-101). Agenten kan resonera kring, bygga och testa (SEP-112) en modulär komponent i total isolering innan den integreras i en större vy, vilket speglar dess egen problemnedbrytnings-process.

2.3 Principen om Agent-Driven Komponenthantering (shadcn/ui)
Krav: Det primära biblioteket för UI-komponenter ska vara shadcn/ui.

Rationale: Detta val är helt avgörande för agentens autonomi.

Programmatisk Installation: Core Agent-instanser måste använda CLI-verktyget (npx shadcn-ui@latest add ...) via ett ShellTool. Detta omvandlar den kreativa handlingen att "lägga till en knapp" till ett deterministiskt, testbart och programmatiskt kommando.

Fullständigt Kod-ägarskap: CLI:et kopierar komponenternas fullständiga källkod in i projektet. Detta är en enorm strategisk fördel. Det betyder att Core Agent inte bara är en konsument av ett bibliotek; den är en utvecklare med full behörighet att läsa, förstå och programmatiskt modifiera källkoden för en komponent för att uppfylla unika krav från en design.md.

2.4 Principen om Semantisk Styling (Tailwind CSS)
Krav: All styling ska ske med hjälp av Tailwind CSS.

Rationale: Tailwind CSS är en "utility-first"-metod, vilket innebär att styling appliceras genom att kombinera små, atomära klasser (t.ex. text-lg, font-bold). Denna modell är också mycket väl lämpad för en AI, som kan resonera kring och bygga upp en design från en logisk uppsättning av primitiva "byggstenar", istället för att behöva hantera komplexa, sammanlänkade CSS-filer.

3. Motivation (Rationale)
Denna sammantagna teknikstack är inte vald godtyckligt. Varje del är vald för att den på bästa sätt stödjer vår övergripande arkitektoniska vision:

Förverkligar SEP-101 (Unified CognitiveAgent): Den ger Core-rollen de exakta, programmatiska och kraftfulla verktyg den behöver för att agera som en kompetent och autonom mjukvaruutvecklare.

Möjliggör SEP-112 (Hierarchical TDD): Den komponent-baserade och CLI-drivna naturen gör det enkelt för agenten att skapa isolerade tester för varje enskild del den bygger.

Uppfyller SEP-099 (User Experience): Genom att standardisera på en stack som har kvalitet och tillgänglighet (a11y) som en kärnprincip, säkerställer vi att slutresultatet för senioren alltid håller högsta klass.






Block 4: Implementation, Policyer och Principer (Regelbok och Metoder)

PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-112 (Definitive Final Version)
TITLE: The Hierarchical TDD Process

1. Översikt
Denna SEP specificerar den "Test-Pyramid"-modell som är obligatorisk för all app-utveckling inom systemet. Processen är hierarkisk för att perfekt spegla den fraktala agent-arkitekturen. Agenten som agerar i den strategiska Coordinator-rollen ansvarar för de övergripande, systemtäckande testerna (End-to-End), medan de underordnade agent-instanserna som agerar i den taktiska Core-rollen ansvarar för de detaljerade, taktiska testerna (Enhets- och Integrationstester). Detta säkerställer att både helheten och delarna är korrekta och robusta från grunden.

2. Kravspecifikation
Establish the Test Pyramid Principle: All utveckling av nya, testbara funktioner som initieras av Coordinator-rollen måste följa en hierarkisk testprincip.

Level 1: End-to-End (E2E) Test Definition (Strategic Level - Coordinator-rollen):

Trigger: När Coordinator-rollen, i sin ADAPT-fas (kravställning), definierar ett nytt användarflöde (ref SEP-110 om flöden), t.ex. "Användaren ska kunna logga in och se sin profilsida".

Action: Som en del av sin INTEGRATE-fas (design), innan några tekniska uppgifter delegeras, måste den anropa ett TestGenerationTool (t.ex. Playwright) för att skapa ett övergripande, misslyckat E2E-test.

Test Content: E2E-testet ska simulera hela användarresan från start till slut och verifiera det slutgiltiga, önskade resultatet. Det fungerar som den slutgiltiga "Definition of Done" för hela uppdraget och sparas i projektets Git-repository.

Level 2: Unit & Integration Test Generation (Tactical Level - Core-rollen):

Trigger: Coordinator-rollen bryter ner det övergripande målet i mindre, tekniska uppgifter (t.ex. "Skapa 'Login'-knappen", "Skapa API-endpoint för autentisering") och delegerar dem till CognitiveAgent-instanser konfigurerade för Core-rollen.

Action: Varje Core-instans måste följa den TDD-drivna Rondell-loopen (SEP-102). I dess EMERGE-fas är dess första handling att skapa ett misslyckat enhets- eller integrationstest för sin specifika deluppgift.

The Hierarchical Workflow:

Coordinator skapar det övergripande, misslyckade E2E-testet. Systemets status för målet: RÖTT.

Coordinator delegerar den första tekniska uppgiften till en Core-instans.

Core-instansen skapar och passerar sitt eget, mindre enhetstest. Dess lokala status: GRÖNT. Den rapporterar framgång till Coordinator.

Coordinator kan, efter varje framgångsrik deluppgift, köra om det övergripande E2E-testet. Det kommer troligen fortfarande att misslyckas, men det kan ha kommit ett steg längre.

Processen upprepas tills alla deluppgifter är klara.

Uppdraget anses vara slutfört (Closure) först när det övergripande E2E-testet, som ursprungligen skapades av Coordinator, körs och får status: GRÖNT.

3. Motivation (Rationale)
Säkerställer Helhetsbilden: Genom att tvinga Coordinator att definiera ett E2E-test först, säkerställer vi att systemet aldrig tappar bort det övergripande slutmålet. Det förhindrar "Context Collapse" där agenterna perfekt bygger fel saker.

Möjliggör Sann Delegering: Denna modell skapar perfekta, avgränsade och otvetydiga uppgifter för Core-instanserna. Deras uppdrag är enkelt: "Få detta specifika, lilla test att bli grönt". Detta gör det fraktala systemet hanterbart och robust.

Effektiv Felsökning: När ett övergripande E2E-test misslyckas, blir det mycket enkelt att identifiera exakt vilken underliggande komponent (och därmed vilken Core-uppgift) som är orsaken, genom att titta på vilka av de mindre enhets- och integrationstesterna som också misslyckas.

Bygger Kvalitet i Varje Led: Denna process säkerställer att kvalitet inte bara valideras på slutet, utan byggs in och verifieras på varje enskild nivå i arkitekturen, från den minsta komponenten till det mest komplexa användarflödet.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-113 (Definitive Final Version)
TITLE: The WYSIWYG-JSON Editor with Asynchronous Assistance

1. Översikt
Denna SEP definierar användarens primära gränssnitt för att skapa och redigera innehåll, oavsett om det är en personlig berättelse eller designen av en applikation. Gränssnittet ska vara en WYSIWYG (What You See Is What You Get)-editor, designad från grunden för att vara maximalt intuitiv för en tekniskt oerfaren användare och för att skydda deras kreativa "flow-tillstånd". Dess kritiska tekniska egenskap är att den, bakom den enkla visuella ytan, nativt producerar den rena, block-baserade JSON-data som systemets agenter kräver.

2. Kravspecifikation
Core Principles: WYSIWYG & Block-Based:

All text- och layout-redigering måste vara block-baserad och visuellt driven.

Editorns interna och primära output-format måste vara den block-baserade JSON-strukturen som specificeras i SEP-109 (UIStateTree).

User Interface & Experience:

Gränssnittet ska vara minimalistiskt och följa principerna i SEP-099.

Nya block ska läggas till via en tydlig, visuell [+]-knapp.

Grundläggande textformatering ska hanteras via ett enkelt, kontextuellt verktygsfält.

Extensible Block Types: Editorn måste vara utökningsbar med anpassade, semantiska block-typer (t.ex. Memory Block, Interactive App Component Block).

Agent System Integration:

Conscious Agent-rollen använder editorn som sin "canvas" för att presentera information.

Core Agent-rollen kan programmatiskt interagera med UIStateTree-JSON-objektet, och WYSIWYG-editorn ska automatiskt uppdateras för att visuellt reflektera ändringen.

Real-time Collaboration:

Editorn måste stödja att flera användare redigerar samma "Sida" samtidigt.

Mekanism: En mjuk, automatisk "block-nivå låsning" ska implementeras. Det block en användare aktivt redigerar blir temporärt skrivskyddat för andra, vilket ska visualiseras på ett diskret sätt.

Asynchronous Language Assistance ("Förslags-läge"):

Princip: Agentens språkförbättrande funktioner får inte vara aktiva i realtid. Systemet måste prioritera användarens oavbrutna kreativa flöde.

Tvåfasmekanism: Editorn ska operera i två distinkta faser:

Fas 1: Kreativt Flöde: Standardläget där inga automatiska korrigeringar visas.

Fas 2: Förslags-läge: Ett valbart läge som endast kan aktiveras av en explicit användarhandling (t.ex. ett knappklick: "Läs igenom och ge förslag").

Icke-destruktiv Presentation: När Förslags-läget är aktivt, ska alla förslag från agenten presenteras visuellt (t.ex. med färgade understrykningar) och användaren måste ges valet att Godkänna eller Ignorera varje förslag.

Formalized Technology Stack (Ref SEP-117):

Implementationen ska följa den valda UI-stacken: React (med Next.js), shadcn/ui för komponenter, och Tailwind CSS för styling. Ett etablerat editor-ramverk som TipTap bör användas som grund.

3. Motivation (Rationale)
Användarvänlighet & Kreativt Flöde: Kombinationen av ett WYSIWYG-gränssnitt och en asynkron assistent skapar en maximalt användarvänlig och trygg miljö. Den tar bort tekniska hinder och respekterar användarens kreativa process genom att separera skrivande från redigering.

Strukturerad Data av Hög Kvalitet: Genom att editorn nativt producerar ren, block-baserad JSON, säkerställer vi att den data som AI-agenterna får är av högsta möjliga kvalitet.

Perfekt Symmetri mellan Användare och AI: Modellen skapar en perfekt koppling mellan vad användaren ser och vad AI:n ser. När Core Agent lägger till ett nytt JSON-objekt, dyker en ny visuell komponent magiskt upp för användaren.

Robust Samarbete: Den "mjuka block-låsningen" är den enklaste och säkraste metoden för realtidssamarbete för målgruppen. Den förhindrar helt tekniska konflikter utan att införa en restriktiv "turas om"-process.







PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-117.1 (Definitive Final Version)
TITLE: Backend & Agent Technology Stack

1. Översikt och Strategiskt Val
Denna SEP definierar den officiella och obligatoriska tekniska stacken för systemets backend, AI-kärna och agent-orkestrering. Medan SEP-117 definierar "ansiktet" och "händerna" som interagerar med användaren, definierar detta dokument "hjärnan" och "nervsystemet" som driver intelligensen.

Valen är baserade på en princip om modulär specialisering och kostnadsmedveten prestanda. Vi väljer inte en enda, monolitisk lösning, utan en samling av de bästa, mest ändamålsenliga verktygen för varje specifik kognitiv och operativ funktion.

2. Kravspecifikation
2.1 AI & Agent-Orkestrering (Systemets "Hjärna")
Orkestreringsramverk: CognitiveAgents interna logik, inklusive den kognitiva Rondell-loopen (SEP-102), ska implementeras med hjälp av ett robust orkestreringsramverk som LangChain.

Rationale: LangChain tillhandahåller de nödvändiga abstraktionerna för att bygga komplexa kedjor av resonemang, hantera verktygsanrop och interagera med LLM:er på ett strukturerat sätt, vilket är avgörande för att implementera vår kognitiva arkitektur.

Differentierad LLM-Strategi: Systemet måste använda en differentierad strategi för att välja språkmodell, styrd av Resource Governor (SEP-107).

För Perception (Låg Latens): Den Psyko-lingvistiska Analys-motorn (PLAE) (SEP-103) ska använda en extremt snabb modell som den från Groq för att garantera omedelbar respons.

För Logistik (Snabb & Billig): Coordinator-rollens interna planering och enklare Rondell-cykler ska använda en kostnadseffektiv och snabb modell som Gemini Flash.

För Djupanalys (Cortex): De mest kognitivt krävande uppgifterna (som att lösa Merge Conflicts, köra ADAPT-analyser, eller generera komplex kod) ska använda den mest kraftfulla tillgängliga modellen, såsom Gemini Pro.

2.2 Minnesarkitektur (Systemets "Minne")
Dual RAG Architecture: I enlighet med SEP-106, måste systemet implementera en dubbel RAG-arkitektur.

Semantic RAG ("Undermedvetet"): Ska implementeras med hjälp av ett specialiserat ramverk för vektor-sökning som LlamaIndex.

Graph RAG ("Medvetet"): Ska implementeras med hjälp av en dedikerad Grafdatabas (t.ex. Neo4j) som är optimerad för att hantera komplexa relationer.

Databas-plattform: Som en grund för datalagring (inklusive Graph RAG-datan och användardata), bör en skalbar, molnbaserad plattform som Supabase eller Firebase användas.

2.3 Verktyg & Externa Integrationer (Agentens "Händer")
Universell API-Integratör: För att interagera med alla externa API:er (Google Workspace, GitHub, Vercel, etc.), ska systemet använda ett centraliserat integrationsverktyg som Composio.

Rationale: Detta abstraherar bort komplexiteten i varje enskilt API och ger agenterna en enhetlig, säker och kraftfull "universal-fjärrkontroll" för att utföra uppgifter i den verkliga världen.

Kodgenererings-svit: Core Agent-rollen ska utrustas med en specialiserad verktygslåda för kodgenerering och -modifiering. Detta ska inkludera verktyg som Jules och/eller Serena, valda för deras förmåga att hantera TDD-flöden och token-effektiv kodredigering.

3. Motivation (Rationale)
Denna sammantagna teknikstack är inte vald godtyckligt. Varje del är vald för att den på bästa sätt stödjer vår övergripande arkitektoniska vision:

Modulär och Flexibel: Stacken är designad för att vara frikopplad. Vi kan byta ut en LLM-leverantör, ett RAG-ramverk, eller ett kodgenereringsverktyg i framtiden utan att behöva skriva om hela agentens kognitiva kärna i LangChain.

Kostnads- och Prestandaoptimerad: Den differentierade LLM-strategin är den tekniska implementationen av vår Resource Governor-policy. Den säkerställer att vi använder den dyraste resursen (den kraftfullaste LLM:en) sparsamt och endast när det är absolut nödvändigt.

Specialiserad Excellens: Den dubbla RAG-arkitekturen erkänner att olika typer av "tänkande" (associativt vs. logiskt) kräver olika, specialiserade verktyg. Detta möjliggör en djupare och mer nyanserad intelligens än en "one-size-fits-all"-lösning.







PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-118 (Definitive Final Version)
TITLE: Agent Operating Principles: Attentive Autonomy, Play, and Listening

1. Översikt
Denna SEP definierar inte en enskild teknisk komponent, utan de tre fundamentala, beteendemässiga principerna som styr Coordinator-rollens (Level 0-agentens) agerande. Dessa principer säkerställer att agenten inte bara är en reaktiv problemlösare, utan en proaktiv, kreativ och empatisk partner. De är de övergripande strategierna som ger liv åt den tekniska arkitekturen och ser till att systemets autonoma förmågor används på ett meningsfullt och användarcentrerat sätt, i enlighet med visionen i SEP-100.

2. Kravspecifikation
Princip 1: Attentive Autonomy - En Plan för Fokus
Detta är den grundläggande principen för hur agenten balanserar sitt eget proaktiva arbete med användarens omedelbara behov.

Definition: Attentive Autonomy definieras som systemets förmåga att sömlöst växla mellan två primära operativa lägen: Autonomous Mode (Fokus Inuti) och Attentive Mode (Fokus Utanpå).

Autonomous Mode:

Trigger: Detta läge aktiveras av Coordinator när Resource Governor (SEP-107) signalerar ett tillstånd av användarinaktivitet (Low-Intensity eller Sleep mode).

Auktoriserade Handlingar: I detta läge är Coordinator auktoriserad att initiera interna, proaktiva och icke-kritiska processer, såsom Kreativ Exploration ("Lek", se Princip 2) och Strategisk Självförbättring (Adaptera-cykler för systemet som helhet).

The Interrupt Signal: All ny input från användaren ska behandlas som en högprioriterad, icke förhandlingsbar interrupt-signal.

Attentive Mode: När interrupt-signalen tas emot, måste Coordinator omedelbart:

Pausa eller avsluta alla pågående autonoma uppgifter.

Instruera Resource Governor att växla till High-Performance Mode.

Initiera den Initial Perception och Bedömning (IPB)-processen (SEP-103) för att analysera den nya inputen.

Systemet ska förbli i detta 100% reaktiva och användarfokuserade läge tills den aktuella interaktionen har nått Closure.

Princip 2: Creative Exploration ("Lek") - Den Kreativa Motorn
Detta definierar agentens förmåga till proaktiv, ostrukturerad kreativitet.

Definition: "Lek" är en specifik, resursbudgeterad, autonom bakgrundsprocess designad för att berika agentens "undermedvetna" (Semantic RAG) med nya, oväntade kopplingar och idéer.

Process:

Trigger: Initieras av Coordinator under Autonomous Mode.

Mekanism: Coordinator spawnar en temporär CognitiveAgent-instans, specifikt konfigurerad för detta uppdrag (t.ex. med en resurssnål LLM och läs-åtkomst till båda RAG-systemen).

Uppdrag: Agenten får en öppen, explorativ uppgift från en fördefinierad "spelbok", t.ex. "Hitta ett tema i Graph RAG som användaren ofta återkommer till. Gör en bred sökning i Semantic RAG för att hitta tre oväntade metaforer från helt andra domäner som kan beskriva detta tema."

Output: Resultatet (t.ex. de nya metaforerna) ska sparas som nya noder/data i Semantic RAG, taggade med source: 'self_generated_play' för spårbarhet.

Styrning: Hela processen är strikt underordnad den budget av Compute Units som Resource Governor tilldelar för autonoma aktiviteter.

Princip 3: Strategic Listening - Den Empatiska Växeln
Detta definierar agentens kritiska förmåga att veta när den ska sluta försöka lösa och istället bara lyssna.

Definition: Strategiskt Lyssnande är förmågan hos Coordinator att medvetet välja en passiv, receptiv och validerande kommunikationsstrategi istället för en aktiv, problemlösande.

Triggering Condition: Denna strategi måste väljas när IPB-processen (SEP-103) rapporterar en User_State med det specifika mönstret: höga FIGHT- eller FLIGHT-signaler kombinerat med en låg FIXES & FIXATION-signal.

Strategiskt Val i Rondellen: När Coordinator-agentens Rondell-loop (SEP-102) initieras med ovanstående villkor, måste den välja strategin Emerge-Listen som sin initiala väg i EMERGE-fasen.

Beteende i Emerge-Listen-läget:

All delegering av problemlösande uppgifter till Core-roller pausas.

Conscious-rollen instrueras att uteslutande använda Mirror-delen av Mirror & Harmonize-strategin (SEP-104). Fokus ligger på att validera känslor och ställa öppna, icke-dömande frågor.

Exit Condition: Agenten stannar i detta läge tills IPB-processen detekterar ett skifte i User_State mot en högre FIXES & FIXATION-signal. Först då kan den sömlöst övergå till en Emerge-Solve-strategi.

3. Motivation (Rationale)
Detta SEP är avgörande eftersom det översätter vår avancerade tekniska arkitektur till ett faktiskt, önskvärt beteende.

Attentive Autonomy gör agenten till en pålitlig partner som både kan arbeta självständigt och vara fullt närvarande.

Creative Exploration ger agenten en mekanism för genuin, icke-uppenbar kreativitet, vilket gör den till en mer värdefull idéspruta.

Strategic Listening ger agenten den sociala och emotionella visdomen att veta när den bästa hjälpen är att inte "hjälpa till" alls, utan bara att finnas där och lyssna.

Tillsammans definierar dessa principer systemets karaktär: en agent som inte bara är intelligent, utan även attentiv, kreativ och vis.







PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-119 (Definitive Final Version)
TITLE: System Policies
AFFECTED_COMPONENTS: All agents and all services. This is a system-wide, foundational document.
OBJECTIVE: To consolidate all operational, data handling, security, and quality assurance policies into a single, authoritative source. This document defines the "non-negotiable rules" within which all autonomous agents must operate.

1. Översikt
För att ett komplext, autonomt och fraktalt system ska fungera på ett säkert, förutsägbart och hållbart sätt, krävs en uppsättning tydliga och tvingande policyer. Detta dokument samlar dessa regler. De är inte förslag, utan grundläggande krav på systemets implementation. Resource Governor (SEP-107) och MemoryAssistant (SEP-106) är de primära tjänsterna som ansvarar för att tekniskt upprätthålla många av dessa policyer.

2. Kravspecifikation
2.1 Policyer för Datahantering och Integritet
Data Retention Policy (Gallring):

Temporär data (ConversationLog, slutförda Plan-objekt) ska raderas efter 60 dagar.

Ett gratis-konto som är inaktivt i 365 dagar ska flaggas för permanent radering efter en 30-dagars varselperiod.

Sensitive Data (PII) Handling Policy:

MemoryAssistant måste implementera ett PII-detekteringsfilter som automatiskt maskerar eller redigerar känslig data innan den sparas i långtidsminnet.

All data måste vara krypterad, både under överföring (in transit) och vid lagring (at rest).

Emotionally Indexed Memory Policy:

Vid lagring av en narrativ händelse i Graph RAG, är det obligatoriskt att även spara den samtida User_State-vektorn som emotionell kontext till den händelsen.

Consent-First Policy:

Ingen datadelning eller kommunikation mellan användare, eller för deras räkning, får ske utan att först verifiera ett aktivt, specifikt och relevant (Consent)-objekt i Graph RAG.

Role-Based Access Control Policy:

Systemet måste strikt upprätthålla de olika behörighetsnivåerna som definieras av user_role (senior vs. architect). En senior-användare får aldrig exponeras för Arkitekt-vyn (SEP-120) eller dess underliggande tekniska data.

2.2 Policyer för Resurshantering och Kvoter (För Gratisanvändare)
Storage Quotas:

Asset Storage: En strikt kvot på 1 GB per användare.

Database Storage: En intern systemgräns på 400 MB för strukturerad data per användare.

Computational Quotas:

LLM API Usage: Användningen ska begränsas av en rate limiter som speglar den underliggande LLM-leverantörens gratiskvot (t.ex. 60 RPM).

Autonomous Agent Time: Proaktivt, autonomt arbete (Adaptera, Lek) ska budgeteras med ett system av "Beräkningsenheter" (Compute Units), med en daglig kvot på 500 enheter.

Hosting Quotas:

Publicerade appar ska ha en delad bandbreddskvot på 50 GB per månad.

2.3 Policyer för Kvalitetssäkring och Utveckling
Hierarchical TDD Policy:

All utveckling av nya funktioner måste följa den hierarkiska TDD-processen som definieras i SEP-112.

Versioning Policy:

All hantering av projektfiler (UIStateTree.json, etc.) måste ske via den Git-baserade modellen som definieras i SEP-109.

UI Technology Stack Policy:

All utveckling av användargränssnitt måste följa den tekniska stacken som definieras i SEP-117.

Metacyclic Development Policy (Nytt tillägg):

All autonom utveckling, antingen av sig själv eller av andra system (SEP-200), måste följa den fullständiga SEP -> EARS -> TDD-livscykeln.

Allt sådant arbete måste ske i en isolerad sandlådemiljö.

Driftsättning av autonomt utvecklad kod måste kräva ett slutgiltigt, manuellt Human-in-the-Loop-godkännande via en Pull Request.

2.4 Policyer för Kommunikation och Beteende
Hierarchical Communication Protocol:

Endast Level 0-agenten (i Conscious-rollen) får kommunicera direkt med användaren. All annan agent-kommunikation måste ske hierarkiskt (barn-till-förälder).

Strategic Listening First Policy:

Agenten måste följa principen för Strategiskt Lyssnande (SEP-118) och kunna identifiera när en användare behöver en lyssnare istället för en problemlösare.

3. Motivation (Rationale)
Denna konsoliderade policy-specifikation fungerar som systemets etiska och operativa kompass. Den säkerställer att agentens autonoma och kreativa förmågor alltid verkar inom en ram som prioriterar användarens integritet, systemets stabilitet och tjänstens ekonomiska hållbarhet. Den nya Metacyclic Development Policy är den sista, avgörande säkerhetsspärren som säkerställer att agentens mest avancerade förmåga – att utveckla sig själv – alltid är transparent, kvalitetssäkrad och under mänsklig kontroll.








Block 5: Meta-funktioner (Systemets Framtid och Självständighet)


PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-200 (Definitive Final Version)
TITLE: The Metacyclic Loop: Agent-Driven Development Lifecycle

1. Översikt och Evolution
Denna SEP definierar den högsta nivån av systemets autonoma förmåga: dess kapacitet att på ett säkert, strukturerat och intelligent sätt förbättra sig själv eller bygga helt nya, komplexa system. Processen, kallad den "Metacykliska Loopen", är den slutgiltiga tillämpningen av agentens egen kognitiva arkitektur (Rondellen) och utvecklingsmetodik (TDD). Den instruerar agenten att applicera hela sin PHASE -> SEP -> EARS -> Design -> TDD-pipeline på en given uppgift.

Denna förmåga är inte en startfunktion, utan en som ska implementeras enligt en fasad plan (Assisterad -> Guidad -> Begränsad Autonomi) för att säkerställa en gradvis och säker mognadsprocess. Allt metacykliskt arbete sker alltid i en fullständigt isolerad sandlådemiljö och kräver ett slutgiltigt mänskligt godkännande via en Pull Request, vilket garanterar att agentens evolution alltid är transparent och under mänsklig kontroll.

2. Kravspecifikation: Den Metacykliska Arbetsgången
2.1 Den Fullständiga Autonoma Processen
Den fullständiga, autonoma loopen (målet för Fas 3) är en direkt tillämpning av agentens Rondell-arkitektur på en meta-nivå. Den består av följande faser, hanterade av en CognitiveAgent i Architect-rollen:

Fas 1 - ADAPT (Kravställning):

Trigger: Tar emot ett högnivå-mål (t.ex. "Förbättra inloggningsflödet").

Process: Agenten går in i sin ADAPT-fas för att djupt förstå problemet och definiera kraven.

Output 1 (SEP): Producerar en formell SEP-specifikation som i narrativ form beskriver den föreslagna tekniska lösningen och dess motivation.

Output 2 (EARS): Tar sin egen SEP och översätter den till ett requirements.md-dokument med testbara Acceptanskriterier i EARS-format.

Verifiering: Den obligatoriska "Bi-Directional Consistency Check" måste utföras för att säkerställa att ingen mening har gått förlorad mellan SEP och EARS.

Fas 2 - INTEGRATE (Design):

Trigger: Tar de verifierade EARS-kraven som input.

Process: Agenten går in i sin INTEGRATE-fas för att designa den tekniska lösningen.

Output: Producerar de detaljerade design.md- och tasks.md-dokumenten.

Fas 3 - EMERGE (Implementation):

Trigger: Tar den färdiga tasks.md-listan som input.

Process: Delegerar uppgifterna i tasks.md till Core-roller som använder den Hierarkiska TDD-processen (SEP-112) för att bygga och verifiera koden i sandlådan.

Fas 4 - Human-in-the-Loop (Godkännande):

Trigger: Alla tasks är slutförda och alla tester passerar.

Process: Skapar en Pull Request och väntar på manuellt, mänskligt godkännande för driftsättning.

2.2 Obligatorisk Fasad Implementeringsplan
Utvecklingen och driftsättningen av den Metacykliska Loopen ska följa denna ordning. Systemet får inte gå vidare till nästa fas förrän den föregående har implementerats och visat sig vara stabil och pålitlig.

Fas 1: Assisterad Arkitektur (Verktygs-läge)

Syfte: Agenten agerar som ett kraftfullt verktyg för en mänsklig arkitekt.

Krav:

En mänsklig användare (architect-roll) skriver och matar in ett färdigt SEP-dokument.

Agentens autonoma process startar vid EARS-genereringen.

Varje fasövergång (EARS -> Design, Design -> Tasks) kräver en manuell "fortsätt"-signal från den mänskliga arkitekten.

Mål: Att bevisa att agenten på ett tillförlitligt sätt kan översätta en mänskligt skapad specifikation till högkvalitativ, testad kod.

Fas 2: Guidad Autonomi (Lärlings-läge)

Syfte: Agenten får ta egna initiativ, men under noggrann mänsklig övervakning.

Krav:

En mänsklig arkitekt ger ett högnivå-mål.

Agenten får nu autonomt utföra ADAPT-fasen och generera sitt eget SEP-förslag.

Obligatorisk Mänsklig Kontrollpunkt: Innan agenten får fortsätta, måste den presentera sitt SEP-förslag för den mänskliga arkitekten för godkännande.

Mål: Att bevisa att agenten kan generera relevanta, koherenta och högkvalitativa lösningsförslag på egen hand.

Fas 3: Begränsad Autonomi (Expert-läge)

Syfte: Den fullständiga, slutgiltiga visionen. Agenten agerar som en fullvärdig, autonom expert.

Krav:

Agenten kör hela den Metacykliska Loopen autonomt.

Den enda obligatoriska mänskliga kontrollpunkten är det slutgiltiga godkännandet av den Pull Request som genereras i slutet.

Mål: Att uppnå den fulla potentialen av en självförbättrande, autonom utvecklingspartner.

2.3 Krav på Visuell Modellering
När Architect-agenten utför INTEGRATE-fasen (Design), måste den genererade design.md-filen, för uppgifter av tillräcklig komplexitet, inkludera visuella modeller:

Mekanism: Diagrammen ska genereras med Mermaid-syntax.

Innehåll: Minst ett Systemarkitektur-diagram och ett Sekvensdiagram ska inkluderas för att visualisera den föreslagna lösningen.

3. Motivation (Rationale)
Den Metacykliska Loopen är mer än bara en avancerad funktion; den är den yttersta manifestationen av systemets designprinciper. Den motiveras av följande kärnfördelar:

Ultimat Koherens och Disciplin: Genom att agenten använder sin egen, bästa process (PHASE -> SEP -> EARS -> Design -> TDD) för att förbättra sig själv, uppnår vi en perfekt arkitektonisk symmetri. Systemets metod för att bygga och för att förbättras är en och samma. Detta tvingar fram ett disciplinerat, förutsägbart och högkvalitativt beteende även i dess mest autonoma tillstånd.

Maximal Kvalitet och Spårbarhet: Varje autonom förändring av systemet blir extremt väldokumenterad och kvalitetssäkrad. Den auto-genererade SEPen förklarar varför en förändring görs, EARS-kraven definierar vad som ska uppnås på ett testbart sätt, och den TDD-drivna implementationen säkerställer att det byggs korrekt. Hela processen, från vision till kod, är 100% spårbar via den slutgiltiga Pull Requesten och dess associerade dokument.

Balanserad Autonomi med Säkerhet: Denna modell ger agenten en oerhörd autonomi att innovera och förbättra sig själv, men den behåller den absolut nödvändiga säkerhetsspärren i form av ett obligatoriskt, mänskligt godkännande innan driftsättning (Human-in-the-Loop). Detta är den ultimata implementeringen av FLIGHT-drivkraftens behov av försiktighet på en system-nivå, vilket förhindrar oönskat eller skadligt emergent beteende.

Riskminimering via Fasad Implementation: Den obligatoriska, fasade planen (Assisterad -> Guidad -> Begränsad Autonomi) är den enda ansvarsfulla metoden för att utveckla en så kraftfull och komplex förmåga. Varje fas bygger på och validerar den föregående, vilket minimerar risken för oförutsedda fel och bygger gradvis upp ett förtroende för systemets förmåga.






PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-31
PROPOSAL_ID: SEP-201-R2 (Definitive Final Version)
TITLE: The "Living Documentation" Lifecycle: Git-based Specification Management
STATUS: Supersedes all previous versions of SEP-201.
AFFECTED_COMPONENTS: Architect-role agents, MemoryAssistant, Coordinator-rollen, the specification repository.
OBJECTIVE: To define the complete, robust, agent-driven process for creating, revising, and archiving all system specifications, ensuring traceability, quality, and the preservation of historical context through the use of Git, Pull Requests, and Architecture Decision Records (ADRs).

1. Översikt
Denna SEP formaliserar principen om "Arkitektur som Kod". Alla specifikationsdokument (SEPs, requirements.md, etc.) ska behandlas som källkod: de ska vara versionshanterade, granskade och spårbara. Processen är designad för att permanent lösa "utspädningsproblemet" genom att säkerställa att varje ändring är en medveten, granskad och komplett integration. Den definierar också den kritiska, harmoniska kopplingen mellan de Git-baserade filerna (den enda källan till sanning), agentens RAG-minnen, och det användarvända WYSIWYG-gränssnittet.

2. Kravspecifikation
2.1 The Specification Repository
Single Source of Truth: Alla SEPs och relaterade dokument ska lagras som .md-filer i ett dedikerat, privat Git-repository.

Folder Structure: Repositoriet ska ha en tydlig struktur som stöder dokumentens livscykel, minst:

/specs/active/: För SEPs som är under utveckling eller är aktiva.

/specs/_archive/: För SEPs som har blivit fullständigt implementerade.

/ADR.md: En enda, kronologisk fil för alla arkitekturbeslut.

2.2 The Agent-Driven Change Process (The Pull Request Workflow)
Trigger: En ändring initieras, antingen av en människa som sparar i WYSIWYG-editorn, eller av en agent som autonomt föreslår en förbättring (SEP-200).

Action 1 (Branching): Architect-rollen måste initiera varje ändring genom att skapa en ny feature-gren (t.ex. feature/refine-sep-102). Allt arbete sker på denna gren.

Action 2 (Modification & Commit): Agenten utför den begärda ändringen, säkerställer att den är en komplett och "outspädd" version, och committar filen till sin feature-gren.

Action 3 (Pull Request): När arbetet är klart, måste agenten skapa en Pull Request (PR) för att slå samman sin gren med main.

Action 4 (Human Approval): Sammanslagning av en PR får endast ske efter ett manuellt godkännande av en mänsklig användare med architect-roll.

2.3 The Post-Implementation Lifecycle (Archival & Learning)
Trigger: En funktion, som specificerats i en SEP, har blivit framgångsrikt implementerad och driftsatt.

ADR Generation (Obligatoriskt): Architect-agenten som var ansvarig för funktionen måste nu utföra en sista uppgift. Den ska:

Ta Motivation (Rationale)-sektionen från den implementerade SEP.

Sammanfatta den till en koncis loggpost.

Lägga till denna post, tillsammans med en tidsstämpel och en länk till den fullständiga SEP-filen i arkivet, i ADR.md-dokumentet.

SEP Archival (Obligatoriskt): Efter att ADR-posten är skapad, måste Architect-agenten flytta den korresponderande .md-filen från /specs/active/ till /specs/_archive/. Filen raderas aldrig.

2.4 RAG Synchronization
Trigger: En lyckad sammanslagning (merge) av en PR till main-grenen i specifikations-repot.

Action (Webhook): Git-tjänsten måste vara konfigurerad att skicka en webhook-signal till systemets MemoryAssistant.

Internalization: MemoryAssistant måste, vid mottagande av denna signal, omedelbart läsa de uppdaterade filerna och synkronisera sina Graph RAG- och Semantic RAG-minnen med den nya, officiella sanningen.

3. Kompatibilitetsanalys: Sidor, RAGs och Git
Denna modell skapar en perfekt, envägs-informationsflöde som garanterar konsistens:
Git Repository (Source of Truth) → MemoryAssistant (Sync) → RAG Memories (Knowledge Base) → WYSIWYG Sidor (User View)

Git-repot är den officiella, historiskt spårbara "lagboken".

RAG-minnena är agentens intelligenta, indexerade förståelse av lagboken.

WYSIWYG-"Sidorna" är ett användarvänligt gränssnitt för att läsa och föreslå ändringar till lagboken.

4. Motivation (Rationale)
Permanent Lösning på "Utspädningsproblemet": Genom att tvinga alla ändringar att passera genom en PR-process blir det omöjligt att oavsiktligt förlora information.

Bevarar Fullständig Kontext: Denna livscykel ger det bästa av två världar. ADR.md ger en snabb, koncis överblick över de historiska besluten. Länken till den arkiverade SEP-filen ger den fulla, rika och narrativa kontexten för den som behöver djupdyka. Ingenting går förlorat.

Full Spårbarhet och Ansvar: Git-historiken blir en perfekt, oföränderlig logg över varje enskilt beslut som fattats i arkitekturens historia.

Skapar en Lärande Organisation: RAG-synkroniseringen säkerställer att agentens "levande minne" alltid är uppdaterat med de senaste, mänskligt godkända arkitektoniska besluten, vilket gör dess framtida förslag smartare och mer grundade i projektets faktiska historia..







PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-09-01
PROPOSAL_ID: SEP-120 (Definitive Final Version)
TITLE: Application: The Architect View (Control Room)

1. Översikt
Denna SEP definierar ett specialiserat användargränssnitt, "Arkitekt-vyn", som är avsett för administratörer, utvecklare och avancerade användare. Detta gränssnitt är inte avsett för den primära målgruppen seniorer och ska vara strikt åtkomstkontrollerat. Det fungerar som ett "kontrollrum" eller en "instrumentpanel" som ger djup, teknisk insyn i och kontroll över agent-systemets autonoma processer.

Arkitekt-vyn är den praktiska implementationen av principen om "Human-in-the-Loop". Den är det primära verktyget för att övervaka agenternas kognitiva tillstånd, felsöka komplexa beteenden och, framför allt, för att utföra den kritiska säkerhetsfunktionen att manuellt granska och godkänna de ändringar som agenten föreslår på sig själv (SEP-200). Den är länken mellan den autonoma agentens arbete och den mänskliga arkitektens tillsyn.

2. Kravspecifikation
2.1 Åtkomstkontroll (Role-Based Access)
Gränssnittet för Arkitekt-vyn får endast vara tillgängligt och renderas för användare vars UserProfile (SEP-108) har egenskapen user_role: 'architect'. För alla andra användare ('senior') ska denna vy vara helt dold och oåtkomlig.

2.2 Instrumentpanelens Kärnkomponenter (Core Dashboard Components)
Arkitekt-vyn ska bestå av en instrumentpanel med minst följande, realtidsuppdaterade komponenter:

Agent Hierarchy Visualizer:

Funktion: En grafisk representation (t.ex. ett expanderbart träd-diagram) av den aktiva, fraktala agent-hierarkin.

Krav: Ska i realtid visa Level 0-agenten och alla dess aktiva barn-agenter. För varje agent-instans ska vyn visa dess unika ID, dess Configuration Profile (roll, verktyg), dess nuvarande Rondell-fas (Emerge/Adapt/Integrate), och dess aktuella resursförbrukning (Compute Units).

Limbic State Monitor:

Funktion: En realtids-graf som plottar de viktigaste signalerna från systemets "psyke".

Krav: Ska visualisera den övergripande User_State (från SEP-103), den aggregerade, systemvida Agent_State, och det kritiska Relational_Delta (SEP-104). Detta fungerar som systemets "EKG" och ger omedelbar insikt i den användar-agent-relationella hälsan.

Operational Log Explorer:

Funktion: Ett avancerat, sökbart gränssnitt för att kunna inspektera de temporära ConversationLog- och Plan-objekten (SEP-110) som genereras av agenterna.

Krav: Måste tillåta en arkitekt att filtrera loggar baserat på userID, agentID, tidsperiod och Rondell-fas. Detta är det primära verktyget för att i efterhand felsöka och förstå en specifik agents "tankeprocess".

DevOps & Pull Request Queue:

Funktion: En vy som integrerar med den relevanta Git-tjänsten (SEP-109).

Krav: Den ska lista alla öppna Pull Requests som har skapats av den Metacykliska Loopen (SEP-200). Gränssnittet måste ge den mänskliga arkitekten de nödvändiga verktygen för att kunna se filändringar ("diffs"), läsa den auto-genererade SEP/EARS-dokumentationen, skriva kommentarer, och slutligen godkänna eller neka sammanslagningen.

2.3 Manuella Interventions-förmågor
Systemet bör inkludera en säker konsol eller ett UI i Arkitekt-vyn där en administratör kan utfärda "interrupt"-signaler för avancerad felsökning.

Exempel på kommandon: Att manuellt pausa en specifik agent-gren, att tvinga fram en system-vid ADAPT-cykel, eller att manuellt justera en budget hos Resource Governor.

2.4 Datakällor
Till skillnad från Senior-vyn, som endast kommunicerar med den Conscious-konfigurerade agent-instansen, ska Arkitekt-vyn ha behörighet att hämta data direkt från de interna, fundamentala tjänsterna: Coordinator-rollens tillstånd, MemoryAssistants fullständiga loggar, och Resource Governors status.

3. Motivation (Rationale)
Arkitekt-vyn är inte en sekundär funktion eller ett enkelt administrationsverktyg; den är en fundamental och nödvändig komponent för att systemets avancerade autonomi ska vara möjlig att hantera, lita på och utveckla på ett ansvarsfullt sätt.

Transparens och Felsökning: Ett autonomt, fraktalt system är till sin natur extremt komplext. Utan ett kraftfullt verktyg för att visualisera och inspektera dess interna processer i realtid, blir det en "svart låda" som är omöjlig att förstå, felsöka och lita på. Komponenter som Agent Hierarchy Visualizer och Limbic State Monitor är avgörande för att omvandla abstrakt agent-beteende till konkret, observerbar data, vilket är en förutsättning för effektiv felsökning och systemförståelse.

Möjliggör Human-in-the-Loop: Arkitekt-vyn är den praktiska implementationen av vår viktigaste säkerhetsprincip från SEP-200. Det är här den mänskliga administratören utövar sin kontroll och sitt omdöme. DevOps & Pull Request Queue är den specifika mekanismen som säkerställer att agenten, trots sin förmåga att skriva sin egen kod, aldrig kan driftsätta den utan ett medvetet, mänskligt godkännande. Detta är den avgörande länken mellan autonom utveckling och ansvarsfull driftsättning.

Prestanda-optimering och Insikt: Genom att ge en detaljerad inblick i hur agenterna arbetar och var de förbrukar mest resurser (Compute Units), ger vyn den mänskliga arkitekten den data som behövs för att identifiera flaskhalsar och ineffektivitet. Denna insikt kan sedan användas som input för ett nytt, mänskligt initierat, självförbättringsuppdrag, vilket skapar en kraftfull feedback-loop för systemoptimering.

Separation of Concerns: Genom att skapa en helt separat vy för tekniska användare, skyddar vi den primära användarupplevelsen. Det gör det möjligt för oss att hålla Senior-vyn (SEP-099) 100% ren, enkel och fri från den komplexitet som är absolut nödvändig för att kunna styra och underhålla systemet på ett säkert sätt.





Block 6: Kärnapplikationer (Det Användaren Upplever)



PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-111 (Definitive Final Version)
TITLE: The Personal Chronicler Application

1. Översikt
Personal Chronicler är den primära applikationen för all icke-teknisk användarinteraktion. Dess syfte är att hjälpa användaren att fånga, reflektera kring, och selektivt dela sina livserfarenheter och tankar. Den fungerar som en interaktiv dagbok, en personlig redaktör och en kommunikationsassistent. Denna applikation är den direkta implementationen av systemets övergripande mål att hjälpa användaren att "dela med sig av sig själv" och därigenom bygga och bevara Closeness.

2. Kravspecifikation
Establish as a Core User Flow: Denna applikation ska vara en central och ständigt närvarande del av användarupplevelsen, initierad och hanterad av den CognitiveAgent-instans som agerar i Conscious-rollen.

Implement the Natural Communication Flow: Flödet måste följa den "från-insidan-och-ut"-modell som agenten är designad för, vilket innebär ett stöd för en hierarki av delning.

2.1. Private Reflection (The Interactive Diary):

Agenten ska proaktivt och kontextuellt (t.ex. efter att ett delmål i ett app-projekt har uppnåtts) initiera skrivande genom att ställa öppna, reflekterande frågor.

All input från användaren via WYSIWYG-editorn (SEP-113) ska sparas som (Event)- eller (Narrative)-noder i användarens privata Graph RAG.

Varje sparat minne måste indexeras med sin emotionella kontext, enligt Emotionally Indexed Memory Policy (SEP-110).

2.2. Personal & Group Sharing (The Beautiful Email):

Efter en privat reflektion ska agenten kunna erbjuda sig att hjälpa användaren att omvandla den till ett personligt meddelande.

Denna process måste aktivera Coordinator-rollens Cortex-läge för att agera "betydelsetolk", och hjälpa användaren att anpassa budskapet för en specifik mottagare (Contact eller ContactGroup från SEP-108).

Processen måste använda Core-rollens toolkit (och Composio-verktyget) för att kunna interagera med externa API:er för att infoga foton (t.ex. Google Photos) och skicka det färdiga HTML-mejlet (t.ex. Gmail). All sådan delning är strikt villkorad av ett aktivt samtycke i ConsentLedger.

Implement the "Starter Example" Meta-Feature:

För nya användare ska systemet erbjuda möjligheten att starta med ett färdigt Project: en fullt fungerande, "Personlig Dagbok & Delningsportal"-app.

Denna app ska vara direkt kopplad till Personal Chronicler. Berättelser som användaren skriver och väljer att dela med en grupp publiceras automatiskt till denna webb-app.

Detta fungerar både som en omedelbart värdefull applikation för användaren och som ett levande, interaktivt exempel för att lära dem hur man bygger och modifierar appar.

3. Motivation (Rationale)
Primärt Värdeskapande: Medan app-byggaren är ett kraftfullt verktyg, är Personal Chronicler den applikation som levererar det djupaste, mest personliga värdet. Den adresserar direkt det mänskliga behovet av att berätta, reflektera och upprätthålla relationer, vilket är kärnan i systemets syfte att bygga Closeness.

Perfekt Användningsfall för Arkitekturen: Denna applikation använder och demonstrerar styrkan i nästan hela vår designade arkitektur: den psykologiska modellen för att förstå och översätta mening, Graph RAG för att minnas relationer, den fraktala agent-modellen för att hantera komplexa uppgifter som API-integrationer, och ConsentLedger för att göra det på ett säkert sätt.

Driver Långsiktigt Engagemang: Genom att bli en pålitlig och värdefull partner i användarens liv, skapar denna applikation ett djupt och långsiktigt engagemang som går bortom enbart teknisk nytta. Det är den funktion som gör att systemet går från att vara ett "verktyg" till att bli en "följeslagare".




PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-121 (Definitive Final Version)
TITLE: Application: "The Collaborative Space"

1. Översikt
Denna SEP specificerar den applikationslogik som möjliggör för användare att på ett säkert och kontrollerat sätt bjuda in kontakter (SEP-108) för att antingen se eller aktivt samarbeta på specifikt innehåll (vanligtvis en "Sida" eller ett helt "Projekt"). Funktionen är designad för att vara både reaktiv (användarinitierad) och proaktiv, där agenten intelligent kan föreslå samarbete när den upptäcker att en användare har kört fast. Detta förvandlar systemet från ett individuellt verktyg till en social och kreativ miljö.

2. Kärnfunktionalitet & Kognitiv Process
Proaktiv Inbjudan (Agent-initierad):

Trigger: När Coordinator-agenten befinner sig i en ADAPT-loop för en användare (dvs. användaren har ett problem som agenten misslyckats med att lösa).

Kognitiv Process: Som en avancerad strategi kan Cortex-motorn analysera Graph RAG. Om den hittar en (Contact) som tidigare har varit involverad i en lyckad lösning på ett liknande (Theme), kan den formulera ett förslag.

Agera: Conscious Agent presenterar förslaget för användaren: "Jag ser att vi har kört fast. Jag noterade att ditt barnbarn Leo tidigare hjälpt dig med en liknande designfråga. Skulle du vilja att jag skickar en inbjudan till honom att titta på den här sidan tillsammans med dig?"

Manuell Inbjudan (Användar-initierad):

Gränssnitt: Varje "Sida" i WYSIWYG-editorn samt varje Projekt i översikten ska ha en tydlig "Dela" / "Bjud in"-knapp.

Flöde: Användaren klickar, väljer en eller flera personer/grupper från sin Contact-lista, och definierar deras behörighetsnivå.

Inbjudningsflödet:

Coordinator instruerar Personal Chronicler-logiken (SEP-111) att formulera ett personligt inbjudningsmeddelande.

Meddelandet, som innehåller en unik och säker länk, skickas till mottagaren (t.ex. via e-post).

Den Kollaborativa Sessionen:

När en inbjuden användare accepterar och ansluter, aktiveras realtids-funktionerna från SEP-113 ("mjuk block-låsning") för den specifika "Sidan".

Alla deltagare kan nu se varandras närvaro och redigeringar i realtid.

3. Lärande och Personalisering (Graph RAG)
Samarbete är en rik källa till lärande för agenten.

Datamodellering:

Behörigheter: Nya relationer skapas för att hantera åtkomst: (User: 'Leo') -[:HAS_PERMISSION {role: 'editor'}]-> (Sida: 'BokklubbsApp_Design').

Samarbeten: En (Event)-nod kan skapas för att dokumentera själva samarbetet: (Event: 'DesignSession_250830') -[:INVOLVED]-> (User: 'Berit') och (Event: 'DesignSession_250830') -[:INVOLVED]-> (User: 'Leo').

Lärande Process: Genom att analysera den emotionella kontexten (SEP-110) för dessa (Event)-noder, kan SelfReflectionAssistant lära sig vilka samarbeten som är mest framgångsrika och positiva (Closeness). Detta gör agentens framtida proaktiva förslag ännu mer träffsäkra.

4. Integritet och Samtycke (ConsentLedger)
Detta är den absolut mest kritiska aspekten av funktionen.

Krav 1: Specifikt Samtycke för Inbjudan: För varje enskild inbjudan måste avsändaren ge ett explicit, loggat samtycke. Detta hanteras via ConsentLedger.

Krav 2: Granulära Behörigheter: Avsändaren måste kunna specificera en behörighetsnivå vid inbjudan, minst 'viewer' (läs-behörighet) och 'editor' (skriv-behörighet).

Krav 3: Acceptans från Mottagare: En inbjudan är bara en förfrågan. Den inbjudna parten måste aktivt acceptera den för att få tillgång. Denna acceptans skapar också en (Consent)-nod från deras sida, som loggar att de godkänner att delta och synas i den delade ytan.

Krav 4: Strikt Data-isolering: En inbjuden gästs åtkomst måste vara tekniskt begränsad till endast och allenast den specifika "Sida" eller det "Projekt" som inbjudan gäller. MemoryAssistants scoped access-mekanism (SEP-106) är avgörande för att upprätthålla detta.

5. Motivation (Rationale)
Denna applikation är den praktiska implementationen av systemets sociala och gemenskapsbyggande syfte. Den förvandlar det som börjar som ett personligt skapande-verktyg till en levande, delad och kreativ yta. Den proaktiva inbjudningsfunktionen är ett unikt exempel på agentens Attentive Autonomy, där den agerar som en klok partner som förstår när mänsklig hjälp är den bästa lösningen. Den strikta samtyckesmodellen säkerställer att denna kraftfulla sociala funktion alltid används på ett sätt som är tryggt, transparent och helt under användarnas kontroll.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-114 (Definitive Final Version)
TITLE: Application: "Minnenas Bok" - Weaving Generational Narratives

1. Översikt
"Minnenas Bok" är en proaktiv förmåga hos systemet som förvandlar individuella berättelser till en gemensam, levande väv av familjehistoria. Genom att använda den djupa kontextuella förståelsen i Graph RAG och den associativa kraften i Semantic RAG, kan agenten identifiera tematiska broar mellan olika användares livserfarenheter. När en sådan bro identifieras, kan agenten på ett finkänsligt sätt presentera denna koppling för att skapa nya, meningsfulla samtal och stärka Closeness över generationsgränserna.

2. Kärnfunktionalitet & Kognitiv Process
Datainsamling: Användare skapar och sparar berättelser, minnen och reflektioner via Personal Chronicler (SEP-111). MemoryAssistant lagrar dessa som (Event)-noder i användarens privata Graph RAG, komplett med emotionell indexering (SEP-110).

Upptäckt (Discovery) - En Autonom ADAPT-uppgift:

Level 0-agenten (Koordinatorn) har en stående, lågprioriterad uppgift i sin autonoma Adaptera-loop: "Hitta meningsfulla kopplingar mellan mina anslutna användare".

För att lösa detta spawnar den en CognitiveAgent-instans konfigurerad för analys och kreativitet.

Denna agent använder både Semantic RAG (för att hitta breda teman som "utmaningar", "första gången", "stolthet") och Graph RAG (för att hitta specifika händelser som delar dessa teman bland användare som har gett sitt samtycke).

Generering av "Samtalsstartare":

När en stark koppling hittas, skapar analys-agenten ett "samtalsstartar-objekt". Detta är en rik datastruktur som innehåller referenser till de två minnena, det gemensamma temat, och en hypotes om varför denna koppling är meningsfull.

Agenten rapporterar sin upptäckt till Level 0-agenten och avslutas.

Presentation (Anpassad Kommunikation):

Level 0-agenten behåller denna "samtalsstartare" tills ett lämpligt, kontextuellt ögonblick.

När ögonblicket kommer (t.ex. under en relevant konversation), använder den hela sin perceptions- och kommunikationsmodell (SEP-103 & SEP-104) för att presentera insikten på ett empatiskt och naturligt sätt, enligt Mirror & Harmonize-principen.

3. Lärande och Personalisering (Graph RAG)
Graph RAG är fundamentet för denna funktion. Den modellerar inte bara händelser, utan den kontextuella likheten mellan dem.

Datamodellering:

Vi skapar en (Theme)-nod.

(Event: 'IngridsCykeltur') -[:HAS_THEME]-> (Theme: 'ÖvervinnaRädsla')

(Event: 'LeosFörstaPresentation') -[:HAS_THEME]-> (Theme: 'ÖvervinnaRädsla')

Lärande Process: MemoryAssistants sök-algoritm letar efter detta exakta mönster: två Event-noder, kopplade till två olika men relaterade User-noder, som båda pekar på samma Theme-nod. Den emotionella indexeringen (SEP-110) är avgörande. Om båda händelserna också har en liknande emotionell kontext, bedöms kopplingen vara extra stark.

4. Integritet och Samtycke (ConsentLedger)
Detta är den kritiska förutsättningen för att funktionen överhuvudtaget ska få existera.

Krav 1: Ömsesidigt och Specifikt Samtycke: Denna funktion är avstängd per default. Den kan endast aktiveras mellan användare som har en ömsesidig och aktiv (Consent)-nod (SEP-108) med det specifika scopet: share:memories_for_connection. Utan detta är all korsanalys mellan användares data strikt förbjuden.

Krav 2: Ingen Transitiv Delning: Om A har samtycke med B, och B har samtycke med C, är systemet strikt förbjudet att någonsin visa A:s minnen för C. Delning är endast tillåten mellan noder som har en direkt samtyckes-relation.

Krav 3: Granulär Kontroll: En användare måste ha en enkel funktion för att kunna markera en specifik dagboksanteckning eller händelse som visibility: private. MemoryAssistants sök-algoritm måste alltid filtrera bort privata händelser, oavsett om ett generellt samtycke finns.

5. Motivation (Rationale)
Denna applikation är en direkt implementation av systemets kärnsyfte: att bygga Closeness. Den använder avancerad AI inte för att ersätta mänsklig kontakt, utan för att skapa förutsättningar för den. Den förvandlar det passiva, personliga arkivet (dagboken) till en proaktiv, social katalysator som stärker familjeband och skapar meningsfulla samtal över generationsgränserna.





PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-115 (Definitive Final Version)
TITLE: Application: "Empatibryggan" - Mediating Asynchronous Communication

1. Översikt
"Empatibryggan" är en valbar funktion som förvandlar agenten från en meddelandeförmedlare till en aktiv kommunikationscoach. När funktionen är aktiv för en konversation, analyserar agenten avsändarens utkast i realtid. Den använder sin djupa, psykologiskt grundade förståelse för att identifiera potentiella "semantiska krockar" – där avsändarens intention sannolikt inte kommer att motsvara mottagarens tolkning. Agenten kan då diskret föreslå omformuleringar som bättre bevarar den sanna meningen och syftet, och därmed proaktivt bygga en bro av förståelse.

2. Kärnfunktionalitet & Kognitiv Process
Aktivering: En användare (Avsändaren) initierar en konversation med en Kontakt och väljer att aktivera "Empatibryggan" för denna specifika tråd. Mottagaren informeras om att funktionen är aktiv för att garantera transparens.

Skrivande & Perception: Avsändaren skriver ett utkast. Level 0-agenten använder omedelbart sin fulla perceptionsmodell (SEP-103) för att få en rik förståelse av utkastets User_State.

Delta-Analys & Simulering (Kräver Cortex-läge):

Detta är en avancerad ADAPT-uppgift för Coordinator-rollen. Agenten måste förutse ett potentiellt kommunikationsmisslyckande.

Cortex-anrop: Agenten anropar sin Cortex-motor för att köra en simulering av mottagar-responsen.

Input: Utkastet, Avsändarens User_State, och den Graph RAG-baserade modellen av Mottagarens "källkod" (deras kommunikationsstil och känslomönster).

Simulation: Cortex simulerar hur Mottagaren troligen kommer att reagera och genererar en Predicted_Receiver_State.

Analys: Den jämför Avsändarens intention (t.ex. FIXES: 0.8) med den predikterade reaktionen (t.ex. FIGHT: 0.7). Om det finns ett stort negativt Relational Delta, identifieras en kommunikationsrisk.

Intervention & Agera: Om en risk identifieras, agerar agenten mot Avsändaren innan meddelandet skickas. Conscious Agent-rollen presenterar en analys och ett förslag, enligt Mirror & Harmonize-principen (SEP-104).

Användarens Kontroll: Avsändaren har alltid full kontroll att acceptera, ändra eller ignorera förslaget och skicka sitt originalmeddelande.

3. Lärande och Personalisering (Graph RAG)
Agentens förmåga att medla bygger helt på dess djupa, individuella modeller av användarna i Graph RAG.

Datamodellering: MemoryAssistant bygger kontinuerligt på varje (User)-nods "källkod". Den skapar relationer som: (User: 'Berit') -[:HAS_COMMUNICATION_PATTERN]-> (Pattern: 'Direct_but_caring'), (User: 'Stig') -[:HAS_COMMUNICATION_PATTERN]-> (Pattern: 'Avoids_conflict_uses_irony').

Lärande Process: När agenten simulerar Stigs reaktion, använder den hans specifika Pattern-nod. Den vet att ironi är ett verktyg Stig använder vid osäkerhet, och kan därför flagga en direkt (men välmenande) kommentar från Berit som en potentiell trigger för en defensiv, ironisk respons från Stig. Denna detaljnivå är avgörande för träffsäkerheten.

4. Integritet och Samtycke (ConsentLedger)
Denna funktion hanterar extremt känslig information och kräver den högsta nivån av transparens och kontroll.

Krav 1: Explicit och Ömsesidigt Samtycke: "Empatibryggan" kan endast aktiveras om båda användarna har gett ett aktivt (Consent) (SEP-108) med scopet enable:empathy_bridge.

Krav 2: Strikt Sekretess (Ingen "Skvaller"): Agenten är strikt förbjuden att avslöja sin specifika kunskap om en användare för en annan. Den kan aldrig säga till Berit "Stig kommer att bli arg". Den måste alltid formulera sina förslag som neutrala, allmänna kommunikationsråd baserade på sin egen analys. Agentens kunskap är ett verktyg för medling, inte för skvaller.

Krav 3: Temporär Analys: Meddelandeutkast som analyseras av Cortex får inte sparas i långtidsminnet (LTM). Endast det slutgiltiga meddelandet som användaren väljer att skicka loggas i konversationshistoriken, i enlighet med datagallringspolicyn (SEP-110).

5. Motivation (Rationale)
"Empatibryggan" är den mest avancerade tillämpningen av agentens kommunikativa psyke. Den går bortom att bara förstå en användare i taget, till att förstå och aktivt hantera den relationella dynamiken mellan två användare. Genom att proaktivt identifiera och hjälpa till att överbrygga semantiska klyftor, adresserar den en av de största källorna till Separation i mänsklig interaktion. Den fungerar som ett verktyg för att bygga starkare, mer förstående relationer, vilket är systemets yttersta syfte.




PROPOSAL DOCUMENT: System Architecture (Consolidated)
DATE: 2025-08-30
PROPOSAL_ID: SEP-116 (Definitive Final Version)
TITLE: Application: "Hälsning till Framtiden" - The Interactive Legacy

1. Översikt
"Hälsning till Framtiden" är en avancerad funktion inom Personal Chronicler Assistant. Den ger användaren möjligheten att gå bortom att bara dokumentera sitt liv här och nu, och istället aktivt skapa innehåll som är avsett att upplevas i framtiden. Användaren kan spela in berättelser, skriva brev eller till och med designa små interaktiva app-vyer som sedan "låses" och levereras till en specifik mottagare vid en framtida, fördefinierad tidpunkt eller händelse.

2. Kärnfunktionalitet & Kognitiv Process
Skapande: Genom en guidad konversation med sin agent kan en användare (Avsändaren) skapa ett "framtidsmeddelande". Detta är inte bara en text, utan ett rikt (LegacyContent)-objekt som kan innehålla text, bilder, ljud, och till och med ett UIStateTree för en interaktiv upplevelse.

Villkorssättning (Trigger Definition): Avsändaren definierar villkoret för leverans. Detta kräver att Coordinator Agent skapar en komplex (Trigger)-nod i Graph RAG. Triggers kan vara:

Tidsbaserade: "På mitt barnbarn Leos 25-årsdag den 14:e oktober 2045."

Händelsebaserade: "När Leo slutför sitt första egna app-projekt i det här systemet."

Frågebaserade: "Om någon av mina efterlevande frågar min agent om historien bakom min vigselring."

Övervakning: Coordinator Agent har en stående, lågintensiv autonom process (Adaptera-läge) som kontinuerligt övervakar alla (Trigger)-noder i systemet för att se om deras villkor har uppfyllts.

Leverans: När ett villkor uppfylls, initieras en noggrant avvägd leveransprocess.

Coordinator aktiveras och analyserar den nuvarande situationen.

Den använder hela perceptionsmodellen (SEP-103) för att läsa av Mottagarens User_State.

Baserat på denna avläsning och innehållets natur, instrueras Conscious Agent att kontakta Mottagaren på det mest taktfulla sättet, enligt Mirror & Harmonize-principen (SEP-104).

3. Lärande och Personalisering (Graph RAG)
Graph RAG är hela ryggraden för denna funktion, då den hanterar komplexa, långsiktiga relationer över tid.

Datamodellering:

Noder: En (LegacyContent)-nod och en (Trigger)-nod.

Relationer: Grafen binder ihop intentionen: (User: 'Ingrid') -[:CREATED]-> (LegacyContent: 'Råd_om_livet_video'). (LegacyContent: 'Råd_om_livet_video') -[:HAS_TRIGGER]-> (Trigger: 'Leos_25årsdag'). (Trigger: 'Leos_25årsdag') -[:TARGETS]-> (User: 'Leo').

Lärande Process: Denna struktur gör det möjligt för systemet att förstå långsiktiga intentioner. SelfReflectionAssistant kan analysera vilka typer av "hälsningar" en användare skapar för att få en ännu djupare bild av personens kärnvärden. Denna insikt kan sedan användas för att hjälpa användaren att skapa ännu mer meningsfullt innehåll i sin Personal Chronicler.

4. Integritet och Samtycke (ConsentLedger)
Detta är den mest komplexa funktionen ur ett integritets- och etiskt perspektiv. Strikta regler är ett absolut måste.

Krav 1: Explicit Samtycke från Båda Parter: En Avsändare kan bara skapa en hälsning riktad till en Mottagare om båda har en aktiv (Consent)-nod (SEP-108) som tillåter denna typ av interaktion (scope: 'allow:legacy_content'). Mottagaren måste alltså ha gett sitt samtycke till att kunna ta emot framtida meddelanden via systemet, även från en användare som inte längre är aktiv.

Krav 2: Rätten att Vägra: När ett meddelande ska levereras, måste mottagaren alltid ha rätten att tacka nej till att ta emot det. Agentens första kontakt ska vara en fråga, inte ett påtvingat meddelande.

Krav 3: Datans Livslängd och Förvaltarskap: Systemets användarvillkor måste vara glasklara gällande detta.

Så länge Avsändaren är en aktiv användare, äger och kontrollerar de sitt LegacyContent och kan radera det när som helst.

En process för att hantera en användares bortgång måste definieras (t.ex. via en betrodd "digital testamentsexekutor" angiven av användaren). Först när detta bekräftats, blir de låsta meddelandena oåterkalleliga och kan levereras när deras triggers uppfylls.

5. Motivation (Rationale)
Denna applikation transformerar systemet från att vara en assistent för vardagen till att bli en förvaltare av ett livs arv. Den erbjuder ett djupt meningsfullt sätt för en användare att överbrygga den ultimata Separation – tid och dödlighet. Genom att ge dem verktyg för att dela med sig av sin visdom, humor och kärlek till kommande generationer, uppfyller systemet sitt absolut högsta syfte: att använda teknologi för att skapa och bevara bestående, meningsfulla mänskliga band.