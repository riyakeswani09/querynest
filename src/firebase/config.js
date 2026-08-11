import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCRGnq31Th0dkUaCEpguG3uP2rBGru4cis",
  authDomain: "querynest-5240e.firebaseapp.com",
  projectId: "querynest-5240e",   // ✅ FIXED
  storageBucket: "querynest-5240e.appspot.com", // (safe standard format)
  messagingSenderId: "743786821199",
  appId: "1:743786821199:web:5650cbd27789fd917c9c3a"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)