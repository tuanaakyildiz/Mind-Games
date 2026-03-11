import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../utils/types';
import { useTheme } from '../context/ThemeContext';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { colors } = useTheme();

  // Generate dynamic styles based on theme
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oyun Seç</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SudokuDifficulty')}>
        <Image source={require('../assets/sudoku.png')} style={styles.image} />
        <Text style={styles.label}>Sudoku</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MinesweeperDifficulty')}>
        <Image source={require('../assets/minesweeper.png')} style={styles.image} />
        <Text style={styles.label}>Minesweeper</Text>
      </TouchableOpacity>
    </View>
  );
}

// Replaced static StyleSheet with the dynamic pattern
const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background // Dynamic Background
  },
  title: { 
    fontSize: 28, 
    marginBottom: 30,
    fontWeight: 'bold',
    color: colors.text // Dynamic Text Color
  },
  card: { 
    margin: 15, 
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.input, // Added dynamic card background
    width: '60%', // Made cards a uniform width
    // Minor shadow for depth
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { 
    width: 100, 
    height: 100, 
    resizeMode: 'contain' 
  },
  label: { 
    marginTop: 12, 
    fontSize: 18, 
    fontWeight: '600',
    color: colors.text // Dynamic Text Color
  },
});