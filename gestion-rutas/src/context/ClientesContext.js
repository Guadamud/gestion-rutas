import React, { createContext, useContext, useState } from 'react';

// Contexto para datos de clientes/conductores
const ClientesContext = createContext();

export const useClientes = () => useContext(ClientesContext);

export const ClientesProvider = ({ children }) => {
  // Estado global para conductores - ahora se cargan desde el backend
  const [conductores, setConductores] = useState([]);

  return (
    <ClientesContext.Provider value={{ conductores, setConductores }}>
      {children}
    </ClientesContext.Provider>
  );
};
