
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
  // This is crucial for new sign-ups.
  if (!userDoc.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      isAdmin: false, // Default new users to not be admins
    };
    await setDoc(userRef, userData);
  } else {
    // If user exists, just update their last login time
    const existingData = userDoc.data();
    const userData = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      isAdmin: existingData?.isAdmin || false, // Preserve existing isAdmin status
    };
    await setDoc(userRef, userData, { merge: true });
  }
};

// Listen for auth state changes to keep user data in sync
onAuthStateChanged(auth, (user) => {
  if (user) {
    syncUserToFirestore(user);
  }
});


export { app, auth, db };
