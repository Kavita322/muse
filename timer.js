// Pomodoro timer
export function createTimer({onTick, onSessionEnd}) {
  let focusMin = 25, breakMin = 5;
  let secondsLeft = focusMin * 60;
  let isBreak = false;
  let running = false;
  let interval = null;

  function fmt(s){ const m = Math.floor(s/60); const sec = s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` }

  function tick(){
    if (!running) return;
    secondsLeft--;
    onTick?.(secondsLeft, fmt(secondsLeft), isBreak);
    if (secondsLeft <= 0) {
      complete();
    }
  }

  function complete(){
    // chime
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = isBreak ? 520 : 660;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      o.start(); o.stop(ctx.currentTime + 0.5);
    } catch(e){}
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(isBreak ? 'Break over — back to focus!' : 'Focus session complete!', { body: 'StudyMuseAI' });
    }
    onSessionEnd?.({ wasBreak: isBreak, durationMin: isBreak ? breakMin : focusMin });
    // flip
    isBreak = !isBreak;
    secondsLeft = (isBreak ? breakMin : focusMin) * 60;
    onTick?.(secondsLeft, fmt(secondsLeft), isBreak);
    // auto-pause between phases
    pause();
  }

  function start(){
    if (running) return;
    running = true;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(()=>{});
    interval = setInterval(tick, 1000);
  }
  function pause(){
    running = false;
    clearInterval(interval);
  }
  function reset(){
    pause();
    secondsLeft = (isBreak ? breakMin : focusMin) * 60;
    onTick?.(secondsLeft, fmt(secondsLeft), isBreak);
  }
  function setTimes(f, b){
    focusMin = f; breakMin = b;
    isBreak = false;
    secondsLeft = focusMin*60;
    pause();
    onTick?.(secondsLeft, fmt(secondsLeft), isBreak);
  }
  function skip(){
    secondsLeft = 1;
  }
  function state(){ return {running, isBreak, secondsLeft, focusMin, breakMin}; }
  // initial tick
  onTick?.(secondsLeft, fmt(secondsLeft), isBreak);
  return { start, pause, reset, setTimes, skip, state, get running(){return running} };
}
