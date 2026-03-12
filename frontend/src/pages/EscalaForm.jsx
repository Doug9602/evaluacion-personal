import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearEscala, obtenerEscala, actualizarEscala } from '../services/escalas';
import { listarTests } from '../services/tests';

const EscalaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    test_id: '',
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarTests();
    if (id) {
      cargarEscala();
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

  const cargarEscala = async () => {
    try {
      setLoading(true);
      const response = await obtenerEscala(id);
      setFormData(response.data);
    } catch (err) {
      setError('Error al cargar la escala');
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
        await actualizarEscala(id, formData);
        alert('Escala actualizada correctamente');
      } else {
        await crearEscala(formData);
        alert('Escala creada correctamente');
      }
      navigate('/escalas');
    } catch (err) {
      setError('Ocurrió un error al guardar la escala');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) return <div className="container mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? 'Editar Escala' : 'Nueva Escala'}</h2>
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
          >
            <option value="">Seleccione un test</option>
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
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
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/escalas')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default EscalaForm;