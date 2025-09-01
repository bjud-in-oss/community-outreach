/**
 * Invitation Dialog Component
 * Handles secure invitation system with permission levels
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  CollaborationInvitation,
  ContactSuggestion,
  PermissionLevel
} from '../../types/collaboration';
import { CollaborationService } from '../../services/collaboration-service';
import { UserState } from '../../types';
import { 
  X, 
  UserPlus, 
  Users, 
  Eye, 
  Edit, 
  Shield,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Star
} from 'lucide-react';

interface InvitationDialogProps {
  /** Resource being shared */
  resourceId: string;
  
  /** Type of resource */
  resourceType: 'reflection' | 'project' | 'page';
  
  /** Current user ID */
  userId: string;
  
  /** Current user's emotional state */
  userState: UserState;
  
  /** Current task context */
  currentTask?: string;
  
  /** Resource themes */
  themes?: string[];
  
  /** Callback when dialog is closed */
  onClose: () => void;
  
  /** Collaboration service instance */
  collaborationService: CollaborationService;
}

export function InvitationDialog({
  resourceId,
  resourceType,
  userId,
  userState,
  currentTask,
  themes = [],
  onClose,
  collaborationService
}: InvitationDialogProps) {
  const [step, setStep] = useState<'select_contacts' | 'configure' | 'suggestions' | 'sending' | 'complete'>('select_contacts');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactPermissions, setContactPermissions] = useState<Record<string, PermissionLevel>>({});
  const [invitationMessage, setInvitationMessage] = useState('');
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<CollaborationInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const permissionLevels: { value: PermissionLevel; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'viewer',
      label: 'Tittare',
      description: 'Kan bara visa innehållet',
      icon: <Eye className="h-4 w-4" />
    },
    {
      value: 'commenter',
      label: 'Kommentator',
      description: 'Kan visa och kommentera',
      icon: <Users className="h-4 w-4" />
    },
    {
      value: 'editor',
      label: 'Redigerare',
      description: 'Kan visa och redigera innehållet',
      icon: <Edit className="h-4 w-4" />
    },
    {
      value: 'admin',
      label: 'Administratör',
      description: 'Full kontroll inklusive att bjuda in andra',
      icon: <Shield className="h-4 w-4" />
    }
  ];

  // Load contact suggestions when component mounts
  useEffect(() => {
    if (currentTask && themes.length > 0) {
      loadContactSuggestions();
    }
  }, [currentTask, themes]);

  const loadContactSuggestions = async () => {
    if (!currentTask) return;
    
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await collaborationService.getContactSuggestions(
        userId,
        currentTask,
        userState,
        themes
      );
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load contact suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleContactSelect = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
      setContactPermissions(prev => {
        const { [contactId]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedContacts(prev => [...prev, contactId]);
      setContactPermissions(prev => ({
        ...prev,
        [contactId]: 'editor' // Default permission
      }));
    }
  };

  const handlePermissionChange = (contactId: string, permission: PermissionLevel) => {
    setContactPermissions(prev => ({
      ...prev,
      [contactId]: permission
    }));
  };

  const handleSendInvitations = async () => {
    setStep('sending');
    setError(null);

    try {
      const invitations: CollaborationInvitation[] = [];

      for (const contactId of selectedContacts) {
        const invitation = await collaborationService.createInvitation(
          userId,
          contactId,
          resourceId,
          resourceType,
          contactPermissions[contactId],
          invitationMessage
        );
        invitations.push(invitation);
      }

      setSentInvitations(invitations);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
      setStep('configure');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'select_contacts': return 'Välj kontakter';
      case 'configure': return 'Konfigurera inbjudningar';
      case 'suggestions': return 'Föreslagna kontakter';
      case 'sending': return 'Skickar inbjudningar...';
      case 'complete': return 'Inbjudningar skickade!';
      default: return '';
    }
  };

  const getPermissionIcon = (level: PermissionLevel) => {
    const permission = permissionLevels.find(p => p.value === level);
    return permission?.icon || <Eye className="h-4 w-4" />;
  };

  const getPermissionLabel = (level: PermissionLevel) => {
    const permission = permissionLevels.find(p => p.value === level);
    return permission?.label || 'Okänd';
  };

  const getSuggestionReasonLabel = (reason: string) => {
    const reasonLabels: Record<string, string> = {
      similar_theme: 'Liknande teman',
      expertise_match: 'Relevant expertis',
      frequent_collaborator: 'Frekvent samarbetspartner',
      emotional_support: 'Emotionellt stöd',
      recent_interaction: 'Nylig interaktion',
      mutual_connection: 'Gemensam kontakt'
    };
    return reasonLabels[reason] || reason;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {getStepTitle()}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Select Contacts */}
          {step === 'select_contacts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vem vill du bjuda in?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Välj kontakter att bjuda in till ditt {resourceType === 'reflection' ? 'reflektion' : resourceType}.
                </p>
              </div>

              {/* Contact Search */}
              <div>
                <Input
                  placeholder="Sök kontakter..."
                  className="mb-4"
                />
              </div>

              {/* Suggested Contacts */}
              {suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <h4 className="font-medium">Föreslagna kontakter</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedContacts.includes(suggestion.contact_id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleContactSelect(suggestion.contact_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{suggestion.contact_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {getSuggestionReasonLabel(suggestion.reason)}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            
                            {suggestion.evidence.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.evidence[0].description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Contact Selection */}
              <div>
                <h4 className="font-medium mb-3">Alla kontakter</h4>
                <div className="text-sm text-muted-foreground">
                  Kontaktlista skulle visas här i en riktig implementation
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Avbryt
                </Button>
                <Button 
                  onClick={() => setStep('configure')}
                  disabled={selectedContacts.length === 0}
                >
                  Nästa ({selectedContacts.length} valda)
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Permissions and Message */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Konfigurera inbjudningar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ange behörigheter och meddelande för dina inbjudningar.
                </p>
              </div>

              {/* Selected Contacts with Permissions */}
              <div>
                <h4 className="font-medium mb-3">Valda kontakter och behörigheter</h4>
                <div className="space-y-3">
                  {selectedContacts.map((contactId) => (
                    <div key={contactId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">Kontakt {contactId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={contactPermissions[contactId]}
                          onChange={(e) => handlePermissionChange(contactId, e.target.value as PermissionLevel)}
                          className="px-3 py-1 border rounded-md text-sm"
                        >
                          {permissionLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {getPermissionIcon(contactPermissions[contactId])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Level Explanations */}
              <div>
                <h4 className="font-medium mb-3">Behörighetsnivåer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissionLevels.map((level) => (
                    <div key={level.value} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {level.icon}
                        <span className="font-medium">{level.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {level.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invitation Message */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Inbjudningsmeddelande (valfritt)
                </label>
                <Textarea
                  placeholder="Skriv ett personligt meddelande till dina inbjudna..."
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('select_contacts')}>
                  Tillbaka
                </Button>
                <Button onClick={handleSendInvitations}>
                  <Send className="h-4 w-4 mr-2" />
                  Skicka inbjudningar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Sending */}
          {step === 'sending' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Skickar inbjudningar</h3>
              <p className="text-muted-foreground">
                Skapar säkra inbjudningar och verifierar samtycke...
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inbjudningar skickade!</h3>
                <p className="text-muted-foreground">
                  {sentInvitations.length} inbjudningar har skickats säkert.
                </p>
              </div>

              {/* Sent Invitations Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skickade inbjudningar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sentInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Kontakt {invitation.recipient_id}</span>
                          <div className="text-sm text-muted-foreground">
                            Inbjudan ID: {invitation.id}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getPermissionLabel(invitation.permission_level)}
                          </Badge>
                          <Badge variant="default">
                            Skickad
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Nästa steg
                      </h4>
                      <p className="text-sm text-blue-800">
                        Dina kontakter kommer att få notifieringar om inbjudningarna. 
                        När de accepterar kommer ni att kunna samarbeta i realtid med säker åtkomstkontroll.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={onClose}>
                  Stäng
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}