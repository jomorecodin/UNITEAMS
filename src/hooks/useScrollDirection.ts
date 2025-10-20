import { useState, useEffect } from 'react';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Siempre mostrar el navbar en la parte superior
        setScrollDirection('up');
      } else if (currentScrollY > prevScrollY && currentScrollY > 100) {
        // Scrolling hacia abajo y ya pasamos 100px
        setScrollDirection('down');
      } else if (currentScrollY < prevScrollY) {
        // Scrolling hacia arriba
        setScrollDirection('up');
      }
      
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  return scrollDirection;
};
