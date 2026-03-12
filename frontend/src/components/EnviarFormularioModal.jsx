import React, { useState } from 'react';
import { enviarPorEmail } from '../services/envio';

const EnviarFormularioModal = ({ 
  candidatoId, 
  testId, 
  candidatoNombre, 
  emailCandidato,  // nueva prop
  onClose, 
  onSuccess 
}) => {
  const [email, setEmail] = useState(emailCandidato || '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await enviarPorEmail(candidatoId, testId, email);
      alert(`Formulario enviado a ${email}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Enviar formulario a {candidatoNombre}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo del candidato"
                  required
                />
                <small className="text-muted">
                  Por defecto se muestra el correo registrado del candidato. Puedes modificarlo si es necesario.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnviarFormularioModal;