const FLOATERS = [
  ["🍌", "6%", "14%", "0s"], ["🥬", "88%", "22%", "-3s"], ["🍎", "14%", "62%", "-6s"], ["🍓", "80%", "70%", "-9s"],
  ["🥕", "46%", "8%", "-4s"], ["🍅", "62%", "86%", "-2s"], ["🥒", "30%", "88%", "-7s"], ["🧅", "94%", "48%", "-5s"],
];

/** Fixed animated background: aurora blobs, blueprint grid and drifting produce. */
export default function Backdrop() {
  return (
    <div className="aurora" aria-hidden>
      <div className="blob" style={{ width: 520, height: 520, background: "#10b981", top: "-10%", left: "-8%" }} />
      <div className="blob" style={{ width: 600, height: 600, background: "#6366f1", top: "10%", right: "-12%", animationDelay: "-8s" }} />
      <div className="blob" style={{ width: 480, height: 480, background: "#06b6d4", bottom: "-15%", left: "30%", animationDelay: "-15s" }} />
      <div className="grid-overlay" />
      {FLOATERS.map(([e, left, top, delay], i) => (
        <span key={i} className="floaty text-5xl" style={{ left, top, animationDelay: delay }}>{e}</span>
      ))}
    </div>
  );
}
