import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../utils/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';

type Route = RouteProp<RootStackParamList, 'MinesweeperResult'>;
type Nav = NativeStackNavigationProp<RootStackParamList>; 

export default function MinesweeperResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { time, status } = route.params;

  const isWon = status === 'won';
  const { colors } = useTheme();
  
  // Pass both colors and the game status to generate perfect styles
  const styles = getStyles(colors, isWon);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isWon ? '🎉 TEBRİKLER!' : '💥 OYUN BİTTİ'}
      </Text>
      <Text style={styles.subtitle}>
        {isWon ? 'Mayın Tarlasını Başarıyla Temizledin!' : 'Mayınlardan birine bastın.'}
      </Text>
      
      <View style={styles.statsCard}>
        <Text style={styles.statText}>⏱ Harcanan Süre: {time} saniye</Text>
      </View>

      <View style={styles.buttonWrapper}>
        <Button title="Yeniden Başla" color={colors.text} onPress={() => navigation.replace('MinesweeperDifficulty')} />
        <View style={{ height: 12 }} />
        <Button title="Ana Sayfa" color="gray" onPress={() => navigation.navigate('Home')} />
      </View>
    </View>
  );
}

const getStyles = (colors: any, isWon: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: colors.background 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: isWon ? '#2ecc71' : '#e74c3c' // Logic handled here now
  },
  subtitle: { 
    fontSize: 18, 
    marginBottom: 30, 
    textAlign: 'center',
    color: colors.text,
    opacity: 0.8
  },
  statsCard: { 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 40, 
    width: '100%', 
    alignItems: 'center',
    backgroundColor: colors.input
  },
  statText: { 
    fontSize: 20, 
    fontWeight: '600',
    color: colors.text
  },
  buttonWrapper: { width: '80%' }
});