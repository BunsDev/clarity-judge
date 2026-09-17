"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Activity, ArrowUpRight, KeyRound, LoaderCircle, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from "lucide-react";
import type { DeployTarget } from "@/lib/env";
import { API_KEY_EVENT, clearApiKey, loadApiKey, saveApiKey } from "@/lib/storage";
import { GITHUB_URL, externalLinks, navGroups, navPages } from "@/lib/nav";
import type { Telemetry } from "@/types/results";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { ShellContext, type ShellState } from "./ShellContext";

type Props = {
  serverHasKey: boolean;
  deployTarget: DeployTarget;
  children: React.ReactNode;
};

const NAV_KEY = "clarity-judge:nav-collapsed";
const THEME_KEY = "clarity-judge:theme";

/**
 * The application frame: sidebar, topbar, demo banner, footer, and the API key
 * dialog. Mirrors the TypeSafe playground shell so the two feel like one family.
 */
export function Shell({ serverHasKey, deployTarget, children }: Props) {
  const path = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [running, setRunning] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  // Read persisted UI state once on the client. The server render can't know it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(loadApiKey());
    setHydrated(true);
    try {
      setCollapsed(localStorage.getItem(NAV_KEY) === "true");
    } catch {}
    const sync = () => setApiKey(loadApiKey());
    window.addEventListener(API_KEY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(API_KEY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [path]);

  // Focus trap + escape for the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    sidebarRef.current?.querySelector<HTMLButtonElement>(".sidebar-mobile-close")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const controls = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? []).filter(
        (el) => el.getClientRects().length,
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(NAV_KEY, String(next));
    } catch {}
  }

  const saveKey = useCallback((key: string) => {
    saveApiKey(key);
    setApiKey(key.trim());
  }, []);
  const clearKey = useCallback(() => {
    clearApiKey();
    setApiKey(null);
  }, []);
  const openKeyDialog = useCallback(() => setKeyDialogOpen(true), []);

  const demoMode = !serverHasKey && !apiKey;

  // A readout from a simulated run must never sit under a "Live" label, or the
  // other way round, so the last-run facts reset whenever the mode flips.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTelemetry(null);
  }, [demoMode]);

  const shell = useMemo<ShellState>(
    () => ({ serverHasKey, deployTarget, apiKey, hydrated, demoMode, saveKey, clearKey, openKeyDialog, telemetry, setTelemetry, running, setRunning }),
    [serverHasKey, deployTarget, apiKey, hydrated, demoMode, saveKey, clearKey, openKeyDialog, telemetry, running],
  );

  const current = navPages.find((page) => page.href === path);

  return (
    <ShellContext.Provider value={shell}>
      <div className={`app-shell${collapsed ? " nav-collapsed" : ""}${mobileOpen ? " nav-mobile-open" : ""}`}>
        <a href="#main" className="skip-link">
          Skip to workspace
        </a>
        {mobileOpen && <button className="nav-backdrop" aria-label="Dismiss navigation" onClick={() => setMobileOpen(false)} />}

        <aside ref={sidebarRef} className="sidebar" id="app-navigation" aria-label="Sidebar">
          <div className="sidebar-title-row">
            <Link className="brand" href="/" aria-label="Clarity Judge home">
              <span className="brand-mark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/mark.jpg" width={30} height={30} alt="" />
              </span>
              <span>
                Clarity Judge
                <span className="brand-sub">JUDGED BY TYPESAFE JEV</span>
              </span>
            </Link>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              aria-controls="app-navigation"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
            <button type="button" className="icon-button sidebar-mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav aria-label="Pages">
            {navGroups.map((group) => (
              <div className="nav-group" key={group.id} role="group" aria-labelledby={`nav-${group.id}`}>
                <div className="nav-label" id={`nav-${group.id}`}>
                  {group.label}
                </div>
                {group.pages.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    title={label}
                    className={path === href ? "active" : ""}
                    aria-current={path === href ? "page" : undefined}
                  >
                    <Icon size={18} strokeWidth={path === href ? 2 : 1.5} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-bottom">
            {externalLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label} <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </aside>

        <div className="app-body">
          <header className="workspace-topbar">
            <div className="workspace-breadcrumb">
              <button
                type="button"
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                aria-controls="app-navigation"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <Menu size={18} />
              </button>
              <span>Clarity Judge</span>
              <span>/</span>
              <strong>{current?.label ?? "Workspace"}</strong>
            </div>
            <div className="header-actions">
              <UsageBadge telemetry={telemetry} running={running} hydrated={hydrated} demoMode={demoMode} apiKey={apiKey} serverHasKey={serverHasKey} />
              <a className="icon-button" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="View Clarity Judge on GitHub" title="View source on GitHub">
                <GitHubMark />
              </a>
              <button
                type="button"
                className={`icon-button${apiKey ? " has-key" : ""}`}
                aria-label="API key settings"
                title={apiKey ? "Personal API key saved" : "API key settings"}
                onClick={openKeyDialog}
              >
                <KeyRound size={18} strokeWidth={1.5} />
              </button>
              <ThemeButton />
            </div>
          </header>

          {hydrated && demoMode && (
            <div className="demo-banner" role="status">
              <strong>Demo mode</strong>
              <p>Results are simulated and deterministic. Add a TypeSafe key to get real verdicts from Jev.</p>
              <button type="button" className="button small" onClick={openKeyDialog}>
                <KeyRound size={13} /> Add a key
              </button>
            </div>
          )}

          <main id="main" tabIndex={-1}>
            {children}
          </main>

          <footer className="app-footer">
            <span>Clarity Judge · Judged by TypeSafe Jev</span>
            <span>Decisions, not scores.</span>
          </footer>
        </div>

        <ApiKeyDialog open={keyDialogOpen} onClose={() => setKeyDialogOpen(false)} />
      </div>
    </ShellContext.Provider>
  );
}

/* ---------- topbar pieces ---------- */

function UsageBadge({
  telemetry,
  running,
  hydrated,
  demoMode,
  apiKey,
  serverHasKey,
}: {
  telemetry: Telemetry | null;
  running: boolean;
  hydrated: boolean;
  demoMode: boolean;
  apiKey: string | null;
  serverHasKey: boolean;
}) {
  const mode = !hydrated ? "…" : demoMode ? "Demo" : apiKey ? "Live · browser key" : serverHasKey ? "Live · server key" : "Live";
  const detail = running
    ? "Judging…"
    : telemetry
      ? `${telemetry.questions} ${telemetry.questions === 1 ? "check" : "checks"} · ${telemetry.latencyMs} ms`
      : "No run yet";
  const tokens =
    telemetry && !running
      ? telemetry.inputTokens !== undefined
        ? `${telemetry.inputTokens.toLocaleString()} tokens`
        : "tokens —"
      : null;
  const title =
    telemetry?.source === "jev"
      ? "Latency is measured in the browser. Tokens are the verdict request's input tokens; the optional evidence request is not counted."
      : "Demo mode sends nothing to Jev. Token counts are estimates.";
  return (
    <span className={`usage-badge${!demoMode && hydrated ? " live" : ""}${running ? " busy" : ""}`} title={title} aria-live="polite">
      {running ? <LoaderCircle size={14} className="spin" /> : <Activity size={14} strokeWidth={1.5} />}
      <span>{mode}</span>
      <small>{detail}</small>
      {tokens && <small>{tokens}</small>}
    </span>
  );
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Reads the theme from <html> so it never disagrees with what's painted. */
function ThemeButton() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    // Snap, don't smear: kill transitions for the frame in which every colour changes.
    root.classList.add("no-transitions");
    root.dataset.theme = next;
    void root.offsetHeight;
    requestAnimationFrame(() => root.classList.remove("no-transitions"));
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  }
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  return (
    <button type="button" className="icon-button" onClick={toggle} aria-label={label} title={label}>
      <span className="icon-swap" aria-hidden>
        <Sun size={18} strokeWidth={1.5} className={theme === "dark" ? "" : "hidden-icon"} />
        <Moon size={18} strokeWidth={1.5} className={theme === "light" ? "" : "hidden-icon"} />
      </span>
    </button>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.23c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.16 1.18a11 11 0 0 1 5.75 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.08 0 4.42-2.69 5.4-5.26 5.69.42.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
