import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { saveScore } from '../../services/scoreManager';

export default function ResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { won, difficulty } = route.params;

  useEffect(() => {
    // Calculate score based on difficulty
    const multiplier = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;
    saveScore({ starsEarned: won ? 10 * multiplier : 0, won });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {won ? 'You Won! 🎉' : 'Game Over'}
      </Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.input }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={{ color: colors.background, fontWeight: 'bold' }}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40 },
  button: { padding: 15, borderRadius: 10, width: 200, alignItems: 'center' }
});