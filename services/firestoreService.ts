import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { EvaluationHistoryItem, HealthData, EyeAnalysisResult } from '../types';

export const getEvaluationHistory = async (userId: string): Promise<EvaluationHistoryItem[]> => {
  try {
    const historyCollectionRef = collection(db, 'users', userId, 'evaluations');
    const q = query(historyCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const history: EvaluationHistoryItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        createdAt: data.createdAt as Timestamp,
        analysisResults: data.analysisResults,
        healthData: data.healthData,
        capturedImage: data.capturedImage,
        summary: data.summary,
      } as EvaluationHistoryItem);
    });
    
    return history;
  } catch (error) {
    console.error("Error fetching evaluation history:", error);
    throw new Error("Failed to fetch evaluation history.");
  }
};

export const saveEvaluationResult = async (
  userId: string,
  data: {
    healthData: HealthData;
    analysisResults: EyeAnalysisResult[];
    capturedImage: string;
    summary: string;
  }
): Promise<void> => {
  try {
    const historyCollectionRef = collection(db, 'users', userId, 'evaluations');
    await addDoc(historyCollectionRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving evaluation result:", error);
    throw new Error("Failed to save evaluation result.");
  }
};
