import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCnUCB-bqDu1B3_G3ruJin8nlkNZEJRYgI",
  authDomain: "learn-city-83f10.firebaseapp.com",
  projectId: "learn-city-83f10",
  storageBucket: "learn-city-83f10.appspot.com",
  messagingSenderId: "532519201266",
  appId: "1:532519201266:web:04f6c21ff543774a26a36b",
  measurementId: "G-LEC3W36LMQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const db = getFirestore(app)