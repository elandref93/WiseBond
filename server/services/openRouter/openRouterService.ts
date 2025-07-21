/**
 * OpenRouter AI Service
 * 
 * This service provides integration with OpenRouter AI for various AI-powered features
 * in the WiseBond application.
 */

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3.5-sonnet'
    };

    if (!this.config.apiKey) {
      console.warn('⚠️  OpenRouter API key not found. AI features will be disabled.');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Make a chat completion request to OpenRouter
   */
  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://wisebond.co.za',
          'X-Title': 'WiseBond AI Assistant'
        },
        body: JSON.stringify({
          model: request.model || this.config.defaultModel,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: request.stream || false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OpenRouter API request failed:', error);
      throw error;
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getModels(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://wisebond.co.za',
          'X-Title': 'WiseBond AI Assistant'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Simple text generation with default settings
   */
  async generateText(prompt: string, model?: string): Promise<string> {
    const response = await this.chatCompletion({
      model: model || this.config.defaultModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Generate a system message for financial advice
   */
  async generateFinancialAdvice(context: string): Promise<string> {
    const systemPrompt = `You are a professional financial advisor specializing in South African home loans and mortgages. 
    Provide clear, accurate, and helpful advice based on the user's situation. 
    Always consider South African regulations and market conditions. 
    Be concise but thorough in your responses.`;

    const response = await this.chatCompletion({
      model: this.config.defaultModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || '';
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService(); 