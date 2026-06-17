// src/components/editor/ProductionLineViewer.jsx
// Specialized production line visualization using react-konva

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Arrow, Circle } from 'react-konva';
import {
  subscribeToAssignments, subscribeToEmployees, subscribeToTodayAbsences, updateLine,
  createAssignment, deactivateAssignment, createEvaluation, subscribeToEvaluations,
  updatePosition, createLendingRequest, subscribeToLendingRequests, subscribeAllLendingRequests,
  resolveLendingRequest
} from '../../firebase/db';
import { useRole, ROLES } from '../../context/RoleContext';
import {
  Maximize2, Edit2, Save, X, ZoomIn, ZoomOut, ChevronLeft, CheckSquare, Info,
  Plus, Search, UserPlus, Sparkles, AlertTriangle, AlertCircle, FileText, Upload
} from 'lucide-react';

// ── LAYOUT CONSTANTS ──────────────────────────────────────────────
const CARD_W = 192;
const CARD_H = 84;
const CARD_RADIUS = 8;
const H_GAP = 16;           // horizontal gap between cards
const SPINE_H = 54;
const V_GAP = 24;           // gap between card edge and spine edge
const PADDING_X = 48;
const PADDING_Y = 52;
const COL_STEP = CARD_W + H_GAP;

// Derived Y positions (fixed, cards always snap to top or bottom row)
const TOP_CARD_Y = PADDING_Y;
const SPINE_TOP_Y = TOP_CARD_Y + CARD_H + V_GAP;
const SPINE_BOT_Y = SPINE_TOP_Y + SPINE_H;
const BOT_CARD_Y = SPINE_BOT_Y + V_GAP;
const CANVAS_H = BOT_CARD_Y + CARD_H + PADDING_Y;
const SPINE_MID_Y = SPINE_TOP_Y + SPINE_H / 2;

// Area color map
const AREA_COLORS = {
  'Área 1 - Recepción':     { bar: '#22c55e', dim: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.5)' },
  'Área 2 - Procesamiento': { bar: '#3b82f6', dim: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.5)' },
  'Área 3 - Ensamble':      { bar: '#f59e0b', dim: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.5)' },
  'Área 4 - Calidad':       { bar: '#a855f7', dim: 'rgba(168,85,247,0.14)', border: 'rgba(168,85,247,0.5)' },
  'Área 5 - Despacho':      { bar: '#ef4444', dim: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.5)' },
};
const areaStyle = (area, fallback = '#3b82f6') =>
  AREA_COLORS[area] || { bar: fallback, dim: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.5)' };

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

