"use client";

import { ArrowRight, CircleDashed, Download, LoaderCircle } from "lucide-react";

/** Page title block at the top of every workspace. */
export function Heading({ title, description, children }: { title: React.ReactNode; description: string; children?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function RunButton({
  busy,
  children,
  onClick,
  disabled,
  hint,
}: {
  busy: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="run-actions">
      <button type="button" className="button primary" disabled={busy || disabled} onClick={onClick}>
        {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />} {busy ? "Judging…" : children}
        {hint && !busy && <span className="kbd">{hint}</span>}
      </button>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <CircleDashed size={29} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Export({ data, name = "results.json" }: { data: unknown; name?: string }) {
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <button type="button" className="button quiet" disabled={!data} onClick={download}>
      <Download size={14} />
      Export
    </button>
  );
}
