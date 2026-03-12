import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listarPreguntas } from '../services/preguntas';
import { guardarRespuestas } from '../services/respuestas';

const ResponderTest = () => {
  const { candidatoId, testId } = useParams();
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarPreguntas();
  }, []);

  const cargarPreguntas = async () => {
    try {
      const response = await listarPreguntas(testId);
      setPreguntas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespuestaChange = (preguntaId, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    // Convertir objeto de respuestas a array
    const respuestasArray = Object.entries(respuestas).map(([preguntaId, valor]) => ({
      pregunta_id: parseInt(preguntaId),
      valor: valor
    }));

    try {
      await guardarRespuestas({
        candidato_id: parseInt(candidatoId),
        test_id: parseInt(testId),
        respuestas: respuestasArray
      });
      alert('Respuestas guardadas correctamente');
      navigate('/aplicar-test');
    } catch (error) {
      console.error('Error al guardar respuestas:', error);
      alert('Ocurrió un error al guardar las respuestas');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="container mt-4">Cargando preguntas...</div>;

  return (
    <div className="container mt-4">
      <h2>Responder Test</h2>
      <form onSubmit={handleSubmit}>
        {preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Pregunta {index + 1}</h5>
              <p className="card-text">{pregunta.texto}</p>

              {/* Renderizado según tipo de pregunta */}
              {pregunta.tipo_pregunta === 'likert' && (
                <div>
                  {[1, 2, 3, 4, 5].map(valor => (
                    <div key={valor} className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`pregunta_${pregunta.id}`}
                        value={valor}
                        onChange={() => handleRespuestaChange(pregunta.id, valor)}
                        required
                      />
                      <label className="form-check-label">{valor}</label>
                    </div>
                  ))}
                </div>
              )}

              {pregunta.tipo_pregunta === 'multiple' && pregunta.opciones_json && (
                <div>
                  {JSON.parse(pregunta.opciones_json).map(opcion => (
                    <div key={opcion.valor} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`pregunta_${pregunta.id}`}
                        value={opcion.valor}
                        onChange={() => handleRespuestaChange(pregunta.id, opcion.valor)}
                        required
                      />
                      <label className="form-check-label">{opcion.texto}</label>
                    </div>
                  ))}
                </div>
              )}

              {pregunta.tipo_pregunta === 'abierta' && (
                <textarea
                  className="form-control"
                  rows="3"
                  onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                  required
                />
              )}
            </div>
          </div>
        ))}

        <button type="submit" className="btn btn-success" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Guardar Respuestas'}
        </button>
      </form>
    </div>
  );
};

export default ResponderTest;