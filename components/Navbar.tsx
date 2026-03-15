// components/NavBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Define your available colors here so the Navbar can loop through them
const THEME_OPTIONS = [
  { key: 'purple', hex: '#9370DB' }, // Using your input colors for the swatches
  { key: 'blue', hex: '#6aa3ff' },
  { key: 'pink', hex: '#ec4899' },
  { key: 'cyan', hex: '#06b6d4' },
  { key: 'gray', hex: '#6b7280' },
  // { key: 'green', hex: '#4caf50' }, // Uncomment when you add green to ThemeContext
];

export const NavBar = () => {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode, colorKey, setColorKey } = useTheme();

  return (
    <SafeAreaView style={{ backgroundColor: colors.fixedBackground }}>
      <View style={[styles.navContainer, { backgroundColor: colors.fixedBackground }]}>
        
        {/* 1. HOME BUTTON */}
        <TouchableOpacity 
          style={[styles.homeButton, { borderColor: colors.text }]}
          onPress={() => navigation.navigate('Home')} // Make sure 'Home' matches your AppNavigator name
        >
          <Text style={{ color: colors.text, fontWeight: 'bold' }}>🏠 Home</Text>
        </TouchableOpacity>

        {/* 2. SELECTION SYSTEM */}
        <View style={styles.selectionContainer}>
          
          {/* Color Swatches */}
          <View style={styles.colorRow}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = colorKey === theme.key;
              return (
                <TouchableOpacity
                  key={theme.key}
                  style={[
                    styles.swatch,
                    { backgroundColor: theme.hex },
                    // Add a border if this specific color is currently active
                    isSelected && { borderWidth: 2, borderColor: colors.text, transform: [{ scale: 1.2 }] }
                  ]}
                  onPress={() => setColorKey(theme.key)}
                />
              );
            })}
          </View>

          {/* Light/Dark Mode Toggle */}
          <TouchableOpacity 
            style={[styles.modeToggle, { backgroundColor: colors.selected }]}
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
              {mode === 'light' ? '🌙 DARK' : '☀️ LIGHT'}
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  homeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  selectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15, // Space between color swatches and the mode toggle
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8, // Space between individual color swatches
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12, // Makes it a perfect circle
    elevation: 2, // Minor shadow on Android
    shadowColor: '#000', // Shadow on iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  modeToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
  }
});