// ── POSITION CARD (Konva Group) ───────────────────────────────────
function PositionCard({
  pos, index, x, y, isTop, empName, isAbsent, editMode, isSelected,
  onClick, onDblClick, onDragEnd, isEngineering, onAttachPDF, onViewPDF
}) {
  const s = areaStyle(pos.area, pos.color);
  const pNum = pos.posNumber || `P${String(index + 1).padStart(2, '0')}`;
  const pName = pos.name.length > 24 ? pos.name.slice(0, 23) + '…' : pos.name;
  const emp = empName
    ? (empName.length > 24 ? empName.slice(0, 23) + '…' : empName)
    : 'Sin operario asignado';
  const connX = CARD_W / 2;
  const connY1 = isTop ? CARD_H : -V_GAP;
  const connY2 = isTop ? CARD_H + V_GAP : 0;

  return (
    <Group
      x={x} y={y}
      draggable={editMode}
      onClick={onClick}
      onDblClick={onDblClick}
      onMouseEnter={e => { e.target.getStage().container().style.cursor = editMode ? 'grab' : 'pointer'; }}
      onMouseLeave={e => { e.target.getStage().container().style.cursor = 'default'; }}
    >
      {/* Connector to spine */}
      <Line
        points={[connX, connY1, connX, connY2]}
        stroke={isSelected ? s.bar : 'rgba(45,63,96,0.8)'}
        strokeWidth={isSelected ? 2 : 1.5}
        dash={[4, 3]}
      />
      {/* Card shadow/glow when selected */}
      {isSelected && (
        <Rect
          x={-3} y={-3}
          width={CARD_W + 6} height={CARD_H + 6}
          fill="transparent"
          stroke={s.bar}
          strokeWidth={2}
          cornerRadius={CARD_RADIUS + 3}
          shadowColor={s.bar}
          shadowBlur={14}
          shadowOpacity={0.5}
        />
      )}
      {/* Card background */}
      <Rect
        width={CARD_W} height={CARD_H}
        fill={isAbsent ? 'rgba(239,68,68,0.12)' : s.dim}
        stroke={isAbsent ? 'rgba(239,68,68,0.6)' : (isSelected ? s.bar : s.border)}
        strokeWidth={isSelected || isAbsent ? 1.5 : 1}
        cornerRadius={CARD_RADIUS}
      />
      {/* Color bar at top */}
      <Rect
        x={0} y={0} width={CARD_W} height={5}
        fill={isAbsent ? '#ef4444' : s.bar}
        cornerRadius={[CARD_RADIUS, CARD_RADIUS, 0, 0]}
      />
      {/* Position number badge */}
      <Rect x={8} y={11} width={34} height={16} fill={`${s.bar}22`} cornerRadius={4} />
      <Text
        x={8} y={13} width={34}
        text={pNum}
        fontSize={10} fontStyle="bold"
        fill={s.bar} align="center"
      />
      {/* Position name */}
      <Text
        x={50} y={11}
        text={pName}
        fontSize={11} fontStyle="bold"
        fill="#e0e8ff"
        width={CARD_W - 58}
      />
      {/* Divider */}
      <Line points={[10, 33, CARD_W - 10, 33]} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      {/* Operator */}
      <Text
        x={10} y={39}
        text={isAbsent ? '⚠ AUSENTE HOY' : emp}
        fontSize={11}
        fill={isAbsent ? '#ef4444' : (empName ? '#8899bb' : '#3d5070')}
        width={CARD_W - 20}
        fontStyle={isAbsent ? 'bold' : 'normal'}
      />

      {/* IT indicator / viewer trigger */}
      {(pos.pdfName || pos.instructions) && (
        <Group
          x={8}
          y={CARD_H - 22}
          onClick={(e) => {
            e.cancelBubble = true;
            onViewPDF(pos);
          }}
          onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
          onMouseLeave={e => { e.target.getStage().container().style.cursor = editMode ? 'grab' : 'default'; }}
        >
          <Rect
            width={38} height={16}
            fill="rgba(168,85,247,0.12)"
            stroke="rgba(168,85,247,0.3)"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Text
            text="IT 📄"
            fontSize={9}
            fontStyle="bold"
            fill="#c084fc"
            x={6}
            y={3.5}
          />
        </Group>
      )}

      {/* Attach PDF '+' button for Engineering */}
      {isEngineering && (
        <Group
          x={CARD_W - 24}
          y={CARD_H - 22}
          onClick={(e) => {
            e.cancelBubble = true;
            onAttachPDF(pos.id);
          }}
          onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
          onMouseLeave={e => { e.target.getStage().container().style.cursor = editMode ? 'grab' : 'default'; }}
        >
          <Rect
            width={16} height={16}
            fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth={1}
            cornerRadius={3}
          />
          <Text
            text="+"
            fontSize={12}
            fontStyle="bold"
            fill="#60a5fa"
            x={4.5}
            y={2}
          />
        </Group>
      )}

      {/* Training alert badge "1" */}
      {pos.trainingAlert && (
        <Group x={CARD_W - 10} y={-4}>
          <Circle
            radius={9}
            fill="#ef4444"
            stroke="#111827"
            strokeWidth={1.5}
          />
          <Text
            text="1"
            fontSize={10}
            fontStyle="bold"
            fill="#ffffff"
            x={-3.5}
            y={-5}
          />
        </Group>
      )}
    </Group>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function ProductionLineViewer({ lineId, lineName, positions, onBack }) {
  const { role } = useRole();
  const isEngineering = role === ROLES.ENGINEERING || role === ROLES.ADMIN;
  const isSupervisor = role === ROLES.SUPERVISOR || role === ROLES.ADMIN;

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Data
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [lendingRequests, setLendingRequests] = useState([]);

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null); // full position object
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [pdfTargetPosId, setPdfTargetPosId] = useState(null);
  const [viewingPDFPosition, setViewingPDFPosition] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);

  // Resolve current (database-synced) objects in real-time
  const currentEditingPosition = editingPosition
    ? (positions.find(p => p.id === editingPosition.id) || editingPosition)
    : null;
  const currentSelectedPos = selectedPos
    ? (positions.find(p => p.id === selectedPos.id) || selectedPos)
    : null;
  const currentViewingPDFPosition = viewingPDFPosition
    ? (positions.find(p => p.id === viewingPDFPosition.id) || viewingPDFPosition)
    : null;

  // Layout: { [positionId]: { col, row } } — row 0 = top, 1 = bottom
  const [layout, setLayout] = useState({});
  const [pendingLayout, setPendingLayout] = useState(null); // unsaved changes
  const [saving, setSaving] = useState(false);

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setStageSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Subscribe to data
  useEffect(() => {
    const unsubs = [
      subscribeToAssignments(setAssignments),
      subscribeToEmployees(setEmployees),
      subscribeToTodayAbsences(setAbsences),
      subscribeToEvaluations(setEvaluations),
      subscribeAllLendingRequests(setLendingRequests),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Initialize layout from positions
  useEffect(() => {
    if (!positions.length) return;
    // Try to load saved layout from line doc
    // For now, calculate default: first half top (P1-P40), second half bottom (P41-P80)
    const half = Math.ceil(positions.length / 2);
    const initial = {};
    positions.forEach((p, i) => {
      if (i < half) {
        initial[p.id] = { col: i, row: 0 };
      } else {
        initial[p.id] = { col: i - half, row: 1 };
      }
    });
    setLayout(initial);
    setPendingLayout(null);
  }, [positions]);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!positions.length) return;
    const half = Math.ceil(positions.length / 2);
    const totalW = PADDING_X + half * COL_STEP - H_GAP + PADDING_X;
    const scaleX = stageSize.w / totalW;
    const scaleY = stageSize.h / CANVAS_H;
    const scale = Math.min(scaleX, scaleY) * 0.94;
    const x = (stageSize.w - totalW * scale) / 2;
    const y = (stageSize.h - CANVAS_H * scale) / 2;
    setStageScale(scale);
    setStagePos({ x, y });
  }, [positions, stageSize]);

  // Auto-fit on mount and when positions change
  useEffect(() => {
    if (positions.length && stageSize.w > 100) fitToScreen();
  }, [positions.length, stageSize.w]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const by = e.evt.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = Math.max(0.04, Math.min(oldScale * by, 8));
    const newPos = {
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    };
    setStageScale(newScale);
    setStagePos(newPos);
  }, []);

  // Current layout (pending takes priority)
  const activeLayout = pendingLayout || layout;

  // Helpers
  const getAssignment = (posId) => assignments.find(a => a.positionId === posId);
  const getEmployee = (id) => employees.find(e => e.id === id);
  const getAbsence = (empId) => absences.some(a => a.employeeId === empId);

  const getEmployeeLevel = (empId, posId) => {
    const posEvals = evaluations.filter(ev => ev.employeeId === empId && ev.positionId === posId);
    if (posEvals.length === 0) return 0;
    const sortedEvals = [...posEvals].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
    return sortedEvals[0].score || 0;
  };

  const savePDFFile = (posId, file) => {
    if (file.size > 700 * 1024) {
      return Promise.reject(new Error(`El archivo "${file.name}" supera el límite de 700 KB permitido para almacenamiento directo en base de datos. Por favor, cargue un PDF más liviano.`));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          await updatePosition(posId, {
            pdfName: file.name,
            pdfUrl: base64Data
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Drag and Drop PDF to card
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      if (!isEngineering) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp)$/i.test(file.name);
        if (isPdf || isImg) {
          const rect = container.getBoundingClientRect();
          const dropX = (e.clientX - rect.left - stagePos.x) / stageScale;
          const dropY = (e.clientY - rect.top - stagePos.y) / stageScale;

          const foundPos = positions.find(pos => {
            const cp = cardPos(pos.id);
            if (!cp) return false;
            return (
              dropX >= cp.x &&
              dropX <= cp.x + CARD_W &&
              dropY >= cp.y &&
              dropY <= cp.y + CARD_H
            );
          });

          if (foundPos) {
            try {
              await savePDFFile(foundPos.id, file);
              alert(`IT "${file.name}" adjuntada al puesto ${foundPos.posNumber || foundPos.name}`);
            } catch (err) {
              console.error(err);
              alert(err.message);
            }
          }
        }
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [positions, stageScale, stagePos, isEngineering, activeLayout]);

  const handleAttachPDF = (posId) => {
    setPdfTargetPosId(posId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file && pdfTargetPosId) {
      try {
        await savePDFFile(pdfTargetPosId, file);
        alert(`IT PDF "${file.name}" adjuntado al puesto.`);
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
      setPdfTargetPosId(null);
      e.target.value = '';
    }
  };

  const handleMarkAsTrained = async (pos) => {
    if (!pos.trainingAlert) return;
    const { employeeId, employeeName } = pos.trainingAlert;
    
    // Clear training alert
    await updatePosition(pos.id, { trainingAlert: null });
    
    // Register Level 2 (En desarrollo) evaluation
    await createEvaluation({
      employeeId,
      positionId: pos.id,
      score: 2,
      evaluatedBy: 'Ingeniería (Capacitación)',
      notes: 'Capacitación completada. El operario ha sido capacitado y habilitado en el puesto.'
    });

    setEditingPosition(null);
    alert(`Capacitación registrada para ${employeeName}. Se ha creado una evaluación de Nivel 2.`);
  };

  // Card position from layout
  const cardPos = (posId) => {
    const l = activeLayout[posId];
    if (!l) return null;
    const x = PADDING_X + l.col * COL_STEP;
    const y = l.row === 0 ? TOP_CARD_Y : BOT_CARD_Y;
    return { x, y, isTop: l.row === 0 };
  };

  // Spine width
  const half = Math.ceil(positions.length / 2);
  const spineW = half * COL_STEP - H_GAP;

  // On card drag end: snap to nearest column and row
  const handleCardDragEnd = useCallback((posId, e) => {
    setIsDraggingCard(false);
    e.target.getStage().container().style.cursor = 'default';

    const absX = e.target.x();
    const absY = e.target.y();

    // Determine row: above spine center → top, below → bottom
    const row = absY < (SPINE_TOP_Y + SPINE_BOT_Y) / 2 ? 0 : 1;

    // Determine col: clamp to valid range
    const rawCol = Math.round((absX - PADDING_X) / COL_STEP);
    const col = Math.max(0, Math.min(rawCol, half - 1));

    // Find if another card occupies this [col, row]
    const newLayout = { ...activeLayout };
    const occupant = Object.entries(newLayout).find(
      ([id, l]) => id !== posId && l.col === col && l.row === row
    );
    if (occupant) {
      // Swap
      newLayout[occupant[0]] = { ...newLayout[posId] };
    }
    newLayout[posId] = { col, row };
    setPendingLayout(newLayout);

    // Snap the Konva node to calculated position
    const snapX = PADDING_X + col * COL_STEP;
    const snapY = row === 0 ? TOP_CARD_Y : BOT_CARD_Y;
    e.target.to({ x: snapX, y: snapY, duration: 0.15 });
  }, [activeLayout, half]);

  // Save layout to Firestore
  const handleSaveLayout = async () => {
    if (!pendingLayout) { setEditMode(false); return; }
    setSaving(true);
    try {
      await updateLine(lineId, { layoutJSON: JSON.stringify(pendingLayout) });
      setLayout(pendingLayout);
      setPendingLayout(null);
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  };

  const handleViewPDF = (pos) => {
    if (!pos.pdfUrl) return;
    setViewingPDFPosition(pos);
  };

  // Discard layout changes
  const handleDiscardLayout = () => {
    setPendingLayout(null);
    setEditMode(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── MAIN CANVAS AREA ──────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={containerRef}>

        {/* TOOLBAR */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'rgba(15,22,40,0.9)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '8px 12px',
        }}>
          {/* Back */}
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '4px 6px',
              borderRadius: 6,
            }}
          >
            <ChevronLeft size={14} /> Líneas
          </button>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Line name */}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lineName}
          </span>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Fit to screen */}
          <button className="tool-btn" onClick={fitToScreen} title="Ajustar a pantalla">
            <Maximize2 size={15} />
          </button>

          {/* Zoom in/out */}
          <button className="tool-btn" onClick={() => {
            const s = Math.min(stageScale * 1.2, 8);
            setStageScale(s);
            setStagePos(prev => ({
              x: stageSize.w / 2 - (stageSize.w / 2 - prev.x) * (s / stageScale),
              y: stageSize.h / 2 - (stageSize.h / 2 - prev.y) * (s / stageScale),
            }));
          }} title="Zoom +">
            <ZoomIn size={15} />
          </button>

          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 36, textAlign: 'center' }}>
            {Math.round(stageScale * 100)}%
          </span>

          <button className="tool-btn" onClick={() => {
            const s = Math.max(stageScale / 1.2, 0.04);
            setStageScale(s);
            setStagePos(prev => ({
              x: stageSize.w / 2 - (stageSize.w / 2 - prev.x) * (s / stageScale),
              y: stageSize.h / 2 - (stageSize.h / 2 - prev.y) * (s / stageScale),
            }));
          }} title="Zoom -">
            <ZoomOut size={15} />
          </button>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Edit Layout toggle */}
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              <Edit2 size={13} /> Editar Layout
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleDiscardLayout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)', color: '#f87171',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                <X size={12} /> Cancelar
              </button>
              <button
                onClick={handleSaveLayout}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.4)',
                  background: saving ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.14)', color: '#4ade80',
                  cursor: saving ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                <Save size={12} /> {saving ? 'Guardando…' : 'Guardar layout'}
              </button>
            </div>
          )}
        </div>

        {/* EDIT MODE BANNER */}
        {editMode && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)',
            borderRadius: 10, padding: '6px 16px', fontSize: 12, color: '#93c5fd',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <Edit2 size={12} /> Modo Edición — arrastrá los puestos para reorganizar la línea
          </div>
        )}

        {/* STATS bar */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 10,
          display: 'flex', gap: 8,
          background: 'rgba(15,22,40,0.85)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '6px 14px',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {positions.length} puestos
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ fontSize: 11, color: '#22c55e' }}>
            ✅ {assignments.filter(a => !absences.some(ab => ab.employeeId === a.employeeId)).length} presentes
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ fontSize: 11, color: '#ef4444' }}>
            ⚠ {absences.length} ausentes
          </span>
        </div>

        {/* AREA LEGEND */}
        <div style={{
          position: 'absolute', bottom: 12, right: selectedPos ? 376 : 12, zIndex: 10,
          display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end',
          background: 'rgba(15,22,40,0.85)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '6px 12px', maxWidth: 360,
        }}>
          {Object.entries(AREA_COLORS).map(([area, s]) => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.bar }} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {area.replace('Área ', 'Á').replace(' - ', ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* KONVA STAGE */}
        <Stage
          ref={stageRef}
          width={stageSize.w}
          height={stageSize.h}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={!isDraggingCard}
          onDragEnd={e => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onWheel={handleWheel}
          onClick={e => {
            if (e.target === stageRef.current || e.target.attrs.id === 'spine') {
              setSelectedPos(null);
            }
          }}
          style={{ cursor: editMode ? 'default' : 'grab' }}
        >
          <Layer>
            {/* ── PRODUCTION LINE SPINE ── */}
            {/* Spine shadow */}
            <Rect
              id="spine"
              x={PADDING_X - 4}
              y={SPINE_TOP_Y - 2}
              width={spineW + 8}
              height={SPINE_H + 4}
              fill="transparent"
              shadowColor="#3b82f6"
              shadowBlur={24}
              shadowOpacity={0.25}
            />
            {/* Spine body */}
            <Rect
              id="spine"
              x={PADDING_X}
              y={SPINE_TOP_Y}
              width={spineW}
              height={SPINE_H}
              fill="rgba(15,25,50,0.95)"
              stroke="rgba(59,130,246,0.35)"
              strokeWidth={1.5}
              cornerRadius={8}
            />
            {/* Spine inner glow strip */}
            <Rect
              x={PADDING_X + 6}
              y={SPINE_TOP_Y + 4}
              width={spineW - 12}
              height={SPINE_H - 8}
              fill="rgba(59,130,246,0.04)"
              cornerRadius={5}
            />
            {/* Spine center line (conveyor) */}
            <Line
              points={[PADDING_X + 12, SPINE_MID_Y, PADDING_X + spineW - 12, SPINE_MID_Y]}
              stroke="rgba(59,130,246,0.2)"
              strokeWidth={1}
              dash={[8, 6]}
            />
            {/* Flow arrow */}
            <Arrow
              points={[PADDING_X + spineW - 90, SPINE_MID_Y, PADDING_X + spineW - 20, SPINE_MID_Y]}
              fill="rgba(59,130,246,0.4)"
              stroke="rgba(59,130,246,0.4)"
              pointerLength={8}
              pointerWidth={6}
              strokeWidth={1.5}
            />
            {/* Spine "LÍNEA" label */}
            <Text
              x={PADDING_X + 12}
              y={SPINE_MID_Y - 7}
              text={`▸  ${lineName.toUpperCase()}`}
              fontSize={10}
              fontStyle="bold"
              fill="rgba(59,130,246,0.45)"
              letterSpacing={1}
            />

            {/* ── ROW LABELS ── */}
            <Text
              x={PADDING_X - 42} y={TOP_CARD_Y + CARD_H / 2 - 6}
              text="TOP"
              fontSize={9} fontStyle="bold"
              fill="rgba(255,255,255,0.2)"
              rotation={-90}
            />
            <Text
              x={PADDING_X - 42} y={BOT_CARD_Y + CARD_H / 2 + 14}
              text="BOT"
              fontSize={9} fontStyle="bold"
              fill="rgba(255,255,255,0.2)"
              rotation={-90}
            />

            {/* ── POSITION CARDS ── */}
            {positions.map((pos, idx) => {
              const cp = cardPos(pos.id);
              if (!cp) return null;
              const assignment = getAssignment(pos.id);
              const emp = assignment ? getEmployee(assignment.employeeId) : null;
              const empName = emp ? `${emp.name} ${emp.lastName}` : null;
              const isAbsent = emp ? getAbsence(emp.id) : false;
              const isSelected = selectedPos?.id === pos.id;

              return (
                <PositionCard
                  key={pos.id}
                  pos={pos}
                  index={idx}
                  x={cp.x}
                  y={cp.y}
                  isTop={cp.isTop}
                  empName={empName}
                  isAbsent={isAbsent}
                  editMode={editMode}
                  isSelected={isSelected}
                  onClick={() => !editMode && setSelectedPos(pos)}
                  onDblClick={() => !editMode && isEngineering && setEditingPosition(pos)}
                  onDragEnd={editMode ? (e) => handleCardDragEnd(pos.id, e) : undefined}
                  isEngineering={isEngineering}
                  onAttachPDF={handleAttachPDF}
                  onViewPDF={handleViewPDF}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Hidden input file for PDF IT upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Visor de PDF */}
      {currentViewingPDFPosition && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setViewingPDFPosition(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '90%', padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                Visor de Instrucción: {currentViewingPDFPosition.pdfName || 'IT.pdf'}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewingPDFPosition(null)}>
                <X size={16} />
              </button>
            </div>
            {currentViewingPDFPosition.pdfUrl ? (
              <div style={{ width: '100%', height: '65vh', minHeight: 400 }}>
                {isImageFile(currentViewingPDFPosition.pdfName, currentViewingPDFPosition.pdfUrl) ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={getBlobUrl(currentViewingPDFPosition.pdfUrl)}
                      alt={currentViewingPDFPosition.pdfName}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <object
                    data={getBlobUrl(currentViewingPDFPosition.pdfUrl) + '#toolbar=0'}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ borderRadius: 8, border: '1px solid var(--border-subtle)' }}
                  >
                    <iframe
                      src={getBlobUrl(currentViewingPDFPosition.pdfUrl) + '#toolbar=0'}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: 8 }}
                    >
                      <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Tu navegador no soporta visualización directa de PDFs. 
                        Para ver la instrucción de trabajo en esta tablet, por favor cárguela en formato de imagen (PNG/JPG).
                      </p>
                    </iframe>
                  </object>
                )}
              </div>
            ) : (
              <div style={{
                background: 'white', color: 'black', padding: '40px 20px', borderRadius: 8,
                border: '1px solid var(--border-default)', minHeight: 200,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
              }}>
                <FileText size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111' }}>
                  Aquí se verá: {currentViewingPDFPosition.pdfName}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  [Vista previa de una página de manual de trabajo]
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edición de Propiedades (Ingeniería) */}
      {editingPosition && (
        <EditPositionModal
          position={currentEditingPosition}
          onSave={async (editedData) => {
            await updatePosition(editingPosition.id, editedData);
            setEditingPosition(null);
          }}
          onCancel={() => setEditingPosition(null)}
          onMarkAsTrained={() => handleMarkAsTrained(editingPosition)}
          onAttachPDF={() => handleAttachPDF(editingPosition.id)}
        />
      )}

      {/* ── IT/Assignment PANEL (right side) ────────────────────── */}
      {selectedPos && (
        <ITPanel
          position={currentSelectedPos}
          index={positions.findIndex(p => p.id === selectedPos.id)}
          assignment={getAssignment(selectedPos.id)}
          employees={employees}
          absences={absences}
          assignments={assignments}
          evaluations={evaluations}
          lendingRequests={lendingRequests}
          lineId={lineId}
          lineName={lineName}
          isSupervisor={isSupervisor}
          getEmployeeLevel={getEmployeeLevel}
          onClose={() => setSelectedPos(null)}
        />
      )}
    </div>
  );
}

