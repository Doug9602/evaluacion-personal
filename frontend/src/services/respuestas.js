import axios from 'axios';

const API_URL = '/api/respuestas';

export const guardarRespuestas = (data) => axios.post(API_URL, data);