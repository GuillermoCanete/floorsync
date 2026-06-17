import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToEmployees, subscribeToPositions, subscribeToLines,
  subscribeToEvaluations, createEvaluation, subscribeToAssignments
} from '../firebase/db';
import { Star, Search, ChevronDown, X, Check, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const SCORE_CONFIG = [
  { score: 1, label: 'Necesita capacitación', desc: 'El operario requiere entrenamiento para este puesto', color: 'var(--score-1)', bg: 'var(--score-1-dim)' },
  { score: 2, label: 'En desarrollo', desc: 'Conoce el puesto pero no alcanza los objetivos de calidad o velocidad', color: 'var(--score-2)', bg: 'var(--score-2-dim)' },
  { score: 3, label: 'Autónomo', desc: 'Trabaja solo, bien y sin necesitar ayuda', color: 'var(--score-3)', bg: 'var(--score-3-dim)' },
  { score: 4, label: 'Experto / Instructor', desc: 'Domina el puesto y tiene disposición para enseñar a otros', color: 'var(--score-4)', bg: 'var(--score-4-dim)' },
];

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
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
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

export default function EvaluationsPage() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [lines, setLines] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsubs = [
      subscribeToEmployees(setEmployees),
      subscribeToPositions((data) => { setPositions(data); setLoading(false); }),
      subscribeToLines(setLines),
      subscribeToEvaluations(setEvaluations),
      subscribeToAssignments(setAssignments),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const getEmployeeName = (id) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.name} ${e.lastName}` : id;
  };

  const getPositionName = (id) => {
    const p = positions.find(pos => pos.id === id);
    return p ? p.name : id;
  };

  const getLineName = (lineId) => {
    const l = lines.find(ln => ln.id === lineId);
    return l ? l.name : '';
  };

  // Mapped and filtered evaluations list for sorting
  const mappedRecent = useMemo(() => {
    return evaluations
      .map(ev => {
        const pos = positions.find(p => p.id === ev.positionId);
        return {
          ...ev,
          employeeName: getEmployeeName(ev.employeeId),
          positionName: getPositionName(ev.positionId),
          lineName: pos ? getLineName(pos.lineId) : '',
          timestamp: ev.date?.seconds || 0
        };
      })
      .filter(ev => {
        const empName = ev.employeeName.toLowerCase();
        const posName = ev.positionName.toLowerCase();
        return empName.includes(search.toLowerCase()) || posName.includes(search.toLowerCase());
      })
      .filter(ev => {
        if (!filterLine) return true;
        const pos = positions.find(p => p.id === ev.positionId);
        return pos?.lineId === filterLine;
      });
  }, [evaluations, employees, positions, lines, search, filterLine]);

  const { sorted: recent, Th } = useSortable(mappedRecent, 'timestamp', 'desc');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Evaluaciones</div>
          <div className="page-subtitle">Registrá la capacitación del personal por puesto</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Star size={16} /> Nueva Evaluación
        </button>
      </div>

      <div className="page-content">
        {/* Score Legend */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {SCORE_CONFIG.map(s => (
            <div key={s.score} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 8,
              background: s.bg, border: `1px solid ${s.color}40`
            }}>
              <div className={`score-badge score-${s.score}`}>{s.score}</div>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={15} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Buscar empleado o puesto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 200 }} value={filterLine} onChange={e => setFilterLine(e.target.value)}>
            <option value="">Todas las líneas</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {/* Recent Evaluations Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <Th col="employeeName">Empleado</Th>
                <Th col="positionName">Puesto</Th>
                <Th col="lineName">Línea</Th>
                <Th col="score">Puntaje</Th>
                <Th col="evaluatedBy">Supervisor</Th>
                <th>Notas</th>
                <Th col="timestamp">Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    Sin evaluaciones registradas
                  </td>
                </tr>
              ) : recent.slice(0, 50).map(ev => {
                const pos = positions.find(p => p.id === ev.positionId);
                const sc = SCORE_CONFIG.find(s => s.score === ev.score);
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
                          <div className="avatar avatar-sm">{getEmployeeName(ev.employeeId).split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                          <span style={{ fontWeight: 600 }}>{getEmployeeName(ev.employeeId)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{getPositionName(ev.positionId)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pos ? getLineName(pos.lineId) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                          <span style={{ fontSize: 11, color: sc?.color, fontWeight: 600 }}>{sc?.label}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.evaluatedBy || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                          {ev.notes || '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {ev.date?.toDate ? ev.date.toDate().toLocaleDateString('es-AR') : ''}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
                          <div style={{
                            borderLeft: `4px solid ${sc?.color || 'var(--border-default)'}`,
                            paddingLeft: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Empleado</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{getEmployeeName(ev.employeeId)}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Puesto / Línea</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{getPositionName(ev.positionId)} {pos ? `(${getLineName(pos.lineId)})` : ''}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', fontWeight: 600, letterSpacing: 0.5 }}>Calificación</span>
                                <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: sc?.color }}>
                                  <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                                  <strong>{sc?.label}</strong>
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

      {showModal && (
        <EvaluationModal
          employees={employees.filter(e => e.active)}
          positions={positions}
          lines={lines}
          onSave={async (data) => {
            const pos = positions.find(p => p.id === data.positionId);
            await createEvaluation({
              ...data,
              positionName: pos?.name || '',
            });
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function EvaluationModal({ employees, positions, lines, onSave, onCancel }) {
  const [form, setForm] = useState({
    employeeId: '',
    positionId: '',
    score: null,
    notes: '',
    evaluatedBy: '',
  });
  const [filterLine, setFilterLine] = useState('');

  const filteredPositions = filterLine ? positions.filter(p => p.lineId === filterLine) : positions;
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">⭐ Nueva Evaluación</div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Empleado</label>
              <select className="form-select" value={form.employeeId} onChange={set('employeeId')}>
                <option value="">-- Seleccionar empleado --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supervisor evaluador</label>
              <input className="form-input" value={form.evaluatedBy} onChange={set('evaluatedBy')} placeholder="Nombre del supervisor" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Línea (filtro)</label>
              <select className="form-select" value={filterLine} onChange={e => { setFilterLine(e.target.value); setForm(prev => ({ ...prev, positionId: '' })); }}>
                <option value="">Todas las líneas</option>
                {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Puesto de Trabajo</label>
              <select className="form-select" value={form.positionId} onChange={set('positionId')}>
                <option value="">-- Seleccionar puesto --</option>
                {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Score selector */}
          <div className="form-group">
            <label className="form-label">Nivel de Capacitación</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {SCORE_CONFIG.map(s => (
                <button
                  key={s.score}
                  onClick={() => setForm(prev => ({ ...prev, score: s.score }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, border: '1.5px solid',
                    borderColor: form.score === s.score ? s.color : 'var(--border-default)',
                    background: form.score === s.score ? s.bg : 'var(--bg-elevated)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div className={`score-badge score-${s.score}`} style={{ flexShrink: 0 }}>{s.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: form.score === s.score ? s.color : 'var(--text-primary)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  {form.score === s.score && <Check size={16} color={s.color} />}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notas del supervisor (opcional)</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Observaciones, áreas de mejora, logros destacados..."
              style={{ minHeight: 80 }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!form.employeeId || !form.positionId || !form.score}
            onClick={() => onSave(form)}
          >
            Registrar Evaluación
          </button>
        </div>
      </div>
    </div>
  );
}
