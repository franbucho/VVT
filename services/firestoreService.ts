
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    serverTimestamp,
    where,
    Timestamp,
    getCountFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { EvaluationHistoryItem, HealthData, EyeAnalysisResult, Ophthalmologist } from '../types';

const getAuthToken = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    return user.getIdToken();
};

export const getAllEvaluations = async (): Promise<EvaluationHistoryItem[]> => {
    try {
        const token = await getAuthToken();
        const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/listAllEvaluations';
        const response = await fetch(functionUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch evaluations");
        }

        const result = await response.json();
        const evaluations = result.evaluations || [];
        
        return (evaluations as any[]).map((item: any) => ({
            ...item,
            id: item.id,
            patientName: item.patientName || `${item.healthData?.firstName} ${item.healthData?.lastName}`.trim() || 'Unknown Patient',
            createdAt: new Timestamp(item.createdAt._seconds, item.createdAt._nanoseconds),
            respondedAt: item.respondedAt ? new Timestamp(item.respondedAt._seconds, item.respondedAt._nanoseconds) : undefined,
            doctorNotes: (item.doctorNotes || []).map((note: any) => ({
                ...note,
                createdAt: note.createdAt._seconds
                    ? new Timestamp(note.createdAt._seconds, note.createdAt._nanoseconds)
                    : Timestamp.fromDate(new Date(note.createdAt)), // Handles ISO strings
            }))
        })) as EvaluationHistoryItem[];
    } catch (error) {
        console.error("Error fetching all evaluations:", error);
        throw new Error("Failed to fetch all evaluations.");
    }
};

export const addDoctorNote = async (evaluationId: string, noteText: string): Promise<void> => {
    try {
        const token = await getAuthToken();
        const functionUrl = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/addDoctorNote';
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ evaluationId, noteText })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to add note");
        }
    } catch (error) {
        console.error("Error adding doctor note:", error);
        throw new Error("Failed to add doctor note.");
    }
};

export const getEvaluationHistory = async (userId: string): Promise<EvaluationHistoryItem[]> => {
  try {
    const historyCollectionRef = collection(db, 'evaluations');
    const q = query(historyCollectionRef, where("userId", "==", userId), orderBy('createdAt', 'desc'));
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
        doctorNotes: (data.doctorNotes || []).map((note: any) => ({
            ...note,
            createdAt: note.createdAt instanceof Timestamp 
                ? note.createdAt 
                : Timestamp.fromDate(new Date(note.createdAt)) // Handle legacy strings
        })),
        userId: data.userId,
        patientName: data.patientName,
        status: data.status,
        respondedBy: data.respondedBy,
        respondedAt: data.respondedAt as Timestamp,
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
        const historyCollectionRef = collection(db, 'evaluations');
        const q = query(historyCollectionRef, where("userId", "==", userId));
        const snapshot = await getCountFromServer(q);
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
    const historyCollectionRef = collection(db, 'evaluations');
    const docRef = await addDoc(historyCollectionRef, {
      ...data,
      userId: userId,
      patientName: `${data.healthData.firstName} ${data.healthData.lastName}`,
      createdAt: serverTimestamp(),
      doctorNotes: [],
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving evaluation result:", error);
    throw new Error("Failed to save evaluation result.");
  }
};