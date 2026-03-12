import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultadosTest = () => {
  const { candidatoId, testId } = useParams();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await axios.get(`/api/resultados/${candidatoId}/${testId}`);
        setResultado(response.data);
      } catch (err) {
        setError('No se pudo cargar el resultado');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [candidatoId, testId]);

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!resultado) return null;

  const dataGrafico = resultado.detalle.map(r => ({
    pregunta: `P${r.pregunta_id}`,
    valor: r.valor
  }));

  return (
    <div className="container mt-4">
      <h2>Resultados del Test</h2>
      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Candidato ID:</strong> {resultado.candidato_id}</p>
          <p><strong>Test ID:</strong> {resultado.test_id}</p>
          <p><strong>Fecha:</strong> {resultado.fecha}</p>
          <p><strong>Puntuación total:</strong> {resultado.puntuacion_total} / {resultado.num_preguntas * 5}</p>
          <p><strong>Porcentaje:</strong> {((resultado.puntuacion_total / (resultado.num_preguntas * 5)) * 100).toFixed(2)}%</p>
        </div>
      </div>

      <h4>Detalle de respuestas</h4>
      <table className="table table-striped">
        <thead>
          <tr><th>Pregunta ID</th><th>Valor</th></tr>
        </thead>
        <tbody>
          {resultado.detalle.map((r, index) => (
            <tr key={index}>
              <td>{r.pregunta_id}</td>
              <td>{r.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Gráfico de respuestas</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dataGrafico}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="pregunta" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="valor" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      <Link to="/" className="btn btn-primary mt-3">Volver al inicio</Link>
    </div>
  );
};

export default ResultadosTest;