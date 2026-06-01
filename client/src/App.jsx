import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AnimatedBackground from "./components/AnimatedBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import { getSession } from "./services/authStorage";
import { getStoredTheme, saveTheme } from "./services/themeStorage";

const HomeRedirect = () => {
  const session = getSession();

  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate to={session.user?.role === "admin" ? "/admin/dashboard" : "/dashboard/reminders"} replace />
  );
};

const App = () => {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let frameId = 0;

    const syncScroll = () => {
      document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
      frameId = 0;
    };

    const handleScroll = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(syncScroll);
      }
    };

    syncScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="app-frame">
      <AnimatedBackground mode={theme} />
      <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} />

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/login" element={<Login adminMode />} />
        <Route path="/welcome" element={<Welcome />} />

        <Route element={<ProtectedRoute allowedRole="student" />}>
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </div>
  );
};

export default App;
