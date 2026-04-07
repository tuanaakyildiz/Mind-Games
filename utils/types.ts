export type Cell = {
  value: number;
  readOnly: boolean;
  notes: number[];
};

// export type RootStackParamList = {
//   Home: undefined;
//   Difficulty: undefined;
//   Game: { difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'; resume?: boolean };
//   Result: { time: number; mistakes: number; difficulty: string };
//   Stats: undefined;
// };
export type RootStackParamList = {
  Home: undefined;
  SudokuDifficulty: undefined;
  SudokuGame: { difficulty: "easy" | "medium" | "hard" | "extreme"; resume?: boolean };
  SudokuResult: { time: number; mistakes: number; difficulty: string };
  SudokuStats: undefined;
  MinesweeperDifficulty: undefined;
  MinesweeperGame: { rows: number; cols: number; mines: number };
  MinesweeperResult: { time: number; status: 'won' | 'lost' };
  QueensDifficulty: undefined;
  QueensGame: { difficulty: 'easy' | 'medium' | 'hard' };
  QueensResult: { won: boolean; time: number; difficulty: 'easy' | 'medium' | 'hard' };
  

};



export type CellState = 'empty' | 'star' | 'cross';

export interface QueensCell {
  row: number;
  col: number;
  regionId: number; // 0-4 mapping to your theme colors
  state: CellState;
  isError: boolean;
}

export type QueensBoard = QueensCell[][];