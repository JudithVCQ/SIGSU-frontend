// TEMPORAL: datos simulados. Se elimina al conectar el backend; reemplazar por src/services/.
import { formatearFechaVisual, esVencida } from '../config/vigencia';

function haceDias(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d;
}

export const INITIAL_SOLICITUDES = [
  {
    id: 133,
    codigo: 'SIG-00133',
    titulo: 'Proyector no enciende / sin señal en aula 205',
    categoria: 'Soporte informático',
    estado: 'Registrada',
    estadoApi: 'REGISTRADA',
    prioridad: 'Alta',
    fechaRegistro: haceDias(1),
    fecha: formatearFechaVisual(haceDias(1)),
    ubicacion: 'Pabellón A - Aula 205',
    responsable: 'Sin asignar',
    rolResponsable: '',
    solicitanteId: 101,
    solicitante: 'Camila Rojas',
    descripcion:
      'Reitero la solicitud porque el lunes tengo clase con 40 estudiantes a las 8:00 y el proyector sigue sin dar señal HDMI.',
    evidencias: [{ nombre: 'pantalla_negra.jpg', tamano: '1.1 MB' }],
    comentarios: [],
  },
  {
    id: 131,
    codigo: 'SIG-00131',
    titulo: 'Proyector sin señal de video',
    categoria: 'Soporte informático',
    estado: 'En atención',
    estadoApi: 'EN_ATENCION',
    prioridad: 'Alta', // Plazo 2 días. Registrada hace 4 días -> VENCIDA (1/2)
    fechaRegistro: haceDias(4),
    fecha: formatearFechaVisual(haceDias(4)),
    ubicacion: 'Pabellón A - Aula 205',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    solicitanteId: 101,
    solicitante: 'Camila Rojas',
    descripcion:
      'El proyector del aula enciende, pero no detecta ninguna fuente HDMI. Probé con dos laptops y con otro cable sin resultado. Tengo clase con 40 estudiantes el lunes a las 8:00.',
    evidencias: [
      { nombre: 'proyector_aula205.jpg', tamano: '1.8 MB' },
      { nombre: 'mensaje_error.png', tamano: '640 KB' },
    ],
    comentarios: [
      {
        nombre: 'Diego Morales',
        rol: 'Soporte técnico',
        texto: 'Revisé el reporte y ya coordinamos la visita técnica. Te avisaré apenas termine.',
        tiempo: `${formatearFechaVisual(haceDias(4))} · 12:10`,
      },
      {
        nombre: 'Camila Rojas',
        rol: 'Solicitante',
        texto: 'Gracias. Estaré en el aula hasta las 4 p. m. por si necesitan acceso.',
        tiempo: `${formatearFechaVisual(haceDias(4))} · 12:32`,
      },
    ],
  },
  {
    id: 129,
    codigo: 'SIG-00129',
    titulo: 'Falla en el punto de red del laboratorio 4',
    categoria: 'Soporte informático',
    estado: 'Asignada',
    estadoApi: 'ASIGNADA',
    prioridad: 'Alta', // Plazo 2 días. Registrada hace 1 día -> EN PLAZO
    fechaRegistro: haceDias(1),
    fecha: formatearFechaVisual(haceDias(1)),
    ubicacion: 'Pabellón B - Laboratorio 4',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    solicitanteId: 105,
    solicitante: 'Elena Torres',
    descripcion:
      'Las tomas de red 12 y 14 del laboratorio no tienen conectividad física. Los cables de parcheo están intactos pero el switch no detecta enlace.',
    evidencias: [{ nombre: 'toma_red_lab4.jpg', tamano: '1.2 MB' }],
    comentarios: [],
  },
  {
    id: 127,
    codigo: 'SIG-00127',
    titulo: 'Goteras en el techo del pasillo',
    categoria: 'Infraestructura',
    estado: 'Asignada',
    estadoApi: 'ASIGNADA',
    prioridad: 'Media', // Plazo 5 días. Registrada hace 7 días -> VENCIDA (2/2)
    fechaRegistro: haceDias(7),
    fecha: formatearFechaVisual(haceDias(7)),
    ubicacion: 'Pabellón C - Segundo piso',
    responsable: 'Laura Díaz',
    rolResponsable: 'Mantenimiento general',
    solicitanteId: 102,
    solicitante: 'Luis Torres',
    descripcion:
      'Con la lluvia de ayer aparecieron goteras frente a la puerta del aula C-210. El piso queda resbaloso y se forman charcos en el pasillo.',
    evidencias: [{ nombre: 'gotera_pasillo.jpg', tamano: '2.3 MB' }],
    comentarios: [],
  },
  {
    id: 126,
    codigo: 'SIG-00126',
    titulo: 'Impresora láser no responde en Sala de Profesores',
    categoria: 'Soporte informático',
    estado: 'Asignada',
    estadoApi: 'ASIGNADA',
    prioridad: 'Media', // Plazo 5 días. Registrada hace 2 días -> EN PLAZO
    fechaRegistro: haceDias(2),
    fecha: formatearFechaVisual(haceDias(2)),
    ubicacion: 'Pabellón A - Sala de Profesores',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    solicitanteId: 102,
    solicitante: 'Luis Torres',
    descripcion:
      'La impresora multifuncional de la sala muestra error de atasco de papel permanente, pero las bandejas están despejadas.',
    evidencias: [{ nombre: 'pantalla_impresora.jpg', tamano: '950 KB' }],
    comentarios: [],
  },
  {
    id: 124,
    codigo: 'SIG-00124',
    titulo: 'Constancia de estudios con firma digital',
    categoria: 'Trámites',
    estado: 'Pendiente',
    estadoApi: 'REGISTRADA',
    prioridad: 'Baja', // Plazo 10 días. Registrada hace 3 días -> EN PLAZO
    fechaRegistro: haceDias(3),
    fecha: formatearFechaVisual(haceDias(3)),
    ubicacion: 'Secretaría Académica',
    responsable: 'Sin asignar',
    rolResponsable: '',
    solicitanteId: 104,
    solicitante: 'Ana Mendoza',
    descripcion:
      'Necesito una constancia de estudios del semestre 2026-II con firma digital para presentarla en una beca externa.',
    evidencias: [],
    comentarios: [],
  },
  {
    id: 118,
    codigo: 'SIG-00118',
    titulo: 'Luminaria averiada en sala de lectura',
    categoria: 'Mantenimiento',
    estado: 'Resuelta', // Resuelta -> NO VENCIDA
    estadoApi: 'RESUELTA',
    prioridad: 'Media',
    fechaRegistro: haceDias(9),
    fecha: formatearFechaVisual(haceDias(9)),
    ubicacion: 'Biblioteca Central - Sala 2',
    responsable: 'Carlos Peña',
    rolResponsable: 'Electricidad',
    solicitanteId: 103,
    solicitante: 'Pedro Sánchez',
    descripcion:
      'Dos luminarias de la mesa de estudio del fondo parpadean y se apagan por intervalos.',
    evidencias: [{ nombre: 'luminaria_sala2.jpg', tamano: '1.1 MB' }],
    solucion:
      'Se cambiaron los dos balastros electrónicos y los tubos LED correspondientes. Iluminación probada y operativa.',
    comentarios: [],
  },
  {
    id: 115,
    codigo: 'SIG-00115',
    titulo: 'Reemplazo de switch de red en Pabellón B',
    categoria: 'Soporte informático',
    estado: 'Resuelta', // Resuelta -> NO VENCIDA
    estadoApi: 'RESUELTA',
    prioridad: 'Media',
    fechaRegistro: haceDias(12),
    fecha: formatearFechaVisual(haceDias(12)),
    ubicacion: 'Pabellón B - Rack Piso 1',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    solicitanteId: 106,
    solicitante: 'Jorge Vargas',
    descripcion:
      'El switch de acceso del rack secundario presentaba reinicios intermitentes afectando la planta baja.',
    evidencias: [{ nombre: 'switch_dañado.jpg', tamano: '1.5 MB' }],
    solucion:
      'Se reemplazó el equipo por un switch de 24 puertos administrable de respaldo, reconfigurando VLANs y enlaces troncales.',
    comentarios: [
      {
        nombre: 'Diego Morales',
        rol: 'Soporte técnico',
        texto: 'Equipo reemplazado y puertos probados con éxito.',
        tiempo: `${formatearFechaVisual(haceDias(12))} · 17:00`,
      },
    ],
  },
  {
    id: 109,
    codigo: 'SIG-00109',
    titulo: 'Acceso a la red Wi-Fi institucional',
    categoria: 'Soporte informático',
    estado: 'Cerrada', // Cerrada -> NO VENCIDA
    estadoApi: 'CERRADA',
    prioridad: 'Baja',
    fechaRegistro: haceDias(15),
    fecha: formatearFechaVisual(haceDias(15)),
    ubicacion: 'Pabellón B - Patio central',
    responsable: 'Diego Morales',
    rolResponsable: 'Soporte técnico',
    solicitanteId: 101,
    solicitante: 'Camila Rojas',
    descripcion:
      'No puedo autenticarme en la red SIGSU-Campus desde mi teléfono, aunque sí lo hago desde la laptop.',
    evidencias: [],
    solucion:
      'Se reinstaló el certificado raíz institucional en el dispositivo móvil del usuario.',
    comentarios: [],
  },
  {
    id: 102,
    codigo: 'SIG-00102',
    titulo: 'Puerta del laboratorio no cierra bien',
    categoria: 'Infraestructura',
    estado: 'Cerrada',
    estadoApi: 'CERRADA',
    prioridad: 'Alta',
    fechaRegistro: haceDias(20),
    fecha: formatearFechaVisual(haceDias(20)),
    ubicacion: 'Pabellón D - Laboratorio 2',
    responsable: 'Carlos Peña',
    rolResponsable: 'Carpintería',
    solicitanteId: 107,
    solicitante: 'Carlos Gómez',
    descripcion:
      'La puerta principal del laboratorio queda entreabierta porque la bisagra superior está suelta.',
    evidencias: [{ nombre: 'bisagra_lab2.jpg', tamano: '1.4 MB' }],
    solucion: 'Se reemplazaron los tornillos desgastados y se niveló el marco de la puerta.',
    comentarios: [],
  },
  {
    id: 98,
    codigo: 'SIG-00098',
    titulo: 'Ajuste de cerradura en oficina 101',
    categoria: 'Mantenimiento',
    estado: 'Cerrada',
    estadoApi: 'CERRADA',
    prioridad: 'Baja',
    fechaRegistro: haceDias(25),
    fecha: formatearFechaVisual(haceDias(25)),
    ubicacion: 'Pabellón C - Oficina 101',
    responsable: 'Carlos Peña',
    rolResponsable: 'Carpintería',
    solicitanteId: 107,
    solicitante: 'Carlos Gómez',
    descripcion:
      'Cerradura reparada satisfactoriamente.',
    evidencias: [],
    solucion: 'Se lubricó el pestillo y se ajustó la contrachapa.',
    comentarios: [],
  },
];

