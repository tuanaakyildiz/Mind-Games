import { QueensBoard, QueensCell } from '../utils/types';

// Randomly place stars without violating rules
const placeStars = (size: number): [number, number][] | null => {
  const board = Array(size).fill(0).map(() => Array(size).fill(false));
  const stars: [number, number][] = [];

  const isSafe = (r: number, c: number) => {
    for (let i = 0; i < size; i++) if (board[r][i] || board[i][c]) return false;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc]) return false;
    }
    return true;
  };

  const solve = (row: number): boolean => {
    if (row === size) return true;
    // Randomize column order for endless variety
    const cols = Array.from({ length: size }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (const c of cols) {
      if (isSafe(row, c)) {
        board[row][c] = true;
        stars.push([row, c]);
        if (solve(row + 1)) return true;
        board[row][c] = false;
        stars.pop();
      }
    }
    return false;
  };

  solve(0);
  return stars;
};

// Grow contiguous regions around the placed stars
const generateRegions = (size: number, stars: [number, number][]) => {
  const regions = Array(size).fill(0).map(() => Array(size).fill(-1));
  let emptyCount = size * size;
  const frontier: { r: number, c: number, id: number }[] = [];

  // Seed the regions with the stars
  stars.forEach(([r, c], i) => {
    regions[r][c] = i;
    emptyCount--;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        frontier.push({ r: nr, c: nc, id: i });
      }
    }
  });

  // Randomly grow regions
  while (emptyCount > 0 && frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const { r, c, id } = frontier.splice(idx, 1)[0];

    if (regions[r][c] === -1) {
      regions[r][c] = id;
      emptyCount--;
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
          frontier.push({ r: nr, c: nc, id });
        }
      }
    }
  }
  return regions;
};

export const getQueensBoard = (difficulty: 'easy' | 'medium' | 'hard'): { board: QueensBoard, solution: [number, number][] } => {
  const size = difficulty === 'hard' ? 9 : difficulty === 'medium' ? 7 : 5;
  
  // 1. Generate random solution
  let solution = placeStars(size);
  // Fallback just in case the randomizer gets stuck
  while (!solution) solution = placeStars(size); 

  // 2. Wrap regions around the solution
  const regions = generateRegions(size, solution);

  // 3. Format it for your UI
  const board = regions.map((row, rIdx) =>
    row.map((regionId, cIdx): QueensCell => ({
      row: rIdx, col: cIdx, regionId, state: 'empty', isError: false,
    }))
  );

  return { board, solution };
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