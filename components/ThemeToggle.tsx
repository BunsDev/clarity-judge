"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "clarity-judge:theme";
type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

/** Reads the theme straight from the <html> attribute so it never disagrees with what's painted. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // Snap, don't smear: kill transitions for the frame in which every colour changes.
    root.classList.add("no-transitions");
    root.dataset.theme = next;
    void root.offsetHeight; // force reflow so the class applies before the swap paints
    requestAnimationFrame(() => root.classList.remove("no-transitions"));
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked; the theme still applies for this page view.
    }
  }

  const iconBase = "absolute inset-0 m-auto h-3.5 w-3.5 transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)]";
  const shown = "opacity-100 scale-100 blur-0";
  const hidden = "opacity-0 scale-25 blur-[4px]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="press relative h-7 w-7 border border-line text-ink-2 hover:border-ink hover:text-ink"
    >
      <SunIcon className={`${iconBase} ${theme === "dark" ? shown : hidden}`} />
      <MoonIcon className={`${iconBase} ${theme === "light" ? shown : hidden}`} />
    </button>
  );
}
