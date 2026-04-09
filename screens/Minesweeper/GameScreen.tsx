import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateBoard } from '../../services/logic';
import { getMinesweeperHint } from '../../services/hintManager';
import { useTheme } from '../../context/ThemeContext';
import { getSeededRandom, getTodaySeed, markDailyCompleted } from '../../utils/dailyManager';
import { saveGameState, loadGameState, clearGameState } from '../../storage/storageUtils';

import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function MinesweeperGameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  const { rows, cols, mines, isDaily, isResumed } = route.params;
  const { width, height } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<any[]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>([]);
  const [flags, setFlags] = useState<boolean[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(3);
  const isFinishedRef = useRef(false);

  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0); 

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.4, Math.min(savedScale.value * e.scale, 3.0));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 0.6) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const zoomIn = () => { scale.value = withSpring(Math.min(scale.value + 0.3, 3.0)); savedScale.value = scale.value; };
  const zoomOut = () => { scale.value = withSpring(Math.max(scale.value - 0.3, 0.4)); savedScale.value = scale.value; };

  useEffect(() => {
    const initGame = async () => {
      if (isResumed && !isDaily) {
        const saved = await loadGameState('minesweeper');
        if (saved) {
          setBoard(saved.board);
          setRevealed(saved.revealed);
          setFlags(saved.flags);
          setTime(saved.time);
          setLives(saved.lives);
          setIsLoading(false);
          return;
        }
      }
      
      const rng = isDaily ? getSeededRandom(getTodaySeed()) : Math.random;
      const newBoard = generateBoard(rows || 12, cols || 12, mines || 20, rng);
      setBoard(newBoard);
      setRevealed(Array(rows || 12).fill(null).map(() => Array(cols || 12).fill(false)));
      setFlags(Array(rows || 12).fill(null).map(() => Array(cols || 12).fill(false)));
      setIsLoading(false);
    };
    initGame();
  }, [isResumed, isDaily, rows, cols, mines]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFinishedRef.current && !isLoading) {
        setTime((t) => t + 1);
        setHintCooldown((c) => (c > 0 ? c - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleEndGame = async (status: 'won' | 'lost') => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setGameOver(true);

    if (status === 'won' && isDaily) {
      await markDailyCompleted('minesweeper');
    }
    await clearGameState('minesweeper');

    setTimeout(() => {
      navigation.navigate('MinesweeperResult', { time, status, isDaily });
    }, 400);
  };

  const revealCell = (r: number, c: number) => {
    if (gameOver || isFinishedRef.current || isLoading || revealed[r][c] || flags[r][c]) return;
    const newRevealed = revealed.map(row => [...row]);
    const newFlags = flags.map(row => [...row]);
    const cell = board[r][c];

    let nextLives = lives;

    if (cell === '💣') {
      nextLives = lives - 1;
      setLives(nextLives);
      newRevealed[r][c] = true;
      newFlags[r][c] = true;
      setRevealed(newRevealed);
      setFlags(newFlags);
      if (nextLives <= 0) {
        handleEndGame('lost');
        return;
      }
    } else {
      if (cell === 0) revealZeros(r, c, newRevealed, newFlags);
      else newRevealed[r][c] = true;
      setRevealed(newRevealed);
    }

    let unrevealedSafeCells = 0;
    for (let i = 0; i < (rows || 12); i++) {
      for (let j = 0; j < (cols || 12); j++) {
        if (board[i][j] !== '💣' && !newRevealed[i][j]) unrevealedSafeCells++;
      }
    }

    if (unrevealedSafeCells === 0) {
      handleEndGame('won');
    } else if (!isDaily) {
      saveGameState('minesweeper', { board, revealed: newRevealed, flags: newFlags, time, lives: nextLives });
    }
  };

  const revealZeros = (r: number, c: number, rev: boolean[][], flg: boolean[][]) => {
    const queue: [number, number][] = [[r, c]];
    rev[r][c] = true;
    const currentRows = rows || 12;
    const currentCols = cols || 12;
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = currR + dr, nc = currC + dc;
          if (nr >= 0 && nr < currentRows && nc >= 0 && nc < currentCols && !rev[nr][nc] && !flg[nr][nc]) {
            rev[nr][nc] = true;
            if (board[nr][nc] === 0) queue.push([nr, nc]);
          }
        }
      }
    }
  };

  const toggleFlag = (r: number, c: number) => {
    if (revealed[r][c] || gameOver || isLoading) return;
    const newFlags = flags.map(row => [...row]);
    newFlags[r][c] = !newFlags[r][c];
    setFlags(newFlags);
    
    if (!isDaily) saveGameState('minesweeper', { board, revealed, flags: newFlags, time, lives });
  };

  const handleHint = () => {
    if (hintCooldown > 0 || gameOver || isLoading) return;

    const hint = getMinesweeperHint(board, revealed, flags, rows || 12, cols || 12);
    if (hint) {
      revealCell(hint.row, hint.col);
      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) setHintCooldown(60);
        return newTotal;
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const currentFlags = flags.flat().filter(f => f).length;
  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) hintButtonText = `⏳ ${hintCooldown}s`;
  else if (hintsUsedThisGame < 3) hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;

  const maxPossibleWidth = (width - 60) / (cols || 12);
  const maxPossibleHeight = (height - 200) / (rows || 12);
  const baseCellSize = Math.max(20, Math.min(45, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.65;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            ⏱ {time}s | ❤️ {lives} | 🚩 {Math.max(0, (mines || 20) - currentFlags)} {isDaily && ' | 🌟 Daily'}
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
              <Animated.View style={[styles.boardContainer, animatedBoardStyle, { backgroundColor: colors.input }]}>
                {/* ✨ FIXED: Explicit types added to row, r, cell, and c to satisfy TS7006 */}
                {board.map((row: any[], r: number) => (
                  <View key={`row-${r}`} style={styles.row}>
                    {row.map((cell: any, c: number) => (
                      <View key={`cell-wrapper-${r}-${c}`}
                        // @ts-expect-error
                        onContextMenu={(e: any) => { if (Platform.OS === 'web') { e.preventDefault(); toggleFlag(r, c); } }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.cell, 
                            { width: baseCellSize, height: baseCellSize },
                            revealed[r][c] ? { backgroundColor: colors.background } : { backgroundColor: 'rgba(255,255,255,0.4)' }
                          ]}
                          onPress={() => revealCell(r, c)}
                          onLongPress={() => toggleFlag(r, c)}
                          delayLongPress={200}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.cellText, { color: getCellColor(cell), fontSize: baseFontSize, lineHeight: baseFontSize * 1.2 }]}>
                            {flags[r][c] ? '🚩' : (revealed[r][c] ? (cell === 0 ? '' : cell) : '')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
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

const getCellColor = (val: any) => {
  const colors: any = { 1: '#0052cc', 2: '#27ae60', 3: '#e74c3c', 4: '#8e44ad', '💣': '#e74c3c' };
  return colors[val] || '#333';
};

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
  boardContainer: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, padding: 4, borderRadius: 8 },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center', borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1, margin: 1 },
  cellText: { fontWeight: '900', textAlign: 'center' }
});