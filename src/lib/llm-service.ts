/**
 * Multi-Provider LLM Service
 * 
 * Supports multiple LLM providers including OpenAI, Gemini, Grok, and others.
 * Provides unified interface for AI operations across the system.
 */

export interface LLMProvider {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  maxTokens: number;
  costPerToken: number;
  speed: 'slow' | 'medium' | 'fast' | 'ultra-fast';
  capabilities: ('chat' | 'completion' | 'embedding' | 'vision' | 'function-calling')[];
}

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  responseTime: number;
}

class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider = 'gemini-free';

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all supported LLM providers
   */
  private initializeProviders(): void {
    // Gemini (Google) - Free tier
    this.providers.set('gemini-free', {
      name: 'Gemini Pro (Free)',
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-pro', 'gemini-pro-vision'],
      maxTokens: 32768,
      costPerToken: 0, // Free tier
      speed: 'fast',
      capabilities: ['chat', 'completion', 'vision']
    });

    // Gemini Flash - Fast and free
    this.providers.set('gemini-flash', {
      name: 'Gemini Flash (Free)',
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-1.5-flash'],
      maxTokens: 1048576,
      costPerToken: 0, // Free tier
      speed: 'ultra-fast',
      capabilities: ['chat', 'completion', 'vision']
    });

    // Grok (xAI) - Fast commercial
    this.providers.set('grok', {
      name: 'Grok',
      apiKey: process.env.GROK_API_KEY,
      baseUrl: 'https://api.x.ai/v1',
      models: ['grok-beta'],
      maxTokens: 131072,
      costPerToken: 0.000005, // Estimated
      speed: 'ultra-fast',
      capabilities: ['chat', 'completion']
    });

    // OpenAI - High quality
    this.providers.set('openai', {
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      maxTokens: 128000,
      costPerToken: 0.00003,
      speed: 'medium',
      capabilities: ['chat', 'completion', 'embedding', 'vision', 'function-calling']
    });

    // Anthropic Claude
    this.providers.set('anthropic', {
      name: 'Anthropic Claude',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-sonnet', 'claude-3-haiku'],
      maxTokens: 200000,
      costPerToken: 0.000015,
      speed: 'fast',
      capabilities: ['chat', 'completion']
    });

    // Ollama (Local)
    this.providers.set('ollama', {
      name: 'Ollama (Local)',
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      models: ['llama2', 'mistral', 'codellama'],
      maxTokens: 4096,
      costPerToken: 0, // Local hosting
      speed: 'medium',
      capabilities: ['chat', 'completion']
    });
  }

  /**
   * Send a chat completion request
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const provider = this.getProvider(request.provider);
    
    if (!provider) {
      throw new Error(`Provider ${request.provider} not found or not configured`);
    }

    try {
      const response = await this.makeRequest(provider, request);
      
      return {
        content: response.content,
        usage: response.usage,
        model: request.model || provider.models[0],
        provider: provider.name,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error(`LLM request failed for provider ${provider.name}:`, error);
      
      // Try fallback provider if available
      if (request.provider !== this.defaultProvider) {
        console.log(`Falling back to default provider: ${this.defaultProvider}`);
        return this.chat({ ...request, provider: this.defaultProvider });
      }
      
      throw error;
    }
  }

  /**
   * Get the best provider for a specific use case
   */
  getBestProvider(criteria: {
    speed?: 'slow' | 'medium' | 'fast' | 'ultra-fast';
    cost?: 'free' | 'low' | 'medium' | 'high';
    capability?: 'chat' | 'completion' | 'embedding' | 'vision' | 'function-calling';
  }): string {
    const providers = Array.from(this.providers.entries());
    
    // Filter by capability if specified
    let candidates = providers;
    if (criteria.capability) {
      candidates = candidates.filter(([, provider]) => 
        provider.capabilities.includes(criteria.capability!)
      );
    }

    // Filter by cost if specified
    if (criteria.cost === 'free') {
      candidates = candidates.filter(([, provider]) => provider.costPerToken === 0);
    }

    // Sort by speed if specified
    if (criteria.speed) {
      const speedOrder = { 'slow': 0, 'medium': 1, 'fast': 2, 'ultra-fast': 3 };
      const targetSpeed = speedOrder[criteria.speed];
      
      candidates.sort(([, a], [, b]) => {
        const aSpeed = speedOrder[a.speed];
        const bSpeed = speedOrder[b.speed];
        return Math.abs(aSpeed - targetSpeed) - Math.abs(bSpeed - targetSpeed);
      });
    }

    // Return the best match or default
    return candidates.length > 0 ? candidates[0][0] : this.defaultProvider;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<{ id: string; provider: LLMProvider }> {
    return Array.from(this.providers.entries())
      .filter(([, provider]) => this.isProviderConfigured(provider))
      .map(([id, provider]) => ({ id, provider }));
  }

  /**
   * Test provider connectivity
   */
  async testProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider || !this.isProviderConfigured(provider)) {
      return false;
    }

    try {
      const testRequest: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        maxTokens: 10,
        provider: providerId
      };
      
      await this.chat(testRequest);
      return true;
    } catch (error) {
      console.error(`Provider ${providerId} test failed:`, error);
      return false;
    }
  }

  // Private helper methods

  private getProvider(providerId?: string): LLMProvider | null {
    const id = providerId || this.defaultProvider;
    const provider = this.providers.get(id);
    
    if (!provider || !this.isProviderConfigured(provider)) {
      // Try to find any configured provider
      for (const [, p] of this.providers) {
        if (this.isProviderConfigured(p)) {
          return p;
        }
      }
      return null;
    }
    
    return provider;
  }

  private isProviderConfigured(provider: LLMProvider): boolean {
    // Check if provider has required configuration
    if (provider.name.includes('Local') || provider.name.includes('Ollama')) {
      return true; // Local providers don't need API keys
    }
    
    return !!provider.apiKey;
  }

  private async makeRequest(provider: LLMProvider, request: LLMRequest): Promise<any> {
    const model = request.model || provider.models[0];
    
    // Handle different provider APIs
    switch (provider.name) {
      case 'Gemini Pro (Free)':
      case 'Gemini Flash (Free)':
        return this.makeGeminiRequest(provider, request, model);
      
      case 'Grok':
        return this.makeGrokRequest(provider, request, model);
      
      case 'OpenAI':
        return this.makeOpenAIRequest(provider, request, model);
      
      case 'Anthropic Claude':
        return this.makeAnthropicRequest(provider, request, model);
      
      case 'Ollama (Local)':
        return this.makeOllamaRequest(provider, request, model);
      
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async makeGeminiRequest(provider: LLMProvider, request: LLMRequest, model: string): Promise<any> {
    const url = `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`;
    
    const body = {
      contents: [{
        parts: [{
          text: request.messages.map(m => `${m.role}: ${m.content}`).join('\n')
        }]
      }],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      content,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  private async makeGrokRequest(provider: LLMProvider, request: LLMRequest, model: string): Promise<any> {
    const url = `${provider.baseUrl}/chat/completions`;
    
    const body = {
      model,
      messages: request.messages,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private async makeOpenAIRequest(provider: LLMProvider, request: LLMRequest, model: string): Promise<any> {
    const url = `${provider.baseUrl}/chat/completions`;
    
    const body = {
      model,
      messages: request.messages,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }

  private async makeAnthropicRequest(provider: LLMProvider, request: LLMRequest, model: string): Promise<any> {
    const url = `${provider.baseUrl}/messages`;
    
    const body = {
      model,
      max_tokens: request.maxTokens || 1024,
      messages: request.messages.filter(m => m.role !== 'system'),
      system: request.messages.find(m => m.role === 'system')?.content
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  private async makeOllamaRequest(provider: LLMProvider, request: LLMRequest, model: string): Promise<any> {
    const url = `${provider.baseUrl}/api/chat`;
    
    const body = {
      model,
      messages: request.messages,
      stream: false,
      options: {
        num_predict: request.maxTokens || 1024,
        temperature: request.temperature || 0.7
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.message.content,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();