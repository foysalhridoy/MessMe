# MessMe

> **MessMe** is a premium, minimal, username-based messaging web application designed exclusively for chatting.

MessMe eliminates traditional authentication friction—no sign-in, no sign-up, no passwords, no email or phone verification. Users establish identity simply by choosing a globally unique username.

---

## Key Highlights

- **Branding & Visual Identity:** Strictly white and light theme only. Zero dark mode.
- **Typography:** Lexend applied universally across all UI elements, headings, messages, and inputs.
- **Username-First Identity System:** No passwords or social logins. Usernames are public identifiers decoupled from stable internal UUIDs and cryptographic session tokens.
- **Real-Time Messaging:** Live message streaming, typing indicators, and read states.
- **Voice Messages:** In-browser audio recording via MediaRecorder, duration indicators, waveform visualization, and instant playback.
- **Message Reactions:** Quick floating reaction bar (❤️, 👍, 🔥, 😂, 😮, 😢) plus full emoji reaction picker with count badges and user reaction toggling.
- **Replies:** Quoted reply previews in both composer and message bubbles with interactive jump-to-original navigation and highlight flash.
- **Emoji Picker:** Categorized, searchable, cursor-aware emoji inserter.
- **Search & Management:** Username search for finding contacts, in-conversation message search with match navigation, pinning, muting, and clearing conversation history.
- **Dual Engine Architecture:**
  - **Local Multi-Tab Realtime Bus:** Runs out-of-the-box with zero configuration using `BroadcastChannel` for cross-tab communication.
  - **Production Supabase Integration:** Ready-to-deploy PostgreSQL schema, Row Level Security, and Realtime channels.

---

## Architecture & Security Model

### 1. Username vs. Identity Separation
A username is a public handle, not proof of identity. Knowing someone else's username does not grant access to their account or conversations.
- **Public Handle:** `@username` (case-insensitively unique, 3–20 characters).
- **Internal ID:** Stable UUID (`crypto.randomUUID()`) used for all relational foreign keys.
- **Session Key:** Cryptographic token (`mm_tok_...`) generated on client registration, stored in secure local storage.
- **Session Recovery:** Users can view and export their Session Backup Key in Profile settings, allowing safe restoration on another browser or device without passwords.

### 2. Real-Time Engine
- **Local Engine (Demo Mode):** Uses `BroadcastChannel('messme_realtime_bus')` to sync messages, reactions, typing indicators, and presence across multiple browser tabs on the same machine. Includes intelligent simulated responses from sample contacts (`@elena_ux`, `@marcus_dev`, `@sophia_ai`, `@david_sound`).
- **Production Mode:** Plug in your Supabase project URL and Anon key via `.env` or directly through the in-app Backend Connection modal.

---

## Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Light palette, Lexend typography tokens)
- **Icons:** Lucide React
- **Audio:** Web Audio API & MediaRecorder API
- **Backend / Database:** Supabase PostgreSQL (or Local BroadcastChannel Engine)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 3. Testing Real-Time Across Tabs
1. Open `http://localhost:5173` in your browser and register as `@alice`.
2. Open a private/incognito window (or second tab) and register as `@bob`.
3. In `@alice`'s window, click **+** to search `@bob` and start chatting.
4. Send text, emoji, voice notes, and reactions—watch them synchronize in real time!

---

## Connecting Production Supabase

1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the script in `supabase/schema.sql`.
3. Copy your **Project URL** and **Anon Public Key**.
4. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Alternatively, click the **Demo/Live** badge in the MessMe sidebar header to connect your credentials directly from the UI without restarting).*

---

## Production Build

```bash
npm run build
```

The output will be generated in the `dist` folder, ready for deployment on Vercel, Netlify, Cloudflare Pages, or any static host.
