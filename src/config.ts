// src/config.ts
// Backend API base URL — reads from Vite env variable at build time.
// In development (npm run dev): VITE_API_BASE is not set, so it falls back to localhost:3001
// In production (GitHub Pages): VITE_API_BASE should be your deployed Render backend URL.
// Set this in GitHub repository Settings → Secrets and variables → Actions → Variables:
//   Name:  VITE_API_BASE
//   Value: https://your-app-name.onrender.com

export const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, '') ||
  'http://localhost:3001';
