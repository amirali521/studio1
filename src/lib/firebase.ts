
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { app, auth, db };
