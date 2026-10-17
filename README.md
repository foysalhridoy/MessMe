# MessMee 💬

<div align="center">

![MessMee Banner](https://img.shields.io/badge/MessMee-Worldclass%20Messaging-indigo?style=for-the-badge&logo=messenger&logoColor=white)

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646C9A?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<p align="center">
  <strong>A minimal, passwordless, username-first real-time messaging web application.</strong><br>
  Built with the butter-smooth responsiveness and polish of WhatsApp and Telegram.
</p>

[Features](#-key-features) • [Architecture](#-architecture--security-model) • [Tech Stack](#-tech-stack) • [Quick Start](#-getting-started) • [Supabase Setup](#-production-supabase-configuration)

</div>

---

## 🌟 Overview

**MessMee** removes all traditional authentication friction—no phone numbers, no passwords, no email confirmations, and no SMS OTPs. Users establish identity simply by choosing a globally unique `@username`.

Under the hood, public usernames are decoupled from stable internal UUIDs and cryptographic session backup keys, giving users instant onboarding while maintaining cryptographic security, real-time synchronization, and native-grade fluid performance.

---

## ✨ Key Features

### 🫧 Telegram & WhatsApp-Grade Message UX
- **Grouped Clustered Bubbles:** Consecutive messages from the same participant feature responsive, dynamic corner radiuses (`rounded-2xl` with adjacent micro-radiuses) for clean visual cohesion.
- **Double-Click Quick React (❤️):** Double-click or double-tap any message to trigger a floating heart burst micro-animation and immediately register a reaction.
- **Inline Status Receipts:** Micro checkmarks (single check for sent, double check for delivered/read) pinned cleanly to the bottom right of each bubble.
- **Quoted Replies:** Tap reply to quote any message with instant scroll-and-flash jump navigation.
- **Message Actions Toolbar:** Hover or tap to copy text, edit sent messages, react, or delete.

### 🎙️ Studio Voice Notes & Player
- **In-Browser Audio Recording:** Real-time microphone capture with audio track cleanup and live recording timer.
- **Interactive Waveform Player:** 26-bar visualizer with scrub/seek support.
- **1x / 1.5x / 2x Speed Multiplier:** Toggle audio playback speed on the fly like WhatsApp and Telegram.

### ⚡ Real-Time Typing & Presence
- **Live 3-Dot Typing Wave:** Telegram-style bouncing dots indicator (`typing-dot-1, 2, 3`) both in the header and in the active chat stream.
- **Online Presence & Last Seen:** Live tracking of user connectivity.

### 📱 Butter-Smooth Mobile Slide Navigation
- **Zero-Flicker Hardware-Accelerated Viewport:** On mobile, switching between conversations and chat uses CSS `transform: translateX` with spring physics (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Native Browser Back Integration:** Tapping the mobile hardware or browser back button slides smoothly back to the conversation list without reloading.

### 🔍 Advanced Search & Conversation Management
- **In-Chat Message Search:** Highlight query matches across the conversation with forward/backward match navigation and auto-scroll.
- **Global Contact Search:** Instant debounced username discovery with availability indicator.
- **Pin & Mute:** Pin priority conversations to the top; mute notifications for specific threads.
- **Block & Privacy:** Block or unblock users with instant UI enforcement.

### 🔊 Tactile Sound Design
- **Web Audio API Feedback:** Zero-latency synthesized soft pop sound on send and gentle bell notification chime on incoming messages (operates offline without heavy media downloads).

---

## 🏗️ Architecture & Security Model

```
+--------------------------------------------------------------------------+
|                                Client UI                                 |
|  (React 19 + TypeScript + Tailwind CSS + Lexend + Framer-grade Motion)   |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+------------------------------------+-------------------------------------+
|                     Dual Real-Time Data Engine                           |
|                                                                          |
|  [Mode A: Local Bus]                         [Mode B: Cloud Supabase]    |
|  - BroadcastChannel ('messme_realtime_bus')  - PostgreSQL Database       |
|  - Zero config, offline-first                - Row Level Security (RLS)  |
|  - Instant multi-tab testing                 - Realtime WebSockets       |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+------------------------------------+-------------------------------------+
|                      Cryptographic Identity                              |
|  - Public Handle:   @username (unique, case-insensitive)                 |
|  - Internal ID:     UUID v4 (stable foreign key across tables)           |
|  - Session Key:     mm_tok_... (stored locally; exportable for backup)    |
+--------------------------------------------------------------------------+
```

### 1. Username vs. Identity Separation
Knowing someone's public `@username` does not grant access to their account:
* **Public Handle:** `@username` (3–20 alphanumeric characters).
* **Internal UUID:** `crypto.randomUUID()` used as the foreign key in database relations.
* **Cryptographic Token:** `mm_tok_<random>` generated client-side during registration.
* **Session Recovery:** Users can view, copy, and backup their Session Token in Profile Settings to safely restore their chat identity on another browser or device.

### 2. Dual-Engine Real-Time Layer
1. **Local Mode (Default):** Runs immediately out of the box with zero external configuration using `BroadcastChannel`. Open two tabs or private windows to test live chat right away.
2. **Production Mode:** Connect any [Supabase](https://supabase.com) project with a single click or environment variables for cross-device cloud persistence.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) with pure vanilla tokens |
| **Typography** | [Lexend](https://fonts.google.com/specimen/Lexend) (universal font family) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Audio** | Web Audio API & MediaRecorder API |
| **Realtime / DB** | [Supabase](https://supabase.com/) PostgreSQL + Browser BroadcastChannel |
| **Linter / Quality** | [Oxlint](https://oxc.rs/) (0 warnings, 0 errors) |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* `npm` or `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/foysalhridoy/MessMe.git
cd MessMe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open https://messmee.vercel.app/ in your browser.

### 4. Test Multi-User Real-Time (Local Mode)
1. Open https://messmee.vercel.app/ in a standard browser tab and register as `@alice`.
2. Open https://messmee.vercel.app/ in an Incognito / Private window and register as `@bob`.
3. In `@alice`'s window, click **+ (New Chat)**, search `@bob`, and start chatting!
4. Send text, voice notes, photos, and reactions to experience live real-time sync across tabs.

---

## 🌐 Production Supabase Configuration

To enable cloud sync across different machines and phones:

1. Create a free project on [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase dashboard and run the schema file located at:
   ```
   supabase/schema.sql
   ```
3. Copy your **Project URL** and **Anon Public API Key** from **Project Settings > API**.
4. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *(Alternatively, credentials can also be configured directly through the in-app backend configuration modal).*

---

## 📦 Production Build

Validate type safety and create an optimized production build:

```bash
# Typecheck and production bundle
npm run build

# Preview production build locally
npm run preview
```

The compiled assets will be placed in the `dist/` directory, ready to deploy to [Vercel](https://vercel.com), [Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com/), or any static hosting service.

---

## 📁 Project Structure

```
MessMe/
├── src/
│   ├── components/
│   │   ├── chat/              # Chat area, bubbles, composer, audio player, reactions
│   │   ├── common/            # Buttons, modals, avatars, toast notifications
│   │   ├── onboarding/        # Welcome screen, username registration, recovery modal
│   │   └── sidebar/           # Conversation list, search, filters, profile settings
│   ├── context/               # ChatContext, useChat hook, and state management
│   ├── lib/                   # Audio synth, avatar generation, identity tokens, Supabase client
│   ├── services/              # Local storage, broadcast channel, and Supabase db operations
│   ├── types/                 # TypeScript interfaces and data models
│   ├── App.tsx                # Responsive application layout with sliding viewport
│   ├── index.css              # Custom styling, animations, and typography tokens
│   └── main.tsx               # Root entry point
├── supabase/
│   └── schema.sql             # Production PostgreSQL schema with Row Level Security
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
