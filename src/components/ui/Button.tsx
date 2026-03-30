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
  primary: 'bg-gradient-to-b from-[#3a7a3a] to-[#2d5e2d] border-[#4a8a4a]/40 text-[#a8d8a8] hover:from-[#438a43] hover:to-[#356e35] hover:border-[#5a9a5a]/50 hover:shadow-[0_0_12px_rgba(58,122,58,0.2)]',
  ct: 'bg-[#3d5a80]/20 border-[#6b8fc2]/30 text-[#8bafd4] hover:bg-[#3d5a80]/30 hover:border-[#6b8fc2]/50',
  t: 'bg-[#8b6914]/20 border-[#c49a6c]/30 text-[#d4a86a] hover:bg-[#8b6914]/30 hover:border-[#c49a6c]/50',
  ghost: 'bg-transparent border-white/[0.06] text-gray-400 hover:bg-white/[0.04] hover:border-white/[0.1] hover:text-gray-300',
  danger: 'bg-[#5a2020]/30 border-[#8b3030]/40 text-[#d46a6a] hover:bg-[#5a2020]/40 hover:border-[#8b3030]/60',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, disabled, onClick }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        font-rajdhani font-bold uppercase tracking-wider border rounded-md
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
