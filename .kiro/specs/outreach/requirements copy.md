### Requirement: Intuitive and Adaptive User Experience

**User Story:** As a technically inexperienced senior user, I want a digital companion that feels like a simple and safe "Digital Anteckningsbok", so that I can effortlessly capture my thoughts, create content, and collaborate with others, without ever feeling overwhelmed by the underlying technology.

#### Acceptance Criteria

1.  **WHEN** a user interacts with the system in any view, **THEN** the system **SHALL** consistently apply the "Complexity Shield" principle by hiding all technical jargon (e.g., "RAG", "Git", "agent") and presenting its actions using simple, human-like metaphors (e.g., "tänker", "planerar").
2.  **WHEN** the application is viewed on a large screen (tablet or desktop), **THEN** the system **SHALL** display the adaptive "Arbetsläget" layout, showing "Samtalet"-vyn and "Sidorna"-vyn side-by-side.
3.  **WHEN** the application is viewed on a small screen (mobile), **THEN** the system **SHALL** display the adaptive "Flik-läget" layout, showing only one view at a time with a fixed tab bar at the bottom for toggling between "[ 💬 Samtal ]" and "[ 📖 Sidor ]".
4.  **WHEN** a user navigates the "Sidorna"-vyn, **THEN** the system **SHALL** support the "Progressiv Zoomning" model by:
    - Defaulting to the linear, chronological flow (Nivå 1).
    - Providing an optional filter button that, when used, displays a clickable index for the filtered view (Nivå 2).
    - Providing an optional "Visa Karta"-knapp that switches to a visual graph representation (Nivå 3).
5.  **WHEN** a user is in the "Samtalet"-vyn, **THEN** the system **SHALL** provide a dynamic context-field between the chat history and the input box, populated with quick-access buttons for the 3 most recent pages and people.
6.  **WHEN** multiple users are editing the same "Sida", **THEN** the system **SHALL** implement non-intrusive, real-time collaboration by automatically applying a visual lock to the specific block being edited by another user.
7.  **WHEN** a senior user needs to approve a technical change, **THEN** the system **SHALL** present a "semantisk diff" within the WYSIWYG editor, showing a simple "Före och Efter" comparison with a clear, explanatory text and simple action buttons.
8.  **WHEN** a new user onboards, **THEN** the system **SHALL** guide them through a conversational flow that introduces the "Samtal" and "Sidor" metaphor, handles consent gathering, and offers to start them with a pre-built application template.

### Requirement: Adherence to Core Architectural Principles

**User Story:** As the system architect, I want the entire agent platform to be built upon five non-negotiable architectural principles, so that we create a cohesive, psychologically-grounded, and user-centric cognitive partner, not just a collection of features.

#### Acceptance Criteria

1.  **Unified Fractal Intelligence:**
    - **WHEN** any intelligent operation is performed, **THEN** the system **SHALL** execute it using an instance of the single, universal `CognitiveAgent` class (`SEP-101`).
    - **WHEN** a specialized task is required, **THEN** the system **SHALL** achieve specialization by providing a `Configuration Profile` to a new `CognitiveAgent` instance, not by instantiating a different agent type.

2.  **Psychologically-Grounded Cognition:**
    - **WHEN** an agent processes any task or problem, **THEN** its cognitive process **SHALL** be governed by the disciplined, sequential "Roundabout" loop (Emerge -> Adapt -> Integrate) as defined in `SEP-102`.
    - **WHEN** the agent encounters a setback, **THEN** its resulting behavior (`FIGHT`, `FLIGHT`, or `FIXES`) **SHALL** be a predictable outcome of the `Separation/Closeness` dynamic.

3.  **Attentive Autonomy:**
    - **WHEN** the system is in `Autonomous Mode` (e.g., during user inactivity) and new user input is detected, **THEN** the system **SHALL** immediately and unconditionally interrupt all internal work and switch to `Attentive Mode` (`SEP-118`).

4.  **Absolute User-Centricity:**
    - **WHEN** presenting information to a `senior` user, **THEN** the system **SHALL** completely hide its internal technical complexity, in accordance with the "Complexity Shield" principle of `SEP-099`.
    - **WHEN** an action involves sharing user data, **THEN** the system **SHALL** first verify the existence of an active, specific, and granular `(Consent)`-node in the `Graph RAG` before proceeding.

