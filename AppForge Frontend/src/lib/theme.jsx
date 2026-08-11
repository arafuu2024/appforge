import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme provider.
 * - Persists the choice to localStorage.
 * - Respects the OS preference by default (system).
 * - Applies the `dark` class on <html> before paint (no flash).
 * - Stays in sync across every page because the class lives on <html>.
 */
export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="appforge-theme"
    >
      {children}
    </NextThemesProvider>
  );
}