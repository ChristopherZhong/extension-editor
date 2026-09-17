import { LLMProvider } from '../types/llm';

export class LLMProviderRegistry {
  private static instance: LLMProviderRegistry;
  private providers: Map<string, LLMProvider> = new Map();

  private constructor() {}

  public static getInstance(): LLMProviderRegistry {
    if (!LLMProviderRegistry.instance) {
      LLMProviderRegistry.instance = new LLMProviderRegistry();
    }
    return LLMProviderRegistry.instance;
  }

  public registerProvider(provider: LLMProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Provider with id '${provider.id}' is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  public hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  public clear(): void {
    this.providers.clear();
  }
}
