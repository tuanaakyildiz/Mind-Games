import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MinesweeperDifficulty'>;

export default function MinesweeperDifficulty() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  
  // 1. Generate styles dynamically based on current theme colors
  const styles = getStyles(colors);

  return (
    // 2. Look how clean the JSX is now!
    <View style={styles.container}>
      <Text style={styles.title}>Zorluk Seçin</Text>
      
      <View style={styles.buttonWrapper}>
        <Button 
          title="Kolay (8x8, 10 mayın)" 
          color={colors.userInput} 
          onPress={() => navigation.navigate('MinesweeperGame', { rows: 8, cols: 8, mines: 10 })} 
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button 
          title="Orta (12x12, 20 mayın)" 
          color={colors.userInput} 
          onPress={() => navigation.navigate('MinesweeperGame', { rows: 12, cols: 12, mines: 20 })} 
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button 
          title="Zor (16x16, 40 mayın)" 
          color={colors.userInput} 
          onPress={() => navigation.navigate('MinesweeperGame', { rows: 16, cols: 16, mines: 40 })} 
        />
      </View>
    </View>
  );
}

// 3. The StyleSheet is now a function that accepts colors
const getStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: colors.background // Theme injected here
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20,
    fontWeight: 'bold',
    color: colors.text // Theme injected here
  },
  buttonWrapper: {
    marginVertical: 10,
    width: '80%',
  }
});