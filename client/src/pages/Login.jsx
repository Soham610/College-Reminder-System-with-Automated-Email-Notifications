import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  loginAdmin,
  loginStudent,
  resetAdminPassword,
  resetStudentPassword,
} from "../services/authService";
import { getSession, incrementVisitCount, saveSession } from "../services/authStorage";

const Login = ({ adminMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [resetForm, setResetForm] = useState({
    identifier: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introPayload, setIntroPayload] = useState(null);

  useEffect(() => {
    const session = getSession();
    if (session?.token) {
      navigate(session.user?.role === "admin" ? "/admin/dashboard" : "/dashboard/reminders", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!showIntro || !introPayload) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate("/welcome", {
        replace: true,
        state: introPayload,
      });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [introPayload, navigate, showIntro]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      const response = adminMode ? await loginAdmin(form) : await loginStudent(form);
      saveSession(response);
      const visitCount = incrementVisitCount();
      const fallbackTarget = adminMode ? "/admin/dashboard" : "/dashboard/reminders";
      setIntroPayload({
        visitCount,
        target: location.state?.from || fallbackTarget,
      });
      setShowIntro(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError("New password and confirm password must match.");
      return;
    }

    setResetLoading(true);

    try {
      const response = adminMode
        ? await resetAdminPassword(resetForm)
        : await resetStudentPassword(resetForm);
      setResetMessage(response.message);
      setResetForm({
        identifier: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (requestError) {
      setResetError(requestError.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page page-shell">
      {showIntro ? (
        <div className="login-cinematic-overlay" aria-live="polite" aria-label="Signing in">
          <div className="login-cinematic-stage">
            <div className="login-cinematic-beam" />
            <div className="login-cinematic-logo-wrap">
              <div className="login-cinematic-logo">CRS</div>
              <div className="login-cinematic-logo-full">College Reminder System</div>
            </div>
            <p className="login-cinematic-copy">
              {adminMode ? "Admin access confirmed" : "Student workspace opening"}
            </p>
          </div>
        </div>
      ) : null}

      <section className="auth-card surface-card">
        <div className="auth-intro">
          <p className="eyebrow">{adminMode ? "Administrator Access" : "Student Access"}</p>
          <h1 className="glow-title">College Reminder System</h1>
          <p>
            Keep academic schedules, exam deadlines, study targets, and campus commitments organised
            in one calm workspace.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field field-wide">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={adminMode ? "admin@college.edu" : "student@college.edu"}
              required
            />
          </label>

          <label className="field field-wide">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? <div className="status-banner error">{error}</div> : null}

          <div className="button-row field-wide">
            <button type="submit" className="button-primary" disabled={loading || showIntro}>
              {showIntro ? "Opening Workspace..." : loading ? "Signing In..." : adminMode ? "Login as Admin" : "Login as Student"}
            </button>
          </div>
        </form>

        <div className="auth-utility-row">
          <button
            type="button"
            className="utility-link-button"
            onClick={() => {
              setShowReset((current) => !current);
              setResetError("");
              setResetMessage("");
            }}
          >
            {showReset ? "Hide Forgot Password" : "Forgot Password?"}
          </button>
        </div>

        {showReset ? (
          <section className="reset-panel">
            <div className="reset-panel-copy">
              <p className="eyebrow">{adminMode ? "Admin Password Reset" : "Student Password Reset"}</p>
              <h2>Reset Password</h2>
              <p>Enter your username or email, then set and confirm a new password.</p>
            </div>

            <form className="form-grid" onSubmit={handleResetSubmit}>
              <label className="field field-wide">
                <span>Username or Email</span>
                <input
                  name="identifier"
                  value={resetForm.identifier}
                  onChange={handleResetChange}
                  placeholder={adminMode ? "System Admin or admin@college.edu" : "Your name or student email"}
                  required
                />
              </label>

              <label className="field">
                <span>New Password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={resetForm.newPassword}
                  onChange={handleResetChange}
                  minLength="6"
                  required
                />
              </label>

              <label className="field">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={resetForm.confirmPassword}
                  onChange={handleResetChange}
                  minLength="6"
                  required
                />
              </label>

              {resetError ? <div className="status-banner error field-wide">{resetError}</div> : null}
              {resetMessage ? <div className="status-banner field-wide">{resetMessage}</div> : null}

              <div className="button-row field-wide">
                <button type="submit" className="button-primary" disabled={resetLoading}>
                  {resetLoading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="auth-links">
          {adminMode ? (
            <>
              <Link to="/login">Student login</Link>
              <span>·</span>
              <Link to="/signup">Create student account</Link>
            </>
          ) : (
            <>
              <Link to="/signup">Create account</Link>
              <span>·</span>
              <Link to="/admin/login">Admin login</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Login;
