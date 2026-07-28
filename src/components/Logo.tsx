import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// The logo image is stored in the public/assets folder for direct access.
const logoSrc = '/assets/logo_clinicas.jpg';

export default function Logo({ className = '', onClick, size = 'lg' }: LogoProps) {
  const sizeClass = {
    sm: 'h-6 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
    '2xl': 'h-24 w-auto',
    '3xl': 'h-32 w-auto',
    '4xl': 'h-40 w-auto',
    '5xl': 'h-48 w-auto'
  }[size];

  return (
    <img
      src={logoSrc}
      alt="Atendimento IA Logo"
      className={`${sizeClass} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
