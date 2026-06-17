import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDy0-rVGlQ7X2G1e6ZDvSuBw4meAibf2wY",
  authDomain: "calcium-garage-59nlt.firebaseapp.com",
  projectId: "calcium-garage-59nlt",
  storageBucket: "calcium-garage-59nlt.firebasestorage.app",
  messagingSenderId: "384164057526",
  appId: "1:384164057526:web:7409d6746af2bc7dd3b117",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-f28eef2d-595a-41df-960e-f9e17c50cffd");

export { db };
