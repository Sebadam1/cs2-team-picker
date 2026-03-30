'use client';

import { motion } from 'motion/react';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex bg-[#0a0c10] border border-white/[0.04] rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative flex-1 px-4 py-2.5 font-orbitron font-medium text-[10px] uppercase tracking-widest
            transition-colors duration-200 cursor-pointer
            ${activeTab === tab.id ? 'text-[#8b9bb4]' : 'text-gray-600 hover:text-gray-400'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#8b9bb4] rounded-full"
              transition={{ type: 'spring', duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            {tab.icon && <span className="text-[11px]">{tab.icon}</span>}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
