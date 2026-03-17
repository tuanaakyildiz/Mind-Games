import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { themes } from '../constants/theme'; 

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  // 1. Detect the system's current theme (returns 'light', 'dark', or null/undefined)
  const systemScheme = useColorScheme();
  
  const [colorKey, setColorKey] = useState<'purple' | 'blue' | 'pink' | 'cyan' | 'gray'>('purple');
  
  // 2. Initialize the app's mode with the system's preference. Fallback to 'dark' if unknown.
  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme || 'dark');

  // 🚨 NEW: Listen for System Theme Changes
  // If the user changes their phone/computer from Light to Dark while the app is open,
  // this hook catches it and updates our app's mode immediately.
  useEffect(() => {
    if (systemScheme) {
      setMode(systemScheme);
    }
  }, [systemScheme]);

  const colors = themes[colorKey][mode];

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, colorKey, setColorKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);