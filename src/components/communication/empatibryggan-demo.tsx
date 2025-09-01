'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { EmpatibrygganCoach } from './empatibryggan-coach';
import { useEmpatibryggan } from '../../hooks/use-empatibryggan';

/**
 * Demo component showing Empatibryggan integration
 * Demonstrates Requirements 22.1-22.4 in action
 */
export function EmpatibrygganDemo() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<Array<{
    id: string;
    text: string;
    timestamp: Date;
    hadSuggestions: boolean;
    usedSuggestion: boolean;
  }>>([]);
  
  // Mock user IDs for demo
  const senderId = 'demo-sender';
  const recipientId = 'demo-recipient';
  
  const {
    isAvailable,
    isEnabled,
    toggleEnabled,
    getUsageStats,
    hasActivePrediction,
    requiresIntervention
  } = useEmpatibryggan(senderId, recipientId);

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date(),
      hadSuggestions: requiresIntervention,
      usedSuggestion: message !== currentMessage // Simple heuristic
    };
    
    setSentMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
  };

  const usageStats = getUsageStats();

  const demoMessages = [
    {
      text: "You need to fix this immediately!",
      description: "Aggressive tone - should trigger tone suggestions"
    },
    {
      text: "Maybe you could perhaps possibly consider looking into this when you have time if that's okay?",
      description: "Unclear language - should trigger clarity suggestions"
    },
    {
      text: "Fix this problem now.",
      description: "Lacks empathy - should trigger empathy suggestions"
    },
    {
      text: "Could you please help me understand how to approach this task? I'd really appreciate your guidance.",
      description: "Well-crafted message - should show positive feedback"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Empatibryggan Communication Coach</h1>
        <p className="text-gray-600">
          Helping you communicate thoughtfully and effectively
        </p>
      </div>

      {/* Availability Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Empatibryggan Status</h3>
            <div className="flex items-center gap-2">
              <Badge variant={isAvailable ? "default" : "secondary"}>
                {isAvailable ? "Available" : "Not Available"}
              </Badge>
              {isAvailable && (
                <Badge variant={isEnabled ? "default" : "outline"}>
                  {isEnabled ? "Enabled" : "Disabled"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isAvailable 
                ? "Both users have given mutual consent for communication coaching"
                : "Mutual consent required for Empatibryggan features"
              }
            </p>
          </div>
          
          {isAvailable && (
            <Button
              onClick={toggleEnabled}
              variant={isEnabled ? "outline" : "default"}
            >
              {isEnabled ? "Disable" : "Enable"} Coaching
            </Button>
          )}
        </div>
      </Card>

      {/* Demo Messages */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Try These Example Messages</h3>
        <div className="grid gap-3">
          {demoMessages.map((demo, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-mono text-sm">{demo.text}</p>
                <p className="text-xs text-gray-500 mt-1">{demo.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMessage(demo.text)}
              >
                Try This
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Message Composer */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Compose Message</h3>
        <EmpatibrygganCoach
          message={currentMessage}
          senderId={senderId}
          recipientId={recipientId}
          onMessageChange={setCurrentMessage}
          onSendMessage={handleSendMessage}
          isEnabled={isEnabled}
        />
      </Card>

      {/* Usage Statistics */}
      {isEnabled && (
        <Card className="p-4">
          <h3 className="font-medium mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {usageStats.messages_analyzed}
              </div>
              <div className="text-sm text-gray-600">Messages Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {usageStats.suggestions_accepted}
              </div>
              <div className="text-sm text-gray-600">Suggestions Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {usageStats.conflicts_prevented}
              </div>
              <div className="text-sm text-gray-600">Conflicts Prevented</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(usageStats.improvement_rate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Improvement Rate</div>
            </div>
          </div>
        </Card>
      )}

      {/* Message History */}
      {sentMessages.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium mb-4">Message History</h3>
          <div className="space-y-3">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sent at {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {msg.hadSuggestions && (
                    <Badge variant="outline" className="text-xs">
                      Had Suggestions
                    </Badge>
                  )}
                  {msg.usedSuggestion && (
                    <Badge variant="default" className="text-xs">
                      Used Suggestion
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Privacy Information */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Privacy & Security</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            🔒 <strong>Privacy Protected:</strong> Empatibryggan provides general communication guidance 
            without sharing personal psychological details about you or the recipient.
          </p>
          <p>
            🛡️ <strong>Consent Required:</strong> Both users must explicitly consent to enable 
            Empatibryggan features for their conversations.
          </p>
          <p>
            🗑️ <strong>No Storage:</strong> Message drafts are analyzed in real-time but never 
            saved to long-term memory.
          </p>
          <p>
            ⚖️ <strong>User Control:</strong> You always have final control over your messages - 
            accept, modify, or ignore any suggestions.
          </p>
        </div>
      </Card>

      {/* Technical Details */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">How It Works</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>1. Emotional Prediction:</strong> Uses Cortex-mode simulation to predict 
            how your message might be emotionally received.
          </p>
          <p>
            <strong>2. Delta Analysis:</strong> Calculates potential misunderstanding 
            (asynchronous delta) and emotional harmony (synchronous delta).
          </p>
          <p>
            <strong>3. Smart Suggestions:</strong> Generates targeted improvements for 
            clarity, empathy, and tone when needed.
          </p>
          <p>
            <strong>4. Mirror & Harmonize:</strong> Follows established communication 
            strategies to build trust and understanding.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default EmpatibrygganDemo;