// Sketch de bolsa para o login (linhas douradas sobre o vinho).
export default function BagSketch() {
  return (
    <svg viewBox="0 0 220 200" fill="none" stroke="#c9a24b" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%" }}>
      <path d="M55 80 h110 l10 95 H45 z" opacity="0.95" />
      <path d="M80 80 v-14 a30 30 0 0 1 60 0 v14" />
      <path d="M55 100 h110" opacity="0.5" />
      <circle cx="110" cy="120" r="7" />
      <path d="M110 127 v10" />
    </svg>
  );
}
