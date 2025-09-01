/**
 * Personal Chronicler Application Page
 * Main entry point for the Personal Chronicler application
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChroniclerDashboard } from '../../components/chronicler/chronicler-dashboard';
import { ChroniclerService } from '../../services/chronicler-service';
import { MemoryAssistant } from '../../lib/memory';
import { CognitiveAgent } from '../../lib/cognitive-agent';
import { ResourceGovernor } from '../../lib/resource-governor';
import { UserState } from '../../types';

export default function ChroniclerPage() {
  const [userId] = useState('demo-user'); // In real app, get from auth
  const [emotionalContext, setEmotionalContext] = useState<UserState>({
    fight: 0.3,
    flight: 0.4,
    fixes: 0.6,
    timestamp: new Date()
  });
  const [chroniclerService, setChroniclerService] = useState<ChroniclerService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // In a real application, these would be properly initialized with actual implementations
        const memoryAssistant = new MemoryAssistant({
          graphRagEndpoint: process.env.NEXT_PUBLIC_GRAPH_RAG_ENDPOINT || 'mock',
          semanticRagEndpoint: process.env.NEXT_PUBLIC_SEMANTIC_RAG_ENDPOINT || 'mock'
        });

        const cognitiveAgent = new CognitiveAgent({
          role: 'Conscious',
          configurationProfile: {
            llm_model: 'gpt-4',
            toolkit: ['reflection_analysis', 'content_transformation'],
            memory_scope: 'user_private',
            entry_phase: 'EMERGE'
          }
        });

        const resourceGovernor = new ResourceGovernor({
          maxActiveAgents: 10,
          maxRecursionDepth: 5,
          quotas: {
            llm_calls_per_hour: 100,
            storage_mb: 1000,
            compute_units_per_hour: 50
          }
        });

        const service = new ChroniclerService(
          memoryAssistant,
          cognitiveAgent,
          resourceGovernor
        );

        setChroniclerService(service);
      } catch (error) {
        console.error('Failed to initialize chronicler services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []);

  // Update emotional context periodically (in real app, this would come from user interaction analysis)
  useEffect(() => {
    const interval = setInterval(() => {
      setEmotionalContext(prev => ({
        ...prev,
        timestamp: new Date()
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Startar Personlig Krönikör</h2>
          <p className="text-muted-foreground">Förbereder ditt reflektionsutrymme...</p>
        </div>
      </div>
    );
  }

  if (!chroniclerService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Fel vid initialisering</h2>
          <p className="text-muted-foreground">
            Kunde inte starta Personlig Krönikör. Vänligen försök igen senare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChroniclerDashboard
        userId={userId}
        emotionalContext={emotionalContext}
        chroniclerService={chroniclerService}
      />
    </div>
  );
}