/**
 * Application configuration
 * Centralized configuration for API endpoints, keys, and constants
 */

// API Base URLs
export const API_CONFIG = {
  // Eleves (Students)
  ELEVES_FETCH_URL: 'https://cfsd91.com/eleves.php',
  ELEVES_SAVE_URL: 'https://cfsd91.com/eleves_save.php',
  ELEVES_APPEND_URL: 'https://cfsd91.com/appli/php/eleves-append.php',
  
  // Authentication
  LOGIN_URL: 'https://cfsd91.com/appli/php/identification.php',
  RESET_PASSWORD_URL: 'https://cfsd91.com/reset-password-request.php',
  
  // Presence
  PRESENCE_SAVE_URL: 'https://cfsd91.com/presences_save.php',
  
  // Events
  EVENTS_URL: 'https://cfsd91.com/events.php',
  EVENTS_JSON_URL: 'https://cfsd91.com/events.json',
  
  // Courses
  COURSES_URL: 'https://cfsd91.com/courses.php',
  COURSES_JSON_URL: 'https://cfsd91.com/courses.json',
  
  // Notifications/Messages
  PUSH_HISTORY_URL: 'https://cfsd91.com/push_history.php',
  
  // Evaluations
  EVALUATIONS_URL: 'https://cfsd91.com/appli',
};

// API Headers — la clé doit être définie via EXPO_PUBLIC_API_KEY dans Vercel
// (Settings → Environment Variables, jamais dans le code source)
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': process.env.EXPO_PUBLIC_API_KEY ?? 'p7P1R3b69oyF2kUjJmiXcYSHCA5KhGeaVuwgdxlBnq40OL8NDWzZEtvTsrMIfQ',
};

// Storage Keys
export const STORAGE_KEYS = {
  ELEVES: 'eleves_cfsd91',
  PRESENCE: 'presences_cfsd91',
  USER: 'user_cfsd91',
  ADMIN: 'admin_cfsd91',
};

// Delay Constants (in milliseconds)
export const DELAYS = {
  SPLASH_SCREEN: 4500,
  TRANSITION: 500,
  API_TIMEOUT: 10000,
};

// Password Requirements
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_DIGITS: true,
  REQUIRE_SPECIAL: true,
};

// External URLs
export const EXTERNAL_URLS = {
  USER_FORM: 'https://cfsd91.com/utilisateur.html',
  WEB_APP: 'https://cfsd91.com',
};

// Tile Height Configuration
export const TILE_HEIGHTS = {
  LARGE: 200,   // 1-2 cards
  MEDIUM: 150,  // 3 cards
  NORMAL: 120,  // 4 cards
  SMALL: 90,    // 5-6 cards
  VERY_SMALL: 80, // 7+ cards
} as const;

// Discipline Colors
export const DISCIPLINE_COLORS: { [key: string]: string } = {
  'Krav-Maga': '#ef4444',
  'MMA': '#f97316',
  'Kung-Fu': '#eab308',
  'Boxe': '#3b82f6',
  'Karaté': '#8b5cf6',
};

// Belt Colors — toutes les variantes de grade correspondant aux valeurs stockées
export const BELT_COLORS: { [key: string]: string } = {
  'Blanche': '#e5e7eb',
  'Jaune': '#fbbf24',
  'Jaune I': '#fbbf24',
  'Jaune II': '#fbbf24',
  'Jaune III': '#fbbf24',
  'Orange': '#f97316',
  'Orange I': '#f97316',
  'Orange II': '#f97316',
  'Orange III': '#f97316',
  'Verte': '#10b981',
  'Bleue': '#3b82f6',
  'Violette': '#a855f7',
  'Marron': '#92400e',
  'Noire': '#1f2937',
  'Noire I': '#1f2937',
  'Noire II': '#1f2937',
  'Noire III': '#1f2937',
  'Noire IV': '#1f2937',
  'Noire V': '#1f2937',
  'Blanc Rouge': '#ef4444',
};

export const BELT_OPTIONS = [
  'Blanche',
  'Jaune', 'Jaune I', 'Jaune II', 'Jaune III',
  'Orange', 'Orange I', 'Orange II', 'Orange III',
  'Verte', 'Bleue', 'Violette', 'Marron',
  'Noire', 'Noire I', 'Noire II', 'Noire III', 'Noire IV', 'Noire V', 'Blanc Rouge',
] as const;

const BELT_ALIASES: Record<string, string> = {
  yellow: 'Jaune',
  blanche: 'Blanche',
  white: 'Blanche',
  jaune: 'Jaune',
  orange: 'Orange',
  verte: 'Verte',
  vertee: 'Verte',
  bleue: 'Bleue',
  violette: 'Violette',
  marron: 'Marron',
  noire: 'Noire',
  noirei: 'Noire I',
  noireii: 'Noire II',
  noireiii: 'Noire III',
  noireiv: 'Noire IV',
  noirev: 'Noire V',
  noirevi: 'Blanc Rouge',
  blancrouge: 'Blanc Rouge',
};

export const normalizeBeltLevel = (belt?: string | null) => {
  const value = String(belt ?? '').trim();
  if (!value) return '';

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const aliasKey = normalized.replace(/\s+/g, '');
  return BELT_ALIASES[aliasKey] ?? value;
};

export const getBeltColor = (belt?: string | null) => {
  const normalized = normalizeBeltLevel(belt);
  return BELT_COLORS[normalized] ?? '#555';
};

// Event Type Colors
export const EVENT_TYPE_COLORS: { [key: string]: string } = {
  'competition': '#ef4444',
  'stage': '#3b82f6',
  'autre': '#6b7280',
};

// Validation Regex
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};
