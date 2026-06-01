const StatCard = ({ label, value, accent }) => (
  <article className="stat-card">
    <span className="stat-label">{label}</span>
    <strong className={`stat-value ${accent || ""}`}>{value}</strong>
  </article>
);

export default StatCard;
