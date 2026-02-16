// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";   // add this

const firebaseConfig = {
  apiKey: "AIzaSyDYXRwGgS0Z2TpQAQoIqYDp-_qAo4k_kc0",
  authDomain: "matchit-quiz.firebaseapp.com",
  databaseURL: "https://matchit-quiz-default-rtdb.firebaseio.com",
  projectId: "matchit-quiz",
  storageBucket: "matchit-quiz.firebasestorage.app",
  messagingSenderId: "123144398999",
  appId: "1:123144398999:web:bfcafe8be24a330d0ae1d2",
  measurementId: "G-WWVSRL99ZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export database
export const db = getDatabase(app);
