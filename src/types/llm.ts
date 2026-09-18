export interface Suggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  category: 'spelling' | 'grammar' | 'style' | 'clarity';
  startIndex: number;
  endIndex: number;
}

export interface GrammarCheckResult {
  suggestions: Suggestion[];
  summary?: string;
}

export type ToneType = 'professional' | 'casual' | 'confident' | 'friendly' | 'direct' | 'expand' | 'shorten';

export interface RewriteOptions {
  tone?: ToneType;
  customPrompt?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  customSystemPrompt?: string;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;

  checkGrammar(text: string, config: ProviderConfig): Promise<GrammarCheckResult>;
  rewriteText(text: string, options: RewriteOptions, config: ProviderConfig): Promise<string>;
  listModels(config: ProviderConfig): Promise<string[]>;
  healthCheck(config: ProviderConfig): Promise<{ isAvailable: boolean; message?: string }>;
}
