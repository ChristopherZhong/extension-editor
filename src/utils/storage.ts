import { ExtensionSettings, DEFAULT_SETTINGS } from '../types/messaging';

const STORAGE_KEY = 'local_llm_extension_settings';

export async function getStoredSettings(): Promise<ExtensionSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) {
        return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] };
      }
    }
  } catch (err) {
    console.warn('Failed to read settings from browser storage:', err);
  }
  return DEFAULT_SETTINGS;
}

export async function saveStoredSettings(newSettings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getStoredSettings();
  const updated: ExtensionSettings = {
    ...current,
    ...newSettings,
    providerConfigs: {
      ...current.providerConfigs,
      ...(newSettings.providerConfigs || {})
    }
  };

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    }
  } catch (err) {
    console.error('Failed to save settings to browser storage:', err);
  }

  return updated;
}