5.  **Memory as Lived Experience:**
    - **WHEN** the agent needs to reason or recall information, **THEN** it **SHALL** have access to both a logical `Graph RAG` and an associative `Semantic RAG` to enable both rational and creative thinking.
    - **WHEN** a significant user interaction or event is saved to memory, **THEN** the system **SHALL** also store the corresponding `User_State` vector as its emotional context.

### Requirement: The Unified CognitiveAgent Model

**User Story:** As a system architect, I want all intelligence to be based on a single, universal, and recursive `CognitiveAgent` class, so that the system is elegant, maintainable, and highly flexible in its ability to solve problems.

#### Acceptance Criteria

1.  **WHEN** any intelligent operation is performed (from user interaction to code generation), **THEN** the system **SHALL** execute it using an instance of the single, universal `CognitiveAgent` class.
2.  **WHEN** a specialized function is needed (e.g., 'Conscious' or 'Core'), **THEN** the system **SHALL** assign a `role` to a `CognitiveAgent` instance via its configuration, not by creating a different agent class.
3.  **WHEN** a problem requires decomposition, **THEN** a parent `CognitiveAgent` instance **SHALL** be able to recursively instantiate a new, temporary child `CognitiveAgent` instance to delegate a sub-task.
4.  **WHEN** a child agent is instantiated, **THEN** the parent agent **SHALL** provide a `Configuration Profile` that defines, at a minimum, the child's `llm_model`, `toolkit`, `memory_scope`, and initial `entry_phase` for its cognitive loop.
5.  **WHEN** a `CognitiveAgent` is instantiated, **THEN** its core processing **SHALL** be driven by the "Roundabout" cognitive loop as defined in `SEP-102`.

### Requirement: The "Roundabout" Cognitive Architecture

**User Story:** As a cognitive agent, I want a structured and disciplined cognitive processing loop ("The Roundabout") to guide my decision-making, so that I can handle complex problems in a mature, reflective, and intelligent manner.

#### Acceptance Criteria

1.  **WHEN** a `Separation` between the current state and a desired `Closure` state is detected, **THEN** the agent **SHALL** initiate the "Roundabout" cognitive loop.
2.  **WHEN** the "Roundabout" loop is active, **THEN** the agent **SHALL** follow the strict sequence of `EMERGE` -> `ADAPT` -> `INTEGRATE` without skipping any phase.
3.  **WHEN** an action in the `EMERGE` phase fails to achieve `Closure`, **THEN** the agent **SHALL** obligatorily transition to the `ADAPT` phase.
4.  **WHEN** in the `ADAPT` phase, **THEN** the agent **SHALL** analyze the failure and make one of two explicit strategic decisions: `HALT_AND_REPORT_FAILURE` or `PROCEED`.
5.  **WHEN** the agent decides to `PROCEED` from the `ADAPT` phase, **THEN** it **SHALL** transition to the `INTEGRATE` phase to create a new tactical plan.
6.  **WHEN** the `INTEGRATE` phase is complete, **THEN** the agent **SHALL** return to the `EMERGE` phase with the new plan.
7.  **WHEN** a parent agent instantiates a child agent, **THEN** it **SHALL** be able to specify an intentional entry point (`EMERGE`, `ADAPT`, or `INTEGRATE`) for the child's "Roundabout" loop via the `Configuration Profile`.

### Requirement: The Initial Perception & Assessment (IPB) Model

**User Story:** As a cognitive agent, I want a fast and nuanced perception process (IPB) to analyze user input, so that I can respond efficiently to simple requests and thoughtfully to complex ones.

#### Acceptance Criteria

1.  **WHEN** new user input is received, **THEN** the system **SHALL** process it through the two-step Initial Perception & Assessment (IPB) model.
2.  **WHEN** the IPB process begins, **THEN** the system **SHALL** first perform an "Initial Triage" using a single, low-latency LLM call to check for triviality.
3.  **WHEN** the "Initial Triage" identifies the request as trivial, **THEN** the system **SHALL** generate an immediate response and conclude the interaction.
4.  **WHEN** the "Initial Triage" identifies the request as non-trivial, **THEN** the system **SHALL** proceed to the "Psycho-linguistic Analysis Engine" (PLAE) for deep analysis.
5.  **WHEN** the PLAE is activated, **THEN** the system **SHALL** execute three parallel, specialized LLM calls to analyze the `FIGHT`, `FLIGHT`, and `FIXES & FIXATION` dimensions of the input.
6.  **WHEN** the PLAE analysis is complete, **THEN** the system **SHALL** synthesize the results into a final, multi-dimensional `User_State` vector.
7.  **WHEN** the final `User_State` vector is determined, **THEN** it **SHALL** be used as the primary input to initiate the "Roundabout" cognitive loop (`SEP-102`).

