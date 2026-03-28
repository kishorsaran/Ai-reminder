import React, { useState } from 'react';
import { AppData } from '../types';
import { Download, Upload, AlertCircle } from 'lucide-react';
import PinnedNotesCanvas from './PinnedNotesCanvas';

interface BackupProps {
  data: AppData;
  userId: string;
  onFocusModeChange?: (isFocused: boolean) => void;
}

export default function Backup({ data, userId, onFocusModeChange }: BackupProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [pendingImportData, setPendingImportData] = useState<AppData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
        if (!parsedData.channels) {
          throw new Error('Invalid backup file format');
        }
        
        setPendingImportData(parsedData);
        setShowConfirmModal(true);
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Failed to parse backup file.' });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const confirmImport = () => {
    if (pendingImportData) {
      importData(pendingImportData);
      setImportStatus({ type: 'success', message: 'Data restored successfully!' });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
    }
    setShowConfirmModal(false);
    setPendingImportData(null);
  };

  const cancelImport = () => {
    setShowConfirmModal(false);
    setPendingImportData(null);
  };

  const importData = async (parsedData: AppData) => {
    const { saveChannel, saveBoard, saveNote } = await import('../utils/firestore');
    if (parsedData.channels) {
      parsedData.channels.forEach(channel => saveChannel(userId, channel));
    }
    if (parsedData.boards) {
      parsedData.boards.forEach(board => saveBoard(userId, board));
    }
    if (parsedData.notes) {
      parsedData.notes.forEach(note => saveNote(userId, note));
    }
  };

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <PinnedNotesCanvas data={data} userId={userId} onFocusModeChange={onFocusModeChange} />

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
                ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'
            }`}>
              <AlertCircle size={16} className="mr-2.5 flex-shrink-0" />
              {importStatus.message}
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#020617] border border-[#3b82f6]/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold text-primary">Confirm Import</h3>
            </div>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Are you sure you want to import this data? Existing data with the same IDs will be overwritten. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelImport}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-primary font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
