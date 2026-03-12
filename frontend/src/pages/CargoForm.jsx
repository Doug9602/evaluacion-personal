import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearCargo, obtenerCargo, actualizarCargo } from '../services/cargos';

const CargoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    departamento: ''
  });

  useEffect(() => {
    if (id) {
      const cargarCargo = async () => {
        try {
          setLoading(true);
          const response = await obtenerCargo(id);
          setFormData(response.data);
        } catch (err) {
          setError('Error al cargar los datos del cargo');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      cargarCargo();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await actualizarCargo(id, formData);
        alert('Cargo actualizado correctamente');
      } else {
        await crearCargo(formData);
        alert('Cargo creado correctamente');
      }
      navigate('/cargos');
    } catch (err) {
      setError('Ocurrió un error al guardar el cargo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) return <div className="container mt-4">Cargando datos del cargo...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? 'Editar Cargo' : 'Nuevo Cargo'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            className="form-control"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Departamento</label>
          <input
            type="text"
            className="form-control"
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/cargos')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default CargoForm;