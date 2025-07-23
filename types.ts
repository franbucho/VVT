import React from 'react';
import firebase from 'firebase/compat/app';

// Use the compat Timestamp type
type Timestamp = firebase.firestore.Timestamp;

export enum Page {
  Home = 'HOME',
  Auth = 'AUTH',
  Exam = 'EXAM',
  Results = 'RESULTS',
  Payment = 'PAYMENT',
  Profile = 'PROFILE', // Renamed from History
  Admin = 'ADMIN',
  Support = 'SUPPORT',
  DoctorPortal = 'DOCTOR_PORTAL',
  EvaluationDetail = 'EVALUATION_DETAIL',
  HR_ADMIN = 'HR_ADMIN',
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  firstName?: string;
  lastName?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  // New medical fields
  medicalHistory?: {
    allergies?: string;
    conditions?: string;
    surgeries?: string;
  };
  assignedDoctor?: string;
  nextConsultation?: Timestamp | null;
  enableReminders?: boolean;
  teamId?: string | null;
}


export interface DoctorNote {
  text: string;
  doctorId: string;
  doctorName: string;
  createdAt: Timestamp;
}

export interface EyeAnalysisResult {
  conditionKey: string; // Key for translation
  riskLevel: 'Low' | 'Medium' | 'High' | 'Undetermined'; // Used for logic/styling, translated for display
  confidence?: number; // 0-1
  detailsKey: string; // Key for translation
}

export interface Feature {
  icon: React.ReactNode;
  titleKey: string; // Key for translation
  descriptionKey: string; // Key for translation
}

export interface Ophthalmologist {
  name: string;
  specialty: string;
  address: string;
  phone: string;
}

export interface HealthData {
  firstName: string;
  lastName:string;
  city: string;
  state: string;
  birthDate: {
    day: string;
    month: string;
    year: string;
  };
  primaryReason: {
    blurry: boolean;
    tired: boolean;
    redness: boolean;
    checkup: boolean;
    other: boolean;
    none: boolean;
  };
  screenTimeHours: string;
  wearsLenses: 'yes' | 'no' | 'other' | '';
  lensesSatisfaction: string;
  lensesLastUpdate: string;
  hadSurgeryOrInjury: 'yes' | 'no' | 'other' | '';
  surgeryOrInjuryDetails: string;
  illnesses: {
    diabetes: boolean;
    highBloodPressure: boolean;
    highCholesterol: boolean;
    thyroid: boolean;
    arthritis: boolean;
    otherOrNotSure: boolean;
    none: boolean;
  };
  familyHistory: {
    glaucoma: boolean;
    macularDegeneration: boolean;
    strabismus: boolean;
    highMyopia: boolean;
    otherOrNotSure: boolean;
    none: boolean;
  };
  symptoms: {
    pain: boolean;
    itching: boolean;
    burning: boolean;
    tearing: boolean;
    gritty: boolean;
    lightSensitivity: boolean;
    doubleVision: boolean;
    none: boolean;
    otherOrNotSure: boolean;
  };
}

export interface EvaluationHistoryItem {
  id: string;
  userId: string;
  patientName: string;
  createdAt: Timestamp;
  analysisResults: EyeAnalysisResult[];
  healthData: HealthData;
  capturedImage: string;
  summary?: string; // AI-generated text summary
  ophthalmologists?: Ophthalmologist[];
  doctorNotes?: DoctorNote[];
  status?: string; // e.g., 'pending', 'responded'
  respondedBy?: string;
  respondedAt?: Timestamp;
}

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string; // Stored as an ISO string from Firestore timestamp
}

export interface Team {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teamId: string | null;
  userId: string | null; // This will be the linked firebase auth user id
  createdAt: Timestamp;
  lastEvaluationAt?: Timestamp;
  nextEvaluationAt?: Timestamp;
  status?: 'ok' | 'due_soon' | 'overdue' | 'pending';
}

export interface HRDashboardStats {
    totalMembers: number;
    pendingCount: number;
    dueSoonCount: number;
    overdueCount: number;
}

export interface HRDashboardData {
    stats: HRDashboardStats;
    teamMembers: Employee[];
}

export interface AdminChartDataPoint {
  date: string; // YYYY-MM-DD
  newUsers: number;
  evaluations: number;
}