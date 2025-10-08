import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  clickable = true 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const logoContent = (
    <span className={`font-bold text-white ${sizeClasses[size]} ${className}`}>
      Uni<span className="red-accent">teams</span>
    </span>
  );

  if (clickable) {
    return (
      <Link
        to="/"
        className="hover:text-neutral-200 transition-colors duration-200 inline-block"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};
