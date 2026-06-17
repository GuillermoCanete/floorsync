import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useRole, ROLES, ROLE_CONFIG } from '../../context/RoleContext';
import { RefreshCw } from 'lucide-react';

export default function AppLayout() {
  const { role, clearRole } = useRole();
  const navigate = useNavigate();

  // Workstation has its own full-screen layout
  if (role === ROLES.WORKSTATION) {
    return <Outlet />;
  }

  const config = ROLE_CONFIG[role] || {};

  const handleChangeRole = () => {
    clearRole();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── TOP BAR: always visible on all pages ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 20px', height: 44, flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          gap: 10,
        }}>
          {/* Current role indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-tertiary)',
          }}>
            <span style={{ fontSize: 14 }}>{config.icon}</span>
            <span>Sesión: <strong style={{ color: 'var(--text-secondary)' }}>{config.label}</strong></span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Change role button — always visible */}
          <button
            onClick={handleChangeRole}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 8,
              background: 'rgba(59,130,246,0.09)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.09)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }}
          >
            <RefreshCw size={12} />
            Cambiar tipo de usuario
          </button>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
