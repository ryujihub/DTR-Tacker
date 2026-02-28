import { Platform } from 'react-native';

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  morningIn: string | null; morningOut: string | null;
  afternoonIn: string | null; afternoonOut: string | null;
  overtimeIn: string | null; overtimeOut: string | null;
  totalHours: number;
}

export interface UserProfile {
  name: string; position: string; dept: string;
}

const RECORDS_KEY = 'dtr_daily_records';
const PROFILE_KEY = 'dtr_user_profile';

// Session-level cache to ensure work is kept even if storage fails temporarily
let sessionRecords: DailyRecord[] | null = null;
let sessionProfile: UserProfile | null = null;

const getEngine = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage;
  }
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage) return AsyncStorage;
  } catch (e) {
    console.warn('[Storage] Native engine not ready yet.');
  }
  return null;
};

export const getDailyRecords = async (): Promise<DailyRecord[]> => {
  // 1. Check session cache first
  if (sessionRecords) return sessionRecords;

  try {
    const engine = getEngine();
    if (!engine) return [];

    const data = await engine.getItem(RECORDS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    sessionRecords = parsed; // Sync to cache
    return parsed;
  } catch (e) {
    console.error('[Storage] Error loading records:', e);
    return sessionRecords || [];
  }
};

export const saveDailyRecord = async (record: DailyRecord) => {
  try {
    const existing = await getDailyRecords();
    const index = existing.findIndex(r => r.date === record.date);

    if (index > -1) {
      existing[index] = record;
    } else {
      existing.unshift(record);
    }

    existing.sort((a, b) => b.date.localeCompare(a.date));
    sessionRecords = [...existing]; // Update session cache

    const engine = getEngine();
    if (engine) {
      await engine.setItem(RECORDS_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.error('[Storage] Error saving record:', e);
  }
};

export const deleteDailyRecord = async (date: string) => {
  try {
    const existing = await getDailyRecords();
    const filtered = existing.filter(r => r.date !== date);
    sessionRecords = filtered;

    const engine = getEngine();
    if (engine) {
      await engine.setItem(RECORDS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('[Storage] Error deleting record:', e);
  }
};

export const saveProfile = async (profile: UserProfile) => {
  try {
    sessionProfile = profile;
    const engine = getEngine();
    if (engine) {
      await engine.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  } catch (e) {
    console.error('[Storage] Error saving profile:', e);
  }
};

export const getProfile = async (): Promise<UserProfile> => {
  if (sessionProfile) return sessionProfile;

  try {
    const engine = getEngine();
    if (!engine) return { name: '', position: '', dept: '' };

    const data = await engine.getItem(PROFILE_KEY);
    const parsed = data ? JSON.parse(data) : { name: '', position: '', dept: '' };
    sessionProfile = parsed;
    return parsed;
  } catch (e) {
    return sessionProfile || { name: '', position: '', dept: '' };
  }
};

export const clearAllData = async () => {
  try {
    sessionRecords = null;
    sessionProfile = null;
    const engine = getEngine();
    if (engine) {
      await engine.removeItem(RECORDS_KEY);
      await engine.removeItem(PROFILE_KEY);
    }
  } catch (e) { }
};
