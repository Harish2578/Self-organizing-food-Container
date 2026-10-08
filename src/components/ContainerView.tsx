import type { Condition, SimState } from "../types";
import { classify, getProfile } from "../sim/engine";

const RING: Record<Condition, string> = {
  Fresh: "ring-emerald-400 bg-emerald-400/15",
  Aging: "ring-amber-400 bg-amber-400/15",
  "Near Spoilage": "ring-orange-500 bg-orange-500/25 animate-pulse",
  Spoiled: "ring-red-500 bg-red-500/25 grayscale",
};

interface Props { state: SimState; title: string; subtitle: string; accent: "emerald" | "slate" }

/** Top-down view of the container. Partitions glide along the guide rail via CSS transitions. */
export default function ContainerView({ state, title, subtitle, accent }: Props) {
  const glow = accent === "emerald" ? "border-emerald-400/60 shadow-[0_0_32px_rgba(52,211,153,.25)]" : "border-slate-500/60";
  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>

      <div className={`relative h-64 overflow-hidden rounded-xl border-2 bg-slate-950/60 ${glow}`}>
        <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400" title="Guide rail" />
        {state.outageHours > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-amber-500/90 px-2 py-0.5 text-center text-[11px] font-semibold text-black">
            ⚡ POWER CUT {state.mode === "adaptive" ? "· backup battery keeps fans & vents on" : "· no airflow"}
          </div>
        )}
        {state.chambers.map((c, idx) => {
          const items = c.itemUids
            .map((u) => state.items.find((i) => i.uid === u))
            .filter((i): i is NonNullable<typeof i> => Boolean(i));
          return (
            <div
              key={c.id}
              className="absolute inset-y-0 p-2 pt-4 transition-all duration-700 ease-in-out"
              style={{ left: `${c.start * 100}%`, width: `${(c.end - c.start) * 100}%` }}
            >
              {idx > 0 && (
                <div className="absolute inset-y-0 left-0 w-1.5 bg-cyan-300/70 shadow-[0_0_12px_rgba(34,211,238,.8)]">
                  <div className="absolute -left-1 top-0 z-20 h-3 w-3.5 rounded-sm bg-amber-400" title="Partition drive motor" />
                </div>
              )}
              <p className={`truncate pl-1 text-[10px] font-bold uppercase tracking-wide ${c.label === "Quarantine" ? "text-red-300" : "text-cyan-200"}`}>{c.label}</p>
              <p className="truncate pl-1 text-[10px] text-slate-400">
                {c.env.temp.toFixed(1)}°C · {c.env.humidity.toFixed(0)}% · C₂H₄ {c.env.ethylene.toFixed(1)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 pl-1">
                {items.map((it) => {
                  const cls = classify(it, c.env, state.hour);
                  return (
                    <span
                      key={it.uid}
                      title={`${getProfile(it.profileId).name}: ${cls.fused.toFixed(0)}% (${cls.condition})`}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ring-2 ${RING[cls.condition]}`}
                    >
                      {getProfile(it.profileId).emoji}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {state.log.length > 0 && <p className="mt-2 truncate text-xs text-slate-400">{state.log[0]}</p>}
    </div>
  );
}
