// Mood tracker
export const MOODS = [
  { id: 'energetic', label: 'Energetic', emoji: '🔆' },
  { id: 'calm', label: 'Calm', emoji: '🌿' },
  { id: 'focused', label: 'Focused', emoji: '🎯' },
  { id: 'stressed', label: 'Stressed', emoji: '😣' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'low', label: 'Low / Sad', emoji: '🌧️' },
];

const STORAGE_KEY = 'sm_moods_v1';

export function loadMoods() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
export function saveMoods(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
export function logMood(moodId) {
  const list = loadMoods();
  list.push({ moodId, ts: Date.now() });
  saveMoods(list);
  return list;
}
export function getWeeklyCounts() {
  const list = loadMoods();
  const now = Date.now();
  const weekAgo = now - 7*24*3600*1000;
  const recent = list.filter(e => e.ts >= weekAgo);
  const counts = Object.fromEntries(MOODS.map(m => [m.id, 0]));
  recent.forEach(e => { if (counts[e.moodId] !== undefined) counts[e.moodId]++; });
  return counts;
}
export function getLastMood() {
  const list = loadMoods();
  return list.length ? list[list.length-1].moodId : null;
}

// Simple canvas bar chart
export function drawMoodChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const counts = getWeeklyCounts();
  const labels = MOODS.map(m => m.emoji);
  const values = MOODS.map(m => counts[m.id] || 0);
  const w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  const h = canvas.height = 140 * (window.devicePixelRatio || 1);
  ctx.clearRect(0,0,w,h);
  const pad = 28 * (window.devicePixelRatio || 1);
  const max = Math.max(1, ...values);
  const barW = (w - pad*2) / values.length * 0.62;
  const gap = (w - pad*2) / values.length;
  values.forEach((v,i)=>{
    const x = pad + i*gap + (gap-barW)/2;
    const bh = (h - pad*1.6) * (v / max);
    const y = h - pad - bh;
    // bar
    ctx.fillStyle = '#A78BDB';
    roundRect(ctx, x, y, barW, bh, 8*(window.devicePixelRatio||1));
    ctx.fill();
    // emoji label
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#2B2438';
    ctx.font = `${14*(window.devicePixelRatio||1)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barW/2, h - 12);
    // count
    if (v>0){
      ctx.font = `bold ${12*(window.devicePixelRatio||1)}px system-ui`;
      ctx.fillText(String(v), x + barW/2, y - 6);
    }
  });
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
