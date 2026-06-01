import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupStudent } from "../services/authService";
import { getSession, incrementVisitCount, saveSession } from "../services/authStorage";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.token) {
      navigate(session.user?.role === "admin" ? "/admin/dashboard" : "/dashboard/reminders", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await signupStudent(form);
      saveSession(response);
      const visitCount = incrementVisitCount();
      navigate("/welcome", {
        replace: true,
        state: {
          visitCount,
          target: "/dashboard/reminders",
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-shell">
      <section className="auth-card surface-card">
        <div className="auth-intro">
          <p className="eyebrow">Student Registration</p>
          <h1 className="glow-title">Create Your Academic Space</h1>
          <p>Build a personal planning hub for classes, exams, study routines, and campus life.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full Name</span>
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label className="field">
            <span>Department</span>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Computer Science"
            />
          </label>

          <label className="field field-wide">
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label className="field field-wide">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </label>

          {error ? <div className="status-banner error">{error}</div> : null}

          <div className="button-row field-wide">
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? "Creating Account..." : "Create Student Account"}
            </button>
          </div>
        </form>

        <div className="auth-links">
          <Link to="/login">Student login</Link>
          <span>·</span>
          <Link to="/admin/login">Admin login</Link>
        </div>
      </section>
    </div>
  );
};

export default Signup;
