# StudyMuseAI

Calm, focus-first student companion. Pomodoro timer, 6-mood tracker, mood-based playlists, AI study coach, Chatbase chatbot, Firebase auth — soft lavender UI.

Live locally by opening `index.html`, or host on GitHub Pages.

## Features

1. **Pomodoro Focus Timer**
   - 25/5, 50/10, custom
   - Start / pause / reset / skip
   - Session counter + daily streak
   - Web Audio chime + Browser Notification
   - History in localStorage, synced to Firestore if logged in

2. **Mood Tracker — 6 Moods**
   - Energetic 🔆, Calm 🌿, Focused 🎯, Stressed 😣, Tired 😴, Low / Sad 🌧️
   - Timestamped logs
   - Weekly trend canvas chart

3. **Mood-Based Focus Playlist**
   - Auto-swaps YouTube embed per mood
   - Energetic → Upbeat instrumental
   - Calm → Lo-fi
   - Focused → Binaural beats
   - Stressed → Ambient nature / piano
   - Tired → Light background, no lyrics
   - Low → Gentle uplifting instrumental
   - Edit mappings in `js/playlist.js`

4. **AI Study Coach**
   - `js/coach.js`
   - `buildTimetable({subjects, freeHoursPerDay, deadlinesText})` → 7-day plan
   - Auto-reduces load if mood = stressed/tired/low
   - `explainQuestion(question, mood)` — offline fallback included
   - Plug a real LLM in `callLLM()` — OpenAI example is commented in-file

5. **Chatbase Chatbot**
   - Floating widget on every page
   - Uncomment the Chatbase script block at the bottom of `index.html` and `dashboard.html`
   - Replace `CHATBOT_ID`

6. **Firebase Authentication**
   - Email/password + Google sign-in
   - Firestore collections:
     ```
     users/{uid}
       moods/{autoId} { moodId, ts }
       sessions/{autoId} { wasBreak, durationMin, ts }
       profile { ... }
     ```
   - Demo/guest mode works without Firebase

7. **Dashboard**
   - Today's timetable
   - Current mood + check-in
   - Active Pomodoro + streak
   - Suggested playlist
   - Chatbot button

## Visual Design
Light:
- Background #FAF9FC
- Surface #FFFFFF
- Primary #A78BDB
- Accent #7C5CBF
- Text #2B2438

Dark:
- Background #1C1626
- Surface #241B33
- Primary #B79EF0
- Text #F2EEF9

## File structure
```
index.html          // landing + auth
dashboard.html      // main app
css/style.css
js/firebase-config.js
js/auth.js
js/timer.js
js/mood.js
js/playlist.js
js/coach.js
js/app.js
```

## Credentials — fill these in

- [ ] Firebase config object in `js/firebase-config.js`
  - `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
  - Enable Email/Password (and Google) in Firebase Authentication
  - Create Firestore database in test mode to start

- [ ] Chatbase `chatbotId`
  - In `index.html` and `dashboard.html`, uncomment the Chatbase embed block
  - Replace `CHATBOT_ID` with your real ID

- [ ] (Optional) OpenAI / LLM key for the Study Coach
  - Edit `js/coach.js` → `callLLM(prompt)`
  - Uncomment the OpenAI fetch example

- [ ] (Optional) Google Sheets logging
  - If you want Sheets sync, add your Apps Script Web App URL and POST moods/sessions there. Not wired by default.

Once the three checkboxes above are done, the spec is complete top-to-bottom.

## Hosting on GitHub Pages
1. Push the `studymuse/` folder to a repo
2. Settings → Pages → Deploy from branch → main / root
3. Done. Firebase Auth needs your Pages domain added to Authorized domains.

---
Built with lavender and focus. 💜
