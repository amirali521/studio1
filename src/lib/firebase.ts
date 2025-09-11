
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpbk7v_JG-v-l16bLTxvcfuIOBTDg6L4Q",
  authDomain: "inventory-22921.firebaseapp.com",
  projectId: "inventory-22921",
  storageBucket: "inventory-22921.appspot.com",
  messagingSenderId: "804738666849",
  appId: "1:804738666849:web:a0df84747f5b9e5bb7f520",
  measurementId: "G-JRNNHB85B9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
