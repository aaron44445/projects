import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InjectSEO - Med Spa SEO Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            display: "flex",
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,143,0.12) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#FFFFFF",
            display: "flex",
            letterSpacing: "-2px",
          }}
        >
          Inject
          <span style={{ color: "#00FF8F" }}>SEO</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#999999",
            marginTop: 16,
            display: "flex",
          }}
        >
          Precision SEO for Aesthetic Practices
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 60,
            height: 3,
            background: "#00FF8F",
            marginTop: 24,
            borderRadius: 2,
            display: "flex",
          }}
        />

        {/* URL */}
        <div
          style={{
            fontSize: 16,
            color: "#555555",
            marginTop: 24,
            letterSpacing: "2px",
            display: "flex",
          }}
        >
          INJECTSEO.COM
        </div>
      </div>
    ),
    { ...size }
  );
}
