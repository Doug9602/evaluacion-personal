import axios from 'axios';

const API_URL = '/api/escalas';

export const listarEscalas = (testId) => {
  const url = testId ? `${API_URL}?test_id=${testId}` : API_URL;
  return axios.get(url);
};
export const obtenerEscala = (id) => axios.get(`${API_URL}/${id}`);
export const crearEscala = (data) => axios.post(API_URL, data);
export const actualizarEscala = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const eliminarEscala = (id) => axios.delete(`${API_URL}/${id}`);