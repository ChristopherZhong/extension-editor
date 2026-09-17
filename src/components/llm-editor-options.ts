import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ExtensionSettings, MessageResponse } from '../types/messaging';
import { ProviderConfig } from '../types/llm';

@customElement('llm-editor-options')
export class LlmEditorOptions extends LitElement {
  @state() private settings?: ExtensionSettings;
  @state() private availableModels: string[] = [];
  @state() private activeProviderId = 'ollama';
  @state() private baseUrl = 'http://localhost:11434';
  @state() private selectedModel = 'llama3.2';
  @state() private customPrompt = '';
  @state() private healthStatus = '';
  @state() private healthSuccess = false;
  @state() private isSaving = false;

  static styles = css`
    :host {
      display: block;
      max-width: 680px;
      margin: 40px auto;
      padding: 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #111827;
    }

    p.sub {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 6px;
      color: #374151;
    }

    input, select, textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
    }

    input:focus, select:focus, textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }

    .btn-row {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: #10b981;
      color: white;
    }
    .btn-primary:hover { background: #059669; }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-secondary:hover { background: #e5e7eb; }

    .status-badge {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }
    .status-badge.success {
      background: #d1fae5;
      color: #065f46;
    }
    .status-badge.error {
      background: #fee2e2;
      color: #991b1b;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
    await this.fetchModels();
  }

  private async loadSettings() {
    try {
      const res: MessageResponse<ExtensionSettings> = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (res && res.success && res.data) {
        this.settings = res.data;
        this.activeProviderId = res.data.activeProviderId || 'ollama';
        const config = res.data.providerConfigs[this.activeProviderId] || {};
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.selectedModel = config.model || 'llama3.2';
        this.customPrompt = config.customSystemPrompt || '';
      }
    } catch (err) {
      console.error('Failed to load settings in options:', err);
    }
  }

  private async fetchModels() {
    try {
      const res: MessageResponse<string[]> = await chrome.runtime.sendMessage({
        type: 'LIST_MODELS',
        providerId: this.activeProviderId,
        baseUrl: this.baseUrl
      });
      if (res && res.success && res.data) {
        this.availableModels = res.data;
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }

  private async testConnection() {
    this.healthStatus = 'Testing connection...';
    try {
      const res: MessageResponse = await chrome.runtime.sendMessage({
        type: 'HEALTH_CHECK',
        providerId: this.activeProviderId,
        baseUrl: this.baseUrl
      });

      if (res && res.success && res.data && res.data.isAvailable) {
        this.healthSuccess = true;
        this.healthStatus = 'Connection successful! Ollama is reachable.';
        await this.fetchModels();
      } else {
        this.healthSuccess = false;
        this.healthStatus = res?.data?.message || res?.error || 'Connection failed.';
      }
    } catch (err: any) {
      this.healthSuccess = false;
      this.healthStatus = 'Connection failed.';
    }
  }

  private async saveSettings() {
    this.isSaving = true;
    const providerConfig: ProviderConfig = {
      id: this.activeProviderId,
      name: 'Ollama (Local LLM)',
      baseUrl: this.baseUrl,
      model: this.selectedModel,
      customSystemPrompt: this.customPrompt
    };

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: {
          activeProviderId: this.activeProviderId,
          providerConfigs: {
            [this.activeProviderId]: providerConfig
          }
        }
      });
      this.healthSuccess = true;
      this.healthStatus = 'Settings saved successfully!';
    } catch (err) {
      this.healthSuccess = false;
      this.healthStatus = 'Failed to save settings.';
    } finally {
      this.isSaving = false;
    }
  }

  render() {
    return html`
      <h1>Extension Settings</h1>
      <p class="sub">Configure local LLM provider, models, and custom writing instructions.</p>

      <div class="form-group">
        <label>LLM Provider Strategy</label>
        <select .value=${this.activeProviderId} @change=${(e: Event) => this.activeProviderId = (e.target as HTMLSelectElement).value}>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Ollama Server Base URL</label>
        <input
          type="text"
          .value=${this.baseUrl}
          @input=${(e: Event) => this.baseUrl = (e.target as HTMLInputElement).value}
          placeholder="http://localhost:11434"
        />
      </div>

      <div class="form-group">
        <label>Active Model</label>
        <select .value=${this.selectedModel} @change=${(e: Event) => this.selectedModel = (e.target as HTMLSelectElement).value}>
          ${this.availableModels.length > 0
            ? this.availableModels.map((m) => html`<option value=${m} ?selected=${m === this.selectedModel}>${m}</option>`)
            : html`<option value=${this.selectedModel}>${this.selectedModel}</option>`}
        </select>
      </div>

      <div class="form-group">
        <label>Custom System Prompt / Directives</label>
        <textarea
          .value=${this.customPrompt}
          @input=${(e: Event) => this.customPrompt = (e.target as HTMLTextAreaElement).value}
          placeholder="e.g. Prefer British English spelling, maintain formal tone..."
        ></textarea>
      </div>

      ${this.healthStatus ? html`
        <div class="status-badge ${this.healthSuccess ? 'success' : 'error'}">
          ${this.healthStatus}
        </div>
      ` : ''}

      <div class="btn-row">
        <button class="btn btn-primary" @click=${this.saveSettings} ?disabled=${this.isSaving}>
          ${this.isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        <button class="btn btn-secondary" @click=${this.testConnection}>
          Test Connection
        </button>
      </div>
    `;
  }
}