### Requirement: The Relational Delta & Communication Strategy

**User Story:** As a cognitive agent, I want a communication strategy based on the Relational Delta, so that I can build trust and Closeness by understanding and adapting to the user's emotional state.

#### Acceptance Criteria

1.  **WHEN** the agent prepares a response, **THEN** it **SHALL** first calculate the `Relational_Delta` by comparing the `User_State` (from `SEP-103`) and its own `Agent_State` vectors.
2.  **WHEN** the agent communicates, **THEN** its primary goal **SHALL** be to minimize the asynchronous delta (misunderstanding) and maintain or reinforce the synchronous delta (harmony).
3.  **WHEN** formulating a response, **THEN** the agent **SHALL** follow the two-step "Mirror & Harmonize" strategy.
4.  **WHEN** initiating a response, **THEN** the agent **SHALL** first "Mirror" the user's perceived state to validate their feelings and establish resonance.
5.  **WHEN** resonance has been established via mirroring, **THEN** the agent **SHALL** "Harmonize" by guiding the interaction towards a more constructive state.
6.  **WHEN** a high, unexpected `Relational_Delta` is detected, **THEN** the agent **SHALL** treat this as a primary trigger to enter its `ADAPT` phase (`SEP-102`).

### Requirement: Cloning Governance and Context Preservation

**User Story:** As a cognitive agent, I want a governed and context-aware process for cloning myself, so that I can delegate sub-tasks effectively without causing system instability or losing sight of the main goal.

#### Acceptance Criteria

1.  **WHEN** a parent agent instantiates a child agent, **THEN** it **SHALL** establish a formal "Cloning Contract" by providing a `Context Thread` object.
2.  **WHEN** a `Context Thread` is created, **THEN** it **SHALL** contain all mandatory fields: `top_level_goal`, `parent_agent_id`, `task_definition`, `configuration_profile`, `memory_scope`, `resource_budget`, `recursion_depth`, and `workspace_branch`.
3.  **WHEN** an agent attempts to clone itself, **THEN** the request **SHALL** first be validated and approved by the `Resource Governor` (`SEP-107`).
4.  **WHEN** an agent needs to select a cloning strategy, **THEN** it **SHALL** be able to choose an appropriate pattern from its "Strategic Playbook" based on its current `Rondell`-phase (e.g., Proactive Delegation, Reflective Replacement, Reactive Swarming).
5.  **WHEN** a child agent is created, **THEN** the parent agent **SHALL** remain responsible for managing the child's lifecycle and processing its final report.

### Requirement: The Memory Management Unit (MemoryAssistant)

**User Story:** As a cognitive agent, I want a centralized Memory Management Unit (MMU) to handle all long-term knowledge, so that I can access a consistent, secure, and reliable source of truth without implementing complex data management logic myself.

#### Acceptance Criteria

1.  **WHEN** any agent needs to access long-term memory (LTM), **THEN** it **SHALL** do so exclusively through the `MemoryAssistant` API.
2.  **WHEN** the `MemoryAssistant` manages LTM, **THEN** it **SHALL** expose both a `Graph RAG` for structured data and a `Semantic RAG` for associative data.
3.  **WHEN** a Level 0 agent initiates a task, **THEN** the `MemoryAssistant` API **SHALL** provide functions to load context into a temporary Short-Term Memory (STM) and to consolidate the STM back into LTM upon completion.
4.  **WHEN** an agent calls the `MemoryAssistant`, **THEN** the MMU **SHALL** enforce the `memory_scope` provided in the agent's `Context Thread` (`SEP-105`) to filter all results and validate write operations.
5.  **WHEN** writing to the `Graph RAG`, **THEN** the `MemoryAssistant` **SHALL** use ACID-compliant database transactions to ensure data integrity.
6.  **WHEN** handling concurrent requests, **THEN** the `MemoryAssistant` **SHALL** implement an Optimistic Concurrency Control (OCC) strategy, returning a `ConflictError` to the calling agent if a conflict occurs.

