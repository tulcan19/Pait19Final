import React from 'react';

interface AgeGateProps {
  onVerify: () => void;
}

const AgeGate: React.FC<AgeGateProps> = ({ onVerify }) => {
  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-card">
        <div className="age-gate-logo">
          <span className="material-symbols-outlined">liquor</span>
          <h1>Sierra Stock</h1>
        </div>
        
        <div className="age-gate-content">
          <h2>VERIFICACIÓN DE EDAD</h2>
          <div className="age-gate-divider"></div>
          <p>Este sitio contiene productos destinados exclusivamente a adultos.</p>
          <p className="age-gate-question">¿Eres mayor de 18 años?</p>
        </div>

        <div className="age-gate-actions">
          <button className="age-gate-btn-yes" onClick={onVerify}>
            SÍ, SOY MAYOR DE 18
          </button>
          <button className="age-gate-btn-no" onClick={handleNo}>
            NO, SALIR
          </button>
        </div>

        <div className="age-gate-footer">
          <p>Al ingresar, aceptas nuestra política de cookies y términos de servicio.</p>
          <p className="age-gate-warning">EL CONSUMO EXCESIVO DE ALCOHOL ES PERJUDICIAL PARA LA SALUD.</p>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
