import React, { useState, useEffect } from 'react';
import { AppData, TabType, Channel, Board, Note } from './types';
import { 
  subscribeToChannels, 
  subscribeToBoards, 
  subscribeToNotes, 
  defaultData,
  saveChannel
} from './utils/firestore';
import { getTodayString, formatDate } from './utils/storage';
import Home from './components/Home';
import CalendarTab from './components/Calendar';
import AddChannel from './components/AddChannel';
import Analytics from './components/Analytics';
import Backup from './components/Backup';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

const USER_ID = "focus-user-001";

function MainApp({ userId }: { userId: string }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    let channelsLoaded = false;
    let boardsLoaded = false;
    let notesLoaded = false;

    const checkLoaded = () => {
      if (channelsLoaded && boardsLoaded && notesLoaded) {
        setIsLoaded(true);
      }
    };

    const unsubChannels = subscribeToChannels(userId, (channels) => {
      // Daily Reset Logic
      const now = new Date();
      const todayStr = getTodayString();
      
      const updatedChannels = channels.map(channel => {
        const lastUpdatedDate = formatDate(new Date(channel.lastUpdated));
        if (channel.uploaded && lastUpdatedDate !== todayStr) {
          const resetChannel = { ...channel, uploaded: false, lastUpdated: now.getTime() };
          // Update Firestore asynchronously
          saveChannel(userId, resetChannel);
          return resetChannel;
        }
        return channel;
      });

      setData(prev => ({ ...prev, channels: updatedChannels }));
      channelsLoaded = true;
      checkLoaded();
    });

    const unsubBoards = subscribeToBoards(userId, (boards) => {
      setData(prev => ({ ...prev, boards }));
      boardsLoaded = true;
      checkLoaded();
    });

    const unsubNotes = subscribeToNotes(userId, (notes) => {
      setData(prev => ({ ...prev, notes }));
      notesLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubChannels();
      unsubBoards();
      unsubNotes();
    };
  }, [userId]);

  // Handle visibility change for daily reset (when app comes to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoaded) {
        const now = new Date();
        const todayStr = getTodayString();
        
        data.channels.forEach(channel => {
          const lastUpdatedDate = formatDate(new Date(channel.lastUpdated));
          if (channel.uploaded && lastUpdatedDate !== todayStr) {
            saveChannel(userId, { ...channel, uploaded: false, lastUpdated: now.getTime() });
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [data.channels, isLoaded, userId]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-transparent animate-in fade-in duration-500">
      <main className="min-h-screen">
        {activeTab === 'home' && <Home data={data} userId={userId} updateData={setData} />}
        {activeTab === 'calendar' && <CalendarTab data={data} />}
        {activeTab === 'add' && <AddChannel data={data} userId={userId} />}
        {activeTab === 'analytics' && <Analytics data={data} />}
        {activeTab === 'backup' && <Backup data={data} userId={userId} onFocusModeChange={setIsFocusMode} />}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isFocusMode={isFocusMode} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp userId={USER_ID} />
    </ErrorBoundary>
  );
}

