import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('llm-editor-floating-badge')
export class LlmEditorFloatingBadge extends LitElement {
  @property({ type: Number }) count = 0;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) statusMessage = '';
  @property({ type: Boolean }) hasError = false;

  static styles = css`
    :host {
      position: absolute;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }

    .badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      border-radius: 14px;
      background: #10b981;
      color: white;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .badge:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .badge.has-issues {
      background: #ef4444;
    }

    .badge.loading {
      background: #3b82f6;
    }

    .badge.error {
      background: #f59e0b;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <div
        class="badge ${this.loading ? 'loading' : ''} ${this.hasError ? 'error' : ''} ${this.count > 0 ? 'has-issues' : ''}"
        title=${this.statusMessage || (this.count > 0 ? `${this.count} suggestion(s)` : 'Writing Assistant Ready')}
        @click=${this._onClick}
      >
        ${this.loading
          ? html`<div class="spinner"></div>`
          : this.hasError
            ? html`<span>!</span>`
            : html`<span>${this.count > 0 ? this.count : '✨'}</span>`}
      </div>
    `;
  }

  private _onClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('badge-click', { bubbles: true, composed: true }));
  }
}