let inMemorySolicitudes = [...INITIAL_SOLICITUDES];
let nextIdCounter = 134;

export const SOLICITUDES_MOCK = inMemorySolicitudes;

export function getSolicitudesMock() {
  return inMemorySolicitudes;
}

export function getSolicitudByCodigo(codigo) {
  return (
    inMemorySolicitudes.find(
      (s) => s.codigo === codigo || String(s.id) === String(codigo)
    ) || inMemorySolicitudes[0]
  );
}

export function getSolicitudesPorSolicitanteMock(solicitanteId, excluirSolicitudId = null) {
  if (!solicitanteId) return [];
  return inMemorySolicitudes
    .filter((s) => {
      if (Number(s.solicitanteId) !== Number(solicitanteId)) return false;
      if (excluirSolicitudId != null) {
        if (s.id != null && String(s.id) === String(excluirSolicitudId)) return false;
        if (s.codigo && String(s.codigo) === String(excluirSolicitudId)) return false;
      }
      return true;
    })
    .map((s) => ({
      id: s.id,
      codigo: s.codigo,
      titulo: s.titulo,
      estado: s.estado,
      estadoApi: s.estadoApi || (s.estado === 'Cerrada' ? 'CERRADA' : 'REGISTRADA'),
      fecha: s.fecha,
      solicitanteId: s.solicitanteId,
      solicitante: s.solicitante,
    }));
}

