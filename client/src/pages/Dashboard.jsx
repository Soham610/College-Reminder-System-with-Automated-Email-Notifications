import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AnnouncementBoard from "../components/AnnouncementBoard";
import StudentMessagesPanel from "../components/StudentMessagesPanel";
import FocusModeSection from "../components/FocusModeSection";
import GoalsSection from "../components/GoalsSection";
import PageSection from "../components/PageSection";
import ReminderSection from "../components/ReminderSection";
import SectionNav from "../components/SectionNav";
import TimetableSection from "../components/TimetableSection";
import { clearSession, getSession } from "../services/authStorage";
import { getAnnouncements } from "../services/reminderService";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [announcements, setAnnouncements] = useState([]);
  const [status, setStatus] = useState("");
  const isFocusMode = location.pathname.endsWith("/focus");

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        setStatus(error.message);
      }
    };

    loadAnnouncements();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`dashboard-page page-shell ${isFocusMode ? "dashboard-focus-shell" : ""}`}>
      {isFocusMode ? (
        <main className="dashboard-focus-main">
          <Routes>
            <Route path="focus" element={<FocusModeSection />} />
            <Route path="*" element={<Navigate to="focus" replace />} />
          </Routes>
        </main>
      ) : (
        <>
          <header className="topbar surface-card">
            <div>
              <p className="eyebrow">Student Workspace</p>
              <h1 className="page-title">College Reminder System</h1>
              <p className="topbar-copy">
                Manage reminders, timetable entries, and daily goals with clear section isolation.
              </p>
            </div>
            <div className="topbar-actions">
              <div className="user-chip">
                <strong>{session?.user?.name || "Student"}</strong>
                <span>{session?.user?.department || "Academic Planning"}</span>
              </div>
              <button type="button" className="button-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <SectionNav />

          {status ? <div className="status-banner">{status}</div> : null}

          <div className="dashboard-grid main-layout">
            <main className="dashboard-main-column">
              <Routes>
                <Route path="/" element={<Navigate to="reminders" replace />} />
                <Route path="reminders" element={<ReminderSection />} />
                <Route path="timetable" element={<TimetableSection />} />
                <Route path="goals" element={<GoalsSection userName={session?.user?.name} />} />
                <Route path="focus" element={<FocusModeSection />} />
                <Route path="*" element={<Navigate to="reminders" replace />} />
              </Routes>
            </main>

            <aside className="dashboard-side-column">
              <div className="side-stack">
                <PageSection title="Announcements" subtitle="Updates shared by the college administration.">
                  <AnnouncementBoard announcements={announcements} />
                </PageSection>

                <PageSection title="Contact Officials" subtitle="Message the administration directly from your dashboard.">
                  <StudentMessagesPanel currentUser={session?.user} />
                </PageSection>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
