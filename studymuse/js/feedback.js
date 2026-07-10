
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQp3sK69m5VDAXdiSRpQnPuiLxK_FF1xqVZ7IER914rC0NvzOp-7W9DHJCpJtNmKPm1Q/exec';
window.SM_FEEDBACK_SCRIPT_URL = SCRIPT_URL;

function toast(msg, ok=true){
  const t = document.getElementById('toast');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.style.background = ok ? 'var(--text)' : '#c84848';
  t.style.color = 'var(--bg)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('feedbackForm');
  if(!form) return;

  // Pre-fill email if logged in via StudyMuse
  try {
    const demoUser = localStorage.getItem('sm_demo_user');
    if(demoUser && demoUser.includes('@')) document.getElementById('email').value = demoUser;
  } catch(e){}

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const statusEl = document.getElementById('formStatus');

    const payload = {
      name: document.getElementById('name').value.trim(),
      class: document.getElementById('class').value.trim(),
      domain: document.getElementById('domain').value,
      email: document.getElementById('email').value.trim(),
      feedback: document.getElementById('feedback').value.trim(),
      // optional context from StudyMuse
      mood: JSON.parse(localStorage.getItem('sm_moods_v1')||'[]').slice(-1)[0]?.moodId || '',
      userId: localStorage.getItem('sm_demo_user') || '',
      website: document.getElementById('website')?.value || '' // honeypot
    };

    if(!payload.name || !payload.class || !payload.domain || !payload.email){
      toast('Please fill all required fields.', false);
      return;
    }
    if(!SCRIPT_URL.includes('script.google.com')){
      toast('Set your Apps Script URL in js/feedback.js first.', false);
      statusEl.textContent = 'SCRIPT_URL not configured — see js/feedback.js';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting…';
    statusEl.textContent = 'Sending…';

    try {
      // Apps Script Web Apps don't love JSON CORS preflights, send as form-urlencoded
      const body = new URLSearchParams(payload).toString();
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const text = await res.text();
      let ok = res.ok;
      try { const j = JSON.parse(text); ok = j.result === 'success'; } catch {}
      if(!ok) throw new Error(text.slice(0,200));
      
      toast('Submitted! Thank you 💜');
      statusEl.textContent = 'Saved to Google Sheet ✓';
      form.reset();
    } catch(err){
      console.error(err);
      toast('Submit failed: ' + err.message, false);
      statusEl.textContent = 'Failed. Check SCRIPT_URL and Apps Script permissions.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit to Google Sheet';
    }
  });
});
