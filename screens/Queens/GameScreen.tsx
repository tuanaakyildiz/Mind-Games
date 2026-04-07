import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../constants/theme';
import { getQueensBoard, validateBoard, isGameWon } from '../../services/queensLogic';

// Map Region IDs to your theme keys to create distinct zones
const REGION_COLORS = ['purple', 'blue', 'pink', 'cyan', 'gray', 'purple', 'blue', 'pink', 'cyan'];

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { mode, colors } = useTheme();
  const { difficulty } = route.params;

  // Screen dimensions for responsive sizing
  const { width, height } = useWindowDimensions();

  // Game States
  const [board, setBoard] = useState(() => getQueensBoard(difficulty));
  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const isFinishedRef = useRef(false);

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinishedRef.current) setTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCellPress = (r: number, c: number) => {
    if (isFinishedRef.current) return;

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      const currentState = newBoard[r][c].state;
      
      // Tap cycle: empty -> star -> cross -> empty
      if (currentState === 'empty') newBoard[r][c].state = 'star';
      else if (currentState === 'star') newBoard[r][c].state = 'cross';
      else newBoard[r][c].state = 'empty';

      const validatedBoard = validateBoard(newBoard);
      
      if (isGameWon(validatedBoard)) {
        isFinishedRef.current = true;
        setTimeout(() => {
          navigation.navigate('QueensResult', { won: true, time, difficulty });
        }, 500);
      }
      
      return validatedBoard;
    });
  };

  // Web/Mouse specific: Right-click to quickly place/remove a cross (like flags in Minesweeper)
  const handleRightClick = (r: number, c: number) => {
    if (isFinishedRef.current) return;
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      const currentState = newBoard[r][c].state;
      
      if (currentState === 'cross') newBoard[r][c].state = 'empty';
      else if (currentState === 'empty') newBoard[r][c].state = 'cross';
      
      return validateBoard(newBoard);
    });
  };

  const getCellBackground = (regionId: number, isError: boolean) => {
    if (isError) return '#ff4444'; // Red for rule violation
    const colorKey = REGION_COLORS[regionId % REGION_COLORS.length];
    // @ts-ignore
    return themes[colorKey][mode].background;
  };

  // --- Dynamic Resizing Logic ---
  const size = board.length;
  // Calculate max possible cell size keeping screen padding and header in mind
  const maxPossibleWidth = (width - 60) / size;
  const maxPossibleHeight = (height - 200) / size;
  
  // Cap the size so it doesn't get insanely huge on 4K monitors, but scales well on phones
  const baseCellSize = Math.max(30, Math.min(60, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.60;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header & Controls */}
      <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>⏱ {time}s | 👑 Queens</Text>
        
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={zoomOut} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
            <Text style={{ fontSize: 18, color: colors.text }}>🔍-</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
            <Text style={styles.exitText}>🏠 Çık</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={zoomIn} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
            <Text style={{ fontSize: 18, color: colors.text }}>🔍+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Board Area */}
      <ScrollView style={styles.scrollVertical} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal style={styles.scrollHorizontal} contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.boardContainer, { padding: 4 * zoom, borderRadius: 8 * zoom }]}>
            {board.map((row, rIdx) => (
              <View key={`row-${rIdx}`} style={styles.row}>
                {row.map((cell, cIdx) => (
                  <View
                    key={`cell-wrapper-${rIdx}-${cIdx}`}
                    // @ts-expect-error - Web specific right-click handler
                    onContextMenu={(e: any) => {
                      if (Platform.OS === 'web') {
                        e.preventDefault();
                        handleRightClick(rIdx, cIdx);
                      }
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.cell,
                        { 
                          width: baseCellSize * zoom, 
                          height: baseCellSize * zoom, 
                          backgroundColor: getCellBackground(cell.regionId, cell.isError),
                          borderColor: colors.text,
                          borderWidth: 1 * Math.max(0.5, zoom),
                        }
                      ]}
                      onPress={() => handleCellPress(rIdx, cIdx)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.cellText, 
                        { 
                          fontSize: baseFontSize * zoom,
                          lineHeight: baseFontSize * zoom * 1.2
                        }
                      ]}>
                        {cell.state === 'star' ? '👑' : cell.state === 'cross' ? '❌' : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>

        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, alignItems: 'center', elevation: 4, zIndex: 10 },
  headerText: { fontSize: 22, fontWeight: '800', marginBottom: 15 },
  
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 350 },
  zoomButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  exitText: { color: '#e74c3c', fontSize: 18, fontWeight: 'bold' },
  
  scrollVertical: { flex: 1, width: '100%' },
  scrollHorizontal: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  
  boardContainer: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, backgroundColor: '#333' },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center' },
  cellText: { textAlign: 'center' }
});