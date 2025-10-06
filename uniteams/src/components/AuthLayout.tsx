import React from 'react';
import { Card } from './Card';
import { Logo } from './Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="xl" clickable={false} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            {subtitle && <p className="mt-2 text-neutral-400">{subtitle}</p>}
          </div>
        </div>
        <Card className="p-8">{children}</Card>
      </div>
    </div>
  );
};


