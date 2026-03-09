import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbrUdJYGMEukwNrSg7DDq_ocEcVAK9lKQ",
  authDomain: "agent-4dfcc.firebaseapp.com",
  projectId: "agent-4dfcc",
  storageBucket: "agent-4dfcc.firebasestorage.app",
  messagingSenderId: "832487062121",
  appId: "1:832487062121:web:009b93df4b95b9decec0f8",
  measurementId: "G-WH1939WWSW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
export { app };
