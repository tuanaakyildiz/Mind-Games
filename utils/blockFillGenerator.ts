import { BlockFillBoardData } from './types';

// A simple deterministic PRNG if a seed is provided
export function createRNG(seed?: number) {
  if (seed === undefined) return Math.random;
  let t = seed += 0x6D2B79F5;
  return function() {
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

interface Point {
  r: number;
  c: number;
}

export interface BlockFillGenerationResult {
  board: BlockFillBoardData;
  startPos: Point;
  optimalMoves: number;
  width: number;
  height: number;
  totalPaths: number;
}

const DIRS = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 }
];

export function generateBlockFillBoard(targetMoves: number, rng = Math.random): BlockFillGenerationResult {
  const minSize = Math.min(15, Math.max(7, Math.floor(targetMoves / 3) + 4));
  const maxSize = Math.min(15, minSize + 5);

  let W = Math.floor(rng() * (maxSize - minSize + 1)) + minSize;
  let H = Math.floor(rng() * (maxSize - minSize + 1)) + minSize;

  let grid = Array(H).fill(0).map(() => Array(W).fill('wall'));

  const startR = Math.floor(H / 2);
  const startC = Math.floor(W / 2);
  grid[startR][startC] = 'path';

  let branches = 0;
  let failCount = 0;
  
  // The agent tracks the current block position in our simulation
  let agentR = startR;
  let agentC = startC;

  while (failCount < 150) {
    if (branches * 1.5 >= targetMoves) break;

    // We have two choices: Carve a new path, or Slide to a different location
    // 70% chance to carve, 30% chance to slide
    if (rng() < 0.7) {
      // CARVE
      const dIdx = Math.floor(rng() * DIRS.length);
      const d = DIRS[dIdx];

      // Random length to carve
      const maxL = Math.floor(rng() * (Math.max(W, H) / 2)) + 2; 

      let successLength = 0;
      for (let l = 1; l <= maxL; l++) {
        const cr = agentR + d.r * l;
        const cc = agentC + d.c * l;

        if (cr < 0 || cr >= H || cc < 0 || cc >= W) break; 
        if (grid[cr][cc] !== 'wall') break;

        const dPerpR = d.c; 
        const dPerpC = d.r;
        
        const n1r = cr + dPerpR, n1c = cc + dPerpC;
        const n2r = cr - dPerpR, n2c = cc - dPerpC;

        if (n1r >= 0 && n1r < H && n1c >= 0 && n1c < W && grid[n1r][n1c] === 'path') break;
        if (n2r >= 0 && n2r < H && n2c >= 0 && n2c < W && grid[n2r][n2c] === 'path') break;

        const n3r = cr + d.r, n3c = cc + d.c;
        if (n3r >= 0 && n3r < H && n3c >= 0 && n3c < W && grid[n3r][n3c] === 'path') break;

        successLength = l;
      }

      if (successLength >= 2) {
        // Safe to carve. The new path won't merge or cross anything.
        for (let l = 1; l <= successLength; l++) {
          grid[agentR + d.r * l][agentC + d.c * l] = 'path';
        }
        agentR = agentR + d.r * successLength;
        agentC = agentC + d.c * successLength;
        
        branches++;
        failCount = 0;
      } else {
        failCount++;
      }
    } else {
      // SLIDE (mimics player behavior)
      const dIdx = Math.floor(rng() * DIRS.length);
      const d = DIRS[dIdx];
      
      let cr = agentR;
      let cc = agentC;
      let moved = false;
      while (true) {
        const nr = cr + d.r;
        const nc = cc + d.c;
        if (nr < 0 || nr >= H || nc < 0 || nc >= W) break;
        if (grid[nr][nc] === 'wall') break;
        cr = nr;
        cc = nc;
        moved = true;
      }
      if (moved) {
        agentR = cr;
        agentC = cc;
      } else {
        failCount++;
      }
    }
  }

  // To make the player traverse the maze we generated,
  // we can use the original startR/startC as the player's start position.
  // Because the agent started there and made valid moves to build the maze, 
  // the player can reverse-traverse to visit everything.
  // Wait, no: the agent made forward moves from startR, startC to touch every leaf.
  // So a player starting at startR, startC can absolutely reach every leaf exactly as the agent did.
  
  const optimalMoves = Math.floor(branches * 1.5) || 1;

  let totalPaths = 0;
  const boardData: BlockFillBoardData = grid.map(row => 
    row.map(cell => {
      if (cell === 'path') totalPaths++;
      return {
        type: cell as 'wall' | 'path',
        isPainted: false
      };
    })
  );

  boardData[startR][startC].isPainted = true;

  return {
    board: boardData,
    startPos: { r: startR, c: startC },
    optimalMoves,
    width: W,
    height: H,
    totalPaths
  };
}
