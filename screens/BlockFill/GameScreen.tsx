import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Easing, PanResponder, Text, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { generateBlockFillBoard, BlockFillGenerationResult, createRNG } from '../../utils/blockFillGenerator';
import { getTodaySeed } from '../../utils/dailyManager';

const Tile = React.memo(({ isPainted, isWall, size, color }: any) => {
  const scale = useRef(new Animated.Value(isPainted ? 1 : 0)).current;

  useEffect(() => {
    if (isPainted) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [isPainted]);

  if (isWall) {
    return (
      <View style={{ width: size, height: size, padding: size * 0.05 }} />
    );
  }

  return (
    <View style={{ width: size, height: size, padding: size * 0.05 }}>
      {/* Background path tile */}
      <View style={{ flex: 1, backgroundColor: 'rgba(150, 150, 150, 0.2)', borderRadius: size * 0.15 }} />
      {/* Painted overlay */}
      <Animated.View style={{
        position: 'absolute',
        top: size * 0.05, left: size * 0.05, right: size * 0.05, bottom: size * 0.05,
        backgroundColor: color,
        borderRadius: size * 0.15,
        transform: [{ scale }]
      }} />
    </View>
  );
});

export default function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { difficulty, isDaily, startDifficultyIndex = 0 } = route.params || {};

  const [levelData, setLevelData] = useState<BlockFillGenerationResult | null>(null);
  const [board, setBoard] = useState<any[][]>([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [paintedCount, setPaintedCount] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const isMoving = useRef(false);
  const playerAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Use a state ref so stable callbacks (like keyboard and panResponder) can access the latest values
  // without needing to be recreated.
  const stateRef = useRef({ levelData, board, playerPos });
  useEffect(() => {
    stateRef.current = { levelData, board, playerPos };
  }, [levelData, board, playerPos]);

  useEffect(() => {
    let targetMoves = 5;
    if (difficulty === 'medium') targetMoves = 10;
    if (difficulty === 'hard') targetMoves = 15 + startDifficultyIndex * 3;
    if (isDaily) targetMoves = 12;

    const rng = isDaily ? createRNG(getTodaySeed()) : Math.random;
    const generated = generateBlockFillBoard(targetMoves, rng);
    
    setLevelData(generated);
    setBoard(generated.board);
    setPlayerPos({ r: generated.startPos.r, c: generated.startPos.c });
    setPaintedCount(1);
    setStartTime(Date.now());
  }, [difficulty, isDaily, startDifficultyIndex]);

  const boardLayout = useMemo(() => {
    if (!levelData) return { tileSize: 0, boardW: 0, boardH: 0 };
    const maxW = screenWidth * 0.95;
    const maxH = screenHeight * 0.65;
    const sizeMaxW = maxW / levelData.width;
    const sizeMaxH = maxH / levelData.height;
    const tileSize = Math.min(sizeMaxW, sizeMaxH);
    return {
      tileSize,
      boardW: levelData.width * tileSize,
      boardH: levelData.height * tileSize
    };
  }, [levelData, screenWidth, screenHeight]);

  useEffect(() => {
    if (levelData) {
      playerAnim.setValue({
        x: levelData.startPos.c * boardLayout.tileSize,
        y: levelData.startPos.r * boardLayout.tileSize
      });
    }
  }, [levelData, boardLayout]);

  const swipeHandler = useCallback((dr: number, dc: number) => {
    const { playerPos: currentPos, board: currentBoard, levelData: currentLevel } = stateRef.current;
    if (isMoving.current || !currentLevel) return;

    let cr = currentPos.r;
    let cc = currentPos.c;
    let distance = 0;
    const intermediateTiles: { r: number, c: number }[] = [];

    while (true) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= currentLevel.height || nc < 0 || nc >= currentLevel.width) break;
      if (currentBoard[nr][nc].type === 'wall') break;
      
      cr = nr;
      cc = nc;
      distance++;
      intermediateTiles.push({ r: cr, c: cc });
    }

    if (distance === 0) return;

    isMoving.current = true;
    const duration = Math.max(100, distance * 30);

    Animated.timing(playerAnim, {
      toValue: { x: cc * boardLayout.tileSize, y: cr * boardLayout.tileSize },
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      isMoving.current = false;
      setPlayerPos({ r: cr, c: cc });
    });

    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      let newlyPainted = 0;
      for (const t of intermediateTiles) {
        if (!newBoard[t.r][t.c].isPainted) {
          newBoard[t.r][t.c].isPainted = true;
          newlyPainted++;
        }
      }
      setPaintedCount(curr => curr + newlyPainted);
      return newBoard;
    });
  }, [boardLayout.tileSize, playerAnim]); // depend on unchanging refs/layout

  useEffect(() => {
    if (!levelData) return;
    if (paintedCount >= levelData.totalPaths) {
      setTimeout(() => {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        navigation.replace('BlockFillResult', {
          time: timeTaken,
          difficulty,
          isDaily,
          startDifficultyIndex
        });
      }, 300);
    }
  }, [paintedCount, levelData, difficulty, isDaily, startDifficultyIndex, navigation, startTime]);

  // Keyboard controls for Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        switch(e.key) {
          case 'ArrowUp': swipeHandler(-1, 0); break;
          case 'ArrowDown': swipeHandler(1, 0); break;
          case 'ArrowLeft': swipeHandler(0, -1); break;
          case 'ArrowRight': swipeHandler(0, 1); break;
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [swipeHandler]);

  // Stable PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only claim the pan responder if movement is significant (avoids intercepting simple taps)
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const ax = Math.abs(gestureState.dx);
        const ay = Math.abs(gestureState.dy);
        if (ax < 15 && ay < 15) return; 
        
        if (ax > ay) {
          swipeHandler(0, gestureState.dx > 0 ? 1 : -1);
        } else {
          swipeHandler(gestureState.dy > 0 ? 1 : -1, 0);
        }
      },
      // Capture swipe even if interrupted
      onPanResponderTerminate: (evt, gestureState) => {
        const ax = Math.abs(gestureState.dx);
        const ay = Math.abs(gestureState.dy);
        if (ax < 15 && ay < 15) return; 
        
        if (ax > ay) {
          swipeHandler(0, gestureState.dx > 0 ? 1 : -1);
        } else {
          swipeHandler(gestureState.dy > 0 ? 1 : -1, 0);
        }
      }
    })
  ).current;

  if (!levelData) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const paintColor = '#FF3366';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
      <Text style={[styles.title, { color: colors.text }]}>Level {startDifficultyIndex + 1}</Text>
      
      <View style={{ width: boardLayout.boardW, height: boardLayout.boardH }}>
        <View style={{ flexDirection: 'column' }}>
          {board.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <Tile 
                  key={`${r}-${c}`} 
                  isWall={cell.type === 'wall'} 
                  isPainted={cell.isPainted} 
                  size={boardLayout.tileSize} 
                  color={paintColor}
                />
              ))}
            </View>
          ))}
        </View>

        <Animated.View style={{
          position: 'absolute',
          width: boardLayout.tileSize,
          height: boardLayout.tileSize,
          padding: boardLayout.tileSize * 0.05,
          left: playerAnim.x,
          top: playerAnim.y,
        }}>
          <View style={{ flex: 1, backgroundColor: paintColor, borderRadius: boardLayout.tileSize * 0.15 }} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  }
});
