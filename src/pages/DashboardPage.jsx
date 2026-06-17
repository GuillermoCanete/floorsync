import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToEmployees, subscribeToEvaluations, subscribeToTodayAbsences,
  subscribeToAssignments, subscribeToLines, subscribeToPositions
} from '../firebase/db';
import { useRole } from '../context/RoleContext';
import {
  Users, Factory, AlertTriangle, Star, CalendarX2, TrendingUp,
  ArrowLeft, Search, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';

const SCORE_LABELS = ['', 'Necesita capacitación', 'En desarrollo', 'Autónomo', 'Experto / Instructor'];
const SCORE_COLORS = ['', 'var(--score-1)', 'var(--score-2)', 'var(--score-3)', 'var(--score-4)'];

// ── SORTABLE HOOK ─────────────────────────────────────────────────
function useSortable(data, defaultKey = null, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const requestSort = (key) => {
    setSortDir(prev => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    setSortKey(key);
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      const cmp = av.localeCompare(bv, 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const Th = ({ col, children, style }) => {
    const active = sortKey === col;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th
        onClick={() => requestSort(col)}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {children}
          <Icon size={11} color={active ? 'var(--accent-blue)' : 'var(--text-tertiary)'} />
        </span>
      </th>
    );
  };

  return { sorted, Th };
}


// ── METRIC CARD ───────────────────────────────────────────────────
function MetricCard({ icon: Icon, value, label, color, dim, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '18px 20px', borderRadius: 14,
        background: active ? dim : 'var(--bg-card)',
        border: `1.5px solid ${active ? color : 'var(--border-subtle)'}`,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        boxShadow: active ? `0 0 0 1px ${color}30, 0 4px 20px ${color}15` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.background = dim;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.background = 'var(--bg-card)';
        }
      }}
    >
      {/* Active indicator dot */}
      {active && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 6, height: 6, borderRadius: '50%', background: color,
        }} />
      )}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: dim, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
        Ver detalle <ChevronRight size={10} />
      </div>
    </button>
  );
}

// ── DETAIL HEADER ─────────────────────────────────────────────────
function DetailHeader({ title, count, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 18, paddingBottom: 14,
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
          fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      >
        <ArrowLeft size={14} /> Dashboard
      </button>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{title}</div>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
          background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }}>
          {count} registros
        </span>
      )}
    </div>
  );
}

// ── SEARCH BAR ────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-bar" style={{ marginBottom: 14 }}>
      <Search size={14} color="var(--text-tertiary)" />
      <input
        type="text" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── DETAIL VIEWS ──────────────────────────────────────────────────

