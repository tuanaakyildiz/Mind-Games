import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. A Seeded PRNG. If you give it the same seed, it always outputs the same sequence of numbers.
export function getSeededRandom(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 2. Generates a unique number for today (e.g., 20260409)
export const getTodaySeed = (): number => {
  const d = new Date();
  return Number(`${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`);
};

// 3. Check if the daily challenge is already completed
export const checkDailyStatus = async (gameName: string): Promise<boolean> => {
  const todayKey = `${gameName}_daily_${getTodaySeed()}`;
  const status = await AsyncStorage.getItem(todayKey);
  return status === 'completed';
};

// 4. Mark today's challenge as completed
export const markDailyCompleted = async (gameName: string): Promise<void> => {
  const todayKey = `${gameName}_daily_${getTodaySeed()}`;
  await AsyncStorage.setItem(todayKey, 'completed');
};