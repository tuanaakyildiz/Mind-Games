import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveGameState = async (gameName: string, state: any) => {
  try {
    await AsyncStorage.setItem(`@save_${gameName}`, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
};

export const loadGameState = async (gameName: string) => {
  try {
    const data = await AsyncStorage.getItem(`@save_${gameName}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearGameState = async (gameName: string) => {
  try {
    await AsyncStorage.removeItem(`@save_${gameName}`);
  } catch (e) {
    console.error("Failed to clear game state:", e);
  }
};