

import React from 'react';
import firebase from 'firebase/compat/app';

export enum Page {
  Home = 'HOME',
  Auth = 'AUTH',
  Exam = 'EXAM',
  Results = 'RESULTS',
  Payment = 'PAYMENT',
  History = 'HISTORY',
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
  birthMonth: string;
  birthYear: string;
  primaryReason: string; // Will hold value from radio button
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
  createdAt: firebase.firestore.Timestamp;
  analysisResults: EyeAnalysisResult[];
  healthData: HealthData;
  capturedImage: string;
}