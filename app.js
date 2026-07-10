// StudyMuseAI Dashboard glue
import { createTimer } from './timer.js';
import { MOODS, logMood, loadMoods, getLastMood, drawMoodChart } from './mood.js';
import { buildTimetable, renderTimetable, savePlan, loadPlan } from './coach.js';
import { getFirebase, isFirebaseEnabled } from './firebase-config.js';

const $ = (id)=>document.getElementById(id);
const on = (id, ev, fn) => { const el = $(id); if(el) el.addEventListener(ev, fn); };

// --- Theme ---
const root = document.documentElement;
const savedTheme = localStorage.getItem('sm_theme') || 'auto';
if (savedTheme !== 'auto') root.setAttribute('data-theme', savedTheme);
on('themeToggle','click', ()=>{
  const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', cur);
  localStorage.setItem('sm_theme', cur);
  const tt = $('themeToggle'); if(tt) tt.textContent = cur === 'dark' ? '☀️' : '🌙';
  setTimeout(()=>drawMoodChart($('moodChart')), 50);
});

// --- Auth state display ---
(async ()=>{
  const emailEl = $('userEmail');
  const signOutBtn = $('signOutBtn');
  if (isFirebaseEnabled()) {
    const { auth } = await getFirebase();
    const { onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    onAuthStateChanged(auth, user=>{
      if(emailEl) emailEl.textContent = user?.email || 'guest';
      if (!user && !localStorage.getItem('sm_demo_user')) location.href='index.html';
    });
    if(signOutBtn) signOutBtn.onclick = async ()=>{
      const { auth } = await getFirebase();
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await signOut(auth); localStorage.removeItem('sm_demo_user'); location.href='index.html';
    };
  } else {
    if(emailEl) emailEl.textContent = localStorage.getItem('sm_demo_user') || 'guest (demo)';
    if(signOutBtn) signOutBtn.onclick = ()=>{ localStorage.removeItem('sm_demo_user'); location.href='index.html'; };
    if (!localStorage.getItem('sm_demo_user')) localStorage.setItem('sm_demo_user','guest');
  }
})();

// --- Mood UI ---
let selectedMood = getLastMood() || 'calm';
function renderMoodGrid(){
  const grid = $('moodGrid');
  if(!grid) return;
  grid.innerHTML = '';
  MOODS.forEach(m=>{
    const btn = document.createElement('button');
    btn.className = 'mood-btn' + (m.id===selectedMood ? ' active':'');
    btn.innerHTML = `<span class="mood-emoji">${m.emoji}</span><span class="small">${m.label}</span>`;
    btn.onclick = ()=>{ selectedMood = m.id; renderMoodGrid(); updateCurrentMoodLabel(); };
    grid.appendChild(btn);
  });
}
function updateCurrentMoodLabel(){
  const found = MOODS.find(m=>m.id===selectedMood);
  const el = $('currentMoodLabel');
  if(el) el.textContent = found ? `${found.label} ${found.emoji}` : '—';
}
renderMoodGrid();
updateCurrentMoodLabel();
drawMoodChart($('moodChart'));

on('logMoodBtn','click', ()=>{
  logMood(selectedMood);
  toast('Mood logged ✓');
  drawMoodChart($('moodChart'));
  syncMoodToCloud(selectedMood);
});

async function syncMoodToCloud(moodId){
  if (!isFirebaseEnabled()) return;
  try {
    const { auth, db } = await getFirebase();
    if (!auth.currentUser) return;
    const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'moods'), { moodId, ts: serverTimestamp() });
  } catch(e){}
}

// --- Pomodoro ---
const sessionsKey = 'sm_sessions_v1';
function loadSessions(){
  try { return JSON.parse(localStorage.getItem(sessionsKey) || '[]'); } catch { return []; }
}
function saveSession(s){
  const list = loadSessions();
  list.push({ ...s, ts: Date.now() });
  localStorage.setItem(sessionsKey, JSON.stringify(list));
  updateSessionStats();
  syncSessionToCloud(s);
}
async function syncSessionToCloud(s){
  if (!isFirebaseEnabled()) return;
  try {
    const { auth, db } = await getFirebase();
    if (!auth.currentUser) return;
    const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'sessions'), { ...s, ts: serverTimestamp() });
  } catch(e){}
}
function updateSessionStats(){
  const list = loadSessions();
  const todayStr = new Date().toDateString();
  const today = list.filter(x=> new Date(x.ts).toDateString() === todayStr && x.wasBreak === false);
  const mins = today.reduce((a,b)=> a + (b.durationMin||0), 0);
  const st = $('sessionsToday'); if(st) st.textContent = today.length;
  const tf = $('totalFocusMin'); if(tf) tf.textContent = mins;
  const days = new Set(list.filter(x=>!x.wasBreak).map(x=> new Date(x.ts).toDateString()));
  let streak=0;
  for (let i=0;i<30;i++){
    const d = new Date(Date.now()-i*86400000).toDateString();
    if (days.has(d)) streak++; else if (i>0) break;
  }
  const sc = $('streakCount'); if(sc) sc.textContent = streak;
  const sp = $('streakPill'); if(sp) sp.textContent = `🔥 ${streak}-day streak`;
}
updateSessionStats();

