import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyStatus } from '../../utils/dailyManager';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MinesweeperDifficulty'>;

export default function MinesweeperDifficulty() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const isFocused = useIsFocused(); // Re-runs when screen comes into view
  
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    if (isFocused) {
      // Check if the minesweeper daily is done
      checkDailyStatus('minesweeper').then(setDailyCompleted);
    }
  }, [isFocused]);

  const styles = getStyles(colors);

  return (
    // 2. Look how clean the JSX is now!
    <View style={styles.container}>
      <Text style={styles.title}>💣 Minesweeper</Text>

      {/* ✨ Daily Challenge Button */}
      <TouchableOpacity 
        style={[styles.dailyButton, dailyCompleted && { backgroundColor: colors.fixedBackground }]} 
        disabled={dailyCompleted}
        onPress={() => navigation.navigate('MinesweeperGame', { rows: 12, cols: 12, mines: 20, isDaily: true })}
      >
        <Text style={[styles.dailyButtonText, dailyCompleted && { color: colors.text }]}>
          {dailyCompleted ? '✅ Bugünü Tamamladın' : '🌟 Günün Bulmacası'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Standard Endless Modes */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.input }]} 
        onPress={() => navigation.navigate('MinesweeperGame', { rows: 8, cols: 8, mines: 10, isDaily: false })}
      >
        <Text style={styles.buttonText}>KOLAY (8x8, 10)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.input }]} 
        onPress={() => navigation.navigate('MinesweeperGame', { rows: 12, cols: 12, mines: 20, isDaily: false })}
      >
        <Text style={styles.buttonText}>ORTA (12x12, 20)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.input }]} 
        onPress={() => navigation.navigate('MinesweeperGame', { rows: 16, cols: 16, mines: 40, isDaily: false })}
      >
        <Text style={styles.buttonText}>ZOR (16x16, 40)</Text>
      </TouchableOpacity>
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});