import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "../services/authStorage";

const ProtectedRoute = ({ allowedRole }) => {
  const location = useLocation();
  const session = getSession();

  if (!session?.token) {
    return (
      <Navigate
        to={allowedRole === "admin" ? "/admin/login" : "/login"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (allowedRole && session.user?.role !== allowedRole) {
    return (
      <Navigate
        to={session.user?.role === "admin" ? "/admin/dashboard" : "/dashboard/reminders"}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
