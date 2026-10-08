import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimState } from "../types";
import { conditionCounts, retainedValue, wastedKg } from "../sim/engine";
import { TOOLTIP_STYLE } from "./FreshnessChart";

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="glow-text text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

/** Food, money, CO2e and energy comparison between the two containers (illustrative factors). */
export default function ImpactPanel({ adaptive, baseline }: { adaptive: SimState; baseline: SimState }) {
  const kgSaved = wastedKg(baseline) - wastedKg(adaptive);
  const moneySaved = retainedValue(adaptive) - retainedValue(baseline);
  const co2 = kgSaved * 2.5;
  const kwhA = adaptive.energyWh / 1000, kwhB = baseline.energyWh / 1000;
  const ca = conditionCounts(adaptive), cb = conditionCounts(baseline);
  const data = (["Fresh", "Aging", "Near Spoilage", "Spoiled"] as const).map((k) => ({ name: k, "Self-organizing": ca[k], "Conventional fridge": cb[k] }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Food waste avoided" value={`${kgSaved.toFixed(2)} kg`} sub="~250 g per item" />
        <Stat label="Value preserved" value={`$${moneySaved.toFixed(2)}`} sub="retail value still fresh" />
        <Stat label="CO₂e avoided" value={`${co2.toFixed(2)} kg`} sub="~2.5 kg CO₂e per kg wasted" />
        <Stat label="Energy used" value={`${kwhA.toFixed(2)} kWh`} sub={`fridge ${kwhB.toFixed(2)} kWh`} />
      </div>
      <div className="glass p-4">
        <h3 className="mb-2 font-semibold text-white">Food condition breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,.2)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,.2)" />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,.05)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Self-organizing" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Conventional fridge" fill="#94a3b8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Energy covers fans, vents, a holding load, cooling and partition motors. All prices, weights and emission factors are illustrative assumptions.
      </p>
    </div>
  );
}
