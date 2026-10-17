export const ROLES = {
  SOLICITANTE: 'SOLICITANTE',
  TECNICO: 'TECNICO',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMINISTRADOR',
};

export const ROLE_LABEL = {
  SOLICITANTE: 'Solicitante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMINISTRADOR: 'Administrador',
};

export const ROLE_HOME = {
  SOLICITANTE: '/solicitante',
  TECNICO: '/tecnico',
  SUPERVISOR: '/supervisor',
  ADMINISTRADOR: '/admin/usuarios',
};

// Estados y prioridades (UX/UI sección 8). El texto siempre acompaña al color.
export const ESTADOS = ['Pendiente', 'Asignada', 'En atención', 'Resuelta', 'Cerrada'];
export const PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const CATEGORIAS = ['Mantenimiento', 'Soporte informático', 'Infraestructura', 'Trámites'];

// Dominio de correo institucional (supuesto del mockup, pendiente de confirmar por la universidad)
export const EMAIL_DOMAIN = '@universidad.edu';

// Supuestos de evidencias: confirmar con backend (RF-007)
export const EVIDENCIA = {
  maxMB: 5,
  maxArchivos: 3,
  tipos: ['image/jpeg', 'image/png', 'application/pdf'],
  formatosTexto: 'PNG, JPG o PDF · Máximo 3 archivos de 5 MB',
};
