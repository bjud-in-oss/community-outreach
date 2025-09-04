/**
 * Personal Chronicler Service
 * Implements private reflection saving with emotional context and message transformation
 */

import { 
  ReflectionEntry, 
  CortexTransformation, 
  ExternalAssetIntegration,
  ChroniclerWorkflow,
  TransformationType,
  ExternalProvider,
  WorkflowStep,
  WorkflowStatus,
  ReflectionContent,
  TransformationParameters
} from '../types/chronicler';
import { UserState, Asset, User } from '../types';
import { MemoryAssistant } from '../lib/memory';
import { CognitiveAgent } from '../lib/cognitive-agent';
import { ResourceGovernor } from '../lib/resource-governor';

/**
 * Personal Chronicler Service
 * Handles private reflections, emotional context, and message transformations
 */
export class ChroniclerService {
  private memoryAssistant: MemoryAssistant;
  private cognitiveAgent: CognitiveAgent;
  private resourceGovernor: ResourceGovernor;

  constructor(
    memoryAssistant: MemoryAssistant,
    cognitiveAgent: CognitiveAgent,
    resourceGovernor: ResourceGovernor
  ) {
    this.memoryAssistant = memoryAssistant;
    this.cognitiveAgent = cognitiveAgent;
    this.resourceGovernor = resourceGovernor;
  }

  /**
   * Create a new personal reflection with emotional context
   * Requirement 19.1: Private reflection saving with emotional context
   */
  async createReflection(
    userId: string,
    content: ReflectionContent,
    emotionalContext: UserState,
    assets: Asset[] = []
  ): Promise<ReflectionEntry> {
    // Validate resource usage
    await this.resourceGovernor.validateAction({
      type: 'create_reflection',
      userId,
      resourceCost: {
        storage: this.calculateStorageCost(content, assets),
        compute: 1
      }
    });

    const reflection: ReflectionEntry = {
      id: this.generateId(),
      user_id: userId,
      title: this.extractTitle(content),
      content,
      emotional_context: emotionalContext,
      privacy_level: 'private', // Default to private
      assets,
      tags: await this.extractTags(content),
      shareable: false, // Default to not shareable
      created_at: new Date(),
      updated_at: new Date(),
      status: 'saved'
    };

    // Save to memory with emotional context
    await this.memoryAssistant.saveReflection(reflection);

    // Store emotional context as separate vector for analysis
    await this.memoryAssistant.storeEmotionalContext(
      reflection.id,
      emotionalContext,
      'reflection_creation'
    );

    return reflection;
  }

  /**
   * Update an existing reflection
   */
  async updateReflection(
    reflectionId: string,
    updates: Partial<ReflectionEntry>,
    newEmotionalContext?: UserState
  ): Promise<ReflectionEntry> {
    const existing = await this.memoryAssistant.getReflection(reflectionId);
    if (!existing) {
      throw new Error(`Reflection ${reflectionId} not found`);
    }

    const updated: ReflectionEntry = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };

    // Update tags if content changed
    if (updates.content) {
      updated.tags = await this.extractTags(updates.content);
    }

    await this.memoryAssistant.saveReflection(updated);

    // Store new emotional context if provided
    if (newEmotionalContext) {
      await this.memoryAssistant.storeEmotionalContext(
        reflectionId,
        newEmotionalContext,
        'reflection_update'
      );
    }

