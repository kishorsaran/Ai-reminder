import React, { useState, useMemo, useRef } from 'react';
import { AppData, Channel, Prompt } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, ArrowLeft, Edit2, Trash2, Copy, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { savePrompt } from '../utils/firestore';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Markdown from 'react-markdown';

interface LongPressPromptProps {
  prompt: Prompt;
  expandedPromptId: string | null;
  handleExpand: (id: string) => void;
  handleCopy: (prompt: Prompt, e: React.MouseEvent | React.PointerEvent) => void;
  copiedPromptId: string | null;
  getCategoryColor: (category: string) => string;
  renderContentWithVariables: (content: string) => React.ReactNode;
  onLongPress: (prompt: Prompt) => void;
}

const LongPressPrompt = ({
  prompt,
  expandedPromptId,
  handleExpand,
  handleCopy,
  copiedPromptId,
  getCategoryColor,
  renderContentWithVariables,
  onLongPress
}: LongPressPromptProps) => {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress(prompt);
      setIsHolding(false);
    }, 600);
  };

  const handlePointerUp = () => {
    setIsHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLongPressRef.current) {
      handleExpand(prompt.id);
    }
  };

  return (
    <motion.div
      id={`prompt-${prompt.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, scale: isHolding ? 0.96 : 1 }}
      exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-2xl overflow-hidden bg-transparent select-none"
      style={{ WebkitUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
    >
      <div 
        className="relative z-10 bg-zinc-900/95 backdrop-blur-xl p-4 cursor-pointer flex items-center justify-between border-b border-white/5 transition-colors hover:bg-white/5"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex-1 pr-4 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${getCategoryColor(prompt.category)}`}>
              {prompt.category}
            </span>
          </div>
          <h3 className="text-base font-medium text-white">{prompt.title}</h3>
        </div>
        <div className="p-1 text-secondary pointer-events-none">
          {expandedPromptId === prompt.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {expandedPromptId === prompt.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-black/20"
          >
            <div className="p-4">
              <div className="prose prose-invert prose-sm max-w-none mb-4 text-zinc-300 whitespace-pre-wrap">
                <Markdown components={{
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0">{renderContentWithVariables(props.children as string)}</p>
                }}>
                  {prompt.content}
                </Markdown>
              </div>
              <button
                onClick={(e) => handleCopy(prompt, e)}
                className="w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/20"
              >
                {copiedPromptId === prompt.id ? (
                  <><CheckCircle2 size={16} className="text-green-400" /> Copied!</>
                ) : (
                  <><Copy size={16} /> Copy Prompt</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface PromptVaultProps {
  data: AppData;
  userId: string;
}

export default function PromptVault({ data, userId }: PromptVaultProps) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMenuPrompt, setActiveMenuPrompt] = useState<Prompt | null>(null);

  const [formData, setFormData] = useState({ title: '', category: '', content: '' });

  const activeChannel = useMemo(() => 
    data.channels.find(c => c.id === activeChannelId), 
  [data.channels, activeChannelId]);

  const filteredPrompts = useMemo(() => {
    if (!activeChannelId) return [];
    let prompts = data.prompts.filter(p => p.channelId === activeChannelId);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      prompts = prompts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    }
    
    // Sort by lastUsed (descending) or createdAt
    return prompts.sort((a, b) => b.lastUsed - a.lastUsed || b.createdAt - a.createdAt);
  }, [data.prompts, activeChannelId, searchQuery]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = async (prompt: Prompt, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedPromptId(prompt.id);
      showToast('Prompt Copied!');
      
      // Update lastUsed
      await savePrompt(userId, { ...prompt, lastUsed: Date.now() });
      
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy');
    }
  };

  const handleDelete = async (promptId: string, e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    alert("Delete Clicked for ID: " + promptId);
    
    if (window.confirm('Do you want to delete this?')) {
      try {
        console.log("Attempting to delete ID:", promptId);
        // Using the correct multi-tenant path for this app's architecture
        await deleteDoc(doc(db, "users", userId, "prompts", promptId));
        console.log("Document deleted successfully");
        showToast('Success');
        setActiveMenuPrompt(null); // Close only AFTER successful delete
        return true;
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
    return false;
  };

  const handleEdit = (prompt: Prompt, e?: React.MouseEvent | React.PointerEvent) => {
    if (e) e.stopPropagation();
    setEditingPrompt(prompt);
    setFormData({ title: prompt.title, category: prompt.category, content: prompt.content });
    setIsAddModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;

    const prompt: Prompt = editingPrompt ? {
      ...editingPrompt,
      ...formData,
    } : {
      id: Date.now().toString(),
      channelId: activeChannelId!,
      title: formData.title,
      category: formData.category || 'General',
      content: formData.content,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    await savePrompt(userId, prompt);
    setIsAddModalOpen(false);
    setEditingPrompt(null);
    setFormData({ title: '', category: '', content: '' });
    showToast(editingPrompt ? 'Prompt updated' : 'Prompt created');
  };

  const handleExpand = (promptId: string) => {
    if (expandedPromptId === promptId) {
      setExpandedPromptId(null);
    } else {
      setExpandedPromptId(promptId);
    }
  };

  const renderContentWithVariables = (content: string) => {
    // Replace [VARIABLE] with a highlighted span
    const parts = content.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return <span key={i} className="bg-blue-500/20 text-blue-400 px-1 rounded font-mono text-sm">{part}</span>;
      }
      return part;
    });
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat === 'image') return 'bg-blue-600 text-white';
    if (cat === 'video') return 'bg-yellow-400 text-black';
    if (cat === 'audio') return 'bg-red-600 text-white';
    return 'bg-cyan-600 text-white';
  };

  return (
    <div className="p-6 pb-28 max-w-[600px] mx-auto min-h-screen">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-800 text-white px-4 py-2 rounded-full shadow-lg border border-zinc-700 flex items-center gap-2 text-sm pointer-events-none"
          >
            <CheckCircle2 size={16} className="text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!activeChannelId ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h1 className="text-3xl heading-primary text-gradient mb-8">Prompt Vault</h1>
            <p className="text-secondary mb-6">Select a channel to view or manage prompts.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.channels.map(channel => (
                <motion.div
                  key={channel.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveChannelId(channel.id)}
                  className="glass-panel p-5 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-lg font-medium text-white mb-1">{channel.name}</h3>
                  <p className="text-sm text-secondary line-clamp-2">{channel.description || 'No description'}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-secondary">
                    <span>{data.prompts.filter(p => p.channelId === channel.id).length} Prompts</span>
                  </div>
                </motion.div>
              ))}
              {data.channels.length === 0 && (
                <div className="col-span-full text-center py-10 text-secondary">
                  No channels found. Add a channel in the Home tab first.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setActiveChannelId(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-secondary hover:text-white"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl heading-primary text-white">{activeChannel?.name}</h1>
                <p className="text-xs text-secondary">Prompt Directory</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredPrompts.map(prompt => (
                  <LongPressPrompt
                    key={prompt.id}
                    prompt={prompt}
                    expandedPromptId={expandedPromptId}
                    handleExpand={handleExpand}
                    handleCopy={handleCopy}
                    copiedPromptId={copiedPromptId}
                    getCategoryColor={getCategoryColor}
                    renderContentWithVariables={renderContentWithVariables}
                    onLongPress={(p) => setActiveMenuPrompt(p)}
                  />
                ))}
              </AnimatePresence>
              {filteredPrompts.length === 0 && (
                <div className="text-center py-10 text-secondary">
                  {searchQuery ? (
                    <div className="flex flex-col items-center gap-4">
                      <p>No prompts found.</p>
                      <button 
                        onClick={() => {
                          setEditingPrompt(null);
                          setFormData({ title: '', category: '', content: '' });
                          setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                      >
                        Add New
                      </button>
                    </div>
                  ) : (
                    'No prompts yet. Create one!'
                  )}
                </div>
              )}
            </div>

            {/* FAB */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingPrompt(null);
                setFormData({ title: '', category: '', content: '' });
                setIsAddModalOpen(true);
              }}
              className="fixed bottom-24 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:bg-blue-600 transition-colors z-40"
            >
              <Plus size={24} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl heading-primary mb-6">{editingPrompt ? 'Edit Prompt' : 'New Prompt'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                    placeholder="e.g. Hook Generator"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                    placeholder="e.g. Scripting, SEO, Ideas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Content</label>
                  <p className="text-[10px] text-secondary mb-2">Use [VARIABLE] for placeholders and Markdown for formatting.</p>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm min-h-[150px] resize-y"
                    placeholder="Write a script about [TOPIC]..."
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-secondary hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.title || !formData.content}
                    className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Prompt
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom Menu for Long Press */}
      <AnimatePresence>
        {activeMenuPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm select-none"
            style={{ WebkitUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
            onClick={() => setActiveMenuPrompt(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="w-full max-w-md bg-zinc-900 border-t border-white/10 rounded-t-3xl p-6 pb-12 shadow-2xl relative z-[70]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-medium text-white mb-4 px-2 truncate">{activeMenuPrompt.title}</h3>
              <div className="space-y-2 relative z-[80]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(activeMenuPrompt, e);
                    setActiveMenuPrompt(null);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-blue-400 relative z-[9999]"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Edit2 size={20} />
                  <span className="font-medium">Edit Prompt</span>
                </button>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleDelete(activeMenuPrompt.id, e);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-red-400 relative z-[9999]"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Trash2 size={20} />
                  <span className="font-medium">Delete Prompt</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
