import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Cell } from '../../utils/types';
import { generateSudoku } from '../../services/sudokuGenerator';
import { cloneGrid, isComplete } from '../../utils/helpers';
import { saveStreak, resetStreak } from '../../services/streakManager';
import { getSudokuHint } from '../../services/hintManager';
import { useTheme } from '../../context/ThemeContext';
import { getSeededRandom, getTodaySeed, markDailyCompleted } from '../../utils/dailyManager';

// ✨ CORRECTED IMPORTS: Now using the unified storage!
import { saveGameState, loadGameState, clearGameState } from '../../storage/storageUtils';

import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function SudokuGameScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { difficulty, isResumed, isDaily } = route.params;
  
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [numberUsage, setNumberUsage] = useState<{ [key: number]: number }>({});

  const [hintCooldown, setHintCooldown] = useState(0);
  const [suggestedHint, setSuggestedHint] = useState<{ row: number, col: number, value: number } | null>(null);
  const [hintsUsedThisGame, setHintsUsedThisGame] = useState(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.8, Math.min(savedScale.value * e.scale, 2.5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.0) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const animatedBoardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isLoading) {
        setTime((t) => t + 1);
        setHintCooldown((c) => (c > 0 ? c - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    const setupGame = async () => {
      if (isResumed && !isDaily) {
        const saved = await loadGameState('sudoku');
        if (saved) {
          setGrid(saved.grid);
          setSolution(saved.solution);
          setTime(saved.time);
          setMistakes(saved.mistakes);
          updateNumberUsage(saved.grid, saved.solution);
          setIsLoading(false);
          return;
        }
      }
      
      const rng = isDaily ? getSeededRandom(getTodaySeed()) : Math.random;
      const generated = generateSudoku(difficulty || 'medium', rng);
      
      setGrid(generated.puzzle);
      setSolution(generated.solution);
      updateNumberUsage(generated.puzzle, generated.solution);
      setIsLoading(false);
    };
    setupGame();
  }, [isResumed, difficulty, isDaily]);

  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return; 
      const key = e.key;
      const code = e.code; 
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        handleNumberInput(parseInt(key, 10));
      } else if (code && code.startsWith('Numpad')) {
        const num = parseInt(code.replace('Numpad', ''), 10);
        if (num >= 1 && num <= 9) handleNumberInput(num);
      } else if (key === 'Backspace' || key === 'Delete') {
        handleNumberInput(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, grid, isLoading]); 

  const updateNumberUsage = (currentGrid: Cell[][], currentSolution: number[][]) => {
    if (!currentSolution.length) return;
    const usage: { [key: number]: number } = {};
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = currentGrid[r][c];
        if (cell.value !== 0 && cell.value === currentSolution[r][c]) {
          usage[cell.value] = (usage[cell.value] || 0) + 1;
        }
      }
    }
    setNumberUsage(usage);
  };

  const handleNumberInput = async (num: number) => {
    if (!selectedCell || isLoading) return;
    const { row, col } = selectedCell;
    const currentCell = grid[row][col];
    if (currentCell.readOnly) return;
    const updatedGrid = cloneGrid(grid);

    if (num === 0 || currentCell.value === num) {
      updatedGrid[row][col] = { ...currentCell, value: 0 };
      setGrid(updatedGrid);
      updateNumberUsage(updatedGrid, solution);
      if (!isDaily) saveGameState('sudoku', { grid: updatedGrid, solution, mistakes, time });
      return; 
    }

    updatedGrid[row][col] = { value: num, readOnly: false, notes: [] };

    if (num !== solution[row][col]) {
      setMistakes((m) => {
        const newMistakes = m + 1;
        if (newMistakes >= 3) {
          resetStreak();
          navigation.goBack();
        }
        return newMistakes;
      });
    } else {
      if (suggestedHint && suggestedHint.row === row && suggestedHint.col === col) {
        setSuggestedHint(null);
        setHintsUsedThisGame(prev => {
          const newTotal = prev + 1;
          if (newTotal >= 3) setHintCooldown(60); 
          return newTotal;
        });
      }
    }

    setGrid(updatedGrid);
    updateNumberUsage(updatedGrid, solution);
    if (!isDaily) saveGameState('sudoku', { grid: updatedGrid, solution, mistakes, time });

    if (isComplete(updatedGrid, solution)) {
      await clearGameState('sudoku');
      saveStreak();
      if (isDaily) await markDailyCompleted('sudoku');
      navigation.navigate('SudokuResult', { time, mistakes, difficulty, isDaily });
    }
  };

  const handleHint = async () => {
    if (hintCooldown > 0 || isLoading) return;

    if (suggestedHint) {
      const updatedGrid = cloneGrid(grid);
      updatedGrid[suggestedHint.row][suggestedHint.col].value = suggestedHint.value;
      updatedGrid[suggestedHint.row][suggestedHint.col].readOnly = false;
      
      setGrid(updatedGrid);
      updateNumberUsage(updatedGrid, solution);
      if (!isDaily) saveGameState('sudoku', { grid: updatedGrid, solution, mistakes, time });
      
      setSuggestedHint(null);
      setHintsUsedThisGame(prev => {
        const newTotal = prev + 1;
        if (newTotal >= 3) setHintCooldown(60);    
        return newTotal;
      });
      
      if (isComplete(updatedGrid, solution)) {
        await clearGameState('sudoku');
        saveStreak();
        if (isDaily) await markDailyCompleted('sudoku');
        navigation.navigate('SudokuResult', { time, mistakes, difficulty, isDaily });
      }
      return;
    }

    const hint = getSudokuHint(grid, solution);
    if (hint) {
      setSuggestedHint(hint);
      setSelectedCell({ row: hint.row, col: hint.col });
    } else {
      alert("Tüm hücreler dolu!");
    }
  };

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
    const isIncorrect = cell.value !== 0 && cell.value !== solution[rowIndex][colIndex];
    const isSuggestedHint = suggestedHint?.row === rowIndex && suggestedHint?.col === colIndex;
    
    let isRelated = false;
    let isSameNumber = false;

    if (selectedCell) {
      if (
        rowIndex === selectedCell.row || colIndex === selectedCell.col ||
        (Math.floor(rowIndex / 3) === Math.floor(selectedCell.row / 3) && Math.floor(colIndex / 3) === Math.floor(selectedCell.col / 3))
      ) {
        isRelated = true;
      }
      const selectedValue = grid[selectedCell.row][selectedCell.col].value;
      if (selectedValue !== 0 && cell.value === selectedValue) {
        isSameNumber = true;
      }
    }

    const borderStyle = {
      borderTopWidth: rowIndex % 3 === 0 ? 2 : 0.5,
      borderLeftWidth: colIndex % 3 === 0 ? 2 : 0.5,
      borderRightWidth: colIndex === 8 ? 2 : 0, 
      borderBottomWidth: rowIndex === 8 ? 2 : 0,
    };

    let cellBg = 'transparent';
    if (isSuggestedHint) cellBg = 'rgba(255, 215, 0, 0.4)';
    else if (isSelected) cellBg = colors.selected; 
    else if (isIncorrect && !cell.readOnly) cellBg = '#ffcccc'; 
    else if (isSameNumber) cellBg = colors.highlight; 
    else if (isRelated) cellBg = colors.restricted; 
    else if (cell.readOnly) cellBg = colors.fixedBackground || 'rgba(150,150,150,0.2)'; 

    return (
      <TouchableOpacity
        key={colIndex}
        style={[styles.cell, borderStyle, { backgroundColor: cellBg, borderColor: colors.text }]}
        onPress={() => setSelectedCell({ row: rowIndex, col: colIndex })}
      >
        {cell.value !== 0 && (
          <Text style={[styles.cellText, { 
            color: cell.readOnly ? colors.text : (colors.userInput || colors.input), 
            fontWeight: cell.readOnly ? 'bold' : 'normal' 
          }]}>
            {cell.value}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  let hintButtonText = '🧠 İpucu';
  if (hintCooldown > 0) hintButtonText = `⏳ ${hintCooldown}s`;
  else if (suggestedHint) hintButtonText = `🔍 Çöz`;
  else if (hintsUsedThisGame < 3) hintButtonText = `🧠 İpucu (${3 - hintsUsedThisGame})`;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={styles.infoBar}>
          <Text style={[styles.infoText, { color: colors.text }]}>⏱ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>❤️ {3 - mistakes}</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>{isDaily ? '🌟 Daily' : difficulty}</Text>
        </View>

        <GestureDetector gesture={pinchGesture}>
          <Animated.View style={[styles.grid, animatedBoardStyle, { borderColor: colors.text }]}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
              </View>
            ))}
          </Animated.View>
        </GestureDetector>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleHint} style={[styles.controlBtn, hintCooldown > 0 && { opacity: 0.5 }]} disabled={hintCooldown > 0}>
            <Text style={[styles.noteToggle, { color: colors.text }, suggestedHint && { color: '#b8860b' }]}>
              {hintButtonText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.controlBtn}>
            <Text style={[styles.noteToggle, { color: colors.text }]}>🔄 Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.controlBtn}>
            <Text style={[styles.noteToggle, { color: colors.text }]}>🏠 Çık</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const used = numberUsage[num] || 0;
            const disabled = used >= 9;
            return (
              <TouchableOpacity
                key={num}
                style={[styles.numButton, { backgroundColor: disabled ? 'rgba(150,150,150,0.3)' : colors.input }]}
                onPress={() => !disabled && handleNumberInput(num)}
                disabled={disabled}
              >
                <Text style={[styles.numButtonText, { color: colors.text }]}>{num}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', justifyContent: 'flex-start', flexGrow: 1 },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 400, marginBottom: 12 },
  infoText: { fontSize: 16, fontWeight: 'bold' },
  grid: { width: '100%', maxWidth: 400, aspectRatio: 1, borderWidth: 2, backgroundColor: 'transparent' },
  row: { flexDirection: 'row', flex: 1 },
  cell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', maxWidth: 400, marginVertical: 20 },
  controlBtn: { padding: 8, alignItems: 'center' },
  noteToggle: { fontSize: 16, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 400, marginTop: 10 },
  numButton: { flex: 1, marginHorizontal: 3, aspectRatio: 0.8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  numButtonText: { fontSize: 22, fontWeight: 'bold' },
});