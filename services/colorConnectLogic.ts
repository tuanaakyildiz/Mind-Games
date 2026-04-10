export type ConnectBoard = number[][];
export type PathCoords = { r: number; c: number };
export type PathsState = Record<number, PathCoords[]>;

export const PATH_COLORS: Record<number, string> = {
  1: '#EF4444', // Red
  2: '#3B82F6', // Blue
  3: '#10B981', // Green
  4: '#F59E0B', // Yellow
  5: '#8B5CF6', // Purple
  6: '#06B6D4', // Cyan
  7: '#EC4899', // Pink
  8: '#F97316', // Orange
  9: '#84CC16', // Lime
};

export const isAdjacent = (r1: number, c1: number, r2: number, c2: number) => {
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
};

// ✨ The Reverse Merge Algorithm
const generateProceduralBoard = (size: number, numColors: number, rngFunc: () => number) => {
  let success = false;
  let finalPaths: PathCoords[][] = [];

  while (!success) {
    // 1. Start: Every cell is an independent path of length 1
    let paths: PathCoords[][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        paths.push([{ r, c }]);
      }
    }

    let stuck = false;
    
    // 2. Loop until we merge down to the target number of colors
    while (paths.length > numColors) {
      const possibleMerges: { p1: number; p2: number; e1: number; e2: number }[] = [];

      // Find all adjacent endpoints belonging to DIFFERENT paths
      for (let i = 0; i < paths.length; i++) {
        for (let j = i + 1; j < paths.length; j++) {
          const p1 = paths[i];
          const p2 = paths[j];

          const p1Check = p1.length === 1 ? [p1[0]] : [p1[0], p1[p1.length - 1]];
          const p2Check = p2.length === 1 ? [p2[0]] : [p2[0], p2[p2.length - 1]];

          for (let e1 = 0; e1 < p1Check.length; e1++) {
            for (let e2 = 0; e2 < p2Check.length; e2++) {
              if (isAdjacent(p1Check[e1].r, p1Check[e1].c, p2Check[e2].r, p2Check[e2].c)) {
                possibleMerges.push({ p1: i, p2: j, e1, e2 });
              }
            }
          }
        }
      }

      // If paths get hopelessly tangled, restart the fast generation loop
      if (possibleMerges.length === 0) {
        stuck = true;
        break; 
      }

      // 3. Pick a random valid connection and merge the two paths
      const merge = possibleMerges[Math.floor(rngFunc() * possibleMerges.length)];
      const path1 = paths[merge.p1];
      const path2 = paths[merge.p2];

      // Orient the arrays so the touching endpoints are in the middle, then combine
      if (merge.e1 === 0 && path1.length > 1) path1.reverse();
      if (merge.e2 === 1 && path2.length > 1) path2.reverse();
      const newPath = [...path1, ...path2];

      // Remove old paths, add merged path
      paths.splice(merge.p2, 1);
      paths.splice(merge.p1, 1);
      paths.push(newPath);
    }

    // A valid board must have paths longer than 1 cell to be playable
    if (!stuck && paths.every(p => p.length >= 2)) {
      success = true;
      finalPaths = paths;
    }
  }

  // 4. Convert the generated paths into a readable board format
  const board = Array(size).fill(0).map(() => Array(size).fill(0));
  const solution: PathsState = {};

  finalPaths.forEach((path, index) => {
    const color = index + 1;
    const start = path[0];
    const end = path[path.length - 1];
    board[start.r][start.c] = color;
    board[end.r][end.c] = color;
    solution[color] = path; // Save the solution for the Hint system!
  });

  return { board, solution };
};

export const getConnectBoard = (
  difficulty: 'easy' | 'medium' | 'hard', 
  rngFunc: () => number = Math.random
): { board: ConnectBoard, solution: PathsState } => {
  const size = difficulty === 'hard' ? 9 : difficulty === 'medium' ? 7 : 5;
  const colors = difficulty === 'hard' ? 9 : difficulty === 'medium' ? 7 : 5;
  
  return generateProceduralBoard(size, colors, rngFunc);
};

export const checkWinCondition = (board: ConnectBoard, paths: PathsState): boolean => {
  const size = board.length;
  let filledCells = 0;
  let activeEndpoints = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) activeEndpoints++;
    }
  }

  const expectedPaths = activeEndpoints / 2;
  let completedPaths = 0;

  Object.keys(paths).forEach(colorId => {
    const p = paths[parseInt(colorId)];
    filledCells += p.length;
    
    if (p.length > 1) {
      const start = p[0];
      const end = p[p.length - 1];
      if (board[start.r][start.c] === parseInt(colorId) && board[end.r][end.c] === parseInt(colorId)) {
        completedPaths++;
      }
    }
  });

  return completedPaths === expectedPaths && filledCells === (size * size);
};