    return updated;
  }

  /**
   * Transform reflection content for sharing with recipients
   * Requirement 19.2: Cortex-mode message transformation for recipients
   */
  async transformForRecipient(
    reflectionId: string,
    recipientId: string,
    transformationType: TransformationType,
    parameters: TransformationParameters
  ): Promise<CortexTransformation> {
    // Validate resource usage for Cortex-mode operation
    await this.resourceGovernor.validateCortexMode({
      userId: (await this.memoryAssistant.getReflection(reflectionId))?.user_id || '',
      operation: 'message_transformation',
      complexity: 'high'
    });

    const reflection = await this.memoryAssistant.getReflection(reflectionId);
    if (!reflection) {
      throw new Error(`Reflection ${reflectionId} not found`);
    }

    if (reflection.privacy_level === 'private') {
      throw new Error('Cannot transform private reflections');
    }

    const transformation: CortexTransformation = {
      id: this.generateId(),
      source_reflection_id: reflectionId,
      recipient_id: recipientId,
      type: transformationType,
      original_content: reflection.content,
      transformed_content: {
        text: '',
        tone: 'warm',
        adaptations: [],
        delivery_method: 'direct_message'
      },
      parameters,
      status: 'pending',
      created_at: new Date()
    };

    // Start transformation process using Cortex-mode
    try {
      transformation.status = 'processing';
      
      // Get recipient context for personalization
      const recipientContext = await this.getRecipientContext(recipientId);
      
      // Use cognitive agent in Cortex mode for transformation
      const transformedContent = await this.cognitiveAgent.processInCortexMode({
        task: 'transform_reflection_for_recipient',
        input: {
          original_content: reflection.content,
          emotional_context: reflection.emotional_context,
          recipient_context: recipientContext,
          transformation_type: transformationType,
          parameters
        }
      });

      transformation.transformed_content = transformedContent;
      transformation.status = 'completed';
      transformation.completed_at = new Date();

    } catch (error) {
      transformation.status = 'failed';
      transformation.error = {
        code: 'TRANSFORMATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
        retryable: true
      };
    }

    // Save transformation record
    await this.memoryAssistant.saveTransformation(transformation);

    return transformation;
  }

  /**
   * Set up external asset integration
   * Requirement 19.3: External asset integration (Google Photos, Gmail)
   */
  async setupExternalIntegration(
    userId: string,
    provider: ExternalProvider,
    authToken: string,
    settings: any
  ): Promise<ExternalAssetIntegration> {
    const integration: ExternalAssetIntegration = {
      id: this.generateId(),
      user_id: userId,
      provider,
      status: 'connected',
      auth: {
        access_token: await this.encryptToken(authToken),
        scopes: this.getProviderScopes(provider),
        method: 'oauth2'
      },
      settings: {
        auto_sync: settings.auto_sync || false,
        sync_frequency_hours: settings.sync_frequency_hours || 24,
        asset_types: settings.asset_types || ['image', 'video'],
        privacy: {
          encrypt_assets: true,
          metadata_only: false,
          require_consent: true,
          auto_delete_after_sync: false
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.memoryAssistant.saveExternalIntegration(integration);

    // Start initial sync if auto_sync is enabled
    if (integration.settings.auto_sync) {
      await this.syncExternalAssets(integration.id);
    }

    return integration;
  }

  /**
   * Sync assets from external services
   */
  async syncExternalAssets(integrationId: string): Promise<void> {
    const integration = await this.memoryAssistant.getExternalIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.status = 'syncing';
    await this.memoryAssistant.saveExternalIntegration(integration);

    try {
      const syncResults = await this.performExternalSync(integration);
      
      integration.status = 'connected';
      integration.last_sync_at = new Date();
      integration.sync_stats = syncResults;
      
    } catch (error) {
      integration.status = 'error';
    }

    await this.memoryAssistant.saveExternalIntegration(integration);
  }

  /**
   * Start a chronicler workflow
   */
  async startWorkflow(
    userId: string,
    workflowType: 'create_reflection' | 'transform_message' | 'sync_assets'
  ): Promise<ChroniclerWorkflow> {
    const workflow: ChroniclerWorkflow = {
      id: this.generateId(),
      user_id: userId,
      current_step: 'create_reflection',
      data: {
        user_selections: {},
        metadata: { workflow_type: workflowType }
      },
      status: 'active',
      created_at: new Date()
    };

    await this.memoryAssistant.saveWorkflow(workflow);
    return workflow;
  }

  /**
   * Advance workflow to next step
   */
  async advanceWorkflow(
    workflowId: string,
    stepData: any
  ): Promise<ChroniclerWorkflow> {
    const workflow = await this.memoryAssistant.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Update workflow data with step results
    workflow.data.user_selections = {
      ...workflow.data.user_selections,
      [workflow.current_step]: stepData
    };

    // Determine next step
    workflow.current_step = this.getNextWorkflowStep(workflow.current_step);
    
    if (workflow.current_step === 'complete') {
      workflow.status = 'completed';
      workflow.completed_at = new Date();
    }

    await this.memoryAssistant.saveWorkflow(workflow);
    return workflow;
  }

  /**
   * Get user's reflections with filtering and pagination
   */
  async getUserReflections(
    userId: string,
    filters?: {
      tags?: string[];
      dateRange?: { start: Date; end: Date };
      privacyLevel?: string;
    },
    pagination?: { offset: number; limit: number }
  ): Promise<{ reflections: ReflectionEntry[]; total: number }> {
    return await this.memoryAssistant.getUserReflections(userId, filters, pagination);
  }

  /**
   * Search reflections by content and emotional context
   */
  async searchReflections(
    userId: string,
    query: string,
    emotionalFilters?: Partial<UserState>
  ): Promise<ReflectionEntry[]> {
    return await this.memoryAssistant.searchReflections(userId, query, emotionalFilters);
  }

  // Private helper methods

  private generateId(): string {
    return `chr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractTitle(content: ReflectionContent): string {
    // Extract title from first text block or use first 50 characters
    const firstBlock = content.blocks.find(block => block.type === 'text');
    if (firstBlock && firstBlock.content) {
      const text = firstBlock.content.toString();
      return text.length > 50 ? text.substring(0, 47) + '...' : text;
    }
    return content.text.length > 50 ? content.text.substring(0, 47) + '...' : content.text;
  }

  private async extractTags(content: ReflectionContent): Promise<string[]> {
    // Use cognitive agent to extract meaningful tags from content
    try {
      const tags = await this.cognitiveAgent.processInput({
        text: `Extract 3-5 meaningful tags from this reflection content: ${content.text}`,
        type: 'command',
        timestamp: new Date()
      });
      
      // Parse tags from agent response
      return this.parseTagsFromResponse(tags.text);
    } catch (error) {
      // Fallback to simple keyword extraction
      return this.extractSimpleTags(content.text);
    }
  }

  private parseTagsFromResponse(response: string): string[] {
    // Simple parsing - look for comma-separated tags
    const tagMatch = response.match(/tags?:\s*([^.]+)/i);
    if (tagMatch) {
      return tagMatch[1].split(',').map(tag => tag.trim().toLowerCase());
    }
    return [];
  }

  private extractSimpleTags(text: string): string[] {
    // Simple keyword extraction as fallback
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private calculateStorageCost(content: ReflectionContent, assets: Asset[]): number {
    const contentSize = JSON.stringify(content).length;
    const assetSize = assets.reduce((total, asset) => total + asset.size_bytes, 0);
    return contentSize + assetSize;
  }

  private async getRecipientContext(recipientId: string): Promise<any> {
    // Get recipient's profile and relationship context
    const recipient = await this.memoryAssistant.getUser(recipientId);
    const relationship = await this.memoryAssistant.getRelationship(recipientId);
    
    return {
      profile: recipient,
      relationship,
      preferences: recipient?.profile.preferences
    };
  }

  private async encryptToken(token: string): Promise<string> {
    // Use encryption service to encrypt the token
    // This is a placeholder - actual implementation would use proper encryption
    return Buffer.from(token).toString('base64');
  }

  private getProviderScopes(provider: ExternalProvider): string[] {
    const scopeMap = {
      google_photos: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
      gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
      google_drive: ['https://www.googleapis.com/auth/drive.readonly'],
      icloud_photos: ['photos.read'],
      dropbox: ['files.metadata.read', 'files.content.read'],
      onedrive: ['Files.Read']
    };
    
    return scopeMap[provider] || [];
  }

  private async performExternalSync(integration: ExternalAssetIntegration): Promise<any> {
    // Placeholder for actual external sync implementation
    // This would integrate with specific provider APIs
    const startTime = Date.now();
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      total_synced: 10,
      last_sync_added: 5,
      last_sync_updated: 3,
      last_sync_failed: 2,
      total_sync_time_ms: Date.now() - startTime,
      avg_sync_time_per_asset_ms: (Date.now() - startTime) / 10
    };
  }

  private getNextWorkflowStep(currentStep: WorkflowStep): WorkflowStep {
    const stepOrder: WorkflowStep[] = [
      'create_reflection',
      'capture_emotional_context',
      'add_assets',
      'set_privacy',
      'save_reflection',
      'transform_for_sharing',
      'schedule_delivery',
      'complete'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : 'complete';
  }

  /**
   * Process reflection for system integration
   */
  async processReflection(text: string): Promise<{ actions: any[] }> {
    // Simple implementation for system integration
    return {
      actions: [{
        type: 'create_reflection',
        parameters: { text },
        requires_approval: false
      }]
    };
  }
}

// Export singleton instance
export const chroniclerService = new ChroniclerService(
  {} as any, // Will be properly initialized later
  {} as any, // Will be properly initialized later  
  {} as any  // Will be properly initialized later
);