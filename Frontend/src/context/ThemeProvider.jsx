import { useEffect, useMemo, useState } from "react"
import ThemeContext from "./ThemeContext"

const STORAGE_KEY = "teamflow-theme"

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light"
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(
    () => ({
      isDark: theme === "dark",
      toggleTheme: () =>
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
