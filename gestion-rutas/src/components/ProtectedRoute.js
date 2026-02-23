import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // Si se especifica un solo rol
  if (role && user.rol !== role) return <Navigate to="/dashboard" />;

  // Si se especifica una lista de roles permitidos
  if (roles && !roles.includes(user.rol)) {
    return user.rol === "cliente" ? <Navigate to="/clientes" /> : <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
