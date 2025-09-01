/**
 * Transformation Dialog Component
 * Handles Cortex-mode message transformation for recipients
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  ReflectionEntry, 
  CortexTransformation,
  TransformationType,
  MessageTone,
  DeliveryMethod,
  TransformationParameters
} from '../../types/chronicler';
import { ChroniclerService } from '../../services/chronicler-service';
import { 
  X, 
  MessageSquare, 
  Heart, 
  Mail, 
  Calendar,
  Share2,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Settings
} from 'lucide-react';

interface TransformationDialogProps {
  /** Reflection to transform */
  reflection: ReflectionEntry;
  
  /** Callback when dialog is closed */
  onClose: () => void;
  
  /** Chronicler service instance */
  chroniclerService: ChroniclerService;
}

export function TransformationDialog({
  reflection,
  onClose,
  chroniclerService
}: TransformationDialogProps) {
  const [step, setStep] = useState<'select_recipient' | 'configure' | 'preview' | 'processing' | 'complete'>('select_recipient');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transformationType, setTransformationType] = useState<TransformationType>('personal_message');
  const [parameters, setParameters] = useState<TransformationParameters>({
    relationship_type: 'friend',
    emotional_impact: 'warm',
    formality_level: 'casual',
    include_emotional_context: true
  });
  const [transformation, setTransformation] = useState<CortexTransformation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformationTypes: { value: TransformationType; label: string; description: string }[] = [
    {
      value: 'personal_message',
      label: 'Personligt meddelande',
      description: 'Omvandla till ett varmt, personligt meddelande'
    },
    {
      value: 'memory_share',
      label: 'Delat minne',
      description: 'Dela som ett gemensamt minne'
    },
    {
      value: 'story_adaptation',
      label: 'Anpassad berättelse',
      description: 'Anpassa berättelsen för mottagaren'
    },
    {
      value: 'emotional_summary',
      label: 'Känslomässig sammanfattning',
      description: 'Skapa en känslomässig sammanfattning'
    },
    {
      value: 'legacy_message',
      label: 'Arvsmeddelande',
      description: 'Förbered som ett framtida arvsmeddelande'
    }
  ];

  const messageTones: { value: MessageTone; label: string }[] = [
    { value: 'warm', label: 'Varm' },
    { value: 'formal', label: 'Formell' },
    { value: 'casual', label: 'Avslappnad' },
    { value: 'heartfelt', label: 'Hjärtlig' },
    { value: 'encouraging', label: 'Uppmuntrande' },
    { value: 'nostalgic', label: 'Nostalgisk' },
    { value: 'celebratory', label: 'Firande' }
  ];

  const relationshipTypes = [
    { value: 'family', label: 'Familj' },
    { value: 'friend', label: 'Vän' },
    { value: 'colleague', label: 'Kollega' },
    { value: 'acquaintance', label: 'Bekant' },
    { value: 'professional', label: 'Professionell' },
    { value: 'other', label: 'Annat' }
  ];

  const formalityLevels = [
    { value: 'casual', label: 'Avslappnad' },
    { value: 'semi_formal', label: 'Halvformell' },
    { value: 'formal', label: 'Formell' }
  ];

  const handleStartTransformation = async () => {
    if (!recipientId || !recipientName) {
      setError('Vänligen ange mottagarinformation');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const result = await chroniclerService.transformForRecipient(
        reflection.id,
        recipientId,
        transformationType,
        parameters
      );

      setTransformation(result);
      
      if (result.status === 'completed') {
        setStep('complete');
      } else if (result.status === 'failed') {
        setError(result.error?.message || 'Transformation misslyckades');
        setStep('configure');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett oväntat fel inträffade');
      setStep('configure');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParameterChange = (key: keyof TransformationParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStepTitle = () => {
    switch (step) {
      case 'select_recipient': return 'Välj mottagare';
      case 'configure': return 'Konfigurera transformation';
      case 'preview': return 'Förhandsgranska';
      case 'processing': return 'Bearbetar...';
      case 'complete': return 'Klar!';
      default: return '';
    }
  };

  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'direct_message': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'shared_memory': return <Heart className="h-4 w-4" />;
      case 'scheduled_delivery': return <Calendar className="h-4 w-4" />;
      case 'legacy_trigger': return <Share2 className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getDeliveryMethodLabel = (method: DeliveryMethod) => {
    switch (method) {
      case 'direct_message': return 'Direkt meddelande';
      case 'email': return 'E-post';
      case 'shared_memory': return 'Delat minne';
      case 'scheduled_delivery': return 'Schemalagd leverans';
      case 'legacy_trigger': return 'Arvsutlösare';
      default: return 'Okänd';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {getStepTitle()}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Select Recipient */}
          {step === 'select_recipient' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vem vill du dela med?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ange information om personen du vill dela din reflektion med.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mottagarens namn
                  </label>
                  <Input
                    placeholder="Ange namn..."
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mottagar-ID eller e-post
                  </label>
                  <Input
                    placeholder="Ange ID eller e-post..."
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Typ av transformation
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {transformationTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          transformationType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setTransformationType(type.value)}
                      >
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Avbryt
                </Button>
                <Button 
                  onClick={() => setStep('configure')}
                  disabled={!recipientId || !recipientName}
                >
                  Nästa
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Parameters */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Anpassa meddelandet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Konfigurera hur din reflektion ska transformeras för {recipientName}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Relation
                  </label>
                  <select
                    value={parameters.relationship_type}
                    onChange={(e) => handleParameterChange('relationship_type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {relationshipTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Formalitetsnivå
                  </label>
                  <select
                    value={parameters.formality_level}
                    onChange={(e) => handleParameterChange('formality_level', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {formalityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Önskad känslomässig påverkan
                </label>
                <Input
                  placeholder="T.ex. 'uppmuntrande', 'nostalgisk', 'inspirerande'..."
                  value={parameters.emotional_impact}
                  onChange={(e) => handleParameterChange('emotional_impact', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Kulturella överväganden (valfritt)
                </label>
                <Input
                  placeholder="T.ex. språkpreferenser, kulturell bakgrund..."
                  value={parameters.cultural_context || ''}
                  onChange={(e) => handleParameterChange('cultural_context', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include_emotional_context"
                  checked={parameters.include_emotional_context}
                  onChange={(e) => handleParameterChange('include_emotional_context', e.target.checked)}
                />
                <label htmlFor="include_emotional_context" className="text-sm">
                  Inkludera känslomässigt sammanhang
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('select_recipient')}>
                  Tillbaka
                </Button>
                <Button onClick={handleStartTransformation} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Bearbetar...
                    </>
                  ) : (
                    'Starta transformation'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Transformerar din reflektion</h3>
              <p className="text-muted-foreground">
                Cortex-läget analyserar och anpassar ditt meddelande för {recipientName}...
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && transformation && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Transformation klar!</h3>
                <p className="text-muted-foreground">
                  Din reflektion har transformerats för {recipientName}.
                </p>
              </div>

              {/* Transformed Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transformerat meddelande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {transformation.transformed_content.text}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Ton: {transformation.transformed_content.tone}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getDeliveryMethodIcon(transformation.transformed_content.delivery_method)}
                        {getDeliveryMethodLabel(transformation.transformed_content.delivery_method)}
                      </Badge>
                    </div>

                    {transformation.transformed_content.adaptations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Anpassningar gjorda:</h4>
                        <ul className="text-sm space-y-1">
                          {transformation.transformed_content.adaptations.map((adaptation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{adaptation.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Stäng
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Redigera
                  </Button>
                  <Button>
                    Skicka meddelande
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}