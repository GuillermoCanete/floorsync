import React from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { RoleProvider, useRole, ROLES } from './context/RoleContext';
import { TourProvider } from './context/TourContext';
import GuidedTour, { TourRolePicker } from './components/tour/GuidedTour';
import AppLayout from './components/layout/AppLayout';
import RoleSelector from './pages/RoleSelector';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import PersonnelPage from './pages/PersonnelPage';
import EvaluationsPage from './pages/EvaluationsPage';
import AbsenteeismPage from './pages/AbsenteeismPage';
import PositionsPage from './pages/PositionsPage';
import WorkstationView from './pages/WorkstationView';
import './index.css';

function AppRoutes() {
  const { role } = useRole();

  if (!role) {
    return <RoleSelector />;
  }

  // Workstation role is restricted strictly to /workstation
  if (role === ROLES.WORKSTATION) {
    return (
      <Routes>
        <Route path="/workstation" element={<WorkstationView />} />
        <Route path="*" element={<Navigate to="/workstation" replace />} />
      </Routes>
    );
  }

  // Management/Admin roles get the AppLayout wrapper and navigate freely
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={role === ROLES.ENGINEERING ? <EditorPage /> : <DashboardPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/absenteeism" element={<AbsenteeismPage />} />
        <Route path="/workstation" element={<WorkstationView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <RoleProvider>
        <TourProvider>
          <AppRoutes />
          {/* Tour overlays rendered at root level so they appear above everything */}
          <TourRolePicker />
          <GuidedTour />
        </TourProvider>
      </RoleProvider>
    </HashRouter>
  );
}
