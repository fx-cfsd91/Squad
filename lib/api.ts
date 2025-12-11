/**
 * API Service - Centralized API communication
 * Handles all fetch operations with proper error handling
 */

import { API_CONFIG, API_HEADERS, DELAYS } from '../constants/config';
import { Eleve, Event, Course, Presence } from '../constants/types';

/**
 * Generic fetch wrapper with timeout and error handling
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DELAYS.API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...API_HEADERS, ...options.headers },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch students from API
 */
export const fetchEleves = async (): Promise<Eleve[]> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.ELEVES_FETCH_URL, {
      cache: 'no-store',
    });
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return data as Eleve[];
  } catch (error) {
    console.error('Error fetching eleves:', error);
    throw new Error(`Failed to fetch students: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create new student (register)
 */
export const createEleve = async (eleve: Omit<Eleve, 'id' | 'createdAt'>): Promise<Eleve> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.ELEVES_APPEND_URL, {
      method: 'POST',
      body: JSON.stringify(eleve),
    });

    const data = await response.json();
    return data as Eleve;
  } catch (error) {
    console.error('Error creating eleve:', error);
    throw new Error(`Failed to register student: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Login user
 */
export const loginUser = async (nom: string, prenom: string, password: string): Promise<Eleve | null> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.LOGIN_URL, {
      method: 'POST',
      body: JSON.stringify({ nom, prenom, password }),
    });

    const data = await response.json();
    
    if (data.success === false || !data.id) {
      return null;
    }
    
    return data as Eleve;
  } catch (error) {
    console.error('Error logging in:', error);
    throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Save presence records
 */
export const savePresences = async (presences: Presence[]): Promise<void> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.PRESENCE_SAVE_URL, {
      method: 'POST',
      body: JSON.stringify(presences),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to save presences');
    }
  } catch (error) {
    console.error('Error saving presences:', error);
    throw new Error(`Failed to save presences: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch events
 */
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.EVENTS_URL);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return data as Event[];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error(`Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create event
 */
export const createEvent = async (event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.EVENTS_URL, {
      method: 'POST',
      body: JSON.stringify(event),
    });

    const data = await response.json();
    return data as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch courses
 */
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return data as Course[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error(`Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
