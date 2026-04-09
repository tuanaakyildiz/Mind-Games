import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyStatus } from '../../utils/dailyManager';

export default function DifficultyScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode } = useTheme();
  const isFocused = useIsFocused(); // Re-runs when screen comes into view
  
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    if (isFocused) {
      checkDailyStatus('queens').then(setDailyCompleted);
    }
  }, [isFocused]);

  // Global Theme Toggle
  const toggleTheme = () => setMode(mode === 'light' ? 'dark' : 'light');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Theme Toggle Button */}
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Text style={{ fontSize: 24 }}>{mode === 'light' ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Queens</Text>

      {/* Daily Challenge Button */}
      <TouchableOpacity 
        style={[styles.dailyButton, dailyCompleted && { backgroundColor: colors.fixedBackground }]} 
        disabled={dailyCompleted}
        onPress={() => navigation.navigate('QueensGame', { difficulty: 'medium', isDaily: true })}
      >
        <Text style={styles.dailyButtonText}>
          {dailyCompleted ? '✅ Daily Challenge Done' : '🌟 Play Daily Challenge'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Standard Endless Modes */}
      {['easy', 'medium', 'hard'].map((level) => (
        <TouchableOpacity 
          key={level} 
          style={[styles.button, { backgroundColor: colors.input }]} 
          onPress={() => navigation.navigate('QueensGame', { difficulty: level, isDaily: false })}
        >
          <Text style={styles.buttonText}>{level.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  themeToggle: { position: 'absolute', top: 50, right: 20, padding: 10 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  dailyButton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 12, marginBottom: 20, width: 250, alignItems: 'center', elevation: 5 },
  dailyButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  divider: { height: 2, width: '60%', backgroundColor: '#555', marginVertical: 20, opacity: 0.2 },
  button: { padding: 15, borderRadius: 10, marginVertical: 10, width: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});