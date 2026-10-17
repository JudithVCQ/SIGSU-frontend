// TEMPORAL: datos simulados. Se elimina al conectar el backend; reemplazar por src/services/.

export const INITIAL_SOLICITUDES = [
  {
    codigo: 'SIG-00131',
    titulo: 'Proyector sin señal de video',
    categoria: 'Soporte informático',
    estado: 'En atención',
    prioridad: 'Alta',
    fecha: '16 oct, 2026',
    ubicacion: 'Pabellón A - Aula 205',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    descripcion:
      'El proyector del aula enciende, pero no detecta ninguna fuente HDMI. Probé con dos laptops y con otro cable sin resultado. Tengo clase con 40 estudiantes el lunes a las 8:00.',
    evidencias: [
      { nombre: 'proyector_aula205.jpg', tamano: '1.8 MB' },
      { nombre: 'mensaje_error.png', tamano: '640 KB' },
    ],
  },
  {
    codigo: 'SIG-00127',
    titulo: 'Goteras en el techo del pasillo',
    categoria: 'Infraestructura',
    estado: 'Asignada',
    prioridad: 'Media',
    fecha: '14 oct, 2026',
    ubicacion: 'Pabellón C - Segundo piso',
    responsable: 'Laura Díaz',
    rolResponsable: 'Mantenimiento general',
    descripcion:
      'Con la lluvia de ayer aparecieron goteras frente a la puerta del aula C-210. El piso queda resbaloso y se forman charcos en el pasillo.',
    evidencias: [{ nombre: 'gotera_pasillo.jpg', tamano: '2.3 MB' }],
  },
  {
    codigo: 'SIG-00124',
    titulo: 'Constancia de estudios con firma digital',
    categoria: 'Trámites',
    estado: 'Pendiente',
    prioridad: 'Baja',
    fecha: '13 oct, 2026',
    ubicacion: 'Secretaría Académica',
    responsable: 'Sin asignar',
    rolResponsable: '',
    descripcion:
      'Necesito una constancia de estudios del semestre 2026-II con firma digital para presentarla en una beca externa.',
    evidencias: [],
  },
  {
    codigo: 'SIG-00118',
    titulo: 'Luminaria averiada en sala de lectura',
    categoria: 'Mantenimiento',
    estado: 'Resuelta',
    prioridad: 'Media',
    fecha: '08 oct, 2026',
    ubicacion: 'Biblioteca Central - Sala 2',
    responsable: 'Carlos Peña',
    rolResponsable: 'Electricidad',
    descripcion:
      'Dos luminarias de la mesa de estudio del fondo parpadean y se apagan por intervalos.',
    evidencias: [{ nombre: 'luminaria_sala2.jpg', tamano: '1.1 MB' }],
  },
  {
    codigo: 'SIG-00109',
    titulo: 'Acceso a la red Wi-Fi institucional',
    categoria: 'Soporte informático',
    estado: 'Cerrada',
    prioridad: 'Baja',
    fecha: '02 oct, 2026',
    ubicacion: 'Pabellón B - Patio central',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    descripcion:
      'No puedo autenticarme en la red SIGSU-Campus desde mi teléfono, aunque sí lo hago desde la laptop.',
    evidencias: [],
  },
  {
    codigo: 'SIG-00102',
    titulo: 'Puerta del laboratorio no cierra bien',
    categoria: 'Infraestructura',
    estado: 'Resuelta',
    prioridad: 'Alta',
    fecha: '28 sep, 2026',
    ubicacion: 'Pabellón D - Laboratorio 2',
    responsable: 'Carlos Peña',
    rolResponsable: 'Carpintería',
    descripcion:
      'La puerta principal del laboratorio queda entreabierta porque la bisagra superior está suelta.',
    evidencias: [{ nombre: 'bisagra_lab2.jpg', tamano: '1.4 MB' }],
  },
];

let inMemorySolicitudes = [...INITIAL_SOLICITUDES];
let nextIdCounter = 132;

export const SOLICITUDES_MOCK = inMemorySolicitudes;

export function getSolicitudesMock() {
  return inMemorySolicitudes;
}

export function getSolicitudByCodigo(codigo) {
  return inMemorySolicitudes.find((s) => s.codigo === codigo) || inMemorySolicitudes[0];
}

export function addSolicitudMock(nueva) {
  inMemorySolicitudes = [nueva, ...inMemorySolicitudes];
  return nueva;
}

export function generateNextCodigo() {
  const code = `SIG-${String(nextIdCounter).padStart(5, '0')}`;
  nextIdCounter += 1;
  return code;
}

export const ESTADO_NIVEL = {
  Pendiente: 0,
  Asignada: 1,
  'En atención': 2,
  Resuelta: 3,
  Cerrada: 4,
};

export const SUPERVISOR_KPIS = {
  totales: '128',
  enAtencion: '24',
  resueltasTiempo: '89%',
};

export const CARGA_POR_CATEGORIA = [
  { categoria: 'Mantenimiento', cantidad: 34, porcentaje: 72 },
  { categoria: 'Soporte informático', cantidad: 28, porcentaje: 59 },
  { categoria: 'Infraestructura', cantidad: 19, porcentaje: 40 },
  { categoria: 'Trámites', cantidad: 11, porcentaje: 24 },
];

export const HISTORIAL_ACTIVIDAD_BASE = [
  {
    titulo: 'Solicitud en atención',
    descripcion: 'Diego Morales inició el diagnóstico presencial.',
    fecha: 'Hoy, 11:24',
    activo: true,
  },
  {
    titulo: 'Responsable asignado',
    descripcion: 'La solicitud fue asignada a Diego Morales.',
    fecha: 'Hoy, 10:15',
  },
  {
    titulo: 'Solicitud registrada',
    descripcion: 'Camila Rojas registró la solicitud.',
    fecha: 'Hoy, 09:42',
  },
];
