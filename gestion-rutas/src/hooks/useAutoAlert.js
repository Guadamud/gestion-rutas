import { useState, useEffect, useRef } from 'react';

/**
 * Hook que auto-limpia un mensaje de alerta después de un tiempo determinado.
 * Úsalo como reemplazo directo de useState('') para success/error.
 * @param {number} timeout - Milisegundos antes de limpiar el mensaje (default 10000)
 */
const useAutoAlert = (timeout = 10000) => {
  const [message, setMessageState] = useState('');
  const timerRef = useRef(null);

  const setMessage = (msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessageState(msg);
    if (msg) {
      timerRef.current = setTimeout(() => setMessageState(''), timeout);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return [message, setMessage];
};

export default useAutoAlert;
