import React, { useState } from 'react';
import { AppData, Channel } from '../types';
import { Reorder } from 'motion/react';
import { GripVertical, ArrowUp, ArrowDown, Trash2, AlertCircle } from 'lucide-react';
import { saveChannel, deleteChannel } from '../utils/firestore';

interface AddChannelProps {
  data: AppData;
  userId: string;
}

export default function AddChannel({ data, userId }: AddChannelProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      uploaded: false,
      lastUpdated: new Date().getTime(),
      order: data.channels.length,
      createdAt: new Date().getTime(),
      totalUploads: 0,
      currentWeekCount: 0,
      lastWeekCount: 0,
    };

    saveChannel(userId, newChannel);

    setName('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    setChannelToDelete(id);
  };

  const confirmDelete = () => {
    if (channelToDelete) {
      deleteChannel(userId, channelToDelete);
      setChannelToDelete(null);
    }
  };

  const cancelDelete = () => {
    setChannelToDelete(null);
  };

  const handleReorder = (newChannels: Channel[]) => {
    // Optimistically update order
    newChannels.forEach((channel, index) => {
      if (channel.order !== index) {
        saveChannel(userId, { ...channel, order: index });
      }
    });
  };

  const moveChannel = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === data.channels.length - 1)
    ) return;

    const newChannels = [...data.channels];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newChannels[index];
    newChannels[index] = newChannels[targetIndex];
    newChannels[targetIndex] = temp;

    handleReorder(newChannels);
  };

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Add Channel</h1>
      
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl mb-8">
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-secondary mb-2 uppercase tracking-wider">
              Channel Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., React Channel"
              className="glass-input w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder:text-white/30"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-xs font-medium text-secondary mb-2 uppercase tracking-wider">
              Description <span className="text-small normal-case tracking-normal">(Optional)</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Daily tutorials"
              className="glass-input w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder:text-white/30"
            />
          </div>
          
          <button
            type="submit"
            disabled={!name.trim()}
            className="glass-button w-full py-3.5 rounded-xl font-medium mt-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
          >
            Create Channel
          </button>
        </div>
      </form>

      {data.channels.length > 0 && (
        <div>
          <h2 className="text-sm heading-primary text-secondary mb-4 px-2 uppercase tracking-wider">Manage Channels</h2>
          <Reorder.Group 
            axis="y" 
            values={data.channels} 
            onReorder={handleReorder}
            className="space-y-3"
          >
            {data.channels.map((channel, index) => (
              <Reorder.Item 
                key={channel.id} 
                value={channel}
                className="glass-panel p-4 rounded-2xl flex items-center justify-between group relative select-none cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 10 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-white/30 group-hover:text-white/60 transition-colors">
                    <GripVertical size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/90">{channel.name}</h3>
                    {channel.description && (
                      <p className="text-xs text-small mt-1">{channel.description}</p>
                    )}
                  </div>
                </div>
                
                <div 
                  className="flex items-center gap-2"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-1 mr-2 opacity-50 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.preventDefault(); moveChannel(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); moveChannel(index, 'down'); }}
                      disabled={index === data.channels.length - 1}
                      className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(channel.id); }}
                    className="text-red-400/70 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                    aria-label="Delete channel"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {channelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold text-white">Delete Channel</h3>
            </div>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this channel? All associated history will be lost. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
