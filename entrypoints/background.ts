import { defineBackground } from 'wxt/sandbox';
import { LLMProviderRegistry } from '../src/providers/LLMProviderRegistry';
import { OllamaProvider } from '../src/providers/OllamaProvider';
import { getStoredSettings, saveStoredSettings } from '../src/utils/storage';
import { ExtensionMessage, MessageResponse } from '../src/types/messaging';

export default defineBackground(() => {
  const registry = LLMProviderRegistry.getInstance();
  registry.registerProvider(new OllamaProvider());

  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true; // Keep message channel open for async response
  });
});

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  const registry = LLMProviderRegistry.getInstance();
  const settings = await getStoredSettings();

  switch (message.type) {
    case 'GET_SETTINGS':
      return { success: true, data: settings };

    case 'SAVE_SETTINGS': {
      const updated = await saveStoredSettings(message.settings);
      return { success: true, data: updated };
    }

    case 'CHECK_GRAMMAR': {
      if (!settings.enabled) {
        return { success: true, data: { suggestions: [] } };
      }
      const providerId = settings.activeProviderId;
      const provider = registry.getProvider(providerId);
      if (!provider) {
        return { success: false, error: `Provider '${providerId}' not registered.` };
      }
      const config = settings.providerConfigs[providerId] || { id: providerId, name: provider.name, baseUrl: 'http://localhost:11434', model: 'llama3.2' };
      const result = await provider.checkGrammar(message.text, config);
      return { success: true, data: result };
    }

    case 'REWRITE_TEXT': {
      const providerId = settings.activeProviderId;
      const provider = registry.getProvider(providerId);
      if (!provider) {
        return { success: false, error: `Provider '${providerId}' not registered.` };
      }
      const config = settings.providerConfigs[providerId] || { id: providerId, name: provider.name, baseUrl: 'http://localhost:11434', model: 'llama3.2' };
      const rewritten = await provider.rewriteText(message.text, { tone: message.tone, customPrompt: message.customPrompt }, config);
      return { success: true, data: rewritten };
    }

    case 'LIST_MODELS': {
      const providerId = message.providerId || settings.activeProviderId;
      const provider = registry.getProvider(providerId);
      if (!provider) {
        return { success: false, error: `Provider '${providerId}' not registered.` };
      }
      const baseConfig = settings.providerConfigs[providerId] || { id: providerId, name: provider.name, baseUrl: 'http://localhost:11434', model: 'llama3.2' };
      const config = message.baseUrl ? { ...baseConfig, baseUrl: message.baseUrl } : baseConfig;
      const models = await provider.listModels(config);
      return { success: true, data: models };
    }

    case 'HEALTH_CHECK': {
      const providerId = message.providerId || settings.activeProviderId;
      const provider = registry.getProvider(providerId);
      if (!provider) {
        return { success: false, error: `Provider '${providerId}' not registered.` };
      }
      const baseConfig = settings.providerConfigs[providerId] || { id: providerId, name: provider.name, baseUrl: 'http://localhost:11434', model: 'llama3.2' };
      const config = message.baseUrl ? { ...baseConfig, baseUrl: message.baseUrl } : baseConfig;
      const health = await provider.healthCheck(config);
      return { success: true, data: health };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
