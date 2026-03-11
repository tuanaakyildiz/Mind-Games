import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';

type DifficultyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SudokuDifficulty'>;

export default function DifficultyScreen() {
  const navigation = useNavigation<DifficultyScreenNavigationProp>();
  const { colors } = useTheme();
  
  // Apply dynamic styles
  const styles = getStyles(colors);
  
  const difficulties: RootStackParamList['SudokuGame']['difficulty'][] = ['easy', 'medium', 'hard', 'extreme'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Difficulty</Text>
      {difficulties.map((level) => (
        <View key={level} style={styles.button}>
          <Button
            title={level.toUpperCase()}
            color={colors.input} 
            onPress={() => navigation.navigate('SudokuGame', { difficulty: level })}
          />
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: colors.background // Theme injected
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    fontWeight: 'bold',
    color: colors.text // Theme injected
  },
  button: { marginVertical: 8, width: '60%' },
});