import React, { useState, useEffect, useRef } from 'react';
import { AppData, Channel } from '../types';
import { getTodayString } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';

interface HomeProps {
  data: AppData;
  updateData: (newData: AppData) => void;
}

function ChannelCard({ channel, isUploaded, toggleUpload, index }: { channel: Channel, isUploaded: boolean, toggleUpload: (id: string) => void, index: number }) {
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
    toggleUpload(channel.id);
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
        isUploaded ? 'bg-green-400' : 'bg-red-400/50'
      }`} />
      
      <div className="pl-3 flex-1">
        <motion.h3 layout="position" className="text-lg font-medium tracking-[0.2px]">{channel.name}</motion.h3>
        
        <AnimatePresence>
          {isExpanded && channel.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="text-[12px] sm:text-[13px] font-normal text-white/75 leading-[1.4] mt-1 mb-1">
                {channel.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p layout="position" className={`text-[11px] mt-1 transition-colors duration-300 ${
          isUploaded ? 'text-green-300/80' : 'text-white/70'
        }`}>
          {isUploaded ? 'Uploaded' : 'Not Uploaded'}
        </motion.p>
      </div>
      
      <button
        onClick={(e) => { e.stopPropagation(); toggleUpload(channel.id); }}
        className={`relative inline-flex h-7 w-12 items-center rounded-full focus:outline-none shadow-inner ml-4 shrink-0 ${
          isUploaded 
            ? 'bg-green-500/40 border border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
            : 'bg-white/10 border border-white/10'
        }`}
        style={{ transition: 'all 300ms ease-out' }}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ${
            isUploaded ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-1 opacity-70'
          }`}
          style={{ transition: isUploaded ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease-out' : 'transform 300ms ease-out, opacity 300ms ease-out' }}
        />
      </button>
    </motion.div>
  );
}

export default function Home({ data, updateData }: HomeProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [secondsLeft, setSecondsLeft] = useState('');
  const today = getTodayString();
  const todayRecord = data.records[today] || { date: today, uploads: {} };

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

  const toggleUpload = (channelId: string) => {
    const isUploaded = todayRecord.uploads[channelId] || false;
    const newRecord = {
      ...todayRecord,
      uploads: {
        ...todayRecord.uploads,
        [channelId]: !isUploaded,
      },
    };

    updateData({
      ...data,
      records: {
        ...data.records,
        [today]: newRecord,
      },
    });
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
            <span className="text-lg font-medium tracking-wider text-white/80">{monthName}</span>
            <span className="text-sm text-secondary">{dayName}</span>
          </div>
        </div>
        
        <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-[12px] border border-white/[0.08] text-xs font-medium text-white/60 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 mr-2 animate-pulse-slow"></span>
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
            const isUploaded = todayRecord.uploads[channel.id] || false;
            return (
              <ChannelCard 
                key={channel.id} 
                channel={channel} 
                isUploaded={isUploaded} 
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
