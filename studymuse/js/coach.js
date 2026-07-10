// StudyMuseAI – Timetable Manager
// Simple spaced timetable generator, mood-aware

const PLAN_KEY = 'sm_plan_v1';

export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify({ plan, ts: Date.now() }));
}
export function loadPlan() {
  try { const j=JSON.parse(localStorage.getItem(PLAN_KEY)||'null'); return j?.plan || null; } catch { return null; }
}

/**
 * Build a simple spaced timetable.
 * subjects: string[]
 * freeHoursPerDay: number
 * deadlinesText: string
 */
export function buildTimetable({subjects, freeHoursPerDay, deadlinesText}) {
  if (!subjects.length) subjects = ['General Study'];
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const blocksPerDay = Math.max(1, Math.min(6, Math.round(freeHoursPerDay * 1.2)));
  const plan = [];
  let si = 0;
  for (const d of days.slice(0,7)) {
    const dayBlocks = [];
    for (let b=0; b<blocksPerDay; b++) {
      const subj = subjects[(si++) % subjects.length];
      const startHour = 17 + b;
      dayBlocks.push({ time: `${String(startHour).padStart(2,'0')}:00`, subject: subj, focus: '45 min focus + 10 min review' });
    }
    plan.push({ day: d, blocks: dayBlocks });
  }
  // bump deadline subjects earlier in week
  const deadlineSubjects = parseDeadlines(deadlinesText).map(x=>x.subject.toLowerCase());
  if (deadlineSubjects.length) {
    plan.slice(0,3).forEach(day => {
      day.blocks[0].subject = findMatch(subjects, deadlineSubjects) || day.blocks[0].subject;
    });
  }
  return plan;
}

function parseDeadlines(text=''){
  return text.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).map(s=>{
    const m = s.match(/(.+?)\s*[-:]/);
    return { subject: m ? m[1] : s.split(' ')[0], raw: s };
  });
}
function findMatch(subjects, needles){
  for (const n of needles) {
    const hit = subjects.find(s => s.toLowerCase().includes(n) || n.includes(s.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

export function renderTimetable(plan, el) {
  if (!el) return;
  if (!plan) { el.innerHTML = '<div class="muted small">No plan yet.</div>'; return; }
  el.innerHTML = plan.map(day => `
    <div>
      <b>${day.day}</b>
      ${day.blocks.map(b => `<div class="tt-item"><span>${b.time} — ${b.subject}</span><span class="muted small">${b.focus}</span></div>`).join('')}
    </div>
  `).join('');
}
