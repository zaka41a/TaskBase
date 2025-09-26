# TaskBase — React + Node.js + SQLite (JWT Auth)

A tiny full-stack app to practice **React** (Vite) and **Node.js/Express** with a real API, JWT authentication, and SQLite storage.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: SQLite (via `better-sqlite3`)
- **Auth**: JWT (access token stored in localStorage)
- **Styling**: Plain CSS (optional: Tailwind)

## Features
- Register / Login with hashed passwords
- CRUD Todos (create, toggle done, edit title, delete)
- Per-user data isolation (todos belong to the logged-in user)
- Simple, readable codebase


## Prerequisites
- Node.js ≥ 18
- npm

## Quick Start

### 1) Backend (API)
```bash
cd server
npm i
# Create .env (see below), then:
npm run dev
