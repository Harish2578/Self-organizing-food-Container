import type { SimState } from "../types";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-10 text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 rounded bg-white/10">
        <div className="h-1.5 rounded bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="w-8 text-right tabular-nums text-slate-300">{Math.round(value * 100)}%</span>
    </div>
  );
}

/** Per-chamber sensor readings, setpoints and actuator output (fan / vent / valve). */
export default function ChamberCards({ state }: { state: SimState }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {state.chambers.map((c) => (
        <div key={c.id} className="glass p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className={`text-sm font-semibold ${c.label === "Quarantine" ? "text-red-300" : "text-white"}`}>{c.label}</h4>
            <span className="text-xs text-slate-400">{c.itemUids.length} items</span>
          </div>
          <dl className="mb-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
            <dt className="text-slate-400">Temp</dt><dd className="text-right tabular-nums">{c.env.temp.toFixed(1)} → {c.target.temp.toFixed(1)} °C</dd>
            <dt className="text-slate-400">Humidity</dt><dd className="text-right tabular-nums">{c.env.humidity.toFixed(0)} → {c.target.humidity.toFixed(0)} %</dd>
            <dt className="text-slate-400">Ethylene</dt><dd className="text-right tabular-nums">{c.env.ethylene.toFixed(1)} ppm</dd>
            <dt className="text-slate-400">CO₂</dt><dd className="text-right tabular-nums">{c.env.co2.toFixed(0)} ppm</dd>
          </dl>
          <div className="space-y-1">
            <Bar label="Fan" value={c.fan} />
            <Bar label="Vent" value={c.vent} />
            <Bar label="Valve" value={c.valve} />
          </div>
        </div>
      ))}
    </div>
  );
}
