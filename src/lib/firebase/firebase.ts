import config from "@/config/config";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(config.firebase);

// Setup Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


export default app;