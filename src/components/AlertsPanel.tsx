import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { SimState } from "../types";
import { classify } from "../sim/engine";

interface Alert { level: "critical" | "warn" | "info"; text: string }

export function buildAlerts(s: SimState): Alert[] {
  const out: Alert[] = [];
  if (s.outageHours > 0) out.push({ level: "critical", text: `Power cut: ${s.outageHours}h remaining, running on backup battery.` });
  for (const c of s.chambers) {
    const near = c.itemUids.filter((u) => {
      const it = s.items.find((i) => i.uid === u);
      return it && ["Near Spoilage", "Spoiled"].includes(classify(it, c.env, s.hour).condition);
    }).length;
    if (c.label === "Quarantine" && c.itemUids.length) out.push({ level: "critical", text: `${c.itemUids.length} item(s) quarantined; discard or use them now.` });
    else if (near) out.push({ level: "warn", text: `${c.label}: ${near} item(s) near spoilage.` });
    if (c.env.ethylene > 10) out.push({ level: "warn", text: `${c.label}: ethylene ${c.env.ethylene.toFixed(1)} ppm, venting at ${Math.round(c.vent * 100)}%.` });
    if (c.env.temp > 14) out.push({ level: "info", text: `${c.label}: warm (${c.env.temp.toFixed(1)}°C), cooling toward ${c.target.temp.toFixed(1)}°C.` });
  }
  return out;
}

const STYLE = {
  critical: { icon: ShieldAlert, cls: "border-red-400/40 bg-red-500/10 text-red-200" },
  warn: { icon: AlertTriangle, cls: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
  info: { icon: Info, cls: "border-sky-400/40 bg-sky-500/10 text-sky-200" },
};

/** Live alert feed plus the partition-movement event log. */
export default function AlertsPanel({ state }: { state: SimState }) {
  const alerts = buildAlerts(state).slice(0, 7);
  return (
    <div className="glass p-4">
      <h3 className="mb-3 font-semibold text-white">Live alerts &amp; events</h3>
      <div className="space-y-2">
        {alerts.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} /> All chambers within safe limits.</p>
        )}
        {alerts.map((a, i) => {
          const { icon: Icon, cls } = STYLE[a.level];
          return (
            <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${cls}`}>
              <Icon size={14} className="mt-0.5 shrink-0" /> {a.text}
            </div>
          );
        })}
      </div>
      {state.log.length > 0 && (
        <>
          <p className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-400">Event log</p>
          <ul className="space-y-0.5 text-xs text-slate-300">
            {state.log.slice(0, 5).map((l, i) => <li key={i} className="truncate">• {l}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
