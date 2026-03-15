// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

// 🚨 THIS IS THE MOST IMPORTANT LINE: 
// It imports the themes from the file above so we never hardcode colors again!
import { themes } from '../constants/theme'; 

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const systemScheme = useColorScheme();
  const [colorKey, setColorKey] = useState<'purple' | 'blue'>('purple');
  const [mode, setMode] = useState<'light' | 'dark'>(systemScheme || 'light');

  // Dynamically pulls from the imported file
  const colors = themes[colorKey][mode];

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, colorKey, setColorKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);