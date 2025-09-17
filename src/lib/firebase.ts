
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAHT1KZyZVOUGH-j6NUSSGWoO_kUhwtWjM",
  authDomain: "stockpilescan.firebaseapp.com",
  projectId: "stockpilescan",
  storageBucket: "stockpilescan.appspot.com",
  messagingSenderId: "815972164857",
  appId: "1:815972164857:web:608367b83f5b5cc47aae28",
  measurementId: "G-B9WN0JSEPE",
  adminUid: "iNqXkJFtSIQVFTLWz6v5rvA9Lii1",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore offline persistence failed: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore offline persistence is not supported in this browser.");
    }
  });


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
      isAdmin: user.uid === firebaseConfig.adminUid, 
    };
    return setDoc(userRef, userData);
  } else {
    // If user exists, update their details
    const userData = {
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      isAdmin: user.uid === firebaseConfig.adminUid,
    };
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
