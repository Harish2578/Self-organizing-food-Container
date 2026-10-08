import type { Condition, SimState } from "../types";
import { classify, getProfile } from "../sim/engine";

const BADGE: Record<Condition, string> = {
  Fresh: "bg-emerald-400/20 text-emerald-300",
  Aging: "bg-amber-400/20 text-amber-300",
  "Near Spoilage": "bg-orange-500/25 text-orange-300",
  Spoiled: "bg-red-500/25 text-red-300",
};

function Mini({ v, color }: { v: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 rounded bg-white/10"><div className={`h-1.5 rounded ${color}`} style={{ width: `${v}%` }} /></div>
      <span className="w-7 text-right text-[11px] tabular-nums text-slate-300">{v.toFixed(0)}</span>
    </div>
  );
}

/** Shows how the camera, gas and temperature/humidity readings are fused into one estimate per food item. */
export default function SensorInspector({ state }: { state: SimState }) {
  const rows = state.chambers.flatMap((c) =>
    c.itemUids.map((u) => {
      const it = state.items.find((i) => i.uid === u)!;
      return { it, c, cls: classify(it, c.env, state.hour) };
    })
  ).sort((a, b) => a.cls.fused - b.cls.fused);

  return (
    <div className="space-y-4">
      <div className="glass p-4 text-sm text-slate-300">
        <h3 className="mb-1 font-semibold text-white">Multi-sensor fusion</h3>
        <p>
          The controller never sees the true freshness. It estimates it as{" "}
          <span className="font-mono text-cyan-300">0.55 × camera + 0.35 × gas + 0.10 × temp/humidity fit</span>.
          Items are listed from most to least at risk.
        </p>
      </div>
      <div className="glass overflow-x-auto p-2">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="p-2">Food</th><th className="p-2">Chamber</th><th className="p-2">Camera</th>
              <th className="p-2">Gas</th><th className="p-2">Temp/RH</th><th className="p-2">Fused</th>
              <th className="p-2">True</th><th className="p-2">Condition</th><th className="p-2">Age</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ it, c, cls }) => (
              <tr key={it.uid} className="border-t border-white/10">
                <td className="p-2">{getProfile(it.profileId).emoji} {getProfile(it.profileId).name}</td>
                <td className="p-2 text-xs text-slate-400">{c.label}</td>
                <td className="p-2"><Mini v={cls.visual} color="bg-sky-400" /></td>
                <td className="p-2"><Mini v={cls.gas} color="bg-fuchsia-400" /></td>
                <td className="p-2"><Mini v={cls.env} color="bg-amber-400" /></td>
                <td className="p-2 font-semibold tabular-nums text-white">{cls.fused.toFixed(0)}</td>
                <td className="p-2 tabular-nums text-slate-400">{it.freshness.toFixed(0)}</td>
                <td className="p-2"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${BADGE[cls.condition]}`}>{cls.condition}</span></td>
                <td className="p-2 text-xs tabular-nums text-slate-400">{(it.ageHours / 24).toFixed(1)} d</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-slate-400" colSpan={9}>No food in the container.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
