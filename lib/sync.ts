// lib/sync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export type CourseSlot = {
  id: string;
  label: string;
  dayIndex?: number;
  specificDate?: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  active: boolean;
  isRecurring: boolean;
  details?: string;
};

import { API_CONFIG, API_HEADERS } from '../constants/config';

const SERVER_JSON = API_CONFIG.COURSES_URL;
const SAVE_ENDPOINT = API_CONFIG.COURSES_URL;
const QUEUE_KEY = '@kravmaga_sync_queue';
const CACHE_KEY = '@kravmaga_calendar_slots';

export async function fetchRemoteSlots(): Promise<CourseSlot[]> {
  try {
    const res = await fetch(SERVER_JSON);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function postToServer(slots: CourseSlot[]) {
  const res = await fetch(SAVE_ENDPOINT, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(slots),
  });
  if (!res.ok) throw new Error('Save failed');
  return res.json();
}

async function enqueueSave(slots: CourseSlot[]) {
  const qRaw = await AsyncStorage.getItem(QUEUE_KEY);
  const q = qRaw ? JSON.parse(qRaw) : [];
  q.push({ ts: Date.now(), slots });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export async function flushQueue() {
  const qRaw = await AsyncStorage.getItem(QUEUE_KEY);
  const q: Array<{ ts:number, slots: CourseSlot[] }> = qRaw ? JSON.parse(qRaw) : [];
  if (!q.length) return;
  for (const item of q) {
    try {
      await postToServer(item.slots);
    } catch (err) {
      console.warn('Flush failed, keep queue', err);
      return; // stop on first failure
    }
  }
  await AsyncStorage.removeItem(QUEUE_KEY);
  await fetchRemoteSlots();
}

export async function saveSlots(slots: CourseSlot[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(slots));
  try {
    await postToServer(slots);
  } catch (e) {
    await enqueueSave(slots);
  }
}

export function startAutoSync() {
  AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      flushQueue().catch(err => console.warn('FlushQueue error', err));
    }
  });
}
