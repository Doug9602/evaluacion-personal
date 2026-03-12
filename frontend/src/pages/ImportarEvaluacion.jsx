import React, { useState } from 'react';
import axios from 'axios';

const ImportarEvaluacion = () => {
  const [file, setFile] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResultado(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const response = await axios.post('/api/importar-respuestas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultado(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar el archivo');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Importar evaluación desde archivo JSON</h2>
      <p className="text-muted">
        Selecciona el archivo <code>respuestas.json</code> que te envió el candidato.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="fileInput" className="form-label">Archivo JSON</label>
          <input
            type="file"
            className="form-control"
            id="fileInput"
            accept=".json"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!file || cargando}>
          {cargando ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}

      {resultado && (
        <div className="alert alert-success mt-3">
          <p>Evaluación importada correctamente.</p>
          <p><strong>ID de respuesta:</strong> {resultado.id}</p>
          <p><strong>Candidato ID:</strong> {resultado.candidato_id}</p>
          <p><strong>Test ID:</strong> {resultado.test_id}</p>
          <p><strong>Fecha:</strong> {resultado.fecha}</p>
        </div>
      )}
    </div>
  );
};

export default ImportarEvaluacion;