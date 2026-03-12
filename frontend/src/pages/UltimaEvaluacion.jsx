import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UltimaEvaluacion = () => {
  const { candidatoId } = useParams();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await axios.get(`/api/resultados/ultima/${candidatoId}`);
        setResultado(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('El candidato no tiene evaluaciones registradas.');
        } else {
          setError('Error al cargar la evaluación.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [candidatoId]);

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return (
    <div className="container mt-4">
      <div className="alert alert-warning">{error}</div>
      <Link to="/candidatos" className="btn btn-primary">Volver a candidatos</Link>
    </div>
  );
  if (!resultado) return null;

  const dataGrafico = resultado.detalle.map(r => ({
    pregunta: `P${r.pregunta_id}`,
    valor: r.valor
  }));

  return (
    <div className="container mt-4">
      <h2>Última Evaluación del Candidato</h2>
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

      <Link to="/candidatos" className="btn btn-primary mt-3">Volver a candidatos</Link>
    </div>
  );
};

export default UltimaEvaluacion;