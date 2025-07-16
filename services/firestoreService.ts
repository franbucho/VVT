import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp,
    doc,
    Timestamp,
    getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import { EvaluationHistoryItem, HealthData, EyeAnalysisResult, Ophthalmologist } from '../types';


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
        ophthalmologists: data.ophthalmologists || [],
      } as EvaluationHistoryItem);
    });
    
    return history;
  } catch (error) {
    console.error("Error fetching evaluation history:", error);
    throw new Error("Failed to fetch evaluation history.");
  }
};

export const getEvaluationsCount = async (userId: string): Promise<number> => {
    try {
        const historyCollectionRef = collection(db, 'users', userId, 'evaluations');
        const snapshot = await getCountFromServer(historyCollectionRef);
        return snapshot.data().count;
    } catch (error) {
        console.error("Error getting evaluations count:", error);
        // Return 0 on error so the user isn't unfairly charged
        return 0;
    }
};

export const saveEvaluationResult = async (
  userId: string,
  data: {
    healthData: HealthData;
    analysisResults: EyeAnalysisResult[];
    capturedImage: string;
    summary: string;
    ophthalmologists: Ophthalmologist[];
  }
): Promise<string> => {
  try {
    const historyCollectionRef = collection(db, 'users', userId, 'evaluations');
    const docRef = await addDoc(historyCollectionRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving evaluation result:", error);
    throw new Error("Failed to save evaluation result.");
  }
};