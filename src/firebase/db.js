// Firestore database operations for FloorSync
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ============ PRODUCTION LINES ============
export const linesCollection = () => collection(db, 'productionLines');

export const subscribeToLines = (callback) => {
  return onSnapshot(
    query(linesCollection(), orderBy('createdAt', 'desc')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createLine = (data) =>
  addDoc(linesCollection(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateLine = (id, data) =>
  updateDoc(doc(db, 'productionLines', id), { ...data, updatedAt: serverTimestamp() });

export const deleteLine = (id) =>
  deleteDoc(doc(db, 'productionLines', id));

// ============ WORK POSITIONS ============
export const positionsCollection = () => collection(db, 'workPositions');

const sortPositions = (positions) => {
  return [...positions].sort((a, b) => {
    if (a.posNumber && b.posNumber) {
      return a.posNumber.localeCompare(b.posNumber, undefined, { numeric: true, sensitivity: 'base' });
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const subscribeToPositions = (callback, lineId = null) => {
  let q = lineId
    ? query(positionsCollection(), where('lineId', '==', lineId))
    : query(positionsCollection(), orderBy('name'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(sortPositions(list));
  });
};

export const createPosition = (data) =>
  addDoc(positionsCollection(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updatePosition = (id, data) =>
  updateDoc(doc(db, 'workPositions', id), { ...data, updatedAt: serverTimestamp() });

export const deletePosition = (id) =>
  deleteDoc(doc(db, 'workPositions', id));

// ============ EMPLOYEES ============
export const employeesCollection = () => collection(db, 'employees');

export const subscribeToEmployees = (callback) => {
  return onSnapshot(
    query(employeesCollection(), orderBy('lastName')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createEmployee = (data) =>
  addDoc(employeesCollection(), { ...data, active: true, createdAt: serverTimestamp() });

export const updateEmployee = (id, data) =>
  updateDoc(doc(db, 'employees', id), { ...data, updatedAt: serverTimestamp() });

// ============ EVALUATIONS ============
export const evaluationsCollection = () => collection(db, 'evaluations');

export const subscribeToEvaluations = (callback, employeeId = null) => {
  let q = employeeId
    ? query(evaluationsCollection(), where('employeeId', '==', employeeId), orderBy('date', 'desc'))
    : query(evaluationsCollection(), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createEvaluation = (data) =>
  addDoc(evaluationsCollection(), { ...data, date: serverTimestamp() });

// Get best score per employee per position
export const getEmployeePositionScore = async (employeeId, positionId) => {
  const q = query(
    evaluationsCollection(),
    where('employeeId', '==', employeeId),
    where('positionId', '==', positionId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Get all positions where employee has score >= minScore
export const getQualifiedPositions = async (employeeId, minScore = 3) => {
  const q = query(evaluationsCollection(), where('employeeId', '==', employeeId));
  const snap = await getDocs(q);
  const evals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Group by positionId, take latest
  const byPosition = {};
  evals.forEach(e => {
    if (!byPosition[e.positionId] || e.date > byPosition[e.positionId].date) {
      byPosition[e.positionId] = e;
    }
  });
  return Object.values(byPosition).filter(e => e.score >= minScore);
};

// ============ ASSIGNMENTS ============
export const assignmentsCollection = () => collection(db, 'assignments');

export const subscribeToAssignments = (callback) => {
  return onSnapshot(
    query(assignmentsCollection(), where('active', '==', true)),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createAssignment = (data) =>
  addDoc(assignmentsCollection(), { ...data, active: true, startDate: serverTimestamp() });

export const deactivateAssignment = (id) =>
  updateDoc(doc(db, 'assignments', id), { active: false, endDate: serverTimestamp() });

// ============ ABSENCES ============
export const absencesCollection = () => collection(db, 'absences');

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const subscribeToTodayAbsences = (callback) => {
  const today = getTodayString();
  return onSnapshot(
    query(absencesCollection(), where('date', '==', today)),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const markAbsent = (employeeId, reason = '') =>
  addDoc(absencesCollection(), {
    employeeId,
    date: getTodayString(),
    reason,
    resolvedWithEmployeeId: null,
    createdAt: serverTimestamp()
  });

export const resolveAbsence = (absenceId, replacementEmployeeId) =>
  updateDoc(doc(db, 'absences', absenceId), {
    resolvedWithEmployeeId: replacementEmployeeId,
    resolvedAt: serverTimestamp()
  });

export const removeAbsence = (id) =>
  deleteDoc(doc(db, 'absences', id));

// ============ REPLACEMENT SUGGESTIONS ============
// Find qualified replacements for a vacant position
export const findReplacements = async (positionId, absentEmployeeIds, activeAssignmentEmployeeIds) => {
  const q = query(evaluationsCollection(), where('positionId', '==', positionId));
  const snap = await getDocs(q);
  const evals = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const byEmployee = {};
  evals.forEach(e => {
    if (!byEmployee[e.employeeId] || e.date > byEmployee[e.employeeId].date) {
      byEmployee[e.employeeId] = e;
    }
  });

  const excluded = new Set([...absentEmployeeIds, ...activeAssignmentEmployeeIds]);
  return Object.values(byEmployee)
    .filter(e => e.score >= 3 && !excluded.has(e.employeeId))
    .sort((a, b) => b.score - a.score);
};

// Detailed replacement search: separates FREE (no assignment) from MOVEABLE (currently in another position)
// allAssignments: full array of active assignments { positionId, employeeId, ... }
// positions: array of positions for name resolution
export const findReplacementsDetailed = async (positionId, absentEmployeeIds, allAssignments, positions = []) => {
  const q = query(evaluationsCollection(), where('positionId', '==', positionId));
  const snap = await getDocs(q);
  const evals = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Group by employee, keep latest score
  const byEmployee = {};
  evals.forEach(e => {
    if (!byEmployee[e.employeeId] || (e.date?.seconds || 0) > (byEmployee[e.employeeId].date?.seconds || 0)) {
      byEmployee[e.employeeId] = e;
    }
  });

  const absentSet = new Set(absentEmployeeIds);
  // Map employeeId → their current assignment (if any)
  const assignmentByEmployee = {};
  allAssignments.forEach(a => { assignmentByEmployee[a.employeeId] = a; });
  // Map positionId → position name
  const positionMap = {};
  positions.forEach(p => { positionMap[p.id] = p; });

  const free = [];     // Not absent, not assigned anywhere today → can replace immediately
  const moveable = []; // Not absent, assigned to another position → can be pulled

  Object.values(byEmployee)
    .filter(e => e.score >= 3 && !absentSet.has(e.employeeId))
    .sort((a, b) => b.score - a.score)
    .forEach(e => {
      const currentAssignment = assignmentByEmployee[e.employeeId];
      if (currentAssignment && currentAssignment.positionId !== positionId) {
        const currentPos = positionMap[currentAssignment.positionId];
        moveable.push({ ...e, currentAssignment, currentPositionName: currentPos?.name || 'otro puesto' });
      } else if (!currentAssignment) {
        free.push(e);
      }
    });

  return { free, moveable };
};

// ============ CROSS-LINE LENDING REQUESTS ============
export const lendingRequestsCollection = () => collection(db, 'lendingRequests');

export const subscribeToLendingRequests = (callback) => {
  return onSnapshot(
    query(lendingRequestsCollection(), where('status', '==', 'pending')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const subscribeAllLendingRequests = (callback) => {
  return onSnapshot(
    lendingRequestsCollection(),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const createLendingRequest = (data) =>
  addDoc(lendingRequestsCollection(), {
    ...data,
    status: 'pending',
    requestedAt: serverTimestamp()
  });

export const resolveLendingRequest = (id, employeeId, employeeName) =>
  updateDoc(doc(db, 'lendingRequests', id), {
    status: 'resolved',
    resolvedWithEmployeeId: employeeId,
    resolvedWithEmployeeName: employeeName,
    resolvedAt: serverTimestamp()
  });
