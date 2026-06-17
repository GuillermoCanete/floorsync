// src/context/TourContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const TourContext = createContext(null);

// ══════════════════════════════════════════════
// TOUR STEPS per role
// Each step: { route, title, description, icon, highlight (optional hint) }
// ══════════════════════════════════════════════
export const TOUR_STEPS = {
  engineering: [
    {
      route: '/',
      icon: '📊',
      title: 'Dashboard — Visión General',
      description: 'El dashboard muestra en tiempo real cuántos empleados están presentes, cuántos ausentes, las líneas activas y alertas críticas como puestos sin personal capacitado.',
      tip: 'Todos los datos se actualizan automáticamente en todos los dispositivos sin necesidad de recargar.',
    },
    {
      route: '/editor',
      icon: '🗺️',
      title: 'Editor de Líneas de Producción',
      description: 'Ingeniería diseña el layout de planta en 2D a escala. Podés ver la Línea 1 cargada con los 80 puestos de trabajo distribuidos en 5 áreas.',
      tip: 'Hacé clic en "Línea 1 — Ensamble Modular Austral" para abrir el editor interactivo con el layout completo.',
    },
    {
      route: '/editor',
      icon: '✏️',
      title: 'Herramientas de Dibujo',
      description: 'El editor tiene herramientas para dibujar rectángulos, líneas, círculos, sillas y "📍 Puestos" (los bloques azules vinculados a una IT). Podés hacer zoom con la rueda del mouse y cambiar entre mm, cm y m.',
      tip: 'Los bloques de color representan los 80 puestos de trabajo, cada uno con su instrucción de trabajo (IT) asignada por ingeniería.',
    },
    {
      route: '/positions',
      icon: '📋',
      title: 'Instrucciones de Trabajo (IT)',
      description: 'Cada puesto tiene su Instrucción de Trabajo (IT). Ingeniería las crea, edita y asigna operarios. En el DEMO están los 80 puestos con IT del IT-001 al IT-080.',
      tip: 'Hacé clic en cualquier puesto para ver su IT, el operario asignado y el personal capacitado disponible como reemplazo.',
    },
  ],
  supervisor: [
    {
      route: '/',
      icon: '📊',
      title: 'Dashboard del Supervisor',
      description: 'Hoy hay 6 ausentes (7% de la línea). El sistema detectó automáticamente los puestos vacantes y calculó reemplazos disponibles. Las alertas en rojo muestran puestos sin cobertura.',
      tip: 'Los datos de ausentismo se actualizan en tiempo real. Cuando marcás a alguien ausente, todas las tablets y pantallas lo reflejan al instante.',
    },
    {
      route: '/absenteeism',
      icon: '📅',
      title: 'Tablero de Ausentismo del Día',
      description: 'Aquí el supervisor ve el estado de cada puesto. Los empleados ausentes figuran en rojo y el sistema sugiere automáticamente el mejor reemplazo disponible — priorizando a quienes tienen nivel 4 (Experto).',
      tip: 'Hacé clic en un reemplazo sugerido para confirmarlo. Esa acción actualiza la vista tablet del puesto automáticamente.',
    },
    {
      route: '/evaluations',
      icon: '⭐',
      title: 'Registro de Evaluaciones',
      description: 'El supervisor evalúa al personal en una escala del 1 al 4. Estas evaluaciones quedan registradas con fecha, nombre del supervisor y notas. El historial es inmutable.',
      tip: 'Las evaluaciones determinan quién puede reemplazar a quién. Solo empleados con nivel ≥ 3 son sugeridos como reemplazos.',
    },
    {
      route: '/positions',
      icon: '📍',
      title: 'Estado de Puestos de la Línea',
      description: 'El supervisor puede ver todos los puestos agrupados por línea, quién está asignado hoy, y la lista completa de personal capacitado para cada uno.',
      tip: 'El badge verde "Asignado" y rojo "Vacante" se actualiza automáticamente según el registro de ausentismo del día.',
    },
  ],
  hr: [
    {
      route: '/',
      icon: '📊',
      title: 'Dashboard de RRHH',
      description: 'RRHH ve el total de personal activo, las evaluaciones recientes y alertas sobre puestos críticos sin personal capacitado. Toda la información es en tiempo real.',
      tip: 'La métrica "Puestos sin experto" (nivel ≥ 3) es clave para planificar el plan de capacitación.',
    },
    {
      route: '/personnel',
      icon: '👥',
      title: 'Gestión de Personal',
      description: 'RRHH gestiona el alta, baja y modificación de los 107 empleados del DEMO. Cada tarjeta muestra los scores del empleado en los distintos puestos donde fue evaluado.',
      tip: 'Los badges de colores (rojo=1, amarillo=2, verde=3, azul=4) muestran el nivel de capacitación en cada puesto.',
    },
    {
      route: '/personnel',
      icon: '📁',
      title: 'Ficha Completa del Empleado',
      description: 'Hacé clic en cualquier empleado para ver su ficha completa: matriz de capacitación por puesto, historial cronológico de evaluaciones con notas del supervisor, y estado de actividad.',
      tip: 'El historial de evaluaciones es inmutable — no se puede editar, solo agregar nuevas evaluaciones. Esto garantiza trazabilidad.',
    },
    {
      route: '/evaluations',
      icon: '📈',
      title: 'Historial de Evaluaciones',
      description: 'RRHH puede ver todas las evaluaciones registradas, filtrar por línea o empleado, y exportar el historial. Las evaluaciones del DEMO muestran la distribución típica de un equipo real.',
      tip: 'La distribución del DEMO: 10% nivel 1, 20% nivel 2, 45% nivel 3, 25% nivel 4 — una distribución realista de una línea madura.',
    },
  ],
  workstation: [
    {
      route: '/workstation',
      icon: '🖥️',
      title: 'Vista Tablet del Puesto de Trabajo',
      description: 'Esta pantalla está diseñada para colocarse en una tablet en el puesto de trabajo. Muestra en grande el nombre del puesto, el operario asignado y la Instrucción de Trabajo (IT).',
      tip: 'Cuando el supervisor marca a un operario como ausente, esta pantalla se actualiza automáticamente mostrando al reemplazo.',
    },
    {
      route: '/workstation',
      icon: '👤',
      title: 'Información del Operario',
      description: 'El panel izquierdo muestra el operario actualmente asignado al puesto. Si está ausente, aparece tachado en rojo y se muestra el reemplazo sugerido con su nivel de capacitación.',
      tip: 'La actualización es en tiempo real — sin necesidad de recargar la página. La tablet siempre muestra información vigente.',
    },
    {
      route: '/workstation',
      icon: '📋',
      title: 'Instrucción de Trabajo (IT)',
      description: 'El panel derecho muestra la instrucción de trabajo completa del puesto, tal como la cargó ingeniería. En producción real, aquí van los pasos del proceso, especificaciones técnicas y criterios de calidad.',
      tip: 'El DEMO muestra el nombre del documento IT. En producción, Ingeniería puede escribir instrucciones completas con pasos detallados.',
    },
  ],
};

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourRole, setTourRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const startTour = useCallback((role = null) => {
    if (role) {
      setTourRole(role);
      setCurrentStep(0);
      setIsTourActive(true);
      setShowRolePicker(false);
    } else {
      setShowRolePicker(true);
    }
  }, []);

  const selectTourRole = useCallback((role) => {
    setTourRole(role);
    setCurrentStep(0);
    setIsTourActive(true);
    setShowRolePicker(false);
  }, []);

  const nextStep = useCallback(() => {
    const steps = TOUR_STEPS[tourRole] || [];
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setIsTourActive(false);
      setTourRole(null);
      setCurrentStep(0);
    }
  }, [currentStep, tourRole]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setTourRole(null);
    setCurrentStep(0);
    setShowRolePicker(false);
  }, []);

  const steps = tourRole ? (TOUR_STEPS[tourRole] || []) : [];
  const currentStepData = steps[currentStep] || null;

  return (
    <TourContext.Provider value={{
      isTourActive, tourRole, currentStep, currentStepData, steps,
      showRolePicker,
      startTour, selectTourRole, nextStep, prevStep, endTour,
    }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be inside TourProvider');
  return ctx;
};
