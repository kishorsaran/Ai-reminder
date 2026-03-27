import React, { useState } from 'react';
import { AppData } from '../types';
import { formatDate, getTodayString } from '../utils/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  data: AppData;
}

export default function CalendarTab({ data }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  
  const today = getTodayString();

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const selectedRecord = data.records[selectedDate];
  const hasUploadsOnSelected = selectedRecord && Object.values(selectedRecord.uploads).some(v => v);

  return (
    <div className="p-6 pb-28 animate-in fade-in duration-300">
      <h1 className="text-3xl heading-primary text-gradient mb-8">Calendar</h1>
      
      <div className="glass-panel p-5 rounded-3xl mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg heading-primary">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-1">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} className="opacity-80" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronRight size={18} className="opacity-80" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-small">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            
            const dateStr = formatDate(date);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const record = data.records[dateStr];
            const hasData = record && Object.values(record.uploads).some(v => v);
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative h-10 w-full flex items-center justify-center rounded-full text-sm transition-all duration-250
                  ${isSelected ? 'bg-white/20 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white/20' : 'hover:bg-white/10 border border-transparent'}
                  ${isToday && !isSelected ? 'text-purple-300 font-medium' : ''}
                  ${!isSelected && !isToday ? 'text-white/80' : ''}
                `}
              >
                {date.getDate()}
                {hasData && (
                  <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-green-300 shadow-[0_0_6px_rgba(134,239,172,0.8)]' : 'bg-green-400/60'}`}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="text-base heading-primary mb-4 flex items-center">
          {selectedDate === today ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {selectedDate === today && <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium tracking-wider uppercase text-white/60">Current</span>}
        </h3>
        
        {data.channels.length === 0 ? (
           <p className="text-sm text-small">No channels tracked.</p>
        ) : (
          <div className="space-y-3">
            {data.channels.map(channel => {
              const isUploaded = selectedRecord?.uploads[channel.id] || false;
              return (
                <div key={channel.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <span className="text-sm font-medium text-white/90">{channel.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    isUploaded 
                      ? 'bg-green-500/10 text-green-300 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' 
                      : 'bg-white/5 text-secondary border-white/5'
                  }`}>
                    {isUploaded ? 'Uploaded' : 'Missed'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
