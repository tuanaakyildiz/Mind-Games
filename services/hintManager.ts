import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cell } from '../utils/types';

export const getStats = async () => {
  const stars = Number(await AsyncStorage.getItem('totalStars')) || 0;
  // Give new players 3 free hints to start!
  const hintsStr = await AsyncStorage.getItem('hintTokens');
  const hints = hintsStr ? Number(hintsStr) : 3; 
  return { stars, hints };
};

export const useHint = async () => {
  const stats = await getStats();
  if (stats.hints <= 0) return false; // Not enough hints
  await AsyncStorage.setItem('hintTokens', (stats.hints - 1).toString());
  return true; // Successfully used a hint
};

export const addStarsAndHints = async (starsToAdd: number) => {
  const { stars, hints } = await getStats();
  const newStars = stars + starsToAdd;
  // Grants 1 hint for every 15 stars earned
  const newHints = hints + Math.floor(newStars / 15) - Math.floor(stars / 15);
  await AsyncStorage.setItem('totalStars', newStars.toString());
  await AsyncStorage.setItem('hintTokens', newHints.toString());
};

// ✨ NEW: SUDOKU HINT LOGIC
export function getSudokuHint(grid: Cell[][], solution: number[][]): { row: number; col: number; value: number } | null {
  const emptyCells = [];
  // Find all empty cells
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === 0) {
        emptyCells.push({ row: r, col: c, value: solution[r][c] });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  // Pick a random empty cell so it acts as a dynamic "focus here" suggestion
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

// ✨ NEW: MINESWEEPER HINT LOGIC
export function getMinesweeperHint(board: any[][], revealed: boolean[][], flags: boolean[][], rows: number, cols: number): { row: number; col: number } | null {
  const safeHiddenCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Find cells that are NOT bombs, NOT revealed, and NOT flagged
      if (board[r][c] !== '💣' && !revealed[r][c] && !flags[r][c]) {
        safeHiddenCells.push({ row: r, col: c });
      }
    }
  }
  if (safeHiddenCells.length === 0) return null;
  // Pick a random guaranteed safe cell for the player
  const randomIndex = Math.floor(Math.random() * safeHiddenCells.length);
  return safeHiddenCells[randomIndex];
}