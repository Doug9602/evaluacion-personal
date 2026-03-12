import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarCargos, eliminarCargo } from '../services/cargos';

const CargosList = () => {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCargos();
  }, []);

  const cargarCargos = async () => {
    try {
      const response = await listarCargos();
      setCargos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar cargos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cargo?')) {
      try {
        await eliminarCargo(id);
        cargarCargos();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  if (loading) return <div className="container mt-4">Cargando cargos...</div>;

  return (
    <div className="container mt-4">
      <h2>Lista de Cargos</h2>
      <div className="mb-3">
        <Link to="/cargos/nuevo" className="btn btn-primary">Nuevo Cargo</Link>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>ID</th>
              <th style={{ width: '20%' }}>Nombre</th>
              <th style={{ width: '35%' }}>Descripción</th>
              <th style={{ width: '20%' }}>Departamento</th>
              <th style={{ width: '20%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargos.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No hay cargos registrados.
                </td>
              </tr>
            ) : (
              cargos.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.descripcion || '-'}</td>
                  <td>{c.departamento || '-'}</td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => navigate(`/cargos/editar/${c.id}`)}
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
                      className="btn btn-success btn-sm"
                      onClick={() => navigate(`/reporte-cargo/${c.id}`)}
                    >
                      Ver reporte
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CargosList;