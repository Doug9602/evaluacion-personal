import axios from 'axios';

export const enviarPorEmail = (candidatoId, testId, email) => {
  return axios.post(`/api/enviar-formulario/${candidatoId}/${testId}`, { email });
};