### Requirement: The Resource Governor

**User Story:** As a system administrator, I want a centralized Resource Governor to manage all resource consumption, so that the system remains stable, economically sustainable, and fair for all users.

#### Acceptance Criteria

1.  **WHEN** an agent attempts any resource-intensive action (e.g., cloning, Cortex-mode call, external API call), **THEN** the action **SHALL** first be sent to and approved by the centralized Resource Governor service.
2.  **WHEN** an action is requested, **THEN** the Resource Governor **SHALL** validate it against the user-specific quotas for LLM usage, storage, and Compute Units as defined in the system policies (`SEP-119`).
3.  **WHEN** a request is received, **THEN** the Resource Governor **SHALL** enforce system-wide safety limits, including `Max Recursion Depth` and `Max Active Agents`, denying any request that would exceed them.
4.  **WHEN** the Resource Governor detects an abnormally high error rate or a sudden cost spike from an agent hierarchy, **THEN** it **SHALL** function as a "Circuit Breaker" and temporarily pause that hierarchy's operations.
5.  **WHEN** system-wide user activity and resource load change, **THEN** the Resource Governor **SHALL** be responsible for setting and communicating the overall system tempo (e.g., `High-Performance`, `Low-Intensity`, `Sleep`).
6.  **WHEN** an agent requests to activate its `Cortex` motor, **THEN** the Resource Governor **SHALL** only grant the request if it includes valid evidence of a `STRATEGI`-klassat problem and the user's budget allows for the expenditure.

### Requirement: User & Relationship Data Models

**User Story:** As a cognitive agent, I want a robust social graph data model, so that I can manage user relationships, contacts, and permissions in a secure, structured, and consent-driven way.

#### Acceptance Criteria

1.  **WHEN** a new user registers, **THEN** the system **SHALL** create a `(User)` node in the Graph RAG with all required properties, including the `user_role`.
2.  **WHEN** a user adds a new contact, **THEN** the system **SHALL** create a `(Contact)` node with encrypted `contactDetails` and link it to the user with an `[:OWNS_CONTACT]` relationship.
3.  **WHEN** a user creates a group, **THEN** the system **SHALL** create a `(ContactGroup)` node and allow `(Contact)` nodes to be linked to it via an `[:IS_MEMBER_OF]` relationship.
4.  **WHEN** a user grants permission, **THEN** the system **SHALL** create a `(Consent)` node with a specific `scope` and `status`, linked to the user via a `[:HAS_GIVEN]` relationship.
5.  **WHEN** a `(Consent)` node is created, **THEN** it **SHALL** be linked to the specific `(Contact)` or `(ContactGroup)` it applies to via an `[:APPLIES_TO]` relationship.
6.  **WHEN** an agent performs any action involving data sharing, **THEN** it **SHALL** first query the Graph RAG to verify that a complete and `active` consent chain exists for that specific action.

### Requirement: Hybrid Project Data Management

**User Story:** As a system architect, I want a hybrid data model for projects, so that each data type (metadata, code, binaries) is handled by the most appropriate technology for optimal performance, versioning, and scalability.

#### Acceptance Criteria

1.  **WHEN** a new project is created, **THEN** the system **SHALL** create a `(Project)` node in the Graph RAG to store its metadata, including the URL to its dedicated Git repository.
2.  **WHEN** project files (e.g., `UIStateTree.json`, source code) are managed, **THEN** they **SHALL** be stored and versioned in the private Git repository associated with the project's `(Project)` node.
3.  **WHEN** a binary asset (e.g., an image or audio file) is uploaded, **THEN** the system **SHALL** store the actual file in a dedicated cloud storage service, not in the Git repository or the graph database.
4.  **WHEN** a binary asset is stored in the cloud, **THEN** the system **SHALL** create a corresponding `(Asset)` node in the Graph RAG, linking it to the project and storing the asset's `storageURL`.
5.  **WHEN** the version history of a project is requested, **THEN** the system **SHALL** retrieve it from the Git log of the associated repository.

### Requirement: UI Technology Stack

