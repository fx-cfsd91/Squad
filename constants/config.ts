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
  
  // Presence
  PRESENCE_SAVE_URL: 'https://cfsd91.com/presences_save.php',
  
  // Events
  EVENTS_URL: 'https://cfsd91.com/events.php',
  
  // Courses
  COURSES_URL: 'https://cfsd91.com/courses.php',
  
  // Notifications/Messages
  PUSH_HISTORY_URL: 'https://cfsd91.com/push_history.php',
};

// API Headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': 'KEYOFSQUAD01@',
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

// Belt Colors
export const BELT_COLORS: { [key: string]: string } = {
  'Blanche': '#e5e7eb',
  'Jaune': '#fbbf24',
  'Orange': '#f97316',
  'Verte': '#10b981',
  'Bleue': '#3b82f6',
  'Marron': '#92400e',
  'Violette': '#a855f7',
  'Noire': '#1f2937',
  'Yellow': '#fbbf24',
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
