import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../utils/types';
import HomeScreen from '../screens/HomeScreen';
import SudokuGameScreen from '../screens/Sudoku/GameScreen';
import SudokuStatsScreen from '../screens/Sudoku/StatsScreen';
import SudokuResultScreen from '../screens/Sudoku/ResultScreen';
import SudokuDifficulty from '../screens/Sudoku/DifficultyScreen';
import MinesweeperGameScreen from '../screens/Minesweeper/GameScreen';
import MinesweeperDifficulty from '../screens/Minesweeper/DifficultyScreen';
import MinesweeperResultScreen from '../screens/Minesweeper/ResultScreen';
import { NavBar } from '../components/Navbar';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        header: () => <NavBar />
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SudokuDifficulty" component={SudokuDifficulty} />
      <Stack.Screen name="SudokuGame" component={SudokuGameScreen} />
      <Stack.Screen name="SudokuResult" component={SudokuResultScreen} />
      <Stack.Screen name="SudokuStats" component={SudokuStatsScreen} />
      <Stack.Screen name="MinesweeperDifficulty" component={MinesweeperDifficulty} />
      <Stack.Screen name="MinesweeperGame" component={MinesweeperGameScreen} />
      <Stack.Screen name="MinesweeperResult" component={MinesweeperResultScreen} />
    </Stack.Navigator>
  );
}