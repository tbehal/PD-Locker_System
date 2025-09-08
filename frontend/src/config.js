export const API_BASE = (import.meta.env.VITE_API_BASE || window.__API_BASE__) || 
  (import.meta.env.PROD ? 'https://your-vercel-app.vercel.app' : 'http://localhost:5001');