const DashboardCard = ({ title, subtitle, active, onClick }) => (
  <button
    type="button"
    className={`dashboard-card ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <span className="dashboard-card-title">{title}</span>
    <span className="dashboard-card-subtitle">{subtitle}</span>
  </button>
);

export default DashboardCard;