const timerDisplay = $('timerDisplay');
const timer = createTimer({
  onTick: (sec, formatted, isBreak)=>{
    if(timerDisplay) timerDisplay.textContent = formatted;
    document.title = `${formatted} ${isBreak ? 'Break' : 'Focus'} — StudyMuseAI`;
  },
  onSessionEnd: ({wasBreak, durationMin})=>{
    if (!wasBreak) saveSession({ wasBreak, durationMin });
    toast(wasBreak ? 'Break done — back to work!' : 'Nice! Focus session complete.');
    const spb = $('startPauseBtn'); if(spb) spb.textContent = 'Start';
  }
});

on('startPauseBtn','click', ()=>{
  const btn = $('startPauseBtn');
  if (timer.running) { timer.pause(); if(btn) btn.textContent='Start'; }
  else { timer.start(); if(btn) btn.textContent='Pause'; }
});
on('resetBtn','click', ()=>{ timer.reset(); const b=$('startPauseBtn'); if(b) b.textContent='Start'; });
on('skipBtn','click', ()=> timer.skip());

document.querySelectorAll('#timerModes .mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#timerModes .mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.focus;
    const b = btn.dataset.break;
    const cfEl = $('customFocus'), cbEl = $('customBreak'), ct = $('customTimes');
    if (f==='custom'){
      if(ct) ct.style.display='flex';
      const cf = parseInt(cfEl?.value)||25;
      const cb = parseInt(cbEl?.value)||5;
      timer.setTimes(cf, cb);
    } else {
      if(ct) ct.style.display='none';
      timer.setTimes(parseInt(f), parseInt(b));
    }
    const spb = $('startPauseBtn'); if(spb) spb.textContent='Start';
  });
});
on('customFocus','change', ()=>{
  timer.setTimes(parseInt($('customFocus')?.value)||25, parseInt($('customBreak')?.value)||5);
});
on('customBreak','change', ()=>{
  timer.setTimes(parseInt($('customFocus')?.value)||25, parseInt($('customBreak')?.value)||5);
});

// --- Coach / Timetable ---
function currentPlanSubjects(){
  const v = $('coachSubjects')?.value.trim() || '';
  return v ? v.split(',').map(s=>s.trim()).filter(Boolean) : ['Digital Electronics','Networking','Cybersecurity'];
}
function buildAndRender(){
  const subjects = currentPlanSubjects();
  const hours = parseFloat($('coachHours')?.value) || 3;
  const deadlines = $('coachDeadlines')?.value || '';
  const plan = buildTimetable({ subjects, freeHoursPerDay: hours, deadlinesText: deadlines });
  if (['stressed','tired','low'].includes(selectedMood)) {
    plan.forEach(d => { d.blocks = d.blocks.slice(0, Math.max(1, Math.ceil(d.blocks.length*0.7))) });
  }
  renderTimetable(plan, $('timetable'));
  savePlan(plan);
}
on('buildPlanBtn','click', buildAndRender);
on('regenPlanBtn','click', buildAndRender);

const existing = loadPlan();
if (existing) renderTimetable(existing, $('timetable'));

// --- Google Sheets Feedback (inline dashboard form) ---
function getFeedbackScriptUrl(){
  return (window.SM_FEEDBACK_SCRIPT_URL && !window.SM_FEEDBACK_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID'))
    ? window.SM_FEEDBACK_SCRIPT_URL
    : 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
}
async function submitToGoogleSheet(payload, statusEl){
  const SCRIPT_URL = getFeedbackScriptUrl();
  if (SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    toast('Set your Apps Script URL in js/feedback.js', false);
    if(statusEl) statusEl.textContent = 'SCRIPT_URL not configured.';
    return false;
  }
  try {
    const body = new URLSearchParams(payload).toString();
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const text = await res.text();
    let ok = res.ok;
    try { const j = JSON.parse(text); ok = j.result === 'success'; } catch {}
    if(!ok) throw new Error(text.slice(0,120));
    return true;
  } catch(err){
    console.error(err);
    toast('Submit failed: ' + err.message, false);
    if(statusEl) statusEl.textContent = 'Failed. Check SCRIPT_URL.';
    return false;
  }
}
const inlineForm = document.getElementById('inlineFeedbackForm');
if (inlineForm) {
  inlineForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(inlineForm);
    const payload = {
      name: (fd.get('name')||'').toString().trim(),
      class: (fd.get('class')||'').toString().trim(),
      domain: (fd.get('domain')||'').toString().trim(),
      email: (fd.get('email')||'').toString().trim(),
      feedback: (fd.get('feedback')||'').toString().trim(),
      mood: selectedMood || '',
      userId: localStorage.getItem('sm_demo_user') || ''
    };
    if(!payload.name || !payload.class || !payload.domain || !payload.email){
      toast('Please fill Name, Class, Domain, Email', false);
      return;
    }
    const statusEl = document.getElementById('inlineFeedbackStatus');
    if(statusEl) statusEl.textContent = 'Sending…';
    const ok = await submitToGoogleSheet(payload, statusEl);
    if(ok){
      toast('Submitted to Google Sheet ✓');
      if(statusEl) statusEl.textContent = 'Saved ✓';
      inlineForm.reset();
    }
  });
}

// --- utils ---
function toast(msg, ok=true) {
  const t = $('toast');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.style.background = ok ? '' : '#c84848';
  t.style.color = ok ? '' : '#fff';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

window.addEventListener('resize', ()=> drawMoodChart($('moodChart')));
