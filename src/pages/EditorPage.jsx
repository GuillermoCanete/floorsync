// src/pages/EditorPage.jsx
import React, { useState, useEffect } from 'react';
import { subscribeToLines, subscribeToPositions, createLine, updateLine, deleteLine } from '../firebase/db';
import ProductionLineViewer from '../components/editor/ProductionLineViewer';
import { Plus, Trash2, Edit2, LayoutTemplate, ArrowRight, X, Save } from 'lucide-react';

// ── LINE LIST (shown when no line is selected) ────────────────────
function LineList({ lines, positions, onSelect, onCreateLine }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createLine({ name: newName.trim(), description: newDesc.trim(), canvasJSON: '[]' });
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    setCreating(false);
  };

  const handleEdit = async (id) => {
    await updateLine(id, { name: editName.trim(), description: editDesc.trim() });
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Líneas de Producción</div>
          <div className="page-subtitle">Diseño de layout y gestión de puestos</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nueva Línea
        </button>
      </div>

      <div className="page-content">
        {lines.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏭</div>
            <div className="empty-state-title">Sin líneas de producción</div>
            <div className="empty-state-desc">
              Creá la primera línea para comenzar a diseñar el layout de planta
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Crear Línea
            </button>
          </div>
        ) : (
          <div className="grid-auto" style={{ maxWidth: 900 }}>
            {lines.map(line => {
              const linePositions = positions.filter(p => p.lineId === line.id);
              const isEditing = editingId === line.id;

              return (
                <div
                  key={line.id}
                  className="card card-interactive"
                  style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}
                  onClick={!isEditing ? () => onSelect(line) : undefined}
                >
                  {/* Color accent bar */}
                  <div style={{ height: 4, background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }} />

                  <div style={{ padding: '18px 20px', flex: 1 }}>
                    {isEditing ? (
                      <div onClick={e => e.stopPropagation()}>
                        <div className="form-group" style={{ marginBottom: 10 }}>
                          <label className="form-label">Nombre</label>
                          <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label className="form-label">Descripción</label>
                          <input className="form-input" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}><X size={12} /> Cancelar</button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEdit(line.id)}><Save size={12} /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                          }}>
                            🏭
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{line.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{line.description}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                          <span className="badge badge-blue">
                            📍 {linePositions.length} puestos
                          </span>
                          {linePositions.length > 0 && (
                            <span className="badge badge-purple">
                              <LayoutTemplate size={10} />
                              {linePositions.filter(p => p.instructions).length} con IT
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={(e) => { e.stopPropagation(); onSelect(line); }}
                          >
                            Ver Línea <ArrowRight size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Editar"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(line.id);
                              setEditName(line.name);
                              setEditDesc(line.description || '');
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Eliminar línea"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Eliminar "${line.name}"?`)) deleteLine(line.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="modal-title">🏭 Nueva Línea de Producción</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre de la línea *</label>
                <input
                  className="form-input"
                  placeholder="Ej: Línea 1 — Ensamble Modular"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Descripción</label>
                <input
                  className="form-input"
                  placeholder="Ej: Producción de modelos X1 y X2"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={!newName.trim() || creating}
                onClick={handleCreate}
              >
                <Plus size={14} /> {creating ? 'Creando…' : 'Crear Línea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN EDITOR PAGE ──────────────────────────────────────────────
export default function EditorPage() {
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [linePositions, setLinePositions] = useState([]);

  useEffect(() => {
    const unsubs = [
      subscribeToLines(setLines),
      subscribeToPositions(setPositions),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Subscribe to positions for selected line
  useEffect(() => {
    if (!selectedLine) { setLinePositions([]); return; }
    const unsub = subscribeToPositions(
      (data) => setLinePositions(data),
      selectedLine.id
    );
    return unsub;
  }, [selectedLine?.id]);

  // If the selected line gets updated in real-time, refresh it
  useEffect(() => {
    if (!selectedLine) return;
    const updated = lines.find(l => l.id === selectedLine.id);
    if (updated && updated.name !== selectedLine.name) setSelectedLine(updated);
  }, [lines]);

  // ── VIEW: Line list ──
  if (!selectedLine) {
    return (
      <LineList
        lines={lines}
        positions={positions}
        onSelect={setSelectedLine}
      />
    );
  }

  // ── VIEW: Production line viewer ──
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <ProductionLineViewer
        lineId={selectedLine.id}
        lineName={selectedLine.name}
        positions={linePositions}
        onBack={() => setSelectedLine(null)}
      />
    </div>
  );
}
