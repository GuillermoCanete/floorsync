import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext(null);

export const ROLES = {
  ENGINEERING: 'engineering',
  SUPERVISOR: 'supervisor',
  HR: 'hr',
  WORKSTATION: 'workstation',
  ADMIN: 'admin',
};

export const ROLE_CONFIG = {
  [ROLES.ENGINEERING]: {
    label: 'Ingeniería',
    icon: '🔧',
    color: '#3b82f6',
    colorDim: 'rgba(59,130,246,0.12)',
    description: 'Diseño de líneas, puestos e instrucciones de trabajo',
    routes: ['/', '/editor', '/positions'],
  },
  [ROLES.SUPERVISOR]: {
    label: 'Supervisor',
    icon: '👔',
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.12)',
    description: 'Evaluación de personal y gestión de ausentismo',
    routes: ['/', '/absenteeism', '/evaluations'],
  },
  [ROLES.HR]: {
    label: 'RRHH',
    icon: '👥',
    color: '#22c55e',
    colorDim: 'rgba(34,197,94,0.12)',
    description: 'Gestión de personal y historial de evaluaciones',
    routes: ['/', '/personnel'],
  },
  [ROLES.WORKSTATION]: {
    label: 'Puesto de Trabajo',
    icon: '🖥️',
    color: '#a855f7',
    colorDim: 'rgba(168,85,247,0.12)',
    description: 'Vista de tablet para el operario del puesto',
    routes: ['/workstation'],
  },
  [ROLES.ADMIN]: {
    label: 'Administrador',
    icon: '👑',
    color: '#ec4899',
    colorDim: 'rgba(236,72,153,0.12)',
    description: 'Acceso total a todos los módulos y funciones del sistema',
    routes: ['/', '/editor', '/positions', '/absenteeism', '/personnel', '/evaluations', '/workstation'],
  },
};

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('floorsync_role') || null;
  });

  const [workstationContext, setWorkstationContext] = useState(() => {
    const saved = localStorage.getItem('floorsync_workstation');
    return saved ? JSON.parse(saved) : null;
  });

  const selectRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('floorsync_role', newRole);
  };

  const setWorkstation = (lineId, positionId) => {
    const ctx = { lineId, positionId };
    setWorkstationContext(ctx);
    localStorage.setItem('floorsync_workstation', JSON.stringify(ctx));
  };

  const clearRole = () => {
    setRole(null);
    setWorkstationContext(null);
    localStorage.removeItem('floorsync_role');
    localStorage.removeItem('floorsync_workstation');
  };

  return (
    <RoleContext.Provider value={{ role, selectRole, clearRole, workstationContext, setWorkstation }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};
