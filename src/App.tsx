import React, { useState, useEffect } from 'react';
import { AppData, TabType } from './types';
import { subscribeToUserData, syncDataToFirestore, defaultData } from './utils/firestore';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Home from './components/Home';
import CalendarTab from './components/Calendar';
import AddChannel from './components/AddChannel';
import Analytics from './components/Analytics';
import Backup from './components/Backup';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';

function MainApp({ user }: { user: User }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUserData(user.uid, (newData) => {
      setData(newData);
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const updateData = (newData: AppData) => {
    setData(newData);
    syncDataToFirestore(user.uid, newData);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-transparent animate-in fade-in duration-500">
      <main className="min-h-screen">
        {activeTab === 'home' && <Home data={data} updateData={updateData} />}
        {activeTab === 'calendar' && <CalendarTab data={data} />}
        {activeTab === 'add' && <AddChannel data={data} updateData={updateData} />}
        {activeTab === 'analytics' && <Analytics data={data} />}
        {activeTab === 'backup' && <Backup data={data} updateData={updateData} />}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {user ? <MainApp user={user} /> : <Login />}
    </ErrorBoundary>
  );
}

