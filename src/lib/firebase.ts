
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHT1KZyZVOUGH-j6NUSSGWoO_kUhwtWjM",
  authDomain: "stockpilescan.firebaseapp.com",
  projectId: "stockpilescan",
  storageBucket: "stockpilescan.appspot.com",
  messagingSenderId: "815972164857",
  appId: "1:815972164857:web:608367b83f5b5cc47aae28",
  measurementId: "G-B9WN0JSEPE"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Function to sync user data to a 'users' collection
export const syncUserToFirestore = async (user: User) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  
  const userDoc = await getDoc(userRef);

  // If the user document doesn't exist, create it.
  if (!userDoc.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      isAdmin: false, // Default new users to not be admins
    };
    // Return the promise from setDoc
    return setDoc(userRef, userData);
  } else {
    // If user exists, update their details
    const existingData = userDoc.data();
    const userData = {
      // Keep existing data but update what might change on login
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      isAdmin: existingData?.isAdmin || false, // Preserve existing isAdmin status
    };
    // Return the promise from setDoc
    return setDoc(userRef, userData, { merge: true });
  }
};

// Listen for auth state changes to keep user data in sync
onAuthStateChanged(auth, (user) => {
  if (user) {
    syncUserToFirestore(user);
  }
});


export { app, auth, db };
