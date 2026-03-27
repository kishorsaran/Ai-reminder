import React, { useState } from 'react';
import { AppData } from '../types';
import { Download, Upload, AlertCircle, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface BackupProps {
  data: AppData;
  updateData: (newData: AppData) => void;
}

export default function Backup({ data, updateData }: BackupProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content) as AppData;
        
        // Basic validation
        if (!parsedData.channels || !parsedData.records) {
          throw new Error('Invalid backup file format');
        }
        
        updateData(parsedData);
        setImportStatus({ type: 'success', message: 'Data restored successfully!' });
        
        setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Failed to parse backup file.' });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Backup</h1>
      
      <div className="space-y-5">
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-start mb-6">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl mr-4 shadow-inner">
              <Download size={22} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-base heading-primary">Export Data</h3>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">Save your channels and history to a JSON file.</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="glass-button w-full py-3.5 rounded-xl text-sm font-medium tracking-wide"
          >
            Download Backup
          </button>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-start mb-6">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl mr-4 shadow-inner">
              <Upload size={22} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-base heading-primary">Import Data</h3>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">Restore from a previously saved JSON backup.</p>
            </div>
          </div>
          
          <label className="glass-button w-full py-3.5 rounded-xl text-sm font-medium tracking-wide flex items-center justify-center cursor-pointer">
            Select File
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          {importStatus.type && (
            <div className={`mt-5 p-3.5 rounded-xl flex items-center text-xs font-medium border ${
              importStatus.type === 'success' 
                ? 'bg-green-500/10 text-green-300 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]' 
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}>
              <AlertCircle size={16} className="mr-2.5 flex-shrink-0" />
              {importStatus.message}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 mt-8">
          <button
            onClick={handleLogout}
            className="glass-button w-full py-3.5 rounded-xl text-sm font-medium tracking-wide flex items-center justify-center text-red-400/90 hover:text-red-400 hover:bg-red-500/10 border-white/5"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
