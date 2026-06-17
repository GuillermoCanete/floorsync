import React, { useState, useEffect } from 'react';
import {
  subscribeToEmployees, createEmployee, updateEmployee,
  subscribeToEvaluations
} from '../firebase/db';
import { Plus, Search, UserCheck, UserX, Edit2, ChevronRight, ChevronLeft, X } from 'lucide-react';

const DEPARTMENTS = ['Producción', 'Mantenimiento', 'Calidad', 'Logística', 'Ingeniería', 'Otro'];
const SCORE_LABELS = { 1: 'Necesita capacitación', 2: 'En desarrollo', 3: 'Autónomo', 4: 'Experto/Instructor' };
const SCORE_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#22c55e', 4: '#3b82f6' };

function getInitials(name, lastName) {
  return `${(name || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export default function PersonnelPage() {
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeToEmployees((data) => { setEmployees(data); setLoading(false); }),
      subscribeToEvaluations(setEvaluations),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const filtered = employees.filter(e => {
    const matchSearch = `${e.name} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.department === filterDept;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? e.active : !e.active);
    return matchSearch && matchDept && matchStatus;
  });

  // Get latest score per employee (across all positions)
  const getEmployeeScores = (empId) => {
    const empEvals = evaluations.filter(ev => ev.employeeId === empId);
    const byPosition = {};
    empEvals.forEach(ev => {
      if (!byPosition[ev.positionId] || ev.date?.seconds > byPosition[ev.positionId].date?.seconds) {
        byPosition[ev.positionId] = ev;
      }
    });
    return Object.values(byPosition);
  };

  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employee={selectedEmployee}
        evaluations={evaluations.filter(ev => ev.employeeId === selectedEmployee.id)}
        onBack={() => setSelectedEmployee(null)}
        onUpdate={(id, data) => updateEmployee(id, data)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Personal</div>
          <div className="page-subtitle">{filtered.length} empleados</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuevo Empleado
        </button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Buscar por nombre o legajo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 160 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">Todos los sectores</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="units-toggle">
            {[['active', 'Activos'], ['inactive', 'Inactivos'], ['all', 'Todos']].map(([val, lbl]) => (
              <button key={val} className={`unit-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)}>{lbl}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><UserCheck size={24} color="var(--text-tertiary)" /></div>
            <div className="empty-state-title">Sin resultados</div>
            <div className="empty-state-desc">No se encontraron empleados con esos filtros</div>
          </div>
        ) : (
          <div className="grid-auto">
            {filtered.map(emp => {
              const scores = getEmployeeScores(emp.id);
              const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : null;
              const expertCount = scores.filter(s => s.score >= 3).length;
              return (
                <div
                  key={emp.id}
                  className="card card-interactive"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div
                      className="avatar avatar-lg"
                      style={{ background: emp.active ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'var(--bg-elevated)' }}
                    >
                      {getInitials(emp.name, emp.lastName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name} {emp.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Leg. {emp.employeeId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{emp.department}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className={`badge ${emp.active ? 'badge-green' : 'badge-red'}`}>
                        {emp.active ? 'Activo' : 'Inactivo'}
                      </span>
                      {emp.isNonEssential && (
                        <span className="badge badge-amber" style={{ fontSize: 9, padding: '2px 6px' }}>
                          Soporte
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {scores.slice(0, 4).map(s => (
                      <div key={s.positionId} className={`score-badge score-${s.score}`} title={SCORE_LABELS[s.score]}>
                        {s.score}
                      </div>
                    ))}
                    {scores.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sin evaluaciones</span>
                    )}
                    {scores.length > 4 && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center' }}>+{scores.length - 4}</span>
                    )}
                    <ChevronRight size={14} color="var(--text-tertiary)" style={{ marginLeft: 'auto', alignSelf: 'center' }} />
                  </div>

                  {expertCount > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent-green)' }}>
                      ✅ Capacitado en {expertCount} puesto{expertCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          onSave={async (data) => { await createEmployee(data); setShowModal(false); }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function EmployeeModal({ employee, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    lastName: employee?.lastName || '',
    employeeId: employee?.employeeId || '',
    department: employee?.department || 'Producción',
  });

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{employee ? 'Editar Empleado' : 'Nuevo Empleado'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="Juan" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input className="form-input" value={form.lastName} onChange={set('lastName')} placeholder="García" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nro. de Legajo</label>
              <input className="form-input" value={form.employeeId} onChange={set('employeeId')} placeholder="001234" />
            </div>
            <div className="form-group">
              <label className="form-label">Sector</label>
              <select className="form-select" value={form.department} onChange={set('department')}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!form.name.trim() || !form.lastName.trim()}
            onClick={() => onSave(form)}
          >
            {employee ? 'Guardar cambios' : 'Agregar empleado'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeDetail({ employee, evaluations, onBack, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);
  const [positions, setPositions] = useState([]);

  // Group evaluations by position, take latest
  const byPosition = {};
  evaluations.forEach(ev => {
    if (!byPosition[ev.positionId] || ev.date?.seconds > byPosition[ev.positionId].date?.seconds) {
      byPosition[ev.positionId] = ev;
    }
  });
  const latestByPos = Object.values(byPosition).sort((a, b) => b.score - a.score);
  const history = [...evaluations].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <ChevronLeft size={16} /> Personal
          </button>
          <div>
            <div className="page-title">{employee.name} {employee.lastName}</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span>Leg. {employee.employeeId} · {employee.department}</span>
              <span className={`badge ${employee.isNonEssential ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                {employee.isNonEssential ? 'Soporte / No Indispensable' : 'Indispensable'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${employee.isNonEssential ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              borderColor: employee.isNonEssential ? 'rgba(245,158,11,0.4)' : undefined,
              color: employee.isNonEssential ? '#fbbf24' : undefined,
              background: employee.isNonEssential ? 'rgba(245,158,11,0.08)' : undefined,
            }}
            onClick={() => onUpdate(employee.id, { isNonEssential: !employee.isNonEssential })}
          >
            {employee.isNonEssential ? '⚙️ Marcar como Indispensable' : '⭐ Marcar como Soporte / No Indispensable'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
            <Edit2 size={13} /> Editar
          </button>
          <button
            className={`btn btn-sm ${employee.active ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => onUpdate(employee.id, { active: !employee.active })}
          >
            {employee.active ? <><UserX size={13} /> Dar de baja</> : <><UserCheck size={13} /> Reactivar</>}
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
          {/* Capacitación */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Matriz de Capacitación</div>
            {latestByPos.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Sin evaluaciones registradas
              </div>
            ) : (
              latestByPos.map(ev => (
                <div key={ev.positionId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className={`score-badge score-${ev.score}`}>{ev.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.positionName || ev.positionId}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{SCORE_LABELS[ev.score]}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {ev.date?.toDate ? ev.date.toDate().toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Historial */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Historial de Evaluaciones</div>
            {history.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Sin historial
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 15).map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className={`score-badge score-${ev.score}`} style={{ flexShrink: 0 }}>{ev.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.positionName || ev.positionId}</div>
                      {ev.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{ev.notes}</div>}
                      {ev.evaluatedBy && <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Supervisor: {ev.evaluatedBy}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {ev.date?.toDate ? ev.date.toDate().toLocaleDateString('es-AR') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
