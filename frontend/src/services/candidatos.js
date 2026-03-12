import axios from 'axios';

const API_URL = '/api/candidatos';

export const listarCandidatos = () => axios.get(API_URL);
export const obtenerCandidato = (id) => axios.get(`${API_URL}/${id}`);
export const crearCandidato = (data) => axios.post(API_URL, data);
export const actualizarCandidato = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const eliminarCandidato = (id) => axios.delete(`${API_URL}/${id}`);