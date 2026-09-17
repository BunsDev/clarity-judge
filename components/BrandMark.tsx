/**
 * The Clarity Judge mark: three lines of text with a check drawn across the
 * last one. Plain SVG with no client code, so the same drawing renders in the
 * sidebar, the favicon, and the generated social images.
 */
export const MARK_BG = "#ad267e";
export const MARK_FG = "#ffffff";

export function BrandMark({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <rect width="32" height="32" rx="8" fill={MARK_BG} />
      <rect x="8" y="9" width="16" height="2.6" rx="1.3" fill={MARK_FG} />
      <rect x="8" y="14.7" width="11" height="2.6" rx="1.3" fill={MARK_FG} />
      <rect x="8" y="20.4" width="6" height="2.6" rx="1.3" fill={MARK_FG} />
      <path d="M17.5 21.2l3.2 3.2 6.3-7" fill="none" stroke={MARK_FG} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
