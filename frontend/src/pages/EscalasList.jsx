import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarEscalas, eliminarEscala } from '../services/escalas';
import { listarTests } from '../services/tests';

const EscalasList = () => {
  const navigate = useNavigate();
  const [escalas, setEscalas] = useState([]);
  const [tests, setTests] = useState([]);
  const [testSeleccionado, setTestSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTests();
  }, []);

  useEffect(() => {
    if (testSeleccionado) {
      cargarEscalas(testSeleccionado);
    } else {
      setEscalas([]);
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

  const cargarEscalas = async (testId) => {
    setLoading(true);
    try {
      const response = await listarEscalas(testId);
      setEscalas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar escalas:', error);
      setEscalas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestChange = (e) => {
    setTestSeleccionado(e.target.value);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta escala?')) {
      try {
        await eliminarEscala(id);
        if (testSeleccionado) {
          cargarEscalas(testSeleccionado);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  if (loading && testSeleccionado) return <div className="container mt-4">Cargando escalas...</div>;

  return (
    <div className="container mt-4">
      <h2>Lista de Escalas</h2>

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
        <Link to="/escalas/nuevo" className="btn btn-primary">
          Nueva Escala
        </Link>
      </div>

      {!testSeleccionado ? (
        <div className="alert alert-info">Seleccione un test para ver sus escalas.</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Test</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {escalas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No hay escalas para este test. Puedes crear una con el botón "Nueva Escala".
                </td>
              </tr>
            ) : (
              escalas.map(e => {
                // Buscar el nombre del test (aunque ya sabemos que todas pertenecen al test seleccionado)
                const testNombre = tests.find(t => t.id === e.test_id)?.nombre || `ID: ${e.test_id}`;
                return (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.nombre}</td>
                    <td>{e.descripcion || '-'}</td>
                    <td>{testNombre}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => navigate(`/escalas/editar/${e.id}`)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleEliminar(e.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EscalasList;