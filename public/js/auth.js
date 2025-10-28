// public/js/auth.js
import { auth, db, googleProvider } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ensure a users/{uid} exists with role default 'user' or provided role
async function ensureUserDoc(user, profile = {}) {
  if (!user?.uid) return null;
  const uRef = doc(db, "users", user.uid);
  const snap = await getDoc(uRef);
  const base = {
    email: user.email || profile.email || null,
    displayName: user.displayName || profile.displayName || null,
    role: (snap.exists() && snap.data().role) ? snap.data().role : (profile.role || "user"),
    updatedAt: serverTimestamp(),
    createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp()
  };
  await setDoc(uRef, base, { merge: true });
  return base;
}

// Standard registration (for general users)
export async function registerUser(firstName, lastName, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  await setDoc(doc(db, "users", user.uid), {
    firstName, lastName, email, role: "user", createdAt: serverTimestamp()
  }, { merge: true });
  return user;
}

// Driver registration WITH invite code linking
// inviteCode: code typed by driver that must match a drivers doc inviteCode
export async function registerDriverWithInvite(fullName, contact, email, password, inviteCode, busId = null) {
  // 1. verify invite exists
  const driversRef = collection(db, "drivers");
  const q = query(driversRef, where("inviteCode", "==", inviteCode));
  const snaps = await getDocs(q);
  if (snaps.empty) throw new Error("Invalid invite code. Please contact admin.");
  // if multiple matches pick first
  const driverDoc = snaps.docs[0];
  const driverId = driverDoc.id;

  // 2. create auth user
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 3. update drivers/{driverId} with uid and any other info
  await updateDoc(doc(db, "drivers", driverId), {
    uid,
    fullName,
    contact,
    busId: busId || driverDoc.data().busId || null,
    linkedAt: serverTimestamp()
  });

  // 4. create users/{uid} with role driver
  await setDoc(doc(db, "users", uid), {
    displayName: fullName,
    email,
    role: "driver",
    createdAt: serverTimestamp()
  }, { merge: true });

  return cred.user;
}

// Normal login
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // ensure users doc exists
  await ensureUserDoc(cred.user);
  return cred.user;
}

// Google sign-in with improved error handling
export async function googleSignIn() {
  try {
    // Use the pre-configured googleProvider from firebaseConfig.js
    
    const res = await signInWithPopup(auth, googleProvider);
    
    // Create or update user document with additional checks
    if (res.user) {
      await ensureUserDoc(res.user, {
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL
      });
      return res.user;
    } else {
      throw new Error("No user data received from Google sign-in");
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    // Handle specific error cases
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Please allow popups for this website to sign in with Google");
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in cancelled. Please try again");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection");
    } else {
      throw new Error(error.message || "Failed to sign in with Google");
    }
  }
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}
