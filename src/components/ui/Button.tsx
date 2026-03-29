'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'ct' | 't' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

const variants = {
  primary: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(0,230,118,0.3)]',
  ct: 'bg-sky-500/20 border-sky-400/50 text-sky-300 hover:bg-sky-500/30 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(79,195,247,0.3)]',
  t: 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(255,179,0,0.3)]',
  ghost: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20',
  danger: 'bg-red-500/20 border-red-400/50 text-red-400 hover:bg-red-500/30 hover:border-red-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, disabled, onClick }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`
        font-rajdhani font-bold uppercase tracking-wider border rounded-lg
        transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
