import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string; // clases para las tarjetas internas (gap, padding, etc.)
};

export const HorizontalCarousel: React.FC<Props> = ({ children, className }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const updateArrows = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 2);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateArrows();
    const onScroll = () => updateArrows();
    const onResize = () => updateArrows();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateArrows]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.9)); // casi 1 página
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Carrusel */}
      <div
        ref={ref}
        className="no-scrollbar overflow-x-auto overscroll-x-contain"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className={`flex gap-4 px-2 py-2 ${className || ''}`}>
          {children}
        </div>
      </div>

      {/* Gradientes laterales más marcados */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-black/80 via-black/40 to-transparent"
        hidden={!canLeft}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-black/80 via-black/40 to-transparent"
        hidden={!canRight}
      />

      {/* Botones más visibles */}
      {canLeft && (
        <button
          aria-label="Desplazar a la izquierda"
          title="Anterior"
          onClick={() => scrollByDir(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full
                     bg-neutral-900/90 border border-neutral-600 text-white
                     hover:bg-neutral-800 hover:border-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-red-500/60
                     shadow-xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] transition"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canRight && (
        <button
          aria-label="Desplazar a la derecha"
          title="Siguiente"
          onClick={() => scrollByDir(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full
                     bg-neutral-900/90 border border-neutral-600 text-white
                     hover:bg-neutral-800 hover:border-neutral-500
                     focus:outline-none focus:ring-2 focus:ring-red-500/60
                     shadow-xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] transition"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};