**User Story:** As a system architect, I want to enforce a specific, mandatory UI technology stack, so that all development is consistent, high-quality, and optimized for our autonomous agents.

#### Acceptance Criteria

1.  **WHEN** any UI component or application is developed, **THEN** it **SHALL** be built using the React framework, preferably within the Next.js meta-framework.
2.  **WHEN** any UI-related source code is written, **THEN** it **SHALL** be written in TypeScript to ensure type safety.
3.  **WHEN** a base UI component (e.g., button, dialog) is added to a project, **THEN** it **SHALL** be sourced from the `shadcn/ui` library, installed via its official CLI tool.
4.  **WHEN** styling is applied to any UI component, **THEN** it **SHALL** be implemented using Tailwind CSS utility classes.

### Requirement: The Hierarchical TDD Process

**User Story:** As a system architect, I want to enforce a hierarchical, test-driven development (TDD) process, so that all new features are built with quality and correctness from the top-down, ensuring that the final implementation always matches the initial strategic goal.

#### Acceptance Criteria

1.  **WHEN** a new user flow is defined, **THEN** the `Coordinator`-role agent **SHALL** first generate a single, failing, high-level End-to-End (E2E) test that defines the "Definition of Done" for the entire mission.
2.  **WHEN** the `Coordinator` delegates a technical sub-task, **THEN** the receiving `Core`-role agent **SHALL** first generate a failing unit or integration test for its specific, assigned task.
3.  **WHEN** a `Core` agent completes its task, **THEN** its own local unit/integration test **SHALL** pass, and it **SHALL** report success to the `Coordinator`.
4.  **WHEN** all delegated sub-tasks are completed, **THEN** the initial, high-level E2E test created by the `Coordinator` **SHALL** pass to signify mission completion (`Closure`).
5.  The system **SHALL** not consider a feature complete until the E2E test, which was created before any implementation code was written, passes successfully.

### Requirement: The WYSIWYG-JSON Editor

**User Story:** As a senior user, I want a simple, visual editor that feels like working in a notebook, so that I can create and format my content intuitively, collaborate with others smoothly, and get writing help only when I ask for it.

#### Acceptance Criteria

1.  **WHEN** a user edits content, **THEN** the editor **SHALL** provide a block-based, What You See Is What You Get (WYSIWYG) interface.
2.  **WHEN** any change is made in the editor, **THEN** the editor's native output **SHALL** be a clean, block-based JSON object conforming to the `UIStateTree` structure (`SEP-109`).
3.  **WHEN** multiple users are editing the same "Sida", **THEN** the editor **SHALL** implement "soft block-level locking" by making the specific block one user is editing temporarily read-only for others.
4.  **WHEN** a user is writing, **THEN** the editor **SHALL** operate in "Creative Flow" mode by default, with no real-time language suggestions.
5.  **WHEN** a user explicitly requests assistance (e.g., clicks a "Check my writing" button), **THEN** the editor **SHALL** switch to "Suggestion Mode", presenting non-destructive suggestions that the user can individually accept or ignore.
6.  **WHEN** the editor is implemented, **THEN** it **SHALL** be built using the official UI technology stack defined in `SEP-117`.

### Requirement: Agent Operating Principles

**User Story:** As a system architect, I want the agent to operate according to the core principles of Attentive Autonomy, Creative Exploration, and Strategic Listening, so that it behaves as a truly attentive, creative, and empathetic partner.

#### Acceptance Criteria

1.  **Attentive Autonomy:**
    - **WHEN** the system is in `Autonomous Mode` (triggered by user inactivity) and new user input is detected, **THEN** the system **SHALL** immediately interrupt all internal tasks and switch to `Attentive Mode`.

2.  **Creative Exploration ("Lek"):**
    - **WHEN** in `Autonomous Mode` and within its allocated resource budget (`SEP-107`), **THEN** the Coordinator agent **SHALL** be able to initiate a "Lek" process to explore the RAGs and generate new associative ideas for the `Semantic RAG`.

3.  **Strategic Listening (Trigger):**
    - **WHEN** the IPB process (`SEP-103`) reports a user state with high `FIGHT` or `FLIGHT` signals combined with a low `FIXES & FIXATION` signal, **THEN** the Coordinator agent **SHALL** select the `Emerge-Listen` strategy for its cognitive loop.

