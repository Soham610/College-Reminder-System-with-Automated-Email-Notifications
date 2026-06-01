const THEME_KEY = "college-reminder-theme";

export const getStoredTheme = () => {
  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const saveTheme = (theme) => {
  window.localStorage.setItem(THEME_KEY, theme);
};
