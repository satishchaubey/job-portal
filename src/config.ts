// src/config.ts
// Dynamic Backend API base URL resolution logic:
// 1. User manual override saved in localStorage ('sheetSync_apiBaseUrl')
// 2. Vite environment variable VITE_API_BASE at build time
// 3. If accessing via localhost / 127.0.0.1 -> http://localhost:3001
// 4. If accessing via local Wi-Fi IP (e.g. 192.168.x.x) -> http://<IP>:3001
// 5. Default production backend fallback -> https://job-portal-u49p.onrender.com

export const RENDER_BACKEND_URL = 'https://job-portal-u49p.onrender.com';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('sheetSync_apiBaseUrl');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/$/, '');
    }

    const envUrl = (import.meta as any).env?.VITE_API_BASE;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/$/, '');
    }

    const hostname = window.location.hostname;

    // Local development on same machine
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }

    // Local Wi-Fi network testing from mobile (e.g. 192.168.1.15 or 10.x.x.x)
    const isLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/.test(hostname);
    if (isLocalIp) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${protocol}//${hostname}:3001`;
    }
  }

  // Deployed production environment (e.g., GitHub Pages, Render frontend, mobile web)
  return RENDER_BACKEND_URL;
};

export const setApiBase = (url: string): void => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('sheetSync_apiBaseUrl', url.trim());
    } else {
      localStorage.removeItem('sheetSync_apiBaseUrl');
    }
  }
};

// Export API_BASE for backward compatibility
export const API_BASE: string = getApiBase();