function DetailTotal({ employees, absences, assignments, positions, onBack }) {
  const [search, setSearch] = useState('');
  const absentIds = new Set(absences.map(a => a.employeeId));
  const getPos = (empId) => {
    const a = assignments.find(a => a.employeeId === empId);
    return a ? positions.find(p => p.id === a.positionId) : null;
  };
  const baseList = employees
    .filter(e => e.active)
    .map(e => ({ ...e, fullName: `${e.name} ${e.lastName}`, posName: getPos(e.id)?.name || '', status: absentIds.has(e.id) ? 'Ausente' : 'Presente' }))
    .filter(e => `${e.fullName} ${e.department} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase()));
  const { sorted, Th } = useSortable(baseList, 'fullName');
  return (
    <div>
      <DetailHeader title="👥 Todo el Personal" count={baseList.length} onBack={onBack} />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, sector o legajo..." />
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>
            <Th col="fullName">Empleado</Th>
            <Th col="employeeId">Legajo</Th>
            <Th col="department">Departamento</Th>
            <Th col="posName">Puesto Hoy</Th>
            <Th col="status">Estado</Th>
          </tr></thead>
          <tbody>
            {sorted.map(emp => {
              const isAbsent = emp.status === 'Ausente';
              return (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm">{emp.name[0]}{emp.lastName[0]}</div>
                      <span style={{ fontWeight: 600 }}>{emp.fullName}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{emp.employeeId}</td>
                  <td style={{ fontSize: 12 }}>{emp.department}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{emp.posName || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={`status-dot ${isAbsent ? 'absent' : 'present'}`} />
                      <span style={{ fontSize: 12, color: isAbsent ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {emp.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailPresent({ employees, absences, assignments, positions, onBack }) {
  const [search, setSearch] = useState('');
  const absentIds = new Set(absences.map(a => a.employeeId));
  const getPos = (empId) => {
    const a = assignments.find(a => a.employeeId === empId);
    return a ? positions.find(p => p.id === a.positionId) : null;
  };
  const baseList = employees.filter(e => e.active && !absentIds.has(e.id))
    .map(e => ({ ...e, fullName: `${e.name} ${e.lastName}`, posName: getPos(e.id)?.name || '' }))
    .filter(e => `${e.fullName} ${e.department} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase()));
  const { sorted, Th } = useSortable(baseList, 'fullName');
  return (
    <div>
      <DetailHeader title="✅ Personal Presente" count={baseList.length} onBack={onBack} />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." />
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>
            <Th col="fullName">Empleado</Th>
            <Th col="employeeId">Legajo</Th>
            <Th col="department">Departamento</Th>
            <Th col="posName">Puesto Asignado</Th>
          </tr></thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar avatar-sm" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }}>
                      {emp.name[0]}{emp.lastName[0]}
                    </div>
                    <span style={{ fontWeight: 600 }}>{emp.fullName}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{emp.employeeId}</td>
                <td style={{ fontSize: 12 }}>{emp.department}</td>
                <td style={{ fontSize: 12, color: emp.posName ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {emp.posName ? `📍 ${emp.posName}` : 'Sin puesto asignado hoy'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function DetailAbsent({ employees, absences, assignments, positions, onBack }) {
  const getEmp = (id) => employees.find(e => e.id === id);
  const getPos = (empId) => {
    const a = assignments.find(a => a.employeeId === empId);
    return a ? positions.find(p => p.id === a.positionId) : null;
  };

  const baseList = useMemo(() => {
    return absences.map(a => {
      const emp = getEmp(a.employeeId);
      const pos = getPos(a.employeeId);
      return {
        ...a,
        fullName: emp ? `${emp.name} ${emp.lastName}` : '',
        employeeId: emp?.employeeId || '',
        department: emp?.department || '',
        posName: pos?.name || '',
        reason: a.reason || 'Sin especificar',
        timestamp: a.date?.seconds || 0
      };
    });
  }, [absences, employees, assignments, positions]);

  const { sorted, Th } = useSortable(baseList, 'fullName');

  return (
    <div>
      <DetailHeader title="❌ Ausentes Hoy" count={absences.length} onBack={onBack} />
      {absences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--accent-green)', fontSize: 14 }}>
          ✅ Todo el personal está presente hoy
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <Th col="fullName">Empleado</Th>
                <Th col="employeeId">Legajo</Th>
                <Th col="posName">Puesto que cubre</Th>
                <Th col="reason">Motivo</Th>
                <Th col="timestamp">Hora</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => {
                const emp = getEmp(a.employeeId);
                const pos = getPos(a.employeeId);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>
                          {emp?.name[0]}{emp?.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp?.name} {emp?.lastName}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{emp?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{emp?.employeeId}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pos?.name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{a.reason || <span style={{ color: 'var(--text-tertiary)' }}>Sin especificar</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {a.date?.toDate ? a.date.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailLines({ lines, positions, assignments, absences, onBack }) {
  return (
    <div>
      <DetailHeader title="🏭 Líneas de Producción" count={lines.length} onBack={onBack} />
      <div className="grid-auto" style={{ maxWidth: '100%' }}>
        {lines.map(line => {
          const linePositions = positions.filter(p => p.lineId === line.id);
          const lineAssignedEmps = assignments.filter(a => linePositions.some(p => p.id === a.positionId)).map(a => a.employeeId);
          const lineAbsent = absences.filter(a => lineAssignedEmps.includes(a.employeeId));
          const withIT = linePositions.filter(p => p.instructions).length;
          return (
            <div key={line.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 18,
                  background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>🏭</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{line.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{line.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="badge badge-blue">📍 {linePositions.length} puestos</span>
                <span className="badge badge-green">✅ {lineAssignedEmps.length} asignados</span>
                {lineAbsent.length > 0 && <span className="badge badge-red">⚠ {lineAbsent.length} ausentes</span>}
                {withIT > 0 && <span className="badge badge-purple">📋 {withIT} con IT</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailEvaluations({ evaluations, employees, positions, lines, onBack }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const getEmp = (id) => employees.find(e => e.id === id);
  const getPos = (id) => positions.find(p => p.id === id);
  const getLine = (id) => lines.find(l => l.id === id);

  const baseList = useMemo(() => {
    return evaluations.map(ev => {
      const emp = getEmp(ev.employeeId);
      const pos = getPos(ev.positionId);
      const line = pos ? getLine(pos.lineId) : null;
      return {
        ...ev,
        fullName: emp ? `${emp.name} ${emp.lastName}` : '',
        employeeId: emp?.employeeId || '',
        posName: pos?.name || '',
        lineName: line?.name || '',
        timestamp: ev.date?.seconds || 0
      };
    }).filter(ev => {
      return `${ev.fullName} ${ev.posName}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [evaluations, employees, positions, lines, search]);

  const { sorted, Th } = useSortable(baseList, 'timestamp', 'desc');

  return (
    <div>
      <DetailHeader title="⭐ Evaluaciones Registradas" count={sorted.length} onBack={onBack} />
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por empleado o puesto..." />
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <Th col="fullName">Empleado</Th>
              <Th col="posName">Puesto</Th>
              <Th col="lineName">Línea</Th>
              <Th col="score">Nivel</Th>
              <Th col="evaluatedBy">Supervisor</Th>
              <th>Notas</th>
              <Th col="timestamp">Fecha</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 100).map(ev => {
              const emp = getEmp(ev.employeeId);
              const pos = getPos(ev.positionId);
              const line = pos ? getLine(pos.lineId) : null;
              const isExpanded = expandedId === ev.id;
              return (
                <React.Fragment key={ev.id}>
                  <tr
                    onClick={() => setExpandedId(prev => prev === ev.id ? null : ev.id)}
                    style={{ cursor: 'pointer', background: isExpanded ? 'rgba(59,130,246,0.04)' : undefined, transition: 'background-color 0.15s ease' }}
                    className={isExpanded ? 'expanded' : ''}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{emp?.name?.[0]}{emp?.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{emp?.name} {emp?.lastName}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Leg. {emp?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{pos?.name || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {pos ? getLine(pos.lineId)?.name : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                        <span style={{ fontSize: 11, color: SCORE_COLORS[ev.score], fontWeight: 600 }}>{SCORE_LABELS[ev.score]}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.evaluatedBy || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                        {ev.notes || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {ev.date?.toDate ? ev.date.toDate().toLocaleDateString('es-AR') : '—'}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
                        <div style={{
                          borderLeft: `4px solid ${SCORE_COLORS[ev.score] || 'var(--border-default)'}`,
                          paddingLeft: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                            <div>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Empleado</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{emp?.name} {emp?.lastName}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Puesto / Línea</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pos?.name} {line ? `(${line.name})` : ''}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Calificación</span>
                              <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: SCORE_COLORS[ev.score] }}>
                                <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                                <strong>{SCORE_LABELS[ev.score]}</strong>
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Evaluador</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.evaluatedBy || '—'}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Fecha y Hora</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {ev.date?.toDate ? ev.date.toDate().toLocaleString('es-AR') : '—'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>Comentarios del Supervisor</span>
                            <div style={{
                              fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-surface)',
                              padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)',
                              lineHeight: 1.6, whiteSpace: 'pre-wrap'
                            }}>
                              {ev.notes || 'Sin comentarios registrados.'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailAlerts({ positionsWithoutExpert, positions, lines, evaluations, onBack }) {
  const [search, setSearch] = useState('');
  const getLine = (id) => lines.find(l => l.id === id);

  const getQualifiedCount = (posId) => {
    const byEmp = {};
    evaluations.filter(ev => ev.positionId === posId && ev.score >= 1).forEach(ev => {
      if (!byEmp[ev.employeeId] || ev.date?.seconds > byEmp[ev.employeeId].date?.seconds) {
        byEmp[ev.employeeId] = ev;
      }
    });
    const vals = Object.values(byEmp);
    return {
      any: vals.filter(e => e.score >= 1).length,
      score2: vals.filter(e => e.score >= 2).length,
    };
  };

  const baseList = useMemo(() => {
    return positionsWithoutExpert.map(p => {
      const line = getLine(p.lineId);
      const { any, score2 } = getQualifiedCount(p.id);
      return {
        ...p,
        lineName: line?.name || '',
        anyQualified: any,
        score2Qualified: score2,
      };
    }).filter(p =>
      `${p.name} ${p.lineName}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [positionsWithoutExpert, lines, evaluations, search]);

  const { sorted, Th } = useSortable(baseList, 'name');

  return (
    <div>
      <DetailHeader title="⚠️ Puestos Sin Personal Capacitado" count={sorted.length} onBack={onBack} />
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 16,
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
        fontSize: 12, color: 'var(--text-secondary)',
      }}>
        Puestos donde ningún empleado tiene nivel ≥ 3 (Autónomo). Se requiere capacitación.
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Buscar puesto o línea..." />
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <Th col="name">Puesto</Th>
              <Th col="lineName">Línea</Th>
              <Th col="area">Área</Th>
              <Th col="anyQualified">Evaluados en Niv. 1–2</Th>
              <th>Acción recomendada</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(pos => {
              const { any, score2 } = getQualifiedCount(pos.id);
              return (
                <tr key={pos.id}>
                  <td style={{ fontWeight: 600 }}>📍 {pos.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{getLine(pos.lineId)?.name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pos.area || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {any === 0 ? (
                        <span className="badge badge-red">Sin evaluaciones</span>
                      ) : (
                        <>
                          {score2 > 0 && <span className="badge badge-amber">{score2} en Niv. 2</span>}
                          {any - score2 > 0 && <span className="badge badge-red">{any - score2} en Niv. 1</span>}
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--accent-amber)' }}>
                    {any === 0 ? '🎓 Planificar capacitación inicial' :
                     score2 > 0 ? '📈 Continuar formación hasta Niv. 3' :
                     '🎓 Iniciar formación básica'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD PAGE ───────────────────────────────────────────
export default function DashboardPage() {
  const { role } = useRole();
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [activeView, setActiveView] = useState(null); // null | 'total'|'present'|'absent'|'lines'|'evals'|'alerts'

  useEffect(() => {
    const unsubs = [
      subscribeToEmployees(setEmployees),
      subscribeToEvaluations(setEvaluations),
      subscribeToTodayAbsences(setAbsences),
      subscribeToAssignments(setAssignments),
      subscribeToLines(setLines),
      subscribeToPositions(setPositions),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const activeEmployees = employees.filter(e => e.active);
  const productionEmployees = activeEmployees.filter(e => e.department === 'Producción');
  const todayDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const productionAbsences = absences.filter(a => productionEmployees.some(e => e.id === a.employeeId));
  const absenceRate = productionEmployees.length > 0
    ? ((productionAbsences.length / productionEmployees.length) * 100).toFixed(1)
    : '0.0';

  const positionsWithoutExpert = positions.filter(pos => {
    const byEmp = {};
    evaluations.filter(ev => ev.positionId === pos.id).forEach(ev => {
      if (!byEmp[ev.employeeId] || ev.date?.seconds > byEmp[ev.employeeId].date?.seconds) byEmp[ev.employeeId] = ev;
    });
    return !Object.values(byEmp).some(e => e.score >= 3);
  });

  const recentEvals = [...evaluations]
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
    .slice(0, 5);

  const getEmp = (id) => employees.find(e => e.id === id);
  const getPos = (id) => positions.find(p => p.id === id);
  const getPositionByEmployeeId = (empId) => {
    const a = assignments.find(a => a.employeeId === empId);
    return a ? positions.find(p => p.id === a.positionId) : null;
  };

  const select = (view) => setActiveView(prev => prev === view ? null : view);
  const back = () => setActiveView(null);

  const METRICS = [
    {
      key: 'total', icon: Users, color: 'var(--accent-blue)', dim: 'var(--accent-blue-dim)',
      value: activeEmployees.length, label: 'Total Personal activo',
    },
    {
      key: 'present', icon: TrendingUp, color: 'var(--accent-green)', dim: 'var(--accent-green-dim)',
      value: activeEmployees.length - absences.length, label: 'Presentes hoy',
    },
    {
      key: 'absent', icon: CalendarX2, color: 'var(--accent-red)', dim: 'var(--accent-red-dim)',
      value: `${absences.length} (${absenceRate}%)`, label: 'Ausentes · Tasa de ausentismo',
    },
    {
      key: 'lines', icon: Factory, color: 'var(--accent-amber)', dim: 'var(--accent-amber-dim)',
      value: lines.length, label: 'Líneas de producción',
    },
    {
      key: 'evals', icon: Star, color: '#a855f7', dim: 'rgba(168,85,247,0.15)',
      value: evaluations.length, label: 'Evaluaciones registradas',
    },
    {
      key: 'alerts', icon: AlertTriangle, color: 'var(--accent-red)', dim: 'var(--accent-red-dim)',
      value: positionsWithoutExpert.length, label: 'Puestos sin capacitados',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle" style={{ textTransform: 'capitalize' }}>{todayDate}</div>
        </div>
        {activeView && (
          <button
            onClick={back}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} /> Volver al resumen
          </button>
        )}
      </div>

      <div className="page-content">
        {/* Metric Cards — always visible */}
        <div className="metrics-grid" style={{ marginBottom: 24 }}>
          {METRICS.map(m => (
            <MetricCard
              key={m.key}
              icon={m.icon}
              color={m.color}
              dim={m.dim}
              value={m.value}
              label={m.label}
              active={activeView === m.key}
              onClick={() => select(m.key)}
            />
          ))}
        </div>

        {/* Detail Views */}
        {activeView && (
          <div className="card" style={{ animation: 'slideUp 0.2s ease' }}>
            {activeView === 'total' && (
              <DetailTotal employees={activeEmployees} absences={absences} assignments={assignments} positions={positions} onBack={back} />
            )}
            {activeView === 'present' && (
              <DetailPresent employees={activeEmployees} absences={absences} assignments={assignments} positions={positions} onBack={back} />
            )}
            {activeView === 'absent' && (
              <DetailAbsent employees={activeEmployees} absences={absences} assignments={assignments} positions={positions} onBack={back} />
            )}
            {activeView === 'lines' && (
              <DetailLines lines={lines} positions={positions} assignments={assignments} absences={absences} onBack={back} />
            )}
            {activeView === 'evals' && (
              <DetailEvaluations evaluations={evaluations} employees={activeEmployees} positions={positions} lines={lines} onBack={back} />
            )}
            {activeView === 'alerts' && (
              <DetailAlerts positionsWithoutExpert={positionsWithoutExpert} positions={positions} lines={lines} evaluations={evaluations} onBack={back} />
            )}
          </div>
        )}

        {/* ── OVERVIEW (only when no detail selected) ── */}
        {!activeView && (
          <div className="grid-2" style={{ gap: 20 }}>
            {/* Absent Today */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CalendarX2 size={16} color="var(--accent-red)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Ausentes hoy</span>
                <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{absences.length}</span>
                {absences.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{absenceRate}%</span>
                )}
              </div>
              {absences.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--accent-green)', fontSize: 13 }}>
                  ✅ Todo el personal presente
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {absences.slice(0, 5).map(a => {
                    const emp = getEmp(a.employeeId);
                    const pos = getPositionByEmployeeId(a.employeeId);
                    return (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)',
                      }}>
                        <div className="status-dot absent" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{emp?.name} {emp?.lastName}</div>
                          {pos && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>📍 {pos.name}</div>}
                        </div>
                        {a.reason && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', maxWidth: 110 }}>{a.reason}</span>}
                      </div>
                    );
                  })}
                  {absences.length > 5 && (
                    <button onClick={() => setActiveView('absent')} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'inherit', padding: '4px 0',
                    }}>
                      Ver {absences.length - 5} más →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Recent Evaluations */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Star size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Últimas evaluaciones</span>
              </div>
              {recentEvals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  Sin evaluaciones registradas aún
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentEvals.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{getEmp(ev.employeeId)?.name} {getEmp(ev.employeeId)?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{getPos(ev.positionId)?.name}</div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {ev.date?.toDate ? ev.date.toDate().toLocaleDateString('es-AR') : ''}
                      </span>
                    </div>
                  ))}
                  <button onClick={() => setActiveView('evals')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'inherit', padding: '4px 0',
                  }}>
                    Ver todas las evaluaciones →
                  </button>
                </div>
              )}
            </div>

            {/* Positions without experts */}
            {positionsWithoutExpert.length > 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <AlertTriangle size={16} color="var(--accent-red)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-red)', flex: 1 }}>
                    ⚠️ {positionsWithoutExpert.length} puestos sin personal capacitado (nivel ≥ 3)
                  </span>
                  <button onClick={() => setActiveView('alerts')} style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'inherit',
                  }}>
                    Ver detalle →
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {positionsWithoutExpert.slice(0, 10).map(p => (
                    <span key={p.id} className="badge badge-red" style={{ fontSize: 11 }}>{p.name}</span>
                  ))}
                  {positionsWithoutExpert.length > 10 && (
                    <span className="badge" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      +{positionsWithoutExpert.length - 10} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
