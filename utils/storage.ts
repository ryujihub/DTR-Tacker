
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

export interface SystemSettings {
  use24Hour: boolean;
  theme: 'light' | 'dark' | 'system';
  hasSeenOnboarding: boolean;
  /** Optional target goal in hours (e.g., 486) */
  goalHours?: number | null;
}

const RECORDS_KEY = 'dtr_daily_records';
const PROFILE_KEY = 'dtr_user_profile';
const SETTINGS_KEY = 'dtr_system_settings';

// --- ROBUST STORAGE ENGINE ---
let _engine: any = null;
const memoryBackup = new Map<string, string>();

const getEngine = () => {
  if (_engine) return _engine;

  // 1. Try Browser/Polyfilled LocalStorage
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      // Quick test to see if it actually works (some environments have it but it throws)
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');

      _engine = {
        getItem: (k: string) => Promise.resolve(localStorage.getItem(k)),
        setItem: (k: string, v: string) => { localStorage.setItem(k, v); return Promise.resolve(); },
        removeItem: (k: string) => { localStorage.removeItem(k); return Promise.resolve(); }
      };
      return _engine;
    }
  } catch (e) { }

  // 2. Try Native AsyncStorage
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage && AsyncStorage.getItem) {
      _engine = AsyncStorage;
      return _engine;
    }
  } catch (e) { }

  // 3. Fallback: In-Memory (Logs will work within a single app session)
  console.warn('[Storage] Falling back to Memory storage. Changes will NOT persist after app restart.');
  _engine = {
    getItem: (k: string) => Promise.resolve(memoryBackup.get(k) || null),
    setItem: (k: string, v: string) => { memoryBackup.set(k, v); return Promise.resolve(); },
    removeItem: (k: string) => { memoryBackup.delete(k); return Promise.resolve(); }
  };
  return _engine;
};

// --- API ---

export const getDailyRecords = async (): Promise<DailyRecord[]> => {
  try {
    const data = await getEngine().getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('[Storage] Error loading records:', e);
    return [];
  }
};

export const saveDailyRecord = async (record: DailyRecord) => {
  try {
    const existing = await getDailyRecords();
    const index = existing.findIndex(r => r.date === record.date);
    if (index > -1) existing[index] = record; else existing.unshift(record);
    existing.sort((a, b) => b.date.localeCompare(a.date));
    await getEngine().setItem(RECORDS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('[Storage] Error saving record:', e);
  }
};

export const deleteDailyRecord = async (date: string) => {
  try {
    const existing = await getDailyRecords();
    const filtered = existing.filter(r => r.date !== date);
    await getEngine().setItem(RECORDS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[Storage] Error deleting record:', e);
  }
};

export const saveProfile = async (profile: UserProfile) => {
  try {
    await getEngine().setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('[Storage] Error saving profile:', e);
  }
};

export const getProfile = async (): Promise<UserProfile> => {
  try {
    const data = await getEngine().getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : { name: '', position: '', dept: '' };
  } catch (e) {
    console.error('[Storage] Error loading profile:', e);
    return { name: '', position: '', dept: '' };
  }
};

export const saveSettings = async (settings: SystemSettings) => {
  try {
    await getEngine().setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Storage] Error saving settings:', e);
  }
};

export const getSettings = async (): Promise<SystemSettings> => {
  try {
    const data = await getEngine().getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { use24Hour: true, theme: 'system', hasSeenOnboarding: false, goalHours: null };
  } catch (e) {
    console.error('[Storage] Error loading settings:', e);
    return { use24Hour: true, theme: 'system', hasSeenOnboarding: false, goalHours: null };
  }
};

export const clearAllData = async () => {
  try {
    await getEngine().removeItem(RECORDS_KEY);
    await getEngine().removeItem(PROFILE_KEY);
    await getEngine().removeItem(SETTINGS_KEY);
  } catch (e) {
    console.error('[Storage] Error clearing data:', e);
  }
};
