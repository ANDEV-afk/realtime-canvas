<div align="center">

  <!-- Logo -->
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="#4d49fc" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="12" cy="10" r="1.5" fill="#ffffff"/>
  </svg>

  <h1>CoolBoard</h1>
  <p><b>Draw anything. Together.</b></p>
  <p>A high-performance, real-time collaborative whiteboard platform built for modern design, engineering, and remote teams.</p>

  <!-- Badges -->
  <p>
    <a href="https://coolboard.anantdev.me"><img src="https://img.shields.io/badge/Live_Demo-coolboard.anantdev.me-4d49fc?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  </p>

</div>

---

## 🎬 Product Demo & Walkthrough

<div align="center">
  <a href="https://coolboard.anantdev.me">
    <img src="public/demo-preview.gif" alt="CoolBoard Walkthrough" width="100%" />
  </a>
  <p><i>Watch the full project walkthrough and video demonstration above.</i></p>
</div>

---

## ✨ Core Features

- **🎨 Infinite Canvas:** Smooth pan, zoom, and dynamic vector rendering using HTML5 Canvas / SVG engine.
- **⚡ Real-Time Synchronization:** Ultra-low latency multiplayer cursor movements and real-time element state updates using WebSockets / Liveblocks.
- **🔐 Authentication & Workspaces:** Secure user signup, JWT sessions, workspace isolated spaces, and link-based access control.
- **🛠 Shape & Drawing Utilities:** Freehand brush tool, straight lines, geometric primitives, text blocks, and sticky notes.
- **💾 Persistent State Management:** PostgreSQL backend integrated via Prisma ORM for board history and workspace saving.

---

## 🧠 Technical Challenges & Engineering Solutions

### 1. High-Frequency Real-Time State Sync (Multiplayer Cursors)
* **Challenge:** Broadcasting every mouse move event over WebSockets leads to network congestion and main-thread lag when multiple users draw simultaneously.
* **Solution:** Implemented **client-side event throttling (16ms / ~60fps buffer)** combined with spatial interpolation to smooth out cursor movements and minimize payload size.

### 2. Canvas Re-rendering & Performance Optimization
* **Challenge:** Re-rendering complex drawings on large canvases leads to high CPU usage and dropped frames during panning/zooming.
* **Solution:** Segmented canvas elements into spatial chunks and utilized dynamic offscreen rendering layers to process static shapes independently from active user actions.

### 3. State Conflict Resolution
* **Challenge:** Handling simultaneous shape modifications by different users without overwriting actions or causing UI glitches.
* **Solution:** Applied **Conflict-Free Replicated Data Types (CRDTs)** logic combined with optimistic UI updates to instantly render local changes before server confirmation.

---

## 🏗️ Tech Stack

* **Frontend:** Next.js (App Router), React 18, TypeScript
* **Styling & UI Components:** Tailwind CSS, Lucide Icons, Shadcn UI
* **Real-time Infrastructure:** WebSockets / Liveblocks Engine
* **Database & ORM:** PostgreSQL / SQLite, Prisma ORM
* **Deployment & Hosting:** Vercel

---

## 🛠️ Local Development Setup

### Prerequisites
Make sure you have Node.js (v18+) and npm/pnpm installed.

### 1. Clone the Repository
```bash
git clone [https://github.com/ANDDEV-afk/realtime-canvas.git](https://github.com/ANDDEV-afk/realtime-canvas.git)
cd realtime-canvas
```

### 2. Install Dependencies 
```bash
npm install
```

### 3. Environment Variables Setup
Create a .env file in the root directory:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/coolboard?schema=public"
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="your-liveblocks-public-key"
LIVEBLOCKS_SECRET_KEY="your-liveblocks-secret-key"
```

### 4. Setup Database Schema
```bash
npx prisma db push
```

### 5. Launch Local Dev Server
```bash
npm run dev
```
Open http://localhost:3000 to view the app.

---

## 📂 Folder Structure 
```bash
realtime-canvas/
├── prisma/               # Database schema & configuration
├── public/               # Static assets & demo video GIF
├── src/
│   ├── app/              # Next.js App Router routes
│   │   ├── api/          # Dynamic API endpoints
│   │   ├── workspace/    # Real-time workspace route
│   │   ├── icon.tsx      # SVG Dynamic Favicon component
│   │   └── page.tsx      # Landing page UI
│   ├── components/       # Reusable UI & Canvas logic components
│   └── lib/              # Database clients and utility helpers
├── liveblocks.config.ts  # Real-time collaboration engine config
├── middleware.ts         # Authentication & route protection
└── prisma.config.ts      # Prisma ORM settings
```

---

## 🚀 Future Roadmap
- **AI Canvas Assistant**: Auto-generate flowcharts and diagrams using text prompts.
- **Audio/Video Rooms**: Built-in WebRTC voice communication inside workspace rooms.
- **Template Library**: Pre-made templates for Agile retrospectives, mindmaps, and system design.
