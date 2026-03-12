import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import { obtenerUsuario } from '../contextos/sesion';
import api from '../api/api';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const usuario = obtenerUsuario();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Solo mostrar si es Rol Cliente
  if (!usuario || (usuario.rol !== 'Cliente' && usuario.rol !== 'cliente')) {
    return null;
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo]);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || escribiendo) return;

    const nuevoMensaje: Mensaje = { role: 'user', content: input };
    const historialActualizado = [...mensajes, nuevoMensaje];
    
    setMensajes(historialActualizado);
    setInput('');
    setEscribiendo(true);

    try {
      const resp = await api.post('/chatbot/preguntar', {
        mensajes: historialActualizado
      });

      if (resp.data && resp.data.ok) {
        setMensajes([...historialActualizado, { role: 'assistant', content: resp.data.respuesta }]);
      }
    } catch (error) {
      console.error('Error en chatbot:', error);
      setMensajes([...historialActualizado, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu mensaje.' }]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {!abierto && (
        <button className="chatbot-toggle" onClick={() => setAbierto(true)}>
          <span className="material-symbols-outlined">chat</span>
          <span className="chatbot-notif">1</span>
        </button>
      )}

      {abierto && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="material-symbols-outlined">smart_toy</span>
              <div>
                <h3>ChatBot19</h3>
                <span>Asistente Premium</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setAbierto(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="chatbot-body" ref={scrollRef}>
            {mensajes.length === 0 && (
              <div className="chatbot-welcome">
                <p>¡Hola <strong>{usuario.nombre}</strong>! Soy ChatBot19, tu asistente exclusivo en Sierra Stock.</p>
                <p>¿En qué puedo ayudarte hoy sobre nuestros licores?</p>
              </div>
            )}
            {mensajes.map((m, idx) => (
              <div key={idx} className={`chatbot-msg ${m.role}`}>
                <div className="chatbot-msg-bubble">
                  {m.content}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="chatbot-msg assistant">
                <div className="chatbot-msg-bubble escribiendo">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <form className="chatbot-footer" onSubmit={manejarEnvio}>
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={escribiendo}
            />
            <button type="submit" disabled={!input.trim() || escribiendo}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
