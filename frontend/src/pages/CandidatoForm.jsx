import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearCandidato, obtenerCandidato, actualizarCandidato } from '../services/candidatos';
import { listarCargos } from '../services/cargos';

const CandidatoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    cargo_id: ''
  });

  useEffect(() => {
    cargarCargos();
    if (id) {
      cargarCandidato();
    }
  }, [id]);

  const cargarCargos = async () => {
    try {
      const response = await listarCargos();
      setCargos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar cargos:', err);
    }
  };

  const cargarCandidato = async () => {
    try {
      setLoading(true);
      const response = await obtenerCandidato(id);
      setFormData(response.data);
    } catch (err) {
      setError('Error al cargar el candidato');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        await actualizarCandidato(id, formData);
        alert('Candidato actualizado correctamente');
      } else {
        await crearCandidato(formData);
        alert('Candidato creado correctamente');
      }
      navigate('/candidatos');
    } catch (err) {
      setError('Ocurrió un error al guardar el candidato');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) return <div className="container mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? 'Editar Candidato' : 'Nuevo Candidato'}</h2>
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
          <label className="form-label">Apellido *</label>
          <input
            type="text"
            className="form-control"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Teléfono</label>
          <input
            type="text"
            className="form-control"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de Nacimiento</label>
          <input
            type="date"
            className="form-control"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Género</label>
          <select className="form-control" name="genero" value={formData.genero} onChange={handleChange}>
            <option value="">Seleccione...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Cargo</label>
          <select className="form-control" name="cargo_id" value={formData.cargo_id} onChange={handleChange}>
            <option value="">-- Seleccione un cargo --</option>
            {cargos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/candidatos')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default CandidatoForm;