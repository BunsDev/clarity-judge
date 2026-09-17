import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/BrandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the mark on its own, filling the tile. */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#ad267e" }}>
      <BrandMark size={180} />
    </div>,
    size,
  );
}
