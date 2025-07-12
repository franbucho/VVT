
import React from 'react';
import { Timestamp } from 'firebase/firestore';

export enum Page {
  Home = 'home',
  Auth = 'auth',
  Exam = 'exam',
  Results = 'results',
  Payment = 'payment',
  History = 'history',
  Admin = 'admin',
  Support = 'support',
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

export interface HealthData {
  firstName: string;
  lastName: string;
  birthDate: { day: string; month: string; year: string };
  primaryReason: string[]; // <-- Changed to string array
  wearsLenses: 'yes' | 'no' | 'other' | '';
  lensesSatisfaction: string;
  lensesLastUpdate: string;
  hadSurgeryOrInjury: 'yes' | 'no' | 'other' | '';
  surgeryOrInjuryDetails: string;
  illnesses: string[];
  familyHistory: string[];
  symptoms: string[];
  screenTime: string;
  occupationalHazards: string[];
}


export interface EvaluationHistoryItem {
  id: string;
  createdAt: Timestamp;
  analysisResults: EyeAnalysisResult[];
  healthData: HealthData;
  capturedImage: string;
  summary?: string; // AI-generated text summary
}