// ── EDIT POSITION MODAL COMPONENT ──────────────────────────────────
function EditPositionModal({ position, onSave, onCancel, onMarkAsTrained, onAttachPDF }) {
  const [name, setName] = useState(position.name || '');
  const [posNumber, setPosNumber] = useState(position.posNumber || '');
  const [color, setColor] = useState(position.color || '#3b82f6');

  const COLORS = [
    { value: '#3b82f6', label: 'Azul' },
    { value: '#22c55e', label: 'Verde' },
    { value: '#f59e0b', label: 'Naranja' },
    { value: '#a855f7', label: 'Violeta' },
    { value: '#ef4444', label: 'Rojo' },
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 999 }}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">⚙️ Editar Puesto {posNumber}</div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nomenclatura (P1-P80)</label>
            <input
              className="form-input"
              value={posNumber}
              onChange={e => setPosNumber(e.target.value)}
              placeholder="Ej: P01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre del puesto</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Ensamble Base"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color de identificación</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: c.value,
                    border: color === c.value ? '2.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    outline: color === c.value ? `2px solid ${c.value}` : 'none'
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '16px 0', padding: '16px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Instrucción de Trabajo (IT)</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {position.pdfName ? `Adjunto: ${position.pdfName}` : 'Sin archivo adjunto'}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={onAttachPDF}>
                <Upload size={13} /> {position.pdfName ? 'Cambiar PDF' : 'Adjuntar PDF'}
              </button>
            </div>
          </div>

          {position.trainingAlert && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: 14, marginTop: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                <AlertCircle size={15} /> CAPACITACIÓN REQUERIDA
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 10 }}>
                El operario <strong>{position.trainingAlert.employeeName}</strong> ha sido asignado a este puesto pero requiere capacitación.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onMarkAsTrained}
              >
                <CheckSquare size={13} /> Marcar como Capacitado
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim() || !posNumber.trim()}
            onClick={() => onSave({ name: name.trim(), posNumber: posNumber.trim(), color })}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IT/ASSIGNMENT PANEL COMPONENT ──────────────────────────────────
