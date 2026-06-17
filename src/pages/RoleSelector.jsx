import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole, ROLES, ROLE_CONFIG } from '../context/RoleContext';
import { useTour } from '../context/TourContext';
import { subscribeToLines, subscribeToPositions } from '../firebase/db';
import { loadDemoData } from '../demo/loadDemo';
import { Wrench, UserCheck, Users, Monitor, Shield, Play, CheckCircle, Loader, AlertCircle } from 'lucide-react';

const ROLE_ICONS = {
  [ROLES.ENGINEERING]: Wrench,
  [ROLES.SUPERVISOR]: UserCheck,
  [ROLES.HR]: Users,
  [ROLES.WORKSTATION]: Monitor,
  [ROLES.ADMIN]: Shield,
};

// ── DEMO LOADER MODAL ──────────────────────────────────────
function DemoModal({ onClose, onTourStart }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [progress, setProgress] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const handleLoad = async () => {
    setStatus('loading');
    setLogs([]);
    try {
      await loadDemoData((msg) => {
        setProgress(msg);
        setLogs(prev => [...prev, msg]);
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Error desconocido');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 3000, padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 24, padding: 36, maxWidth: 520, width: '100%',
        boxShadow: '0 32px 100px rgba(0,0,0,0.8)',
        animation: 'slideUp 0.3s ease',
      }}>
        {status === 'idle' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>
                Cargar Empresa DEMO
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Esto va a crear datos ficticios de una fábrica completa:
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {[
                ['🏭', '1 línea de producción con layout 2D', 'Manufacturera Austral S.A. — 30m × 15m'],
                ['📍', '80 puestos de trabajo con IT', 'IT-001 al IT-080, distribuidos en 5 áreas'],
                ['👷', '107 empleados ficticios', '80 operarios + 27 administrativos y técnicos'],
                ['⭐', 'Evaluaciones de personal', 'Historial completo con distribución realista 1-4'],
                ['📅', '6 ausentes (7% de la línea)', 'Con reemplazos automáticos sugeridos'],
                ['🎯', 'Tour guiado interactivo', 'Por los 4 roles: Ingeniería, Supervisor, RRHH, Puesto'],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{
                  display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>



            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleLoad}
                style={{
                  flex: 2, padding: '11px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none', color: 'white', cursor: 'pointer', fontSize: 14,
                  fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Play size={16} /> Cargar DEMO
              </button>
            </div>
          </>
        )}

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '4px solid var(--border-default)',
              borderTopColor: '#3b82f6',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Cargando datos DEMO...</div>
            <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 20 }}>{progress}</div>
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 10, padding: 14,
              maxHeight: 160, overflowY: 'auto', textAlign: 'left',
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent-green)' }}>✓</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--accent-green)' }}>
              ¡DEMO cargado exitosamente!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
              La empresa <strong style={{ color: 'var(--text-primary)' }}>Manufacturera Austral S.A.</strong> está lista.<br />
              107 empleados · 80 puestos · 6 ausentes hoy
            </div>

            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 12, padding: '14px 20px', marginBottom: 24, fontSize: 13,
              color: '#86efac', lineHeight: 1.6,
            }}>
              🎯 <strong>Recomendación:</strong> Iniciá el tour guiado para conocer todas las funciones de cada rol antes de explorar.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                  fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                Explorar solo
              </button>
              <button
                onClick={onTourStart}
                style={{
                  flex: 2, padding: '11px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none', color: 'white', cursor: 'pointer', fontSize: 14,
                  fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
                }}
              >
                🎯 Iniciar tour guiado
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={48} color="var(--accent-red)" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--accent-red)' }}>
              Error al cargar el DEMO
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cerrar</button>
              <button onClick={handleLoad} className="btn btn-primary" style={{ flex: 1 }}>Reintentar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WORKSTATION PICKER ────────────────────────────────────
function WorkstationPicker({ onConfirm, onCancel }) {
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedPos, setSelectedPos] = useState('');

  useEffect(() => {
    const unsub = subscribeToLines(setLines);
    return unsub;
  }, []);

  useEffect(() => {
    if (!selectedLine) { setPositions([]); return; }
    const unsub = subscribeToPositions(setPositions, selectedLine);
    return unsub;
  }, [selectedLine]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header" style={{ padding: '20px 24px 16px' }}>
          <div className="modal-title">🖥️ Seleccionar Puesto</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Línea de Producción</label>
            <select className="form-select" value={selectedLine} onChange={e => { setSelectedLine(e.target.value); setSelectedPos(''); }}>
              <option value="">-- Seleccionar línea --</option>
              {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Puesto de Trabajo</label>
            <select className="form-select" value={selectedPos} onChange={e => setSelectedPos(e.target.value)} disabled={!selectedLine}>
              <option value="">-- Seleccionar puesto --</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.posNumber ? `${p.posNumber} - ` : ''}{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" disabled={!selectedLine || !selectedPos} onClick={() => onConfirm(selectedLine, selectedPos)}>
            Abrir Vista
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ROLE SELECTOR ────────────────────────────────────
export default function RoleSelector() {
  const { selectRole, setWorkstation } = useRole();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [showWorkstationPicker, setShowWorkstationPicker] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleSelectRole = (roleKey) => {
    if (roleKey === ROLES.WORKSTATION) {
      setShowWorkstationPicker(true);
      return;
    }
    selectRole(roleKey);
    navigate('/');
  };

  const handleTourStart = () => {
    setShowDemoModal(false);
    startTour(); // Opens role picker for tour
  };

  return (
    <div className="role-selector-page">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 30px rgba(59,130,246,0.3)',
          }}>⚙️</div>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>
              Floor<span style={{ color: '#3b82f6' }}>Sync</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Sistema de Gestión de Planta Industrial
            </div>
          </div>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          Seleccioná tu rol para continuar
        </p>
      </div>

      {/* Role cards */}
      <div className="role-cards-grid">
        {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
          const Icon = ROLE_ICONS[roleKey];
          return (
            <button
              key={roleKey}
              className="role-card"
              style={{ '--role-color': config.color, '--role-color-dim': config.colorDim }}
              onClick={() => handleSelectRole(roleKey)}
            >
              <div className="role-card-icon"><Icon size={28} /></div>
              <div className="role-card-title">{config.label}</div>
              <div className="role-card-desc">{config.description}</div>
            </button>
          );
        })}
      </div>

      {/* DEMO Button */}
      <div style={{ marginTop: 36, width: '100%', maxWidth: 720, textAlign: 'center' }}>
        <button
          onClick={() => setShowDemoModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))',
            border: '1.5px solid rgba(245,158,11,0.3)',
            color: '#fbbf24', cursor: 'pointer', fontSize: 15,
            fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(245,158,11,0.1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.12))';
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))';
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <span style={{ fontSize: 20 }}>🏭</span>
          Cargar Empresa DEMO
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
            background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            + Tour guiado
          </span>
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
          Carga 107 empleados, 80 puestos y un tour interactivo de todos los módulos
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        FloorSync v1.0 · Sincronización en tiempo real · Firebase Firestore
      </div>

      {/* Modals */}
      {showDemoModal && (
        <DemoModal
          onClose={() => setShowDemoModal(false)}
          onTourStart={handleTourStart}
        />
      )}

      {showWorkstationPicker && (
        <WorkstationPicker
          onConfirm={(lineId, positionId) => {
            selectRole(ROLES.WORKSTATION);
            setWorkstation(lineId, positionId);
            navigate('/workstation');
          }}
          onCancel={() => setShowWorkstationPicker(false)}
        />
      )}
    </div>
  );
}
