import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { crearPregunta, obtenerPregunta, actualizarPregunta } from '../services/preguntas';
import { listarTests } from '../services/tests';
import { listarEscalas } from '../services/escalas';

const PreguntaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testIdFromQuery = queryParams.get('test_id');

  const [tests, setTests] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [opciones, setOpciones] = useState([{ valor: 1, texto: '' }]);
  const [escalasSeleccionadas, setEscalasSeleccionadas] = useState([]);

  const [formData, setFormData] = useState({
    test_id: testIdFromQuery || '',
    texto: '',
    tipo_pregunta: '',
    orden: 1, // Solo se usa en edición
    opciones_json: ''
  });

  // Cargar tests al montar
  useEffect(() => {
    cargarTests();
  }, []);

  // Cargar escalas cuando cambie el test seleccionado
  useEffect(() => {
    if (formData.test_id) {
      cargarEscalas(formData.test_id);
    } else {
      setEscalas([]);
    }
  }, [formData.test_id]);

  // Si estamos editando, cargar la pregunta
  useEffect(() => {
    if (id) {
      cargarPregunta();
    }
  }, [id]);

  const cargarTests = async () => {
    try {
      const response = await listarTests();
      setTests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar tests:', err);
    }
  };

  const cargarEscalas = async (testId) => {
    try {
      const response = await listarEscalas(testId);
      setEscalas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar escalas:', err);
    }
  };

  const cargarPregunta = async () => {
    try {
      setLoading(true);
      const response = await obtenerPregunta(id);
      const pregunta = response.data;
      setFormData({
        test_id: pregunta.test_id,
        texto: pregunta.texto,
        tipo_pregunta: pregunta.tipo_pregunta,
        orden: pregunta.orden,
        opciones_json: pregunta.opciones_json || ''
      });
      if (pregunta.escalas && Array.isArray(pregunta.escalas)) {
        setEscalasSeleccionadas(pregunta.escalas);
      }
      // Si la pregunta es múltiple y tiene opciones, inicializar el estado opciones
      if (pregunta.tipo_pregunta === 'multiple' && pregunta.opciones_json) {
        try {
          const parsed = JSON.parse(pregunta.opciones_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOpciones(parsed);
          }
        } catch (e) {
          console.error('Error al parsear opciones:', e);
        }
      }
    } catch (err) {
      setError('Error al cargar la pregunta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cuando cambia el tipo de pregunta a 'multiple', inicializar opciones si no hay
  useEffect(() => {
    if (formData.tipo_pregunta === 'multiple') {
      if (formData.opciones_json) {
        try {
          const parsed = JSON.parse(formData.opciones_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOpciones(parsed);
          } else {
            setOpciones([{ valor: 1, texto: '' }]);
          }
        } catch {
          setOpciones([{ valor: 1, texto: '' }]);
        }
      } else {
        setOpciones([{ valor: 1, texto: '' }]);
      }
    }
  }, [formData.tipo_pregunta, formData.opciones_json]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpcionChange = (index, field, value) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index][field] = field === 'valor' ? Number(value) : value;
    setOpciones(nuevasOpciones);
  };

  const agregarOpcion = () => {
    const nuevoValor = opciones.length + 1;
    setOpciones([...opciones, { valor: nuevoValor, texto: '' }]);
  };

  const eliminarOpcion = (index) => {
    if (opciones.length > 1) {
      const nuevasOpciones = opciones.filter((_, i) => i !== index);
      nuevasOpciones.forEach((opt, idx) => { opt.valor = idx + 1; });
      setOpciones(nuevasOpciones);
    }
  };

  const handleEscalaChange = (index, field, value) => {
    const nuevasEscalas = [...escalasSeleccionadas];
    nuevasEscalas[index][field] = field === 'peso' ? Number(value) : Number(value);
    setEscalasSeleccionadas(nuevasEscalas);
  };

  const agregarEscala = () => {
    setEscalasSeleccionadas([...escalasSeleccionadas, { escala_id: '', peso: 1 }]);
  };

  const eliminarEscala = (index) => {
    setEscalasSeleccionadas(escalasSeleccionadas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dataToSend = { ...formData };

    // Si es nueva pregunta, no enviamos orden (el backend lo asigna automáticamente)
    if (!id) {
      delete dataToSend.orden;
    }

    if (formData.tipo_pregunta === 'multiple') {
      const opcionesValidas = opciones.filter(opt => opt.texto.trim() !== '');
      if (opcionesValidas.length === 0) {
        setError('Debe agregar al menos una opción válida');
        setLoading(false);
        return;
      }
      dataToSend.opciones_json = JSON.stringify(opcionesValidas);
    }

    const escalasValidas = escalasSeleccionadas.filter(es => es.escala_id && es.peso > 0);
    if (escalasValidas.length > 0) {
      dataToSend.escalas = escalasValidas;
    }

    try {
      if (id) {
        await actualizarPregunta(id, dataToSend);
        alert('Pregunta actualizada correctamente');
      } else {
        await crearPregunta(dataToSend);
        alert('Pregunta creada correctamente');
      }
      navigate('/preguntas');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ocurrió un error al guardar la pregunta');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) return <div className="container mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? 'Editar Pregunta' : 'Nueva Pregunta'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Test *</label>
          <select
            className="form-control"
            name="test_id"
            value={formData.test_id}
            onChange={handleChange}
            required
            disabled={!!testIdFromQuery}
          >
            <option value="">Seleccione un test</option>
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          {testIdFromQuery && (
            <small className="text-muted">Test preseleccionado desde la lista</small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Texto de la pregunta *</label>
          <textarea
            className="form-control"
            name="texto"
            value={formData.texto}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tipo de pregunta *</label>
          <select
            className="form-control"
            name="tipo_pregunta"
            value={formData.tipo_pregunta}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Seleccione un tipo de pregunta</option>
            <option value="likert">Likert</option>
            <option value="multiple">Opción múltiple</option>
            <option value="abierta">Abierta</option>
          </select>
          {!formData.tipo_pregunta && (
            <small className="text-muted">Elija una opción del menú desplegable</small>
          )}
        </div>

        {/* Sección de opciones múltiples con etiqueta explicativa */}
        {formData.tipo_pregunta === 'multiple' && (
          <div className="mb-3">
            <label className="form-label">Opciones de respuesta</label>
            <div className="mb-2 text-muted small">
              <strong>Valor:</strong> número que representa la contribución de esta opción a las escalas. 
              A mayor valor, mayor aporte (ej. 1=bajo, 5=alto). Puedes usar cualquier número positivo.
            </div>
            {opciones.map((opcion, index) => (
              <div key={index} className="d-flex mb-2 align-items-center">
                <input
                  type="number"
                  className="form-control me-2"
                  style={{ width: '80px' }}
                  placeholder="Valor"
                  value={opcion.valor}
                  onChange={(e) => handleOpcionChange(index, 'valor', e.target.value)}
                  required
                  title="Este número determina la contribución de esta opción a las escalas. A mayor valor, mayor aporte."
                />
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Texto de la opción"
                  value={opcion.texto}
                  onChange={(e) => handleOpcionChange(index, 'texto', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => eliminarOpcion(index)}
                  disabled={opciones.length <= 1}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={agregarOpcion}>
              Agregar opción
            </button>
          </div>
        )}

        {/* Sección de escalas */}
        <div className="mb-3">
          <label className="form-label">Escalas</label>
          {!formData.test_id ? (
            <div className="alert alert-info">Primero seleccione un test para ver sus escalas.</div>
          ) : escalas.length === 0 ? (
            <div className="alert alert-warning">
              No hay escalas creadas para este test. Puedes crearlas en el módulo Escalas.
            </div>
          ) : (
            <>
              {escalasSeleccionadas.map((es, index) => (
                <div key={index} className="d-flex mb-2 align-items-center">
                  <select
                    className="form-control me-2"
                    style={{ width: '200px' }}
                    value={es.escala_id}
                    onChange={(e) => handleEscalaChange(index, 'escala_id', e.target.value)}
                    required
                  >
                    <option value="">Seleccione escala</option>
                    {escalas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-control me-2"
                    style={{ width: '100px' }}
                    placeholder="Peso"
                    value={es.peso}
                    onChange={(e) => handleEscalaChange(index, 'peso', e.target.value)}
                    step="0.1"
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => eliminarEscala(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={agregarEscala}>
                Agregar escala
              </button>
            </>
          )}
        </div>

        {/* Campo orden: solo visible en edición y como solo lectura */}
        {id && (
          <div className="mb-3">
            <label className="form-label">Orden (número de posición)</label>
            <input
              type="number"
              className="form-control"
              name="orden"
              value={formData.orden}
              readOnly
              disabled
            />
            <small className="text-muted">Este campo se asigna automáticamente y no puede modificarse.</small>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/preguntas')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default PreguntaForm;