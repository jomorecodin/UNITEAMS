import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export const FontZoomControl: React.FC = () => {
  const { fontZoom, increase, decrease, reset, setFontZoom, min, max, step } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[1100]">
      {/* Botón flotante: lupa con + */}
      <button
        className="h-10 w-10 flex items-center justify-center rounded-full bg-neutral-900 text-white border border-neutral-700 shadow hover:bg-neutral-800"
        title="Accesibilidad: Tamaño de letra"
        aria-label="Abrir configuración de tamaño de letra"
        onClick={() => setOpen(o => !o)}
      >
        {/* Lupa con + (SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          <path d="M11 8v6" strokeLinecap="round" />
          <path d="M8 11h6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 w-64 rounded-lg bg-neutral-900 border border-neutral-700 shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-300 text-sm">Tamaño de letra</span>
            <span className="text-neutral-400 text-xs">{Math.round(fontZoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700"
              onClick={decrease}
              title="Disminuir (Ctrl+Alt+-)"
            >
              A-
            </button>

            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={fontZoom}
              onChange={(e) => setFontZoom(Number(e.target.value))}
              className="flex-1 accent-orange-500"
            />

            <button
              className="px-2 py-1 rounded bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700"
              onClick={increase}
              title="Aumentar (Ctrl+Alt+=)"
            >
              A+
            </button>
          </div>

          <button
            className="mt-2 w-full text-xs text-neutral-300 hover:text-white underline underline-offset-4"
            onClick={reset}
            title="Restablecer (Ctrl+Alt+0)"
          >
            Restablecer a 100%
          </button>
        </div>
      )}
    </div>
  );
};