/**
 * External Integration Panel
 * Manages external asset integrations (Google Photos, Gmail, etc.)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  ExternalAssetIntegration,
  ExternalProvider,
  IntegrationStatus
} from '../../types/chronicler';
import { ChroniclerService } from '../../services/chronicler-service';
import { 
  X, 
  Settings, 
  Link, 
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Image,
  Mail,
  Cloud,
  Smartphone,
  HardDrive,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface ExternalIntegrationPanelProps {
  /** Current user ID */
  userId: string;
  
  /** Callback when panel is closed */
  onClose: () => void;
  
  /** Chronicler service instance */
  chroniclerService: ChroniclerService;
}

export function ExternalIntegrationPanel({
  userId,
  onClose,
  chroniclerService
}: ExternalIntegrationPanelProps) {
  const [integrations, setIntegrations] = useState<ExternalAssetIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ExternalProvider | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const providers: { 
    value: ExternalProvider; 
    label: string; 
    description: string; 
    icon: React.ReactNode;
    available: boolean;
  }[] = [
    {
      value: 'google_photos',
      label: 'Google Photos',
      description: 'Synkronisera foton och videor från Google Photos',
      icon: <Image className="h-5 w-5" />,
      available: true
    },
    {
      value: 'gmail',
      label: 'Gmail',
      description: 'Importera e-postmeddelanden och bilagor',
      icon: <Mail className="h-5 w-5" />,
      available: true
    },
    {
      value: 'google_drive',
      label: 'Google Drive',
      description: 'Åtkomst till dokument och filer',
      icon: <Cloud className="h-5 w-5" />,
      available: true
    },
    {
      value: 'icloud_photos',
      label: 'iCloud Photos',
      description: 'Synkronisera foton från iCloud',
      icon: <Smartphone className="h-5 w-5" />,
      available: false
    },
    {
      value: 'dropbox',
      label: 'Dropbox',
      description: 'Åtkomst till Dropbox-filer',
      icon: <HardDrive className="h-5 w-5" />,
      available: false
    },
    {
      value: 'onedrive',
      label: 'OneDrive',
      description: 'Åtkomst till Microsoft OneDrive',
      icon: <Cloud className="h-5 w-5" />,
      available: false
    }
  ];

  useEffect(() => {
    loadIntegrations();
  }, [userId]);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      // This would be implemented in the service
      // const userIntegrations = await chroniclerService.getUserIntegrations(userId);
      // setIntegrations(userIntegrations);
      
      // Mock data for now
      setIntegrations([]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectProvider = async () => {
    if (!selectedProvider || !authToken) return;

    setIsConnecting(true);
    try {
      const integration = await chroniclerService.setupExternalIntegration(
        userId,
        selectedProvider,
        authToken,
        {
          auto_sync: true,
          sync_frequency_hours: 24,
          asset_types: ['image', 'video', 'document']
        }
      );

      setIntegrations(prev => [...prev, integration]);
      setShowAddIntegration(false);
      setSelectedProvider(null);
      setAuthToken('');
      
    } catch (error) {
      console.error('Failed to connect provider:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      // This would be implemented in the service
      // await chroniclerService.disconnectIntegration(integrationId);
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      await chroniclerService.syncExternalAssets(integrationId);
      await loadIntegrations(); // Reload to get updated sync stats
    } catch (error) {
      console.error('Failed to sync integration:', error);
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'rate_limited': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return 'Ansluten';
      case 'disconnected': return 'Frånkopplad';
      case 'error': return 'Fel';
      case 'syncing': return 'Synkroniserar';
      case 'rate_limited': return 'Begränsad';
      default: return 'Okänd';
    }
  };

  const getProviderInfo = (provider: ExternalProvider) => {
    return providers.find(p => p.value === provider);
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Aldrig';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Nyligen';
    if (diffHours < 24) return `${diffHours} timmar sedan`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dagar sedan`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Externa integrationer
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Anslut externa tjänster för att importera dina minnen och tillgångar.
            </p>
            <Button onClick={() => setShowAddIntegration(true)}>
              <Link className="h-4 w-4 mr-2" />
              Lägg till integration
            </Button>
          </div>

          {/* Existing Integrations */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Laddar integrationer...</p>
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga integrationer</h3>
                <p className="text-muted-foreground mb-4">
                  Du har inte anslutit några externa tjänster än.
                </p>
                <Button onClick={() => setShowAddIntegration(true)}>
                  <Link className="h-4 w-4 mr-2" />
                  Lägg till din första integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const providerInfo = getProviderInfo(integration.provider);
                return (
                  <Card key={integration.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {providerInfo?.icon}
                          <div>
                            <CardTitle className="text-lg">
                              {providerInfo?.label || integration.provider}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(integration.status)}
                              <span className="text-sm text-muted-foreground">
                                {getStatusLabel(integration.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSyncIntegration(integration.id)}
                            disabled={integration.status === 'syncing'}
                          >
                            <RefreshCw className={`h-4 w-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnectIntegration(integration.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Sync Statistics */}
                      {integration.sync_stats && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{integration.sync_stats.total_synced}</div>
                            <div className="text-muted-foreground">Totalt synkroniserat</div>
                          </div>
                          <div>
                            <div className="font-medium">{integration.sync_stats.last_sync_added}</div>
                            <div className="text-muted-foreground">Senast tillagda</div>
                          </div>
                        </div>
                      )}

                      {/* Settings */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Automatisk synkronisering</span>
                          <Badge variant={integration.settings.auto_sync ? "default" : "outline"}>
                            {integration.settings.auto_sync ? "På" : "Av"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Senaste synkronisering</span>
                          <span className="text-muted-foreground">
                            {formatLastSync(integration.last_sync_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span>Kryptering</span>
                          <div className="flex items-center gap-1">
                            {integration.settings.privacy.encrypt_assets ? (
                              <Shield className="h-3 w-3 text-green-500" />
                            ) : (
                              <Shield className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-muted-foreground">
                              {integration.settings.privacy.encrypt_assets ? "Aktiverad" : "Inaktiverad"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add Integration Dialog */}
          {showAddIntegration && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Lägg till ny integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedProvider ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {providers.map((provider) => (
                      <div
                        key={provider.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          provider.available
                            ? 'hover:border-primary hover:bg-primary/5'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => provider.available && setSelectedProvider(provider.value)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {provider.icon}
                          <div className="font-medium">{provider.label}</div>
                          {!provider.available && (
                            <Badge variant="outline" className="text-xs">
                              Kommer snart
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getProviderInfo(selectedProvider)?.icon}
                      <div>
                        <h3 className="font-medium">
                          Anslut till {getProviderInfo(selectedProvider)?.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ange din autentiseringstoken för att ansluta.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Autentiseringstoken
                      </label>
                      <Input
                        type="password"
                        placeholder="Ange din token..."
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Din token krypteras och lagras säkert.
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProvider(null);
                          setAuthToken('');
                        }}
                      >
                        Tillbaka
                      </Button>
                      <Button
                        onClick={handleConnectProvider}
                        disabled={!authToken || isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Ansluter...
                          </>
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            Anslut
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedProvider === null && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowAddIntegration(false)}>
                      Avbryt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Privacy Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Integritet och säkerhet
                  </h4>
                  <p className="text-sm text-blue-800">
                    Alla externa integrationer krypteras och du behåller full kontroll över dina data. 
                    Du kan när som helst koppla från tjänster och radera synkroniserad data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}