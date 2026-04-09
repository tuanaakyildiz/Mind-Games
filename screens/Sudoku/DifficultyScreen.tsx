import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyStatus } from '../../utils/dailyManager';

type DifficultyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SudokuDifficulty'>;

export default function DifficultyScreen() {
  const navigation = useNavigation<DifficultyScreenNavigationProp>();
  const { colors } = useTheme();
  const isFocused = useIsFocused(); // Re-runs when screen comes into view
  
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    if (isFocused) {
      // Check if the sudoku daily is done
      checkDailyStatus('sudoku').then(setDailyCompleted);
    }
  }, [isFocused]);

  const styles = getStyles(colors);
  const difficulties: RootStackParamList['SudokuGame']['difficulty'][] = ['easy', 'medium', 'hard'];

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>📝 Sudoku</Text>

      {/* ✨ Daily Challenge Button */}
      <TouchableOpacity 
        style={[styles.dailyButton, dailyCompleted && { backgroundColor: colors.fixedBackground }]} 
        disabled={dailyCompleted}
        onPress={() => navigation.navigate('SudokuGame', { difficulty: 'medium', isDaily: true })}
      >
        <Text style={[styles.dailyButtonText, dailyCompleted && { color: colors.text }]}>
          {dailyCompleted ? '✅ Bugünü Tamamladın' : '🌟 Günün Bulmacası'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Endless Modes */}
      {difficulties.map((level) => (
        <TouchableOpacity 
          key={level} 
          style={[styles.button, { backgroundColor: colors.input }]} 
          onPress={() => navigation.navigate('SudokuGame', { difficulty: level, isDaily: false })}
        >
          <Text style={styles.buttonText}>{level.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, color: colors.text },
  dailyButton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 12, marginBottom: 20, width: 250, alignItems: 'center', elevation: 5 },
  dailyButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  divider: { height: 2, width: '60%', backgroundColor: '#555', marginVertical: 20, opacity: 0.2 },
  button: { padding: 15, borderRadius: 10, marginVertical: 10, width: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});