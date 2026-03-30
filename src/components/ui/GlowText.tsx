'use client';

import type { ReactNode } from 'react';

interface GlowTextProps {
  children: ReactNode;
  color?: 'ct' | 't' | 'green';
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  className?: string;
}

const glowColors = {
  ct: 'text-[#8bafd4] [text-shadow:0_0_8px_rgba(107,143,194,0.3)]',
  t: 'text-[#d4a86a] [text-shadow:0_0_8px_rgba(196,154,108,0.3)]',
  green: 'text-[#8b9bb4] [text-shadow:0_0_8px_rgba(139,155,180,0.25)]',
};

export default function GlowText({ children, color = 'green', as: Tag = 'h1', className = '' }: GlowTextProps) {
  return (
    <Tag className={`font-orbitron font-bold ${glowColors[color]} ${className}`}>
      {children}
    </Tag>
  );
}
