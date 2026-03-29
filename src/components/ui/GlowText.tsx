'use client';

import type { ReactNode } from 'react';

interface GlowTextProps {
  children: ReactNode;
  color?: 'ct' | 't' | 'green';
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  className?: string;
}

const glowColors = {
  ct: 'text-sky-300 [text-shadow:0_0_20px_rgba(79,195,247,0.6),0_0_40px_rgba(79,195,247,0.3)]',
  t: 'text-amber-300 [text-shadow:0_0_20px_rgba(255,179,0,0.6),0_0_40px_rgba(255,179,0,0.3)]',
  green: 'text-emerald-400 [text-shadow:0_0_20px_rgba(0,230,118,0.6),0_0_40px_rgba(0,230,118,0.3)]',
};

export default function GlowText({ children, color = 'green', as: Tag = 'h1', className = '' }: GlowTextProps) {
  return (
    <Tag className={`font-orbitron font-bold ${glowColors[color]} ${className}`}>
      {children}
    </Tag>
  );
}