export function addSolicitudMock(nueva) {
  const registroDate = nueva.fechaRegistro || new Date();
  const conFecha = {
    ...nueva,
    fechaRegistro: registroDate,
    fecha: nueva.fecha || formatearFechaVisual(registroDate),
  };
  inMemorySolicitudes = [conFecha, ...inMemorySolicitudes];
  return conFecha;
}

export function updateSolicitudEstado(codigo, nuevoEstado, datosExtra = {}) {
  inMemorySolicitudes = inMemorySolicitudes.map((s) => {
    if (s.codigo !== codigo) return s;
    return {
      ...s,
      estado: nuevoEstado,
      ...datosExtra,
    };
  });
  return inMemorySolicitudes.find((s) => s.codigo === codigo);
}

export function addComentarioSolicitud(codigo, comentario) {
  inMemorySolicitudes = inMemorySolicitudes.map((s) => {
    if (s.codigo !== codigo) return s;
    return {
      ...s,
      comentarios: [...(s.comentarios || []), comentario],
    };
  });
  return inMemorySolicitudes.find((s) => s.codigo === codigo);
}

export function addEvidenciasSolicitud(codigo, nuevasEvidencias = []) {
  inMemorySolicitudes = inMemorySolicitudes.map((s) => {
    if (s.codigo !== codigo) return s;
    return {
      ...s,
      evidencias: [...(s.evidencias || []), ...nuevasEvidencias],
    };
  });
  return inMemorySolicitudes.find((s) => s.codigo === codigo);
}

export function getSolicitudesVencidas() {
  return inMemorySolicitudes.filter((s) => esVencida(s));
}

export function generateNextCodigo() {
  const code = `SIG-${String(nextIdCounter).padStart(5, '0')}`;
  nextIdCounter += 1;
  return code;
}

export const ESTADO_NIVEL = {
  Pendiente: 0,
  Registrada: 0,
  'En evaluación': 1,
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
