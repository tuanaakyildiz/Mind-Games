import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyStatus } from '../../utils/dailyManager';
import { loadGameState } from '../../storage/storageUtils';

export default function DifficultyScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const isFocused = useIsFocused(); 
  
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    if (isFocused) {
      checkDailyStatus('connect').then(setDailyCompleted);
      loadGameState('connect').then((saved: any) => setHasSavedGame(!!saved));
    }
  }, [isFocused]);

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 Renk Bağmaca</Text>

      {hasSavedGame && (
        <TouchableOpacity 
          style={[styles.resumeButton, { backgroundColor: colors.selected }]} 
          onPress={() => navigation.navigate('ColorConnectGame', { isResumed: true })}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>⏱️ Kaldığın Yerden Devam Et</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.dailyButton, dailyCompleted && { backgroundColor: colors.fixedBackground }]} 
        disabled={dailyCompleted}
        onPress={() => navigation.navigate('ColorConnectGame', { difficulty: 'medium', isDaily: true })}
      >
        <Text style={[styles.dailyButtonText, dailyCompleted && { color: colors.text }]}>
          {dailyCompleted ? '✅ Bugünü Tamamladın' : '🌟 Günün Bulmacası'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {['easy', 'medium', 'hard'].map((level) => (
        <TouchableOpacity 
          key={level} 
          style={[styles.button, { backgroundColor: colors.input }]} 
          onPress={() => navigation.navigate('ColorConnectGame', { difficulty: level, isDaily: false })}
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
  resumeButton: { padding: 18, borderRadius: 12, marginBottom: 15, width: 250, alignItems: 'center', elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  dailyButton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 12, marginBottom: 20, width: 250, alignItems: 'center', elevation: 5 },
  dailyButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  divider: { height: 2, width: '60%', backgroundColor: '#555', marginVertical: 20, opacity: 0.2 },
  button: { padding: 15, borderRadius: 10, marginVertical: 10, width: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});