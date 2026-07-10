// StudyMuseAI Auth - works with Firebase if configured, otherwise demo mode
import { getFirebase, isFirebaseEnabled } from './firebase-config.js';

const statusEl = document.getElementById('authStatus');

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

async function emailAuth(mode, email, password) {
  if (!isFirebaseEnabled()) {
    localStorage.setItem('sm_demo_user', email || 'guest');
    toast('Demo mode: signed in locally');
    setTimeout(()=> location.href = 'dashboard.html', 400);
    return;
  }
  const { auth } = await getFirebase();
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  try {
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    location.href = 'dashboard.html';
  } catch (e) {
    if (statusEl) statusEl.textContent = e.message;
    toast(e.message);
  }
}

async function googleAuth() {
  if (!isFirebaseEnabled()) {
    localStorage.setItem('sm_demo_user', 'guest-google');
    location.href = 'dashboard.html';
    return;
  }
  const { auth, googleProvider } = await getFirebase();
  const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  try {
    await signInWithPopup(auth, googleProvider);
    location.href = 'dashboard.html';
  } catch(e) {
    toast(e.message);
  }
}

window.SM_AUTH = {
  submit: emailAuth,
  google: googleAuth
};

// If already signed in, jump to dashboard
(async () => {
  if (isFirebaseEnabled()) {
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    onAuthStateChanged(auth, user => {
      if (user && location.pathname.endsWith('index.html')) {
        // stay, let user click through
      }
    });
  }
})();
