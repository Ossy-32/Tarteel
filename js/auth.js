// js/auth.js
import { auth } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  // تبويبات
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabLogin.addEventListener('click', () => { tabLogin.classList.add('active'); tabRegister.classList.remove('active'); loginForm.style.display='block'; registerForm.style.display='none'; });
  tabRegister.addEventListener('click', () => { tabRegister.classList.add('active'); tabLogin.classList.remove('active'); registerForm.style.display='block'; loginForm.style.display='none'; });

  // تسجيل
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      // حفظ الاسم في البروفايل
      await updateProfile(userCred.user, { displayName: name });
      // بعد التسجيل -> توجيه للداشبورد
      window.location.href = 'dashboard.html';
    } catch(err) {
      alert(err.message);
    }
  });

  // تسجيل دخول
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = 'dashboard.html';
    } catch(err) {
      alert(err.message);
    }
  });

  // حالة المصادقة: لو المستخدم داخل، نوجهه للداشبورد تلقائياً
  onAuthStateChanged(auth, (user) => {
    // لو الصفحة index وسجل دخول -> اذهب للداشبورد
    if (user && window.location.pathname.endsWith('index.html')) {
      window.location.href = 'dashboard.html';
    }
    // لو الصفحة dashboard.html وما في مستخدم -> اذهب للـ index
    if (!user && window.location.pathname.endsWith('dashboard.html')) {
      window.location.href = 'index.html';
    }
  });
});