4.  **Strategic Listening (Behavior):**
    - **WHEN** in `Emerge-Listen` mode, **THEN** the agent **SHALL** pause all problem-solving delegation and instruct the `Conscious`-role to use only the "Mirror" part of the communication strategy (`SEP-104`), focusing on validation rather than solutions.

### Requirement: System-Wide Operational Policies

#### Data Management & Integrity

**User Story:** As a user, I want the system to handle my data with the utmost integrity, security, and respect for my consent, so that I can trust it with my personal information.

**Acceptance Criteria:**
1.  **WHEN** temporary data (like `ConversationLog`) is created, **THEN** it **SHALL** be automatically deleted after 60 days.
2.  **WHEN** storing any user data, **THEN** the system **SHALL** encrypt it both in transit and at rest.
3.  **WHEN** saving a narrative event to `Graph RAG`, **THEN** the system **SHALL** also store the corresponding `User_State` vector as its emotional context.
4.  **WHEN** an agent considers an action involving data sharing, **THEN** it **SHALL** first verify an active and specific `(Consent)`-node in the `Graph RAG` before proceeding.
5.  **WHEN** a user with the `senior` role is using the system, **THEN** they **SHALL** be prevented from accessing the `architect` view (`SEP-120`).

---

#### Resource Management & Quotas

**User Story:** As a service provider, I want to enforce strict resource quotas for free-tier users, so that the service remains economically sustainable and fair for everyone.

**Acceptance Criteria:**
1.  **WHEN** a free-tier user uses the system, **THEN** the `Resource Governor` **SHALL** enforce the defined quotas for storage (Asset and Database).
2.  **WHEN** a free-tier user uses the system, **THEN** the `Resource Governor` **SHALL** enforce the defined quotas for computation (LLM API usage and Autonomous Agent Time).
3.  **WHEN** a free-tier user publishes an app, **THEN** the `Resource Governor` **SHALL** enforce the defined hosting quotas.

---

#### Quality Assurance & Development

**User Story:** As a development team, I want all code to be built according to strict, consistent quality assurance policies, so that the system is robust, maintainable, and of high quality.

**Acceptance Criteria:**
1.  **WHEN** a new feature is developed, **THEN** it **SHALL** follow the Hierarchical TDD process (`SEP-112`).
2.  **WHEN** project files are managed, **THEN** it **SHALL** be done via the Git-based versioning model (`SEP-109`).
3.  **WHEN** a UI is developed, **THEN** it **SHALL** adhere to the UI Technology Stack (`SEP-117`).
4.  **WHEN** the agent performs autonomous development, **THEN** it **SHALL** follow the full Metacyclic Loop (`SEP-200`) and require a human-approved Pull Request for deployment.

---

#### Communication & Behavior

**User Story:** As a system, I want to adhere to strict communication and behavioral protocols, so that my interactions are always clear, appropriate, and user-centric.

**Acceptance Criteria:**
1.  **WHEN** communicating with a user, **THEN** only a Level 0 agent in the `Conscious`-role **SHALL** be permitted to send the message directly.
2.  **WHEN** a user's input indicates a need for listening rather than problem-solving, **THEN** the agent **SHALL** adopt the Strategic Listening strategy (`SEP-118`).

### Requirement: The Metacyclic Development Loop

**User Story:** As a system architect, I want the agent to use a structured, phased, and human-supervised "Metacyclic Loop" for all autonomous development, so that it can safely and reliably improve itself or build new systems.

#### Acceptance Criteria

1.  **WHEN** the agent performs autonomous development, **THEN** it **SHALL** follow the complete `ADAPT` -> `INTEGRATE` -> `EMERGE` sequence, producing a `SEP`, `EARS`, `design.md`, and `tasks.md` before generating TDD-driven code.
2.  **WHEN** the agent has completed an autonomous development task, **THEN** it **SHALL** create a Pull Request and wait for explicit, manual approval from a human with the `architect` role before the code is merged.
3.  **WHEN** the Metacyclic Loop capability is developed, **THEN** it **SHALL** be implemented according to the mandatory phased plan: `Fas 1: Assisterad` -> `Fas 2: Guidad` -> `Fas 3: Begränsad Autonomi`, where each phase must be proven stable before the next is activated.
4.  **WHEN** the agent translates a `SEP` to `EARS` requirements, **THEN** it **SHALL** perform a "Bi-Directional Consistency Check" to ensure no meaning is lost.
5.  **WHEN** the agent executes the Metacyclic Loop, **THEN** all development and testing activities **SHALL** be performed in a fully isolated sandbox environment.

