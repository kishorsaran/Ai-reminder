import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AppData, UserSettings, Channel } from '../types';
import { getTodayString, formatDate } from '../utils/storage';
import { saveSettings } from '../utils/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Check, TrendingUp, TrendingDown, BarChart2, X, Search } from 'lucide-react';

interface AnalyticsProps {
  data: AppData;
  userId: string;
}

export default function Analytics({ data, userId }: AnalyticsProps) {


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEarnings, setEditEarnings] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [isFullOverviewOpen, setIsFullOverviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const settings = data.settings || { earnings: 0, earningGoal: 1000000 };

  const daysLeftInYear = useMemo(() => {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const diffTime = Math.abs(endOfYear.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const earningProgress = Math.min((settings.earnings / (settings.earningGoal || 1)) * 100, 100);

  const handleOpenEditModal = () => {
    setEditEarnings(settings.earnings.toString());
    setEditGoal(settings.earningGoal.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveSettings = async () => {
    const newSettings: UserSettings = {
      earnings: Number(editEarnings) || 0,
      earningGoal: Number(editGoal) || 1000000,
    };
    await saveSettings(userId, newSettings);
    setIsEditModalOpen(false);
  };

  const channelsWithVelocity = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    return data.channels.map(channel => {
      const current = channel.currentWeekCount || 0;
      const last = channel.lastWeekCount || 0;
      const base = last === 0 ? 1 : last;
      const velocity = (current / base) * 100;
      
      const createdAt = channel.createdAt || now.getTime();
      const daysOld = (now.getTime() - createdAt) / (1000 * 60 * 60 * 24);
      const isNew = daysOld < 10;

      let currentMonthUploads = 0;
      let previousMonthUploads = 0;
      let uploadsInLast3Days = 0;

      if (channel.history) {
        channel.history.forEach(dateStr => {
          const d = new Date(dateStr);
          if (d.getFullYear() === currentYear) {
            if (d.getMonth() === currentMonth) {
              currentMonthUploads++;
            } else if (d.getMonth() === currentMonth - 1 || (currentMonth === 0 && d.getMonth() === 11 && d.getFullYear() === currentYear - 1)) {
              previousMonthUploads++;
            }
          }
          if (d >= threeDaysAgo) {
            uploadsInLast3Days++;
          }
        });
      }

      const isConsistent = uploadsInLast3Days > 0;

      return { ...channel, velocity, isNew, current, last, currentMonthUploads, previousMonthUploads, isConsistent };
    }).sort((a, b) => b.velocity - a.velocity);
  }, [data.channels]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channelsWithVelocity;
    return channelsWithVelocity.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [channelsWithVelocity, searchQuery]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let currentMonthUploads = 0;
    let previousMonthUploads = 0;

    data.channels.forEach(channel => {
      if (channel.history) {
        channel.history.forEach(dateStr => {
          const d = new Date(dateStr);
          if (d.getFullYear() === currentYear) {
            if (d.getMonth() === currentMonth) {
              currentMonthUploads++;
            } else if (d.getMonth() === currentMonth - 1 || (currentMonth === 0 && d.getMonth() === 11 && d.getFullYear() === currentYear - 1)) {
              previousMonthUploads++;
            }
          }
        });
      }
    });

    return { currentMonthUploads, previousMonthUploads };
  }, [data.channels]);

// Add this helper component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = {
      current: 0
    };
    
    // Simple animation
    const duration = 1000;
    const start = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{displayValue.toLocaleString()}</>;
}



  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Velocity</h1>
      
      {/* Hero Card */}
      <motion.div 
        className="glass-panel p-5 rounded-3xl mb-6 relative overflow-hidden"
      >
        {/* Radial Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Shimmer Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Left: Time Remaining */}
          <div className="flex flex-col justify-center border-r border-white/10 pr-4">
            <h3 className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Days Left in {new Date().getFullYear()}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl heading-primary text-gradient"><AnimatedNumber value={daysLeftInYear} /></span>
              <span className="text-sm text-secondary">days</span>
            </div>
            <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500/50 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Right: Earning Goal */}
          <div className="flex flex-col justify-center pl-2 cursor-pointer group" onClick={handleOpenEditModal}>
            <h3 className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider group-hover:text-blue-400 transition-colors">Earning Goal</h3>
            <div className="flex flex-col mb-2">
              <span className="text-2xl heading-primary text-gradient">₹<AnimatedNumber value={settings.earnings} /></span>
              <span className="text-xs text-secondary">/ ₹{settings.earningGoal.toLocaleString()}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${earningProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] ${earningProgress > 0 ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}
              >
                {/* Shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-xl heading-primary text-white mb-2">Leaderboard (Top 3)</h2>
        {channelsWithVelocity.slice(0, 3).map((channel, index) => {
          let glowClass = "border border-white/5";
          if (index === 0) glowClass = "border border-[#FFD700]/50 shadow-[0_0_15px_rgba(255,215,0,0.3)]";
          else if (index === 1) glowClass = "border border-[#C0C0C0]/50 shadow-[0_0_15px_rgba(192,192,192,0.2)]";
          else if (index === 2) glowClass = "border border-[#CD7F32]/50 shadow-[0_0_15px_rgba(205,127,50,0.2)]";

          const isGrowing = channel.velocity >= 50;
          const velocityColor = isGrowing ? "text-emerald-400" : "text-red-500";
          const VelocityIcon = isGrowing ? TrendingUp : TrendingDown;

          return (
            <motion.div 
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-panel p-4 rounded-2xl relative overflow-hidden ${glowClass}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-white">{channel.name}</h3>
                    {channel.isNew && (
                      <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase animate-pulse">
                        New
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${velocityColor}`}>
                    <VelocityIcon size={16} />
                    <span>{channel.velocity.toFixed(0)}% Velocity</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-secondary mb-1 uppercase tracking-wider">This Week</div>
                  <div className="text-xl font-bold text-white">{channel.current} <span className="text-sm font-normal text-secondary">/ {channel.last}</span></div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {channelsWithVelocity.length > 3 && (
          <button 
            onClick={() => setIsFullOverviewOpen(true)}
            className="w-full mt-4 py-3 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 text-white text-sm font-medium transition-colors"
          >
            See More
          </button>
        )}

        {/* Monthly Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-5 rounded-3xl relative overflow-hidden mt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={20} className="text-blue-400" />
            <h3 className="text-sm font-medium text-white uppercase tracking-wider">Monthly Uploads</h3>
          </div>
          <div className="flex items-end gap-6 h-32 pt-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-white/5 rounded-t-xl relative flex-1 flex items-end justify-center pb-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((monthlyStats.previousMonthUploads / Math.max(monthlyStats.currentMonthUploads, monthlyStats.previousMonthUploads, 1)) * 100, 100)}%` }}
                  className="absolute bottom-0 w-full bg-white/20 rounded-t-xl"
                />
                <span className="relative z-10 text-lg font-bold text-white/80">{monthlyStats.previousMonthUploads}</span>
              </div>
              <span className="text-xs text-secondary uppercase">Last Month</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-blue-500/10 rounded-t-xl relative flex-1 flex items-end justify-center pb-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((monthlyStats.currentMonthUploads / Math.max(monthlyStats.currentMonthUploads, monthlyStats.previousMonthUploads, 1)) * 100, 100)}%` }}
                  className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xl"
                />
                <span className="relative z-10 text-lg font-bold text-white">{monthlyStats.currentMonthUploads}</span>
              </div>
              <span className="text-xs text-blue-400 uppercase font-medium">This Month</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 rounded-3xl w-full max-w-sm"
            >
              <h2 className="text-xl heading-primary mb-4">Edit Goals</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Current Earnings (₹)</label>
                  <input
                    type="number"
                    value={editEarnings}
                    onChange={(e) => setEditEarnings(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                    placeholder="e.g. 50000"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Target Goal (₹)</label>
                  <input
                    type="number"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                    placeholder="e.g. 1000000"
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-secondary hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-[#2563eb] transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Overview Modal */}
      <AnimatePresence>
        {isFullOverviewOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#0f172a] overflow-y-auto select-none"
            style={{ WebkitUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
          >
            <div className="sticky top-0 z-10 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Global Channel Performance</h2>
              <button onClick={() => setIsFullOverviewOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                <input 
                  type="text" 
                  placeholder="Search channels..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="p-4 space-y-4 pb-24">
              {filteredChannels.map(channel => (
                <div key={channel.id} className="glass-panel p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{channel.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {channel.isConsistent ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Consistent</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase">Need Action</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold flex items-center justify-end gap-1 ${channel.velocity >= 50 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {channel.velocity >= 50 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {channel.velocity.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <div className="text-xs text-secondary">
                      <span className="text-white font-medium">{channel.currentMonthUploads}</span> this month
                    </div>
                    <div className="text-xs text-secondary">
                      <span className="text-white font-medium">{channel.previousMonthUploads}</span> last month
                    </div>
                  </div>
                </div>
              ))}
              {filteredChannels.length === 0 && (
                <div className="text-center py-10 text-secondary">
                  No channels found matching "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
