import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase';
import { DoctorProfile } from '../types';

export const signUpWithEmailPassword = async (email: string, password: string, firstName: string, lastName: string): Promise<firebase.auth.UserCredential> => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (!user) {
    throw new Error("User not found after creation.");
  }

  const displayName = `${firstName} ${lastName}`;
  await user.updateProfile({ displayName });

  const userDocRef = db.collection("users").doc(user.uid);
  await userDocRef.set({
    uid: user.uid,
    displayName,
    firstName,
    lastName,
    email: user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return userCredential;
};

export const signUpDoctor = async (email: string, password: string, firstName: string, lastName: string, doctorProfile: DoctorProfile): Promise<firebase.auth.UserCredential> => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (!user) {
    throw new Error("User not found after creation.");
  }

  const displayName = `Dr. ${firstName} ${lastName}`;
  await user.updateProfile({ displayName });

  const userDocRef = db.collection("users").doc(user.uid);
  await userDocRef.set({
    uid: user.uid,
    displayName,
    firstName,
    lastName,
    email: user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    isRequestingDoctorRole: true,
    doctorProfile: doctorProfile,
  }, { merge: true });

  return userCredential;
};

export const signInWithEmail = async (email: string, password: string): Promise<firebase.auth.UserCredential> => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    await auth.sendPasswordResetEmail(email);
};

export const signInWithGoogle = async (): Promise<firebase.auth.UserCredential> => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    
    if (user) {
      const userDocRef = db.collection("users").doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await userDocRef.set({
          uid: user.uid,
          displayName: user.displayName,
          firstName,
          lastName,
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        await userDocRef.set({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
    return result;
};