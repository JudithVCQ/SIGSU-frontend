export const ROLES = {
  SOLICITANTE: 'SOLICITANTE',
  TECNICO:     'TECNICO',
  SUPERVISOR:  'SUPERVISOR',
  ADMIN:       'ADMINISTRADOR',
};

export const ROLE_LABEL = {
  SOLICITANTE:  'Solicitante',
  TECNICO:      'Técnico',
  SUPERVISOR:   'Supervisor',
  ADMINISTRADOR:'Administrador',
};

export const ROLE_HOME = {
  SOLICITANTE:  '/solicitante',
  TECNICO:      '/tecnico',
  SUPERVISOR:   '/supervisor',
  ADMINISTRADOR:'/admin/usuarios',
};

/**
 * Estados en el orden del ciclo de vida.
 * Incluye los 6 estados reales del backend (REGISTRADA y EN_EVALUACION
 * estaban ocultos con los mocks anteriores).
 */
export const ESTADOS = [
  'Registrada',
  'En evaluación',
  'Asignada',
  'En atención',
  'Resuelta',
  'Cerrada',
];

export const PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const CATEGORIAS  = ['Mantenimiento', 'Soporte informático', 'Infraestructura', 'Trámites'];

// Dominio de correo institucional (supuesto del mockup; confirmar con la universidad)
export const EMAIL_DOMAIN = '@universidad.edu';

// Límites de evidencias: supuesto confirmado con backend pendiente (RF-007 / diagnóstico §9.9)
export const EVIDENCIA = {
  maxMB:         5,
  maxArchivos:   3,
  tipos:         ['image/jpeg', 'image/png', 'application/pdf'],
  formatosTexto: 'PNG, JPG o PDF · Máximo 3 archivos de 5 MB',
};

// SUPUESTO de plazo por prioridad (RF-034); fechaLimite no viene en SolicitudResponse
export const VIGENCIA = {
  plazoDiasPorPrioridad: { Alta: 2, Media: 5, Baja: 10 },
  plazoDiasSinPrioridad: 2,
};
