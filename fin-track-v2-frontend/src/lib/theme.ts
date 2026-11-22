export type Theme = "light" | "dark" | "system";

const THEME_KEY = "theme";
const THEME_EVENT = "fin-track-theme";

export const themeInitScript = `(function(){try{var theme=localStorage.getItem("${THEME_KEY}");var system=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=theme==="dark"||(theme!=="light"&&system);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

export function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Si localStorage no está disponible, la elección vale mientras la página siga abierta.
let temaEnMemoria: Theme | null = null;

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    return temaEnMemoria ?? "system";
  }

  return "system";
}

export function themeIsDark(theme: Theme) {
  return theme === "dark" || (theme !== "light" && systemPrefersDark());
}

export function applyTheme(theme: Theme) {
  temaEnMemoria = theme;
  document.documentElement.classList.toggle("dark", themeIsDark(theme));

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // El color igual queda aplicado en el documento.
  }

  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}
