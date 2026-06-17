// src/demo/demoData.js
// Complete fictitious demo data for FloorSync - Manufacturera Austral S.A.

// ============================================================
// PRODUCTION LINE
// ============================================================
export const DEMO_LINE = {
  name: 'Línea 1 — Ensamble Modular Austral',
  description: 'Producción de modelos X1 y X2 · Capacidad: 120 unid/turno',
  canvasJSON: '[]', // Will be replaced by generated canvas
};

// ============================================================
// 80 PRODUCTION POSITIONS
// ============================================================
export const DEMO_POSITIONS = [
  // ── ÁREA 1: RECEPCIÓN Y MATERIALES (10 puestos) ──
  { name: 'Recepción de Materia Prima', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-001 — Recepción y Control de Materia Prima', color: '#22c55e' },
  { name: 'Inspección de Insumos Entrantes', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-002 — Inspección y Muestreo de Insumos', color: '#22c55e' },
  { name: 'Almacén Insumos A', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-003 — Almacenamiento y FIFO de Insumos Tipo A', color: '#22c55e' },
  { name: 'Almacén Insumos B', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-004 — Almacenamiento y FIFO de Insumos Tipo B', color: '#22c55e' },
  { name: 'Preparación de Kit X1', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-005 — Armado de Kit de Materiales para Modelo X1', color: '#22c55e' },
  { name: 'Preparación de Kit X2', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-006 — Armado de Kit de Materiales para Modelo X2', color: '#22c55e' },
  { name: 'Clasificación de Componentes', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-007 — Clasificación y Rotulado de Componentes', color: '#22c55e' },
  { name: 'Abastecimiento de Línea - Sector 1', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-008 — Abastecimiento Just-in-Time Sector 1', color: '#22c55e' },
  { name: 'Abastecimiento de Línea - Sector 2', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-009 — Abastecimiento Just-in-Time Sector 2', color: '#22c55e' },
  { name: 'Control de Inventario', area: 'Área 1 - Recepción', instructions: 'Aquí se verá: Instrucción de Trabajo IT-010 — Control y Registro de Inventario Diario', color: '#22c55e' },

  // ── ÁREA 2: PROCESAMIENTO (15 puestos) ──
  { name: 'Corte de Chapa — X1', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-011 — Corte de Chapa por Cizalla para Modelo X1', color: '#3b82f6' },
  { name: 'Corte de Chapa — X2', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-012 — Corte de Chapa por Cizalla para Modelo X2', color: '#3b82f6' },
  { name: 'Troquelado Pieza Base A', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-013 — Troquelado de Pieza Base Tipo A', color: '#3b82f6' },
  { name: 'Troquelado Pieza Base B', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-014 — Troquelado de Pieza Base Tipo B', color: '#3b82f6' },
  { name: 'Doblado y Conformado', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-015 — Doblado y Conformado en Prensa CNC', color: '#3b82f6' },
  { name: 'Soldadura MIG — Subconjunto 1', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-016 — Soldadura MIG-MAG Subconjunto 1', color: '#3b82f6' },
  { name: 'Soldadura MIG — Subconjunto 2', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-017 — Soldadura MIG-MAG Subconjunto 2', color: '#3b82f6' },
  { name: 'Soldadura a Punto — Estructura', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-018 — Soldadura por Resistencia (Punto)', color: '#3b82f6' },
  { name: 'Esmerilado y Desbarbado', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-019 — Acabado Superficial: Esmerilado y Desbarbado', color: '#3b82f6' },
  { name: 'Limpieza y Desengrase', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-020 — Limpieza Química y Desengrase Industrial', color: '#3b82f6' },
  { name: 'Fosfatizado de Superficies', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-021 — Tratamiento Superficial por Fosfatizado', color: '#3b82f6' },
  { name: 'Imprimación Anticorrosiva', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-022 — Aplicación de Imprimación Epoxi Anticorrosiva', color: '#3b82f6' },
  { name: 'Pintura en Polvo — Recubrimiento', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-023 — Pintura Electrostática en Polvo (Powder Coating)', color: '#3b82f6' },
  { name: 'Horno de Curado — Zona 1', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-024 — Curado en Horno: Zona 1 — Parámetros X1', color: '#3b82f6' },
  { name: 'Horno de Curado — Zona 2', area: 'Área 2 - Procesamiento', instructions: 'Aquí se verá: Instrucción de Trabajo IT-025 — Curado en Horno: Zona 2 — Parámetros X2', color: '#3b82f6' },

  // ── ÁREA 3: ENSAMBLE PRINCIPAL (25 puestos) ──
  { name: 'Ensamble Mecánico — Módulo Base X1', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-026 — Ensamble del Módulo Base Modelo X1', color: '#f59e0b' },
  { name: 'Ensamble Mecánico — Módulo Base X2', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-027 — Ensamble del Módulo Base Modelo X2', color: '#f59e0b' },
  { name: 'Montaje de Estructura Principal', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-028 — Montaje y Alineación de Estructura Principal', color: '#f59e0b' },
  { name: 'Instalación de Guías y Rieles', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-029 — Instalación y Ajuste de Guías Lineales', color: '#f59e0b' },
  { name: 'Ensamble Módulo A — Subsistema 1', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-030 — Ensamble Módulo A, Subsistema 1', color: '#f59e0b' },
  { name: 'Ensamble Módulo A — Subsistema 2', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-031 — Ensamble Módulo A, Subsistema 2', color: '#f59e0b' },
  { name: 'Ensamble Módulo B — Subsistema 1', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-032 — Ensamble Módulo B, Subsistema 1', color: '#f59e0b' },
  { name: 'Ensamble Módulo B — Subsistema 2', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-033 — Ensamble Módulo B, Subsistema 2', color: '#f59e0b' },
  { name: 'Instalación de Actuadores', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-034 — Montaje de Actuadores Lineales y Rotativos', color: '#f59e0b' },
  { name: 'Montaje de Conjunto Hidráulico', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-035 — Montaje y Purga del Sistema Hidráulico', color: '#f59e0b' },
  { name: 'Cableado Principal', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-036 — Tendido y Conexionado de Cableado Principal', color: '#f59e0b' },
  { name: 'Tablero Eléctrico', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-037 — Montaje y Conexión de Tablero Eléctrico', color: '#f59e0b' },
  { name: 'Montaje de Placa PCB Principal', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-038 — Montaje y Fijación de Placa PCB Principal', color: '#f59e0b' },
  { name: 'Instalación de Sensores', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-039 — Instalación y Conexión de Sensores y Transductores', color: '#f59e0b' },
  { name: 'Calibración del Sistema Electrónico', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-040 — Calibración Electrónica y Ajuste de Parámetros', color: '#f59e0b' },
  { name: 'Carga de Firmware', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-041 — Actualización y Verificación de Firmware', color: '#f59e0b' },
  { name: 'Ensamble de Cubierta Superior', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-042 — Montaje de Cubierta Superior y Sellado', color: '#f59e0b' },
  { name: 'Ensamble de Cubierta Lateral Derecha', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-043 — Montaje de Panel Lateral Derecho', color: '#f59e0b' },
  { name: 'Ensamble de Cubierta Lateral Izquierda', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-044 — Montaje de Panel Lateral Izquierdo', color: '#f59e0b' },
  { name: 'Accesorios y Opcionales X1', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-045 — Instalación de Accesorios Opcionales X1', color: '#f59e0b' },
  { name: 'Accesorios y Opcionales X2', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-046 — Instalación de Accesorios Opcionales X2', color: '#f59e0b' },
  { name: 'Ajuste y Torque de Sujetadores', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-047 — Torque de Sujetadores según Plan de Control', color: '#f59e0b' },
  { name: 'Aplicación de Selladores', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-048 — Aplicación de Sellador Estructural y de Estanqueidad', color: '#f59e0b' },
  { name: 'Etiquetado Técnico', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-049 — Colocación de Etiquetas Técnicas y de Seguridad', color: '#f59e0b' },
  { name: 'Revisión Intermedia de Ensamble', area: 'Área 3 - Ensamble', instructions: 'Aquí se verá: Instrucción de Trabajo IT-050 — Checklist de Revisión Intermedia de Ensamble', color: '#f59e0b' },

  // ── ÁREA 4: PRUEBAS Y CALIDAD (15 puestos) ──
  { name: 'Test Funcional — Banco A', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-051 — Test Funcional Completo en Banco de Prueba A', color: '#a855f7' },
  { name: 'Test Funcional — Banco B', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-052 — Test Funcional Completo en Banco de Prueba B', color: '#a855f7' },
  { name: 'Test Eléctrico de Alta Tensión', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-053 — Prueba Dieléctrica y Rigidez de Aislamiento', color: '#a855f7' },
  { name: 'Test de Rendimiento — Carga Nominal', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-054 — Ensayo de Rendimiento a Carga Nominal', color: '#a855f7' },
  { name: 'Test de Rendimiento — Carga Máxima', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-055 — Ensayo de Rendimiento a Carga Máxima', color: '#a855f7' },
  { name: 'Prueba de Estanqueidad', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-056 — Prueba de Estanqueidad con Presión de Aire', color: '#a855f7' },
  { name: 'Ensayo de Vibración', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-057 — Ensayo de Vibración e Impacto mecánico', color: '#a855f7' },
  { name: 'Control Dimensional y Metrología', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-058 — Medición y Control Dimensional con CMM', color: '#a855f7' },
  { name: 'Inspección Visual X1', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-059 — Inspección Visual y Estética Modelo X1', color: '#a855f7' },
  { name: 'Inspección Visual X2', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-060 — Inspección Visual y Estética Modelo X2', color: '#a855f7' },
  { name: 'Revisión de Documentación Técnica', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-061 — Control de Documentación y Trazabilidad', color: '#a855f7' },
  { name: 'Control de Calidad Final X1', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-062 — Inspección Final y Liberación de Modelo X1', color: '#a855f7' },
  { name: 'Control de Calidad Final X2', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-063 — Inspección Final y Liberación de Modelo X2', color: '#a855f7' },
  { name: 'Banco de Retrabajo y Reproceso', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-064 — Procedimiento de Retrabajo y No Conformidades', color: '#a855f7' },
  { name: 'Liberación de Producto Terminado', area: 'Área 4 - Calidad', instructions: 'Aquí se verá: Instrucción de Trabajo IT-065 — Liberación y Aprobación Final del Producto', color: '#a855f7' },

  // ── ÁREA 5: EMBALAJE Y DESPACHO (15 puestos) ──
  { name: 'Embalaje Primario X1', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-066 — Embalaje Primario y Protección Modelo X1', color: '#ef4444' },
  { name: 'Embalaje Primario X2', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-067 — Embalaje Primario y Protección Modelo X2', color: '#ef4444' },
  { name: 'Embalaje Secundario', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-068 — Embalaje Secundario en Caja de Cartón Corrugado', color: '#ef4444' },
  { name: 'Aplicación de Espuma Protectora', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-069 — Colocación de Espuma de Polietileno Moldeada', color: '#ef4444' },
  { name: 'Manuales y Documentación', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-070 — Colocación de Manuales, Garantía y Accesorios', color: '#ef4444' },
  { name: 'Precintado y Zuncho', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-071 — Precintado con Zuncho Plástico y Precintos', color: '#ef4444' },
  { name: 'Control de Peso y Dimensión', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-072 — Verificación de Peso y Dimensiones de Bulto', color: '#ef4444' },
  { name: 'Etiquetado de Exportación', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-073 — Etiquetado según Normativa de Exportación', color: '#ef4444' },
  { name: 'Codificación QR y Trazabilidad', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-074 — Generación y Escaneo de Código QR de Trazabilidad', color: '#ef4444' },
  { name: 'Armado de Pallets', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-075 — Armado y Distribución de Cargas en Pallets', color: '#ef4444' },
  { name: 'Filmado de Pallets', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-076 — Filmado Stretch y Fijación de Carga en Pallet', color: '#ef4444' },
  { name: 'Identificación de Lote', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-077 — Identificación y Registro de Lote de Producción', color: '#ef4444' },
  { name: 'Control Final Pre-Despacho', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-078 — Lista de Verificación Pre-Despacho', color: '#ef4444' },
  { name: 'Carga y Despacho', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-079 — Carga en Camión y Documentación de Despacho', color: '#ef4444' },
  { name: 'Gestión de Devoluciones y NC', area: 'Área 5 - Despacho', instructions: 'Aquí se verá: Instrucción de Trabajo IT-080 — Gestión de No Conformidades y Devoluciones de Clientes', color: '#ef4444' },
];

// ============================================================
// EMPLOYEES: 80 PRODUCTION + 27 ADMINISTRATIVE
// ============================================================
const NM = ['Martín','Juan','Carlos','Diego','Pablo','Sergio','Daniel','Rodrigo','Gustavo',
  'Federico','Alejandro','Nicolás','Sebastián','Emiliano','Gabriel','Hernán','Ricardo',
  'Marcelo','Matías','Facundo','Lucas','Agustín','Franco','Damián','Eduardo','Claudio',
  'Maximiliano','Leonardo','Ezequiel','Mariano','Gonzalo','Ignacio','Fernando','Leandro',
  'Raúl','Antonio','Jorge','Roberto','Walter','Cristian'];

const NF = ['María','Laura','Claudia','Valeria','Sofía','Paula','Florencia','Natalia',
  'Romina','Cecilia','Adriana','Silvana','Luciana','Gabriela','Verónica','Carla',
  'Daniela','Soledad','Vanesa','Andrea'];

const AP1 = ['González','Martínez','Rodríguez','López','García','Fernández','Sánchez',
  'Ramírez','Torres','Flores','Morales','Ruiz','Díaz','Álvarez','Cabrera','Medina',
  'Navarro','Castro','Vargas','Romero','Gutiérrez','Silva','Molina','Suárez','Ortega',
  'Herrera','Mendoza','Ibarra','Ramos','Valdez','Blanco','Acosta','Pereyra','Giménez',
  'Muñoz','Vega','Cruz','Delgado','Ponce','Carrizo'];

const AP2 = ['Sosa','Benítez','Leiva','Figueroa','Agüero','Ríos','Quiroga','Villalba',
  'Rojas','Vera','Aguirre','Domínguez','Olivares','Correa','Miranda','Núñez','Salinas',
  'Oviedo','Paredes','Fuentes','Lozano','Castillo','Reyes','Bravo','Pérez','Espinoza',
  'Campos','Vidal','Maldonado','Barrera'];

function gen(i) {
  const fem = [7,11,18,23,29,34,38,42,49,54,58,63,67,73,77].includes(i);
  const nm = fem ? NF[i % NF.length] : NM[i % NM.length];
  const ap = AP1[i % AP1.length] + ' ' + AP2[(i * 3 + 7) % AP2.length];
  return { name: nm, lastName: ap };
}

// Generate 80 production employees
const prodEmployees = Array.from({ length: 80 }, (_, i) => {
  const { name, lastName } = gen(i);
  return {
    name, lastName,
    employeeId: String(10001 + i).padStart(6, '0'),
    department: 'Producción',
    active: true,
  };
});

// Administrative / support staff (27 people)
const adminEmployees = [
  // Supervisores de línea (5)
  { name: 'Roberto', lastName: 'Casas Villafuerte', employeeId: '009001', department: 'Supervisión', active: true },
  { name: 'Verónica', lastName: 'Peralta Mena', employeeId: '009002', department: 'Supervisión', active: true },
  { name: 'Claudio', lastName: 'Ibáñez Ríos', employeeId: '009003', department: 'Supervisión', active: true },
  { name: 'Marcela', lastName: 'Soto Durán', employeeId: '009004', department: 'Supervisión', active: true },
  { name: 'Andrés', lastName: 'Venegas Parada', employeeId: '009005', department: 'Supervisión', active: true },
  // Control de Calidad (3)
  { name: 'Inés', lastName: 'Riquelme Farías', employeeId: '008001', department: 'Control de Calidad', active: true },
  { name: 'Pablo', lastName: 'Zúñiga Mora', employeeId: '008002', department: 'Control de Calidad', active: true },
  { name: 'Tatiana', lastName: 'Arroyo Neira', employeeId: '008003', department: 'Control de Calidad', active: true },
  // Logística (4)
  { name: 'Héctor', lastName: 'Bustos Alvarado', employeeId: '007001', department: 'Logística', active: true },
  { name: 'Silvia', lastName: 'Espejo Contreras', employeeId: '007002', department: 'Logística', active: true },
  { name: 'Diego', lastName: 'Navarrete Pino', employeeId: '007003', department: 'Logística', active: true },
  { name: 'Ramón', lastName: 'Letelier Cid', employeeId: '007004', department: 'Logística', active: true },
  // Mantenimiento (3)
  { name: 'Oscar', lastName: 'Trujillo Salas', employeeId: '006001', department: 'Mantenimiento', active: true },
  { name: 'Javier', lastName: 'Coloma Espinoza', employeeId: '006002', department: 'Mantenimiento', active: true },
  { name: 'Rodrigo', lastName: 'Fuenzalida Ríos', employeeId: '006003', department: 'Mantenimiento', active: true },
  // Ingeniería (3)
  { name: 'Patricio', lastName: 'Aldunate Vera', employeeId: '005001', department: 'Ingeniería', active: true },
  { name: 'Carolina', lastName: 'Mardones Cáceres', employeeId: '005002', department: 'Ingeniería', active: true },
  { name: 'Felipe', lastName: 'Arenas Maldonado', employeeId: '005003', department: 'Ingeniería', active: true },
  // RRHH (2)
  { name: 'Sandra', lastName: 'Quiroz Olguín', employeeId: '004001', department: 'RRHH', active: true },
  { name: 'Cristóbal', lastName: 'Poblete Yáñez', employeeId: '004002', department: 'RRHH', active: true },
  // Administración (2)
  { name: 'Patricia', lastName: 'Montecinos Leal', employeeId: '003001', department: 'Administración', active: true },
  { name: 'Mauricio', lastName: 'Sepúlveda Ibarra', employeeId: '003002', department: 'Administración', active: true },
  // Líderes de Turno (3)
  { name: 'Eduardo', lastName: 'Pizarro Contreras', employeeId: '002001', department: 'Producción', active: true },
  { name: 'Fernanda', lastName: 'Lagos Henríquez', employeeId: '002002', department: 'Producción', active: true },
  { name: 'Iván', lastName: 'Villegas Caro', employeeId: '002003', department: 'Producción', active: true },
  // Gerencia (2)
  { name: 'Alejandro', lastName: 'Harrold Bertín', employeeId: '001001', department: 'Gerencia', active: true },
  { name: 'Viviana', lastName: 'Contreras Muñoz', employeeId: '001002', department: 'Gerencia', active: true },
];

export const DEMO_EMPLOYEES = [...prodEmployees, ...adminEmployees];

// ============================================================
// EVALUATIONS: realistic distribution
// Scores for production employees on their assigned positions
// Some employees qualified in multiple positions
// ============================================================
export function generateDemoEvaluations(employeeIds, positionIds) {
  const evaluations = [];
  const supervisors = ['Roberto Casas', 'Verónica Peralta', 'Claudio Ibáñez', 'Marcela Soto', 'Andrés Venegas'];

  // Score distribution: 10% → 1, 20% → 2, 45% → 3, 25% → 4
  const scoreForIdx = (i) => {
    const r = (i * 17 + 3) % 100;
    if (r < 10) return 1;
    if (r < 30) return 2;
    if (r < 75) return 3;
    return 4;
  };

  // Each production employee evaluated on their primary position
  for (let i = 0; i < 80; i++) {
    const empId = employeeIds[i];
    const posId = positionIds[i]; // primary position = same index
    const score = scoreForIdx(i);
    const supervisor = supervisors[i % supervisors.length];

    // Primary evaluation
    const dateOffset = (i * 7 + 14) % 180; // between 14 and 180 days ago
    evaluations.push({
      employeeId: empId,
      positionId: posId,
      positionName: DEMO_POSITIONS[i].name,
      score,
      evaluatedBy: supervisor,
      notes: score === 1 ? 'Requiere plan de capacitación urgente' :
             score === 2 ? 'Progresando. Necesita mejorar tiempos de ciclo' :
             score === 3 ? 'Cumple los estándares de calidad y producción' :
             'Referente del equipo. Apoya capacitación de nuevos ingresos',
      daysAgo: dateOffset,
    });

    // Some employees also evaluated on a second position (cross-training)
    if (i % 4 === 0 && i + 1 < 80) {
      const score2 = scoreForIdx(i + 33);
      evaluations.push({
        employeeId: empId,
        positionId: positionIds[(i + 1) % 80],
        positionName: DEMO_POSITIONS[(i + 1) % 80].name,
        score: score2,
        evaluatedBy: supervisors[(i + 2) % supervisors.length],
        notes: score2 >= 3 ? 'Polivalente — Apto para cubrir este puesto' : 'En capacitación para polivalencia',
        daysAgo: dateOffset + 30,
      });
    }

    // Older evaluation (evolution over time)
    if (score > 1) {
      evaluations.push({
        employeeId: empId,
        positionId: posId,
        positionName: DEMO_POSITIONS[i].name,
        score: Math.max(1, score - 1),
        evaluatedBy: supervisor,
        notes: 'Evaluación anterior — Progreso observado',
        daysAgo: dateOffset + 90,
      });
    }
  }

  return evaluations;
}

// ============================================================
// ASSIGNMENTS: 80 production positions → 80 employees
// ============================================================
export function generateDemoAssignments(employeeIds, positionIds) {
  return positionIds.map((posId, i) => ({
    positionId: posId,
    employeeId: employeeIds[i],
    active: true,
  }));
}

// ============================================================
// ABSENCES: 7% of 80 = ~6 employees absent today
// ============================================================
export const DEMO_ABSENT_INDICES = [2, 11, 23, 37, 51, 68]; // indices in prodEmployees

export const DEMO_ABSENCE_REASONS = [
  'Enfermedad — Certificado médico presentado',
  'Licencia por familiar a cargo',
  'Inasistencia injustificada',
  'Accidente in itinere — ART',
  'Enfermedad — Certificado médico',
  'Ausencia autorizada — Trámite personal',
];

// ============================================================
// CANVAS JSON: Factory floor layout
// 80 stations arranged in 5 areas, 10 cols × 8 rows
// ============================================================
export function generateCanvasJSON(positionIds) {
  const shapes = [];
  const COLS = 10;
  const CELL_W = 220; // px
  const CELL_H = 140; // px
  const GAP_X = 20;
  const GAP_Y = 20;
  const ORIGIN_X = 80;
  const ORIGIN_Y = 80;

  const AREA_COLORS = {
    'Área 1 - Recepción': 'rgba(34,197,94,0.1)',
    'Área 2 - Procesamiento': 'rgba(59,130,246,0.1)',
    'Área 3 - Ensamble': 'rgba(245,158,11,0.1)',
    'Área 4 - Calidad': 'rgba(168,85,247,0.1)',
    'Área 5 - Despacho': 'rgba(239,68,68,0.1)',
  };

  // Background factory floor
  shapes.push({
    id: 'floor-bg',
    type: 'rect',
    x: 20, y: 20,
    width: COLS * (CELL_W + GAP_X) + 120,
    height: 8 * (CELL_H + GAP_Y) + 120,
    fill: 'rgba(15,22,36,0.8)',
    stroke: '#3b82f6',
    strokeWidth: 2,
    opacity: 1,
  });

  // Area background blocks
  const areaRanges = [
    { area: 'Área 1 - Recepción', start: 0, end: 9, label: '▸ ÁREA 1: RECEPCIÓN Y MATERIALES' },
    { area: 'Área 2 - Procesamiento', start: 10, end: 24, label: '▸ ÁREA 2: PROCESAMIENTO' },
    { area: 'Área 3 - Ensamble', start: 25, end: 49, label: '▸ ÁREA 3: ENSAMBLE PRINCIPAL' },
    { area: 'Área 4 - Calidad', start: 50, end: 64, label: '▸ ÁREA 4: PRUEBAS Y CALIDAD' },
    { area: 'Área 5 - Despacho', start: 65, end: 79, label: '▸ ÁREA 5: EMBALAJE Y DESPACHO' },
  ];

  areaRanges.forEach(({ area, start, end, label }) => {
    const startRow = Math.floor(start / COLS);
    const startCol = start % COLS;
    const endRow = Math.floor(end / COLS);
    const endCol = end % COLS;

    const ax = ORIGIN_X + startCol * (CELL_W + GAP_X) - 10;
    const ay = ORIGIN_Y + startRow * (CELL_H + GAP_Y) - 10;

    // Simpler: full row span per area group
    const areaFirstRow = Math.floor(start / COLS);
    const areaLastRow = Math.floor(end / COLS);
    const areaW = COLS * (CELL_W + GAP_X) - GAP_X + 20;
    const areaH = (areaLastRow - areaFirstRow + 1) * (CELL_H + GAP_Y) - GAP_Y + 20;

    shapes.push({
      id: `area-bg-${area}`,
      type: 'rect',
      x: ORIGIN_X - 10,
      y: ORIGIN_Y + areaFirstRow * (CELL_H + GAP_Y) - 10,
      width: areaW,
      height: areaH,
      fill: AREA_COLORS[area] || 'rgba(255,255,255,0.03)',
      stroke: DEMO_POSITIONS[start].color,
      strokeWidth: 1,
      opacity: 1,
    });

    shapes.push({
      id: `area-label-${area}`,
      type: 'text',
      x: ORIGIN_X,
      y: ORIGIN_Y + areaFirstRow * (CELL_H + GAP_Y) - 8,
      text: label,
      fontSize: 11,
      fill: DEMO_POSITIONS[start].color,
    });
  });

  // Individual work stations
  DEMO_POSITIONS.forEach((pos, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = ORIGIN_X + col * (CELL_W + GAP_X);
    const y = ORIGIN_Y + row * (CELL_H + GAP_Y) + 15;

    // Station rectangle
    shapes.push({
      id: `station-${i}`,
      type: 'position',
      x, y,
      width: CELL_W,
      height: CELL_H - 5,
      fill: pos.color,
      stroke: pos.color,
      strokeWidth: 1.5,
      opacity: 0.7,
      positionId: positionIds[i] || null,
    });

    // Station label
    shapes.push({
      id: `label-${i}`,
      type: 'text',
      x: x + 6,
      y: y + 6,
      text: `IT-${String(i + 1).padStart(3, '0')}\n${pos.name.slice(0, 22)}${pos.name.length > 22 ? '…' : ''}`,
      fontSize: 10,
      fill: '#ffffff',
    });

    // Station number badge
    shapes.push({
      id: `num-${i}`,
      type: 'text',
      x: x + CELL_W - 28,
      y: y + CELL_H - 22,
      text: `#${String(i + 1).padStart(2, '0')}`,
      fontSize: 9,
      fill: 'rgba(255,255,255,0.5)',
    });
  });

  // Flow arrows between areas
  const arrowY = ORIGIN_Y + 4 * (CELL_H + GAP_Y) + CELL_H / 2;
  for (let a = 0; a < 4; a++) {
    const arX = ORIGIN_X + (a + 1) * (2 * (CELL_W + GAP_X)) - 10;
    shapes.push({
      id: `arrow-${a}`,
      type: 'line',
      points: [arX, arrowY, arX + 40, arrowY],
      stroke: '#3b82f6',
      strokeWidth: 3,
    });
  }

  return JSON.stringify(shapes);
}
