import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVIDENCIA } from '../config/constants';
import { addSolicitudMock, generateNextCodigo } from '../mocks/solicitudes';
import { crearSolicitud, subirEvidencia } from '../services/solicitudes.js';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Icon from '../components/Icon';
import './solicitudes.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export default function NuevaSolicitud() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [titulo,      setTitulo]      = useState('');
  const [ubicacion,   setUbicacion]   = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [files,       setFiles]       = useState([]);
  const [tried,       setTried]       = useState(false);
  const [fileError,   setFileError]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState('');
  const [createdCode, setCreatedCode] = useState(null);
  // Evidencias que fallaron en el envío (para reintentar individualmente)
  const [failedFiles, setFailedFiles] = useState([]);
  const [solicitudId, setSolicitudId] = useState(null);

  const errors = {
    titulo:      titulo.trim().length < 3        ? 'Ingresa un título para la solicitud (mínimo 3 caracteres)' : '',
    ubicacion:   !ubicacion.trim()               ? 'Este campo es obligatorio: indica dónde ocurre el problema' : '',
    descripcion: descripcion.trim().length < 10  ? 'Describe el problema con al menos 10 caracteres' : '',
  };
  const missingCount  = Object.values(errors).filter(Boolean).length;
  const getFieldError = (k) => (tried ? errors[k] : '');

  const handleFileChange = (e) => {
    setFileError('');
    const selected = Array.from(e.target.files || []);
    const valid    = [];
    for (const f of selected) {
      if (!EVIDENCIA.tipos.includes(f.type)) {
        setFileError(`Formato no permitido: ${f.name}. Solo se aceptan PNG, JPG o PDF.`);
        continue;
      }
      if (f.size > EVIDENCIA.maxMB * 1024 * 1024) {
        setFileError(`El archivo "${f.name}" supera el límite de ${EVIDENCIA.maxMB} MB.`);
        continue;
      }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid].slice(0, EVIDENCIA.maxArchivos));
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTried(true);
    setApiError('');
    if (missingCount > 0) return;

    if (USE_MOCKS) {
      const nextCode = generateNextCodigo();
      addSolicitudMock({
        codigo: nextCode,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ubicacion: ubicacion.trim(),
        estado: 'Registrada',
        prioridad: '',
        fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        responsable: 'Sin asignar',
        evidencias: files.map(f => ({ nombre: f.name, tamano: `${(f.size / 1024 / 1024).toFixed(1)} MB` })),
      });
      setCreatedCode(nextCode);
      return;
    }

    setLoading(true);
    try {
      const solicitud = await crearSolicitud({
        titulo:      titulo.trim(),
        descripcion: descripcion.trim(),
        ubicacion:   ubicacion.trim(),
      });

      setSolicitudId(solicitud.id);
      setCreatedCode(solicitud.codigo);

      // Subir evidencias una a una; registrar las fallidas
      const failed = [];
      for (const file of files) {
        try {
          await subirEvidencia(solicitud.id, file);
        } catch (uploadErr) {
          failed.push({ file, error: uploadErr.message ?? 'Error al subir el archivo.' });
        }
      }
      setFailedFiles(failed);
    } catch (err) {
      setApiError(err.message ?? 'No se pudo registrar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFile = async (idx) => {
    const { file } = failedFiles[idx];
    try {
      await subirEvidencia(solicitudId, file);
      setFailedFiles(prev => prev.filter((_, i) => i !== idx));
    } catch (uploadErr) {
      setFailedFiles(prev =>
        prev.map((item, i) => i === idx ? { ...item, error: uploadErr.message } : item)
      );
    }
  };

  const handleReset = () => {
    setCreatedCode(null); setSolicitudId(null); setTitulo(''); setUbicacion('');
    setDescripcion(''); setFiles([]); setTried(false); setFileError('');
    setApiError(''); setFailedFiles([]);
  };

  if (createdCode) {
    return (
      <div className="narrow-page">
        <PageHead title="Registrar solicitud" text="Tu solicitud ya fue enviada al equipo de atención." />
        <div className="message success" role="status">
          <Icon name="check" />
          <div><strong>Solicitud registrada correctamente. Código: {createdCode}</strong></div>
        </div>

        {failedFiles.length > 0 && (
          <div className="message error" role="alert" style={{ marginTop: '12px' }}>
            <Icon name="alert" />
            <div>
              <strong>Algunos archivos no se subieron</strong>
              {failedFiles.map((item, idx) => (
                <div key={idx} style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>{item.file.name}: {item.error}</span>
                  <button
                    type="button"
                    className="auth-dev-btn"
                    style={{ fontSize: '13px', padding: '4px 8px' }}
                    onClick={() => handleRetryFile(idx)}
                  >
                    Reintentar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="success-state">
          <div className="success-circle"><Icon name="check" size={32} /></div>
          <div className="code-chip">{createdCode}</div>
          <h2>Ya estamos en ello</h2>
          <p>Puedes seguir el avance desde Mis solicitudes.</p>
          <div className="row">
            <Button onClick={() => navigate(`/solicitudes/${createdCode}`)}>Ver solicitud</Button>
            <Button variant="secondary" onClick={handleReset}>Registrar otra</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow-page">
      <button type="button" className="back-link" onClick={() => navigate('/solicitante/solicitudes')}>
        <Icon name="arrow" size={18} /> Volver a mis solicitudes
      </button>

      <PageHead title="Registrar solicitud" text="Completa la información para derivarla al equipo adecuado." />

      {tried && missingCount > 0 && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>Falta {missingCount === 1 ? '1 campo obligatorio' : `${missingCount} campos obligatorios`}</strong>
            <p>Revisa los campos marcados en rojo antes de registrar.</p>
          </div>
        </div>
      )}
      {fileError && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>Error en archivo adjunto</strong><p>{fileError}</p></div>
        </div>
      )}
      {apiError && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div><strong>No se pudo registrar la solicitud</strong><p>{apiError}</p></div>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <div className="form-section-head">
            <span>1</span>
            <div>
              <h2>¿Qué necesitas?</h2>
              <p>Escribe un título breve y describe el problema.</p>
            </div>
          </div>

          <FormField
            label="Título"
            value={titulo}
            onChange={setTitulo}
            placeholder="Ej. Proyector sin señal en Aula 205"
            error={getFieldError('titulo')}
            hint={`${titulo.length}/150 caracteres`}
            required
          />
          <FormField
            label="Ubicación"
            value={ubicacion}
            onChange={setUbicacion}
            placeholder="Ej. Pabellón A - Aula 205"
            error={getFieldError('ubicacion')}
            required
          />
          <FormField
            label="Descripción"
            textarea
            value={descripcion}
            onChange={setDescripcion}
            placeholder="Describe el problema, desde cuándo ocurre y cualquier detalle útil"
            error={getFieldError('descripcion')}
            required
          />
        </div>

        <div className="form-section">
          <div className="form-section-head">
            <span>2</span>
            <div>
              <h2>Evidencia</h2>
              <p>Una foto o captura ayuda a atender más rápido. Es opcional.</p>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Evidencia (opcional)</span>
            <button
              type="button"
              className="upload large"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="upload" size={24} />
              <span>
                <strong>Arrastra archivos aquí o selecciona desde tu equipo</strong>
                <small>{EVIDENCIA.formatosTexto}</small>
              </span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept={EVIDENCIA.tipos.join(',')}
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file, idx) => (
                <li key={`${file.name}-${idx}`}>
                  <Icon name="clip" size={16} />
                  <span>{file.name}</span>
                  <small>{(file.size / 1024 / 1024).toFixed(1)} MB</small>
                  <button
                    type="button"
                    className="row-action"
                    aria-label={`Quitar ${file.name}`}
                    onClick={() => handleRemoveFile(idx)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-footer">
          <p>Los campos marcados con * son obligatorios.</p>
          <div className="row">
            <Button variant="secondary" onClick={() => navigate('/solicitante/solicitudes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrar solicitud'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
