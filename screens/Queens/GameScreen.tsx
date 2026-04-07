import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { themes } from '../../constants/theme';
import { getQueensBoard, validateBoard, isGameWon } from '../../services/queensLogic';
import { getQueensHint, useHint } from '../../services/hintManager';

const REGION_COLORS = ['purple', 'blue', 'pink', 'cyan', 'gray', 'purple', 'blue', 'pink', 'cyan'];

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { mode, colors } = useTheme();
  const { difficulty } = route.params;
  const { width, height } = useWindowDimensions();

  // Initialization: we destructure both the board and the hidden solution
  const [gameData] = useState(() => getQueensBoard(difficulty));
  const [board, setBoard] = useState(gameData.board);
  const solution = gameData.solution;

  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hintCooldown, setHintCooldown] = useState(0);
  const isFinishedRef = useRef(false);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinishedRef.current) {
        setTime(t => t + 1);
        setHintCooldown(c => (c > 0 ? c - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCellPress = (r: number, c: number) => {
    if (isFinishedRef.current) return;
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      const currentState = newBoard[r][c].state;
      
      if (currentState === 'empty') newBoard[r][c].state = 'star';
      else if (currentState === 'star') newBoard[r][c].state = 'cross';
      else newBoard[r][c].state = 'empty';

      const validatedBoard = validateBoard(newBoard);
      
      if (isGameWon(validatedBoard)) {
        isFinishedRef.current = true;
        setTimeout(() => navigation.navigate('QueensResult', { won: true, time, difficulty }), 500);
      }
      return validatedBoard;
    });
  };

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

  // ✨ Hint Logic
  const handleHint = async () => {
    if (hintCooldown > 0 || isFinishedRef.current) return;
    
    // Check if they have tokens in AsyncStorage
    const hasTokens = await useHint();
    if (!hasTokens) {
      alert("No hints remaining! Play more games to earn stars.");
      return;
    }

    const hint = getQueensHint(board, solution);
    if (hint) {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[hint.row][hint.col].state = 'star'; // Automatically place the star
        
        // Clear out the rest of the row/col automatically for them
        for(let i=0; i<newBoard.length; i++) {
          if (i !== hint.col && newBoard[hint.row][i].state === 'empty') newBoard[hint.row][i].state = 'cross';
          if (i !== hint.row && newBoard[i][hint.col].state === 'empty') newBoard[i][hint.col].state = 'cross';
        }

        const validatedBoard = validateBoard(newBoard);
        if (isGameWon(validatedBoard)) {
          isFinishedRef.current = true;
          setTimeout(() => navigation.navigate('QueensResult', { won: true, time, difficulty }), 500);
        }
        return validatedBoard;
      });
      setHintCooldown(5); // 5 second lock to prevent spamming
    }
  };

  const getCellBackground = (regionId: number, isError: boolean) => {
    if (isError) return '#ff4444'; 
    const colorKey = REGION_COLORS[regionId % REGION_COLORS.length];
    // @ts-ignore
    return themes[colorKey][mode].background;
  };

  const size = board.length;
  const maxPossibleWidth = (width - 60) / size;
  const maxPossibleHeight = (height - 200) / size;
  const baseCellSize = Math.max(30, Math.min(60, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.60;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>⏱ {time}s | 👑 Queens</Text>
        
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={zoomOut} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
            <Text style={{ fontSize: 18, color: colors.text }}>🔍-</Text>
          </TouchableOpacity>
          
          {/* ✨ Hint Button */}
          <TouchableOpacity 
            onPress={handleHint} 
            disabled={hintCooldown > 0}
            style={[styles.hintButton, { borderColor: colors.text }, hintCooldown > 0 && { opacity: 0.5 }]}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
              {hintCooldown > 0 ? `⏳ ${hintCooldown}s` : '🧠 İpucu'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={zoomIn} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
            <Text style={{ fontSize: 18, color: colors.text }}>🔍+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollVertical} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal style={styles.scrollHorizontal} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.boardContainer, { padding: 4 * zoom, borderRadius: 8 * zoom }]}>
            {board.map((row, rIdx) => (
              <View key={`row-${rIdx}`} style={styles.row}>
                {row.map((cell, cIdx) => (
                  <View
                    key={`cell-wrapper-${rIdx}-${cIdx}`}
                    // @ts-expect-error
                    onContextMenu={(e: any) => {
                      if (Platform.OS === 'web') { e.preventDefault(); handleRightClick(rIdx, cIdx); }
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.cell,
                        { 
                          width: baseCellSize * zoom, height: baseCellSize * zoom, 
                          backgroundColor: getCellBackground(cell.regionId, cell.isError),
                          borderColor: colors.text, borderWidth: 1 * Math.max(0.5, zoom),
                        }
                      ]}
                      onPress={() => handleCellPress(rIdx, cIdx)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.cellText, { fontSize: baseFontSize * zoom, lineHeight: baseFontSize * zoom * 1.2 }]}>
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
  hintButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2 },
  scrollVertical: { flex: 1, width: '100%' },
  scrollHorizontal: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  boardContainer: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, backgroundColor: '#333' },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center' },
  cellText: { textAlign: 'center' }
});