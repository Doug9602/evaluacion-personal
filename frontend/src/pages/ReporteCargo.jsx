import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReporteCargo = () => {
  const { cargoId } = useParams();
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [cargo, setCargo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener información del cargo
        const cargoRes = await axios.get(`/api/cargos/${cargoId}`);
        setCargo(cargoRes.data);

        // Obtener candidatos de ese cargo
        const candidatosRes = await axios.get(`/api/candidatos?cargo_id=${cargoId}`);
        setCandidatos(candidatosRes.data);
      } catch (err) {
        setError('Error al cargar el reporte');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [cargoId]);

  const handleVerEvaluaciones = (candidatoId) => {
    navigate(`/evaluaciones-candidato/${candidatoId}`);
  };

  if (loading) return <div className="container mt-4">Cargando reporte...</div>;
  if (error) return (
    <div className="container mt-4">
      <div className="alert alert-danger">{error}</div>
      <Link to="/cargos" className="btn btn-secondary">Volver a cargos</Link>
    </div>
  );
  if (!cargo) return null;

  return (
    <div className="container mt-4">
      <h2>Reporte de {cargo.nombre}</h2>

      <h4 className="mt-4">Candidatos de este cargo</h4>
      {candidatos.length === 0 ? (
        <div className="alert alert-info">No hay candidatos asignados a este cargo.</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.apellido}</td>
                <td>{c.email}</td>
                <td>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleVerEvaluaciones(c.id)}
                  >
                    Ver evaluaciones
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to="/cargos" className="btn btn-secondary mt-3">
        Volver a cargos
      </Link>
    </div>
  );
};

export default ReporteCargo;