function ITPanel({
  position, index, assignment, employees, absences, assignments, evaluations, lendingRequests,
  lineId, lineName, isSupervisor, getEmployeeLevel, onClose
}) {
  const emp = assignment ? employees.find(e => e.id === assignment.employeeId) : null;
  const isAbsent = emp ? absences.some(a => a.employeeId === emp.id) : false;
  const s = areaStyle(position.area, position.color);
  const pNum = position.posNumber || `P${String(index + 1).padStart(2, '0')}`;

  const [searchQuery, setSearchQuery] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(null); // employee to assign
  const [requestingLending, setRequestingLending] = useState(false);

  // Active lending request for this position
  const activeLendingReq = lendingRequests.find(r => r.positionId === position.id && r.status === 'pending');
  const resolvedLendingReq = lendingRequests.find(r => r.positionId === position.id && r.status === 'resolved');

  // Deactivate assignment
  const handleRemoveAssignment = async () => {
    if (assignment) {
      await deactivateAssignment(assignment.id);
    }
  };

  // Assign operator
  const handleAssignOperator = async (operator) => {
    const level = getEmployeeLevel(operator.id, position.id);
    if (level < 3) {
      setShowWarningModal(operator);
    } else {
      await createAssignment({
        positionId: position.id,
        employeeId: operator.id,
        lineId
      });
    }
  };

  // Confirm assignment with warning (generates trainingAlert)
  const handleConfirmWarningAssignment = async () => {
    if (!showWarningModal) return;
    const operator = showWarningModal;
    
    await createAssignment({
      positionId: position.id,
      employeeId: operator.id,
      lineId
    });

    await updatePosition(position.id, {
      trainingAlert: {
        employeeId: operator.id,
        employeeName: `${operator.name} ${operator.lastName}`,
        requestedAt: new Date().toISOString()
      }
    });

    setShowWarningModal(null);
  };

  // Request lending from other areas
  const handleRequestLending = async () => {
    setRequestingLending(true);
    try {
      await createLendingRequest({
        positionId: position.id,
        positionName: position.name,
        posNumber: pNum,
        lineId,
        lineName,
      });
      alert('Solicitud de préstamo de personal enviada a todos los supervisores.');
    } finally {
      setRequestingLending(false);
    }
  };

  // Get list of suggestions sorted by priorities
  const getSuggestionsList = () => {
    const localCandidates = employees.filter(e =>
      e.active &&
      !absences.some(ab => ab.employeeId === e.id) &&
      !assignments.some(a => a.employeeId === e.id && a.active)
    );

    const mapped = localCandidates.map(e => {
      const level = getEmployeeLevel(e.id, position.id);
      return { emp: e, level };
    });

    const filtered = searchQuery
      ? mapped.filter(item =>
          `${item.emp.name} ${item.emp.lastName} ${item.emp.employeeId}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : mapped;

    const level3or4 = filtered.filter(item => item.level >= 3 && !item.emp.isNonEssential);
    const level2 = filtered.filter(item => item.level === 2 && !item.emp.isNonEssential);
    const level1 = filtered.filter(item => item.level === 1 && !item.emp.isNonEssential);
    const support = filtered.filter(item => item.emp.isNonEssential);
    const others = filtered.filter(item => item.level === 0 && !item.emp.isNonEssential);

    return {
      level3or4,
      level2,
      level1,
      support,
      others,
      hasLocalQualified: level3or4.length > 0 || level2.length > 0 || level1.length > 0
    };
  };

  const suggestions = getSuggestionsList();

  return (
    <div style={{
      width: 360, height: '100%',
      background: 'var(--bg-surface)',
      borderLeft: `1px solid ${s.border}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideLeft 0.25s ease',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: `linear-gradient(135deg, ${s.dim}, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: `${s.bar}22`, border: `1.5px solid ${s.bar}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: s.bar,
          }}>
            {pNum}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {position.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
              {position.area}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 400, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-amber)', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              <AlertTriangle size={18} /> Advertencia de Competencia
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 20 }}>
              El operario <strong>{showWarningModal.name} {showWarningModal.lastName}</strong> tiene un nivel <strong>{getEmployeeLevel(showWarningModal.id, position.id)}</strong> para este puesto (requiere Autónomo / nivel 3).
              <br /><br />
              ¿Desea asignarlo de todas formas? Esto generará un requerimiento de capacitación para Ingeniería.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowWarningModal(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmWarningAssignment}>Confirmar y Asignar</button>
            </div>
          </div>
        </div>
      )}

      {/* Operator info / Current Assignment */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', gap: 10, alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {emp ? (
            <>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: isAbsent ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: isAbsent ? '#ef4444' : '#60a5fa',
                border: `1.5px solid ${isAbsent ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
              }}>
                {emp.name[0]}{emp.lastName[0]}
              </div>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: isAbsent ? '#ef4444' : 'var(--text-primary)',
                  textDecoration: isAbsent ? 'line-through' : 'none',
                }}>
                  {emp.name} {emp.lastName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Leg. {emp.employeeId} · Niv. {getEmployeeLevel(emp.id, position.id)}
                </div>
                {isAbsent && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100,
                    background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)', display: 'inline-block', marginTop: 3,
                  }}>
                    ⚠ AUSENTE
                  </span>
                )}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '4px 0' }}>
              👤 Sin operario asignado
            </div>
          )}
        </div>

        {emp && isSupervisor && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={handleRemoveAssignment}>
            Desasignar
          </button>
        )}
      </div>

      {/* IT info or Supervisor Assignment controls */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {!isSupervisor ? (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
              color: 'var(--text-tertiary)', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Info size={12} /> Instrucción de Trabajo
            </div>

            {position.pdfName ? (
              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 10,
                padding: 16, border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <FileText size={24} color="#ef4444" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {position.pdfName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Instrucción en PDF
                  </div>
                </div>
              </div>
            ) : position.instructions ? (
              <div style={{
                fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)',
                background: 'var(--bg-elevated)', borderRadius: 10,
                padding: 16, border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
              }}>
                {position.instructions}
              </div>
            ) : (
              <div style={{
                padding: '32px 20px', textAlign: 'center',
                color: 'var(--text-tertiary)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Sin instrucción cargada
                </div>
                <div style={{ fontSize: 12 }}>
                  Ingeniería puede cargar la IT desde el editor.
                </div>
              </div>
            )}
          </>
        ) : (
          /* Supervisor Operator Assignment panel */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Asignar Operario
              </div>
              <div className="search-bar" style={{ marginBottom: 14 }}>
                <Search size={14} color="var(--text-tertiary)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o legajo..."
                />
              </div>
            </div>

            {/* Suggestions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Resolved lent operator from other areas */}
              {resolvedLendingReq && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)', marginBottom: 6 }}>
                    📢 Prestado de otra área (Listo para asignar)
                  </div>
                  {(() => {
                    const lentEmp = employees.find(e => e.id === resolvedLendingReq.resolvedWithEmployeeId);
                    if (!lentEmp) return null;
                    return (
                      <button
                        className="suggestion-row-btn"
                        style={{
                          width: '100%', padding: 10, borderRadius: 8,
                          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)'
                        }}
                        onClick={() => handleAssignOperator(lentEmp)}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{lentEmp.name} {lentEmp.lastName}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            Leg: {lentEmp.employeeId} · Nivel en puesto: {getEmployeeLevel(lentEmp.id, position.id)}
                          </div>
                        </div>
                        <span className="badge badge-green" style={{ fontSize: 10 }}>Asignar</span>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Priority 1: Level 3/4 */}
              {suggestions.level3or4.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)', marginBottom: 6 }}>
                    ⭐ Prioridad 1: Autónomos / Expertos (Niv. 3-4)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.level3or4.map(item => (
                      <SuggestionItem key={item.emp.id} item={item} onAssign={handleAssignOperator} getEmployeeLevel={getEmployeeLevel} positionId={position.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Priority 2: Level 2 */}
              {suggestions.level2.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-amber)', marginBottom: 6 }}>
                    ⚡ Prioridad 2: En desarrollo (Niv. 2)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.level2.map(item => (
                      <SuggestionItem key={item.emp.id} item={item} onAssign={handleAssignOperator} getEmployeeLevel={getEmployeeLevel} positionId={position.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Priority 3: Level 1 */}
              {suggestions.level1.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-red)', marginBottom: 6 }}>
                    ⚠️ Prioridad 3: Requiere capacitación (Niv. 1)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.level1.map(item => (
                      <SuggestionItem key={item.emp.id} item={item} onAssign={handleAssignOperator} getEmployeeLevel={getEmployeeLevel} positionId={position.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Priority 4: Support / non-essential */}
              {suggestions.support.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a855f7', marginBottom: 6 }}>
                    🔧 Personal de Soporte / No Indispensable
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.support.map(item => (
                      <SuggestionItem key={item.emp.id} item={item} onAssign={handleAssignOperator} getEmployeeLevel={getEmployeeLevel} positionId={position.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* Priority 5: Others (Level 0) */}
              {suggestions.others.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    Otros (Sin evaluaciones)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.others.slice(0, 5).map(item => (
                      <SuggestionItem key={item.emp.id} item={item} onAssign={handleAssignOperator} getEmployeeLevel={getEmployeeLevel} positionId={position.id} />
                    ))}
                  </div>
                </div>
              )}

              {/* No qualified local unassigned and lending flow */}
              {!suggestions.hasLocalQualified && (
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 10,
                  padding: 14, border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <AlertTriangle size={20} color="var(--accent-red)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Sin personal calificado disponible
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                    No hay ningún operario en esta línea con nivel 1, 2 o 3 libre hoy.
                  </div>
                  {activeLendingReq ? (
                    <div style={{
                      fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700,
                      padding: '6px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 6,
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      📢 Solicitud de préstamo activa enviada a otras áreas
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={requestingLending}
                      onClick={handleRequestLending}
                    >
                      📢 Solicitar personal de otras áreas
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Navigation between adjacent positions */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          Hacé clic en otro puesto para verlo
        </div>
      </div>
    </div>
  );
}

function SuggestionItem({ item, onAssign, getEmployeeLevel, positionId }) {
  const level = getEmployeeLevel(item.emp.id, positionId);
  const getBadgeClass = (lvl) => {
    if (lvl >= 3) return 'score-3';
    if (lvl === 2) return 'score-2';
    return 'score-1';
  };

  return (
    <button
      className="suggestion-row-btn"
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 8,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
        transition: 'all 0.15s'
      }}
      onClick={() => onAssign(item.emp)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{item.emp.name} {item.emp.lastName}</div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Leg: {item.emp.employeeId} {item.emp.isNonEssential && '· Soporte'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className={`score-badge ${getBadgeClass(level)}`} style={{ width: 18, height: 18, fontSize: 10 }}>
          {level}
        </div>
      </div>
    </button>
  );
}
