import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDtr3DaY28OXbtMb9RJ_KI6Smwgattk8Z8",
  authDomain: "virtual-vision-test-app.firebaseapp.com",
  projectId: "virtual-vision-test-app",
  storageBucket: "virtual-vision-test-app.appspot.com",
  messagingSenderId: "666624859031",
  appId: "1:666624859031:web:4a69a19c0c9876ddb9c2d2",
  measurementId: "G-XDE2RTRKK9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
