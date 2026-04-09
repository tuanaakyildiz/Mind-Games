// screens/Queens/DifficultyScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyStatus } from '../../utils/dailyManager';

export default function DifficultyScreen() {
  const navigation = useNavigation<any>();
  
  // We only pull 'colors' here now, no need for mode setters!
  const { colors } = useTheme();
  const isFocused = useIsFocused(); 
  
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    if (isFocused) {
      checkDailyStatus('queens').then(setDailyCompleted);
    }
  }, [isFocused]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <Text style={[styles.title, { color: colors.text }]}>👑 Queens</Text>

      {/* Daily Challenge Button */}
      <TouchableOpacity 
        style={[styles.dailyButton, dailyCompleted && { backgroundColor: colors.fixedBackground }]} 
        disabled={dailyCompleted}
        onPress={() => navigation.navigate('QueensGame', { difficulty: 'medium', isDaily: true })}
      >
        <Text style={[styles.dailyButtonText, dailyCompleted && { color: colors.text }]}>
          {dailyCompleted ? '✅ Bugünü Tamamladın' : '🌟 Günün Bulmacası'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Endless Modes */}
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
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  dailyButton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 12, marginBottom: 20, width: 250, alignItems: 'center', elevation: 5 },
  dailyButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  divider: { height: 2, width: '60%', backgroundColor: '#555', marginVertical: 20, opacity: 0.2 },
  button: { padding: 15, borderRadius: 10, marginVertical: 10, width: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});