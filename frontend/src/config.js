export const API_BASE = (import.meta.env.VITE_API_BASE || window.__API_BASE__) || 
  (import.meta.env.PROD ? '' : 'http://localhost:5001');