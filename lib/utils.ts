/**
 * Utility functions for validation and formatting
 */

import { VALIDATION, PASSWORD_RULES } from '../constants/config';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL.test(email);
};

/**
 * Validate phone format
 */
export const validatePhone = (phone: string): boolean => {
  return VALIDATION.PHONE.test(phone);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    errors.push(`Minimum ${PASSWORD_RULES.MIN_LENGTH} characters required`);
  }

  if (PASSWORD_RULES.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }

  if (PASSWORD_RULES.REQUIRE_DIGITS && !/\d/.test(password)) {
    errors.push('Must contain at least one digit');
  }

  if (PASSWORD_RULES.REQUIRE_SPECIAL && !/[@$!%*?&]/.test(password)) {
    errors.push('Must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Normalize string for comparison (case-insensitive, trim whitespace)
 */
export const normalizeString = (str: string): string => {
  return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Format date to display format (DD/MM/YYYY)
 */
export const formatDate = (isoDate: string | Date): string => {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (naissance: string | null | undefined): number | null => {
  if (!naissance) return null;

  try {
    const birthDate = new Date(naissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
};

/**
 * Format time string (HH:MM)
 */
export const formatTime = (time: string | undefined): string => {
  if (!time) return 'N/A';
  
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes || '00'}`;
};

/**
 * Check if date is within holiday period
 */
export const isHolidayPeriod = (date: Date, holidays: Array<[string, string]>): boolean => {
  return holidays.some(([start, end]) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return date >= startDate && date <= endDate;
  });
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Validate discipline
 */
export const isValidDiscipline = (discipline: string): boolean => {
  const validDisciplines = ['Krav-Maga', 'MMA', 'Kung-Fu', 'Boxe', 'Karaté'];
  return validDisciplines.includes(discipline);
};

/**
 * Get day abbreviation
 */
export const getDayAbbreviation = (day: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Lundi': 'Lun',
    'Mardi': 'Mar',
    'Mercredi': 'Mer',
    'Jeudi': 'Jeu',
    'Vendredi': 'Ven',
    'Samedi': 'Sam',
    'Dimanche': 'Dim',
  };
  return abbreviations[day] || day;
};
