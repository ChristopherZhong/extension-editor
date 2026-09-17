import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMProviderRegistry } from '../src/providers/LLMProviderRegistry';
import { OllamaProvider } from '../src/providers/OllamaProvider';
import { ProviderConfig } from '../src/types/llm';

describe('LLMProviderRegistry & OllamaProvider', () => {
  beforeEach(() => {
    LLMProviderRegistry.getInstance().clear();
  });

  it('registers and retrieves providers correctly', () => {
    const registry = LLMProviderRegistry.getInstance();
    const ollama = new OllamaProvider();

    registry.registerProvider(ollama);

    expect(registry.hasProvider('ollama')).toBe(true);
    expect(registry.getProvider('ollama')).toBe(ollama);
    expect(registry.getAllProviders().length).toBe(1);
  });

  it('OllamaProvider healthCheck returns reachable status when API responds 200', async () => {
    const provider = new OllamaProvider();
    const mockConfig: ProviderConfig = {
      id: 'ollama',
      name: 'Ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'llama3.2:latest' }] })
    });

    const result = await provider.healthCheck(mockConfig);
    expect(result.isAvailable).toBe(true);
  });

  it('OllamaProvider checkGrammar parses suggestions from JSON response', async () => {
    const provider = new OllamaProvider();
    const mockConfig: ProviderConfig = {
      id: 'ollama',
      name: 'Ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };

    const mockJsonResponse = {
      response: JSON.stringify({
        suggestions: [
          {
            originalText: 'recieve',
            suggestedText: 'receive',
            explanation: 'Spelling error',
            category: 'spelling'
          }
        ]
      })
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJsonResponse
    });

    const checkResult = await provider.checkGrammar('I will recieve the email.', mockConfig);
    expect(checkResult.suggestions.length).toBe(1);
    expect(checkResult.suggestions[0].originalText).toBe('recieve');
    expect(checkResult.suggestions[0].suggestedText).toBe('receive');
  });
});
