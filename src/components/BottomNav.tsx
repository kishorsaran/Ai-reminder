import React from 'react';
import { TabType } from '../types';
import { Home, Calendar, PlusCircle, BarChart2, Database } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'add', icon: PlusCircle, label: 'Add' },
    { id: 'analytics', icon: BarChart2, label: 'Stats' },
    { id: 'backup', icon: Database, label: 'Backup' },
  ] as const;

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
      <div className="glass-nav max-w-sm mx-auto rounded-full px-2 py-2 flex justify-between items-center pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <Icon 
                  size={isActive ? 22 : 20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]' : ''}
                />
                {isActive && (
                  <span className="absolute -bottom-3.5 w-1 h-1 bg-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
