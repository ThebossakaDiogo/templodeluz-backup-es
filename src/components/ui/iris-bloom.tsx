// GradientBackground — Iris Bloom.
// Source recipe: https://21st.dev/community/gradients/editor?from=fda7e784-fbc9-4173-aeb8-6509975a3e7e
export function GradientBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className} style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%", containerType: "size" }}>
      <div
        style={{
          position: "absolute",
          inset: "-0.8cqmin",
          filter: "blur(0.4cqmin)",
          backgroundColor: "#4C6CB3",
          backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.090'/></svg>\"), linear-gradient(160deg, #4C6CB3 0%, #B28FCE 50%, #F4B3C2 100%)",
          backgroundSize: "120px 120px, auto",
          backgroundBlendMode: "overlay, normal",
        }}
      />
      <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain-fda7e784"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain-fda7e784)" />
      </svg>
    </div>
  );
}
