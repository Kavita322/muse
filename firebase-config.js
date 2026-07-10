// StudyMuseAI - Firebase config
// Project: studymuseai-6227a

export const firebaseConfig = {
  apiKey: "AIzaSyCN5bDXj7PUNdtn_BZFj2UOy97wsDiIAws",
  authDomain: "studymuseai-6227a.firebaseapp.com",
  projectId: "studymuseai-6227a",
  storageBucket: "studymuseai-6227a.firebasestorage.app",
  messagingSenderId: "941222914789",
  appId: "1:941222914789:web:bfab319c2bcb4b9e1e820c"
};

// Set to true once you've pasted a real config
export const FIREBASE_ENABLED = Object.values(firebaseConfig).every(v => typeof v === 'string' && !v.includes('YOUR_'));

// --- Firebase lazy init ---
let _app, _auth, _db, _googleProvider;

export async function getFirebase() {
  if (!FIREBASE_ENABLED) return { app: null, auth: null, db: null };
  if (_app) return { app: _app, auth: _auth, db: _db, googleProvider: _googleProvider };
  const [{ initializeApp }, { getAuth, GoogleAuthProvider }, { getFirestore }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]);
  _app = initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _googleProvider = new GoogleAuthProvider();
  return { app: _app, auth: _auth, db: _db, googleProvider: _googleProvider };
}

export function isFirebaseEnabled() { return FIREBASE_ENABLED; }
