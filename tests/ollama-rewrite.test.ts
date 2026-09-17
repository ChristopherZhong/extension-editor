import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaProvider } from '../src/providers/OllamaProvider';
import { ProviderConfig } from '../src/types/llm';

describe('OllamaProvider Rewrite & Prompting', () => {
  let provider: OllamaProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    provider = new OllamaProvider();
    mockConfig = {
      id: 'ollama',
      name: 'Ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    };
  });

  it('handles rewriteText for professional tone', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'I am writing to inquire regarding the project status.' })
    });

    const result = await provider.rewriteText('hey whats up with project', { tone: 'professional' }, mockConfig);
    expect(result).toBe('I am writing to inquire regarding the project status.');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('handles empty response gracefully in checkGrammar', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'invalid json content' })
    });

    const result = await provider.checkGrammar('Testing input', mockConfig);
    expect(result.suggestions).toEqual([]);
  });
});
