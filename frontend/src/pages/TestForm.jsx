import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearTest, obtenerTest, actualizarTest } from '../services/tests';

const TestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'psicométrico', // valor por defecto
    instrucciones: '',
    tiempo_limite: 0,
    activo: 1
  });

  useEffect(() => {
    if (id) {
      const cargarTest = async () => {
        try {
          setLoading(true);
          const response = await obtenerTest(id);
          setFormData(response.data);
        } catch (err) {
          setError('Error al cargar los datos del test');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      cargarTest();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Para checkbox, value es 'checked'
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: e.target.checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await actualizarTest(id, formData);
        alert('Test actualizado correctamente');
      } else {
        await crearTest(formData);
        alert('Test creado correctamente');
      }
      navigate('/tests');
    } catch (err) {
      setError('Ocurrió un error al guardar el test');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) return <div className="container mt-4">Cargando datos del test...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? 'Editar Test' : 'Nuevo Test'}</h2>
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
          <label className="form-label">Tipo *</label>
          <select
            className="form-control"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
          >
            <option value="psicométrico">Psicométrico</option>
            <option value="laboral">Laboral</option>
            <option value="conocimientos">Conocimientos</option>
            <option value="personalidad">Personalidad</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Instrucciones</label>
          <textarea
            className="form-control"
            name="instrucciones"
            value={formData.instrucciones}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Tiempo límite (minutos, 0 = sin límite)</label>
          <input
            type="number"
            className="form-control"
            name="tiempo_limite"
            value={formData.tiempo_limite}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            name="activo"
            checked={formData.activo === 1}
            onChange={handleChange}
          />
          <label className="form-check-label">Activo</label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/tests')}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default TestForm;