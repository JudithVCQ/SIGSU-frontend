# SIGSU · Frontend
React + Vite. Repositorio independiente del backend (Spring Boot). Referencia: documentos SIGSU (SRS, Arquitectura, UX/UI).

## Inicio rápido
```bash
npm install
npm run dev        # http://localhost:5173
```

## Estructura
| Carpeta | Responsabilidad |
|---|---|
| `src/auth` | Login, registro, sesión (`AuthContext`) |
| `src/solicitudes` | Registro, consulta, detalle, bandeja, clasificación, asignación, atención y cierre |
| `src/dashboard` | Indicadores de supervisión |
| `src/administracion` | Usuarios y catálogos |
| `src/components` | Reutilizables (`AppLayout`, `Badge`, `PageStub`) |
| `src/services` | Consumo de la API REST (pendiente: se creará cuando exista el backend) |
| `src/hooks` | Estado reutilizable (`useAuth`) |
| `src/routes` | Rutas, protección por rol y navegación por rol |
| `src/config` | Constantes: roles, estados, prioridades |
| `src/styles` | Tokens de diseño (paleta UX/UI) y estilos globales |
