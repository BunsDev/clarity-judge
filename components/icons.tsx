/**
 * Small inline SVG icons so we don't need an icon package.
 * 1.5px strokes to match the regular-weight text they sit beside.
 * Each verdict state has its own icon, so colour is never the only signal.
 */

type IconProps = { className?: string; title?: string };

function a11y(title?: string) {
  return title ? { role: "img" as const } : { "aria-hidden": true as const };
}

export function CheckIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...a11y(title)}>
      {title && <title>{title}</title>}
      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} {...a11y(title)}>
      {title && <title>{title}</title>}
      <path d="M10 3.5L2.5 16.5h15L10 3.5z" strokeLinejoin="round" />
      <path d="M10 8v3.5M10 14.2v.3" strokeLinecap="round" />
    </svg>
  );
}

export function QuestionIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} {...a11y(title)}>
      {title && <title>{title}</title>}
      <circle cx="10" cy="10" r="7.25" />
      <path d="M7.75 8a2.25 2.25 0 114.5 0c0 1.5-2.25 1.75-2.25 3.25M10 14.2v.3" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} {...a11y(title)}>
      {title && <title>{title}</title>}
      <path d="M4.5 17V3.5M4.5 4h10.5l-2 3.5 2 3.5H4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SunIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <circle cx="10" cy="10" r="3.25" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" strokeLinejoin="round" />
    </svg>
  );
}
