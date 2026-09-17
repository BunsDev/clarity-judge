import type { ReactNode } from "react";

type Props = {
  /** Mono, upper-case title in the inverted bar, e.g. "01 · Text". */
  title: string;
  /** Right-aligned status text in the title bar. */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Override the default body padding. */
  bodyClassName?: string;
};

/** A bordered panel with an inverted mono title bar, like a retro OS window. */
export function Window({ title, meta, children, className = "", bodyClassName = "p-4" }: Props) {
  return (
    <section className={`border border-line bg-panel ${className}`}>
      <header className="titlebar flex items-center justify-between gap-3 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="truncate">{title}</span>
        {meta !== undefined && <span className="shrink-0 truncate">{meta}</span>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
