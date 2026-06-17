// src/components/tour/GuidedTour.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../../context/TourContext';
import { useRole, ROLES } from '../../context/RoleContext';
import { X, ChevronLeft, ChevronRight, Lightbulb, Wrench, Users, UserCheck, Monitor } from 'lucide-react';

const ROLE_TOUR_CONFIG = {
  engineering: { label: 'Ingeniería', icon: Wrench, color: '#3b82f6', colorDim: 'rgba(59,130,246,0.15)' },
  supervisor: { label: 'Supervisor', icon: UserCheck, color: '#f59e0b', colorDim: 'rgba(245,158,11,0.15)' },
  hr: { label: 'RRHH', icon: Users, color: '#22c55e', colorDim: 'rgba(34,197,94,0.15)' },
  workstation: { label: 'Puesto de Trabajo', icon: Monitor, color: '#a855f7', colorDim: 'rgba(168,85,247,0.15)' },
};

// Role Picker Modal (shown when clicking "Empezar tour" from demo success)
export function TourRolePicker() {
  const { showRolePicker, selectTourRole, endTour } = useTour();
  if (!showRolePicker) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 2000, padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 24, padding: 40, maxWidth: 640, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>
            ¿Qué rol querés recorrer?
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            El tour guiado te lleva por las funciones de cada rol con datos reales del DEMO
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {Object.entries(ROLE_TOUR_CONFIG).map(([roleKey, cfg]) => {
            const Icon = cfg.icon;
            const steps = TOUR_STEPS[roleKey] || [];
            return (
              <button
                key={roleKey}
                onClick={() => selectTourRole(roleKey)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  gap: 10, padding: '18px 20px', borderRadius: 14,
                  background: cfg.colorDim, border: `1.5px solid ${cfg.color}40`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${cfg.color}40`; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${cfg.color}25`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: cfg.color,
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {steps.length} pasos del tour
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={endTour}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            background: 'transparent', border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          Explorar por mi cuenta sin tour
        </button>
      </div>
    </div>
  );
}

// Main floating tour card
export default function GuidedTour() {
  const { isTourActive, tourRole, currentStep, currentStepData, steps, nextStep, prevStep, endTour } = useTour();
  const { selectRole } = useRole();
  const navigate = useNavigate();

  const cfg = tourRole ? ROLE_TOUR_CONFIG[tourRole] : null;

  // Auto-navigate when step changes
  useEffect(() => {
    if (!isTourActive || !currentStepData) return;

    // Set role context based on tour role
    const roleMap = {
      engineering: ROLES.ENGINEERING,
      supervisor: ROLES.SUPERVISOR,
      hr: ROLES.HR,
      workstation: ROLES.WORKSTATION,
    };
    const mappedRole = roleMap[tourRole];
    if (mappedRole) selectRole(mappedRole);

    // Navigate to step's route
    if (currentStepData.route) {
      navigate(currentStepData.route);
    }
  }, [isTourActive, currentStep, tourRole]);

  if (!isTourActive || !currentStepData || !cfg) return null;

  const Icon = cfg.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Subtle overlay that doesn't block interaction */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1500,
        background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)',
      }} />

      {/* Tour Card */}
      <div style={{
        position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1600, width: '100%', maxWidth: 600, padding: '0 16px',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${cfg.color}40`,
          borderRadius: 20,
          boxShadow: `0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px ${cfg.color}20`,
          overflow: 'hidden',
        }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--border-subtle)', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`,
              transition: 'width 0.4s ease',
            }} />
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {/* Role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 100,
                background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase',
                letterSpacing: 0.5, flexShrink: 0,
              }}>
                <Icon size={11} />
                {cfg.label}
              </div>

              {/* Step indicator */}
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1 }}>
                Paso {currentStep + 1} de {steps.length}
              </div>

              {/* Step dots */}
              <div style={{ display: 'flex', gap: 4 }}>
                {steps.map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i <= currentStep ? cfg.color : 'var(--border-strong)',
                    transition: 'background 0.3s ease',
                  }} />
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={endTour}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 4, borderRadius: 6,
                  display: 'flex', alignItems: 'center',
                }}
                title="Cerrar tour"
              >
                <X size={15} />
              </button>
            </div>

            {/* Step content */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `${cfg.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, border: `1px solid ${cfg.color}25`,
              }}>
                {currentStepData.icon}
              </div>

              <div>
                <div style={{
                  fontSize: 16, fontWeight: 800, color: 'var(--text-primary)',
                  marginBottom: 6, letterSpacing: '-0.3px',
                }}>
                  {currentStepData.title}
                </div>
                <div style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                }}>
                  {currentStepData.description}
                </div>
              </div>
            </div>

            {/* Tip */}
            {currentStepData.tip && (
              <div style={{
                display: 'flex', gap: 8, padding: '10px 14px',
                borderRadius: 10, background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.15)', marginBottom: 16,
              }}>
                <Lightbulb size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
                  {currentStepData.tip}
                </span>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={prevStep}
                disabled={isFirst}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)', color: isFirst ? 'var(--text-disabled)' : 'var(--text-secondary)',
                  cursor: isFirst ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                <ChevronLeft size={15} />
                Anterior
              </button>

              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Navegando como <strong style={{ color: cfg.color }}>{cfg.label}</strong>
              </div>

              <button
                onClick={nextStep}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', borderRadius: 10,
                  border: `1px solid ${cfg.color}`,
                  background: isLast ? cfg.color : `${cfg.color}15`,
                  color: isLast ? 'white' : cfg.color,
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit', transition: 'all 0.15s ease',
                }}
              >
                {isLast ? '✅ Finalizar tour' : (
                  <>Siguiente <ChevronRight size={15} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
