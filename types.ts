
import React from 'react';
import { Timestamp } from 'firebase/firestore';

export enum Page {
  Home = 'HOME',
  Auth = 'AUTH',
  Exam = 'EXAM',
  Results = 'RESULTS',
  Payment = 'PAYMENT',
  History = 'HISTORY',
  Admin = 'ADMIN',
  Support = 'SUPPORT',
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
  };
  familyHistory: {
    glaucoma: boolean;
    macularDegeneration: boolean;
    strabismus: boolean;
    highMyopia: boolean;
    otherOrNotSure: boolean;
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
  createdAt: Timestamp;
  analysisResults: EyeAnalysisResult[];
  healthData: HealthData;
  capturedImage: string;
  summary?: string; // AI-generated text summary
  ophthalmologists?: Ophthalmologist[];
}

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string; // Stored as an ISO string from Firestore timestamp
}