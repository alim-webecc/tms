"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
      title="Theme umschalten"
    >
      {isDark ? <Sun size={16}/> : <Moon size={16}/>}
      <span>{isDark ? "Hell" : "Dunkel"}</span>
    </button>
  );
}
