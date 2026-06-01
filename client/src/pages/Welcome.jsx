import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, getVisitCount } from "../services/authStorage";

const Welcome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const visitCount = location.state?.visitCount || getVisitCount();
  const target =
    location.state?.target ||
    (session?.user?.role === "admin" ? "/admin/dashboard" : "/dashboard/reminders");

  useEffect(() => {
    if (!session?.token) {
      navigate("/login", { replace: true });
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate(target, { replace: true });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [navigate, session, target]);

  return (
    <div className="welcome-page page-shell">
      <div className="welcome-card surface-card">
        <p className="eyebrow">Access Confirmed</p>
        <h1 className="welcome-title">WELCOME</h1>
        <p>Session visit count: {visitCount}</p>
      </div>
    </div>
  );
};

export default Welcome;
