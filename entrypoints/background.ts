import { defineBackground } from 'wxt/sandbox';
import { LLMProviderRegistry } from '../src/providers/llm-provider-registry';
import { OllamaProvider } from '../src/providers/ollama-provider';
import { getStoredSettings, saveStoredSettings } from '../src/utils/storage';
import {
  ExtensionMessage,
  MessageResponse,
  MessageType,
  CheckGrammarMessage,
  RewriteTextMessage,
  SaveSettingsMessage,
  ListModelsMessage,
  HealthCheckMessage,
  ExtensionSettings
} from '../src/types/messaging';

type MessageHandler<T extends ExtensionMessage = ExtensionMessage> = (
  message: T,
  settings: ExtensionSettings,
  registry: LLMProviderRegistry
) => Promise<MessageResponse>;

const messageHandlers: Record<MessageType, MessageHandler<any>> = {
  GET_SETTINGS: async (_message, settings) => {
    return { success: true, data: settings };
  },

  SAVE_SETTINGS: async (message: SaveSettingsMessage) => {
    const updated = await saveStoredSettings(message.settings);
    return { success: true, data: updated };
  },

  CHECK_GRAMMAR: async (message: CheckGrammarMessage, settings, registry) => {
    if (!settings.enabled) {
      return { success: true, data: { suggestions: [] } };
    }
    const providerId = settings.activeProviderId;
    const provider = registry.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider '${providerId}' not registered.` };
    }
    const config = settings.providerConfigs[providerId] || {
      id: providerId,
      name: provider.name,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };
    const result = await provider.checkGrammar(message.text, config);
    return { success: true, data: result };
  },

  REWRITE_TEXT: async (message: RewriteTextMessage, settings, registry) => {
    const providerId = settings.activeProviderId;
    const provider = registry.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider '${providerId}' not registered.` };
    }
    const config = settings.providerConfigs[providerId] || {
      id: providerId,
      name: provider.name,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };
    const rewritten = await provider.rewriteText(
      message.text,
      { tone: message.tone, customPrompt: message.customPrompt },
      config
    );
    return { success: true, data: rewritten };
  },

  LIST_MODELS: async (message: ListModelsMessage, settings, registry) => {
    const providerId = message.providerId || settings.activeProviderId;
    const provider = registry.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider '${providerId}' not registered.` };
    }
    const baseConfig = settings.providerConfigs[providerId] || {
      id: providerId,
      name: provider.name,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };
    const config = message.baseUrl ? { ...baseConfig, baseUrl: message.baseUrl } : baseConfig;
    const models = await provider.listModels(config);
    return { success: true, data: models };
  },

  HEALTH_CHECK: async (message: HealthCheckMessage, settings, registry) => {
    const providerId = message.providerId || settings.activeProviderId;
    const provider = registry.getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider '${providerId}' not registered.` };
    }
    const baseConfig = settings.providerConfigs[providerId] || {
      id: providerId,
      name: provider.name,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };
    const config = message.baseUrl ? { ...baseConfig, baseUrl: message.baseUrl } : baseConfig;
    const health = await provider.healthCheck(config);
    return { success: true, data: health };
  }
};

export default defineBackground(() => {
  const registry = LLMProviderRegistry.getInstance();
  registry.registerProvider(new OllamaProvider());

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true;
  });
});

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  const registry = LLMProviderRegistry.getInstance();
  const settings = await getStoredSettings();

  const handler = messageHandlers[message.type];
  if (!handler) {
    return { success: false, error: 'Unknown message type' };
  }

  return handler(message, settings, registry);
}
