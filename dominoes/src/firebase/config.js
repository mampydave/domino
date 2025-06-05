import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBW3m-rG2XaUO8LvscAelXkYxJbGuKsUl4",
  authDomain: "dominoapp-9a975.firebaseapp.com",
  databaseURL: "https://dominoapp-9a975-default-rtdb.firebaseio.com",
  projectId: "dominoapp-9a975",
  storageBucket: "dominoapp-9a975.firebasestorage.app",
  messagingSenderId: "917901749634",
  appId: "1:917901749634:web:ec3c8e626f4a4027a6f39b",
  measurementId: "G-W0PES82EC3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// const analytics = getAnalytics(app);
export { database };