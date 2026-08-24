import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  onValue,
  ref,
  set,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDfFtFZmBExULMhS1B9okASn4rEMy1yqsw",
  authDomain: "ttat-voting.firebaseapp.com",
  databaseURL: "https://ttat-voting-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ttat-voting",
  storageBucket: "ttat-voting.firebasestorage.app",
  messagingSenderId: "902850372512",
  appId: "1:902850372512:web:d9c0c247ec99496f2c3ac5",
  measurementId: "G-90N8SMKV7E"
};

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)