import { ArrowRight, Camera, Cpu, Move, Sigma, Wind } from "lucide-react";
import type { SimState } from "../types";
import { CONTAINER_CM, conditionCounts } from "../sim/engine";

/** The five stages of the closed control loop with live numbers from the adaptive container. */
export default function ControlLoop({ state }: { state: SimState }) {
  const n = state.chambers.length;
  const cc = conditionCounts(state);
  const avg = (f: (c: SimState["chambers"][number]) => number) => (n ? state.chambers.reduce((a, c) => a + f(c), 0) / n : 0);
  const stages = [
    { icon: Camera, title: "1 · Sense", main: `${n * 4} sensors`, sub: "gas · humidity · temp · camera per chamber" },
    { icon: Sigma, title: "2 · Classify", main: `${cc.Fresh} fresh / ${cc["Near Spoilage"] + cc.Spoiled} at risk`, sub: "multi-sensor fusion per food item" },
    { icon: Cpu, title: "3 · Plan", main: `${n} chambers`, sub: `${state.reconfigurations} reconfigurations so far` },
    { icon: Move, title: "4 · Move", main: `${(state.partitionTravel * CONTAINER_CM).toFixed(0)} cm`, sub: "total partition travel on guide rail" },
    { icon: Wind, title: "5 · Airflow", main: `fan ${Math.round(avg((c) => c.fan) * 100)}% · vent ${Math.round(avg((c) => c.vent) * 100)}%`, sub: `avg ethylene ${avg((c) => c.env.ethylene).toFixed(1)} ppm` },
  ];
  return (
    <div className="glass p-4">
      <h3 className="mb-3 font-semibold text-white">Closed control loop (runs every simulated hour)</h3>
      <div className="grid gap-2 md:grid-cols-5">
        {stages.map((s, i) => (
          <div key={s.title} className="relative rounded-xl border border-white/10 bg-white/5 p-3">
            <s.icon size={18} className="mb-1 text-cyan-300" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.title}</p>
            <p className="text-sm font-semibold text-white">{s.main}</p>
            <p className="text-[11px] text-slate-400">{s.sub}</p>
            {i < stages.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-emerald-300 md:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}