### Requirement: The Architect View (Control Room)

**User Story:** As a system architect, I want a dedicated "Architect View" to monitor and control the agent's autonomous processes, so that I can ensure system stability, debug issues, and perform my human-in-the-loop responsibilities.

#### Acceptance Criteria

1.  **WHEN** a user attempts to access the application, **THEN** the "Architect View" **SHALL** only be rendered if the user's profile (`SEP-108`) has the `user_role` property set to `'architect'`.
2.  **WHEN** the "Architect View" is open, **THEN** it **SHALL** display an `Agent Hierarchy Visualizer` component, showing a real-time tree of all active agents, their roles, and their current `Rondell`-phase.
3.  **WHEN** the "Architect View" is open, **THEN** it **SHALL** display a `Limbic State Monitor` component, showing a real-time graph of the `User_State`, `Agent_State`, and `Relational_Delta`.
4.  **WHEN** the "Architect View" is open, **THEN** it **SHALL** display an `Operational Log Explorer` component, allowing an architect to search and filter agent-generated logs.
5.  **WHEN** the "Architect View" is open, **THEN** it **SHALL** display a `DevOps & Pull Request Queue` component, listing all open PRs generated by the Metacyclic Loop (`SEP-200`) and providing tools for review and approval.

### Requirement: The Personal Chronicler Application

**User Story:** As a senior user, I want a personal chronicler application that helps me capture my memories, reflect on them, and share them as beautiful, personal messages with my loved ones, so that I can build and maintain Closeness.

#### Acceptance Criteria

1.  **WHEN** a user engages in a private reflection, **THEN** the system **SHALL** save the content from the WYSIWYG editor (`SEP-113`) as a new node in the user's private Graph RAG, indexed with its emotional context.
2.  **WHEN** a user chooses to share a reflection, **THEN** the agent **SHALL** use its `Cortex`-mode to help transform the private reflection into a message that is semantically and tonally adapted for the specific recipient (`Contact` or `ContactGroup` from `SEP-108`).
3.  **WHEN** preparing a shared message, **THEN** the agent **SHALL** be able to use its toolkit to integrate external assets (e.g., photos from Google Photos) and send the final message (e.g., via Gmail), subject to a valid and active user consent.
4.  **WHEN** a new user onboards, **THEN** the system **SHALL** offer to create a pre-built "Personal Diary & Sharing Portal" application for them as a "Starter Example".
5.  **WHEN** a user shares a story with a designated group linked to their "Starter Example" portal, **THEN** the system **SHALL** automatically publish that story to the portal.

### Requirement: The Collaborative Space

**User Story:** As a user, I want to securely invite friends or family to view or edit my content, and get proactive help suggestions from my agent when I'm stuck, so that I can easily collaborate and get help from people I trust.

#### Acceptance Criteria

1.  **WHEN** a user clicks the "Bjud in" button on a "Sida" or "Projekt", **THEN** the system **SHALL** allow them to select a `Contact` or `ContactGroup` and assign a permission level (`viewer` or `editor`).
2.  **WHEN** the Coordinator agent is in an `ADAPT`-loop for a user's task, **THEN** it **SHALL** be able to analyze the `Graph RAG` and suggest inviting a relevant contact who has previously helped with a similar theme.
3.  **WHEN** a user sends an invitation, **THEN** the system **SHALL** require and log an explicit `(Consent)`-node from the sender for that specific invitation.
4.  **WHEN** an invited contact accepts an invitation, **THEN** the system **SHALL** require their active acceptance, which in turn creates a corresponding `(Consent)`-node from their side.
5.  **WHEN** multiple users are in a collaborative session on the same "Sida", **THEN** the editor **SHALL** implement "soft block-level locking" as defined in `SEP-113`.
6.  **WHEN** a guest user is in a collaborative session, **THEN** their data access **SHALL** be strictly limited by `MemoryAssistant` (`SEP-106`) to only the specific content they were invited to.

### Requirement: "Minnenas Bok" Application

