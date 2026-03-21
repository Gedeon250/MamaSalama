import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Child, Reminder, Article } from '@/types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  children: Child[];
  setChildren: (children: Child[]) => void;
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  language: 'en' | 'sw' | 'rw';
  setLanguage: (lang: 'en' | 'sw' | 'rw') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [childrenList, setChildren] = useState<Child[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sw' | 'rw'>('en');

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        children: childrenList,
        setChildren,
        reminders,
        setReminders,
        isOnboarded,
        setIsOnboarded,
        language,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
