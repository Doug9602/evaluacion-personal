import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { listarPreguntas, eliminarPregunta } from '../services/preguntas';
import { listarTests } from '../services/tests';

const PreguntasList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [preguntas, setPreguntas] = useState([]);
  const [tests, setTests] = useState([]);
  const [testSeleccionado, setTestSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);

  // Efecto para cargar la lista de tests y leer el test_id de la URL al montar
  useEffect(() => {
    cargarTests();

    // Leer test_id de los query parameters
    const params = new URLSearchParams(location.search);
    const testId = params.get('test_id');
    if (testId) {
      setTestSeleccionado(testId);
    }
  }, []); // Solo al montar, sin dependencias

  // Efecto para cargar preguntas cuando cambia testSeleccionado
  useEffect(() => {
    if (testSeleccionado) {
      cargarPreguntas(testSeleccionado);
    } else {
      setPreguntas([]);
      setLoading(false);
    }
  }, [testSeleccionado]);

  const cargarTests = async () => {
    try {
      const response = await listarTests();
      setTests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar tests:', error);
    }
  };

  const cargarPreguntas = async (testId) => {
    setLoading(true);
    try {
      const response = await listarPreguntas(testId);
      setPreguntas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      setPreguntas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      try {
        await eliminarPregunta(id);
        cargarPreguntas(testSeleccionado);
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  const handleTestChange = (e) => {
    const nuevoTestId = e.target.value;
    setTestSeleccionado(nuevoTestId);
    // Actualizar la URL para reflejar el nuevo test seleccionado
    navigate(`/preguntas${nuevoTestId ? `?test_id=${nuevoTestId}` : ''}`, { replace: true });
  };

  if (loading && testSeleccionado) {
    return <div className="container mt-4">Cargando preguntas...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Preguntas</h2>

      {/* Selector de tests con ancho automático */}
      <div className="d-flex align-items-center mb-3">
        <select
          className="form-select me-2"
          style={{ width: 'auto' }}
          value={testSeleccionado}
          onChange={handleTestChange}
        >
          <option value="">Seleccione un test</option>
          {tests.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>

        {/* Botón Nueva Pregunta: incluye test_id en la URL si hay test seleccionado */}
        <Link
          to={testSeleccionado ? `/preguntas/nuevo?test_id=${testSeleccionado}` : "/preguntas/nuevo"}
          className="btn btn-primary"
        >
          Nueva Pregunta
        </Link>
      </div>

      {/* Tabla de preguntas (solo si hay un test seleccionado) */}
      {testSeleccionado && (
        <table className="table table-striped" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>ID</th>
              <th style={{ width: '50%' }}>Texto</th>
              <th style={{ width: '15%' }}>Tipo</th>
              <th style={{ width: '10%' }}>Orden</th>
              <th style={{ width: '20%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {preguntas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No hay preguntas para este test.
                </td>
              </tr>
            ) : (
              preguntas.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td style={{ whiteSpace: 'normal', wordWrap: 'break-word', wordBreak: 'break-word' }}>
                    {p.texto}
                  </td>
                  <td>{p.tipo_pregunta}</td>
                  <td>{p.orden}</td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => navigate(`/preguntas/editar/${p.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleEliminar(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PreguntasList;