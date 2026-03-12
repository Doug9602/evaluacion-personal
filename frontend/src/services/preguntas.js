import axios from 'axios';

const API_URL = '/api/preguntas';

export const listarPreguntas = (testId) => {
  const url = testId ? `${API_URL}?test_id=${testId}` : API_URL;
  return axios.get(url);
};
export const obtenerPregunta = (id) => axios.get(`${API_URL}/${id}`);
export const crearPregunta = (data) => axios.post(API_URL, data);
export const actualizarPregunta = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const eliminarPregunta = (id) => axios.delete(`${API_URL}/${id}`);