import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, Group, Ellipse } from 'react-konva';
import { subscribeToLines, createLine, updateLine, createPosition, updatePosition, deletePosition, subscribeToPositions } from '../../firebase/db';
import {
  MousePointer2, Square, Minus, CircleDot, Type, Trash2, Save,
  ZoomIn, ZoomOut, Grid3X3, ChevronDown, Plus, Armchair
} from 'lucide-react';

const UNITS = { mm: 1, cm: 10, m: 1000 };
const GRID_BASE_PX = 20; // pixels per cm

const SHAPE_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7',
  '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#84cc16'
];

// Conversion: 1 cm = GRID_BASE_PX pixels
const cmToPx = (cm) => cm * GRID_BASE_PX;
const pxToCm = (px) => px / GRID_BASE_PX;

const unitToCm = (value, unit) => value / UNITS[unit] * 10; // value in unit → cm
const cmToUnit = (cm, unit) => cm * UNITS[unit] / 10; // cm → unit

export default function Canvas2D({ lineId, lineName }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  const [tool, setTool] = useState('select');
  const [unit, setUnit] = useState('cm');
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [positions, setPositions] = useState([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingShape, setEditingShape] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load canvas data from Firestore
  useEffect(() => {
    if (!lineId) return;
    const unsub = subscribeToLines((lines) => {
      const line = lines.find(l => l.id === lineId);
      if (line?.canvasJSON) {
        try { setShapes(JSON.parse(line.canvasJSON)); } catch {}
      }
    });
    return unsub;
  }, [lineId]);

  // Load positions for this line
  useEffect(() => {
    if (!lineId) return;
    const unsub = subscribeToPositions(setPositions, lineId);
    return unsub;
  }, [lineId]);

  // Autosave every 30s
  useEffect(() => {
    if (!lineId) return;
    const interval = setInterval(() => saveCanvas(), 30000);
    return () => clearInterval(interval);
  }, [lineId, shapes]);

  const saveCanvas = useCallback(async () => {
    if (!lineId || saving) return;
    setSaving(true);
    try {
      await updateLine(lineId, { canvasJSON: JSON.stringify(shapes) });
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  }, [lineId, shapes, saving]);

  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    return {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    };
  };

  const snapToGrid = (val) => Math.round(val / GRID_BASE_PX) * GRID_BASE_PX;

  const handleMouseDown = (e) => {
    if (tool === 'select') {
      if (e.target === e.target.getStage()) setSelectedId(null);
      return;
    }
    const pos = getPointerPos();
    const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    setIsDrawing(true);
    setDrawStart(snapped);

    const id = Date.now().toString();
    const color = SHAPE_COLORS[shapes.length % SHAPE_COLORS.length];

    if (tool === 'rect' || tool === 'chair' || tool === 'table' || tool === 'position') {
      setCurrentShape({ id, type: tool === 'position' ? 'position' : tool, x: snapped.x, y: snapped.y, width: 0, height: 0, fill: tool === 'position' ? '#3b82f6' : color, opacity: tool === 'position' ? 0.4 : 0.7, strokeWidth: 2, stroke: tool === 'position' ? '#3b82f6' : color, positionId: null });
    } else if (tool === 'circle') {
      setCurrentShape({ id, type: 'circle', x: snapped.x, y: snapped.y, radiusX: 0, radiusY: 0, fill: color, opacity: 0.7, strokeWidth: 2, stroke: color });
    } else if (tool === 'line') {
      setCurrentShape({ id, type: 'line', points: [snapped.x, snapped.y, snapped.x, snapped.y], stroke: color, strokeWidth: 3 });
    } else if (tool === 'text') {
      const newShape = { id, type: 'text', x: snapped.x, y: snapped.y, text: 'Etiqueta', fontSize: 14, fill: '#f0f4ff' };
      setShapes(prev => [...prev, newShape]);
      setTool('select');
      setSelectedId(id);
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing || !currentShape) return;
    const pos = getPointerPos();
    const snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };

    if (['rect', 'chair', 'table', 'position'].includes(currentShape.type)) {
      setCurrentShape(prev => ({
        ...prev,
        width: snapped.x - drawStart.x,
        height: snapped.y - drawStart.y
      }));
    } else if (currentShape.type === 'circle') {
      setCurrentShape(prev => ({
        ...prev,
        radiusX: Math.abs(snapped.x - drawStart.x),
        radiusY: Math.abs(snapped.y - drawStart.y)
      }));
    } else if (currentShape.type === 'line') {
      setCurrentShape(prev => ({
        ...prev,
        points: [prev.points[0], prev.points[1], snapped.x, snapped.y]
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    setIsDrawing(false);

    const minSize = 5;
    const isValid = currentShape.type === 'line'
      ? Math.abs(currentShape.points[2] - currentShape.points[0]) > minSize
      : Math.abs(currentShape.width) > minSize && Math.abs(currentShape.height) > minSize;

    if (isValid) {
      // Normalize negative width/height
      let shape = { ...currentShape };
      if (shape.width < 0) { shape.x += shape.width; shape.width = Math.abs(shape.width); }
      if (shape.height < 0) { shape.y += shape.height; shape.height = Math.abs(shape.height); }

      if (shape.type === 'position') {
        setEditingShape(shape);
        setShowPositionModal(true);
      } else {
        setShapes(prev => [...prev, shape]);
      }
    }
    setCurrentShape(null);
    setDrawStart(null);
  };

  const handleShapeClick = (id) => {
    if (tool === 'select') setSelectedId(id);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setShapes(prev => prev.filter(s => s.id !== selectedId));
    setSelectedId(null);
  };

  const handleDragEnd = (id, e) => {
    const { x, y } = e.target.position();
    setShapes(prev => prev.map(s => s.id === id ? { ...s, x: snapToGrid(x), y: snapToGrid(y) } : s));
  };

  const handleTransformEnd = (id, e) => {
    const node = e.target;
    setShapes(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        x: snapToGrid(node.x()),
        y: snapToGrid(node.y()),
        width: Math.max(10, node.width() * node.scaleX()),
        height: Math.max(10, node.height() * node.scaleY()),
        scaleX: 1,
        scaleY: 1,
      };
    }));
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const newScale = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 5);
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    };
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
    setZoom(clampedScale);
  };

  // Draw grid lines
  const gridLines = [];
  const gridStep = GRID_BASE_PX;
  const totalW = canvasSize.w * 3;
  const totalH = canvasSize.h * 3;
  const offsetX = -canvasSize.w;
  const offsetY = -canvasSize.h;
  for (let x = offsetX; x < offsetX + totalW; x += gridStep) {
    gridLines.push(<Line key={`v${x}`} points={[x, offsetY, x, offsetY + totalH]} stroke="rgba(59,130,246,0.07)" strokeWidth={1} />);
  }
  for (let y = offsetY; y < offsetY + totalH; y += gridStep) {
    gridLines.push(<Line key={`h${y}`} points={[offsetX, y, offsetX + totalW, y]} stroke="rgba(59,130,246,0.07)" strokeWidth={1} />);
  }
  // Major grid every 10 cm
  for (let x = offsetX; x < offsetX + totalW; x += gridStep * 10) {
    gridLines.push(<Line key={`V${x}`} points={[x, offsetY, x, offsetY + totalH]} stroke="rgba(59,130,246,0.15)" strokeWidth={1} />);
  }
  for (let y = offsetY; y < offsetY + totalH; y += gridStep * 10) {
    gridLines.push(<Line key={`H${y}`} points={[offsetX, y, offsetX + totalW, y]} stroke="rgba(59,130,246,0.15)" strokeWidth={1} />);
  }

  const renderShape = (s, isTemp = false) => {
    const draggable = tool === 'select' && !isTemp;
    const props = {
      key: s.id,
      onClick: () => handleShapeClick(s.id),
      onDragEnd: (e) => handleDragEnd(s.id, e),
      onTransformEnd: (e) => handleTransformEnd(s.id, e),
      draggable,
      opacity: isTemp ? 0.5 : s.opacity || 1,
    };

    if (s.type === 'rect' || s.type === 'table') {
      return <Rect {...props} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth || 2} cornerRadius={2} />;
    }
    if (s.type === 'position') {
      const pos = positions.find(p => p.id === s.positionId);
      return (
        <Group key={s.id} {...props} x={s.x} y={s.y}>
          <Rect width={s.width} height={s.height} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2} cornerRadius={4} dash={[6, 3]} />
          <Text text={pos?.name || '📍 Puesto'} x={4} y={4} fontSize={12} fill="#60a5fa" fontStyle="bold" width={s.width - 8} wrap="none" ellipsis />
        </Group>
      );
    }
    if (s.type === 'chair') {
      // Simple chair icon as rect + smaller rect
      return (
        <Group key={s.id} {...props} x={s.x} y={s.y}>
          <Rect width={s.width} height={s.height * 0.7} fill={s.fill} stroke={s.stroke} strokeWidth={2} cornerRadius={3} />
          <Rect y={s.height * 0.7} width={s.width} height={s.height * 0.3} fill={s.fill} stroke={s.stroke} strokeWidth={2} cornerRadius={2} />
        </Group>
      );
    }
    if (s.type === 'circle') {
      return <Ellipse {...props} x={s.x} y={s.y} radiusX={s.radiusX || 10} radiusY={s.radiusY || 10} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth || 2} />;
    }
    if (s.type === 'line') {
      return <Line {...props} points={s.points} stroke={s.stroke} strokeWidth={s.strokeWidth || 3} lineCap="round" />;
    }
    if (s.type === 'text') {
      return <Text {...props} x={s.x} y={s.y} text={s.text} fontSize={s.fontSize || 14} fill={s.fill || '#f0f4ff'} fontFamily="Inter, sans-serif" />;
    }
    return null;
  };

  const selectedShape = shapes.find(s => s.id === selectedId);
  const formatDim = (px) => `${cmToUnit(pxToCm(Math.abs(px)), unit).toFixed(1)} ${unit}`;

  return (
    <div className="editor-layout">
      {/* Toolbar */}
      <div className="editor-toolbar">
        {[
          { id: 'select', Icon: MousePointer2, title: 'Selección' },
          { id: 'rect', Icon: Square, title: 'Rectángulo' },
          { id: 'line', Icon: Minus, title: 'Línea' },
          { id: 'circle', Icon: CircleDot, title: 'Círculo/Elipse' },
          { id: 'chair', Icon: Armchair, title: 'Silla' },
          { id: 'text', Icon: Type, title: 'Texto' },
        ].map(({ id, Icon, title }) => (
          <button
            key={id}
            className={`tool-btn ${tool === id ? 'active' : ''}`}
            onClick={() => setTool(id)}
            title={title}
          >
            <Icon size={17} />
          </button>
        ))}

        <div className="tool-separator" />

        <button className="tool-btn" title="Puesto de Trabajo" onClick={() => setTool('position')}
          style={tool === 'position' ? { background: 'var(--accent-blue-dim)', color: 'var(--accent-blue-light)', border: '1px solid rgba(59,130,246,0.3)' } : {}}>
          📍
        </button>

        <div className="tool-separator" />

        <button
          className="tool-btn"
          title="Eliminar seleccionado"
          onClick={handleDelete}
          disabled={!selectedId}
          style={{ color: selectedId ? 'var(--accent-red)' : undefined }}
        >
          <Trash2 size={17} />
        </button>

        <div style={{ flex: 1 }} />

        <button
          className="tool-btn"
          onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
          title="Zoom +"
        >
          <ZoomIn size={17} />
        </button>
        <button
          className="tool-btn"
          onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}
          title="Zoom -"
        >
          <ZoomOut size={17} />
        </button>
        <button
          className="tool-btn"
          onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }}
          title="Restablecer vista"
          style={{ fontSize: 11 }}
        >
          1:1
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="editor-canvas-area"
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
      >
        <Stage
          ref={stageRef}
          width={canvasSize.w}
          height={canvasSize.h}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          draggable={tool === 'select'}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          <Layer>
            {gridLines}
          </Layer>
          <Layer>
            {shapes.map(s => renderShape(s))}
            {currentShape && renderShape(currentShape, true)}
            {selectedId && (
              <Transformer
                ref={transformerRef}
                nodes={stageRef.current?.findOne('#' + selectedId) ? [stageRef.current.findOne('#' + selectedId)] : []}
                boundBoxFunc={(oldBox, newBox) => ({
                  ...newBox,
                  width: Math.max(10, newBox.width),
                  height: Math.max(10, newBox.height),
                })}
              />
            )}
          </Layer>
        </Stage>

        {/* Zoom indicator */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 8, padding: '4px 10px', fontSize: 11,
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Grid3X3 size={12} />
          {Math.round(zoom * 100)}%
          <span style={{ opacity: 0.5 }}>·</span>
          Cuadrícula: 1 cm
        </div>

        {/* Units toggle */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <div className="units-toggle">
            {['mm', 'cm', 'm'].map(u => (
              <button
                key={u}
                className={`unit-btn ${unit === u ? 'active' : ''}`}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Save status */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {lastSaved && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Guardado {lastSaved.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={saveCanvas}
            disabled={saving}
          >
            <Save size={13} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="editor-properties">
        <div className="editor-props-header">Propiedades</div>
        <div className="editor-props-body">
          {selectedShape ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div className="prop-label">Tipo</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedShape.type}
                </div>
              </div>
              {selectedShape.width !== undefined && (
                <div className="prop-row">
                  <div>
                    <div className="prop-label">Ancho</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {formatDim(selectedShape.width)}
                    </div>
                  </div>
                  <div>
                    <div className="prop-label">Alto</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {formatDim(selectedShape.height)}
                    </div>
                  </div>
                </div>
              )}
              <div className="prop-row">
                <div>
                  <div className="prop-label">X</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {formatDim(selectedShape.x || 0)}
                  </div>
                </div>
                <div>
                  <div className="prop-label">Y</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {formatDim(selectedShape.y || 0)}
                  </div>
                </div>
              </div>
              {selectedShape.fill && (
                <div style={{ marginTop: 8 }}>
                  <div className="prop-label" style={{ marginBottom: 6 }}>Color</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SHAPE_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, fill: c, stroke: c } : s))}
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: c, border: selectedShape.fill === c ? '2px solid white' : '2px solid transparent',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
              Seleccioná un elemento para ver sus propiedades
            </div>
          )}
        </div>

        {/* Line info */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 11, color: 'var(--text-tertiary)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{lineName}</div>
          <div>{shapes.length} elemento{shapes.length !== 1 ? 's' : ''}</div>
          <div>{positions.length} puesto{positions.length !== 1 ? 's' : ''} definido{positions.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Position Modal */}
      {showPositionModal && editingShape && (
        <PositionModal
          shape={editingShape}
          lineId={lineId}
          onSave={async (positionData) => {
            const posDoc = await createPosition({ ...positionData, lineId });
            const shapeWithPos = { ...editingShape, positionId: posDoc.id };
            setShapes(prev => [...prev, shapeWithPos]);
            setShowPositionModal(false);
            setEditingShape(null);
          }}
          onCancel={() => { setShowPositionModal(false); setEditingShape(null); }}
        />
      )}
    </div>
  );
}

function PositionModal({ shape, lineId, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">📍 Nuevo Puesto de Trabajo</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre del Puesto</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Ensamble de Módulo A"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Instrucciones de Trabajo (IT)</label>
            <textarea
              className="form-textarea"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Describe los pasos del proceso, herramientas a usar, estándares de calidad..."
              style={{ minHeight: 140 }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), instructions })}
          >
            Crear Puesto
          </button>
        </div>
      </div>
    </div>
  );
}
