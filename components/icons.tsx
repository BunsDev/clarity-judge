/**
 * Small inline SVG icons so we don't need an icon package.
 * Each verdict state has its own icon, so colour is never the only signal.
 */

type IconProps = { className?: string; title?: string };

export function CheckIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <path d="M10 3.5L2.5 16.5h15L10 3.5z" strokeLinejoin="round" />
      <path d="M10 8v3.5M10 14.2v.3" strokeLinecap="round" />
    </svg>
  );
}

export function QuestionIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <circle cx="10" cy="10" r="7.25" />
      <path d="M7.75 8a2.25 2.25 0 114.5 0c0 1.5-2.25 1.75-2.25 3.25M10 14.2v.3" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <path d="M4 2.5a.75.75 0 01.75.75v.4l1.4-.35a7 7 0 013.6.1l.9.27a5.5 5.5 0 003.15.05l1.8-.5a.75.75 0 01.95.72v7.25a.75.75 0 01-.55.72l-1.8.5a7 7 0 01-4.02-.06l-.9-.27a5.5 5.5 0 00-2.83-.08l-1.7.42V17a.75.75 0 01-1.5 0V3.25A.75.75 0 014 2.5z" />
    </svg>
  );
}

export function SpinnerIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`animate-spin ${className}`} aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={2.5} className="opacity-25" />
      <path d="M17 10a7 7 0 00-7-7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}
