'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  EmpatibrygganService, 
  EmotionalResponsePrediction, 
  MessageSuggestion 
} from '../../services/empatibryggan-service';
import { MemoryAssistantService } from '../../lib/memory/memory-assistant';
import { ConsentVerificationService } from '../../lib/security/consent-verification';

interface EmpatibrygganCoachProps {
  /** Current message being composed */
  message: string;
  
  /** Sender user ID */
  senderId: string;
  
  /** Recipient user ID */
  recipientId: string;
  
  /** Callback when message is updated */
  onMessageChange: (message: string) => void;
  
  /** Callback when message is ready to send */
  onSendMessage: (message: string) => void;
  
  /** Whether Empatibryggan is enabled for this conversation */
  isEnabled?: boolean;
}

/**
 * Empatibryggan Communication Coach Component
 * 
 * Implements Requirements 22.3-22.4:
 * - Proactive intervention with message suggestions
 * - Sender control over suggestions (accept/modify/ignore)
 * - Privacy protection (no psychological model details)
 */
export function EmpatibrygganCoach({
  message,
  senderId,
  recipientId,
  onMessageChange,
  onSendMessage,
  isEnabled = false
}: EmpatibrygganCoachProps) {
  const [prediction, setPrediction] = useState<EmotionalResponsePrediction | null>(null);
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [empatibrygganService] = useState(() => {
    // Initialize service with dependencies
    const memoryAssistant = new MemoryAssistantService();
    const consentService = new ConsentVerificationService();
    return new EmpatibrygganService(memoryAssistant, consentService);
  });

  // Analyze message when it changes (debounced)
  useEffect(() => {
    if (!isEnabled || !message.trim() || message.length < 10) {
      setPrediction(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await analyzeMessage();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [message, senderId, recipientId, isEnabled]);

  const analyzeMessage = async () => {
    if (!message.trim()) return;

    setIsAnalyzing(true);
    try {
      // Predict emotional response
      const emotionalPrediction = await empatibrygganService.predictEmotionalResponse(
        message,
        senderId,
        recipientId
      );
      
      setPrediction(emotionalPrediction);

      // Generate suggestions if intervention is needed
      if (emotionalPrediction.intervention_level !== 'none') {
        const messageSuggestions = await empatibrygganService.generateMessageSuggestions(
          message,
          emotionalPrediction,
          senderId,
          recipientId
        );
        
        setSuggestions(messageSuggestions);
        setShowSuggestions(messageSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error analyzing message:', error);
      setPrediction(null);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: MessageSuggestion) => {
    onMessageChange(suggestion.suggested_message);
    setShowSuggestions(false);
  };

  const handleIgnoreSuggestions = () => {
    setShowSuggestions(false);
  };

  const handleSendMessage = () => {
    onSendMessage(message);
    setPrediction(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getInterventionColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'clarity': return '🔍';
      case 'empathy': return '💝';
      case 'tone': return '🎵';
      default: return '💡';
    }
  };

  if (!isEnabled) {
    return (
      <div className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            Send Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message Input */}
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type your message... Empatibryggan will help you communicate effectively."
          className="min-h-[100px]"
        />
        
        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="animate-pulse">
              Analyzing...
            </Badge>
          </div>
        )}
        
        {/* Prediction Status */}
        {prediction && !isAnalyzing && (
          <div className="absolute top-2 right-2">
            <Badge 
              className={getInterventionColor(prediction.intervention_level)}
            >
              {prediction.intervention_level === 'none' ? '✅ Looks good' : '⚠️ Suggestions available'}
            </Badge>
          </div>
        )}
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-yellow-800">
                💡 Communication Suggestions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleIgnoreSuggestions}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Ignore
              </Button>
            </div>
            
            <p className="text-sm text-yellow-700">
              Your message might be received better with some adjustments. Here are some suggestions:
            </p>

            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                      <span className="font-medium text-sm capitalize">
                        {suggestion.type} Improvement
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {suggestion.explanation}
                  </p>
                  
                  <div className="bg-gray-50 rounded p-2 mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Suggested version:
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      "{suggestion.suggested_message}"
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Use This Version
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Copy suggestion to clipboard for manual editing
                        navigator.clipboard.writeText(suggestion.suggested_message);
                      }}
                    >
                      Copy to Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Prediction Details (for transparency) */}
      {prediction && prediction.intervention_level !== 'none' && !showSuggestions && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="text-sm text-blue-800">
                This message might benefit from some adjustments
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSuggestions(true)}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Show Suggestions
            </Button>
          </div>
        </Card>
      )}

      {/* Send Controls */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {isEnabled && (
            <span>🛡️ Empatibryggan is helping you communicate thoughtfully</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {showSuggestions && (
            <Button
              variant="outline"
              onClick={handleIgnoreSuggestions}
            >
              Send Original
            </Button>
          )}
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Send Message'}
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      {isEnabled && (
        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
          🔒 Privacy protected: Empatibryggan provides general communication guidance without sharing personal details about you or the recipient.
        </div>
      )}
    </div>
  );
}

export default EmpatibrygganCoach;