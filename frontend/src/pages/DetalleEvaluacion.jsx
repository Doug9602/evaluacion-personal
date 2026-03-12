import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { listarPreguntas } from '../services/preguntas';

const DetalleEvaluacion = () => {
  const { respuestaId } = useParams();
  const [resultado, setResultado] = useState(null);
  const [resultadosEscalas, setResultadosEscalas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar resultado general de la respuesta
        const resResultado = await axios.get(`/api/resultados/respuesta/${respuestaId}`);
        setResultado(resResultado.data);

        // Cargar preguntas del test
        const testId = resResultado.data.test_id;
        const resPreguntas = await listarPreguntas(testId);
        setPreguntas(Array.isArray(resPreguntas.data) ? resPreguntas.data : []);

        // Cargar resultados por escala
        const resEscalas = await axios.get(`/api/resultados/escalas/${respuestaId}`);
        setResultadosEscalas(resEscalas.data);
      } catch (err) {
        setError('Error al cargar la evaluación');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [respuestaId]);

  const getTextoPregunta = (preguntaId) => {
    const pregunta = preguntas.find(p => p.id === preguntaId);
    return pregunta ? pregunta.texto : `Pregunta ID: ${preguntaId}`;
  };

  if (loading) return <div className="container mt-4">Cargando...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!resultado) return null;

  // Datos para el gráfico de respuestas individuales
  const dataGrafico = resultado.detalle.map(r => ({
    pregunta: getTextoPregunta(r.pregunta_id).substring(0, 20) + '...', // abreviar para gráfico
    valor: r.valor
  }));

  // Datos para el gráfico de escalas
  const dataEscalas = resultadosEscalas.map(e => ({
    escala: e.escala_nombre,
    porcentaje: e.porcentaje
  }));

  return (
    <div className="container mt-4">
      <h2>Detalle de Evaluación</h2>
      <div className="card mb-4">
        <div className="card-body">
          <p><strong>Candidato ID:</strong> {resultado.candidato_id}</p>
          <p><strong>Test ID:</strong> {resultado.test_id}</p>
          <p><strong>Fecha:</strong> {resultado.fecha}</p>
          <p><strong>Puntuación total:</strong> {resultado.puntuacion_total} / {resultado.maximo_total}</p>
          <p><strong>Porcentaje:</strong> {resultado.porcentaje}%</p>
        </div>
      </div>

      <h4>Detalle de respuestas</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Pregunta</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {resultado.detalle.map((r, index) => (
            <tr key={index}>
              <td>{getTextoPregunta(r.pregunta_id)}</td>
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

      {resultadosEscalas.length > 0 && (
        <>
          <h4 className="mt-5">Perfil por escalas</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dataEscalas} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="escala" />
              <Tooltip />
              <Legend />
              <Bar dataKey="porcentaje" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <table className="table table-striped mt-3">
            <thead>
              <tr>
                <th>Escala</th>
                <th>Puntuación</th>
                <th>Máximo</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {resultadosEscalas.map(e => (
                <tr key={e.id}>
                  <td>{e.escala_nombre}</td>
                  <td>{e.puntuacion.toFixed(2)}</td>
                  <td>{e.maximo.toFixed(2)}</td>
                  <td>{e.porcentaje.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <Link to={`/evaluaciones-candidato/${resultado.candidato_id}`} className="btn btn-primary mt-3">
        Volver a evaluaciones
      </Link>
    </div>
  );
};

export default DetalleEvaluacion;