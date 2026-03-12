import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EvaluacionesCandidato = () => {
  const { candidatoId } = useParams();
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidato, setCandidato] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [candidatoId]);

  const cargarDatos = async () => {
    try {
      const candidatoRes = await axios.get(`/api/candidatos/${candidatoId}`);
      setCandidato(candidatoRes.data);

      const respRes = await axios.get(`/api/respuestas/candidato/${candidatoId}`);
      setEvaluaciones(respRes.data);
    } catch (err) {
      setError('Error al cargar las evaluaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (respuestaId) => {
    navigate(`/detalle-evaluacion/${respuestaId}`);
  };

  const handleEliminar = async (respuestaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta evaluación? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`/api/respuestas/${respuestaId}`);
        // Recargar la lista después de eliminar
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar la evaluación:', err);
        alert('Ocurrió un error al eliminar la evaluación');
      }
    }
  };

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Evaluaciones de {candidato ? `${candidato.nombre} ${candidato.apellido}` : ''}</h2>
      {evaluaciones.length === 0 ? (
        <div className="alert alert-info">Este candidato no tiene evaluaciones registradas.</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Test</th>
              <th>Fecha</th>
              <th>N° Preguntas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map(e => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.test_nombre || `Test ID: ${e.test_id}`}</td>
                <td>{e.fecha}</td>
                <td>{e.num_preguntas}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => handleVerDetalle(e.id)}
                  >
                    Ver detalle
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleEliminar(e.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link to="/candidatos" className="btn btn-secondary">Volver a candidatos</Link>
    </div>
  );
};

export default EvaluacionesCandidato;