import { useEffect, useState } from "react";
import { Activity, Boxes, Brain, Leaf, ScanSearch } from "lucide-react";
import AiPanel from "./components/AiPanel";
import AlertsPanel from "./components/AlertsPanel";
import Backdrop from "./components/Backdrop";
import ChamberCards from "./components/ChamberCards";
import ContainerView from "./components/ContainerView";
import ControlLoop from "./components/ControlLoop";
import FoodPanel from "./components/FoodPanel";
import FreshnessChart from "./components/FreshnessChart";
import ImpactPanel from "./components/ImpactPanel";
import SensorInspector from "./components/SensorInspector";
import {
  CONTAINER_CM, addItem, avgFreshness, createState, discardSpoiled, makeScenario, newItem, openLid, spoiledCount, startOutage, step,
} from "./sim/engine";
import type { HistoryPoint, ScenarioKind, SimState } from "./types";

interface Sim { adaptive: SimState; baseline: SimState; history: HistoryPoint[] }

function init(kind: ScenarioKind): Sim {
  const items = makeScenario(kind);
  return { adaptive: createState(items, "adaptive"), baseline: createState(items, "static"), history: [{ hour: 0, adaptive: 100, baseline: 100 }] };
}

function advance(prev: Sim, steps: number): Sim {
  let a = prev.adaptive, b = prev.baseline;
  for (let i = 0; i < steps; i++) { a = step(a); b = step(b); }
  return { adaptive: a, baseline: b, history: [...prev.history.slice(-399), { hour: a.hour, adaptive: avgFreshness(a), baseline: avgFreshness(b) }] };
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="glow-text text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "sensors", label: "Sensor Fusion", icon: ScanSearch },
  { id: "impact", label: "Impact & Energy", icon: Leaf },
  { id: "control", label: "Control & AI", icon: Brain },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function App() {
  const [scenario, setScenario] = useState<ScenarioKind>("home");
  const [sim, setSim] = useState<Sim>(() => init("home"));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSim((p) => advance(p, speed)), 250);
    return () => clearInterval(id);
  }, [running, speed]);

  const both = (fn: (s: SimState) => SimState) => setSim((p) => ({ ...p, adaptive: fn(p.adaptive), baseline: fn(p.baseline) }));
  const add = (profileId: string) => { const item = newItem(profileId); both((s) => addItem(s, item)); };
  const changeScenario = (k: ScenarioKind) => { setScenario(k); setSim(init(k)); };

  const { adaptive, baseline } = sim;

  return (
    <>
      <Backdrop />
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-2.5 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,.5)]"><Boxes size={24} /></div>
          <div>
            <h1 className="glow-text text-2xl font-extrabold">Self-Organizing Food Storage Container</h1>
            <p className="text-sm text-slate-400">Digital twin: sensors → classification → movable partitions → per-chamber airflow</p>
          </div>
        </header>

        <nav className="glass flex flex-wrap gap-1 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-gradient-to-r from-emerald-400/90 to-cyan-400/90 text-slate-950" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi label="Simulated time" value={`Day ${(adaptive.hour / 24).toFixed(1)}`} />
          <Kpi label="Avg freshness" value={`${avgFreshness(adaptive).toFixed(0)}%`} sub={`fridge ${avgFreshness(baseline).toFixed(0)}%`} />
          <Kpi label="Spoiled items" value={`${spoiledCount(adaptive)}`} sub={`fridge ${spoiledCount(baseline)}`} />
          <Kpi label="Reconfigurations" value={`${adaptive.reconfigurations}`} />
          <Kpi label="Partition travel" value={`${(adaptive.partitionTravel * CONTAINER_CM).toFixed(0)} cm`} />
        </section>

        <FoodPanel
          running={running} speed={speed} scenario={scenario}
          onToggle={() => setRunning((r) => !r)} onSpeed={setSpeed} onScenario={changeScenario}
          onReset={() => setSim(init(scenario))} onAdd={add}
          onDiscard={() => both(discardSpoiled)} onLid={() => both(openLid)} onOutage={() => both((s) => startOutage(s, 6))}
        />

        {tab === "overview" && (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <ContainerView state={adaptive} accent="emerald" title="Self-organizing container" subtitle="partitions & airflow adapt to food condition" />
              <ContainerView state={baseline} accent="slate" title="Conventional single compartment" subtitle="one fixed setpoint, minimal gas exchange" />
            </section>
            <section>
              <h3 className="mb-2 font-semibold text-white">Live micro-environments</h3>
              <ChamberCards state={adaptive} />
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <FreshnessChart data={sim.history} />
              <AlertsPanel state={adaptive} />
            </section>
          </>
        )}

        {tab === "sensors" && <SensorInspector state={adaptive} />}
        {tab === "impact" && <ImpactPanel adaptive={adaptive} baseline={baseline} />}
        {tab === "control" && (
          <>
            <ControlLoop state={adaptive} />
            <section className="grid gap-4 lg:grid-cols-2">
              <AiPanel adaptive={adaptive} baseline={baseline} />
              <AlertsPanel state={adaptive} />
            </section>
          </>
        )}

        <footer className="pb-6 text-center text-xs text-slate-500">
          Illustrative model: spoilage rates, gas dynamics, prices and emission factors are simplified for demonstration, not food-safety guidance.
        </footer>
      </div>
    </>
  );
}
