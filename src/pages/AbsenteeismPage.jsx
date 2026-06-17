import React, { useState, useEffect, useCallback } from 'react';
import {
  subscribeToEmployees, subscribeToPositions, subscribeToLines,
  subscribeToAssignments, subscribeToTodayAbsences,
  markAbsent, removeAbsence, resolveAbsence,
  findReplacementsDetailed, subscribeToLendingRequests,
  resolveLendingRequest, createAssignment
} from '../firebase/db';
import {
  UserX, AlertTriangle, Check, X, ArrowUpDown,
  ArrowUp, LayoutList, RefreshCw
} from 'lucide-react';

const SCORE_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Autónomo', 4: 'Experto' };
const SCORE_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#22c55e', 4: '#3b82f6' };

export default function AbsenteeismPage() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [lines, setLines] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [lendingRequests, setLendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState({}); // absenceId → { free, moveable }
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [sortMode, setSortMode] = useState('absent-first'); // 'normal' | 'absent-first' | 'by-area'
  const [calculatingReplacements, setCalculatingReplacements] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeToEmployees(setEmployees),
      subscribeToPositions(setPositions),
      subscribeToLines((data) => { setLines(data); setLoading(false); }),
      subscribeToAssignments(setAssignments),
      subscribeToTodayAbsences(setAbsences),
      subscribeToLendingRequests(setLendingRequests),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Recalculate replacement suggestions whenever absences or assignments change
  useEffect(() => {
    if (absences.length === 0 || employees.length === 0) {
      setSuggestions({});
      return;
    }
    const calc = async () => {
      setCalculatingReplacements(true);
      const absentIds = absences.map(a => a.employeeId);
      const newSuggestions = {};
      for (const absence of absences) {
        const assignment = assignments.find(a => a.employeeId === absence.employeeId);
        if (!assignment) continue;
        const result = await findReplacementsDetailed(
          assignment.positionId,
          absentIds,
          assignments,
          positions
        );
        newSuggestions[absence.id] = { positionId: assignment.positionId, ...result };
      }
      setSuggestions(newSuggestions);
      setCalculatingReplacements(false);
    };
    calc();
  }, [absences, assignments, employees, positions]);

  const getEmployee = (id) => employees.find(e => e.id === id);
  const getPosition = (id) => positions.find(p => p.id === id);
  const getLine = (id) => lines.find(l => l.id === id);
  const getInitials = (emp) => emp ? `${emp.name[0]}${emp.lastName[0]}`.toUpperCase() : '??';

  const todayStr = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const absentIds = new Set(absences.map(a => a.employeeId));

  // Build the assignments board with sort logic
  const assignmentsByLine = {};
  assignments.forEach(a => {
    const pos = getPosition(a.positionId);
    if (!pos) return;
    if (!assignmentsByLine[pos.lineId]) assignmentsByLine[pos.lineId] = [];
    assignmentsByLine[pos.lineId].push({ ...a, position: pos });
  });

  // Sort within each line
  const sortedAssignmentsForLine = (lineAssignments) => {
    if (sortMode === 'absent-first') {
      return [...lineAssignments].sort((a, b) => {
        const aAbsent = absentIds.has(a.employeeId) ? 0 : 1;
        const bAbsent = absentIds.has(b.employeeId) ? 0 : 1;
        return aAbsent - bAbsent;
      });
    }
    if (sortMode === 'by-area') {
      return [...lineAssignments].sort((a, b) =>
        (a.position?.area || '').localeCompare(b.position?.area || '')
      );
    }
    return lineAssignments; // normal: order as assigned
  };

  const getLendableEmployees = () => {
    return employees.filter(emp =>
      emp.active &&
      !absences.some(ab => ab.employeeId === emp.id) &&
      !assignments.some(a => a.employeeId === emp.id && a.active)
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Control de Ausentismo</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-green">✅ Presentes: {assignments.length - absences.length}</span>
          <span className="badge badge-red">❌ Ausentes: {absences.length}</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowMarkModal(true)}>
            <UserX size={14} /> Marcar Ausente
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* ── SOLICITUDES DE PRÉSTAMO DE OTRAS LÍNEAS ── */}
            {lendingRequests.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ fontSize: 16 }}>📢</span>
                  Solicitudes de personal de otras áreas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lendingRequests.map(req => {
                    const lendable = getLendableEmployees();
                    return (
                      <div key={req.id} style={{
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 12, padding: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {req.lineName} solicita operario
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            Para el puesto: <strong style={{ color: '#60a5fa' }}>{req.posNumber} — {req.positionName}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {lendable.length === 0 ? (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              Sin personal disponible para prestar
                            </span>
                          ) : (
                            <LendOperatorButton
                              employees={lendable}
                              onLend={async (empId) => {
                                const emp = employees.find(e => e.id === empId);
                                if (!emp) return;
                                // Resolve request
                                await resolveLendingRequest(req.id, emp.id, `${emp.name} ${emp.lastName}`);
                                // Create assignment
                                await createAssignment({
                                  positionId: req.positionId,
                                  employeeId: emp.id,
                                  lineId: req.lineId
                                });
                                alert(`Operario ${emp.name} ${emp.lastName} prestado con éxito.`);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AUSENTES + SUGERENCIAS ─────────────────── */}
            {absences.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertTriangle size={15} color="var(--accent-red)" />
                  Ausencias del día — Cobertura de puestos
                  {calculatingReplacements && (
                    <RefreshCw size={13} color="var(--text-tertiary)" style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {absences.map(absence => {
                    const emp = getEmployee(absence.employeeId);
                    const sug = suggestions[absence.id] || {};
                    const pos = sug.positionId ? getPosition(sug.positionId) : null;
                    const freeReps = sug.free || [];
                    const moveableReps = sug.moveable || [];
                    const hasAnyRep = freeReps.length > 0 || moveableReps.length > 0;

                    return (
                      <div key={absence.id} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 14, padding: 18,
                      }}>
                        {/* Absent employee info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: pos ? 14 : 0 }}>
                          <div className="avatar" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>
                            {getInitials(emp)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {emp?.name} {emp?.lastName}
                              <span className="badge badge-red" style={{ marginLeft: 8, fontSize: 10 }}>AUSENTE</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {pos ? `📍 ${pos.name}` : 'Sin puesto asignado hoy'}
                              {absence.reason && (
                                <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>· {absence.reason}</span>
                              )}
                            </div>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => removeAbsence(absence.id)}
                            title="Cancelar ausencia (marcar como presente)"
                          >
                            <X size={13} /> Cancelar
                          </button>
                        </div>

                        {pos && (
                          <div style={{ marginTop: 10 }}>
                            {/* ── LIBRE: puede cubrir inmediatamente ── */}
                            {freeReps.length > 0 && (
                              <div style={{ marginBottom: moveableReps.length > 0 ? 10 : 0 }}>
                                <div style={{
                                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                  letterSpacing: 0.5, color: 'var(--accent-green)', marginBottom: 8,
                                  display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                  <Check size={11} /> Disponible inmediatamente (sin puesto asignado hoy)
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {freeReps.slice(0, 4).map(rep => {
                                    const repEmp = getEmployee(rep.employeeId);
                                    return (
                                      <ReplacementChip
                                        key={rep.employeeId}
                                        emp={repEmp}
                                        score={rep.score}
                                        type="free"
                                        onConfirm={() => resolveAbsence(absence.id, rep.employeeId)}
                                        resolved={absence.resolvedWithEmployeeId === rep.employeeId}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ── REUBICABLE: está en otro puesto ── */}
                            {moveableReps.length > 0 && (
                              <div>
                                <div style={{
                                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                  letterSpacing: 0.5, color: 'var(--accent-amber)', marginBottom: 8,
                                  display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                  ↕ Capacitados en otro puesto — requieren reubicación
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {moveableReps.slice(0, 3).map(rep => {
                                    const repEmp = getEmployee(rep.employeeId);
                                    return (
                                      <div key={rep.employeeId} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 10,
                                        background: 'rgba(245,158,11,0.06)',
                                        border: '1px solid rgba(245,158,11,0.2)',
                                      }}>
                                        <div className="avatar avatar-sm" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>
                                          {getInitials(repEmp)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                                            {repEmp?.name} {repEmp?.lastName}
                                          </div>
                                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                                            Actualmente en: <strong style={{ color: 'var(--accent-amber)' }}>
                                              {rep.currentPositionName}
                                            </strong>
                                            {' '}· Si se reubica, ese puesto quedará vacante
                                          </div>
                                        </div>
                                        <div className={`score-badge score-${rep.score}`} title={SCORE_LABELS[rep.score]}>
                                          {rep.score}
                                        </div>
                                        <button
                                          className="btn btn-ghost btn-sm"
                                          style={{ fontSize: 11, borderColor: 'rgba(245,158,11,0.3)', color: 'var(--accent-amber)' }}
                                          onClick={() => resolveAbsence(absence.id, rep.employeeId)}
                                        >
                                          Reubicar
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ── SIN REEMPLAZO: nadie capacitado en ningún lado ── */}
                            {!hasAnyRep && !calculatingReplacements && (
                              <div style={{
                                padding: '12px 16px', borderRadius: 10,
                                background: 'var(--accent-red-dim)',
                                border: '1px solid rgba(239,68,68,0.25)',
                              }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 4 }}>
                                  ⚠️ Sin personal capacitado disponible
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', lineHeight: 1.5 }}>
                                  Ningún empleado tiene nivel ≥ 3 en "{pos.name}". Se recomienda planificar una capacitación urgente para este puesto o contactar al supervisor de turno para una solución de emergencia.
                                </div>
                              </div>
                            )}

                            {/* Confirmed replacement badge */}
                            {absence.resolvedWithEmployeeId && (
                              <div style={{
                                marginTop: 10, fontSize: 12, color: 'var(--accent-green)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 12px', background: 'rgba(34,197,94,0.08)',
                                borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)',
                              }}>
                                <Check size={14} />
                                <strong>Reemplazo confirmado:</strong>
                                {' '}{(() => {
                                  const r = getEmployee(absence.resolvedWithEmployeeId);
                                  return r ? `${r.name} ${r.lastName}` : '—';
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TABLERO DE LÍNEAS ─────────────────────── */}
            <div>
              {/* Sort controls */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14, flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Estado de la línea — hoy
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Ordenar:</span>
                  <div className="units-toggle">
                    {[
                      ['absent-first', <><ArrowUp size={12} /> Ausentes primero</>],
                      ['normal', <><LayoutList size={12} /> Por puesto</>],
                      ['by-area', <><ArrowUpDown size={12} /> Por área</>],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        className={`unit-btn ${sortMode === val ? 'active' : ''}`}
                        onClick={() => setSortMode(val)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {Object.keys(assignmentsByLine).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">Sin asignaciones activas</div>
                  <div className="empty-state-desc">
                    Asigná empleados a los puestos desde la sección de Puestos de Trabajo
                  </div>
                </div>
              ) : (
                <div className="absence-board">
                  {Object.entries(assignmentsByLine).map(([lineId, lineAssignments]) => {
                    const line = getLine(lineId);
                    const sorted = sortedAssignmentsForLine(lineAssignments);
                    const absentInLine = lineAssignments.filter(a => absentIds.has(a.employeeId)).length;

                    return (
                      <div key={lineId} className="absence-line-section">
                        <div className="absence-line-header">
                          <span>🏭</span>
                          {line?.name || 'Línea'}
                          <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
                            {lineAssignments.length} puestos
                          </span>
                          {absentInLine > 0 && (
                            <span className="badge badge-red">{absentInLine} ausente{absentInLine > 1 ? 's' : ''}</span>
                          )}
                        </div>

                        {sorted.map(a => {
                          const emp = getEmployee(a.employeeId);
                          const isAbsent = absentIds.has(a.employeeId);
                          const absence = absences.find(ab => ab.employeeId === a.employeeId);
                          const sug = absence ? (suggestions[absence.id] || {}) : {};
                          const freeReps = sug.free || [];
                          const moveableReps = sug.moveable || [];
                          const bestFree = freeReps[0];
                          const bestMoveable = moveableReps[0];
                          const bestFreeEmp = bestFree ? getEmployee(bestFree.employeeId) : null;
                          const bestMoveableEmp = bestMoveable ? getEmployee(bestMoveable.employeeId) : null;

                          return (
                            <div key={a.id} className="absence-position-row" style={{
                              background: isAbsent ? 'rgba(239,68,68,0.04)' : undefined,
                              borderLeft: isAbsent ? '3px solid rgba(239,68,68,0.4)' : '3px solid transparent',
                            }}>
                              {/* Position name */}
                              <div className="absence-position-name" style={{ minWidth: 180 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.position?.name}</div>
                                {a.position?.area && (
                                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                    {a.position.area}
                                  </div>
                                )}
                              </div>

                              {/* Employee status */}
                              <div className="absence-employee-name" style={{ minWidth: 160 }}>
                                <div className={`status-dot ${isAbsent ? 'absent' : 'present'}`} />
                                <span style={{
                                  textDecoration: isAbsent ? 'line-through' : 'none',
                                  opacity: isAbsent ? 0.5 : 1,
                                }}>
                                  {emp ? `${emp.name} ${emp.lastName}` : '—'}
                                </span>
                              </div>

                              {/* Replacement suggestion (inline) */}
                              {isAbsent ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {bestFree ? (
                                    // Free replacement available
                                    <div className="suggestion-card" style={{
                                      background: 'rgba(34,197,94,0.08)',
                                      borderColor: 'rgba(34,197,94,0.2)',
                                    }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                                        ✅ Libre
                                      </span>
                                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {bestFreeEmp?.name} {bestFreeEmp?.lastName}
                                      </span>
                                      <div className={`score-badge score-${bestFree.score}`} style={{ width: 20, height: 20, fontSize: 10 }}>
                                        {bestFree.score}
                                      </div>
                                    </div>
                                  ) : bestMoveable ? (
                                    // Moveable from another position
                                    <div className="suggestion-card">
                                      <span className="suggestion-label">↕ Reubicar</span>
                                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {bestMoveableEmp?.name} {bestMoveableEmp?.lastName}
                                      </span>
                                      <div className={`score-badge score-${bestMoveable.score}`} style={{ width: 20, height: 20, fontSize: 10 }}>
                                        {bestMoveable.score}
                                      </div>
                                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                        desde: {bestMoveable.currentPositionName?.slice(0, 22)}…
                                      </span>
                                    </div>
                                  ) : (
                                    // Truly no replacement
                                    <div style={{
                                      padding: '4px 12px', borderRadius: 8, fontSize: 12,
                                      background: 'var(--accent-red-dim)', color: 'var(--accent-red)',
                                      border: '1px solid rgba(239,68,68,0.2)',
                                    }}>
                                      ⚠️ Sin capacitados — capacitación urgente
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ flex: 1 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showMarkModal && (
        <MarkAbsentModal
          employees={employees.filter(e => e.active)}
          absences={absences}
          onMark={async (empId, reason) => { await markAbsent(empId, reason); setShowMarkModal(false); }}
          onCancel={() => setShowMarkModal(false)}
        />
      )}
    </div>
  );
}

// ── Chip de reemplazo disponible ──────────────────────────
function ReplacementChip({ emp, score, type, onConfirm, resolved }) {
  const color = type === 'free' ? 'var(--accent-green)' : 'var(--accent-amber)';
  const dimColor = type === 'free' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)';

  return (
    <button
      onClick={onConfirm}
      title="Confirmar como reemplazo"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10,
        background: resolved ? dimColor : 'var(--bg-elevated)',
        border: `1px solid ${resolved ? color : 'var(--border-default)'}`,
        cursor: 'pointer', transition: 'all 0.15s',
        color: 'var(--text-primary)', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = dimColor; }}
      onMouseLeave={e => {
        if (!resolved) {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.background = 'var(--bg-elevated)';
        }
      }}
    >
      <div className="avatar avatar-sm" style={{ background: dimColor, color }}>
        {emp ? `${emp.name[0]}${emp.lastName[0]}` : '??'}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{emp?.name} {emp?.lastName}</div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Leg. {emp?.employeeId}</div>
      </div>
      <div className={`score-badge score-${score}`} style={{ width: 22, height: 22, fontSize: 11 }}>{score}</div>
      {resolved && <Check size={13} color={color} />}
    </button>
  );
}

// ── Modal marcar ausente ──────────────────────────────────
function MarkAbsentModal({ employees, absences, onMark, onCancel }) {
  const [empId, setEmpId] = useState('');
  const [reason, setReason] = useState('');
  const absentIds = new Set(absences.map(a => a.employeeId));
  const available = employees.filter(e => !absentIds.has(e.id));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Registrar Ausencia</div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Empleado</label>
            <select className="form-select" value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {available.map(e => (
                <option key={e.id} value={e.id}>{e.name} {e.lastName} — Leg. {e.employeeId}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Motivo (opcional)</label>
            <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">-- Seleccionar motivo --</option>
              <option>Enfermedad — Certificado médico</option>
              <option>Licencia por familiar a cargo</option>
              <option>Accidente in itinere — ART</option>
              <option>Ausencia autorizada — Trámite personal</option>
              <option>Inasistencia injustificada</option>
              <option>Otro</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" disabled={!empId} onClick={() => onMark(empId, reason)}>
            <UserX size={14} /> Registrar Ausencia
          </button>
        </div>
      </div>
    </div>
  );
}

function LendOperatorButton({ employees, onLend }) {
  const [selectedId, setSelectedId] = useState('');
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <select
        className="form-select"
        style={{ width: 180, padding: '4px 8px', fontSize: 12, height: 32 }}
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
      >
        <option value="">-- Seleccionar operario --</option>
        {employees.map(e => (
          <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>
        ))}
      </select>
      <button
        className="btn btn-primary btn-sm"
        style={{ height: 32, padding: '0 12px', fontSize: 12 }}
        disabled={!selectedId}
        onClick={() => onLend(selectedId)}
      >
        Prestar
      </button>
    </div>
  );
}
