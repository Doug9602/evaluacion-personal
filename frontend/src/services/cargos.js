import axios from 'axios';

const API_URL = '/api/cargos';

export const listarCargos = () => axios.get(API_URL);
export const obtenerCargo = (id) => axios.get(`${API_URL}/${id}`);
export const crearCargo = (data) => axios.post(API_URL, data);
export const actualizarCargo = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const eliminarCargo = (id) => axios.delete(`${API_URL}/${id}`);