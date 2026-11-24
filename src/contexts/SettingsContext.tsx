import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppSettings, AccessibilityMode } from '../types';

const STORAGE_KEY = 'drishti_settings';

const defaultSettings: AppSettings = {
  accessibilityMode: 'voice',
  voiceEnabled: true,
  speechSpeed: 1,
  language: 'en-IN',
  highContrast: false,
  largeText: false,
  hapticFeedback: true,
  fontSize: 1.0,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Corrupted data – fall back to defaults
  }
  return defaultSettings;
}

function persistSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable – silently ignore
  }
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load persisted settings on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Sync accessibility CSS classes to <html> whenever relevant settings change
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('high-contrast', settings.highContrast);
    html.classList.toggle('large-text', settings.largeText);
    html.style.setProperty('--font-scale', String(settings.fontSize));
  }, [settings.highContrast, settings.largeText, settings.fontSize]);

  // Sync accessibility CSS classes to <html> element whenever relevant settings change
  useEffect(() => {
    const html = document.documentElement;
    if (settings.highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
    if (settings.largeText) {
      html.classList.add('large-text');
    } else {
      html.classList.remove('large-text');
    }
    html.style.setProperty('--font-scale', String(settings.fontSize));
  }, [settings.highContrast, settings.largeText, settings.fontSize]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    persistSettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { SettingsContext };
