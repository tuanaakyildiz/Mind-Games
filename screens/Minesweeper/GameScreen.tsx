import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateBoard } from '../../services/logic';
import { getMinesweeperHint } from '../../services/hintManager';
import { useTheme } from '../../context/ThemeContext';
import { getSeededRandom, getTodaySeed, markDailyCompleted } from '../../utils/dailyManager';

// ✨ Gestures
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function MinesweeperGameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  // ✨ Extract isDaily
  const { rows, cols, mines, isDaily } = route.params;
  const { width, height } = useWindowDimensions();

  // ✨ INITIALIZATION: Seeded RNG for Daily Challenge
  const [board] = useState(() => {
    const rng = isDaily ? getSeededRandom(getTodaySeed()) : Math.random;
    return generateBoard(rows, cols, mines, rng);
  });

  const [revealed, setRevealed] = useState<boolean[][]>(() => Array(rows).fill(null).map(() => Array(cols).fill(false)));
  const [flags, setFlags] = useState<boolean[][]>(() => Array(rows).fill(null).map(() => Array(cols).fill(false)));
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [lives, setLives] = useState(3);
  const isFinishedRef = useRef(false);

  // Hint States
  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0); 

  // ✨ REANIMATED GESTURES
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
    const timer = setInterval(() => {
      if (!isFinishedRef.current) {
        setTime((t) => t + 1);
        setHintCooldown((c) => (c > 0 ? c - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEndGame = async (status: 'won' | 'lost') => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setGameOver(true);

    // ✨ Mark Daily Completed on Win
    if (status === 'won' && isDaily) {
      await markDailyCompleted('minesweeper');
    }

    setTimeout(() => {
      navigation.navigate('MinesweeperResult', { time, status, isDaily });
    }, 400);
  };

  const revealCell = (r: number, c: number) => {
    if (gameOver || isFinishedRef.current || revealed[r][c] || flags[r][c]) return;
    const newRevealed = revealed.map(row => [...row]);
    const newFlags = flags.map(row => [...row]);
    const cell = board[r][c];

    if (cell === '💣') {
      const nextLives = lives - 1;
      setLives(nextLives);
      newRevealed[r][c] = true;
      newFlags[r][c] = true;
      setRevealed(newRevealed);
      setFlags(newFlags);
      if (nextLives <= 0) return handleEndGame('lost');
    } else {
      if (cell === 0) revealZeros(r, c, newRevealed, newFlags);
      else newRevealed[r][c] = true;
      setRevealed(newRevealed);
    }

    let unrevealedSafeCells = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (board[i][j] !== '💣' && !newRevealed[i][j]) unrevealedSafeCells++;
      }
    }
    if (unrevealedSafeCells === 0) handleEndGame('won');
  };

  const revealZeros = (r: number, c: number, rev: boolean[][], flg: boolean[][]) => {
    const queue: [number, number][] = [[r, c]];
    rev[r][c] = true;
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = currR + dr, nc = currC + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !rev[nr][nc] && !flg[nr][nc]) {
            rev[nr][nc] = true;
            if (board[nr][nc] === 0) queue.push([nr, nc]);
          }
        }
      }
    }
  };

  const toggleFlag = (r: number, c: number) => {
    if (revealed[r][c] || gameOver) return;
    const newFlags = flags.map(row => [...row]);
    newFlags[r][c] = !newFlags[r][c];
    setFlags(newFlags);
  };

  // ✨ UNLIMITED MINESWEEPER HINT CONTROLLER
  const handleHint = () => {
    if (hintCooldown > 0 || gameOver) return;

    const hint = getMinesweeperHint(board, revealed, flags, rows, cols);
    if (hint) {
      revealCell(hint.row, hint.col);
      
      // Increment the tracker. If this was the 3rd hint, lock the button for 60 seconds!
      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) setHintCooldown(60);
        return newTotal;
      });
    }
  };

  const currentFlags = flags.flat().filter(f => f).length;

  // ✨ Dynamic Button Text Logic
  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) hintButtonText = `⏳ ${hintCooldown}s`;
  else if (hintsUsedThisGame < 3) hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;

  // Calculate Base Cell Size
  const maxPossibleWidth = (width - 60) / cols;
  const maxPossibleHeight = (height - 200) / rows;
  const baseCellSize = Math.max(20, Math.min(45, maxPossibleWidth, maxPossibleHeight));
  const baseFontSize = baseCellSize * 0.65;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
          <Text style={[styles.headerText, { color: colors.text }]}>
            ⏱ {time}s | ❤️ {lives} | 🚩 {Math.max(0, mines - currentFlags)} {isDaily && ' | 🌟 Daily'}
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
                {board.map((row, r) => (
                  <View key={`row-${r}`} style={styles.row}>
                    {row.map((cell, c) => (
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