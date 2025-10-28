// public/js/firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Replace values with your Firebase project config (from console)
const firebaseConfig = {
  apiKey: "AIzaSyD00ySZ5atLGdDu-nXAFDLlxL0fHgyuaOQ",
  authDomain: "ebus-current-location.firebaseapp.com",
  projectId: "ebus-current-location",
  storageBucket: "ebus-current-location.appspot.com", // change this line
  messagingSenderId: "73736835497",
  appId: "1:73736835497:web:f88bc6d4ebc5c342b4b4b8",
  measurementId: "G-6WS6WZ18F8"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with persistent cache
const db = initializeFirestore(app, {
    cache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Export configured instances so other modules can use them
export { auth, db, googleProvider };
