import { LLMProvider, ProviderConfig, GrammarCheckResult, RewriteOptions, Suggestion, ToneType } from '../types/llm';

const TONE_PROMPT_MAP: Record<ToneType, string> = {
  professional: 'Rewrite the text to sound polished, professional, and formal.',
  casual: 'Rewrite the text to sound friendly, conversational, and casual.',
  confident: 'Rewrite the text to sound authoritative, persuasive, and confident.',
  friendly: 'Rewrite the text to sound warm, welcoming, and friendly.',
  direct: 'Rewrite the text to be concise, direct, and straight to the point.',
  expand: 'Expand on the text with richer details while preserving original meaning.',
  shorten: 'Shorten the text aggressively while keeping the main point.'
};

export class OllamaProvider implements LLMProvider {
  public readonly id = 'ollama';
  public readonly name = 'Ollama (Local LLM)';

  private getBaseUrl(config: ProviderConfig): string {
    const rawUrl = config.baseUrl || 'http://localhost:11434';
    return rawUrl.replace(/\/+$/, '');
  }

  public async healthCheck(config: ProviderConfig): Promise<{ isAvailable: boolean; message?: string }> {
    try {
      const baseUrl = this.getBaseUrl(config);
      const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
      if (response.ok) {
        return { isAvailable: true, message: 'Ollama service is reachable.' };
      }
      return { isAvailable: false, message: `Ollama returned HTTP ${response.status}` };
    } catch (error: any) {
      return { isAvailable: false, message: `Failed to connect to Ollama: ${error?.message || error}` };
    }
  }

  public async listModels(config: ProviderConfig): Promise<string[]> {
    try {
      const baseUrl = this.getBaseUrl(config);
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data.models)) {
        return data.models.map((m: any) => m.name || m.model);
      }
      return [];
    } catch (err) {
      console.error('Failed to list Ollama models:', err);
      return [];
    }
  }

  public async checkGrammar(text: string, config: ProviderConfig): Promise<GrammarCheckResult> {
    if (!text || text.trim().length === 0) {
      return { suggestions: [] };
    }

    const baseUrl = this.getBaseUrl(config);
    const model = config.model || 'llama3.2';

    const systemPrompt = `You are a strict, precise grammar and spelling checker.
Analyze the user text and identify grammar, spelling, clarity, or style errors.
Return ONLY a valid JSON object matching this schema without markdown code blocks, preamble, or conversation:
{
  "suggestions": [
    {
      "originalText": "exact text from user input that has an error",
      "suggestedText": "corrected replacement text",
      "explanation": "brief explanation of why this fix is recommended",
      "category": "grammar" | "spelling" | "style" | "clarity"
    }
  ]
}
If no errors are found, return: { "suggestions": [] }`;

    const userPrompt = `Text to check:\n"${text}"`;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: userPrompt,
          system: config.customSystemPrompt ? `${systemPrompt}\nAdditional instructions: ${config.customSystemPrompt}` : systemPrompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with HTTP status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.response || '{}';
      return this.parseGrammarResponse(rawText, text);
    } catch (error: any) {
      console.error('Ollama checkGrammar error:', error);
      throw error;
    }
  }

  public async rewriteText(text: string, options: RewriteOptions, config: ProviderConfig): Promise<string> {
    const baseUrl = this.getBaseUrl(config);
    const model = config.model || 'llama3.2';

    let promptGoal = 'Rewrite and improve the text for overall clarity and quality.';
    if (options.tone && TONE_PROMPT_MAP[options.tone]) {
      promptGoal = TONE_PROMPT_MAP[options.tone];
    }

    if (options.customPrompt) {
      promptGoal += ` Additional request: ${options.customPrompt}`;
    }

    const systemPrompt = `You are an expert AI editor. ${promptGoal} Output ONLY the final revised text. Do not include quotes, explanations, or introductory text.`;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: `Text to rewrite:\n${text}`,
          system: systemPrompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with HTTP status ${response.status}`);
      }

      const resData = await response.json();
      return (resData.response || '').trim();
    } catch (error: any) {
      console.error('Ollama rewriteText error:', error);
      throw error;
    }
  }

  private parseGrammarResponse(rawJson: string, originalFullText: string): GrammarCheckResult {
    try {
      const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed || !Array.isArray(parsed.suggestions)) {
        return { suggestions: [] };
      }

      const suggestions: Suggestion[] = [];
      parsed.suggestions.forEach((item: any, idx: number) => {
        if (!item.originalText || !item.suggestedText) return;

        const startIndex = originalFullText.indexOf(item.originalText);
        const endIndex = startIndex !== -1 ? startIndex + item.originalText.length : 0;

        suggestions.push({
          id: `sug-${Date.now()}-${idx}`,
          originalText: item.originalText,
          suggestedText: item.suggestedText,
          explanation: item.explanation || 'Correction suggested',
          category: ['grammar', 'spelling', 'style', 'clarity'].includes(item.category) ? item.category : 'grammar',
          startIndex,
          endIndex
        });
      });

      return { suggestions };
    } catch (err) {
      console.warn('Failed to parse grammar response from Ollama:', rawJson, err);
      return { suggestions: [] };
    }
  }
}
