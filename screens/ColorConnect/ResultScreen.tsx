import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function ResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  // Extract all the stats passed from the GameScreen
  const { time, difficulty, isDaily, hintsUsed } = route.params;

  // Format time beautifully (e.g., 65s -> 01:05)
  const formattedTime = `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.fixedBackground }]}>
        
        <Text style={{ fontSize: 60, marginBottom: 10 }}>🎉</Text>
        <Text style={[styles.title, { color: colors.text }]}>Tebrikler!</Text>
        <Text style={[styles.subtitle, { color: colors.text, opacity: 0.8 }]}>
          Bölümü başarıyla tamamladın.
        </Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.input }]}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Zaman</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formattedTime}</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: colors.input }]}>
            <Text style={[styles.statLabel, { color: colors.text }]}>İpucu</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{hintsUsed}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.input }]}>
            <Text style={[styles.statLabel, { color: colors.text }]}>Zorluk</Text>
            <Text style={[styles.statValue, { color: colors.text, textTransform: 'capitalize' }]}>
              {isDaily ? 'Daily' : difficulty}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.selected }]}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>🏠 Ana Menü</Text>
          </TouchableOpacity>

          {/* Only show "Play Again" if it's NOT a daily challenge */}
          {!isDaily && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.selected, marginTop: 15 }]}
              onPress={() => navigation.navigate('ColorConnectDifficulty')}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>🔄 Tekrar Oyna</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', maxWidth: 400, padding: 30, borderRadius: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  statBox: { flex: 1, marginHorizontal: 5, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5, opacity: 0.8 },
  statValue: { fontSize: 20, fontWeight: '900' },
  buttonContainer: { width: '100%' },
  button: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: 'bold' }
});