// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../utils/types';
import { useTheme } from '../context/ThemeContext';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  // Gets real-time screen width
  const { width } = useWindowDimensions(); 
  // If width is greater than 600px, we treat it as a large screen (web/tablet)
  const isLargeScreen = width > 600; 

  const styles = getStyles(colors, isLargeScreen);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oyun Seç</Text>
      
      {/* Wrapper that changes direction based on screen size */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SudokuDifficulty')}>
          <Image source={require('../assets/sudoku.png')} style={styles.image} />
          <Text style={styles.label}>Sudoku</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MinesweeperDifficulty')}>
          <Image source={require('../assets/minesweeper.png')} style={styles.image} />
          <Text style={styles.label}>Minesweeper</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('QueensDifficulty')}>
          <Image source={require('../assets/queens.png')} style={styles.image} />
          <Text style={styles.label}>Queens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ColorConnectDifficulty')}>
          <Image source={require('../assets/colorConnect.png')} style={styles.image} />
          <Text style={styles.label}>Color Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any, isLargeScreen: boolean) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 32, marginBottom: 30, fontWeight: 'bold', color: colors.text },
  // 🚨 THE RESPONSIVE MAGIC:
  cardContainer: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    gap: 20, // Adds space between cards whether they are stacked or side-by-side
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { 
    alignItems: 'center', padding: 20, borderRadius: 16,
    backgroundColor: colors.input, width: 220, 
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  image: { width: 120, height: 120, resizeMode: 'contain' },
  label: { marginTop: 12, fontSize: 20, fontWeight: '600', color: colors.text },
});