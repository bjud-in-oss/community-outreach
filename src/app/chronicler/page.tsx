/**
 * Personal Chronicler Application Page
 * Main entry point for the Personal Chronicler application
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserState } from '@/types';
import Link from 'next/link';

interface Reflection {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  emotionalContext: UserState;
  tags: string[];
}

export default function ChroniclerPage() {
  const [reflectionTitle, setReflectionTitle] = useState('');
  const [reflectionContent, setReflectionContent] = useState('');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<UserState>({
    fight: 0.3,
    flight: 0.4,
    fixes: 0.6,
    confidence: 0.8,
    timestamp: new Date()
  });

  const handleSaveReflection = async () => {
    if (!reflectionContent.trim()) return;

    setIsProcessing(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newReflection: Reflection = {
        id: `reflection-${Date.now()}`,
        title: reflectionTitle || `Reflektion ${new Date().toLocaleDateString('sv-SE')}`,
        content: reflectionContent,
        timestamp: new Date(),
        emotionalContext: { ...currentEmotion, timestamp: new Date() },
        tags: extractTags(reflectionContent)
      };

      setReflections(prev => [newReflection, ...prev]);
      setReflectionTitle('');
      setReflectionContent('');

      // Simulate emotional state update based on content
      updateEmotionalState(reflectionContent);

    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTags = (content: string): string[] => {
    // Simple tag extraction
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
  };

  const updateEmotionalState = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['glad', 'lycklig', 'bra', 'fantastisk', 'underbar', 'kärlek'];
    const negativeWords = ['ledsen', 'arg', 'frustrerad', 'dålig', 'svår', 'problem'];
    const solutionWords = ['lösning', 'plan', 'idé', 'förslag', 'hjälp', 'förbättra'];

    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    const solutionCount = solutionWords.filter(word => lowerContent.includes(word)).length;

    setCurrentEmotion(prev => ({
      ...prev,
      fight: Math.max(0, Math.min(1, prev.fight + (negativeCount * 0.1) - (positiveCount * 0.05))),
      flight: Math.max(0, Math.min(1, prev.flight + (negativeCount * 0.05) - (solutionCount * 0.1))),
      fixes: Math.max(0, Math.min(1, prev.fixes + (solutionCount * 0.15) + (positiveCount * 0.05))),
      confidence: Math.max(0, Math.min(1, prev.confidence + (positiveCount * 0.1) - (negativeCount * 0.05))),
      timestamp: new Date()
    }));
  };

  const getEmotionalStateColor = (value: number) => {
    if (value < 0.3) return 'bg-green-500';
    if (value < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEmotionalStateText = (emotion: string, value: number) => {
    const labels: Record<string, string> = {
      fight: value > 0.7 ? 'Hög konflikt' : value > 0.3 ? 'Måttlig spänning' : 'Lugn',
      flight: value > 0.7 ? 'Hög undvikelse' : value > 0.3 ? 'Viss oro' : 'Trygg',
      fixes: value > 0.7 ? 'Mycket lösningsfokuserad' : value > 0.3 ? 'Problemlösande' : 'Passiv',
      confidence: value > 0.7 ? 'Hög självförtroende' : value > 0.3 ? 'Måttlig säkerhet' : 'Osäker'
    };
    return labels[emotion] || 'Okänd';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📖 Personlig Krönikör
            </h1>
            <p className="text-gray-600">
              Dokumentera dina tankar och reflektioner med AI-stödd analys
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">← Tillbaka hem</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Reflection Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Reflection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>✍️</span>
                  <span>Ny reflektion</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titel (valfritt)</label>
                  <Input
                    placeholder="Ge din reflektion en titel..."
                    value={reflectionTitle}
                    onChange={(e) => setReflectionTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Dina tankar</label>
                  <Textarea
                    placeholder="Vad tänker du på idag? Dela dina reflektioner, känslor och tankar..."
                    value={reflectionContent}
                    onChange={(e) => setReflectionContent(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {reflectionContent.length} tecken
                  </span>
                  <Button 
                    onClick={handleSaveReflection}
                    disabled={!reflectionContent.trim() || isProcessing}
                  >
                    {isProcessing ? 'Sparar...' : 'Spara reflektion'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Reflections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📚</span>
                  <span>Tidigare reflektioner ({reflections.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reflections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Inga reflektioner än. Skriv din första reflektion ovan!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reflections.map((reflection) => (
                      <div key={reflection.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{reflection.title}</h3>
                          <span className="text-sm text-gray-500">
                            {reflection.timestamp.toLocaleString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3 line-clamp-3">
                          {reflection.content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {reflection.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Emotional Context */}
          <div className="space-y-6">
            {/* Current Emotional State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🧠</span>
                  <span>Känslotillstånd</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Konflikt (Fight)</span>
                    <span className="text-sm">{Math.round(currentEmotion.fight * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getEmotionalStateColor(currentEmotion.fight)}`}
                      style={{ width: `${currentEmotion.fight * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getEmotionalStateText('fight', currentEmotion.fight)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Undvikelse (Flight)</span>
                    <span className="text-sm">{Math.round(currentEmotion.flight * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getEmotionalStateColor(currentEmotion.flight)}`}
                      style={{ width: `${currentEmotion.flight * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getEmotionalStateText('flight', currentEmotion.flight)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Lösningsfokus (Fixes)</span>
                    <span className="text-sm">{Math.round(currentEmotion.fixes * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${currentEmotion.fixes * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getEmotionalStateText('fixes', currentEmotion.fixes)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Självförtroende</span>
                    <span className="text-sm">{Math.round(currentEmotion.confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${currentEmotion.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getEmotionalStateText('confidence', currentEmotion.confidence)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span>AI-insikter</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">💡 Förslag</p>
                    <p className="text-blue-700">
                      {currentEmotion.fixes > 0.6 
                        ? "Du verkar vara i ett lösningsfokuserat läge. Bra tillfälle att planera framtida steg!"
                        : currentEmotion.fight > 0.6
                        ? "Du verkar känna viss spänning. Kanske hjälper det att skriva om vad som orsakar detta?"
                        : "Du verkar vara i balans. Perfekt tid för reflektion och självinsikt."
                      }
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">📈 Utveckling</p>
                    <p className="text-green-700">
                      Fortsätt att dokumentera dina tankar regelbundet för att se mönster över tid.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Statistik</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Totala reflektioner:</span>
                    <span className="font-medium">{reflections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Denna vecka:</span>
                    <span className="font-medium">
                      {reflections.filter(r => 
                        (Date.now() - r.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genomsnittlig längd:</span>
                    <span className="font-medium">
                      {reflections.length > 0 
                        ? Math.round(reflections.reduce((sum, r) => sum + r.content.length, 0) / reflections.length)
                        : 0
                      } tecken
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}