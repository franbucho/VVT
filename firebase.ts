import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtr3DaY28OXbtMb9RJ_KI6Smwgattk8Z8",
  authDomain: "virtual-vision-test-app.firebaseapp.com",
  projectId: "virtual-vision-test-app",
  storageBucket: "virtual-vision-test-app.appspot.com",
  messagingSenderId: "666624859031",
  appId: "1:666624859031:web:4a69a19c0c9876ddb9c2d2",
  measurementId: "G-XDE2RTRKK9"
};

// Initialize the Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize and export the Firebase services you need
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export default firebase;
