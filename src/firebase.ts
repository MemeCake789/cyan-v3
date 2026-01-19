// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
