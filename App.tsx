import React from 'react';
// 1. Import DefaultTheme from react-navigation
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const ThemedNavigation = () => {
  const { colors, mode } = useTheme(); // Grab 'mode' too, so we can pass it to 'dark'

  // 2. Merge React Navigation's default theme with our custom colors
  const customNavigationTheme = {
    ...DefaultTheme, // <--- This magically provides the missing 'fonts' object!
    dark: mode === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.userInput,
      background: colors.background, 
      card: colors.fixedBackground,
      text: colors.text,
      border: 'transparent',
      notification: colors.userInput,
    }
  };

  return (
    // 3. Pass the merged theme
    <NavigationContainer theme={customNavigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}