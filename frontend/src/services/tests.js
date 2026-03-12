import axios from 'axios';

const API_URL = '/api/tests';

export const listarTests = () => axios.get(API_URL);
export const obtenerTest = (id) => axios.get(`${API_URL}/${id}`);
export const crearTest = (data) => axios.post(API_URL, data);
export const actualizarTest = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const eliminarTest = (id) => axios.delete(`${API_URL}/${id}`);