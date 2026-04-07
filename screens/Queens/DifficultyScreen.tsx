import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function QueensDifficulty() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Difficulty</Text>
      {['easy', 'medium', 'hard'].map((level) => (
        <TouchableOpacity 
          key={level} 
          style={styles.button} 
          onPress={() => navigation.navigate('QueensGame', { difficulty: level })}
        >
          <Text style={styles.buttonText}>{level.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 30 },
  button: { backgroundColor: colors.input, padding: 15, borderRadius: 10, marginVertical: 10, width: 200, alignItems: 'center' },
  buttonText: { color: colors.background, fontSize: 18, fontWeight: 'bold' }
});