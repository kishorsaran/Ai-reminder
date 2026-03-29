import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AppData, UserSettings } from '../types';
import { getTodayString, formatDate } from '../utils/storage';
import { saveSettings } from '../utils/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { Check } from 'lucide-react';

interface AnalyticsProps {
  data: AppData;
  userId: string;
}

export default function Analytics({ data, userId }: AnalyticsProps) {
  const stats = useMemo(() => {
    let totalUploads = 0;
    let currentStreak = 0;
    
    const todayStr = getTodayString();
    
    // Create a set of dates with at least one upload
    const activeDates = new Set<string>();
    
    data.channels.forEach(channel => {
      if (channel.history) {
        totalUploads += channel.history.length;
        channel.history.forEach(date => activeDates.add(date));
      }
    });

    // Check backwards from today for streak
    let tempStreak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = formatDate(checkDate); // YYYY-MM-DD
      if (activeDates.has(dateStr)) {
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === todayStr) {
        // If today has no uploads, check yesterday to keep streak alive
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = tempStreak;

    // Last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = formatDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const hasUpload = activeDates.has(dateStr);
      return { dateStr, dayName, hasUpload, date: d };
    });

    let fallbackInsight = "Keep up the good work!";
    const uploadedDays = last7Days.filter(d => d.hasUpload);
    const missedDays = last7Days.filter(d => !d.hasUpload);

    if (currentStreak >= 7) {
      fallbackInsight = "Incredible! You're on a 7+ day streak. Keep the momentum going.";
    } else if (currentStreak >= 3) {
      fallbackInsight = "Your streak is building up steadily. You're doing great!";
    } else if (uploadedDays.length === 0) {
      fallbackInsight = "Ready to start your journey? Upload today to begin your streak.";
    } else if (uploadedDays.length === 7) {
      fallbackInsight = "Perfect week! You haven't missed a single day.";
    } else if (missedDays.length > 0 && uploadedDays.length > 0) {
      const weekendUploads = uploadedDays.filter(d => d.date.getDay() === 0 || d.date.getDay() === 6).length;
      const weekdayUploads = uploadedDays.length - weekendUploads;
      
      if (weekendUploads === 2 && weekdayUploads < 3) {
        fallbackInsight = "You are most consistent on weekends. Try adding a mid-week upload!";
      } else if (weekdayUploads >= 4 && weekendUploads === 0) {
        fallbackInsight = "Great weekday consistency! Don't forget to upload on weekends.";
      } else if (missedDays.length === 1) {
        fallbackInsight = `You only missed ${missedDays[0].dayName} this week. Almost perfect!`;
      } else {
        fallbackInsight = "You're staying active. Consistency is key to building your habit.";
      }
    }

    let nextGoal = 3;
    if (currentStreak < 3) nextGoal = 3;
    else if (currentStreak < 7) nextGoal = 7;
    else nextGoal = Math.ceil((currentStreak + 1) / 5) * 5;
    
    const daysToGoal = nextGoal - currentStreak;
    const goalProgress = (currentStreak / nextGoal) * 100;

    return {
      totalUploads,
      currentStreak,
      last7Days,
      fallbackInsight,
      nextGoal,
      daysToGoal,
      goalProgress
    };
  }, [data]);

  const [aiInsight, setAiInsight] = useState("Analyzing your progress...");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEarnings, setEditEarnings] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const settings = data.settings || { earnings: 0, earningGoal: 1000000 };

  const daysLeftInYear = useMemo(() => {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const diffTime = Math.abs(endOfYear.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const earningProgress = Math.min((settings.earnings / (settings.earningGoal || 1)) * 100, 100);

  const handlePressStart = () => {
    setIsPressing(true);
    pressTimerRef.current = setTimeout(() => {
      setEditEarnings(settings.earnings.toString());
      setEditGoal(settings.earningGoal.toString());
      setIsEditModalOpen(true);
      setIsPressing(false);
    }, 5000);
  };

  const handlePressEnd = () => {
    setIsPressing(false);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleSaveSettings = async () => {
    const newSettings: UserSettings = {
      earnings: Number(editEarnings) || 0,
      earningGoal: Number(editGoal) || 1000000,
    };
    await saveSettings(userId, newSettings);
    setIsEditModalOpen(false);
  };

  const months = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    return Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(now.getFullYear(), i, 1);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        isPast: i < currentMonth,
        isCurrent: i === currentMonth,
        isFuture: i > currentMonth,
      };
    });
  }, []);

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

  useEffect(() => {
    let isMounted = true;
    
    async function fetchInsight() {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Analyze this user's life and goal tracking data and provide ONE short, encouraging, and insightful sentence (max 15 words).
        Data:
        - Current streak: ${stats.currentStreak} days
        - Earnings: ₹${settings.earnings} / ₹${settings.earningGoal}
        - Days left in year: ${daysLeftInYear}
        
        Make it sound like a premium, intelligent assistant. Focus on time, money, or consistency. Do not use quotes.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: prompt,
        });
        
        if (isMounted && response.text) {
          setAiInsight(response.text.trim().replace(/^["']|["']$/g, ''));
        }
      } catch (error) {
        console.error("Failed to fetch AI insight:", error);
        if (isMounted) {
          setAiInsight(stats.fallbackInsight);
        }
      }
    }
    
    fetchInsight();
    
    return () => {
      isMounted = false;
    };
  }, [stats.currentStreak, settings.earnings, settings.earningGoal, daysLeftInYear, stats.fallbackInsight]);

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Analytics</h1>
      
      {/* Hero Card */}
      <motion.div 
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        onPointerCancel={handlePressEnd}
        whileTap={{ scale: 0.97 }}
        className="glass-panel p-5 rounded-3xl mb-6 relative overflow-hidden cursor-pointer"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Radial Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Shimmer Effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Hold Progress Indicator */}
        <AnimatePresence>
          {isPressing && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute top-0 left-0 h-1 bg-blue-500/50"
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Left: Time Remaining */}
          <div className="flex flex-col justify-center border-r border-white/10 pr-4">
            <h3 className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Days Left</h3>
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
          <div className="flex flex-col justify-center pl-2">
            <h3 className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Earning Goal</h3>
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
        {/* Month Progress System */}
        <motion.div 
          className="glass-panel p-5 rounded-3xl relative overflow-hidden"
        >
          <h3 className="text-xs font-medium text-secondary mb-4 uppercase tracking-wider">Yearly Progress</h3>
          <div className="overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            <div className="flex gap-4 min-w-max">
              {months.map((month, i) => (
                <motion.div 
                  key={month.name} 
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                    month.isPast ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] shadow-[0_0_10px_rgba(59,130,246,0.3)]' :
                    month.isCurrent ? 'bg-white/10 border border-[#3b82f6]/50' :
                    'bg-white/5'
                  }`}>
                    {month.isPast && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check size={16} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                    {month.isCurrent && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-[#3b82f6]"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    {month.isFuture && <div className="w-2 h-2 rounded-full bg-white/20" />}
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    month.isCurrent ? 'text-[#3b82f6]' : 'text-secondary'
                  }`}>{month.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          whileTap={{ scale: 0.97 }}
          className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.05)] cursor-pointer flex items-start gap-4"
        >
          <motion.div 
            className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center shrink-0"
            animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0.2)', '0 0 10px rgba(59,130,246,0.4)', '0 0 0px rgba(59,130,246,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[#3b82f6] text-sm">✨</span>
          </motion.div>
          <div>
            <h3 className="text-xs font-medium text-[#3b82f6]/80 mb-1 uppercase tracking-wider">Insight</h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-[13px] sm:text-[14px] text-[#e2e8f0] leading-relaxed font-normal"
            >
              {aiInsight}
            </motion.p>
          </div>
        </motion.div>

        {/* Next Goal */}
        <motion.div 
          whileTap={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl relative overflow-hidden cursor-pointer"
        >
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Next Goal</h3>
              <p className="text-sm text-white/90 font-medium">{stats.nextGoal} Day Streak</p>
            </div>
            <p className="text-xs text-secondary">{stats.daysToGoal} more {stats.daysToGoal === 1 ? 'day' : 'days'}</p>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.goalProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
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
    </div>
  );
}
