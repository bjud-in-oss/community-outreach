'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function Home() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    // Check system health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemHealth(data))
      .catch(err => console.error('Health check failed:', err));

    // Check available LLM providers
    checkAvailableProviders();
  }, []);

  const checkAvailableProviders = async () => {
    const providers = [];
    
    // Check if API keys are configured
    if (process.env.NEXT_PUBLIC_GEMINI_AVAILABLE === 'true') providers.push('Gemini (Gratis)');
    if (process.env.NEXT_PUBLIC_GROK_AVAILABLE === 'true') providers.push('Grok (Snabb)');
    if (process.env.NEXT_PUBLIC_OPENAI_AVAILABLE === 'true') providers.push('OpenAI');
    if (process.env.NEXT_PUBLIC_ANTHROPIC_AVAILABLE === 'true') providers.push('Claude');
    if (process.env.NEXT_PUBLIC_OLLAMA_AVAILABLE === 'true') providers.push('Ollama (Lokal)');
    
    setAvailableProviders(providers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Outreach System
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            En intelligent, psykologiskt grundad kognitiv agentplattform
          </p>
          <div className="flex justify-center items-center space-x-4">
            <Badge variant="secondary">Version 1.0.0</Badge>
            {systemHealth && (
              <Badge 
                variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}
                className={systemHealth.status === 'healthy' ? 'bg-green-500' : ''}
              >
                System: {systemHealth.status === 'healthy' ? 'Frisk' : 'Problem'}
              </Badge>
            )}
          </div>
        </div>

        {/* System Status */}
        {systemHealth && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔧</span>
                <span>Systemstatus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(systemHealth.uptime / 60)}m
                  </div>
                  <p className="text-sm text-gray-600">Drifttid</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {availableProviders.length}
                  </div>
                  <p className="text-sm text-gray-600">AI-leverantörer</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    6
                  </div>
                  <p className="text-sm text-gray-600">Systemmoduler</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {systemHealth.version}
                  </div>
                  <p className="text-sm text-gray-600">Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available AI Providers */}
        {availableProviders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🤖</span>
                <span>Tillgängliga AI-leverantörer</span>
              </CardTitle>
              <CardDescription>
                Systemet stödjer flera AI-leverantörer för optimal prestanda och kostnad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableProviders.map((provider) => (
                  <Badge key={provider} variant="outline" className="text-sm">
                    {provider}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Chronicler */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📖</span>
                <span>Krönikan</span>
              </CardTitle>
              <CardDescription>
                Reflektionsverktyg för att dokumentera och bevara livets berättelser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Strukturerad självreflektion</li>
                <li>• Emotionell kontextanalys</li>
                <li>• Säker berättelselagring</li>
              </ul>
              <Link href="/chronicler">
                <Button className="w-full">Öppna Krönikan</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Minnenas Bok */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📚</span>
                <span>Minnenas Bok</span>
              </CardTitle>
              <CardDescription>
                AI-driven minnesupptäckt och tematisk analys av livshändelser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Automatisk minneskoppling</li>
                <li>• Tematisk kategorisering</li>
                <li>• Samtalsförslag</li>
              </ul>
              <Button className="w-full" disabled>
                Kommer snart
              </Button>
            </CardContent>
          </Card>

          {/* Empatibryggan */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>💬</span>
                <span>Empatibryggan</span>
              </CardTitle>
              <CardDescription>
                Emotionell analys och kommunikationsvägledning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Känslotillståndsanalys</li>
                <li>• Kommunikationsförbättringar</li>
                <li>• Konfliktminskning</li>
              </ul>
              <Button className="w-full" disabled>
                Kommer snart
              </Button>
            </CardContent>
          </Card>

          {/* Arvsystemet */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏛️</span>
                <span>Arvsystemet</span>
              </CardTitle>
              <CardDescription>
                Framtidsmeddelanden och digitalt testamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Schemalagda meddelanden</li>
                <li>• Säker lagring</li>
                <li>• Automatisk leverans</li>
              </ul>
              <Button className="w-full" disabled>
                Kommer snart
              </Button>
            </CardContent>
          </Card>

          {/* Samarbete */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👥</span>
                <span>Samarbete</span>
              </CardTitle>
              <CardDescription>
                Realtidssamarbete med familj och vänner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Realtidsredigering</li>
                <li>• Säker delning</li>
                <li>• Versionshantering</li>
              </ul>
              <Button className="w-full" disabled>
                Kommer snart
              </Button>
            </CardContent>
          </Card>

          {/* Architect View */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔧</span>
                <span>Systemövervakning</span>
              </CardTitle>
              <CardDescription>
                Avancerad systemövervakning och diagnostik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Realtidsövervakning</li>
                <li>• Prestationsmetriker</li>
                <li>• Systemdiagnostik</li>
              </ul>
              <Link href="/architect">
                <Button className="w-full" variant="outline">
                  Öppna Övervakning
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🚀</span>
              <span>Kom igång</span>
            </CardTitle>
            <CardDescription>
              Steg för att börja använda Community Outreach System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Konfigurera AI-leverantörer</h4>
                  <p className="text-sm text-gray-600">
                    Lägg till API-nycklar för Gemini (gratis), Grok (snabb) eller OpenAI i .env.local
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Starta med Krönikan</h4>
                  <p className="text-sm text-gray-600">
                    Börja dokumentera dina tankar och reflektioner med vårt första fungerande verktyg
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Utforska systemövervakning</h4>
                  <p className="text-sm text-gray-600">
                    Se hur systemet fungerar i realtid med vår avancerade övervakningspanel
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            "Att bevara minnen och skapa meningsfulla kopplingar mellan generationer genom intelligent teknik."
          </p>
          <p className="text-xs mt-2">
            Community Outreach System © 2024 - Version {systemHealth?.version || '1.0.0'}
          </p>
        </div>
      </div>
    </div>
  );
}