import React, { useMemo, useState, useEffect } from 'react';
import { AppData } from '../types';
import { getTodayString } from '../utils/storage';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

interface AnalyticsProps {
  data: AppData;
}

export default function Analytics({ data }: AnalyticsProps) {
  const stats = useMemo(() => {
    let totalUploads = 0;
    let currentStreak = 0;
    
    const today = new Date();
    const records = Object.values(data.records).sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate total uploads
    records.forEach(record => {
      const uploadsOnDay = Object.values(record.uploads).filter(Boolean).length;
      totalUploads += uploadsOnDay;
    });

    // Calculate streak (days with at least one upload)
    let tempStreak = 0;
    const todayStr = getTodayString();
    
    // Create a set of dates with at least one upload
    const activeDates = new Set(
      records
        .filter(r => Object.values(r.uploads).some(Boolean))
        .map(r => r.date)
    );

    // Check backwards from today for streak
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
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
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const record = data.records[dateStr];
      const hasUpload = record ? Object.values(record.uploads).some(Boolean) : false;
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

  useEffect(() => {
    let isMounted = true;
    
    async function fetchInsight() {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const last7DaysStr = stats.last7Days.map(d => `${d.dayName}: ${d.hasUpload ? 'Uploaded' : 'Missed'}`).join(', ');
        const prompt = `Analyze this user's habit tracking data and provide ONE short, encouraging, and insightful sentence (max 15 words).
        Data:
        - Current streak: ${stats.currentStreak} days
        - Total uploads: ${stats.totalUploads}
        - Last 7 days: ${last7DaysStr}
        
        Make it sound like a premium, intelligent assistant. Do not use quotes.`;
        
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
  }, [stats.currentStreak, stats.totalUploads, stats.last7Days, stats.fallbackInsight]);

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Analytics</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div 
          whileTap={{ scale: 1.02 }}
          className="glass-panel glass-panel-interactive p-5 rounded-3xl flex flex-col justify-center relative overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Total Uploads</p>
          <p className="text-4xl heading-primary">{stats.totalUploads}</p>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 1.02 }}
          className="glass-panel glass-panel-interactive p-5 rounded-3xl flex flex-col justify-center relative overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Current Streak</p>
          <p className="text-4xl heading-primary flex items-baseline">
            {stats.currentStreak} <span className="text-sm ml-1.5 text-small font-normal normal-case tracking-normal">days</span>
          </p>
        </motion.div>
      </div>

      <div className="space-y-4">
        {/* Weekly Visual */}
        <motion.div 
          whileTap={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl relative overflow-hidden cursor-pointer"
        >
          <h3 className="text-xs font-medium text-secondary mb-4 uppercase tracking-wider">Last 7 Days</h3>
          <div className="flex justify-between items-end h-16 gap-2">
            {stats.last7Days.map((day, i) => (
              <div key={day.dateStr} className="flex flex-col items-center flex-1 gap-2">
                <div className="w-full bg-white/5 rounded-full h-10 relative overflow-hidden flex items-end">
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: day.hasUpload ? '100%' : '20%', opacity: day.hasUpload ? 1 : 0.3 }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                    className={`w-full rounded-full ${day.hasUpload ? 'bg-gradient-to-t from-green-500/80 to-green-400/80 shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'bg-white/20'}`}
                  />
                </div>
                <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">{day.dayName.charAt(0)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          whileTap={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.05)] cursor-pointer flex items-start gap-4"
        >
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <span className="text-purple-300 text-sm">✨</span>
          </div>
          <div>
            <h3 className="text-xs font-medium text-purple-300/80 mb-1 uppercase tracking-wider">Insight</h3>
            <p className="text-[13px] sm:text-[14px] text-white/90 leading-relaxed font-normal">
              {aiInsight}
            </p>
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
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-[0_0_10px_rgba(192,132,252,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
