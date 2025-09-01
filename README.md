# Community Outreach System

An intelligent, psychologically-grounded cognitive agent platform designed to serve as a digital companion for senior users.

## Overview

The Community Outreach System combines advanced AI capabilities with an intuitive user interface, enabling users to capture thoughts, create content, and collaborate seamlessly while maintaining complete privacy and consent control.

## Core Architectural Principles

1. **Unified Fractal Intelligence** - All intelligence operations use a single `CognitiveAgent` class
2. **Psychologically-Grounded Cognition** - "Roundabout" cognitive loop (EMERGE → ADAPT → INTEGRATE)
3. **Attentive Autonomy** - Immediate switch from Autonomous to Attentive mode on user input
4. **Absolute User-Centricity** - "Complexity Shield" hides technical details from senior users
5. **Memory as Lived Experience** - Dual RAG system with emotional context storage

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Neo4j (Graph RAG)
- **Testing**: Vitest
- **Version Control**: Git

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Neo4j database (for production)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Testing

Run tests with:
```bash
npm test
```

## Core Interfaces

### CognitiveAgent
The universal agent class that handles all intelligence operations in the system.

### ConfigurationProfile
Defines agent capabilities, model selection, and operational parameters.

### ContextThread
Maintains state and context across agent interactions.

### UserState & AgentState
Multi-dimensional vectors for emotional and cognitive state representation.

## Development Guidelines

- Follow the Hierarchical TDD process
- All UI components must use the shadcn/ui library
- Implement the "Complexity Shield" principle for senior users
- Ensure WCAG 2.1 AA accessibility compliance
- Use TypeScript strict mode for type safety

## License

Private - Community Outreach System