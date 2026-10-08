import { DoorOpen, Pause, Play, RotateCcw, Trash2, Zap } from "lucide-react";
import { FOODS } from "../data/foods";
import { SCENARIOS } from "../sim/engine";
import type { ScenarioKind } from "../types";

interface Props {
  running: boolean;
  speed: number;
  scenario: ScenarioKind;
  onToggle: () => void;
  onSpeed: (s: number) => void;
  onScenario: (k: ScenarioKind) => void;
  onReset: () => void;
  onAdd: (profileId: string) => void;
  onDiscard: () => void;
  onLid: () => void;
  onOutage: () => void;
}

export default function FoodPanel(p: Props) {
  return (
    <div className="glass p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={p.onToggle}>
          {p.running ? <Pause size={15} /> : <Play size={15} />} {p.running ? "Pause" : "Run"}
        </button>
        <select className="btn" value={p.speed} onChange={(e) => p.onSpeed(Number(e.target.value))}>
          <option value={1}>4 h / sec</option>
          <option value={3}>12 h / sec</option>
          <option value={6}>24 h / sec</option>
        </select>
        <select className="btn" value={p.scenario} onChange={(e) => p.onScenario(e.target.value as ScenarioKind)}>
          {(Object.keys(SCENARIOS) as ScenarioKind[]).map((k) => <option key={k} value={k}>{SCENARIOS[k].label}</option>)}
        </select>
        <button className="btn" onClick={p.onReset}><RotateCcw size={15} /> Reset</button>
        <span className="mx-1 hidden h-6 w-px bg-white/15 md:block" />
        <button className="btn" onClick={p.onLid}><DoorOpen size={15} /> Open lid</button>
        <button className="btn btn-danger" onClick={p.onOutage}><Zap size={15} /> 6 h power cut</button>
        <button className="btn btn-danger" onClick={p.onDiscard}><Trash2 size={15} /> Discard spoiled</button>
      </div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Add fresh food to both containers</p>
      <div className="flex flex-wrap gap-2">
        {FOODS.map((f) => (
          <button key={f.id} className="btn" onClick={() => p.onAdd(f.id)} title={`${f.name}: ideal ${f.idealTemp}°C / ${f.idealHumidity}% RH`}>
            <span className="text-base">{f.emoji}</span> {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}
