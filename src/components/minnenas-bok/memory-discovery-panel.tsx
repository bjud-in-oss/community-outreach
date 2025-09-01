/**
 * Memory Discovery Panel for Minnenas Bok
 * Implements tactful presentation of discovered memory connections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ConversationStarter, MemoryLink } from '../../types/minnenas-bok';
import { MinnenasBookService } from '../../services/minnenas-bok-service';

interface MemoryDiscoveryPanelProps {
  userId: string;
  minnenasBookService: MinnenasBookService;
  onStartConversation?: (starter: ConversationStarter) => void;
}

export const MemoryDiscoveryPanel: React.FC<MemoryDiscoveryPanelProps> = ({
  userId,
  minnenasBookService,
  onStartConversation
}) => {
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(false);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(false);

  useEffect(() => {
    checkDiscoveryStatus();
  }, [userId]);

  const checkDiscoveryStatus = async () => {
    try {
      // Check if user has any mutual consent connections
      const connections = await minnenasBookService.getAuthorizedConnections(userId);
      setDiscoveryEnabled(connections.length > 0);
      
      if (connections.length > 0) {
        loadConversationStarters();
      }
    } catch (error) {
      console.error('Error checking discovery status:', error);
    }
  };

  const loadConversationStarters = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch existing conversation starters
      // For now, we'll simulate with empty array
      setConversationStarters([]);
    } catch (error) {
      console.error('Error loading conversation starters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDiscovery = async () => {
    setLoading(true);
    try {
      const connections = await minnenasBookService.getAuthorizedConnections(userId);
      if (connections.length > 0) {
        await minnenasBookService.initiateDiscoveryTask([userId, ...connections]);
        // Refresh starters after discovery
        setTimeout(loadConversationStarters, 2000);
      }
    } catch (error) {
      console.error('Error starting discovery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseStarter = (starter: ConversationStarter) => {
    if (onStartConversation) {
      onStartConversation(starter);
    }
  };

  if (!discoveryEnabled) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 Minnenas Bok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              För att upptäcka gemensamma minnen behöver du och dina familjemedlemmar 
              ge varandra tillstånd att dela minnen för att skapa kontakt.
            </p>
            <Button variant="outline" disabled>
              Inga anslutningar tillgängliga
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" role="region" aria-label="Minnenas Bok">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📚 Minnenas Bok
          <Badge variant="secondary">Minnesupptäckt</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversationStarters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Jag kan hjälpa dig upptäcka överraskande kopplingar mellan dina minnen 
              och dina familjemedlemmars berättelser.
            </p>
            <Button 
              onClick={handleStartDiscovery}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Söker efter kopplingar...' : 'Upptäck gemensamma minnen'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upptäckta kopplingar</h3>
            {conversationStarters.map((starter) => (
              <ConversationStarterCard
                key={starter.id}
                starter={starter}
                onUse={() => handleUseStarter(starter)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ConversationStarterCardProps {
  starter: ConversationStarter;
  onUse: () => void;
}

const ConversationStarterCard: React.FC<ConversationStarterCardProps> = ({
  starter,
  onUse
}) => {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {starter.sharedTheme}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {starter.createdAt.toLocaleDateString('sv-SE')}
            </span>
          </div>
          
          <p className="text-sm leading-relaxed">
            {starter.tactfulPresentation}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {starter.suggestedContext.map((context, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {context}
                </Badge>
              ))}
            </div>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={onUse}
              className="text-xs"
            >
              Använd som samtalsstart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};