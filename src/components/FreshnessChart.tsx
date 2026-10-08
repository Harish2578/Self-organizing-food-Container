import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryPoint } from "../types";

export const TOOLTIP_STYLE = { background: "#0b1325", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 };

export default function FreshnessChart({ data }: { data: HistoryPoint[] }) {
  const pts = data.map((d) => ({ ...d, day: +(d.hour / 24).toFixed(1) }));
  return (
    <div className="glass p-4">
      <h3 className="mb-2 font-semibold text-white">Average freshness over time</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pts} margin={{ top: 5, right: 12, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,.2)" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,.2)" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v.toFixed(1)}%`} labelFormatter={(d) => `Day ${d}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="adaptive" name="Self-organizing" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="baseline" name="Conventional fridge" stroke="#94a3b8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
