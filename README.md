<div align="center">

  <!-- Logo -->
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="#4d49fc" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="12" cy="10" r="1.5" fill="#ffffff"/>
  </svg>

  <h1>CoolBoard</h1>
  <p><b>Draw anything. Together.</b></p>
  <p>A real-time collaborative whiteboard platform built for modern design, engineering, and remote teams.</p>

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

<!-- Replace DEMO_VIDEO_URL with your Loom/YouTube embed link or an optimized GIF -->
<div align="center">
  <a href="https://coolboard.anantdev.me">
    <img src="https://raw.githubusercontent.com/username/repository/main/public/demo-preview.gif" alt="CoolBoard Walkthrough" width="100%" />
  </a>
  <p><i>Watch the full walkthrough video on <a href="YOUR_LOOM_OR_YOUTUBE_LINK">Loom / YouTube</a></i></p>
</div>

---

## 📸 Screenshots

| Infinite Canvas & Drawing Tools | Real-time Collaboration |
| :---: | :---: |
| <img src="public/screenshots/canvas.png" alt="Canvas View" width="100%" /> | <img src="public/screenshots/collaboration.png" alt="Realtime Sync" width="100%" /> |

| Workspace Management | Dark / Light Theme Support |
| :---: | :---: |
| <img src="public/screenshots/workspace.png" alt="Workspace" width="100%" /> | <img src="public/screenshots/theme.png" alt="Theme" width="100%" /> |

---

## ✨ Features

- **🎨 Infinite Canvas:** Unlimited zoom, pan, and draw interface designed for latency-free brainstorming.
- **⚡ Real-time Synchronization:** Low-latency multiplayer cursor tracking and state synchronization powered by WebSockets / CRDTs.
- **🔐 Workspace & Authentication:** Secure user authentication with project access control and invite link management.
- **🛠 Shape & Note Tools:** Freehand pen, geometric vector shapes, sticky notes, and text blocks.
- **💾 State Persistence:** Database persistence backed by Prisma ORM for saving board history.

---

## 🏗️ Tech Stack

- **Frontend Framework:** Next.js (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS, Shadcn UI
- **Database & ORM:** PostgreSQL / SQLite, Prisma ORM
- **State Management & Real-time:** WebSockets / CRDT Engine
- **Deployment:** Vercel

---

## 🛠️ Local Development Setup

### Prerequisites
Make sure you have Node.js (v18+ recommended) and `npm` or `pnpm` installed.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/coolboard.git](https://github.com/your-username/coolboard.git)
cd coolboard
