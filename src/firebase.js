import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCZPfR_fkTNkAdlh_lYt977Mc-dOTZOr8A",
  authDomain: "matchit-quiz-defa0.firebaseapp.com",
  databaseURL: "https://matchit-quiz-defa0-default-rtdb.firebaseio.com",
  projectId: "matchit-quiz-defa0",
  storageBucket: "matchit-quiz-defa0.firebasestorage.app",
  messagingSenderId: "1089228131930",
  appId: "1:1089228131930:web:070958218040daa19a5263",
  measurementId: "G-XPYP6973SD"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
