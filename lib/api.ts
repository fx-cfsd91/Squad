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
    const finalHeaders = { ...API_HEADERS, ...options.headers };
    console.log('🔑 API_HEADERS sent:', finalHeaders);
    
    const response = await fetch(url, {
      ...options,
      method: options.method || 'GET',
      mode: 'cors',
      signal: controller.signal,
      headers: finalHeaders,
    });

    clearTimeout(timeoutId);
    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Fetch error:', error);
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
    
    // Handle both array and object with 'events' property
    const events = Array.isArray(data) ? data : (data.events || []);
    
    if (!Array.isArray(events)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return events as Event[];
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
 * Update event
 */
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<Event> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.EVENTS_URL, {
      method: 'PUT',
      body: JSON.stringify({ id: eventId, ...updates }),
    });

    const data = await response.json();
    return data as Event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    console.log('🗑️  Attempting to delete event:', eventId);
    const response = await fetchWithTimeout(API_CONFIG.EVENTS_URL, {
      method: 'DELETE',
      body: JSON.stringify({ id: eventId }),
    });

    console.log('📡 Delete response status:', response.status);
    const data = await response.json();
    console.log('✅ Delete response data:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete event');
    }
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch courses
 */
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL, {
      cache: 'no-store',
    });
    const data = await response.json();
    
    // Handle both array and object with 'courses' property
    const courses = Array.isArray(data) ? data : (data.courses || []);
    
    if (!Array.isArray(courses)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return courses as Course[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error(`Failed to fetch courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create course
 */
export const createCourse = async (course: Omit<Course, 'id' | 'createdAt'>): Promise<Course> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL, {
      method: 'POST',
      body: JSON.stringify(course),
    });

    const data = await response.json();
    return data as Course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update course
 */
export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<Course> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL, {
      method: 'PUT',
      body: JSON.stringify({ id: courseId, ...updates }),
    });

    const data = await response.json();
    // Server returns { success: true }, so we return a minimal course object
    // The full update will be fetched by loadCourses()
    return { id: courseId, ...updates } as Course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete course
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL, {
      method: 'DELETE',
      body: JSON.stringify({ id: courseId }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete course');
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    throw new Error(`Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Manage course cancelled dates (cancel or uncancel)
 */
export const manageCourseDate = async (
  courseId: string,
  date: string,
  action: 'cancel' | 'uncancel'
): Promise<Course> => {
  try {
    const response = await fetchWithTimeout(API_CONFIG.COURSES_URL, {
      method: 'PATCH',
      body: JSON.stringify({ id: courseId, date, action }),
    });

    const data = await response.json();
    return data as Course;
  } catch (error) {
    console.error('Error managing course date:', error);
    throw new Error(
      `Failed to ${action} course date: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
