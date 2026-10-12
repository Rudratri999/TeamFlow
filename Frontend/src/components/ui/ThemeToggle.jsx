import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../context/useTheme"

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      {isDark ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
    </button>
  )
}

export default ThemeToggle
