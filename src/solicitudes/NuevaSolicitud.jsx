import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIAS, EVIDENCIA } from '../config/constants';
import { addSolicitudMock, generateNextCodigo } from '../mocks/solicitudes';
import PageHead from '../components/PageHead';
import Button from '../components/Button';
import FormField from '../components/FormField';
import FormSelect from '../components/FormSelect';
import Icon from '../components/Icon';
import './solicitudes.css';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categoria, setCategoria] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [files, setFiles] = useState([]);
  const [tried, setTried] = useState(false);
  const [fileError, setFileError] = useState('');
  const [createdCode, setCreatedCode] = useState(null);

  const errors = {
    categoria: categoria ? '' : 'Selecciona una categoría',
    ubicacion: ubicacion.trim() ? '' : 'Este campo es obligatorio: indica dónde ocurre el problema',
    descripcion:
      descripcion.trim().length >= 10
        ? ''
        : 'Describe el problema con al menos 10 caracteres',
  };

  const missingCount = Object.values(errors).filter(Boolean).length;
  const getFieldError = (key) => (tried ? errors[key] : '');

  const handleFileChange = (e) => {
    setFileError('');
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];

    for (const f of selectedFiles) {
      if (!EVIDENCIA.tipos.includes(f.type)) {
        setFileError(`Formato no permitido: ${f.name}. Solo se aceptan PNG, JPG o PDF.`);
        continue;
      }
      if (f.size > EVIDENCIA.maxMB * 1024 * 1024) {
        setFileError(`El archivo ${f.name} supera el límite de ${EVIDENCIA.maxMB} MB.`);
        continue;
      }
      validFiles.push(f);
    }

    const updated = [...files, ...validFiles].slice(0, EVIDENCIA.maxArchivos);
    setFiles(updated);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTried(true);

    if (missingCount === 0) {
      const nextCode = generateNextCodigo();
      const nueva = {
        codigo: nextCode,
        titulo:
          descripcion.trim().length > 54
            ? descripcion.trim().slice(0, 54).trimEnd() + '…'
            : descripcion.trim(),
        categoria,
        estado: 'Pendiente',
        prioridad: 'Media', // La prioridad la asigna el Supervisor
        fecha: '17 oct, 2026',
        ubicacion: ubicacion.trim(),
        responsable: 'Sin asignar',
        rolResponsable: '',
        descripcion: descripcion.trim(),
        evidencias: files.map((f) => ({
          nombre: f.name,
          tamano: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        })),
      };

      addSolicitudMock(nueva);
      setCreatedCode(nextCode);
    }
  };

  const handleReset = () => {
    setCreatedCode(null);
    setCategoria('');
    setUbicacion('');
    setDescripcion('');
    setFiles([]);
    setTried(false);
    setFileError('');
  };

  if (createdCode) {
    return (
      <div className="narrow-page">
        <PageHead
          title="Registrar solicitud"
          text="Tu solicitud ya fue enviada al equipo de atención."
        />

        <div className="message success" role="status">
          <Icon name="check" />
          <div>
            <strong>Solicitud registrada correctamente. Código: {createdCode}</strong>
          </div>
        </div>

        <div className="success-state">
          <div className="success-circle">
            <Icon name="check" size={32} />
          </div>
          <div className="code-chip">{createdCode}</div>
          <h2>Ya estamos en ello</h2>
          <p>
            Recibirás una notificación cuando la solicitud sea asignada a un responsable. Puedes
            seguir su avance desde Mis solicitudes.
          </p>
          <div className="row">
            <Button onClick={() => navigate(`/solicitudes/${createdCode}`)}>
              Ver solicitud
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Registrar otra
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate('/solicitante/solicitudes')}
      >
        <Icon name="arrow" size={18} /> Volver a mis solicitudes
      </button>

      <PageHead
        title="Registrar solicitud"
        text="Completa la información para que podamos derivarla al equipo adecuado."
      />

      {tried && missingCount > 0 && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>
              Falta {missingCount === 1 ? '1 campo obligatorio' : `${missingCount} campos obligatorios`}
            </strong>
            <p>Revisa los campos marcados en rojo antes de registrar.</p>
          </div>
        </div>
      )}

      {fileError && (
        <div className="message error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>Error en archivo adjunto</strong>
            <p>{fileError}</p>
          </div>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <div className="form-section-head">
            <span>1</span>
            <div>
              <h2>¿Qué necesitas?</h2>
              <p>Elige la categoría y describe lo que ocurre.</p>
            </div>
          </div>
          <FormSelect
            label="Categoría"
            value={categoria}
            onChange={setCategoria}
            options={CATEGORIAS}
            placeholder="Selecciona una categoría"
            error={getFieldError('categoria')}
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
            <Button
              variant="secondary"
              onClick={() => navigate('/solicitante/solicitudes')}
            >
              Cancelar
            </Button>
            <Button type="submit">Registrar solicitud</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
