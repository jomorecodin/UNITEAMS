import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export const FontZoomControl: React.FC = () => {
  const { fontZoom, increase, decrease, reset, setFontZoom, min, max, step } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[1100]">
      {/* Botón flotante para abrir/cerrar */}
      <button
        className="rounded-full bg-neutral-900 text-white border border-neutral-700 shadow px-3 py-2 hover:bg-neutral-800"
        title="Accesibilidad: Tamaño de letra"
        onClick={() => setOpen(o => !o)}
      >
        A
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