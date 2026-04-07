import { QueensBoard, QueensCell } from '../utils/types';

// Define the valid difficulty levels
export type DifficultyLevels = 'easy' | 'medium' | 'hard';

// Hardcoded region maps (Numbers represent region IDs)
// Using Record ensures TypeScript knows exactly what keys and values this object has.
const LEVELS: Record<DifficultyLevels, number[][]> = {
  easy: [ // 5x5 board (regions 0-4)
    [0, 0, 1, 1, 1],
    [0, 2, 2, 1, 3],
    [0, 0, 2, 3, 3],
    [4, 4, 4, 3, 3],
    [4, 4, 4, 4, 4],
  ],
  medium: [ // 7x7 board (regions 0-6)
    [0, 0, 1, 1, 1, 2, 2],
    [0, 0, 1, 3, 1, 2, 2],
    [0, 4, 3, 3, 3, 5, 2],
    [4, 4, 4, 3, 5, 5, 5],
    [4, 6, 6, 6, 6, 6, 5],
    [4, 4, 4, 4, 6, 5, 5],
    [4, 4, 4, 4, 6, 6, 6],
  ],
  hard: [ // 9x9 board (regions 0-8)
    [0, 0, 0, 1, 1, 2, 2, 2, 2],
    [0, 3, 0, 1, 1, 2, 4, 4, 2],
    [0, 3, 3, 3, 1, 2, 4, 4, 2],
    [0, 0, 3, 1, 1, 5, 5, 4, 4],
    [6, 3, 3, 3, 5, 5, 5, 5, 4],
    [6, 6, 6, 7, 7, 5, 8, 5, 4],
    [6, 7, 7, 7, 7, 5, 8, 8, 8],
    [6, 6, 7, 7, 8, 8, 8, 8, 8],
    [6, 6, 6, 6, 6, 6, 8, 8, 8],
  ],
};

export const getQueensBoard = (difficulty: DifficultyLevels): QueensBoard => {
  const map = LEVELS[difficulty] || LEVELS.easy;
  
  // Explicitly typing 'row', 'rIdx', 'regionId', and 'cIdx' removes the TS7006 errors
  return map.map((row: number[], rIdx: number) =>
    row.map((regionId: number, cIdx: number): QueensCell => ({
      row: rIdx,
      col: cIdx,
      regionId,
      state: 'empty',
      isError: false,
    }))
  );
};

export const validateBoard = (board: QueensBoard): QueensBoard => {
  const size = board.length;
  // Deep copy to avoid direct mutation
  const newBoard = board.map(row => row.map(cell => ({ ...cell, isError: false })));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (newBoard[r][c].state !== 'star') continue;

      const cell = newBoard[r][c];
      let hasError = false;

      // 1. Check Row & Column
      for (let i = 0; i < size; i++) {
        if (i !== c && newBoard[r][i].state === 'star') { newBoard[r][i].isError = true; hasError = true; }
        if (i !== r && newBoard[i][c].state === 'star') { newBoard[i][c].isError = true; hasError = true; }
      }

      // 2. Check Region
      for (let r2 = 0; r2 < size; r2++) {
        for (let c2 = 0; c2 < size; c2++) {
          if ((r2 !== r || c2 !== c) && newBoard[r2][c2].regionId === cell.regionId && newBoard[r2][c2].state === 'star') {
            newBoard[r2][c2].isError = true;
            hasError = true;
          }
        }
      }

      // 3. Check Adjacency (Diagonals included)
      const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      for (const [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && newBoard[nr][nc].state === 'star') {
          newBoard[nr][nc].isError = true;
          hasError = true;
        }
      }

      if (hasError) cell.isError = true;
    }
  }
  return newBoard;
};

export const isGameWon = (board: QueensBoard): boolean => {
  const size = board.length;
  let starCount = 0;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].isError) return false;
      if (board[r][c].state === 'star') starCount++;
    }
  }
  return starCount === size; // 1 star per row/col/region
};