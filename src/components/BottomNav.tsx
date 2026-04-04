import React from 'react';
import { TabType } from '../types';
import { Home, FolderOpen, PlusCircle, BarChart2, Database } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isFocusMode?: boolean;
}

export default function BottomNav({ activeTab, setActiveTab, isFocusMode = false }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'prompt-vault', icon: FolderOpen, label: 'Vault' },
    { id: 'add', icon: PlusCircle, label: 'Add' },
    { id: 'analytics', icon: BarChart2, label: 'Stats' },
    { id: 'backup', icon: Database, label: 'Backup' },
  ] as const;

  return (
    <div className={`fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none transition-opacity duration-150 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`glass-nav max-w-sm mx-auto rounded-full px-2 py-2 flex justify-between items-center ${isFocusMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                isActive ? 'text-[#e2e8f0]' : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/5'
              }`}
            >
              <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon 
                  size={isActive ? 22 : 20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''}
                />
                {isActive && (
                  <span className="absolute -bottom-3.5 w-1 h-1 bg-[#3b82f6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
