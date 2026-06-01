const PageSection = ({ title, subtitle, actions, children }) => (
  <section className="surface-card page-section">
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
    {children}
  </section>
);

export default PageSection;
