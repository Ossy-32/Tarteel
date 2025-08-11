// js/firebaseConfig.js
// ملاحظة: استبدل الحقول بقيم مشروع Firebase الخاص بك
const firebaseConfig = {
 apiKey: "AIzaSyByvitmHsNBjtPtjnHb90k3fA5yL6kxRdU",
  authDomain: "tartil-61b28.firebaseapp.com",
  projectId: "tartil-61b28",
  storageBucket: "tartil-61b28.firebasestorage.app",
  messagingSenderId: "349748573604",
  appId: "1:349748573604:web:32779e80a2d6ec60d57d31",
};

// نستعمل الـ SDK عبر CDN (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
