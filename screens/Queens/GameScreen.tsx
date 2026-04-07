import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getQueensBoard, validateBoard, isGameWon } from '../../services/queensLogic';
import { getQueensHint } from '../../services/hintManager';

// ✨ NEW: High-contrast, distinct colors specifically for the board regions
const DISTINCT_REGION_COLORS = [
  '#FFADAD', // Pastel Red
  '#FFD6A5', // Pastel Orange
  '#FDFFB6', // Pastel Yellow
  '#CAFFBF', // Pastel Green
  '#9BF6FF', // Pastel Cyan
  '#A0C4FF', // Pastel Blue
  '#BDB2FF', // Pastel Purple
  '#FFC6FF', // Pastel Magenta
  '#E0E0E0', // Light Gray
];

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { difficulty } = route.params;
  const { width, height } = useWindowDimensions();

  // Initialization
  const [gameData] = useState(() => getQueensBoard(difficulty));
  const [board, setBoard] = useState(gameData.board);
  const solution = gameData.solution;

  // Game States
  const [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const isFinishedRef = useRef(false);

  // ✨ Hint States
  const [suggestedHint, setSuggestedHint] = useState<{ row: number; col: number } | null>(null);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);

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

    // If they manually tap the suggested hint cell, clear the highlight
    if (suggestedHint && suggestedHint.row === r && suggestedHint.col === c) {
      setSuggestedHint(null);
    }

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

  // ✨ UNLIMITED 2-STEP HINT SYSTEM
  const handleHint = () => {
    if (hintCooldown > 0 || isFinishedRef.current) return;

    // STEP 2: Fill in the highlighted hint
    if (suggestedHint) {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        const { row: sr, col: sc } = suggestedHint;
        const targetRegionId = newBoard[sr][sc].regionId;
        
        // Place the star
        newBoard[sr][sc].state = 'star';
        
        // Auto-cross out the row, col, diagonals, and region to help the player!
        const size = newBoard.length;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (newBoard[i][j].state === 'empty') {
              const isSameRow = (i === sr);
              const isSameCol = (j === sc);
              const isSameRegion = (newBoard[i][j].regionId === targetRegionId);
              const isAdjacent = Math.abs(i - sr) <= 1 && Math.abs(j - sc) <= 1;

              if (isSameRow || isSameCol || isSameRegion || isAdjacent) {
                newBoard[i][j].state = 'cross';
              }
            }
          }
        }

        const validatedBoard = validateBoard(newBoard);
        if (isGameWon(validatedBoard)) {
          isFinishedRef.current = true;
          setTimeout(() => navigation.navigate('QueensResult', { won: true, time, difficulty }), 500);
        }
        return validatedBoard;
      });

      setSuggestedHint(null);

      // Increment session counter. If >= 3, trigger 60s cooldown.
      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) {
          setHintCooldown(60);
        }
        return newTotal;
      });
      return;
    }

    // STEP 1: Highlight the cell
    const hint = getQueensHint(board, solution);
    if (hint) {
      setSuggestedHint(hint);
    } else {
      alert("Tüm yıldızlar yerleştirildi veya hata var!");
    }
  };

  const getCellBackground = (regionId: number, isError: boolean) => {
    if (isError) return '#ff4444'; // Red for rule violation
    return DISTINCT_REGION_COLORS[regionId % DISTINCT_REGION_COLORS.length];
  };

  const size = board.length;
  const maxPossibleWidth = (width - 60) / size;
  const maxPossibleHeight = (height - 200) / size;
  const baseCellSize = Math.max(30, Math.min(60, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.60;

  // Dynamic Button Text
  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) {
    hintButtonText = `⏳ ${hintCooldown}s`;
  } else if (suggestedHint) {
    hintButtonText = '✍️ Onayla';
  } else if (hintsUsedThisGame < 3) {
    hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
        <Text style={[styles.headerText, { color: colors.text }]}>⏱ {time}s | 👑 Queens</Text>
        
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={zoomOut} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
            <Text style={{ fontSize: 18, color: colors.text }}>🔍-</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleHint} 
            disabled={hintCooldown > 0}
            style={[styles.hintButton, { borderColor: colors.text }, hintCooldown > 0 && { opacity: 0.5 }]}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
              {hintButtonText}
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
                {row.map((cell, cIdx) => {
                  // Check if this cell is the current highlighted hint
                  const isSuggested = suggestedHint?.row === rIdx && suggestedHint?.col === cIdx;

                  return (
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
                            // Thicker, darker border to separate cells clearly
                            borderColor: isSuggested ? '#FFD700' : 'rgba(0,0,0,0.5)', 
                            borderWidth: isSuggested ? 3 * zoom : 1 * Math.max(0.5, zoom),
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
                  );
                })}
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