import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getConnectBoard, PATH_COLORS, isAdjacent, checkWinCondition, PathsState } from '../../services/colorConnectLogic';
import { saveGameState, loadGameState, clearGameState } from '../../storage/storageUtils';
import { getSeededRandom, getTodaySeed, markDailyCompleted } from '../../utils/dailyManager';

import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  const { difficulty, isDaily, isResumed } = route.params;
  const { width, height } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<number[][]>([]);
  const [paths, setPaths] = useState<PathsState>({});
  const [solution, setSolution] = useState<PathsState>({});
  const [time, setTime] = useState(0);

  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);

  const [activeColor, setActiveColor] = useState<number | null>(null);
  const isFinishedRef = useRef(false);
  const boardSizeRef = useRef(0);

  useEffect(() => {
    const initGame = async () => {
      if (isResumed && !isDaily) {
        const saved = await loadGameState('connect');
        if (saved) {
          setBoard(saved.board);
          setPaths(saved.paths || {});
          setSolution(saved.solution);
          setTime(saved.time);
          setIsLoading(false);
          return;
        }
      }
      
      const rng = isDaily ? getSeededRandom(getTodaySeed()) : Math.random;
      const data = getConnectBoard(difficulty || 'medium', rng);
      setBoard(data.board);
      setSolution(data.solution);
      setPaths({});
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
    if (isDaily) await markDailyCompleted('connect');
    await clearGameState('connect');
    setTimeout(() => navigation.navigate('QueensResult', { won: true, time, difficulty, isDaily }), 500); 
  };

  const getCellFromCoords = (x: number, y: number) => {
    const size = board.length;
    if (size === 0 || boardSizeRef.current === 0) return null;
    const cellSize = boardSizeRef.current / size;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r >= 0 && r < size && c >= 0 && c < size) return { r, c };
    return null;
  };

  const onPanStart = (x: number, y: number) => {
    if (isFinishedRef.current) return;
    const cell = getCellFromCoords(x, y);
    if (!cell) return;

    const endpointColor = board[cell.r][cell.c];
    
    if (endpointColor !== 0) {
      setActiveColor(endpointColor);
      setPaths(prev => ({ ...prev, [endpointColor]: [cell] }));
    } else {
      for (const [colorIdStr, path] of Object.entries(paths)) {
        const index = path.findIndex(p => p.r === cell.r && p.c === cell.c);
        if (index !== -1) {
          const colorId = parseInt(colorIdStr);
          setActiveColor(colorId);
          setPaths(prev => ({ ...prev, [colorId]: path.slice(0, index + 1) }));
          break;
        }
      }
    }
  };

  const onPanUpdate = (x: number, y: number) => {
    if (!activeColor || isFinishedRef.current) return;
    const cell = getCellFromCoords(x, y);
    if (!cell) return;

    setPaths(prev => {
      const currentPath = prev[activeColor] || [];
      if (currentPath.length === 0) return prev;

      const lastCell = currentPath[currentPath.length - 1];

      // ✨ BACKTRACK LOGIC: If user reverses into the previous cell, erase the last step!
      if (currentPath.length >= 2) {
        const prevCell = currentPath[currentPath.length - 2];
        if (prevCell.r === cell.r && prevCell.c === cell.c) {
          let newPaths = { ...prev };
          newPaths[activeColor] = currentPath.slice(0, -1);
          return newPaths;
        }
      }

      if (lastCell.r === cell.r && lastCell.c === cell.c) return prev;
      if (!isAdjacent(lastCell.r, lastCell.c, cell.r, cell.c)) return prev;

      let newPaths = { ...prev };
      
      for (const [colorIdStr, path] of Object.entries(newPaths)) {
        const colorId = parseInt(colorIdStr);
        if (colorId === activeColor) continue;
        const collisionIndex = path.findIndex(p => p.r === cell.r && p.c === cell.c);
        if (collisionIndex !== -1) {
          newPaths[colorId] = path.slice(0, collisionIndex);
        }
      }

      const targetEndpoint = board[cell.r][cell.c];
      if (targetEndpoint !== 0 && targetEndpoint !== activeColor) return newPaths;

      newPaths[activeColor] = [...currentPath, cell];
      return newPaths;
    });
  };

  const onPanEnd = () => {
    setActiveColor(null);
    if (checkWinCondition(board, paths)) {
      handleWin();
    } else if (!isDaily) {
      saveGameState('connect', { board, paths, solution, time });
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => runOnJS(onPanStart)(e.x, e.y))
    .onUpdate((e) => runOnJS(onPanUpdate)(e.x, e.y))
    .onEnd(() => runOnJS(onPanEnd)());

  const handleHint = () => {
    if (hintCooldown > 0 || isFinishedRef.current) return;

    let targetColorToSolve: number | null = null;
    
    for (const [colorIdStr, correctPath] of Object.entries(solution)) {
      const colorId = parseInt(colorIdStr);
      const userPath = paths[colorId] || [];
      
      const start = correctPath[0];
      const end = correctPath[correctPath.length - 1];

      const isConnected = userPath.length > 1 && 
        ((userPath[0].r === start.r && userPath[0].c === start.c && userPath[userPath.length-1].r === end.r && userPath[userPath.length-1].c === end.c) ||
         (userPath[0].r === end.r && userPath[0].c === end.c && userPath[userPath.length-1].r === start.r && userPath[userPath.length-1].c === start.c));

      if (!isConnected) {
        targetColorToSolve = colorId;
        break;
      }
    }

    if (targetColorToSolve) {
      const correctPath = solution[targetColorToSolve];
      
      setPaths(prev => {
        let newPaths = { ...prev };
        correctPath.forEach(cell => {
          Object.keys(newPaths).forEach(idStr => {
            const cid = parseInt(idStr);
            if (cid !== targetColorToSolve) {
              const collisionIdx = newPaths[cid].findIndex(p => p.r === cell.r && p.c === cell.c);
              if (collisionIdx !== -1) newPaths[cid] = newPaths[cid].slice(0, collisionIdx);
            }
          });
        });

        newPaths[targetColorToSolve] = correctPath;
        
        if (checkWinCondition(board, newPaths)) {
          handleWin();
        } else if (!isDaily) {
          saveGameState('connect', { board, paths: newPaths, solution, time });
        }
        
        return newPaths;
      });

      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) setHintCooldown(60);
        return newTotal;
      });
    }
  };

  if (isLoading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.text}/></View>;

  const size = board.length;
  const boardDisplaySize = Math.min(width - 40, height - 200, 500); 
  const cellSize = boardDisplaySize / size;
  const pathThickness = cellSize * 0.35; 

  const getCellConnections = (r: number, c: number) => {
    for (const [colorIdStr, path] of Object.entries(paths)) {
      const index = path.findIndex(p => p.r === r && p.c === c);
      if (index !== -1) {
        const color = PATH_COLORS[parseInt(colorIdStr)];
        let up = false, down = false, left = false, right = false;

        if (index > 0) {
          const prev = path[index - 1];
          if (prev.r < r) up = true;
          if (prev.r > r) down = true;
          if (prev.c < c) left = true;
          if (prev.c > c) right = true;
        }
        if (index < path.length - 1) {
          const next = path[index + 1];
          if (next.r < r) up = true;
          if (next.r > r) down = true;
          if (next.c < c) left = true;
          if (next.c > c) right = true;
        }
        return { color, up, down, left, right };
      }
    }
    return null;
  };

  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) hintButtonText = `⏳ ${hintCooldown}s`;
  else if (hintsUsedThisGame < 3) hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={[styles.header, { backgroundColor: colors.fixedBackground }]}>
          <Text style={[styles.headerText, { color: colors.text }]}>⏱ {time}s | {isDaily ? '🌟 Daily' : '🔗 Connect'}</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={[styles.ctrlBtn, { backgroundColor: colors.selected }]}>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: 'bold' }}>🏠 Çık</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleHint} disabled={hintCooldown > 0} style={[styles.ctrlBtn, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.text }, hintCooldown > 0 && { opacity: 0.5 }]}>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: 'bold' }}>{hintButtonText}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPaths({})} style={[styles.ctrlBtn, { backgroundColor: colors.selected }]}>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: 'bold' }}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.boardWrapper}>
          <GestureDetector gesture={panGesture}>
            <View 
              style={[styles.boardContainer, { width: boardDisplaySize, height: boardDisplaySize, backgroundColor: colors.input }]}
              onLayout={(e) => { boardSizeRef.current = e.nativeEvent.layout.width; }}
            >
              {board.map((row, r) => (
                <View key={`row-${r}`} style={styles.row}>
                  {row.map((val, c) => {
                    const conn = getCellConnections(r, c);
                    return (
                      <View key={`cell-${r}-${c}`} style={[styles.cell, { width: cellSize, height: cellSize, borderColor: colors.background }]}>
                        
                        {conn && (
                          <>
                            <View style={{ position: 'absolute', width: pathThickness, height: pathThickness, backgroundColor: conn.color, borderRadius: pathThickness / 2 }} />
                            
                            {conn.up && <View style={{ position: 'absolute', top: 0, width: pathThickness, height: '50%', backgroundColor: conn.color }} />}
                            {conn.down && <View style={{ position: 'absolute', bottom: 0, width: pathThickness, height: '50%', backgroundColor: conn.color }} />}
                            {conn.left && <View style={{ position: 'absolute', left: 0, height: pathThickness, width: '50%', backgroundColor: conn.color }} />}
                            {conn.right && <View style={{ position: 'absolute', right: 0, height: pathThickness, width: '50%', backgroundColor: conn.color }} />}
                          </>
                        )}
                        
                        {val !== 0 && (
                          <View style={[styles.endpoint, { backgroundColor: PATH_COLORS[val], width: cellSize * 0.65, height: cellSize * 0.65 }]} />
                        )}

                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </GestureDetector>
        </View>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, alignItems: 'center', elevation: 4, zIndex: 10 },
  headerText: { fontSize: 22, fontWeight: '800', marginBottom: 15 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 300 },
  ctrlBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  boardWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  boardContainer: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, borderRadius: 8 },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  endpoint: { borderRadius: 100, elevation: 2 },
});