import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToPositions, subscribeToLines,
  subscribeToAssignments, subscribeToEvaluations,
  createAssignment, deactivateAssignment, updatePosition, deletePosition
} from '../firebase/db';
import { subscribeToEmployees } from '../firebase/db';
import { ClipboardList, Edit2, Star, Save, Hash } from 'lucide-react';

export default function PositionsPage() {
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [filterLine, setFilterLine] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeToLines(setLines),
      subscribeToPositions((data) => { setPositions(data); setLoading(false); }),
      subscribeToEmployees(setEmployees),
      subscribeToAssignments(setAssignments),
      subscribeToEvaluations(setEvaluations),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const getLineName = (id) => lines.find(l => l.id === id)?.name || '—';
  const getEmployee = (id) => employees.find(e => e.id === id);

  const getPositionAssignment = (posId) => assignments.find(a => a.positionId === posId);

  const getQualifiedEmployees = (posId, minScore = 3) => {
    const byEmployee = {};
    evaluations.filter(ev => ev.positionId === posId).forEach(ev => {
      if (!byEmployee[ev.employeeId] || ev.date?.seconds > byEmployee[ev.employeeId].date?.seconds) {
        byEmployee[ev.employeeId] = ev;
      }
    });
    return Object.values(byEmployee)
      .filter(ev => ev.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .map(ev => ({ ...ev, employee: getEmployee(ev.employeeId) }));
  };

  const filtered = filterLine ? positions.filter(p => p.lineId === filterLine) : positions;

  if (selectedPosition) {
    return (
      <PositionDetail
        position={selectedPosition}
        lineName={getLineName(selectedPosition.lineId)}
        assignment={getPositionAssignment(selectedPosition.id)}
        employees={employees.filter(e => e.active)}
        qualifiedEmployees={getQualifiedEmployees(selectedPosition.id)}
        onBack={() => setSelectedPosition(null)}
        onSave={(data) => updatePosition(selectedPosition.id, data)}
        onAssign={async (empId) => {
          const current = getPositionAssignment(selectedPosition.id);
          if (current) await deactivateAssignment(current.id);
          if (empId) await createAssignment({ positionId: selectedPosition.id, employeeId: empId });
        }}
        onDelete={async () => {
          await deletePosition(selectedPosition.id);
          setSelectedPosition(null);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Puestos de Trabajo</div>
          <div className="page-subtitle">{filtered.length} puestos en {lines.length} líneas</div>
        </div>
        <select className="form-select" style={{ width: 200 }} value={filterLine} onChange={e => setFilterLine(e.target.value)}>
          <option value="">Todas las líneas</option>
          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={24} color="var(--text-tertiary)" /></div>
            <div className="empty-state-title">Sin puestos de trabajo</div>
            <div className="empty-state-desc">Los puestos se crean desde el Editor de Líneas de Producción (rol Ingeniería)</div>
          </div>
        ) : (
          // Group by line
          lines.filter(l => !filterLine || l.id === filterLine).map(line => {
            const linePosts = filtered.filter(p => p.lineId === line.id);
            if (linePosts.length === 0) return null;
            return (
              <div key={line.id} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏭 {line.name}
                  <span className="badge badge-blue">{linePosts.length} puestos</span>
                </div>
                <div className="grid-auto">
                  {linePosts.map(pos => {
                    const a = getPositionAssignment(pos.id);
                    const emp = a ? getEmployee(a.employeeId) : null;
                    const qualified = getQualifiedEmployees(pos.id);

                    return (
                      <div key={pos.id} className="card card-interactive" onClick={() => setSelectedPosition(pos)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                              background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                              border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'monospace',
                            }}>
                              {pos.posNumber || `P${String(linePosts.indexOf(pos) + 1).padStart(2, '0')}`}
                            </span>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{pos.name}</div>
                          </div>
                          {emp ? (
                            <span className="badge badge-green">Asignado</span>
                          ) : (
                            <span className="badge badge-red">Vacante</span>
                          )}
                        </div>

                        {emp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div className="avatar avatar-sm">{emp.name[0]}{emp.lastName[0]}</div>
                            <span style={{ fontSize: 13 }}>{emp.name} {emp.lastName}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>Sin operario asignado</div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Star size={12} color="var(--accent-amber)" />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {qualified.length} capacitado{qualified.length !== 1 ? 's' : ''} (niv. ≥ 3)
                          </span>
                        </div>

                        {pos.instructions && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pos.instructions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PositionDetail({ position, lineName, assignment, employees, qualifiedEmployees, onBack, onSave, onAssign, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(position.name);
  const [posNumber, setPosNumber] = useState(position.posNumber || '');
  const [instructions, setInstructions] = useState(position.instructions || '');
  const [assignEmpId, setAssignEmpId] = useState(assignment?.employeeId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name, posNumber: posNumber.trim(), instructions });
    if (assignEmpId !== (assignment?.employeeId || '')) {
      await onAssign(assignEmpId || null);
    }
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Puestos</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'monospace',
              }}>
                {position.posNumber || '—'}
              </span>
              <div className="page-title">{position.name}</div>
            </div>
            <div className="page-subtitle">{lineName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Editar
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => confirm('¿Eliminar este puesto?') && onDelete()}>
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
          {/* Left: assignment + qualified */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Operario Asignado</div>
              {editing ? (
                <select className="form-select" value={assignEmpId} onChange={e => setAssignEmpId(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.lastName} (Leg. {e.employeeId})</option>)}
                </select>
              ) : assignment ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar">
                    {employees.find(e => e.id === assignment.employeeId)?.name?.[0] || '?'}
                    {employees.find(e => e.id === assignment.employeeId)?.lastName?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {employees.find(e => e.id === assignment.employeeId)?.name} {employees.find(e => e.id === assignment.employeeId)?.lastName}
                    </div>
                    <span className="badge badge-green" style={{ marginTop: 4 }}>Activo</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sin operario asignado</div>
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} color="var(--accent-amber)" />
                Personal Capacitado (Niv. ≥ 3)
              </div>
              {qualifiedEmployees.length === 0 ? (
                <div style={{ color: 'var(--accent-red)', fontSize: 12 }}>
                  ⚠️ Nadie capacitado para este puesto
                </div>
              ) : (
                qualifiedEmployees.map(q => (
                  <div key={q.employeeId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="avatar avatar-sm">{q.employee?.name?.[0]}{q.employee?.lastName?.[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{q.employee?.name} {q.employee?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Leg. {q.employee?.employeeId}</div>
                    </div>
                    <div className={`score-badge score-${q.score}`}>{q.score}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: instructions */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Instrucción de Trabajo (IT)</div>
            {editing ? (
              <>
                <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Hash size={12} /> Nomenclatura (Px)
                    </label>
                    <input
                      className="form-input"
                      value={posNumber}
                      onChange={e => setPosNumber(e.target.value)}
                      placeholder="P01"
                      style={{ fontFamily: 'monospace', fontWeight: 700 }}
                      maxLength={6}
                    />
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      Ej: P01, P02, S01 — aparece en el mapa de línea
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nombre del Puesto</label>
                    <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Instrucciones de Trabajo</label>
                  <textarea
                    className="form-textarea"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    style={{ minHeight: 280 }}
                    placeholder="Describe paso a paso las tareas, estándares de calidad, herramientas necesarias..."
                  />
                </div>
              </>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                {instructions || <span style={{ color: 'var(--text-tertiary)' }}>Sin instrucciones cargadas. Hacé clic en "Editar" para agregar.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
