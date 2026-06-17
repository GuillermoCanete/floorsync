import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import {
  subscribeToPositions, subscribeToAssignments, subscribeToTodayAbsences,
  findReplacementsDetailed, subscribeToEmployees, subscribeToLines
} from '../firebase/db';
import { Wifi, WifiOff, RefreshCw, FileText } from 'lucide-react';

// Blob URL Cache to prevent memory leaks and unnecessary iframe reloads
const blobUrlCache = new Map();
const getBlobUrl = (base64Data) => {
  if (!base64Data) return null;
  if (blobUrlCache.has(base64Data)) return blobUrlCache.get(base64Data);
  try {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'application/pdf';
    const raw = window.atob(parts[1] || parts[0]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    const url = URL.createObjectURL(blob);
    blobUrlCache.set(base64Data, url);
    return url;
  } catch (e) {
    console.error('Error converting base64 to blob url:', e);
    return base64Data;
  }
};

const SCORE_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Autónomo', 4: 'Experto' };

const isImageFile = (fileName, url) => {
  if (!fileName) return false;
  const nameLower = fileName.toLowerCase();
  return (
    nameLower.endsWith('.png') ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.gif') ||
    nameLower.endsWith('.svg') ||
    nameLower.endsWith('.webp') ||
    (url && url.startsWith('data:image/'))
  );
};

export default function WorkstationView() {
  const { workstationContext, clearRole, setWorkstation } = useRole();
  const { lineId, positionId } = workstationContext || {};
  const navigate = useNavigate();

  const handleChangeRole = () => {
    clearRole();
    navigate('/');
  };

  const [position, setPosition] = useState(null);
  const [line, setLine] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [allAssignments, setAllAssignments] = useState([]);
  const [absence, setAbsence] = useState(null);
  const [replacement, setReplacement] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [showFullScreenPDF, setShowFullScreenPDF] = useState(false);

  // Selector state for when workstationContext is not set (e.g. Admin view)
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedPos, setSelectedPos] = useState('');

  useEffect(() => {
    if (!lineId || !positionId) {
      const unsub = subscribeToLines(setLines);
      return unsub;
    }
  }, [lineId, positionId]);

  useEffect(() => {
    if (!selectedLine) { setPositions([]); return; }
    const unsub = subscribeToPositions(setPositions, selectedLine);
    return unsub;
  }, [selectedLine]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { clearInterval(timer); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    if (!lineId || !positionId) return;

    const unsubs = [
      subscribeToLines((lines) => {
        const l = lines.find(l => l.id === lineId);
        setLine(l || null);
      }),
      subscribeToPositions((positions) => {
        const p = positions.find(p => p.id === positionId);
        setPosition(p || null);
      }, lineId),
    ];
    return () => unsubs.forEach(u => u());
  }, [lineId, positionId]);

  useEffect(() => {
    if (!positionId) return;
    const unsub = subscribeToAssignments((data) => {
      setAllAssignments(data);
      const a = data.find(a => a.positionId === positionId);
      setAssignment(a || null);
    });
    return unsub;
  }, [positionId]);

  useEffect(() => {
    if (!assignment) return;
    const unsub = subscribeToTodayAbsences((absences) => {
      const a = absences.find(ab => ab.employeeId === assignment.employeeId);
      setAbsence(a || null);
    });
    return unsub;
  }, [assignment]);

  // Load all employees for replacement lookup
  useEffect(() => {
    const unsub = subscribeToEmployees(setEmployees);
    return unsub;
  }, []);

  // Find replacement when absent — uses detailed logic (free vs moveable)
  useEffect(() => {
    if (!absence || !positionId || !employees.length) { setReplacement(null); return; }
    findReplacementsDetailed(
      positionId,
      [absence.employeeId],
      allAssignments,
      [] // positions not needed for name here
    ).then(({ free, moveable }) => {
      // Prefer a free replacement; fall back to moveable
      const best = free[0] || moveable[0] || null;
      if (best) {
        const repEmp = employees.find(e => e.id === best.employeeId);
        setReplacement(repEmp ? { ...best, employee: repEmp, isMoveable: !free[0] } : null);
      } else {
        setReplacement(null);
      }
    });
  }, [absence, positionId, employees, allAssignments]);

  const getEmployee = (id) => employees.find(e => e.id === id);
  const assignedEmployee = assignment ? getEmployee(assignment.employeeId) : null;



  const handleOpenPDF = () => {
    setShowFullScreenPDF(true);
  };

  const timeStr = time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const shift = time.getHours() < 14 ? 'Turno Mañana' : time.getHours() < 22 ? 'Turno Tarde' : 'Turno Noche';

  if (!lineId || !positionId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 20 }}>
        <div className="card" style={{ maxWidth: 450, width: '100%', padding: 30, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🖥️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Simular Puesto de Trabajo</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Seleccioná un puesto de producción para ver la interfaz de la tableta de operaciones.
            </p>
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Línea de Producción</label>
            <select className="form-select" value={selectedLine} onChange={e => { setSelectedLine(e.target.value); setSelectedPos(''); }}>
              <option value="">-- Seleccionar línea --</option>
              {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Puesto de Trabajo</label>
            <select className="form-select" value={selectedPos} onChange={e => setSelectedPos(e.target.value)} disabled={!selectedLine}>
              <option value="">-- Seleccionar puesto --</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.posNumber ? `${p.posNumber} - ` : ''}{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '11px', borderRadius: 10, fontWeight: 700 }}
              onClick={handleChangeRole}
            >
              Cambiar usuario
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1.5, padding: '11px', borderRadius: 10, fontWeight: 700 }}
              disabled={!selectedLine || !selectedPos}
              onClick={() => {
                setWorkstation(selectedLine, selectedPos);
              }}
            >
              Abrir Interfaz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workstation-view">
      {/* Header */}
      <div className="workstation-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 0 20px rgba(59,130,246,0.3)'
          }}>⚙️</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              FloorSync · {line?.name || 'Línea de producción'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              {position?.posNumber ? `${position.posNumber} - ` : ''}{position?.name || 'Puesto'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {timeStr}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{dateStr}</span>
            <span className="badge badge-blue">{shift}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              {online ? <Wifi size={12} color="var(--accent-green)" /> : <WifiOff size={12} color="var(--accent-red)" />}
              <span style={{ color: online ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {online ? 'En línea' : 'Sin conexión'}
              </span>
            </span>
            {/* Change role button */}
            <button
              onClick={handleChangeRole}
              title="Volver al inicio y cambiar tipo de usuario"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(59,130,246,0.10)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#60a5fa', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.10)'}
            >
              <RefreshCw size={12} /> Cambiar usuario
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Operator Panel */}
        <div style={{
          width: 360, background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          padding: 32, display: 'flex', flexDirection: 'column', gap: 24
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 12 }}>
              Operario Asignado
            </div>
            {absence ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="avatar avatar-lg" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
                    {assignedEmployee ? `${assignedEmployee.name[0]}${assignedEmployee.lastName[0]}` : '??'}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-red)', textDecoration: 'line-through', opacity: 0.7 }}>
                      {assignedEmployee ? `${assignedEmployee.name} ${assignedEmployee.lastName}` : '—'}
                    </div>
                    <span className="badge badge-red">⚠️ AUSENTE</span>
                  </div>
                </div>

                {replacement ? (
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: replacement.isMoveable ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
                    border: `1px solid ${replacement.isMoveable ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'}`
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: replacement.isMoveable ? 'var(--accent-amber)' : 'var(--accent-green)',
                      marginBottom: 10
                    }}>
                      {replacement.isMoveable ? '↕ Reemplazo — Requiere reubicación' : '✅ Reemplazo Disponible'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-lg" style={{
                        background: replacement.isMoveable ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                        color: replacement.isMoveable ? 'var(--accent-amber)' : 'var(--accent-green)'
                      }}>
                        {replacement.employee.name[0]}{replacement.employee.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {replacement.employee.name} {replacement.employee.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Leg. {replacement.employee.employeeId}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div className={`score-badge score-${replacement.score}`}>{replacement.score}</div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {SCORE_LABELS[replacement.score]}
                          </span>
                        </div>
                        {replacement.isMoveable && replacement.currentPositionName && (
                          <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>
                            Actualmente en: {replacement.currentPositionName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 14, borderRadius: 10,
                    background: 'var(--accent-red-dim)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontSize: 13, color: 'var(--accent-red)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Sin personal capacitado</div>
                    <div style={{ fontWeight: 400, fontSize: 12, lineHeight: 1.5 }}>
                      Ningún empleado tiene nivel ≥ 3 en este puesto.<br />
                      Contactar al supervisor de turno.
                    </div>
                  </div>
                )}
              </>
            ) : assignedEmployee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar avatar-lg">
                  {assignedEmployee.name[0]}{assignedEmployee.lastName[0]}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {assignedEmployee.name} {assignedEmployee.lastName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Leg. {assignedEmployee.employeeId}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {assignedEmployee.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <div className="status-dot present" />
                    <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Presente</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                Puesto sin asignar
              </div>
            )}
          </div>
        </div>

        {/* Work Instructions Panel */}
        <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1, color: 'var(--text-tertiary)', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span>Instrucción de Trabajo (IT)</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
            {position?.pdfUrl && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleOpenPDF}
                style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Ver Pantalla Completa ⛶
              </button>
            )}
          </div>

          {position?.pdfUrl ? (
            <div 
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              onDoubleClick={handleOpenPDF}
            >
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center',
                padding: '6px 8px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 6, border: '1px dashed var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                userSelect: 'none'
              }} onClick={handleOpenPDF}>
                <span>📱 Doble toque / clic para ver en pantalla completa (Zoom y Desplazamiento táctil habilitados)</span>
              </div>
              <div style={{ width: '100%', height: 'calc(100vh - 250px)', minHeight: 500 }}>
                {isImageFile(position.pdfName, position.pdfUrl) ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 12, overflow: 'hidden' }}>
                    <img
                      src={getBlobUrl(position.pdfUrl)}
                      alt={position.pdfName}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <object
                    data={getBlobUrl(position.pdfUrl) + '#toolbar=0'}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ borderRadius: 12, border: '1px solid var(--border-subtle)' }}
                  >
                    <iframe
                      src={getBlobUrl(position.pdfUrl) + '#toolbar=0'}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: 12 }}
                    >
                      <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Tu navegador no soporta visualización directa de PDFs. 
                        Para ver la instrucción de trabajo en esta tablet, por favor cárguela en formato de imagen (PNG/JPG).
                      </p>
                    </iframe>
                  </object>
                )}
              </div>
            </div>
          ) : position?.pdfName ? (
            <div style={{
              background: 'white', color: 'black', padding: '40px 20px', borderRadius: 8,
              border: '1px solid var(--border-default)', minHeight: 250,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }}>
              <FileText size={48} color="#ef4444" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111', textAlign: 'center' }}>
                Aquí se verá: {position.pdfName}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                [Instrucción de Trabajo en PDF]
              </div>
            </div>
          ) : position?.instructions ? (
            <div className="workstation-it" style={{ whiteSpace: 'pre-wrap' }}>
              {position.instructions}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Sin instrucciones cargadas
              </div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                El área de Ingeniería debe cargar las instrucciones de trabajo para este puesto.
              </div>
            </div>
          )}
        </div>

        {/* FULL SCREEN PDF MODAL FOR WORKSTATION */}
        {showFullScreenPDF && position?.pdfUrl && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 30, 0.97)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 24px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                {position.posNumber ? `${position.posNumber} - ` : ''}{position.name} · Instrucción de Trabajo (IT)
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowFullScreenPDF(false)}
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                }}
              >
                Cerrar Pantalla Completa ⛶
              </button>
            </div>
            {/* PDF/Image Viewer */}
            <div style={{ flex: 1, width: '100%', height: '100%' }}>
              {isImageFile(position.pdfName, position.pdfUrl) ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b0f1e', overflow: 'hidden' }}>
                  <img
                    src={getBlobUrl(position.pdfUrl)}
                    alt={position.pdfName}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <object
                  data={getBlobUrl(position.pdfUrl) + '#toolbar=0'}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                >
                  <iframe
                    src={getBlobUrl(position.pdfUrl) + '#toolbar=0'}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  >
                    <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Tu navegador no soporta visualización directa de PDFs. 
                      Para ver la instrucción de trabajo en esta tablet, por favor cárguela en formato de imagen (PNG/JPG).
                    </p>
                  </iframe>
                </object>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
