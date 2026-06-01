import { NavLink } from "react-router-dom";

const sections = [
  {
    id: "reminders",
    label: "Add Reminder",
    subtitle: "Create and review reminder records only",
    color: "red",
    car: "reminder",
  },
  {
    id: "timetable",
    label: "Timetable",
    subtitle: "Manage class entries day by day",
    color: "green",
    car: "timetable",
  },
  {
    id: "goals",
    label: "Goals",
    subtitle: "Track daily goals and completion status",
    color: "yellow",
    car: "goals",
  },
  {
    id: "focus",
    label: "Focus Mode",
    subtitle: "Run study sessions with break timers automatically",
    color: "blue",
    car: "focus",
  },
];

const SectionNav = () => (
  <nav className="card-selector" aria-label="Dashboard sections">
    {sections.map((section) => (
      <NavLink
        key={section.id}
        to={`/dashboard/${section.id}`}
        className={({ isActive }) => `dashboard-card dashboard-card-${section.color} ${isActive ? "active" : ""}`}
      >
        <span className="dashboard-race-track" aria-hidden="true">
          <span className={`dashboard-car dashboard-car-${section.car}`} />
          <span className="dashboard-finish-line" />
        </span>
        <span className="dashboard-card-title">{section.label}</span>
        <span className="dashboard-card-subtitle">{section.subtitle}</span>
      </NavLink>
    ))}
  </nav>
);

export default SectionNav;
