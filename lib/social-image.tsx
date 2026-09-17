import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BrandMark } from "@/components/BrandMark";
import { SOCIAL_PAGES, type SocialPage } from "./social";

/**
 * Generated social preview images. The card mirrors the app: a light
 * workspace, the mark, and a mock of the verdict list, so a shared link looks
 * like the thing it opens.
 */

const fonts = () => ({
  body: readFileSync(join(process.cwd(), "public/brand/body.ttf")),
  heading: readFileSync(join(process.cwd(), "public/brand/heading.ttf")),
});

const INK = "#26252c";
const MUTED = "#73717e";
const LINE = "#e5e4e9";
const ACCENT = "#ad267e";
const ACCENT_SOFT = "#f7e8f1";
const SUCCESS = "#257766";
const ERROR = "#b94145";

function badgeColor(label: string) {
  if (label === "Issue") return ERROR;
  if (label === "Pass") return SUCCESS;
  return ACCENT;
}

export function socialImage(key: SocialPage) {
  const p = SOCIAL_PAGES[key];
  const { body, heading } = fonts();
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f5f5f7",
        color: INK,
        fontFamily: "BrandSans",
        padding: "44px 52px",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top row: brand + category */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BrandMark size={48} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>Clarity Judge</div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: MUTED }}>JUDGED BY TYPESAFE JEV</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 13,
            letterSpacing: 1.5,
            color: MUTED,
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 7,
            padding: "10px 14px",
          }}
        >
          {p.category}
        </div>
      </div>

      {/* Middle: title + mock verdict panel */}
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -3.5 }}>{p.title}</div>
          <div style={{ fontSize: 24, color: MUTED, lineHeight: 1.4, marginTop: 22, maxWidth: 620 }}>{p.description}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: `1px solid ${LINE}`,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            <div>{p.panel}</div>
            <div style={{ display: "flex", fontSize: 12, color: ACCENT, background: ACCENT_SOFT, borderRadius: 6, padding: "5px 9px" }}>{p.result}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: 16, gap: 10 }}>
            {p.rows.map(([name, badge, value], i) => (
              <div
                key={`${name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  border: `1px solid ${LINE}`,
                  borderLeft: `3px solid ${badgeColor(badge)}`,
                  borderRadius: 9,
                  fontSize: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 12,
                    fontWeight: 700,
                    color: badgeColor(badge),
                    border: `1px solid ${LINE}`,
                    borderRadius: 6,
                    padding: "5px 8px",
                    minWidth: 52,
                    justifyContent: "center",
                  }}
                >
                  {badge}
                </div>
                <div style={{ display: "flex", flex: 1 }}>{name}</div>
                <div style={{ display: "flex", color: value.includes("%") ? INK : MUTED, fontSize: value.includes("%") ? 16 : 13, fontWeight: 700 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${LINE}`, paddingTop: 18, fontSize: 15, color: MUTED }}>
        <div>Small model. Clear choices. Nothing rewritten.</div>
        <div>{p.path === "/" ? "clarity-judge.vercel.app" : `clarity-judge.vercel.app${p.path}`}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "BrandSans", data: new Uint8Array(body).buffer as ArrayBuffer, weight: 400, style: "normal" },
        { name: "BrandSans", data: new Uint8Array(heading).buffer as ArrayBuffer, weight: 700, style: "normal" },
      ],
    },
  );
}
