// StudyMuseAI Auth - works with Firebase if configured, otherwise demo mode
import { getFirebase, isFirebaseEnabled } from './firebase-config.js';

const statusEl = document.getElementById('authStatus');

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

async function emailAuth(mode, email, password) {
  try {
    if (!isFirebaseEnabled()) {
      localStorage.setItem('sm_demo_user', email || 'guest');
      toast('Demo mode: signed in locally');
      setTimeout(() => location.href = 'dashboard.html', 400);
      return;
    }
    const { auth } = await getFirebase();
    if (!auth) throw new Error('Firebase not available');
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    location.href = 'dashboard.html';
  } catch (e) {
    console.error('[auth] Error:', e.message);
    // Fallback to demo mode if Firebase fails
    localStorage.setItem('sm_demo_user', email || 'guest');
    toast(e.message || 'Error - using demo mode');
    if (statusEl) statusEl.textContent = e.message;
    setTimeout(() => location.href = 'dashboard.html', 1000);
  }
}

async function googleAuth() {
  try {
    if (!isFirebaseEnabled()) {
      localStorage.setItem('sm_demo_user', 'google-user@gmail.com');
      toast('Demo mode: signed in with Google');
      setTimeout(() => location.href = 'dashboard.html', 400);
      return;
    }
    const { auth, googleProvider } = await getFirebase();
    if (!auth) throw new Error('Firebase not available');
    const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const result = await signInWithPopup(auth, googleProvider);
    // Save the actual Google email from Firebase
    if (result.user?.email) {
      localStorage.setItem('sm_demo_user', result.user.email);
    }
    location.href = 'dashboard.html';
  } catch (e) {
    console.error('[auth] Google error:', e.message);
    // If Firebase domain error or any error, fallback to demo mode
    if (e.message.includes('unauthorized-domain') || e.message.includes('Firebase')) {
      localStorage.setItem('sm_demo_user', 'google-user@gmail.com');
      toast('Demo mode: signed in with Google');
      if (statusEl) statusEl.textContent = 'Using demo mode (local)';
      setTimeout(() => location.href = 'dashboard.html', 400);
    } else {
      toast(e.message || 'Google sign-in failed');
      if (statusEl) statusEl.textContent = e.message;
    }
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
