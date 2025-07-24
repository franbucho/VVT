import firebase from 'firebase/compat/app';
import { db, auth, storage } from '../firebase';
import { EvaluationHistoryItem, HealthData, EyeAnalysisResult, Ophthalmologist, UserProfile } from '../types';
import imageCompression from 'browser-image-compression';

const getAuthToken = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");
    return user.getIdToken();
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.warn("No user profile found in Firestore for UID:", userId);
            return null;
        }
        return userDoc.data() as UserProfile;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error("Failed to fetch user profile.");
    }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    if (!file) throw new Error("No file provided for upload.");
    
    const options = {
      maxSizeMB: 0.5, // Compress to max 500KB
      maxWidthOrHeight: 400,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const filePath = `profilePictures/${userId}/${Date.now()}_${compressedFile.name}`;
      const fileRef = storage.ref(filePath);
      const snapshot = await fileRef.put(compressedFile);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture: ", error);
      throw new Error("Failed to upload image.");
    }
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
            createdAt: new firebase.firestore.Timestamp(item.createdAt._seconds, item.createdAt._nanoseconds),
            respondedAt: item.respondedAt ? new firebase.firestore.Timestamp(item.respondedAt._seconds, item.respondedAt._nanoseconds) : undefined,
            doctorNotes: (item.doctorNotes || []).map((note: any) => ({
                ...note,
                createdAt: note.createdAt._seconds
                    ? new firebase.firestore.Timestamp(note.createdAt._seconds, note.createdAt._nanoseconds)
                    : firebase.firestore.Timestamp.fromDate(new Date(note.createdAt)), // Handles ISO strings
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
        throw error;
    }
};

export const getEvaluationHistory = async (userId: string): Promise<EvaluationHistoryItem[]> => {
  try {
    const historyCollectionRef = db.collection('evaluations');
    const q = historyCollectionRef.where("userId", "==", userId).orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    
    const history: EvaluationHistoryItem[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        createdAt: data.createdAt as firebase.firestore.Timestamp,
        analysisResults: data.analysisResults,
        healthData: data.healthData,
        capturedImage: data.capturedImage,
        summary: data.summary,
        ophthalmologists: data.ophthalmologists || [],
        doctorNotes: (data.doctorNotes || []).map((note: any) => ({
            ...note,
            createdAt: note.createdAt instanceof firebase.firestore.Timestamp 
                ? note.createdAt 
                : firebase.firestore.Timestamp.fromDate(new Date(note.createdAt)) // Handle legacy strings
        })),
        userId: data.userId,
        patientName: data.patientName,
        status: data.status,
        respondedBy: data.respondedBy,
        respondedAt: data.respondedAt as firebase.firestore.Timestamp,
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
        const historyCollectionRef = db.collection('evaluations');
        const q = historyCollectionRef.where("userId", "==", userId);
        const snapshot = await q.get();
        return snapshot.size;
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
    const historyCollectionRef = db.collection('evaluations');
    const docRef = await historyCollectionRef.add({
      ...data,
      userId: userId,
      patientName: `${data.healthData.firstName} ${data.healthData.lastName}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      doctorNotes: [],
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving evaluation result:", error);
    throw new Error("Failed to save evaluation result.");
  }
};