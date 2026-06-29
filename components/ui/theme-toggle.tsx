"use client";

import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 hover:text-primary"
    >
      <SunIcon className="hidden size-[18px] dark:block" />
      <MoonIcon className="block size-[18px] dark:hidden" />
    </button>
  );
}
