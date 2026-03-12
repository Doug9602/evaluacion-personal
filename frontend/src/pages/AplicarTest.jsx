import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCandidatos } from '../services/candidatos';
import { listarTests } from '../services/tests';
import EnviarFormularioModal from '../components/EnviarFormularioModal';

const AplicarTest = () => {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [tests, setTests] = useState([]);
  const [candidatoId, setCandidatoId] = useState('');
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Estado para el candidato seleccionado (completo)
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [candidatosRes, testsRes] = await Promise.all([
          listarCandidatos(),
          listarTests()
        ]);
        setCandidatos(Array.isArray(candidatosRes.data) ? candidatosRes.data : []);
        setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const handleCandidatoChange = (e) => {
    const id = e.target.value;
    setCandidatoId(id);
    const candidato = candidatos.find(c => c.id === parseInt(id));
    setCandidatoSeleccionado(candidato || null);
  };

  const handleTestChange = (e) => {
    setTestId(e.target.value);
  };

  const handleIniciarTest = (e) => {
    e.preventDefault();
    if (candidatoId && testId) {
      navigate(`/responder-test/${candidatoId}/${testId}`);
    }
  };

  const handleEnviarPorCorreo = () => {
    if (!candidatoSeleccionado) {
      alert('Seleccione un candidato primero');
      return;
    }
    setShowModal(true);
  };

  if (loading) return <div className="container mt-4">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>Aplicar Test</h2>
      <form onSubmit={handleIniciarTest}>
        <div className="mb-3">
          <label className="form-label">Seleccione un candidato</label>
          <select
            className="form-control"
            value={candidatoId}
            onChange={handleCandidatoChange}
            required
          >
            <option value="">-- Seleccione --</option>
            {candidatos.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido} ({c.email})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Seleccione un test</label>
          <select
            className="form-control"
            value={testId}
            onChange={handleTestChange}
            required
          >
            <option value="">-- Seleccione --</option>
            {tests.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.tipo})
              </option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={!candidatoId || !testId}>
            Iniciar Test
          </button>
          <button
            type="button"
            className="btn btn-success"
            disabled={!candidatoId}
            onClick={handleEnviarPorCorreo}
          >
            Enviar por correo
          </button>
        </div>
      </form>

      {showModal && candidatoSeleccionado && (
        <EnviarFormularioModal
          candidatoId={candidatoId}
          testId={testId}
          candidatoNombre={`${candidatoSeleccionado.nombre} ${candidatoSeleccionado.apellido}`}
          emailCandidato={candidatoSeleccionado.email}
          onClose={() => setShowModal(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default AplicarTest;