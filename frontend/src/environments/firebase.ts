// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA923iWxu4_1DPEldbAC5ppNTJmVnLc6ss",
  authDomain: "motorfatiga-fa7fb.firebaseapp.com",
  projectId: "motorfatiga-fa7fb",
  storageBucket: "motorfatiga-fa7fb.firebasestorage.app",
  messagingSenderId: "590329580484",
  appId: "1:590329580484:web:33a41265e136dd9fa4f291",
  measurementId: "G-VNHMLZ8FCZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
