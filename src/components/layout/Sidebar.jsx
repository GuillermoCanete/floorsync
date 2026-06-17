import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRole, ROLE_CONFIG, ROLES } from '../../context/RoleContext';
import {
  LayoutDashboard, Map, Users, ClipboardList,
  CalendarX2, Star, RefreshCw, Monitor
} from 'lucide-react';

const NAV_ITEMS = {
  [ROLES.ENGINEERING]: [
    { to: '/', icon: Map, label: 'Editor de Líneas', end: true },
    { to: '/positions', icon: ClipboardList, label: 'Puestos de Trabajo' },
  ],
  [ROLES.SUPERVISOR]: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/editor', icon: Map, label: 'Distribución 2D' },
    { to: '/absenteeism', icon: CalendarX2, label: 'Ausentismo' },
    { to: '/evaluations', icon: Star, label: 'Evaluaciones' },
    { to: '/positions', icon: ClipboardList, label: 'Puestos' },
  ],
  [ROLES.HR]: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/personnel', icon: Users, label: 'Personal' },
    { to: '/evaluations', icon: Star, label: 'Evaluaciones' },
  ],
  [ROLES.WORKSTATION]: [],
  [ROLES.ADMIN]: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/editor', icon: Map, label: 'Editor de Líneas' },
    { to: '/positions', icon: ClipboardList, label: 'Puestos de Trabajo' },
    { to: '/absenteeism', icon: CalendarX2, label: 'Ausentismo' },
    { to: '/personnel', icon: Users, label: 'Personal' },
    { to: '/evaluations', icon: Star, label: 'Evaluaciones' },
    { to: '/workstation', icon: Monitor, label: 'Puesto de Trabajo (Tablet)' },
  ],
};

export default function Sidebar() {
  const { role, clearRole } = useRole();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role];
  const items = NAV_ITEMS[role] || [];

  const handleChangeRole = () => {
    clearRole();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚙️</div>
        <div className="logo-text">Floor<span>Sync</span></div>
      </div>

      {/* Current role badge */}
      <div className="sidebar-role">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 16 }}>{config?.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Rol activo
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {config?.label}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Navegación</div>
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Change role button — bottom, prominent */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
        <button
          onClick={handleChangeRole}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 14px', borderRadius: 10,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#60a5fa',
            cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.16)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
          }}
        >
          <RefreshCw size={14} />
          Cambiar tipo de usuario
        </button>
      </div>
    </aside>
  );
}
