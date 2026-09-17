import { ProviderConfig, ToneType } from '../types/llm';

export interface ExtensionSettings {
  enabled: boolean;
  activeProviderId: string;
  providerConfigs: Record<string, ProviderConfig>;
  debounceMs: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  activeProviderId: 'ollama',
  providerConfigs: {
    ollama: {
      id: 'ollama',
      name: 'Ollama (Local LLM)',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      customSystemPrompt: ''
    }
  },
  debounceMs: 800
};

export type MessageType =
  | 'CHECK_GRAMMAR'
  | 'REWRITE_TEXT'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'LIST_MODELS'
  | 'HEALTH_CHECK';

export interface BaseMessage {
  type: MessageType;
}

export interface CheckGrammarMessage extends BaseMessage {
  type: 'CHECK_GRAMMAR';
  text: string;
}

export interface RewriteTextMessage extends BaseMessage {
  type: 'REWRITE_TEXT';
  text: string;
  tone?: ToneType;
  customPrompt?: string;
}

export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

export interface SaveSettingsMessage extends BaseMessage {
  type: 'SAVE_SETTINGS';
  settings: Partial<ExtensionSettings>;
}

export interface ListModelsMessage extends BaseMessage {
  type: 'LIST_MODELS';
  providerId?: string;
  baseUrl?: string;
}

export interface HealthCheckMessage extends BaseMessage {
  type: 'HEALTH_CHECK';
  providerId?: string;
  baseUrl?: string;
}

export type ExtensionMessage =
  | CheckGrammarMessage
  | RewriteTextMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | ListModelsMessage
  | HealthCheckMessage;

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
