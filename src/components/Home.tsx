import React, { useState, useEffect, useRef } from 'react';
import { AppData, Channel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { saveChannel } from '../utils/firestore';
import { getTodayString } from '../utils/storage';

interface HomeProps {
  data: AppData;
  userId: string;
  updateData: (newData: AppData) => void;
}

function ChannelCard({ channel, isUploaded, toggleUpload, index }: { channel: Channel, isUploaded: boolean, toggleUpload: (channel: Channel) => void, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = useState(false);
  const [activeGlow, setActiveGlow] = useState(false);
  const prevIsUploaded = useRef(isUploaded);

  useEffect(() => {
    if (isUploaded && !prevIsUploaded.current) {
      setActiveGlow(true);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
      glowTimerRef.current = setTimeout(() => {
        setActiveGlow(false);
      }, 2000);
    } else if (!isUploaded) {
      setActiveGlow(false);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    }
    prevIsUploaded.current = isUploaded;
  }, [isUploaded]);

  const startPress = () => {
    setWasLongPress(false);
    timerRef.current = setTimeout(() => {
      setIsExpanded(true);
      setWasLongPress(true);
    }, 600);
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExpanded(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (wasLongPress) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggleUpload(channel);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerup', handleClickOutside);
    return () => document.removeEventListener('pointerup', handleClickOutside);
  }, [isExpanded]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1],
        opacity: { delay: index * 0.06, duration: 0.3 },
        y: { delay: index * 0.06, duration: 0.4 }
      }}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); }}
      onClick={handleClick}
      className={`glass-panel glass-panel-interactive p-4 sm:p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer ${
        activeGlow ? 'active-glow' : ''
      }`}
    >
      {/* Left accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${
        isUploaded ? 'bg-[#22c55e]' : 'bg-[#ef4444]/60'
      }`} />
      
      <div className="pl-3 flex-1">
        <motion.h3 layout="position" className="text-lg font-medium tracking-[0.2px] text-[#e2e8f0]">{channel.name}</motion.h3>
        
        <AnimatePresence>
          {isExpanded && channel.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="text-[12px] sm:text-[13px] font-normal text-[#94a3b8] leading-[1.4] mt-1 mb-1">
                {channel.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p layout="position" className={`text-[11px] mt-1 transition-colors duration-300 ${
          isUploaded ? 'text-[#22c55e]' : 'text-[#ef4444]/60'
        }`}>
          {isUploaded ? 'Uploaded' : 'Not Uploaded'}
        </motion.p>
      </div>
      
      <motion.button
        onClick={(e) => { e.stopPropagation(); toggleUpload(channel); }}
        whileTap={{ scale: 0.96 }}
        className={`relative inline-flex h-7 w-12 items-center rounded-full focus:outline-none ml-4 shrink-0 border border-white/10`}
        style={{ 
          background: isUploaded 
            ? 'linear-gradient(135deg, #22c55e, #3b82f6)' 
            : 'rgba(255,255,255,0.1)',
          boxShadow: activeGlow && isUploaded
            ? '0 0 15px rgba(34,197,94,0.4), inset 0 1px 2px rgba(0,0,0,0.2)' 
            : 'inset 0 1px 2px rgba(0,0,0,0.2)',
          transition: 'background 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <motion.span
          initial={false}
          animate={{
            x: isUploaded ? 22 : 2,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1
          }}
          className="inline-block h-6 w-6 rounded-full bg-white"
          style={{
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        />
      </motion.button>
    </motion.div>
  );
}

export default function Home({ data, userId, updateData }: HomeProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [secondsLeft, setSecondsLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${hours}h ${minutes}m`);
      setSecondsLeft(`${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000); // Update every second
    return () => clearInterval(timer);
  }, []);

  const toggleUpload = async (channel: Channel) => {
    const now = new Date();
    const todayStr = getTodayString();
    
    const isNowUploaded = !channel.uploaded;
    let newHistory = channel.history || [];
    
    if (isNowUploaded) {
      if (!newHistory.includes(todayStr)) {
        newHistory = [...newHistory, todayStr];
      }
    } else {
      newHistory = newHistory.filter(date => date !== todayStr);
    }

    const updatedChannel = {
      ...channel,
      uploaded: isNowUploaded,
      lastUpdated: now.getTime(),
      history: newHistory,
    };

    // Optimistic UI update
    const previousData = { ...data };
    updateData({
      ...data,
      channels: data.channels.map(c => c.id === channel.id ? updatedChannel : c)
    });

    try {
      await saveChannel(userId, updatedChannel);
    } catch (error) {
      console.error("Failed to update channel:", error);
      // Revert UI on failure
      updateData(previousData);
    }
  };

  const currentDate = new Date();
  const dayNumber = currentDate.getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <div className="mb-10 flex flex-col items-start">
        <div className="flex items-baseline space-x-2 mb-1">
          <h1 className="text-6xl heading-primary text-gradient leading-none">{dayNumber}</h1>
          <div className="flex flex-col">
            <span className="text-lg font-medium tracking-wider text-primary">{monthName}</span>
            <span className="text-sm text-secondary">{dayName}</span>
          </div>
        </div>
        
        <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] text-xs font-medium text-[#94a3b8] shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mr-2 animate-pulse-slow"></span>
          Resets in {timeLeft} <span className="w-4 inline-block text-right ml-0.5 opacity-70">{secondsLeft}</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.channels.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <p className="text-secondary mb-2">No channels added yet.</p>
            <p className="text-xs text-small">Go to the Add tab to create one.</p>
          </div>
        ) : (
          data.channels.map((channel, index) => {
            return (
              <ChannelCard 
                key={channel.id} 
                channel={channel} 
                isUploaded={channel.uploaded} 
                toggleUpload={toggleUpload}
                index={index}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
