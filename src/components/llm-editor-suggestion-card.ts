import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Suggestion, ToneType } from '../types/llm';

@customElement('llm-editor-suggestion-card')
export class LlmEditorSuggestionCard extends LitElement {
  @property({ type: Array }) suggestions: Suggestion[] = [];
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) statusMessage = '';

  static styles = css`
    :host {
      position: absolute;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
    }

    .card {
      width: 320px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      font-size: 13px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #9ca3af;
    }
    .close-btn:hover { color: #4b5563; }

    .body {
      padding: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .suggestion-item {
      padding: 10px;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fff;
    }

    .orig-text {
      text-decoration: line-through;
      color: #ef4444;
      font-weight: 500;
      margin-right: 6px;
    }

    .sug-text {
      color: #10b981;
      font-weight: 600;
    }

    .explanation {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .actions {
      margin-top: 8px;
      display: flex;
      gap: 6px;
    }

    .accept-btn {
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .accept-btn:hover { background: #059669; }

    .tone-section {
      border-top: 1px solid #f3f4f6;
      padding: 10px 12px;
      background: #f9fafb;
    }

    .tone-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .tone-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tone-btn {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tone-btn:hover {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .empty-state {
      padding: 16px;
      text-align: center;
      color: #6b7280;
    }
  `;

  render() {
    return html`
      <div class="card">
        <div class="header">
          <span>Local LLM Editor</span>
          <button class="close-btn" @click=${this._close}>✕</button>
        </div>

        <div class="body">
          ${this.loading
            ? html`<div class="empty-state">Analyzing text with local LLM...</div>`
            : this.suggestions.length > 0
              ? this.suggestions.map((s) => this._renderSuggestion(s))
              : html`<div class="empty-state">${this.statusMessage || 'No grammar or spelling issues found!'}</div>`
          }
        </div>

        <div class="tone-section">
          <div class="tone-title">Rewrite / Change Tone</div>
          <div class="tone-buttons">
            <button class="tone-btn" @click=${() => this._applyTone('professional')}>Professional</button>
            <button class="tone-btn" @click=${() => this._applyTone('casual')}>Casual</button>
            <button class="tone-btn" @click=${() => this._applyTone('confident')}>Confident</button>
            <button class="tone-btn" @click=${() => this._applyTone('direct')}>Direct</button>
            <button class="tone-btn" @click=${() => this._applyTone('shorten')}>Shorten</button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderSuggestion(s: Suggestion) {
    return html`
      <div class="suggestion-item">
        <div>
          <span class="orig-text">${s.originalText}</span>
          <span class="sug-text">➔ ${s.suggestedText}</span>
        </div>
        <div class="explanation">${s.explanation}</div>
        <div class="actions">
          <button class="accept-btn" @click=${() => this._accept(s)}>Accept</button>
        </div>
      </div>
    `;
  }

  private _accept(suggestion: Suggestion) {
    this.dispatchEvent(new CustomEvent('accept-suggestion', {
      detail: { suggestion },
      bubbles: true,
      composed: true
    }));
  }

  private _applyTone(tone: ToneType) {
    this.dispatchEvent(new CustomEvent('apply-tone', {
      detail: { tone },
      bubbles: true,
      composed: true
    }));
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('close-card', { bubbles: true, composed: true }));
  }
}
