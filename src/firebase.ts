// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoGrWdWu__JHiTz5t9Udo0UkEy0DLBVVs",
  authDomain: "cyan-ide-cyan.firebaseapp.com",
  projectId: "cyan-ide-cyan",
  storageBucket: "cyan-ide-cyan.appspot.com",
  messagingSenderId: "760729383045",
  appId: "1:760729383045:web:fdd87bce328a49ab3639ec",
  measurementId: "G-6M37H8YPFR"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// In restricted environments (about:blank, null origin), force Firestore to
// use long-polling HTTP instead of WebSocket/WebChannel. The global Epoxy
// proxy patches fetch but not WebSocket, so this is required for chat to work.
const isRestricted =
  typeof window !== "undefined" &&
  (window.location.protocol === "about:" ||
    window.location.origin === "null" ||
    window.location.origin === null ||
    window.location.href === "about:blank" ||
    window.location.hostname.includes("googleusercontent.com"));

export const db = isRestricted
  ? initializeFirestore(app, {
    experimentalForceLongPolling: true,
  })
  : getFirestore(app);
