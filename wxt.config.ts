import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: [],
  manifest: {
    name: 'Local LLM Writing Assistant',
    description: 'Grammarly alternative powered by local LLMs via Ollama',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['http://localhost/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'Local LLM Writing Assistant'
    },
    options_page: 'options.html'
  }
});
