/**
 * Translation Providers - Interface và implementations mẫu
 */

import type { TranslationProvider, TranslationOptions } from '../../lib/i18n/types';
import { TRANSLATION_PROMPT, GLOSSARY_VERSION } from './config';
import { ZH_VI_GLOSSARY } from '../../lib/i18n/zh-vi-glossary';

/**
 * Format glossary thành string cho prompt
 */
function formatGlossaryForPrompt(): string {
  return ZH_VI_GLOSSARY
    .map(entry => `  ${entry.zh} = ${entry.vi}`)
    .join('\n');
}

/**
 * OpenAI-compatible Provider
 */
export class OpenAIProvider implements TranslationProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1', model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async translate(input: string, options?: TranslationOptions): Promise<string> {
    const prompt = TRANSLATION_PROMPT
      .replace('{{glossary}}', formatGlossaryForPrompt())
      .replace('{{text}}', input);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || input;
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }
}

/**
 * DeepSeek-compatible Provider
 * (DeepSeek API tương thích với OpenAI format)
 */
export class DeepSeekProvider implements TranslationProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.deepseek.com/v1', model: string = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async translate(input: string, options?: TranslationOptions): Promise<string> {
    // DeepSeek dùng cùng format với OpenAI
    const openai = new OpenAIProvider(this.apiKey, this.baseUrl, this.model);
    return openai.translate(input, options);
  }
}

/**
 * Local Placeholder Provider - chỉ áp dụng glossary, không gọi AI
 * Dùng để test hoặc khi chưa có API key
 */
export class LocalPlaceholderProvider implements TranslationProvider {
  async translate(input: string, options?: TranslationOptions): Promise<string> {
    // Chỉ áp dụng glossary mapping cơ bản
    // Đây là placeholder, trong thực tế sẽ gọi hàm translateZhTermsToVi
    let result = input;
    
    // Simple replacement từ glossary (từ dài trước)
    const sortedGlossary = [...ZH_VI_GLOSSARY].sort((a, b) => b.zh.length - a.zh.length);
    
    for (const entry of sortedGlossary) {
      const regex = new RegExp(entry.zh, 'g');
      result = result.replace(regex, entry.vi);
    }
    
    return result;
  }
}

/**
 * Factory để tạo provider từ config
 */
export function createTranslationProvider(
  providerType: string,
  apiKey?: string,
  baseUrl?: string,
  model?: string
): TranslationProvider {
  switch (providerType.toLowerCase()) {
    case 'openai':
      if (!apiKey) {
        throw new Error('Missing API key for OpenAI provider');
      }
      return new OpenAIProvider(apiKey, baseUrl, model);
      
    case 'deepseek':
      if (!apiKey) {
        throw new Error('Missing API key for DeepSeek provider');
      }
      return new DeepSeekProvider(apiKey, baseUrl, model);
      
    case 'local':
    default:
      return new LocalPlaceholderProvider();
  }
}
