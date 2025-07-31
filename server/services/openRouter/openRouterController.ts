/**
 * OpenRouter Controller
 * 
 * Handles HTTP requests for OpenRouter AI services
 */

import { Request, Response } from 'express';
import { getOpenRouterService } from './openRouterService';

export class OpenRouterController {
  /**
   * Test the OpenRouter connection and configuration
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const openRouterService = getOpenRouterService();
      
      if (!openRouterService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured'
        });
      }

      // Test with a simple request
      const response = await openRouterService.generateText('Hello, this is a test message.');
      
      res.json({
        success: true,
        message: 'OpenRouter connection successful',
        testResponse: response.substring(0, 100) + '...',
        configured: true
      });
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      res.status(500).json({
        success: false,
        error: 'OpenRouter connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available models from OpenRouter
   */
  static async getModels(req: Request, res: Response) {
    try {
      const openRouterService = getOpenRouterService();
      
      if (!openRouterService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured'
        });
      }

      const models = await openRouterService.getModels();
      
      res.json({
        success: true,
        models: models.data || models,
        count: (models.data || models).length
      });
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch models',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate text using OpenRouter
   */
  static async generateText(req: Request, res: Response) {
    try {
      const { prompt, model, temperature, maxTokens } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required'
        });
      }

      const openRouterService = getOpenRouterService();
      
      if (!openRouterService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured'
        });
      }

      const response = await openRouterService.chatCompletion({
        model: model || undefined,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature || undefined,
        max_tokens: maxTokens || undefined
      });

      res.json({
        success: true,
        response: response.choices[0]?.message?.content || '',
        usage: response.usage,
        model: response.model
      });
    } catch (error) {
      console.error('Text generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Text generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate financial advice using OpenRouter
   */
  static async generateFinancialAdvice(req: Request, res: Response) {
    try {
      const { context, userSituation } = req.body;

      if (!context && !userSituation) {
        return res.status(400).json({
          success: false,
          error: 'Context or user situation is required'
        });
      }

      const openRouterService = getOpenRouterService();
      
      if (!openRouterService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured'
        });
      }

      const prompt = userSituation || context;
      const advice = await openRouterService.generateFinancialAdvice(prompt);

      res.json({
        success: true,
        advice,
        disclaimer: 'This advice is for informational purposes only. Please consult with a qualified financial advisor for personalized advice.'
      });
    } catch (error) {
      console.error('Financial advice generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Financial advice generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Chat completion endpoint
   */
  static async chatCompletion(req: Request, res: Response) {
    try {
      const { messages, model, temperature, maxTokens, stream } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      const openRouterService = getOpenRouterService();
      
      if (!openRouterService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'OpenRouter API key not configured'
        });
      }

      const response = await openRouterService.chatCompletion({
        model: model || undefined,
        messages,
        temperature: temperature || undefined,
        max_tokens: maxTokens || undefined,
        stream: stream || false
      });

      res.json({
        success: true,
        response,
        usage: response.usage,
        model: response.model
      });
    } catch (error) {
      console.error('Chat completion failed:', error);
      res.status(500).json({
        success: false,
        error: 'Chat completion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 