import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getQueensBoard, validateBoard, isGameWon } from '../../services/queensLogic';
import { getQueensHint } from '../../services/hintManager';
import { getSeededRandom, getTodaySeed, markDailyCompleted } from '../../utils/dailyManager';
import { saveGameState, loadGameState, clearGameState } from '../../storage/storageUtils';

import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const LIGHT_REGIONS = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF', '#E0E0E0'];
const DARK_REGIONS = ['#783B3B', '#855735', '#7A7A30', '#3B7848', '#357878', '#3B4D78', '#5D3B78', '#78356A', '#555555'];

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, mode } = useTheme();
  
  const { difficulty, isDaily, isResumed } = route.params;
  const { width, height } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<any[]>([]);
  const [solution, setSolution] = useState<any[]>([]);
  const [time, setTime] = useState(0);

  const [suggestedHint, setSuggestedHint] = useState<{ row: number; col: number } | null>(null);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);
  const isFinishedRef = useRef(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 3.0));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 0.8) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const zoomIn = () => { scale.value = withSpring(Math.min(scale.value + 0.3, 3.0)); savedScale.value = scale.value; };
  const zoomOut = () => { scale.value = withSpring(Math.max(scale.value - 0.3, 0.5)); savedScale.value = scale.value; };

  useEffect(() => {
    const initGame = async () => {
      if (isResumed && !isDaily) {
        const saved = await loadGameState('queens');
        if (saved) {
          setBoard(saved.board);
          setSolution(saved.solution);
          setTime(saved.time);
          setIsLoading(false);
          return;
        }
      }
      
      const rng = isDaily ? getSeededRandom(getTodaySeed()) : Math.random;
      const data = getQueensBoard(difficulty || 'medium', rng);
      setBoard(data.board);
      setSolution(data.solution);
      setIsLoading(false);
    };
    initGame();
  }, [isResumed, isDaily, difficulty]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinishedRef.current && !isLoading) {
        setTime(t => t + 1);
        setHintCooldown(c => (c > 0 ? c - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleWin = async () => {
    isFinishedRef.current = true;
    if (isDaily) await markDailyCompleted('queens');
    await clearGameState('queens');
    setTimeout(() => navigation.navigate('QueensResult', { won: true, time, difficulty, isDaily }), 500);
  };

  const handleCellPress = (r: number, c: number) => {
    if (isFinishedRef.current || isLoading) return;
    if (suggestedHint && suggestedHint.row === r && suggestedHint.col === c) setSuggestedHint(null);

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      const currentState = newBoard[r][c].state;
      
      if (currentState === 'empty') newBoard[r][c].state = 'star';
      else if (currentState === 'star') newBoard[r][c].state = 'cross';
      else newBoard[r][c].state = 'empty';

      const validatedBoard = validateBoard(newBoard);
      
      if (isGameWon(validatedBoard)) {
        handleWin();
      } else if (!isDaily) {
        saveGameState('queens', { board: validatedBoard, solution, time, difficulty });
      }
      
      return validatedBoard;
    });
  };

  const handleRightClick = (r: number, c: number) => {
    if (isFinishedRef.current || isLoading) return;
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      const currentState = newBoard[r][c].state;
      if (currentState === 'cross') newBoard[r][c].state = 'empty';
      else if (currentState === 'empty') newBoard[r][c].state = 'cross';
      
      const validatedBoard = validateBoard(newBoard);
      if (!isDaily) saveGameState('queens', { board: validatedBoard, solution, time, difficulty });
      return validatedBoard;
    });
  };

  const handleHint = () => {
    if (hintCooldown > 0 || isFinishedRef.current || isLoading) return;

    if (suggestedHint) {
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        const { row: sr, col: sc } = suggestedHint;
        const targetRegionId = newBoard[sr][sc].regionId;
        
        newBoard[sr][sc].state = 'star';
        
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
          handleWin();
        } else if (!isDaily) {
          saveGameState('queens', { board: validatedBoard, solution, time, difficulty });
        }
        return validatedBoard;
      });

      setSuggestedHint(null);
      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) setHintCooldown(60);
        return newTotal;
      });
      return;
    }

    const hint = getQueensHint(board, solution);
    if (hint) setSuggestedHint(hint);
    else alert("Tüm yıldızlar yerleştirildi veya hata var!");
  };

  const getCellBackground = (regionId: number, isError: boolean) => {
    if (isError) return '#ff4444'; 
    const palette = mode === 'dark' ? DARK_REGIONS : LIGHT_REGIONS;
    return palette[regionId % palette.length];
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const size = board.length;
  const maxPossibleWidth = (width - 60) / size;
  const maxPossibleHeight = (height - 200) / size;
  const baseCellSize = Math.max(30, Math.min(60, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.60;

  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) hintButtonText = `⏳ ${hintCooldown}s`;
  else if (suggestedHint) hintButtonText = '✍️ Onayla';
  else if (hintsUsedThisGame < 3) hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            ⏱ {time}s | {isDaily ? '🌟 Daily Challenge' : '👑 Queens'}
          </Text>
          
          <View style={styles.controlRow}>
            <TouchableOpacity onPress={zoomOut} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
              <Text style={{ fontSize: 18, color: colors.text }}>🔍-</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleHint} disabled={hintCooldown > 0} style={[styles.hintButton, { borderColor: colors.text }, hintCooldown > 0 && { opacity: 0.5 }]}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{hintButtonText}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={zoomIn} style={[styles.zoomButton, { backgroundColor: colors.selected }]}>
              <Text style={{ fontSize: 18, color: colors.text }}>🔍+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollVertical} contentContainerStyle={styles.scrollContent}>
          <ScrollView horizontal style={styles.scrollHorizontal} contentContainerStyle={styles.scrollContent}>
            
            <GestureDetector gesture={pinchGesture}>
              <Animated.View style={[styles.boardContainer, animatedBoardStyle]}>
                {/* ✨ FIXED: Explicit types added to row, rIdx, cell, and cIdx to satisfy TS7006 */}
                {board.map((row: any[], rIdx: number) => (
                  <View key={`row-${rIdx}`} style={styles.row}>
                    {row.map((cell: any, cIdx: number) => {
                      const isSuggested = suggestedHint?.row === rIdx && suggestedHint?.col === cIdx;
                      return (
                        <View key={`cell-wrapper-${rIdx}-${cIdx}`}
                          // @ts-expect-error
                          onContextMenu={(e: any) => { if (Platform.OS === 'web') { e.preventDefault(); handleRightClick(rIdx, cIdx); } }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.cell,
                              { 
                                width: baseCellSize, height: baseCellSize, 
                                backgroundColor: getCellBackground(cell.regionId, cell.isError),
                                borderColor: isSuggested ? '#FFD700' : (mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)'), 
                                borderWidth: isSuggested ? 3 : 1, 
                              }
                            ]}
                            onPress={() => handleCellPress(rIdx, cIdx)}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.cellText, { fontSize: baseFontSize, lineHeight: baseFontSize * 1.3 }]}>
                              {cell.state === 'star' ? '👑' : cell.state === 'cross' ? '❌' : ''}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </Animated.View>
            </GestureDetector>

          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  boardContainer: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, backgroundColor: '#333', padding: 4, borderRadius: 8 },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center' },
  cellText: { textAlign: 'center' }
});