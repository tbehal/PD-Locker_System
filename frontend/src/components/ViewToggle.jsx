import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const views = [
  { path: '/schedule', label: 'Schedule' },
  { path: '/registration', label: 'Registration' },
];

export default function ViewToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
      {views.map(({ path, label }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            pathname === path
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
