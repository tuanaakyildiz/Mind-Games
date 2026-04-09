// ✨ Pass rngFunc as an optional parameter, defaulting to Math.random
export function generateBoard(
  rows: number, 
  cols: number, 
  mines: number, 
  rngFunc: () => number = Math.random
): (string | number)[][] {
  const board: (string | number)[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  let placed = 0;
  while (placed < mines) {
    // ✨ Use rngFunc() instead of Math.random()
    const r = Math.floor(rngFunc() * rows);
    const c = Math.floor(rngFunc() * cols);
    
    if (board[r][c] === '💣') continue;
    board[r][c] = '💣';
    placed++;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === '💣') continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === '💣') {
            count++;
          }
        }
      }
      board[r][c] = count;
    }
  }
  return board;
}