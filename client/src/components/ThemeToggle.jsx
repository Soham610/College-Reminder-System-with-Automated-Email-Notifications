const ThemeToggle = ({ theme, onToggle }) => (
  <button
    type="button"
    className="theme-toggle"
    onClick={onToggle}
    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  >
    <span className="theme-toggle-icon" aria-hidden="true">
      {theme === "dark" ? "☾" : "☀"}
    </span>
    <span className="theme-toggle-label sr-only">
      {theme === "dark" ? "Dark Mode" : "Light Mode"}
    </span>
    <span className={`theme-toggle-track ${theme === "dark" ? "dark" : "light"}`}>
      <span className="theme-toggle-thumb" />
    </span>
  </button>
);

export default ThemeToggle;
