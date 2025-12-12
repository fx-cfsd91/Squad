/**
 * Shared TypeScript types and interfaces
 * Defines common data structures used across the application
 */

export type Discipline = 'Krav-Maga' | 'MMA' | 'Kung-Fu' | 'Boxe' | 'Karaté';
export type BeltLevel = 'Blanche' | 'Jaune' | 'Orange' | 'Verte' | 'Bleue' | 'Marron' | 'Noire' | 'Violette' | 'Yellow';
export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
export type EventType = 'competition' | 'stage' | 'autre';

export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  naissance?: string; // ISO date
  age?: number;
  jour?: DayOfWeek | string;
  discipline: Discipline | string;
  combattant?: boolean;
  etudiant?: boolean;
  renouvellement?: boolean;
  autorisationDepartSeul?: boolean;
  telUrgence?: string;
  telEleve?: string;
  email?: string;
  adresse?: string;
  poids?: number | null;
  licence?: string;
  ceinture?: BeltLevel | string;
  photo?: string; // base64 or URL
  password?: string; // hashed password
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export interface Course {
  id: string;
  title?: string;
  discipline?: Discipline | string;
  day: string | number; // DayOfWeek or number (0-6)
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  details?: string;
  active?: boolean;
  canceledDates?: string[]; // YYYY-MM-DD format
  instructor?: string;
  maxStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  location?: string;
  description?: string;
  visible: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Presence {
  date: string; // ISO timestamp
  list: Eleve[];
}

export interface BeltTechnique {
  id: string;
  technique: string;
  description?: string;
  category?: string;
}

export interface EvaluationData {
  techniques: BeltTechnique[];
}
