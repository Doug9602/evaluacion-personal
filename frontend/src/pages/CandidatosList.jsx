import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarCandidatos, eliminarCandidato } from '../services/candidatos';
import { listarCargos } from '../services/cargos';

const CandidatosList = () => {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [candidatosRes, cargosRes] = await Promise.all([
        listarCandidatos(),
        listarCargos()
      ]);
      setCandidatos(Array.isArray(candidatosRes.data) ? candidatosRes.data : []);
      setCargos(Array.isArray(cargosRes.data) ? cargosRes.data : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este candidato?')) {
      try {
        await eliminarCandidato(id);
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  const getNombreCargo = (cargoId) => {
    if (!cargoId) return '-';
    const cargo = cargos.find(c => c.id === cargoId);
    return cargo ? cargo.nombre : `ID: ${cargoId}`;
  };

  if (loading) return <div className="container mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>Lista de Candidatos</h2>
      <div className="mb-3">
        <Link to="/candidatos/nuevo" className="btn btn-primary">Nuevo Candidato</Link>
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Cargo</th>
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
              <td>{c.telefono}</td>
              <td>{getNombreCargo(c.cargo_id)}</td>
              <td>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => navigate(`/candidatos/editar/${c.id}`)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm me-2"
                  onClick={() => handleEliminar(c.id)}
                >
                  Eliminar
                </button>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => navigate(`/evaluaciones-candidato/${c.id}`)}
                >
                  Ver evaluaciones
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidatosList;