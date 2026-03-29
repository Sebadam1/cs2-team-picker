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
    <div className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative flex-1 px-4 py-2.5 rounded-lg font-rajdhani font-semibold text-sm
            transition-colors duration-200 cursor-pointer
            ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
              transition={{ type: 'spring', duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
