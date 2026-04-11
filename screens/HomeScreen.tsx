import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../utils/types';
import { useTheme } from '../context/ThemeContext';

import { SafeAreaView } from 'react-native-safe-area-context';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions(); 
  
  // Responsive sizing: If screen is small, take up ~42% width to fit 2 per row. 
  // If large (tablet/web), cap it at 200px.
  const isLargeScreen = width > 600; 
  const cardWidth = isLargeScreen ? 200 : (width * 0.42); 

  return (
    // ✨ SafeAreaView automatically pads the bottom so it doesn't hide behind Android navigation buttons
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.title, { color: colors.text }]}>Oyun Seç</Text>
        
        <View style={styles.cardContainer}>
          <TouchableOpacity style={[styles.card, { width: cardWidth, backgroundColor: colors.input }]} onPress={() => navigation.navigate('SudokuDifficulty')}>
            {/* Replace with your actual icons if different */}
            <Text style={{fontSize: 50}}>📝</Text>
            <Text style={[styles.label, { color: colors.text }]}>Sudoku</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { width: cardWidth, backgroundColor: colors.input }]} onPress={() => navigation.navigate('MinesweeperDifficulty')}>
            <Text style={{fontSize: 50}}>💣</Text>
            <Text style={[styles.label, { color: colors.text }]}>Minesweeper</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { width: cardWidth, backgroundColor: colors.input }]} onPress={() => navigation.navigate('QueensDifficulty')}>
            <Text style={{fontSize: 50}}>👑</Text>
            <Text style={[styles.label, { color: colors.text }]}>Queens</Text>
          </TouchableOpacity>

          {/* New Color Connect Card */}
          <TouchableOpacity style={[styles.card, { width: cardWidth, backgroundColor: colors.input }]} onPress={() => navigation.navigate('ColorConnectDifficulty')}>
            <Text style={{fontSize: 50}}>🔗</Text>
            <Text style={[styles.label, { color: colors.text }]}>Renk Bağmaca</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10 },
  title: { fontSize: 32, marginBottom: 30, fontWeight: 'bold' },
  
  // ✨ GRID MAGIC: flexDirection row + flexWrap allows items to automatically wrap to the next line
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15, 
    justifyContent: 'center',
    width: '100%',
    maxWidth: 800, // Prevents spreading too far on ultra-wide screens
  },
  card: { 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20, 
    borderRadius: 16,
    aspectRatio: 1, // Keeps the cards perfectly square!
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  label: { marginTop: 12, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});