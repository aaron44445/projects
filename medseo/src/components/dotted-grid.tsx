export function DottedGrid({ opacity = 0.1 }: { opacity?: number }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 dotted-grid-bg"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}
