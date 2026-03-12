import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarTests, eliminarTest } from '../services/tests';

const TestsList = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTests();
  }, []);

  const cargarTests = async () => {
    try {
      const response = await listarTests();
      setTests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este test?')) {
      try {
        await eliminarTest(id);
        cargarTests();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  if (loading) return <div className="container mt-4">Cargando tests...</div>;

  return (
    <div className="container mt-4">
      <h2>Lista de Tests</h2>
      <div className="mb-3">
        <Link to="/tests/nuevo" className="btn btn-primary">Nuevo Test</Link>
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Instrucciones</th>
            <th>Tiempo (min)</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tests.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.nombre}</td>
              <td>{t.tipo}</td>
              <td>{t.instrucciones || '-'}</td>
              <td>{t.tiempo_limite || '-'}</td>
              <td>{t.activo ? 'Sí' : 'No'}</td>
              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => navigate(`/tests/editar/${t.id}`)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm me-2"
                  onClick={() => handleEliminar(t.id)}
                >
                  Eliminar
                </button>
                <Link
                  to={`/preguntas?test_id=${t.id}`}
                  className="btn btn-info btn-sm"
                >
                  Ver preguntas
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TestsList;