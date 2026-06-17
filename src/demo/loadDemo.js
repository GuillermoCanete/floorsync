// src/demo/loadDemo.js
// Loads all demo data into Firestore using batched writes

import {
  collection, doc, writeBatch, serverTimestamp, Timestamp, getDocs, deleteDoc, query
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  DEMO_LINE, DEMO_POSITIONS, DEMO_EMPLOYEES,
  DEMO_ABSENT_INDICES, DEMO_ABSENCE_REASONS,
  generateDemoEvaluations, generateDemoAssignments, generateCanvasJSON
} from './demoData';

const getTodayString = () => new Date().toISOString().split('T')[0];

// Utility: clear a collection
async function clearCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) return;
  const batches = [];
  let batch = writeBatch(db);
  let count = 0;
  snap.docs.forEach(d => {
    batch.delete(d.ref);
    count++;
    if (count === 490) {
      batches.push(batch.commit());
      batch = writeBatch(db);
      count = 0;
    }
  });
  if (count > 0) batches.push(batch.commit());
  await Promise.all(batches);
}

// Batch write helper (max 490 per batch to stay safe under 500 limit)
async function batchWrite(items, colName, transform) {
  const refs = [];
  let batch = writeBatch(db);
  let count = 0;
  let idx = 0;
  for (const item of items) {
    const ref = doc(collection(db, colName));
    refs.push(ref);
    batch.set(ref, { ...transform(item, idx), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    count++;
    idx++;
    if (count === 490) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  return refs;
}

export async function loadDemoData(onProgress) {
  const report = (msg) => { console.log(msg); onProgress?.(msg); };

  try {
    // ── 1. CLEAR EXISTING DATA ──
    report('🗑️ Limpiando datos anteriores...');
    await Promise.all([
      clearCollection('productionLines'),
      clearCollection('workPositions'),
      clearCollection('employees'),
      clearCollection('evaluations'),
      clearCollection('assignments'),
      clearCollection('absences'),
    ]);

    // ── 2. CREATE PRODUCTION LINE ──
    report('🏭 Creando línea de producción...');
    const lineRef = doc(collection(db, 'productionLines'));
    const lineBatch = writeBatch(db);
    lineBatch.set(lineRef, {
      name: DEMO_LINE.name,
      description: DEMO_LINE.description,
      canvasJSON: '[]', // Will update after positions are created
      createdBy: 'DEMO',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await lineBatch.commit();
    const lineId = lineRef.id;

    // ── 3. CREATE POSITIONS ──
    report('📍 Creando 80 puestos de trabajo...');
    const positionRefs = await batchWrite(DEMO_POSITIONS, 'workPositions', (pos, idx) => ({
      lineId,
      name: pos.name,
      instructions: pos.instructions,
      area: pos.area,
      color: pos.color,
      posNumber: `P${String(idx + 1).padStart(2, '0')}`,
    }));
    const positionIds = positionRefs.map(r => r.id);

    // ── 4. UPDATE LINE WITH CANVAS ──
    report('🗺️ Generando layout de planta...');
    const canvasJSON = generateCanvasJSON(positionIds);
    const updateBatch = writeBatch(db);
    updateBatch.update(lineRef, { canvasJSON, updatedAt: serverTimestamp() });
    await updateBatch.commit();

    // ── 5. CREATE EMPLOYEES ──
    report('👷 Creando 107 empleados ficticios...');
    const employeeRefs = await batchWrite(DEMO_EMPLOYEES, 'employees', (emp) => ({
      name: emp.name,
      lastName: emp.lastName,
      employeeId: emp.employeeId,
      department: emp.department,
      active: true,
    }));
    const employeeIds = employeeRefs.map(r => r.id);
    const prodEmployeeIds = employeeIds.slice(0, 80); // first 80 are production

    // ── 6. CREATE EVALUATIONS ──
    report('⭐ Generando evaluaciones de personal...');
    const rawEvals = generateDemoEvaluations(prodEmployeeIds, positionIds);
    await batchWrite(rawEvals, 'evaluations', (ev) => {
      const date = new Date();
      date.setDate(date.getDate() - ev.daysAgo);
      return {
        employeeId: ev.employeeId,
        positionId: ev.positionId,
        positionName: ev.positionName,
        score: ev.score,
        evaluatedBy: ev.evaluatedBy,
        notes: ev.notes,
        date: Timestamp.fromDate(date),
      };
    });

    // ── 7. CREATE ASSIGNMENTS ──
    report('🔗 Asignando personal a puestos...');
    const assignments = generateDemoAssignments(prodEmployeeIds, positionIds);
    await batchWrite(assignments, 'assignments', (a) => ({
      positionId: a.positionId,
      employeeId: a.employeeId,
      active: true,
    }));

    // ── 8. CREATE ABSENCES (7% = 6 people) ──
    report('📅 Registrando ausentismo del 7%...');
    const absentBatch = writeBatch(db);
    DEMO_ABSENT_INDICES.forEach((empIdx, i) => {
      const ref = doc(collection(db, 'absences'));
      absentBatch.set(ref, {
        employeeId: prodEmployeeIds[empIdx],
        date: getTodayString(),
        reason: DEMO_ABSENCE_REASONS[i],
        resolvedWithEmployeeId: null,
        createdAt: serverTimestamp(),
      });
    });
    await absentBatch.commit();

    report('✅ ¡Datos DEMO cargados exitosamente!');
    return { lineId, positionIds, employeeIds: prodEmployeeIds };

  } catch (error) {
    console.error('Error loading demo data:', error);
    throw error;
  }
}
