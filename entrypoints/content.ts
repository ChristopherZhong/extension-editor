import { defineContentScript } from 'wxt/sandbox';
import '../src/components/llm-editor-floating-badge';
import '../src/components/llm-editor-suggestion-card';
import { LlmEditorFloatingBadge } from '../src/components/llm-editor-floating-badge';
import { LlmEditorSuggestionCard } from '../src/components/llm-editor-suggestion-card';
import { ExtensionMessage, MessageResponse } from '../src/types/messaging';
import { GrammarCheckResult, Suggestion, ToneType } from '../src/types/llm';

export default defineContentScript({
  matches: ['<all_urls>'],
  main(ctx) {
    let activeElement: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;
    let badgeElement: LlmEditorFloatingBadge | null = null;
    let cardElement: LlmEditorSuggestionCard | null = null;
    let currentSuggestions: Suggestion[] = [];
    let debounceTimer: any = null;

    function initBadge() {
      if (!badgeElement) {
        badgeElement = document.createElement('llm-editor-floating-badge') as LlmEditorFloatingBadge;
        document.body.appendChild(badgeElement);

        badgeElement.addEventListener('badge-click', () => {
          toggleSuggestionCard();
        });
      }
    }

    function initCard() {
      if (!cardElement) {
        cardElement = document.createElement('llm-editor-suggestion-card') as LlmEditorSuggestionCard;
        document.body.appendChild(cardElement);

        cardElement.addEventListener('accept-suggestion', (e: any) => {
          const sug: Suggestion = e.detail.suggestion;
          applySuggestion(sug);
        });

        cardElement.addEventListener('apply-tone', (e: any) => {
          const tone: ToneType = e.detail.tone;
          applyToneRewrite(tone);
        });

        cardElement.addEventListener('close-card', () => {
          hideCard();
        });
      }
    }

    function positionBadge(target: HTMLElement) {
      if (!badgeElement) return;
      const rect = target.getBoundingClientRect();
      const top = rect.bottom + window.scrollY - 34;
      const left = rect.right + window.scrollX - 38;
      badgeElement.style.top = `${Math.max(10, top)}px`;
      badgeElement.style.left = `${Math.max(10, left)}px`;
      badgeElement.style.display = 'block';
    }

    function positionCard(target: HTMLElement) {
      if (!cardElement) return;
      const rect = target.getBoundingClientRect();
      const top = rect.bottom + window.scrollY + 6;
      const left = Math.min(rect.left + window.scrollX, window.innerWidth - 340);
      cardElement.style.top = `${Math.max(10, top)}px`;
      cardElement.style.left = `${Math.max(10, left)}px`;
      cardElement.style.display = 'block';
    }

    function hideBadge() {
      if (badgeElement) badgeElement.style.display = 'none';
      hideCard();
    }

    function hideCard() {
      if (cardElement) cardElement.style.display = 'none';
    }

    function toggleSuggestionCard() {
      if (!activeElement) return;
      initCard();
      if (!cardElement) return;

      if (cardElement.style.display === 'block') {
        hideCard();
      } else {
        cardElement.suggestions = currentSuggestions;
        positionCard(activeElement);
      }
    }

    function getElementText(el: HTMLElement): string {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        return el.value;
      }
      return el.innerText || el.textContent || '';
    }

    function setElementText(el: HTMLElement, newText: string) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = newText;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (el.isContentEditable) {
        el.innerText = newText;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    async function triggerGrammarCheck(el: HTMLElement) {
      const text = getElementText(el);
      if (!text || text.trim().length === 0) {
        currentSuggestions = [];
        if (badgeElement) {
          badgeElement.count = 0;
          badgeElement.loading = false;
        }
        return;
      }

      if (badgeElement) {
        badgeElement.loading = true;
        badgeElement.hasError = false;
      }

      try {
        const response: MessageResponse<GrammarCheckResult> = await chrome.runtime.sendMessage({
          type: 'CHECK_GRAMMAR',
          text
        });

        if (badgeElement) badgeElement.loading = false;

        if (response && response.success && response.data) {
          currentSuggestions = response.data.suggestions || [];
          if (badgeElement) {
            badgeElement.count = currentSuggestions.length;
            badgeElement.hasError = false;
          }
          if (cardElement && cardElement.style.display === 'block') {
            cardElement.suggestions = currentSuggestions;
          }
        } else {
          if (badgeElement) {
            badgeElement.hasError = true;
            badgeElement.statusMessage = response?.error || 'Connection error';
          }
        }
      } catch (err: any) {
        if (badgeElement) {
          badgeElement.loading = false;
          badgeElement.hasError = true;
          badgeElement.statusMessage = 'Failed to connect to background worker';
        }
      }
    }

    function applySuggestion(sug: Suggestion) {
      if (!activeElement) return;
      const text = getElementText(activeElement);
      if (!text) return;

      const updatedText = text.replace(sug.originalText, sug.suggestedText);
      setElementText(activeElement, updatedText);

      currentSuggestions = currentSuggestions.filter((s) => s.id !== sug.id);
      if (badgeElement) badgeElement.count = currentSuggestions.length;
      if (cardElement) cardElement.suggestions = currentSuggestions;

      if (currentSuggestions.length === 0) {
        hideCard();
      }
    }

    async function applyToneRewrite(tone: ToneType) {
      if (!activeElement) return;
      const text = getElementText(activeElement);
      if (!text) return;

      if (cardElement) cardElement.loading = true;

      try {
        const response: MessageResponse<string> = await chrome.runtime.sendMessage({
          type: 'REWRITE_TEXT',
          text,
          tone
        });

        if (cardElement) cardElement.loading = false;

        if (response && response.success && response.data) {
          setElementText(activeElement, response.data);
          hideCard();
          triggerGrammarCheck(activeElement);
        } else if (cardElement) {
          cardElement.statusMessage = response?.error || 'Rewrite failed';
        }
      } catch (err) {
        if (cardElement) {
          cardElement.loading = false;
          cardElement.statusMessage = 'Failed to request rewrite';
        }
      }
    }

    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable)
      ) {
        activeElement = target;
        initBadge();
        positionBadge(target);
        triggerGrammarCheck(target);
      }
    });

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;
      if (target === activeElement) {
        positionBadge(target);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerGrammarCheck(target);
        }, 800);
      }
    });

    window.addEventListener('scroll', () => {
      if (activeElement && badgeElement && badgeElement.style.display === 'block') {
        positionBadge(activeElement);
        if (cardElement && cardElement.style.display === 'block') {
          positionCard(activeElement);
        }
      }
    }, true);
  }
});
