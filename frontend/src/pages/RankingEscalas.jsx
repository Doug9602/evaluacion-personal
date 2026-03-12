import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { listarTests } from '../services/tests';
import { listarEscalas } from '../services/escalas';

const RankingEscalas = () => {
  const [tests, setTests] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [testSeleccionado, setTestSeleccionado] = useState('');
  const [escalasSeleccionadas, setEscalasSeleccionadas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sinResultados, setSinResultados] = useState(false);

  useEffect(() => {
    cargarTests();
  }, []);

  const cargarTests = async () => {
    try {
      const response = await listarTests();
      setTests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar tests:', err);
    }
  };

  const cargarEscalas = async (testId) => {
    try {
      const response = await listarEscalas(testId);
      setEscalas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar escalas:', err);
    }
  };

  const handleTestChange = (e) => {
    const testId = e.target.value;
    setTestSeleccionado(testId);
    setEscalasSeleccionadas([]);
    setRanking([]);
    setSinResultados(false);
    if (testId) {
      cargarEscalas(testId);
    } else {
      setEscalas([]);
    }
  };

  const handleEscalaChange = (escalaId) => {
    setEscalasSeleccionadas(prev =>
      prev.includes(escalaId)
        ? prev.filter(id => id !== escalaId)
        : [...prev, escalaId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testSeleccionado || escalasSeleccionadas.length === 0) {
      setError('Debe seleccionar un test y al menos una escala.');
      return;
    }
    setLoading(true);
    setError(null);
    setSinResultados(false);
    try {
      const params = new URLSearchParams();
      params.append('escalas', escalasSeleccionadas.join(','));
      const response = await axios.get(`/api/resultados/ranking/${testSeleccionado}?${params.toString()}`);
      setRanking(response.data);
      if (response.data.length === 0) {
        setSinResultados(true);
      }
    } catch (err) {
      setError('Error al cargar el ranking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Ranking por Escalas</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Test</label>
          <select
            className="form-control"
            value={testSeleccionado}
            onChange={handleTestChange}
            required
          >
            <option value="">Seleccione un test</option>
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {testSeleccionado && (
          <div className="mb-3">
            <label className="form-label">Escalas</label>
            <div className="border p-3 rounded">
              {escalas.length === 0 ? (
                <p className="text-muted">No hay escalas para este test. Crea algunas en el módulo Escalas.</p>
              ) : (
                escalas.map(e => (
                  <div key={e.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value={e.id}
                      id={`escala-${e.id}`}
                      checked={escalasSeleccionadas.includes(e.id)}
                      onChange={() => handleEscalaChange(e.id)}
                    />
                    <label className="form-check-label" htmlFor={`escala-${e.id}`}>
                      {e.nombre}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading || !testSeleccionado || escalasSeleccionadas.length === 0}>
          {loading ? 'Cargando...' : 'Ver Ranking'}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {sinResultados && (
        <div className="alert alert-info mt-4">
          No hay candidatos que hayan sido evaluados en las escalas seleccionadas para este test.
        </div>
      )}

      {ranking.length > 0 && (
        <div className="mt-4">
          <h3>Resultados</h3>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Puntuación</th>
                <th>Máximo</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(c => (
                <tr key={c.candidato_id}>
                  <td>{c.nombre} {c.apellido}</td>
                  <td>{c.puntuacion_total}</td>
                  <td>{c.maximo_total}</td>
                  <td>{c.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingEscalas;