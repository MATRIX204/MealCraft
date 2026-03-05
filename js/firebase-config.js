// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT4CDao7eHCFU0OO_dee_m6BpjzKv_308",
  authDomain: "mealcraft-9db35.firebaseapp.com",
  projectId: "mealcraft-9db35",
  messagingSenderId: "1052912873454",
  appId: "1:1052912873454:web:2b794eb8e9524f0ba068ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };