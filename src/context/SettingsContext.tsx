import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SettingsContextType = {
  fontZoom: number;              // 1.0 = 100%
  setFontZoom: (v: number) => void;
  increase: () => void;          // +5%
  decrease: () => void;          // -5%
  reset: () => void;             // 100%
  min: number;
  max: number;
  step: number;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = 'app.fontZoom';
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const SettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const min = 0.85;
  const max = 1.50;
  const step = 0.05;

  const [fontZoom, setZoom] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : 1;
    return isFinite(parsed) ? clamp(parsed, min, max) : 1;
  });

  const applyZoom = (v: number) => {
    document.documentElement.style.setProperty('--font-zoom', String(v));
  };

  useEffect(() => {
    applyZoom(fontZoom);
    localStorage.setItem(STORAGE_KEY, String(fontZoom));
  }, [fontZoom]);

  useEffect(() => {
    // Atajos: Ctrl+Alt+=, Ctrl+Alt+-, Ctrl+Alt+0
    const onKey = (e: KeyboardEvent) => {
      const isWinCtrl = e.ctrlKey && e.altKey; // Windows: Ctrl+Alt
      if (!isWinCtrl) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => clamp(z + step, min, max)); }
      if (e.key === '-') { e.preventDefault(); setZoom(z => clamp(z - step, min, max)); }
      if (e.key === '0') { e.preventDefault(); setZoom(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo<SettingsContextType>(() => ({
    fontZoom,
    setFontZoom: (v) => setZoom(clamp(v, min, max)),
    increase: () => setZoom(z => clamp(z + step, min, max)),
    decrease: () => setZoom(z => clamp(z - step, min, max)),
    reset: () => setZoom(1),
    min, max, step,
  }), [fontZoom]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};