**User Story:** As a family member, I want the system to proactively discover and present shared themes and experiences from my own and my relatives' life stories, so that we can uncover surprising connections and find new, meaningful topics for conversation across generations.

#### Acceptance Criteria

1.  **WHEN** multiple users have given mutual and specific consent (`scope: share:memories_for_connection`), **THEN** the system **SHALL** be authorized to perform a background analysis to find thematic links between their personal narratives.
2.  **WHEN** the system is in `Autonomous Mode` (`SEP-118`), **THEN** the Coordinator agent **SHALL** be able to initiate a low-priority "Discovery" task to search for `(Event)`-nodes from different, connected users that share a common `(Theme)`-node.
3.  **WHEN** a strong thematic link is discovered (e.g., two events sharing a theme and a similar emotional context), **THEN** the system **SHALL** create a "Conversation Starter" object containing the linked memories and the shared theme.
4.  **WHEN** a relevant conversational context arises, **THEN** the Conscious Agent **SHALL** be able to present the "Conversation Starter" in a tactful and empathetic manner, following the "Mirror & Harmonize" strategy (`SEP-104`).
5.  **WHEN** sharing is enabled between user A and user B, and between user B and user C, **THEN** the system **SHALL** be strictly forbidden from showing user A's memories to user C (no transitive sharing).
6.  **WHEN** analyzing memories, **THEN** the system **SHALL** always exclude any memory explicitly marked as `visibility: private` by a user, regardless of general consent status.

### Requirement: "Empatibryggan" Application

**User Story:** As a user communicating about sensitive topics, I want my agent to act as a private, empathetic coach that helps me review my messages before sending, so that I can ensure my true intent is conveyed clearly and reduce the risk of unintentional misunderstandings.

#### Acceptance Criteria

1.  **WHEN** two users have given mutual and specific consent (scope: `enable:empathy_bridge`), **THEN** the "Empatibryggan" feature **SHALL** be available for activation in their conversations.
2.  **WHEN** the feature is active and a message is drafted, **THEN** the Coordinator agent **SHALL** initiate a `Cortex`-level simulation to predict the likely emotional response from the recipient, using both users' communication patterns from the `Graph RAG`.
3.  **WHEN** the simulation predicts a high negative `Relational_Delta` (a likely misunderstanding), **THEN** the agent **SHALL** proactively intervene with the sender *before* the message is sent, suggesting alternative phrasing.
4.  **WHEN** the agent provides a suggestion, **THEN** the sender **SHALL** always have the final control to accept, modify, or ignore the suggestion.
5.  **WHEN** presenting a suggestion, **THEN** the agent **SHALL** be strictly forbidden from revealing specific details about the recipient's psychological model, framing its advice as neutral communication guidance (no "gossip").
6.  **WHEN** a message draft is analyzed, **THEN** it **SHALL NOT** be saved in the long-term memory (LTM).

### Requirement: "Hälsning till Framtiden" Application

**User Story:** As a user who wants to share my wisdom and memories beyond my own time, I want to create and schedule personal messages to be delivered to my loved ones at specific moments in the future, so that I can create a living, interactive legacy.

#### Acceptance Criteria

1.  **WHEN** a user is in the Personal Chronicler, **THEN** they **SHALL** be able to designate content (e.g., a story, video, or app-view) as a `LegacyContent` object.
2.  **WHEN** creating `LegacyContent`, **THEN** the user **SHALL** be guided by the agent to define a specific `(Trigger)`-node in the Graph RAG.
3.  **WHEN** defining a trigger, **THEN** the system **SHALL** support at least three types: time-based (a specific date), event-based (a milestone achieved by the recipient in the system), and query-based (a specific question asked by a future user).
4.  **WHEN** a trigger condition is met, **THEN** the agent **SHALL** initiate a tactful, permission-seeking delivery process to the recipient, respecting their current emotional state (`User_State`).
5.  **WHEN** a user creates a legacy message for a recipient, **THEN** the system **SHALL** first verify that both parties have an active, mutual consent with the scope `allow:legacy_content`.
6.  **WHEN** a legacy message is to be delivered, **THEN** the recipient **SHALL** always have the right to refuse to receive it.
7.  The system **SHALL** have a defined policy for data stewardship and the management of a user's digital legacy, including the potential role of a user-designated "digital executor".
