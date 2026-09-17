import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ExtensionSettings, MessageResponse } from '../types/messaging';

@customElement('llm-editor-popup')
export class LlmEditorPopup extends LitElement {
  @state() private settings?: ExtensionSettings;
  @state() private backendStatus = 'Checking...';
  @state() private isBackendConnected = false;

  static styles = css`
    :host {
      display: block;
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 8px 10px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .status-indicator.online { background: #10b981; }
    .status-indicator.offline { background: #ef4444; }

    .toggle-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #ccc;
      transition: .2s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .btn {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #ffffff;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
    }

    .btn:hover {
      background: #f3f4f6;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
    await this.checkHealth();
  }

  private async loadSettings() {
    try {
      const res: MessageResponse<ExtensionSettings> = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (res && res.success && res.data) {
        this.settings = res.data;
      }
    } catch (err) {
      console.error('Failed to load settings in popup:', err);
    }
  }

  private async checkHealth() {
    try {
      const res: MessageResponse = await chrome.runtime.sendMessage({ type: 'HEALTH_CHECK' });
      if (res && res.success && res.data && res.data.isAvailable) {
        this.isBackendConnected = true;
        this.backendStatus = 'LLM Connected';
      } else {
        this.isBackendConnected = false;
        this.backendStatus = 'LLM Unreachable';
      }
    } catch (err) {
      this.isBackendConnected = false;
      this.backendStatus = 'Connection Error';
    }
  }

  private async toggleEnabled(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    if (this.settings) {
      this.settings = { ...this.settings, enabled: checked };
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: { enabled: checked }
      });
    }
  }

  private openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }

  render() {
    return html`
      <div class="header">
        <div class="title">
          <span>✨</span> Local LLM Editor
        </div>
      </div>

      <div class="status-row">
        <span>Backend Status</span>
        <span>
          <span class="status-indicator ${this.isBackendConnected ? 'online' : 'offline'}"></span>
          ${this.backendStatus}
        </span>
      </div>

      <div class="toggle-container">
        <span>Enable Assistant</span>
        <label class="switch">
          <input
            type="checkbox"
            .checked=${this.settings?.enabled ?? true}
            @change=${this.toggleEnabled}
          />
          <span class="slider"></span>
        </label>
      </div>

      <button class="btn" @click=${this.openOptionsPage}>
        ⚙️ Open Options & Settings
      </button>
    `;
  }
}
