// lib/sync.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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

const SERVER_JSON = 'https://cfsd91.com/priv/read.php';
const SAVE_ENDPOINT = 'https://cfsd91.com/priv/save.php'; // mettre à jour selon ton hébergement
const API_KEY = 'REMPLACE_PAR_TA_CLE_SECRETE';
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
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
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
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      flushQueue().catch(err => console.warn('FlushQueue error', err));
    }
  });
}
